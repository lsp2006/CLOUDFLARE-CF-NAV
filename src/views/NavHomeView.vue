<template>
  <!-- 锁定界面 -->
  <div v-if="isLocked && !isUnlocked" class="lock-container">
    <div class="lock-box">
      <h1>🔐 访问验证</h1>
      <p class="lock-description">此导航站已启用访问保护</p>
      <form @submit.prevent="handleUnlock">
        <div class="form-group">
          <label for="unlock-password">请输入访问密钥:</label>
          <input
            id="unlock-password"
            type="password"
            v-model="unlockPassword"
            placeholder="请输入访问密钥"
            required
            class="form-input"
          />
        </div>
        <button type="submit" class="unlock-btn" :disabled="unlocking">
          {{ unlocking ? '验证中...' : '进入导航' }}
        </button>
      </form>
      <div v-if="unlockError" class="error-message">
        {{ unlockError }}
      </div>
    </div>
  </div>

  <!-- 正常导航界面 -->
  <div v-else class="nav-home">
    <!-- 背景壁纸层 -->
    <div
      v-if="settings.bgUrl"
      class="bg-wallpaper"
      :style="{ backgroundImage: `url(${settings.bgUrl})`, opacity: (100 - settings.bgOpacity) / 100 }"
    ></div>

    <!-- 左侧边栏 -->
    <aside class="sidebar" :class="{ collapsed: settings.sidebarCollapsed }">
      <!-- Logo区域 -->
      <div class="logo-section">
        <img :src="settings.logo || '/logo.png'" alt="logo" class="logo" @error="onLogoError" />
        <h1 class="site-title">{{ title || '猫猫导航' }}</h1>
      </div>

      <!-- 分类导航 -->
      <nav class="category-nav">
        <h2 class="nav-title">分类导航</h2>
                <ul class="category-list">
          <li
            v-for="category in categories"
            :key="category.id"
            class="category-item"
            @click="scrollToCategory(category.id)"
          >
            <span class="category-icon">{{ category.icon }}</span>
            <span class="category-name">{{ category.name }}</span>
          </li>
        </ul>
      </nav>

      <!-- 左侧边栏底部信息 -->
      <div class="sidebar-footer" v-if="settings.footerText">
        <a
          :href="settings.footerLink || '#'"
          target="_blank"
          rel="noopener noreferrer"
          class="github-link"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
          </svg>
          <span>{{ settings.footerText }}</span>
        </a>
      </div>
    </aside>

    <!-- 侧栏折叠按钮 -->
    <button
      class="sidebar-toggle"
      :class="{ collapsed: settings.sidebarCollapsed }"
      @click="toggleSidebar"
      :aria-label="settings.sidebarCollapsed ? '展开侧栏' : '折叠侧栏'"
      :aria-expanded="!settings.sidebarCollapsed"
      :title="settings.sidebarCollapsed ? '展开侧栏 (B)' : '折叠侧栏 (B)'"
    >
      <svg class="toggle-icon" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
        <polyline points="15 18 9 12 15 6"></polyline>
      </svg>
    </button>

    <!-- 右侧主内容区 -->
    <main class="main-content">
                  <!-- 顶部搜索栏 -->
      <header class="search-header">
        <div class="search-container">
          <div class="search-engine-selector">
            <img :src="searchEngines[selectedEngine].icon" :alt="selectedEngine" class="engine-logo" />
            <select v-model="selectedEngine" class="engine-select">
              <option value="google">Google</option>
              <option value="baidu">Baidu</option>
              <option value="bing">Bing</option>
              <option value="duckduckgo">DuckDuckGo</option>
            </select>
          </div>
          <input
            ref="searchInput"
            type="text"
            v-model="filterQuery"
            placeholder="搜索网站... (Ctrl+K 聚焦)"
            class="search-input"
            @keyup.enter="handleSearch"
          />
        </div>

        <!-- 主题面板触发已迁移到右上角 FAB (ThemePanel.vue) -->

        <!-- 移动端菜单按钮 -->
        <button class="mobile-menu-btn" @click="toggleMobileMenu">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M3 12H21M3 6H21M3 18H21" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
          </svg>
        </button>

        <!-- 移动端分类菜单 -->
        <div class="mobile-menu" :class="{ active: showMobileMenu }">
          <div class="mobile-menu-header">
            <div class="header-left">
              <h3>分类导航</h3>
              <a v-if="settings.footerLink" :href="settings.footerLink" target="_blank" rel="noopener noreferrer">
                <img :src="githubLogo" alt="link" class="header-github-icon" />
              </a>
            </div>
            <button class="close-btn" @click="closeMobileMenu">×</button>
          </div>
                    <ul class="mobile-category-list">
            <li
              v-for="category in categories"
              :key="category.id"
              class="mobile-category-item"
              @click="scrollToCategoryMobile(category.id)"
            >
              <span class="category-icon">{{ category.icon }}</span>
              <span class="category-name">{{ category.name }}</span>
            </li>
          </ul>
        </div>

        <!-- 移动端菜单遮罩 -->
        <div class="mobile-menu-overlay" :class="{ active: showMobileMenu }" @click="closeMobileMenu"></div>
      </header>

      <!-- 导航内容区 -->
      <div class="content-area">
        <!-- 加载状态 -->
        <SkeletonGrid v-if="loading" :count="12" />

        <!-- 错误状态 -->
        <div v-else-if="error" class="error">
          <p>{{ error }}</p>
          <button @click="fetchCategories" class="retry-btn">重试</button>
        </div>

                <!-- 分类内容 -->
        <div v-else class="categories-container">
          <section
            v-for="category in filteredCategories"
            :key="category.id"
            class="category-section"
            :id="`category-${category.id}`"
          >
            <h2 class="category-title">
              <span class="category-icon">{{ category.icon }}</span>
              <span class="category-name">{{ category.name }}</span>
            </h2>

            <div class="sites-grid">
              <a
                v-for="site in category.sites"
                :key="site.id"
                :href="site.url"
                target="_blank"
                rel="noopener noreferrer"
                class="site-card"
              >
                <div class="site-icon">
                  <img :src="site.icon" :alt="site.name" @error="handleImageError" />
                </div>
                <div class="site-info">
                  <h3 class="site-name">{{ site.name }}</h3>
                  <p class="site-description">{{ site.description }}</p>
                </div>
              </a>
            </div>
          </section>
        </div>
      </div>
    </main>

    <!-- 主题快捷面板（右上角浮动） -->
    <ThemePanel />
  </div>
</template>

<script setup>
import { computed, onMounted, onUnmounted, ref, watch } from 'vue'
import { storeToRefs } from 'pinia'
import { useNavStore } from '@/stores/nav.js'
import { useSettingsStore } from '@/stores/settings.js'
import { applySkin } from '@/skins.js'
import SkeletonGrid from '@/components/base/SkeletonGrid.vue'
import ThemePanel from '@/components/base/ThemePanel.vue'
import googleLogo from '@/assets/goolge.png'
import baiduLogo from '@/assets/baidu.png'
import bingLogo from '@/assets/bing.png'
import duckLogo from '@/assets/duck.png'
import githubLogo from '@/assets/github.png'

const navStore = useNavStore()
const { categories, title, loading, error } = storeToRefs(navStore)
const VALID_ENGINES = ['google', 'baidu', 'bing', 'duckduckgo']
const defaultSearchEngine = computed(() =>
  VALID_ENGINES.includes(navStore.search) ? navStore.search : 'bing',
)

const settings = useSettingsStore()

async function toggleSidebar() {
  settings.sidebarCollapsed = !settings.sidebarCollapsed
  // Persist silently — failures are non-blocking for UX
  try { await settings.save() } catch { /* ignore */ }
}

function onLogoError(e) {
  e.target.src = '/logo.png'
  e.target.onerror = null
}

const searchQuery = ref('')
const filterQuery = ref('')
const selectedEngine = ref('bing')
const showMobileMenu = ref(false)
const searchInput = ref(null)

const isLocked = ref(false)
const isUnlocked = ref(false)
const unlockPassword = ref('')
const unlocking = ref(false)
const unlockError = ref('')

/** @type {import('vue').ComputedRef<import('../apis/dataClient.js').Category[]>} */
const filteredCategories = computed(() => {
  const q = filterQuery.value.trim().toLowerCase()
  if (!q) return categories.value
  return categories.value
    .map((cat) => ({
      ...cat,
      sites: (cat.sites || []).filter(
        (s) =>
          s.name.toLowerCase().includes(q) ||
          (s.url || '').toLowerCase().includes(q) ||
          (s.description || '').toLowerCase().includes(q),
      ),
    }))
    .filter((cat) => cat.sites.length > 0)
})

/* Keyboard shortcuts */
function onKeyDown(e) {
  const onInputField =
    e.target instanceof HTMLElement &&
    (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA' || e.target.isContentEditable)

  if (
    (e.key === '/' && !e.ctrlKey && !e.metaKey && e.target === document.body) ||
    (e.key === 'k' && (e.ctrlKey || e.metaKey))
  ) {
    e.preventDefault()
    searchInput.value?.focus()
  }
  if (e.key === 'Escape' && document.activeElement === searchInput.value) {
    filterQuery.value = ''
    searchInput.value?.blur()
  }
  // Toggle sidebar with `b` (skipped while typing)
  if ((e.key === 'b' || e.key === 'B') && !onInputField && !e.ctrlKey && !e.metaKey && !e.altKey) {
    e.preventDefault()
    toggleSidebar()
  }
}

// 搜索引擎配置
const searchEngines = {
  google: {
    url: 'https://www.google.com/search?q=',
    icon: googleLogo,
    placeholder: 'Google (点logo切换搜索引擎'
  },
  baidu: {
    url: 'https://www.baidu.com/s?wd=',
    icon: baiduLogo,
    placeholder: '百度一下(点logo切换搜索引擎'
  },
  bing: {
    url: 'https://www.bing.com/search?q=',
    icon: bingLogo,
    placeholder: 'Bing (点logo切换搜索引擎)'
  },
  duckduckgo: {
    url: 'https://duckduckgo.com/?q=',
    icon: duckLogo,
    placeholder: 'DuckDuckGo (点logo切换搜索引擎)'
  }
}

// 自定义固定时间滚动函数
const smoothScrollTo = (container, targetTop, duration = 600) => {
  const startTop = container.scrollTop
  const distance = targetTop - startTop
  let startTime = null

  const animateScroll = (currentTime) => {
    if (startTime === null) startTime = currentTime
    const timeElapsed = currentTime - startTime
    const progress = Math.min(timeElapsed / duration, 1)

    // 使用缓动函数 (easeInOutCubic)
    const ease = progress < 0.5
      ? 4 * progress * progress * progress
      : 1 - Math.pow(-2 * progress + 2, 3) / 2

    container.scrollTop = startTop + distance * ease

    if (progress < 1) {
      requestAnimationFrame(animateScroll)
    }
  }

  requestAnimationFrame(animateScroll)
}

// 滚动到指定分类
const scrollToCategory = (categoryId) => {
  const element = document.getElementById(`category-${categoryId}`)
  const container = document.querySelector('.content-area')

  if (element && container) {
    // 检查是否为移动端
    const isMobile = window.innerWidth <= 768

    let targetTop = 0

    if (isMobile) {
      // 移动端：在 content-area 容器内滚动
      const elementOffsetTop = element.offsetTop
      const searchHeaderHeight = 80 // 固定高度，因为搜索框是fixed定位
      targetTop = elementOffsetTop - searchHeaderHeight
    } else {
      // 桌面端：在容器内滚动
      const searchHeader = document.querySelector('.search-header')
      const elementOffsetTop = element.offsetTop
      const searchHeaderHeight = searchHeader ? searchHeader.offsetHeight + 20 : 100
      targetTop = elementOffsetTop - searchHeaderHeight
    }

    // 使用固定时间滚动（600毫秒）
    smoothScrollTo(container, Math.max(0, targetTop), 600)
  }
}

// 检查是否启用锁定功能
const checkLockStatus = () => {
  const openLock = import.meta.env.VITE_OPEN_LOCK
  if (openLock && openLock.trim() !== '') {
    isLocked.value = true
    // 检查是否已经解锁过
    const savedUnlock = localStorage.getItem('nav_unlocked')
    if (savedUnlock === 'true') {
      isUnlocked.value = true
    }
  } else {
    isLocked.value = false
    isUnlocked.value = true // 如果没有启用锁定，默认为解锁状态
  }
}

// 处理解锁（通过服务端验证）
const handleUnlock = async () => {
  unlocking.value = true
  unlockError.value = ''

  try {
    const response = await fetch('/api/verify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password: unlockPassword.value }),
    })

    const result = await response.json()

    if (!result.success) {
      throw new Error(result.error || '访问密钥错误，请重新输入')
    }

    isUnlocked.value = true
    localStorage.setItem('nav_unlocked', 'true')
    unlockPassword.value = ''
  } catch (error) {
    unlockError.value = error.message
  } finally {
    unlocking.value = false
  }
}

// 处理搜索
const handleSearch = () => {
  if (!searchQuery.value.trim()) return

  const engine = searchEngines[selectedEngine.value]
  const url = engine.url + encodeURIComponent(searchQuery.value)
  window.open(url, '_blank')
}

// 处理图片加载错误
const handleImageError = (event) => {
  // 设置默认的 favicon.ico 作为 fallback 图片
  event.target.src = '/favicon.ico'
  event.target.onerror = null // 防止无限循环
}

// 移动端菜单控制
const toggleMobileMenu = () => {
  showMobileMenu.value = !showMobileMenu.value
  // 控制body滚动
  if (showMobileMenu.value) {
    document.body.style.overflow = 'hidden'
  } else {
    document.body.style.overflow = ''
  }
}

const closeMobileMenu = () => {
  showMobileMenu.value = false
  // 恢复body滚动
  document.body.style.overflow = ''
}

// 移动端分类滚动
const scrollToCategoryMobile = (categoryId) => {
  closeMobileMenu() // 先关闭菜单

  // 稍微延迟一下再滚动，确保菜单关闭动画完成
  setTimeout(() => {
    scrollToCategory(categoryId)
  }, 200)
}

onMounted(async () => {
  checkLockStatus()
  try {
    await Promise.all([navStore.fetch(), settings.fetch()])
  } catch (err) {
    console.error('Failed to load:', err)
  }
  applySkin(settings.skinId)
  // Auto-fetch Bing wallpaper if user selected that option
  if (settings.bgType === 'bing' && !settings.bgUrl) {
    try {
      const today = new Date().toISOString().slice(0, 10)
      const cached = localStorage.getItem('bing_wallpaper_' + today)
      if (cached) {
        settings.bgUrl = cached
      } else {
        const res = await fetch('https://www.bing.com/HPImageArchive.aspx?format=js&idx=0&n=1&mkt=zh-CN')
        const data = await res.json()
        const url = 'https://www.bing.com' + data.images[0].url
        localStorage.setItem('bing_wallpaper_' + today, url)
        settings.bgUrl = url
      }
    } catch { /* network failure — keep no wallpaper */ }
  }
  document.title = title.value || '猫猫导航'
  selectedEngine.value = defaultSearchEngine.value
  window.addEventListener('keydown', onKeyDown)
})

watch(() => settings.skinId, (id) => applySkin(id))

onUnmounted(() => {
  document.body.style.overflow = ''
  window.removeEventListener('keydown', onKeyDown)
})
</script>

<style scoped>
/* ═══════════════════════════════════════════════════════════════
   NavHomeView — Glassmorphism + CSS variables
   All colors via --mao-* tokens from base.css. .dark toggles them.
   ═══════════════════════════════════════════════════════════════ */

/* ── Lock Screen ────────────────────────────────────────────── */
.lock-container {
  position: fixed;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--mao-bg);
  z-index: 9999;
  padding: var(--space-md);
}
.lock-box {
  background: var(--mao-surface);
  padding: 40px;
  border-radius: var(--radius-xl);
  box-shadow: var(--mao-shadow-xl);
  width: 100%;
  max-width: 400px;
  text-align: center;
}
.lock-box h1 {
  color: var(--mao-text);
  margin-bottom: 8px;
  font-size: 28px;
  font-weight: 600;
}
.lock-description {
  color: var(--mao-text-secondary);
  margin-bottom: var(--space-lg);
}
.lock-box .form-group { margin-bottom: var(--space-md); text-align: left; }
.lock-box .form-group label {
  display: block;
  margin-bottom: 6px;
  font-weight: 500;
  color: var(--mao-text);
  font-size: 14px;
}
.form-input {
  width: 100%;
  padding: 12px var(--space-md);
  border: 2px solid var(--mao-border);
  border-radius: var(--radius-sm);
  font-size: 15px;
  background: var(--mao-surface);
  color: var(--mao-text);
  transition: border-color var(--transition-fast);
}
.form-input:focus {
  outline: none;
  border-color: var(--mao-primary);
}
.unlock-btn {
  width: 100%;
  padding: 12px;
  background: var(--mao-primary);
  color: #fff;
  border: none;
  border-radius: var(--radius-sm);
  font-size: 16px;
  font-weight: 600;
  transition: background var(--transition-fast);
}
.unlock-btn:hover:not(:disabled) { background: var(--mao-primary-hover); }
.unlock-btn:disabled { opacity: 0.6; cursor: not-allowed; }
.error-message {
  margin-top: var(--space-md);
  padding: var(--space-sm) var(--space-md);
  background: #fef2f2;
  color: #dc2626;
  border-radius: var(--radius-sm);
  font-size: 14px;
}

/* ── Layout ─────────────────────────────────────────────────── */
.nav-home {
  display: flex;
  height: 100vh;
  overflow: hidden;
  position: relative;
}

/* Wallpaper background layer — fixed under everything, body's --mao-bg shows when none */
.bg-wallpaper {
  position: fixed;
  inset: 0;
  background-size: cover;
  background-position: center;
  background-repeat: no-repeat;
  z-index: -1;
  pointer-events: none;
  transition: opacity var(--transition-normal);
}

/* Sidebar toggle button (floats on the sidebar/main border) */
.sidebar-toggle {
  position: absolute;
  top: 50%;
  left: 240px;
  transform: translate(-50%, -50%);
  width: 24px;
  height: 56px;
  padding: 0;
  border: 1px solid var(--mao-border);
  border-radius: var(--radius-full);
  background: var(--mao-surface);
  color: var(--mao-text-secondary);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  box-shadow: var(--mao-shadow-md);
  z-index: 60;
  opacity: 0.7;
  transition:
    left var(--transition-normal),
    background var(--transition-fast),
    color var(--transition-fast),
    opacity var(--transition-fast),
    box-shadow var(--transition-fast),
    width var(--transition-fast);
}
.sidebar-toggle:hover {
  background: var(--mao-primary);
  color: #fff;
  border-color: var(--mao-primary);
  opacity: 1;
  width: 28px;
  box-shadow: var(--mao-shadow-lg);
}
.sidebar-toggle:focus-visible {
  outline: none;
  opacity: 1;
  box-shadow: 0 0 0 3px var(--mao-primary-soft), var(--mao-shadow-md);
}
.sidebar-toggle:active { transform: translate(-50%, -50%) scale(0.92); }

/* When collapsed: nudge fully onto the screen and rotate the chevron */
.sidebar-toggle.collapsed {
  left: 12px;
  transform: translate(0, -50%);
  opacity: 0.55;
}
.sidebar-toggle.collapsed:hover { transform: translate(0, -50%); }
.sidebar-toggle.collapsed:active { transform: translate(0, -50%) scale(0.92); }

.toggle-icon {
  transition: transform var(--transition-normal);
}
.sidebar-toggle.collapsed .toggle-icon {
  transform: rotate(180deg);
}

/* ── Sidebar ────────────────────────────────────────────────── */
.sidebar {
  width: 240px;
  flex-shrink: 0;
  display: flex;
  flex-direction: column;
  background: var(--mao-glass-bg);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  border-right: 1px solid var(--mao-glass-border);
  padding: var(--space-lg) var(--space-md);
  overflow-y: auto;
  transition: width var(--transition-normal), padding var(--transition-normal);
}
.sidebar.collapsed {
  width: 0;
  padding: 0;
  border-right: none;
  overflow: hidden;
}
.logo-section {
  text-align: center;
  padding-bottom: var(--space-lg);
  border-bottom: 1px solid var(--mao-border);
  margin-bottom: var(--space-lg);
}
.logo { width: 48px; height: 48px; margin: 0 auto var(--space-sm); border-radius: var(--radius-md); }
.site-title {
  font-size: 18px;
  font-weight: 700;
  color: var(--mao-text);
  margin: 0;
}
.nav-title {
  font-size: 12px;
  font-weight: 600;
  color: var(--mao-text-muted);
  text-transform: uppercase;
  letter-spacing: 0.05em;
  margin-bottom: var(--space-sm);
}
.category-list { list-style: none; display: flex; flex-direction: column; gap: 2px; }
.category-item {
  display: flex;
  align-items: center;
  gap: var(--space-sm);
  padding: 10px 12px;
  border-radius: var(--radius-sm);
  cursor: pointer;
  color: var(--mao-text-secondary);
  font-size: 14px;
  font-weight: 500;
  position: relative;
  transition: all var(--transition-fast);
}
.category-item::before {
  content: '';
  position: absolute;
  left: 0;
  top: 50%;
  transform: translateY(-50%) scaleY(0);
  width: 3px;
  height: 60%;
  border-radius: 0 3px 3px 0;
  background: var(--mao-primary);
  transition: transform var(--transition-fast);
}
.category-item:hover {
  background: var(--mao-primary-soft);
  color: var(--mao-primary);
  padding-left: 16px;
}
.category-item:hover::before { transform: translateY(-50%) scaleY(1); }
.category-item .category-icon { font-size: 18px; width: 24px; text-align: center; flex-shrink: 0; }
.category-item .category-name { white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }

.sidebar-footer { margin-top: auto; padding-top: var(--space-md); }
.github-link {
  display: flex;
  align-items: center;
  gap: var(--space-sm);
  padding: 10px 12px;
  border-radius: var(--radius-sm);
  color: var(--mao-text-muted);
  font-size: 12px;
  transition: all var(--transition-fast);
}
.github-link:hover { background: var(--mao-primary-soft); color: var(--mao-primary); }

/* ── Main content ───────────────────────────────────────────── */
.main-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

/* ── Search header (glass) ──────────────────────────────────── */
.search-header {
  position: sticky;
  top: 0;
  z-index: 50;
  display: flex;
  align-items: center;
  gap: var(--space-md);
  padding: var(--space-md) var(--space-xl);
  background: var(--mao-glass-bg);
  backdrop-filter: blur(16px);
  -webkit-backdrop-filter: blur(16px);
  border-bottom: 1px solid var(--mao-glass-border);
}
.search-container {
  flex: 1;
  display: flex;
  align-items: center;
  gap: var(--space-sm);
}
.search-engine-selector {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px 10px;
  background: var(--mao-surface);
  border-radius: var(--radius-sm);
  border: 1px solid var(--mao-border);
}
.engine-logo { width: 20px; height: 20px; border-radius: 2px; }
.engine-select {
  border: none;
  background: none;
  color: var(--mao-text);
  font-size: 13px;
  cursor: pointer;
  outline: none;
}
.search-input {
  flex: 1;
  max-width: 520px;
  padding: 10px var(--space-md);
  border: 2px solid var(--mao-border);
  border-radius: var(--radius-full);
  font-size: 14px;
  background: var(--mao-surface);
  color: var(--mao-text);
  transition: all var(--transition-fast);
}
.search-input:focus {
  outline: none;
  border-color: var(--mao-primary);
  box-shadow: 0 0 0 3px var(--mao-primary-soft);
}
.search-input::placeholder { color: var(--mao-text-muted); }

.theme-toggle-btn, .mobile-menu-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  border-radius: var(--radius-full);
  border: none;
  background: var(--mao-surface);
  color: var(--mao-text-secondary);
  cursor: pointer;
  transition: all var(--transition-fast);
  box-shadow: var(--mao-shadow-sm);
}
.theme-toggle-btn:hover, .mobile-menu-btn:hover {
  color: var(--mao-primary);
  box-shadow: var(--mao-shadow-md);
}

/* ── Content area ───────────────────────────────────────────── */
.content-area {
  flex: 1;
  overflow-y: auto;
  padding: var(--space-xl);
  scroll-behavior: smooth;
}
.categories-container {
  max-width: 1200px;
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  gap: var(--space-2xl);
}
.category-section { scroll-margin-top: 100px; }
.category-title {
  display: flex;
  align-items: center;
  gap: var(--space-sm);
  font-size: 22px;
  font-weight: 700;
  color: var(--mao-text);
  margin-bottom: var(--space-lg);
}
.category-title .category-icon { font-size: 26px; }
.category-title .category-name { font-size: 22px; }

/* ── Site cards grid ────────────────────────────────────────── */
.sites-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
  gap: var(--space-md);
}
.site-card {
  display: flex;
  align-items: center;
  gap: var(--space-md);
  padding: var(--space-md) var(--space-lg);
  background: var(--mao-surface);
  border: 1px solid var(--mao-border-light);
  border-radius: var(--radius-lg);
  box-shadow: var(--mao-shadow-sm);
  text-decoration: none;
  color: inherit;
  transition: all var(--transition-normal);
  position: relative;
  overflow: hidden;
}
.site-card::after {
  content: '';
  position: absolute;
  inset: 0;
  border-radius: var(--radius-lg);
  opacity: 0;
  background: linear-gradient(135deg, var(--mao-primary-soft), transparent 60%);
  transition: opacity var(--transition-normal);
  pointer-events: none;
}
.site-card:hover {
  transform: translateY(-4px);
  box-shadow: var(--mao-shadow-lg);
  border-color: var(--mao-primary);
}
.site-card:hover::after { opacity: 1; }
.site-card:active { transform: scale(0.98); transition: transform 0.1s ease; }

.site-card .site-icon {
  width: 44px;
  height: 44px;
  border-radius: var(--radius-md);
  background: var(--mao-bg);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  overflow: hidden;
  transition: transform var(--transition-normal);
}
.site-card:hover .site-icon { transform: scale(1.08) rotate(-3deg); }
.site-card .site-icon img {
  width: 28px;
  height: 28px;
  object-fit: contain;
}
.site-card .site-info { flex: 1; min-width: 0; }
.site-card .site-name {
  font-size: 15px;
  font-weight: 600;
  color: var(--mao-text);
  margin: 0 0 4px 0;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.site-card .site-description {
  font-size: 12px;
  color: var(--mao-text-secondary);
  margin: 0;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

/* ── Footer ─────────────────────────────────────────────────── */
.page-footer {
  text-align: center;
  padding: var(--space-2xl) var(--space-md);
  color: var(--mao-text-muted);
  font-size: 13px;
}

/* ── Error ──────────────────────────────────────────────────── */
.error { text-align: center; padding: var(--space-2xl); color: var(--mao-text-secondary); }
.retry-btn {
  margin-top: var(--space-md);
  padding: 8px 20px;
  border: none;
  border-radius: var(--radius-sm);
  background: var(--mao-primary);
  color: #fff;
  font-weight: 500;
  cursor: pointer;
}

/* ── Mobile ─────────────────────────────────────────────────── */
.mobile-menu-btn { display: none; }
.mobile-menu {
  display: none;
  position: fixed;
  top: 0;
  right: 0;
  width: 280px;
  height: 100vh;
  background: var(--mao-surface);
  z-index: 200;
  padding: var(--space-lg);
  overflow-y: auto;
  box-shadow: var(--mao-shadow-xl);
  transition: transform var(--transition-normal);
  transform: translateX(100%);
}
.mobile-menu.active { transform: translateX(0); }
.mobile-menu-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: var(--space-lg);
}
.mobile-menu-header h3 { color: var(--mao-text); font-size: 18px; margin: 0; }
.close-btn {
  background: none;
  border: none;
  font-size: 24px;
  cursor: pointer;
  color: var(--mao-text-secondary);
}
.mobile-category-list { list-style: none; display: flex; flex-direction: column; gap: 4px; }
.mobile-category-item {
  display: flex;
  align-items: center;
  gap: var(--space-sm);
  padding: 12px var(--space-md);
  border-radius: var(--radius-sm);
  cursor: pointer;
  color: var(--mao-text);
  font-size: 15px;
  transition: background var(--transition-fast);
}
.mobile-category-item:hover { background: var(--mao-primary-soft); }
.mobile-menu-overlay {
  display: none;
  position: fixed;
  inset: 0;
  background: rgba(0,0,0,0.3);
  z-index: 199;
}
.mobile-menu-overlay.active { display: block; }

/* ── Dark mode overrides (minimal — mostly variables handle it) ── */
.dark .lock-box, .dark .login-box { background: var(--mao-surface); }
.dark .form-input { background: var(--mao-surface); color: var(--mao-text); }
.dark .search-engine-selector { background: var(--mao-surface); }
.dark .search-input { background: var(--mao-surface); }
.dark .theme-toggle-btn, .dark .mobile-menu-btn { background: var(--mao-surface); }
.dark .error-message { background: #450a0a; color: #fca5a5; }
.dark .unlock-btn:hover:not(:disabled) { box-shadow: 0 10px 30px rgba(59,130,246,0.4); }

/* ── Responsive ─────────────────────────────────────────────── */
@media (max-width: 1024px) {
  .sites-grid { grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); }
}
@media (max-width: 768px) {
  .sidebar { display: none; }
  .sidebar-toggle { display: none; }
  .mobile-menu-btn { display: flex; }
  .mobile-menu { display: block; }
  .search-header { padding: var(--space-sm) var(--space-md); }
  .search-engine-selector { display: none; }
  .search-input { max-width: none; }
  .content-area { padding: var(--space-md); }
  .sites-grid { grid-template-columns: repeat(auto-fill, minmax(160px, 1fr)); }
  .categories-container { gap: var(--space-xl); }
}
@media (max-width: 480px) {
  .sites-grid { grid-template-columns: 1fr; }
  .site-card { padding: var(--space-sm) var(--space-md); }
}
</style>
