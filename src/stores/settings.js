/**
 * @file Pinia store for visual/brand settings.
 * Backed by KV key `nav:settings`. Falls back to sensible defaults.
 */

import { defineStore } from 'pinia'
import { ref } from 'vue'
import { fetchSettings, saveSettings } from '../apis/dataClient.js'

const DEFAULTS = {
  logo: '/logo.png',
  footerText: '开源不易，Star一下吧！⭐',
  footerLink: 'https://github.com/',
  sidebarCollapsed: false,
  bgType: 'none',
  bgUrl: '',
  bgOpacity: 30,
  skinId: 'default',
}

export const useSettingsStore = defineStore('settings', () => {
  const loaded = ref(false)
  const logo = ref(DEFAULTS.logo)
  const footerText = ref(DEFAULTS.footerText)
  const footerLink = ref(DEFAULTS.footerLink)
  const sidebarCollapsed = ref(DEFAULTS.sidebarCollapsed)
  const bgType = ref(DEFAULTS.bgType)
  const bgUrl = ref(DEFAULTS.bgUrl)
  const bgOpacity = ref(DEFAULTS.bgOpacity)
  const skinId = ref(DEFAULTS.skinId)

  function apply(raw) {
    if (!raw) return
    logo.value = raw.logo || DEFAULTS.logo
    footerText.value = raw.footerText || DEFAULTS.footerText
    footerLink.value = raw.footerLink || DEFAULTS.footerLink
    sidebarCollapsed.value = raw.sidebarCollapsed ?? DEFAULTS.sidebarCollapsed
    bgType.value = raw.bgType || DEFAULTS.bgType
    bgUrl.value = raw.bgUrl || ''
    bgOpacity.value = raw.bgOpacity ?? DEFAULTS.bgOpacity
    skinId.value = raw.skinId || DEFAULTS.skinId
    loaded.value = true
  }

  function toJSON() {
    return {
      logo: logo.value, footerText: footerText.value, footerLink: footerLink.value,
      sidebarCollapsed: sidebarCollapsed.value,
      bgType: bgType.value, bgUrl: bgUrl.value, bgOpacity: bgOpacity.value,
      skinId: skinId.value,
    }
  }

  async function fetch() {
    try {
      const { data } = await fetchSettings()
      if (data) apply(data)
    } catch {
      // If KV not seeded, use defaults
    }
    loaded.value = true
  }

  async function save() {
    await saveSettings(toJSON())
  }

  return {
    loaded, logo, footerText, footerLink,
    sidebarCollapsed, bgType, bgUrl, bgOpacity, skinId,
    fetch, save, apply, toJSON,
  }
})
