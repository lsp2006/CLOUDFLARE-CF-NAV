<template>
  <div class="site-manager">
    <div class="manager-header">
      <h2>🌐 站点管理</h2>
      <div class="header-actions">
        <select v-model="selectedCategoryId" class="category-filter">
          <option value="">所有分类</option>
          <option v-for="category in localCategories" :key="category.id" :value="category.id">
            {{ category.icon }} {{ category.name }}
          </option>
        </select>
        <button @click="openAddModal" class="add-btn">
          ➕ 添加站点
        </button>
        <button @click="$emit('save')" :disabled="loading" class="save-btn">
          {{ loading ? '保存中...' : '💾 保存到 KV' }}
        </button>
      </div>
    </div>

    <div class="stats-bar">
      <div class="stat-item">
        <span class="stat-number">{{ totalSites }}</span>
        <span class="stat-label">总站点数</span>
      </div>
      <div class="stat-item">
        <span class="stat-number">{{ localCategories.length }}</span>
        <span class="stat-label">分类数</span>
      </div>
      <div class="stat-item">
        <span class="stat-number">{{ filteredSites.length }}</span>
        <span class="stat-label">当前显示</span>
      </div>
      <div class="stat-info">
        💡 提示:选择分类后可拖拽排序,拖到页面边缘会自动滚动
      </div>
    </div>

    <div class="sites-list">
      <draggable
        v-model="currentPageSites"
        v-bind="dragOptions"
        item-key="id"
        tag="div"
        class="draggable-list"
        :class="{ 'pagination-disabled': !selectedCategoryId }"
      >
        <template #item="{ element: site }">
          <div
            class="site-item"
            :class="{ 'draggable-item': selectedCategoryId }"
          >
            <div class="drag-handle" v-if="selectedCategoryId" title="拖拽排序">
              ⋮⋮
            </div>
            <div class="site-info">
              <div class="site-icon">
                <img :src="site.icon" :alt="site.name" @error="handleImageError">
              </div>
              <div class="site-details">
                <h3>{{ site.name }}</h3>
                <p class="site-description">{{ site.description }}</p>
                <a :href="site.url" target="_blank" rel="noopener noreferrer" class="site-url">
                  {{ site.url }}
                </a>
                <span class="site-category">
                  {{ getCategoryName(site.categoryId) }}
                </span>
              </div>
            </div>
            <div class="site-actions">
              <button @click="editSite(site)" class="edit-btn">
                ✏️ 编辑
              </button>
              <button @click="deleteSite(site)" class="delete-btn">
                🗑️ 删除
              </button>
            </div>
          </div>
        </template>
      </draggable>

      <div v-if="!selectedCategoryId" class="pagination-notice">
        💡 请选择具体分类以启用拖拽排序功能
      </div>

      <div v-if="selectedCategoryId && filteredSites.length > 5" class="drag-help">
        🖱️ 拖拽到页面顶部或底部边缘可自动滚动
      </div>
    </div>

    <div v-if="showAddModal || editingSite" class="modal-overlay">
      <div class="modal-content">
        <div class="modal-header">
          <h3>
            {{ editingSite ? '编辑站点' : '添加站点' }}
            <span v-if="!editingSite && formData.categoryId" class="category-hint">
              → {{ getCategoryName(formData.categoryId) }}
            </span>
          </h3>
          <button @click="closeModal" class="close-btn">✕</button>
        </div>

        <form @submit.prevent="saveSite" class="site-form">
          <div class="form-row">
            <div class="form-group">
              <label>站点名称 *:</label>
              <input
                v-model="formData.name"
                required
                placeholder="请输入站点名称"
                class="form-input"
              >
            </div>
            <div class="form-group">
              <label>所属分类 *:</label>
              <select v-model="formData.categoryId" required class="form-input">
                <option value="">请选择分类</option>
                <option v-for="category in localCategories" :key="category.id" :value="category.id">
                  {{ category.icon }} {{ category.name }}
                </option>
              </select>
            </div>
          </div>

          <div class="form-group">
            <label>站点地址 *:</label>
            <input
              v-model="formData.url"
              type="url"
              required
              placeholder="https://example.com"
              class="form-input"
              @blur="onUrlBlur"
            >
          </div>

          <div class="form-group">
            <label>站点描述:</label>
            <textarea
              v-model="formData.description"
              placeholder="请输入站点描述"
              class="form-textarea"
              rows="3"
            ></textarea>
          </div>

          <div class="form-group">
            <label>站点图标:</label>
            <div class="icon-input-group">
              <input
                v-model="formData.icon"
                placeholder="留空将根据 URL 自动生成"
                class="form-input"
              >
              <button type="button" @click="autoDetectIcon" class="auto-icon-btn">
                🔍 自动获取
              </button>
            </div>
            <p class="icon-hint">
              留空提交时,会自动派生为 <code>https://www.faviconextractor.com/favicon/{域名}</code>
            </p>
            <div class="icon-preview" v-if="formData.icon">
              <img :src="formData.icon" alt="图标预览" @error="onPreviewError">
            </div>
          </div>

          <div class="form-actions">
            <button type="button" @click="closeModal" class="cancel-btn">取消</button>
            <button type="submit" class="submit-btn">
              {{ editingSite ? '更新' : '添加' }}
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, ref, watch } from 'vue'
import draggable from 'vuedraggable'
import { toast } from '../../composables/useToast.js'

const props = defineProps({
  categories: {
    type: Array,
    default: () => [],
  },
  initialSelectedCategoryId: {
    type: String,
    default: '',
  },
  loading: {
    type: Boolean,
    default: false,
  },
})

const emit = defineEmits(['update', 'save'])

const localCategories = ref([])
const selectedCategoryId = ref('')
const showAddModal = ref(false)
const editingSite = ref(null)

const formData = ref({
  name: '',
  url: '',
  description: '',
  icon: '',
  categoryId: '',
})

watch(
  () => props.categories,
  (next) => {
    localCategories.value = JSON.parse(JSON.stringify(next || []))
  },
  { immediate: true, deep: true },
)

watch(
  () => props.initialSelectedCategoryId,
  (next) => {
    if (next) selectedCategoryId.value = next
  },
  { immediate: true },
)

function syncToParent() {
  emit('update', localCategories.value)
}

const allSites = computed(() =>
  localCategories.value.flatMap((category) =>
    (category.sites || []).map((site) => ({ ...site, categoryId: category.id })),
  ),
)

const totalSites = computed(() => allSites.value.length)

const filteredSites = computed(() => {
  if (!selectedCategoryId.value) return allSites.value
  return allSites.value.filter((site) => site.categoryId === selectedCategoryId.value)
})

const currentPageSites = computed({
  get() {
    return filteredSites.value
  },
  set(next) {
    if (!selectedCategoryId.value) return
    const category = localCategories.value.find((c) => c.id === selectedCategoryId.value)
    if (!category) return
    category.sites = next.map((site) => ({
      id: site.id,
      name: site.name,
      url: site.url,
      description: site.description,
      icon: site.icon,
    }))
    syncToParent()
  },
})

const dragOptions = computed(() => ({
  animation: 200,
  group: 'sites',
  disabled: !selectedCategoryId.value,
  ghostClass: 'sortable-ghost',
  scroll: true,
  forceAutoScrollFallback: true,
  scrollSensitivity: 100,
  scrollSpeed: 15,
  bubbleScroll: true,
}))

function getCategoryName(categoryId) {
  const category = localCategories.value.find((c) => c.id === categoryId)
  return category ? `${category.icon} ${category.name}` : '未分类'
}

/**
 * Derive a favicon URL from the site URL via the public extractor service.
 * @param {string} siteUrl
 * @returns {string}
 */
function deriveFaviconUrl(siteUrl) {
  try {
    const { host } = new URL(siteUrl)
    return `https://www.faviconextractor.com/favicon/${host}`
  } catch {
    return ''
  }
}

function onUrlBlur() {
  if (!formData.value.icon && formData.value.url) {
    const derived = deriveFaviconUrl(formData.value.url)
    if (derived) formData.value.icon = derived
  }
}

function autoDetectIcon() {
  if (!formData.value.url) {
    toast.warning('请先输入站点地址')
    return
  }
  const derived = deriveFaviconUrl(formData.value.url)
  if (!derived) {
    toast.warning('URL 格式不正确')
    return
  }
  formData.value.icon = derived
}

function onPreviewError(event) {
  event.target.src = '/favicon.ico'
  event.target.onerror = null
}

function editSite(site) {
  editingSite.value = site
  showAddModal.value = false
  formData.value = {
    name: site.name,
    url: site.url,
    description: site.description || '',
    icon: site.icon || '',
    categoryId: site.categoryId,
  }
}

function deleteSite(site) {
  if (!confirm(`确定要删除站点"${site.name}"吗?`)) return
  const category = localCategories.value.find((c) => c.id === site.categoryId)
  if (category && category.sites) {
    category.sites = category.sites.filter((s) => s.id !== site.id)
    syncToParent()
  }
}

function saveSite() {
  const category = localCategories.value.find((c) => c.id === formData.value.categoryId)
  if (!category) {
    toast.warning('请选择有效的分类')
    return
  }
  if (!category.sites) category.sites = []

  const icon = formData.value.icon.trim() || deriveFaviconUrl(formData.value.url)

  if (editingSite.value) {
    const originalCategory = localCategories.value.find(
      (c) => c.sites && c.sites.some((s) => s.id === editingSite.value.id),
    )
    const updated = {
      id: editingSite.value.id,
      name: formData.value.name,
      url: formData.value.url,
      description: formData.value.description,
      icon,
    }
    if (originalCategory && originalCategory.id === formData.value.categoryId) {
      const i = originalCategory.sites.findIndex((s) => s.id === editingSite.value.id)
      if (i !== -1) originalCategory.sites[i] = updated
    } else {
      if (originalCategory) {
        originalCategory.sites = originalCategory.sites.filter((s) => s.id !== editingSite.value.id)
      }
      category.sites.push(updated)
    }
  } else {
    category.sites.push({
      id: `site-${Date.now()}`,
      name: formData.value.name,
      url: formData.value.url,
      description: formData.value.description,
      icon,
    })
  }

  syncToParent()
  closeModal()
}

function openAddModal() {
  showAddModal.value = true
  formData.value = {
    name: '',
    url: '',
    description: '',
    icon: '',
    categoryId: selectedCategoryId.value || localCategories.value[0]?.id || '',
  }
}

function closeModal() {
  showAddModal.value = false
  editingSite.value = null
  formData.value = { name: '', url: '', description: '', icon: '', categoryId: '' }
}

function handleImageError(event) {
  event.target.src = '/favicon.ico'
  event.target.onerror = null
}
</script>

<style scoped>
.site-manager {
  padding: 20px 0;
}

.manager-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  padding-bottom: 20px;
  border-bottom: 2px solid #e9ecef;
}

.manager-header h2 {
  color: #2c3e50;
  margin: 0;
  font-size: 24px;
}

.header-actions {
  display: flex;
  align-items: center;
  gap: 15px;
}

.category-filter {
  padding: 8px 12px;
  border: 2px solid #e1e1e1;
  border-radius: 4px;
  font-size: 14px;
  background: white;
  cursor: pointer;
}

.add-btn,
.save-btn {
  padding: 10px 20px;
  border: none;
  border-radius: 6px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s ease;
}

.add-btn {
  background: #27ae60;
  color: white;
}

.add-btn:hover {
  background: #219a52;
}

.save-btn {
  background: #3498db;
  color: white;
}

.save-btn:hover:not(:disabled) {
  background: #2980b9;
}

.save-btn:disabled {
  background: #bdc3c7;
  cursor: not-allowed;
}

.stats-bar {
  display: grid;
  grid-template-columns: repeat(3, 1fr) 2fr;
  gap: 20px;
  margin-bottom: 30px;
  align-items: center;
}

.stat-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 15px;
  background: #f8f9fa;
  border-radius: 8px;
  border: 1px solid #e9ecef;
}

.stat-number {
  font-size: 24px;
  font-weight: 600;
  color: #3498db;
}

.stat-label {
  font-size: 12px;
  color: #7f8c8d;
  margin-top: 5px;
}

.stat-info {
  display: flex;
  align-items: center;
  padding: 12px 15px;
  background: linear-gradient(135deg, #e8f5e8, #f0f8ff);
  border-radius: 8px;
  border-left: 4px solid #27ae60;
  color: #2c3e50;
  font-size: 13px;
  font-weight: 500;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
}

.sites-list {
  margin-bottom: 30px;
}

.draggable-list {
  display: flex;
  flex-direction: column;
  gap: 15px;
}

.pagination-notice {
  text-align: center;
  padding: 20px;
  background: #e8f5e8;
  border: 1px solid #4caf50;
  border-radius: 8px;
  color: #2e7d32;
  font-size: 14px;
  margin-top: 20px;
}

.drag-help {
  text-align: center;
  padding: 12px 20px;
  background: #e3f2fd;
  border: 1px solid #2196f3;
  border-radius: 6px;
  color: #1565c0;
  font-size: 13px;
  margin-top: 15px;
  opacity: 0.9;
}

.pagination-disabled .site-item {
  opacity: 0.8;
  cursor: default;
}

.site-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px;
  background: #f8f9fa;
  border-radius: 8px;
  border: 1px solid #e9ecef;
  transition: all 0.3s ease;
}

.site-item:hover {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.draggable-item {
  cursor: move;
  position: relative;
}

.draggable-item:hover {
  background: #f1f3f4;
  transform: translateY(-2px);
  box-shadow: 0 6px 16px rgba(0, 0, 0, 0.15);
}

.draggable-item.sortable-chosen {
  background: #e3f2fd;
  border-color: #2196f3;
  transform: rotate(3deg);
  box-shadow: 0 8px 20px rgba(33, 150, 243, 0.3);
}

.draggable-item.sortable-ghost {
  opacity: 0.5;
  background: #e8f5e8;
  border: 2px dashed #4caf50;
}

.drag-handle {
  position: absolute;
  left: 8px;
  top: 50%;
  transform: translateY(-50%);
  color: #95a5a6;
  font-size: 16px;
  font-weight: bold;
  cursor: grab;
  padding: 8px 4px;
  border-radius: 4px;
  transition: all 0.3s ease;
  user-select: none;
}

.drag-handle:hover {
  color: #3498db;
  background: rgba(52, 152, 219, 0.1);
}

.drag-handle:active {
  cursor: grabbing;
  color: #2980b9;
}

.draggable-item .site-info {
  margin-left: 30px;
}

.site-info {
  display: flex;
  align-items: center;
  gap: 15px;
  flex: 1;
}

.site-icon {
  width: 48px;
  height: 48px;
  background: white;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 1px solid #e9ecef;
  flex-shrink: 0;
}

.site-icon img {
  width: 32px;
  height: 32px;
  object-fit: contain;
}

.site-details {
  flex: 1;
}

.site-details h3 {
  margin: 0 0 5px 0;
  color: #2c3e50;
  font-size: 16px;
}

.site-description {
  margin: 0 0 5px 0;
  color: #7f8c8d;
  font-size: 14px;
}

.site-url {
  color: #3498db;
  text-decoration: none;
  font-size: 13px;
  display: block;
  margin-bottom: 5px;
}

.site-url:hover {
  text-decoration: underline;
}

.site-category {
  display: inline-block;
  background: #3498db;
  color: white;
  padding: 2px 8px;
  border-radius: 12px;
  font-size: 11px;
  font-weight: 500;
}

.site-actions {
  display: flex;
  gap: 10px;
}

.edit-btn,
.delete-btn {
  padding: 6px 12px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 12px;
  transition: all 0.3s ease;
}

.edit-btn {
  background: #f39c12;
  color: white;
}

.edit-btn:hover {
  background: #e67e22;
}

.delete-btn {
  background: #e74c3c;
  color: white;
}

.delete-btn:hover {
  background: #c0392b;
}

.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.modal-content {
  background: white;
  border-radius: 8px;
  width: 90%;
  max-width: 600px;
  max-height: 90vh;
  overflow-y: auto;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px;
  border-bottom: 1px solid #e9ecef;
}

.modal-header h3 {
  margin: 0;
  color: #2c3e50;
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 8px;
}

.category-hint {
  font-size: 14px;
  color: #3498db;
  background: #e8f4fd;
  padding: 4px 8px;
  border-radius: 12px;
  font-weight: 400;
}

.close-btn {
  background: none;
  border: none;
  font-size: 20px;
  cursor: pointer;
  color: #7f8c8d;
  padding: 5px;
  border-radius: 4px;
  transition: background-color 0.3s ease;
}

.close-btn:hover {
  background: #f8f9fa;
}

.site-form {
  padding: 20px;
}

.form-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 15px;
}

.form-group {
  margin-bottom: 20px;
}

.form-group label {
  display: block;
  margin-bottom: 8px;
  color: #555;
  font-weight: 500;
}

.form-input,
.form-textarea {
  width: 100%;
  padding: 10px;
  border: 2px solid #e1e1e1;
  border-radius: 4px;
  font-size: 14px;
  transition: border-color 0.3s ease;
}

.form-input:focus,
.form-textarea:focus {
  outline: none;
  border-color: #3498db;
}

.form-textarea {
  resize: vertical;
  font-family: inherit;
}

.icon-input-group {
  display: flex;
  gap: 10px;
}

.icon-hint {
  margin: 8px 0 0 0;
  font-size: 12px;
  color: #7f8c8d;
}

.icon-hint code {
  background: #f8f9fa;
  padding: 1px 6px;
  border-radius: 3px;
  font-size: 12px;
  color: #e74c3c;
}

.auto-icon-btn {
  padding: 10px 15px;
  background: #3498db;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
  white-space: nowrap;
  transition: background-color 0.3s ease;
}

.auto-icon-btn:hover {
  background: #2980b9;
}

.icon-preview {
  margin-top: 10px;
  padding: 10px;
  background: #f8f9fa;
  border-radius: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.icon-preview img {
  width: 32px;
  height: 32px;
  object-fit: contain;
}

.form-actions {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  margin-top: 30px;
  padding-top: 20px;
  border-top: 1px solid #e9ecef;
}

.cancel-btn,
.submit-btn {
  padding: 10px 20px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-weight: 500;
  transition: background-color 0.3s ease;
}

.cancel-btn {
  background: #95a5a6;
  color: white;
}

.cancel-btn:hover {
  background: #7f8c8d;
}

.submit-btn {
  background: #27ae60;
  color: white;
}

.submit-btn:hover {
  background: #219a52;
}

@media (max-width: 768px) {
  .manager-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 15px;
  }

  .header-actions {
    flex-wrap: wrap;
    width: 100%;
  }

  .stats-bar {
    grid-template-columns: repeat(auto-fit, minmax(100px, 1fr));
  }

  .stat-info {
    grid-column: 1 / -1;
    margin-top: 10px;
    font-size: 12px;
    padding: 10px;
  }

  .site-item {
    flex-direction: column;
    align-items: flex-start;
    gap: 15px;
  }

  .site-actions {
    align-self: flex-end;
    flex-wrap: wrap;
    gap: 8px;
  }

  .form-row {
    grid-template-columns: 1fr;
  }

  .icon-input-group {
    flex-direction: column;
  }

  .modal-header h3 {
    font-size: 18px;
    flex-direction: column;
    align-items: flex-start;
    gap: 5px;
  }

  .draggable-item .site-info {
    margin-left: 20px;
  }
}
</style>
