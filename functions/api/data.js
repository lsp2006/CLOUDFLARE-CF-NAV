/**
 * @file GET /api/data — public, edge-cached navigation data.
 * @file PUT /api/data — admin-only, replaces the entire blob and purges edge cache.
 *
 * Storage: single KV key `nav:data` holding the full
 * `{ title, search, categories: [...] }` JSON tree.
 */

import { extractBearer, getAdminPassword, verifyToken } from '../_lib/auth.js'

const KV_KEY = 'nav:data'

const baseHeaders = {
  'Content-Type': 'application/json; charset=utf-8',
  'Access-Control-Allow-Methods': 'GET, PUT, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
}

/**
 * @param {object} body
 * @param {number} status
 * @param {Record<string,string>} [extra]
 */
function json(body, status = 200, extra = {}) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...baseHeaders, ...extra },
  })
}

/** @param {Request} request */
function sameOriginHeaders(request) {
  const origin = request.headers.get('Origin')
  const url = new URL(request.url)
  if (origin && new URL(origin).host === url.host) {
    return { 'Access-Control-Allow-Origin': origin }
  }
  return {}
}

export async function onRequestOptions({ request }) {
  return new Response(null, {
    headers: { ...baseHeaders, ...sameOriginHeaders(request) },
  })
}

/** @param {{ request: Request, env: { NAV_KV: KVNamespace } }} ctx */
export async function onRequestGet({ request, env }) {
  const raw = await env.NAV_KV.get(KV_KEY)
  if (!raw) {
    return json(
      { success: false, error: 'KV 中尚无数据,请运行 npm run kv:seed 进行种子化' },
      404,
      {
        'Cache-Control': 'no-store',
        ...sameOriginHeaders(request),
      },
    )
  }
  return new Response(raw, {
    status: 200,
    headers: {
      ...baseHeaders,
      'Cache-Control': 'public, max-age=0, s-maxage=60, stale-while-revalidate=86400',
      ...sameOriginHeaders(request),
    },
  })
}

/** @param {{ request: Request, env: { NAV_KV: KVNamespace, ADMIN_PASSWORD?: string } }} ctx */
export async function onRequestPut({ request, env }) {
  const adminPassword = await getAdminPassword(env)
  if (!adminPassword) {
    return json(
      { success: false, error: '服务端未配置 ADMIN_PASSWORD' },
      500,
      sameOriginHeaders(request),
    )
  }
  const token = extractBearer(request)
  if (!(await verifyToken(token, adminPassword))) {
    return json(
      { success: false, error: '认证失败或登录已过期,请重新登录' },
      401,
      sameOriginHeaders(request),
    )
  }

  let payload
  try {
    payload = await request.json()
  } catch {
    return json(
      { success: false, error: '请求体不是合法 JSON' },
      400,
      sameOriginHeaders(request),
    )
  }

  if (
    !payload ||
    typeof payload !== 'object' ||
    !Array.isArray(payload.categories) ||
    typeof payload.title !== 'string'
  ) {
    return json(
      { success: false, error: '数据格式错误:需要 { title, search, categories: [] }' },
      400,
      sameOriginHeaders(request),
    )
  }

  const normalized = {
    title: payload.title,
    search: payload.search || 'bing',
    categories: payload.categories,
  }
  const serialized = JSON.stringify(normalized)
  await env.NAV_KV.put(KV_KEY, serialized)

  // Purge the edge cache for GET /api/data so admin saves are visible immediately.
  try {
    const url = new URL(request.url)
    await caches.default.delete(new Request(url.toString(), { method: 'GET' }))
  } catch {
    /* cache purge is best-effort */
  }

  return json(
    { success: true, data: { bytes: serialized.length, savedAt: Date.now() } },
    200,
    sameOriginHeaders(request),
  )
}
