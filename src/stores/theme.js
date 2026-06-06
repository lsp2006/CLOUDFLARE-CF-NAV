/**
 * @file Theme store (extracted from the legacy stores/counter.js).
 */

import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useThemeStore = defineStore('theme', () => {
  const isDarkMode = ref(false)

  const savedTheme = typeof localStorage !== 'undefined' && localStorage.getItem('theme')
  if (savedTheme) {
    isDarkMode.value = savedTheme === 'dark'
  } else if (typeof window !== 'undefined' && window.matchMedia) {
    isDarkMode.value = window.matchMedia('(prefers-color-scheme: dark)').matches
  }

  function updateDocumentTheme() {
    if (typeof document === 'undefined') return
    document.documentElement.classList.toggle('dark', isDarkMode.value)
  }

  function toggleTheme() {
    isDarkMode.value = !isDarkMode.value
    localStorage.setItem('theme', isDarkMode.value ? 'dark' : 'light')
    updateDocumentTheme()
  }

  /** @param {'light'|'dark'} theme */
  function setTheme(theme) {
    isDarkMode.value = theme === 'dark'
    localStorage.setItem('theme', theme)
    updateDocumentTheme()
  }

  updateDocumentTheme()

  return { isDarkMode, toggleTheme, setTheme }
})
