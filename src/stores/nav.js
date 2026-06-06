/**
 * @file Pinia store for navigation data (title, search, categories).
 * Single source of truth — public site reads from here, admin mutates and saves.
 */

import { defineStore } from 'pinia'
import { ref } from 'vue'
import { fetchData, saveData } from '../apis/dataClient.js'

const DEFAULT_SEARCH = 'bing'

export const useNavStore = defineStore('nav', () => {
  /** @type {import('vue').Ref<string>} */
  const title = ref('猫猫导航')
  /** @type {import('vue').Ref<string>} */
  const search = ref(DEFAULT_SEARCH)
  /** @type {import('vue').Ref<import('../apis/dataClient.js').Category[]>} */
  const categories = ref([])
  const loading = ref(false)
  const saving = ref(false)
  /** @type {import('vue').Ref<string|null>} */
  const error = ref(null)
  const loaded = ref(false)

  /**
   * @param {import('../apis/dataClient.js').NavBlob} blob
   */
  function applyBlob(blob) {
    title.value = blob.title || '猫猫导航'
    search.value = blob.search || DEFAULT_SEARCH
    categories.value = Array.isArray(blob.categories) ? blob.categories : []
  }

  /**
   * Load from KV. In dev, fall back to bundled mock data on failure so
   * `npm run dev` works without `wrangler pages dev`.
   * @param {{ force?: boolean }} [opts]
   */
  async function fetch(opts = {}) {
    if (loaded.value && !opts.force) return
    loading.value = true
    error.value = null
    try {
      const blob = await fetchData()
      applyBlob(blob)
      loaded.value = true
    } catch (err) {
      error.value = err?.message || String(err)
      if (import.meta.env.DEV) {
        const { mockData } = await import('../mock/mock_data.js')
        applyBlob(mockData)
        loaded.value = true
        error.value = null

        console.warn('[nav] KV unavailable, using bundled mock_data in dev:', err?.message || err)
      } else {
        throw err
      }
    } finally {
      loading.value = false
    }
  }

  /**
   * Save the current state back to KV. Requires auth.
   */
  async function save() {
    saving.value = true
    try {
      await saveData({
        title: title.value,
        search: search.value,
        categories: categories.value,
      })
    } finally {
      saving.value = false
    }
  }

  /**
   * @param {import('../apis/dataClient.js').Category[]} next
   */
  function setCategories(next) {
    categories.value = next
  }

  /** @param {string} value */
  function setTitle(value) {
    title.value = value
  }

  /** @param {string} value */
  function setSearch(value) {
    search.value = value
  }

  return {
    title,
    search,
    categories,
    loading,
    saving,
    error,
    loaded,
    fetch,
    save,
    setCategories,
    setTitle,
    setSearch,
  }
})
