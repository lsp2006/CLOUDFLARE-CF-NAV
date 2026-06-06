<template>
  <Teleport to="body">
    <!-- 触发按钮（右上角浮动） -->
    <button class="theme-fab" :class="{ active: open }" @click="open = !open" title="主题与外观">
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <circle cx="12" cy="12" r="4"/>
        <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/>
      </svg>
    </button>

    <!-- 抽屉 -->
    <Transition name="drawer">
      <div v-if="open" class="theme-drawer">
        <div class="drawer-header">
          <h2>🎨 外观设置</h2>
          <button class="drawer-close" @click="open = false">✕</button>
        </div>

        <div class="drawer-content">
          <!-- 暗黑模式 -->
          <section>
            <h3>夜间模式</h3>
            <button class="dark-toggle" @click="themeStore.toggleTheme">
              <span>{{ themeStore.isDarkMode ? '☀️ 切换到日间' : '🌙 切换到夜间' }}</span>
            </button>
          </section>

          <!-- 行业皮肤 -->
          <section>
            <h3>行业皮肤</h3>
            <div class="skin-grid">
              <div
                v-for="skin in skinList"
                :key="skin.id"
                class="skin-card"
                :class="{ active: settings.skinId === skin.id }"
                @click="selectSkin(skin.id)"
              >
                <div class="skin-preview" :data-skin-preview="skin.id">
                  <div class="sp-bar"></div>
                  <div class="sp-dot"></div>
                </div>
                <div class="skin-label">{{ skin.label }}</div>
              </div>
            </div>
          </section>

          <!-- Bing 壁纸 -->
          <section>
            <div class="section-head">
              <h3>Bing 每日壁纸</h3>
              <button class="ghost-btn" @click="loadBingList" :disabled="bingLoading">
                {{ bingLoading ? '加载中...' : '🔄 刷新' }}
              </button>
            </div>
            <div v-if="bingError" class="bing-error">{{ bingError }}</div>
            <div class="wallpaper-grid">
              <div
                class="wallpaper-tile no-wallpaper"
                :class="{ active: !settings.bgUrl }"
                @click="clearWallpaper"
              >
                <span>🚫 无壁纸</span>
              </div>
              <div
                v-for="(wp, i) in bingList"
                :key="i"
                class="wallpaper-tile"
                :class="{ active: settings.bgUrl === wp.url }"
                :style="{ backgroundImage: `url(${wp.thumb || wp.url})` }"
                :title="wp.title + ' — ' + wp.copyright"
                @click="selectWallpaper(wp.url)"
              ></div>
            </div>
          </section>

          <!-- 自定义壁纸 -->
          <section>
            <h3>自定义壁纸 URL</h3>
            <input
              v-model="customUrl"
              type="url"
              placeholder="https://..."
              class="custom-input"
              @keyup.enter="applyCustomUrl"
            />
            <button class="apply-btn" @click="applyCustomUrl" :disabled="!customUrl">应用</button>
          </section>

          <!-- 透明度 -->
          <section v-if="settings.bgUrl">
            <h3>背景透明度: {{ settings.bgOpacity }}%</h3>
            <input
              v-model.number="settings.bgOpacity"
              type="range"
              min="0"
              max="90"
              step="1"
              class="opacity-slider"
            />
            <p class="hint">值越大壁纸越淡,玻璃质感越透</p>
          </section>

          <!-- 保存到 KV (管理员) -->
          <section v-if="auth.isAuthenticated">
            <button class="save-global-btn" @click="saveGlobal" :disabled="saving">
              {{ saving ? '保存中...' : '💾 保存为站点默认 (管理员)' }}
            </button>
            <p class="hint">保存后所有访客将看到此外观</p>
          </section>
          <section v-else>
            <p class="hint anonymous-hint">
              💡 当前为本地预览,刷新后恢复默认。<br/>
              登录管理后台可保存为站点全局外观。
            </p>
          </section>
        </div>
      </div>
    </Transition>

    <!-- 遮罩 -->
    <Transition name="fade">
      <div v-if="open" class="drawer-overlay" @click="open = false"></div>
    </Transition>
  </Teleport>
</template>

<script setup>
import { onMounted, ref } from 'vue'
import { useSettingsStore } from '../../stores/settings.js'
import { useThemeStore } from '../../stores/theme.js'
import { useAuthStore } from '../../stores/auth.js'
import { SKIN_LIST, applySkin } from '../../skins.js'
import { toast } from '../../composables/useToast.js'

const settings = useSettingsStore()
const themeStore = useThemeStore()
const auth = useAuthStore()
const skinList = SKIN_LIST

const open = ref(false)
const bingList = ref([])
const bingLoading = ref(false)
const bingError = ref('')
const customUrl = ref('')
const saving = ref(false)

function selectSkin(id) {
  settings.skinId = id
  applySkin(id)
}

function selectWallpaper(url) {
  settings.bgType = 'bing'
  settings.bgUrl = url
}

function clearWallpaper() {
  settings.bgType = 'none'
  settings.bgUrl = ''
}

function applyCustomUrl() {
  if (!customUrl.value) return
  settings.bgType = 'custom'
  settings.bgUrl = customUrl.value
  toast.success('壁纸已应用')
}

async function loadBingList() {
  bingLoading.value = true
  bingError.value = ''
  try {
    const today = new Date().toISOString().slice(0, 10)
    const cacheKey = 'bing_list_' + today
    const cached = localStorage.getItem(cacheKey)
    if (cached) {
      bingList.value = JSON.parse(cached)
    } else {
      const res = await fetch('/api/bing')
      const result = await res.json()
      if (!result.success) throw new Error(result.error || '加载失败')
      bingList.value = result.data || []
      localStorage.setItem(cacheKey, JSON.stringify(bingList.value))
    }
  } catch (err) {
    bingError.value = '加载 Bing 壁纸失败: ' + err.message
  } finally {
    bingLoading.value = false
  }
}

async function saveGlobal() {
  saving.value = true
  try {
    await settings.save()
    toast.success('已保存为站点全局外观')
  } catch (err) {
    toast.error('保存失败: ' + err.message)
  } finally {
    saving.value = false
  }
}

onMounted(() => {
  loadBingList()
})
</script>

<style scoped>
/* ── Floating action button ─────────────────────────────────── */
.theme-fab {
  position: fixed;
  top: 18px;
  right: 18px;
  width: 44px;
  height: 44px;
  border-radius: 50%;
  border: none;
  background: var(--mao-surface);
  color: var(--mao-text-secondary);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: var(--mao-shadow-md);
  z-index: 9000;
  transition: all var(--transition-fast);
}
.theme-fab:hover {
  color: var(--mao-primary);
  transform: rotate(45deg);
  box-shadow: var(--mao-shadow-lg);
}
.theme-fab.active { color: var(--mao-primary); transform: rotate(45deg); }

/* ── Drawer ─────────────────────────────────────────────────── */
.drawer-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.35);
  z-index: 9500;
}
.theme-drawer {
  position: fixed;
  top: 0;
  right: 0;
  bottom: 0;
  width: 380px;
  max-width: 100vw;
  background: var(--mao-surface);
  z-index: 9600;
  display: flex;
  flex-direction: column;
  box-shadow: var(--mao-shadow-xl);
}
.drawer-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 20px 24px;
  border-bottom: 1px solid var(--mao-border);
}
.drawer-header h2 {
  margin: 0;
  font-size: 18px;
  font-weight: 700;
  color: var(--mao-text);
}
.drawer-close {
  background: none;
  border: none;
  font-size: 22px;
  cursor: pointer;
  color: var(--mao-text-secondary);
  padding: 4px 10px;
  border-radius: var(--radius-sm);
  transition: background var(--transition-fast);
}
.drawer-close:hover {
  background: var(--mao-bg);
  color: var(--mao-text);
}
.drawer-content {
  flex: 1;
  overflow-y: auto;
  padding: 20px 24px;
}
.drawer-content section { margin-bottom: 28px; }
.drawer-content h3 {
  margin: 0 0 12px 0;
  font-size: 13px;
  font-weight: 600;
  color: var(--mao-text-muted);
  text-transform: uppercase;
  letter-spacing: 0.05em;
}
.section-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 12px;
}
.section-head h3 { margin: 0; }

/* Dark toggle */
.dark-toggle {
  width: 100%;
  padding: 12px;
  border: 1px solid var(--mao-border);
  border-radius: var(--radius-md);
  background: var(--mao-surface);
  color: var(--mao-text);
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all var(--transition-fast);
}
.dark-toggle:hover {
  background: var(--mao-primary-soft);
  border-color: var(--mao-primary);
}

/* Skin grid */
.skin-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 10px;
}
.skin-card {
  padding: 10px;
  border: 2px solid var(--mao-border);
  border-radius: var(--radius-md);
  cursor: pointer;
  background: var(--mao-surface);
  transition: all var(--transition-fast);
}
.skin-card:hover { border-color: var(--mao-primary); }
.skin-card.active {
  border-color: var(--mao-primary);
  box-shadow: 0 0 0 2px var(--mao-primary-soft);
}
.skin-preview {
  height: 44px;
  border-radius: 6px;
  margin-bottom: 8px;
  position: relative;
  overflow: hidden;
}
.sp-bar { position: absolute; top: 6px; left: 6px; right: 6px; height: 4px; border-radius: 2px; }
.sp-dot { position: absolute; bottom: 6px; left: 6px; width: 12px; height: 12px; border-radius: 50%; }
[data-skin-preview="default"]   { background: #f0f4f8; }
[data-skin-preview="default"] .sp-bar { background: #3b82f6; }
[data-skin-preview="default"] .sp-dot { background: #1e293b; }
[data-skin-preview="finance"]   { background: #fffbeb; }
[data-skin-preview="finance"] .sp-bar { background: #d97706; }
[data-skin-preview="finance"] .sp-dot { background: #1c1917; }
[data-skin-preview="medical"]   { background: #ecfdf5; }
[data-skin-preview="medical"] .sp-bar { background: #059669; }
[data-skin-preview="medical"] .sp-dot { background: #064e3b; }
[data-skin-preview="education"] { background: #faf5ff; }
[data-skin-preview="education"] .sp-bar { background: #7c3aed; }
[data-skin-preview="education"] .sp-dot { background: #3b0764; }
[data-skin-preview="creative"]  { background: #fdf2f8; }
[data-skin-preview="creative"] .sp-bar { background: #db2777; }
[data-skin-preview="creative"] .sp-dot { background: #500724; }
[data-skin-preview="minimal"]   { background: #f9fafb; }
[data-skin-preview="minimal"] .sp-bar { background: #374151; }
[data-skin-preview="minimal"] .sp-dot { background: #111827; }
[data-skin-preview="nature"]    { background: #f7fee7; }
[data-skin-preview="nature"] .sp-bar { background: #65a30d; }
[data-skin-preview="nature"] .sp-dot { background: #365314; }
[data-skin-preview="dark-pro"]  { background: #0f172a; }
[data-skin-preview="dark-pro"] .sp-bar { background: #60a5fa; }
[data-skin-preview="dark-pro"] .sp-dot { background: #f1f5f9; }

.skin-label {
  font-size: 13px;
  font-weight: 600;
  color: var(--mao-text);
  text-align: center;
}

/* Bing wallpapers */
.bing-error {
  padding: 10px;
  border-radius: 6px;
  background: rgba(239,68,68,0.1);
  color: #dc2626;
  font-size: 13px;
  margin-bottom: 10px;
}
.wallpaper-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 8px;
}
.wallpaper-tile {
  aspect-ratio: 16 / 10;
  border-radius: var(--radius-md);
  background-color: var(--mao-bg);
  background-size: cover;
  background-position: center;
  cursor: pointer;
  border: 2px solid transparent;
  transition: all var(--transition-fast);
  display: flex;
  align-items: center;
  justify-content: center;
}
.wallpaper-tile:hover { transform: scale(1.04); }
.wallpaper-tile.active {
  border-color: var(--mao-primary);
  box-shadow: 0 0 0 2px var(--mao-primary-soft);
}
.no-wallpaper {
  background: var(--mao-bg);
  color: var(--mao-text-secondary);
  font-size: 12px;
  font-weight: 500;
}

/* Custom URL */
.custom-input {
  width: 100%;
  padding: 10px 12px;
  border: 1px solid var(--mao-border);
  border-radius: var(--radius-sm);
  background: var(--mao-surface);
  color: var(--mao-text);
  font-size: 13px;
  margin-bottom: 8px;
}
.custom-input:focus { outline: none; border-color: var(--mao-primary); }

.apply-btn, .ghost-btn {
  padding: 8px 14px;
  border: 1px solid var(--mao-border);
  border-radius: var(--radius-sm);
  background: var(--mao-surface);
  color: var(--mao-text-secondary);
  font-size: 13px;
  cursor: pointer;
  transition: all var(--transition-fast);
}
.ghost-btn:disabled { opacity: 0.5; cursor: not-allowed; }
.apply-btn:hover, .ghost-btn:hover:not(:disabled) {
  border-color: var(--mao-primary);
  color: var(--mao-primary);
}

/* Opacity slider */
.opacity-slider {
  width: 100%;
  margin: 4px 0;
  accent-color: var(--mao-primary);
}
.hint {
  font-size: 12px;
  color: var(--mao-text-muted);
  margin-top: 6px;
  line-height: 1.5;
}
.anonymous-hint {
  padding: 10px;
  background: var(--mao-primary-soft);
  border-radius: var(--radius-sm);
  color: var(--mao-text-secondary);
}

.save-global-btn {
  width: 100%;
  padding: 12px;
  background: var(--mao-primary);
  color: #fff;
  border: none;
  border-radius: var(--radius-md);
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: background var(--transition-fast);
}
.save-global-btn:hover:not(:disabled) { background: var(--mao-primary-hover); }
.save-global-btn:disabled { opacity: 0.6; cursor: not-allowed; }

/* Transitions */
.drawer-enter-active, .drawer-leave-active {
  transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}
.drawer-enter-from, .drawer-leave-to { transform: translateX(100%); }

.fade-enter-active, .fade-leave-active { transition: opacity 0.2s; }
.fade-enter-from, .fade-leave-to { opacity: 0; }

@media (max-width: 480px) {
  .theme-drawer { width: 100vw; }
  .skin-grid { grid-template-columns: 1fr 1fr; }
}
</style>
