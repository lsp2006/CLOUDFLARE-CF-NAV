/**
 * @file POST /api/verify — exchange admin password for a 7-day token.
 * Token format and verification live in functions/_lib/auth.js.
 */

import { getAdminPassword, issueToken } from '../_lib/auth.js'

const corsHeaders = {
  'Content-Type': 'application/json; charset=utf-8',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
}

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
    headers: { ...corsHeaders, ...sameOriginHeaders(request) },
  })
}

/** @param {{ request: Request, env: { ADMIN_PASSWORD?: string } }} ctx */
export async function onRequestPost({ request, env }) {
  const headers = { ...corsHeaders, ...sameOriginHeaders(request) }
  try {
    const { password } = await request.json()
    const adminPassword = await getAdminPassword(env)

    if (!adminPassword) {
      return new Response(
        JSON.stringify({ success: false, error: '服务端未配置 ADMIN_PASSWORD' }),
        { status: 500, headers },
      )
    }

    if (!password || password !== adminPassword) {
      return new Response(
        JSON.stringify({ success: false, error: '密钥错误,请重新输入' }),
        { status: 401, headers },
      )
    }

    const token = await issueToken(adminPassword)
    return new Response(JSON.stringify({ success: true, token }), {
      status: 200,
      headers,
    })
  } catch (error) {
    return new Response(
      JSON.stringify({ success: false, error: error.message || '验证服务异常' }),
      { status: 500, headers },
    )
  }
}
