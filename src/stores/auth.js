/**
 * @file Pinia store for admin auth state.
 */

import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import {
  clearAuthToken,
  getAuthToken,
  login as loginRequest,
  setAuthToken,
} from '../apis/dataClient.js'

const AUTH_FLAG_KEY = 'admin_authenticated'

export const useAuthStore = defineStore('auth', () => {
  const token = ref(getAuthToken())
  const authenticated = ref(
    !!token.value && localStorage.getItem(AUTH_FLAG_KEY) === 'true',
  )

  const isAuthenticated = computed(() => authenticated.value && !!token.value)

  /**
   * @param {string} password
   * @returns {Promise<void>}
   */
  async function login(password) {
    const { token: nextToken } = await loginRequest(password)
    setAuthToken(nextToken)
    localStorage.setItem(AUTH_FLAG_KEY, 'true')
    token.value = nextToken
    authenticated.value = true
  }

  function logout() {
    clearAuthToken()
    localStorage.removeItem(AUTH_FLAG_KEY)
    token.value = ''
    authenticated.value = false
  }

  return { token, isAuthenticated, login, logout }
})
