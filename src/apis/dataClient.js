/**
 * @file Unified client for the navigation data API.
 * Replaces the legacy GitHub-API-based src/apis/useGitHubAPI.js.
 *
 * @typedef {Object} Site
 * @property {string} id
 * @property {string} name
 * @property {string} url
 * @property {string} [description]
 * @property {string} [icon]
 *
 * @typedef {Object} Category
 * @property {string} id
 * @property {string} name
 * @property {string} icon
 * @property {number} order
 * @property {Site[]} sites
 *
 * @typedef {Object} NavBlob
 * @property {string} title
 * @property {string} search
 * @property {Category[]} categories
 */

const AUTH_TOKEN_KEY = 'admin_token'

export function getAuthToken() {
  return localStorage.getItem(AUTH_TOKEN_KEY) || ''
}

/** @param {string} token */
export function setAuthToken(token) {
  localStorage.setItem(AUTH_TOKEN_KEY, token)
}

export function clearAuthToken() {
  localStorage.removeItem(AUTH_TOKEN_KEY)
}

/**
 * @template T
 * @param {Response} response
 * @returns {Promise<T>}
 */
async function unwrap(response) {
  let body = null
  try {
    body = await response.json()
  } catch {
    /* non-JSON response */
  }
  if (!response.ok || (body && body.success === false)) {
    const error = new Error(body?.error || `HTTP ${response.status}`)
    error.status = response.status
    throw error
  }
  return body
}

/**
 * Fetch the full navigation blob.
 * @returns {Promise<NavBlob>}
 */
export async function fetchData() {
  const response = await fetch('/api/data', {
    method: 'GET',
    headers: { Accept: 'application/json' },
  })
  return unwrap(response)
}

/**
 * Persist the full navigation blob. Requires auth.
 * @param {NavBlob} blob
 * @returns {Promise<{ success: true, data: { bytes: number, savedAt: number } }>}
 */
export async function saveData(blob) {
  const response = await fetch('/api/data', {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${getAuthToken()}`,
    },
    body: JSON.stringify(blob),
  })
  return unwrap(response)
}

/**
 * Exchange password for an auth token.
 * @param {string} password
 * @returns {Promise<{ success: true, token: string }>}
 */
export async function login(password) {
  const response = await fetch('/api/verify', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ password }),
  })
  return unwrap(response)
}

/**
 * Change admin password. Requires current auth.
 * @param {string} oldPassword
 * @param {string} newPassword
 * @returns {Promise<{ success: true, data: { message: string } }>}
 */
export async function changePassword(oldPassword, newPassword) {
  const response = await fetch('/api/password', {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${getAuthToken()}`,
    },
    body: JSON.stringify({ oldPassword, newPassword }),
  })
  return unwrap(response)
}

/**
 * Fetch visual settings blob (logo, footer, skin, wallpaper).
 * @returns {Promise<{ success: true, data: object|null }>}
 */
export async function fetchSettings() {
  const response = await fetch('/api/settings', { method: 'GET' })
  return unwrap(response)
}

/**
 * Persist visual settings. Requires auth.
 * @param {object} blob
 */
export async function saveSettings(blob) {
  const response = await fetch('/api/settings', {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${getAuthToken()}`,
    },
    body: JSON.stringify(blob),
  })
  return unwrap(response)
}
