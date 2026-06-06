/**
 * @file PUT /api/password — change admin password (requires auth).
 * The active password is stored in KV key `admin:password`.
 * Falls back to `env.ADMIN_PASSWORD` when KV has no override.
 */

import { extractBearer, getAdminPassword, verifyToken } from '../_lib/auth.js'

function json(body, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json; charset=utf-8' },
  })
}

export async function onRequestOptions() {
  return new Response(null, { headers: { Allow: 'PUT, OPTIONS' } })
}

/** @param {{ request: Request, env: object }} ctx */
export async function onRequestPut({ request, env }) {
  try {
    const currentPassword = await getAdminPassword(env)
    if (!currentPassword) {
      return json({ success: false, error: '服务端未配置管理员密码' }, 500)
    }

    const token = extractBearer(request)
    if (!(await verifyToken(token, currentPassword))) {
      return json({ success: false, error: '认证失败或登录已过期' }, 401)
    }

    let body
    try {
      body = await request.json()
    } catch {
      return json({ success: false, error: '请求体不是合法 JSON' }, 400)
    }

    const { oldPassword, newPassword } = body || {}
    if (!oldPassword || !newPassword) {
      return json({ success: false, error: '请提供旧密码和新密码' }, 400)
    }
    if (oldPassword !== currentPassword) {
      return json({ success: false, error: '旧密码不正确' }, 403)
    }
    if (newPassword.length < 6) {
      return json({ success: false, error: '新密码至少 6 位' }, 400)
    }

    if (!env.NAV_KV) {
      return json({ success: false, error: 'KV 未绑定,无法保存密码' }, 500)
    }

    await env.NAV_KV.put('admin:password', newPassword)
    return json({ success: true, data: { message: '密码已更新,下次登录生效' } })
  } catch (error) {
    return json({ success: false, error: error.message || '服务异常' }, 500)
  }
}
