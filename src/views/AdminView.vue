<template>
  <div class="admin-container">
    <!-- 登录界面 -->
    <div v-if="!auth.isAuthenticated" class="login-container">
      <div class="login-box">
        <h1>🔐 管理员登录</h1>
        <form @submit.prevent="handleLogin">
          <div class="form-group">
            <label for="password">管理密钥:</label>
            <input
              id="password"
              type="password"
              v-model="loginPassword"
              placeholder="请输入管理密钥"
              required
              class="form-input"
            />
          </div>
          <button type="submit" class="login-btn" :disabled="loggingIn">
            {{ loggingIn ? '验证中...' : '登录' }}
          </button>
        </form>
        <div v-if="loginError" class="error-message">
          {{ loginError }}
        </div>
      </div>
    </div>

    <!-- 管理界面 -->
    <div v-else class="admin-dashboard">
      <header class="admin-header">
        <div class="header-content">
          <h1>🛠️ 导航站管理</h1>
          <div class="header-actions">
            <span class="user-info">管理员</span>
            <button @click="handleLogout" class="logout-btn">退出</button>
          </div>
        </div>
      </header>

      <main class="admin-main">
        <div v-if="nav.loading" class="loading-overlay">
          <div class="loading-content">
            <div class="loading-spinner"></div>
            <p>正在加载数据...</p>
          </div>
        </div>

        <div class="admin-tabs">
          <button
            class="tab-btn"
            :class="{ active: activeTab === 'categories' }"
            @click="activeTab = 'categories'"
          >
            📁 分类管理
          </button>
          <button
            class="tab-btn"
            :class="{ active: activeTab === 'sites' }"
            @click="switchToSiteTab"
          >
            🌐 站点管理
          </button>
          <button
            class="tab-btn"
            :class="{ active: activeTab === 'settings' }"
            @click="activeTab = 'settings'"
          >
            ⚙️ 系统设置
          </button>
        </div>

        <div v-if="activeTab === 'categories'" class="tab-content">
          <CategoryManager
            :categories="nav.categories"
            @update="handleCategoriesUpdate"
            @save="handleSave"
            @viewSites="switchToSiteManager"
            :loading="nav.saving"
          />
        </div>

        <div v-if="activeTab === 'sites'" class="tab-content">
          <SiteManager
            :categories="nav.categories"
            :initialSelectedCategoryId="selectedCategoryId"
            @update="handleCategoriesUpdate"
            @save="handleSave"
            :loading="nav.saving"
          />
        </div>

        <div v-if="activeTab === 'settings'" class="tab-content">
          <SystemSettings />
        </div>
      </main>
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
import { onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import CategoryManager from '../components/admin/CategoryManager.vue'
import SiteManager from '../components/admin/SiteManager.vue'
import SystemSettings from '../components/admin/SystemSettings.vue'
import CustomDialog from '../components/admin/CustomDialog.vue'
import { useAuthStore } from '../stores/auth.js'
import { useNavStore } from '../stores/nav.js'

const router = useRouter()
const auth = useAuthStore()
const nav = useNavStore()

const loginPassword = ref('')
const loginError = ref('')
const loggingIn = ref(false)

const activeTab = ref('categories')
const selectedCategoryId = ref('')

const dialogVisible = ref(false)
const dialogType = ref('success')
const dialogTitle = ref('')
const dialogMessage = ref('')
const dialogDetails = ref([])

async function loadData() {
  try {
    await nav.fetch({ force: true })
  } catch (error) {
    showDialog('error', '❌ 加载失败', '从 KV 加载导航数据失败', [
      `• 错误详情: ${error.message}`,
      '• 请确认 KV 已绑定并完成种子化(npm run kv:seed)',
    ])
  }
}

async function handleLogin() {
  loggingIn.value = true
  loginError.value = ''
  try {
    await auth.login(loginPassword.value)
    loginPassword.value = ''
    await loadData()
  } catch (error) {
    loginError.value = error.message
  } finally {
    loggingIn.value = false
  }
}

function handleLogout() {
  auth.logout()
  router.push('/')
}

function handleCategoriesUpdate(newCategories) {
  nav.setCategories(newCategories)
}

function switchToSiteManager(categoryId) {
  selectedCategoryId.value = categoryId
  activeTab.value = 'sites'
}

function switchToSiteTab() {
  selectedCategoryId.value = ''
  activeTab.value = 'sites'
}

async function handleSave() {
  try {
    await nav.save()
    showDialog('success', '🎉 保存成功', '您的更改已写入 Cloudflare KV', [
      '• 公开站约 1 分钟内自动刷新(边缘缓存已主动失效)',
      '• 如需立即看到效果,请硬刷新页面',
    ])
  } catch (error) {
    if (error?.status === 401) {
      auth.logout()
      showDialog('error', '❌ 登录已过期', '请重新登录后再次保存', [
        `• 错误详情: ${error.message}`,
      ])
    } else {
      showDialog('error', '❌ 保存失败', '保存过程中发生错误,请重试', [
        `• 错误详情: ${error.message}`,
      ])
    }
  }
}

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

onMounted(async () => {
  if (auth.isAuthenticated) {
    await loadData()
  }
})
</script>

<style scoped>
.admin-container {
  min-height: 100vh;
  background: #2c3e50;
}

.login-container {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
  padding: 20px;
}

.login-box {
  background: white;
  padding: 40px;
  border-radius: 12px;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
  width: 100%;
  max-width: 400px;
}

.login-box h1 {
  text-align: center;
  margin-bottom: 30px;
  color: #2c3e50;
  font-size: 24px;
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

.form-input {
  width: 100%;
  padding: 12px;
  border: 2px solid #e1e1e1;
  border-radius: 6px;
  font-size: 16px;
  transition: border-color 0.3s ease;
}

.form-input:focus {
  outline: none;
  border-color: #3498db;
}

.login-btn {
  width: 100%;
  padding: 12px;
  background: #3498db;
  color: white;
  border: none;
  border-radius: 6px;
  font-size: 16px;
  font-weight: 500;
  cursor: pointer;
  transition: background-color 0.3s ease;
}

.login-btn:hover:not(:disabled) {
  background: #2980b9;
}

.login-btn:disabled {
  background: #bdc3c7;
  cursor: not-allowed;
}

.error-message {
  margin-top: 15px;
  padding: 10px;
  background: #ffebee;
  color: #c62828;
  border-radius: 4px;
  text-align: center;
  font-size: 14px;
}

.admin-dashboard {
  min-height: 100vh;
  background: #f5f7fa;
}

.admin-header {
  background: white;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
  position: sticky;
  top: 0;
  z-index: 100;
}

.header-content {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 15px 30px;
  max-width: 1200px;
  margin: 0 auto;
}

.header-content h1 {
  color: #2c3e50;
  margin: 0;
  font-size: 20px;
}

.header-actions {
  display: flex;
  align-items: center;
  gap: 15px;
}

.user-info {
  color: #7f8c8d;
  font-size: 14px;
}

.logout-btn {
  padding: 8px 16px;
  background: #e74c3c;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
  transition: background-color 0.3s ease;
}

.logout-btn:hover {
  background: #c0392b;
}

.admin-main {
  max-width: 1200px;
  margin: 0 auto;
  padding: 30px;
}

.loading-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(255, 255, 255, 0.9);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 9999;
  backdrop-filter: blur(3px);
}

.loading-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  background: white;
  padding: 40px;
  border-radius: 12px;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.2);
}

.loading-spinner {
  width: 40px;
  height: 40px;
  border: 4px solid #f3f3f3;
  border-top: 4px solid #3498db;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin-bottom: 20px;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.admin-tabs {
  display: flex;
  background: white;
  border-radius: 8px;
  padding: 5px;
  margin-bottom: 30px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
}

.tab-btn {
  flex: 1;
  padding: 12px 20px;
  background: none;
  border: none;
  cursor: pointer;
  font-size: 14px;
  font-weight: 500;
  color: #7f8c8d;
  border-radius: 4px;
  transition: all 0.3s ease;
}

.tab-btn.active {
  background: #3498db;
  color: white;
}

.tab-btn:hover:not(.active) {
  background: #f8f9fa;
  color: #2c3e50;
}

.tab-content {
  background: white;
  border-radius: 8px;
  padding: 30px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
}

@media (max-width: 768px) {
  .header-content {
    padding: 15px 20px;
  }

  .admin-main {
    padding: 20px 15px;
  }

  .tab-content {
    padding: 20px 15px;
  }

  .admin-tabs {
    flex-direction: column;
  }

  .tab-btn {
    margin-bottom: 5px;
  }
}
</style>
