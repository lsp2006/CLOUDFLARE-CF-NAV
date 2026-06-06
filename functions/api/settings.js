/**
 * @file GET /api/settings — public visual settings (edge-cached).
 * @file PUT /api/settings — admin-only, updates visual config.
 */

import { extractBearer, getAdminPassword, verifyToken } from '../_lib/auth.js'

const KV_KEY = 'nav:settings'

const baseHeaders = {
  'Content-Type': 'application/json; charset=utf-8',
  'Access-Control-Allow-Methods': 'GET, PUT, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
}

function json(body, status = 200, extra = {}) {
  return new Response(JSON.stringify(body), { status, headers: { ...baseHeaders, ...extra } })
}

export async function onRequestOptions() {
  return new Response(null, { headers: { Allow: 'GET, PUT, OPTIONS' } })
}

/** @param {{ request: Request, env: { NAV_KV: KVNamespace } }} ctx */
export async function onRequestGet({ env }) {
  const raw = await env.NAV_KV.get(KV_KEY)
  if (!raw) return json({ success: true, data: null })
  return new Response(raw, {
    status: 200,
    headers: {
      ...baseHeaders,
      'Cache-Control': 'public, max-age=0, s-maxage=300, stale-while-revalidate=86400',
    },
  })
}

/** @param {{ request: Request, env: { NAV_KV: KVNamespace, ADMIN_PASSWORD?: string } }} ctx */
export async function onRequestPut({ request, env }) {
  const adminPassword = await getAdminPassword(env)
  if (!adminPassword) return json({ success: false, error: 'ADMIN_PASSWORD 未配置' }, 500)
  const token = extractBearer(request)
  if (!(await verifyToken(token, adminPassword))) {
    return json({ success: false, error: '认证失败或登录已过期' }, 401)
  }
  let payload
  try { payload = await request.json() } catch {
    return json({ success: false, error: '不是合法 JSON' }, 400)
  }
  if (!payload || typeof payload !== 'object') {
    return json({ success: false, error: '需要 JSON 对象' }, 400)
  }
  await env.NAV_KV.put(KV_KEY, JSON.stringify(payload))

  // Purge edge cache for GET /api/settings so admin updates are visible immediately.
  try {
    const url = new URL(request.url)
    await caches.default.delete(new Request(url.toString(), { method: 'GET' }))
  } catch {
    /* cache purge is best-effort */
  }

  return json({ success: true, data: { savedAt: Date.now() } })
}
