<template>
  <div class="system-settings">
    <div class="settings-header">
      <h2>⚙️ 系统设置</h2>
      <p>管理网站标题与默认搜索引擎</p>
    </div>

    <div class="settings-section">
      <h3>🌐 网站设置</h3>
      <div class="website-settings">
        <div class="setting-group">
          <label>网站标题:</label>
          <div class="title-input-group">
            <input
              v-model="websiteTitle"
              type="text"
              placeholder="请输入网站标题"
              class="title-input"
              maxlength="50"
            >
            <button
              @click="saveTitle"
              :disabled="titleSaving || !websiteTitle.trim() || websiteTitle === nav.title"
              class="save-title-btn"
            >
              {{ titleSaving ? '保存中...' : '💾 保存标题' }}
            </button>
          </div>
          <p class="setting-description">当前标题: {{ nav.title || '未设置' }}</p>
        </div>

        <div class="setting-group">
          <label>默认搜索引擎:</label>
          <div class="search-engine-input-group">
            <select v-model="searchEngine" class="search-engine-select">
              <option
                v-for="option in searchEngineOptions"
                :key="option.value"
                :value="option.value"
              >
                {{ option.label }}
              </option>
            </select>
            <button
              @click="saveSearchEngine"
              :disabled="searchEngineSaving || searchEngine === nav.search"
              class="save-search-engine-btn"
            >
              {{ searchEngineSaving ? '保存中...' : '💾 保存设置' }}
            </button>
          </div>
          <p class="setting-description">
            当前搜索引擎: {{ searchEngineOptions.find(opt => opt.value === nav.search)?.label || '未设置' }}
          </p>
        </div>
      </div>
    </div>

    <!-- 品牌设置 -->
    <div class="settings-section">
      <h3>🎨 品牌设置</h3>
      <div class="setting-group">
        <label>Logo 图片:</label>
        <div class="title-input-group">
          <input v-model="settings.logo" type="text" placeholder="/logo.png 或 https://... 或上传后自动填充" class="title-input">
          <input
            ref="logoFileInput"
            type="file"
            accept="image/png,image/jpeg,image/svg+xml,image/webp,image/gif"
            style="display: none"
            @change="handleLogoUpload"
          >
          <button
            type="button"
            @click="logoFileInput?.click()"
            :disabled="logoUploading"
            class="logo-upload-btn"
            title="选择本地图片上传"
          >
            {{ logoUploading ? '处理中...' : '📁 上传' }}
          </button>
          <button
            v-if="settings.logo && settings.logo.startsWith('data:')"
            type="button"
            @click="clearLogo"
            class="logo-clear-btn"
            title="还原为默认 /logo.png"
          >
            ✕
          </button>
          <div class="logo-preview-thumb">
            <img :src="settings.logo || '/logo.png'" alt="logo" @error="$event.target.src='/logo.png'">
          </div>
        </div>
        <p class="setting-description">
          支持本地路径 (如 /logo.png)、完整 URL 或本地上传 (png/jpg/svg/webp/gif,≤ 200KB,自动转 base64 存入 KV)
        </p>
      </div>

      <div class="setting-group">
        <label>左下角文案:</label>
        <input v-model="settings.footerText" type="text" placeholder="例如: 开源不易，Star一下吧！⭐" class="title-input" maxlength="60">
        <p class="setting-description">留空则隐藏左下角链接</p>
      </div>

      <div class="setting-group">
        <label>左下角链接:</label>
        <input v-model="settings.footerLink" type="url" placeholder="https://github.com/..." class="title-input">
      </div>

      <button @click="saveBrand" :disabled="brandSaving" class="save-title-btn">
        {{ brandSaving ? '保存中...' : '💾 保存品牌设置' }}
      </button>
    </div>


    <div class="settings-section">
      <h3>📦 数据备份</h3>
      <div class="backup-actions">
        <button @click="exportJson" class="export-btn">📤 导出 JSON 备份</button>
        <input
          ref="importInput"
          type="file"
          accept="application/json"
          style="display: none"
          @change="handleImport"
        >
        <button @click="importInput?.click()" class="import-btn">📥 从 JSON 导入</button>
      </div>
      <p class="setting-description">导出/导入用于跨环境迁移或紧急回滚。导入会立即覆盖当前 KV 中的全部数据。</p>
    </div>

    <div class="settings-section">
      <h3>🔒 修改管理员密码</h3>
      <form @submit.prevent="handleChangePassword" class="password-form">
        <div class="form-group">
          <label>旧密码:</label>
          <input
            v-model="pwForm.oldPassword"
            type="password"
            required
            placeholder="输入当前密码"
            class="form-input"
          >
        </div>
        <div class="form-group">
          <label>新密码:</label>
          <input
            v-model="pwForm.newPassword"
            type="password"
            required
            placeholder="至少 6 位"
            minlength="6"
            class="form-input"
          >
        </div>
        <div class="form-group">
          <label>确认新密码:</label>
          <input
            v-model="pwForm.confirmPassword"
            type="password"
            required
            placeholder="再次输入新密码"
            class="form-input"
          >
        </div>
        <button
          type="submit"
          class="save-title-btn"
          :disabled="pwChanging || !pwForm.oldPassword || !pwForm.newPassword || !pwForm.confirmPassword"
        >
          {{ pwChanging ? '修改中...' : '🔒 修改密码' }}
        </button>
      </form>
      <p class="setting-description">
        密码修改后立即生效。新密码存储在 Cloudflare KV 中，下次登录使用新密码。
      </p>
    </div>

    <div class="settings-section">
      <h3>ℹ️ 系统信息</h3>
      <div class="system-info">
        <div class="info-grid">
          <div class="info-item">
            <span class="info-label">数据存储:</span>
            <span class="info-value">Cloudflare KV (binding: NAV_KV)</span>
          </div>
          <div class="info-item">
            <span class="info-label">构建工具:</span>
            <span class="info-value">Vite</span>
          </div>
          <div class="info-item">
            <span class="info-label">分类数 / 站点数:</span>
            <span class="info-value">{{ stats.categories }} / {{ stats.sites }}</span>
          </div>
          <div class="info-item">
            <span class="info-label">浏览器:</span>
            <span class="info-value">{{ userAgent }}</span>
          </div>
        </div>
      </div>
    </div>

    <CustomDialog
      :visible="dialogVisible"
      :type="dialogType"
      :title="dialogTitle"
      :message="dialogMessage"
      :details="dialogDetails"
      @close="closeDialog"
      @confirm="closeDialog"
    />
  </div>
</template>

<script setup>
import { computed, onMounted, ref, watch } from 'vue'
import { useNavStore } from '../../stores/nav.js'
import { useSettingsStore } from '../../stores/settings.js'
import { changePassword } from '../../apis/dataClient.js'
import { toast } from '../../composables/useToast.js'
import CustomDialog from './CustomDialog.vue'

const nav = useNavStore()
const settings = useSettingsStore()
const brandSaving = ref(false)
const logoFileInput = ref(null)
const logoUploading = ref(false)
const LOGO_MAX_BYTES = 200 * 1024 // 200KB

const websiteTitle = ref(nav.title)
const titleSaving = ref(false)

const searchEngine = ref(nav.search)
const searchEngineSaving = ref(false)

const importInput = ref(null)

const pwForm = ref({ oldPassword: '', newPassword: '', confirmPassword: '' })
const pwChanging = ref(false)

const searchEngineOptions = [
  { value: 'google', label: 'Google' },
  { value: 'baidu', label: '百度' },
  { value: 'bing', label: 'Bing' },
  { value: 'duckduckgo', label: 'DuckDuckGo' },
]

const userAgent = computed(() =>
  typeof navigator !== 'undefined' ? navigator.userAgent : '',
)

const stats = computed(() => ({
  categories: nav.categories.length,
  sites: nav.categories.reduce((sum, c) => sum + (c.sites?.length || 0), 0),
}))

const dialogVisible = ref(false)
const dialogType = ref('success')
const dialogTitle = ref('')
const dialogMessage = ref('')
const dialogDetails = ref([])

function showDialog(type, title, message, details = []) {
  dialogType.value = type
  dialogTitle.value = title
  dialogMessage.value = message
  dialogDetails.value = details
  dialogVisible.value = true
}

function closeDialog() {
  dialogVisible.value = false
}

async function handleChangePassword() {
  const { oldPassword, newPassword, confirmPassword } = pwForm.value
  if (newPassword !== confirmPassword) {
    showDialog('error', '❌ 密码不匹配', '两次输入的新密码不一致')
    return
  }
  if (newPassword.length < 6) {
    showDialog('error', '❌ 密码太短', '新密码至少需要 6 位字符')
    return
  }
  pwChanging.value = true
  try {
    await changePassword(oldPassword, newPassword)
    showDialog('success', '🔒 密码已更新', '下次登录时使用新密码即可')
    pwForm.value = { oldPassword: '', newPassword: '', confirmPassword: '' }
  } catch (error) {
    showDialog('error', '❌ 修改失败', error.message)
  } finally {
    pwChanging.value = false
  }
}

watch(() => nav.title, (next) => { websiteTitle.value = next })
watch(() => nav.search, (next) => { searchEngine.value = next })

async function saveTitle() {
  const next = websiteTitle.value.trim()
  if (!next) {
    showDialog('error', '❌ 输入错误', '请输入网站标题')
    return
  }
  titleSaving.value = true
  const previous = nav.title
  nav.setTitle(next)
  try {
    await nav.save()
    showDialog('success', '🎉 标题已保存', '更新已写入 KV', [
      '• 公开站约 1 分钟内自动刷新',
    ])
  } catch (error) {
    nav.setTitle(previous)
    showDialog('error', '❌ 保存失败', error.message)
  } finally {
    titleSaving.value = false
  }
}

async function saveSearchEngine() {
  searchEngineSaving.value = true
  const previous = nav.search
  nav.setSearch(searchEngine.value)
  try {
    await nav.save()
    showDialog('success', '🎉 已保存', '默认搜索引擎已更新')
  } catch (error) {
    nav.setSearch(previous)
    showDialog('error', '❌ 保存失败', error.message)
  } finally {
    searchEngineSaving.value = false
  }
}

function exportJson() {
  const blob = new Blob(
    [JSON.stringify({ title: nav.title, search: nav.search, categories: nav.categories }, null, 2)],
    { type: 'application/json' },
  )
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = `mao_nav_backup_${new Date().toISOString().slice(0, 10)}.json`
  link.click()
  URL.revokeObjectURL(url)
}

async function handleImport(event) {
  const file = event.target.files?.[0]
  if (!file) return
  event.target.value = ''
  try {
    const text = await file.text()
    const data = JSON.parse(text)
    if (!data || !Array.isArray(data.categories) || typeof data.title !== 'string') {
      throw new Error('文件格式不正确,需要 { title, search, categories: [] }')
    }
    const snapshot = {
      title: nav.title,
      search: nav.search,
      categories: nav.categories,
    }
    nav.setTitle(data.title)
    nav.setSearch(data.search || 'bing')
    nav.setCategories(data.categories)
    try {
      await nav.save()
      showDialog('success', '🎉 导入成功', '数据已写入 KV', [
        `• 分类数: ${data.categories.length}`,
      ])
    } catch (error) {
      nav.setTitle(snapshot.title)
      nav.setSearch(snapshot.search)
      nav.setCategories(snapshot.categories)
      throw error
    }
  } catch (error) {
    showDialog('error', '❌ 导入失败', error.message)
  }
}

async function saveBrand() {
  brandSaving.value = true
  try {
    await settings.save()
    toast.success('品牌设置已保存')
  } catch (err) {
    toast.error('保存失败: ' + err.message)
  } finally {
    brandSaving.value = false
  }
}

async function handleLogoUpload(event) {
  const file = event.target.files?.[0]
  event.target.value = ''
  if (!file) return

  if (!file.type.startsWith('image/')) {
    toast.error('请选择图片文件')
    return
  }
  if (file.size > LOGO_MAX_BYTES) {
    toast.error(`图片过大 (${(file.size / 1024).toFixed(1)}KB),请压缩到 ${LOGO_MAX_BYTES / 1024}KB 以内`)
    return
  }

  logoUploading.value = true
  try {
    const dataUrl = await new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = () => resolve(reader.result)
      reader.onerror = () => reject(new Error('读取文件失败'))
      reader.readAsDataURL(file)
    })
    settings.logo = dataUrl
    toast.success(`图片已加载 (${(file.size / 1024).toFixed(1)}KB),点 "保存品牌设置" 写入 KV`)
  } catch (err) {
    toast.error(err.message)
  } finally {
    logoUploading.value = false
  }
}

function clearLogo() {
  settings.logo = '/logo.png'
  toast.success('已还原为默认 logo')
}


onMounted(() => {
  if (!nav.loaded) {
    nav.fetch().catch(() => { /* AdminView already surfaces this */ })
  }
  if (!settings.loaded) {
    settings.fetch().catch(() => { /* defaults remain */ })
  }
})
</script>

<style scoped>
.system-settings {
  padding: 20px 0;
}

.settings-header {
  margin-bottom: 40px;
}

.settings-header h2 {
  color: #2c3e50;
  margin: 0 0 10px 0;
  font-size: 24px;
}

.settings-header p {
  color: #7f8c8d;
  margin: 0;
  font-size: 16px;
}

.settings-section {
  margin-bottom: 40px;
  padding: 25px;
  background: #f8f9fa;
  border-radius: 8px;
  border: 1px solid #e9ecef;
}

.settings-section h3 {
  color: #2c3e50;
  margin: 0 0 20px 0;
  font-size: 18px;
  font-weight: 600;
}

.website-settings {
  display: flex;
  flex-direction: column;
  gap: 30px;
}

.setting-group {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.setting-group label {
  font-weight: 600;
  color: #2c3e50;
  font-size: 16px;
}

.setting-description {
  color: #7f8c8d;
  font-size: 13px;
  margin: 5px 0 0 0;
}

.title-input-group,
.search-engine-input-group {
  display: flex;
  gap: 10px;
  align-items: center;
}

.title-input,
.search-engine-select {
  flex: 1;
  padding: 10px 15px;
  border: 2px solid #e9ecef;
  border-radius: 6px;
  font-size: 14px;
  transition: border-color 0.3s ease;
  background: white;
}

.title-input:focus,
.search-engine-select:focus {
  outline: none;
  border-color: #3498db;
}

.save-title-btn,
.save-search-engine-btn,
.export-btn,
.import-btn {
  padding: 10px 20px;
  background: #3498db;
  color: white;
  border: none;
  border-radius: 6px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s ease;
  white-space: nowrap;
}

.save-title-btn:hover:not(:disabled),
.save-search-engine-btn:hover:not(:disabled),
.export-btn:hover,
.import-btn:hover {
  background: #2980b9;
}

.save-title-btn:disabled,
.save-search-engine-btn:disabled {
  background: #bdc3c7;
  cursor: not-allowed;
}

.backup-actions {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
}

.import-btn {
  background: #27ae60;
}

.import-btn:hover {
  background: #219a52;
}

.system-info {
  background: white;
  border-radius: 6px;
  border: 1px solid #e9ecef;
  padding: 20px;
}

.info-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 15px;
}

.info-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px;
  background: #f8f9fa;
  border-radius: 4px;
}

.info-label {
  font-weight: 500;
  color: #2c3e50;
}

.info-value {
  color: #7f8c8d;
  font-family: monospace;
  font-size: 13px;
  max-width: 220px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

@media (max-width: 768px) {
  .info-grid {
    grid-template-columns: 1fr;
  }

  .info-item {
    flex-direction: column;
    align-items: flex-start;
    gap: 5px;
  }

  .info-value {
    max-width: none;
    word-break: break-all;
    white-space: normal;
  }

  .title-input-group,
  .search-engine-input-group {
    flex-direction: column;
    align-items: stretch;
  }
}

/* ── Brand + Appearance additions ────────────────────────────── */
.logo-preview-thumb {
  width: 48px;
  height: 48px;
  border-radius: 8px;
  border: 1px solid #e9ecef;
  background: #f8f9fa;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  overflow: hidden;
}
.logo-preview-thumb img {
  width: 100%;
  height: 100%;
  object-fit: contain;
}

.logo-upload-btn {
  padding: 10px 16px;
  background: #27ae60;
  color: white;
  border: none;
  border-radius: 6px;
  font-weight: 500;
  cursor: pointer;
  transition: background 0.2s ease;
  white-space: nowrap;
  flex-shrink: 0;
}
.logo-upload-btn:hover:not(:disabled) { background: #219a52; }
.logo-upload-btn:disabled { background: #bdc3c7; cursor: not-allowed; }

.logo-clear-btn {
  width: 32px;
  height: 32px;
  padding: 0;
  border: 1px solid #e74c3c;
  border-radius: 6px;
  background: white;
  color: #e74c3c;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  flex-shrink: 0;
}
.logo-clear-btn:hover { background: #e74c3c; color: white; }

.skin-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(160px, 1fr));
  gap: 12px;
  margin-top: 8px;
}
.skin-card {
  padding: 14px;
  border: 2px solid #e9ecef;
  border-radius: 10px;
  cursor: pointer;
  background: white;
  transition: all 0.2s ease;
}
.skin-card:hover {
  border-color: #3498db;
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0,0,0,0.08);
}
.skin-card.active {
  border-color: #3498db;
  box-shadow: 0 0 0 3px rgba(52,152,219,0.15);
}
.skin-preview {
  height: 60px;
  border-radius: 6px;
  margin-bottom: 10px;
  position: relative;
  overflow: hidden;
}
.sp-bar {
  position: absolute;
  top: 8px;
  left: 8px;
  right: 8px;
  height: 6px;
  border-radius: 3px;
}
.sp-dot {
  position: absolute;
  bottom: 8px;
  left: 8px;
  width: 16px;
  height: 16px;
  border-radius: 50%;
}
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
  font-size: 14px;
  font-weight: 600;
  color: #2c3e50;
  margin-bottom: 2px;
}
.skin-desc {
  font-size: 12px;
  color: #7f8c8d;
}

.wallpaper-controls {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
}
.bg-btn {
  padding: 10px 16px;
  background: #3498db;
  color: white;
  border: none;
  border-radius: 6px;
  font-weight: 500;
  cursor: pointer;
}
.bg-btn:hover { background: #2980b9; }
.bg-btn-secondary { background: #95a5a6; }
.bg-btn-secondary:hover { background: #7f8c8d; }

.opacity-slider {
  width: 100%;
  margin-top: 8px;
  accent-color: #3498db;
}
</style>
