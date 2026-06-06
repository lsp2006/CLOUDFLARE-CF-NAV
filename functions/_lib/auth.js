/**
 * @file Shared auth helpers for CF Pages Functions.
 * Token format: `${hash}.${iat}` where iat is a base36 ms timestamp and
 * hash = SHA-256(password + ':' + iat + ':mao-nav-auth').
 * Tokens older than TOKEN_TTL_MS are rejected.
 */

const TOKEN_TTL_MS = 7 * 24 * 60 * 60 * 1000

/** @param {string} input */
async function sha256Hex(input) {
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(input))
  return Array.from(new Uint8Array(buf))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('')
}

/**
 * @param {string} password
 * @param {number} iat
 * @returns {Promise<string>}
 */
async function signHash(password, iat) {
  return sha256Hex(`${password}:${iat}:mao-nav-auth`)
}

/**
 * @param {string} password
 * @returns {Promise<string>} token
 */
export async function issueToken(password) {
  const iat = Date.now()
  const hash = await signHash(password, iat)
  return `${hash}.${iat.toString(36)}`
}

/**
 * @param {string|null|undefined} token
 * @param {string|undefined} password
 * @returns {Promise<boolean>}
 */
export async function verifyToken(token, password) {
  if (!token || !password) return false
  const dot = token.lastIndexOf('.')
  if (dot < 0) return false
  const hash = token.slice(0, dot)
  const iat = parseInt(token.slice(dot + 1), 36)
  if (!Number.isFinite(iat) || Date.now() - iat > TOKEN_TTL_MS) return false
  const expected = await signHash(password, iat)
  return timingSafeEqual(hash, expected)
}

/** @param {string} a @param {string} b */
function timingSafeEqual(a, b) {
  if (a.length !== b.length) return false
  let mismatch = 0
  for (let i = 0; i < a.length; i++) mismatch |= a.charCodeAt(i) ^ b.charCodeAt(i)
  return mismatch === 0
}

/**
 * Extract bearer token from Authorization header.
 * @param {Request} request
 * @returns {string}
 */
export function extractBearer(request) {
  const header = request.headers.get('Authorization') || ''
  return header.startsWith('Bearer ') ? header.slice(7).trim() : ''
}

const PW_KV_KEY = 'admin:password'

/**
 * Resolve the active admin password — KV first, then env fallback.
 * When an admin changes their password via the UI it's written to KV.
 * @param {{ ADMIN_PASSWORD?: string, NAV_KV?: KVNamespace }} env
 * @returns {Promise<string>}
 */
export async function getAdminPassword(env) {
  if (env.NAV_KV) {
    try {
      const stored = await env.NAV_KV.get(PW_KV_KEY)
      if (stored) return stored
    } catch { /* KV not available, fall through */ }
  }
  return env.ADMIN_PASSWORD || ''
}
