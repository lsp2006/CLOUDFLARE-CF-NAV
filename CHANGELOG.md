# Changelog

## [3.3.0] — 2026-06-06

### 新增
- **主题快捷面板** —— 公开页右上角悬浮齿轮按钮 → 抽屉,包含夜间模式/皮肤/壁纸/透明度
- **Bing 壁纸服务端代理** —— 新 `GET /api/bing`,返回近 8 天 Bing 每日壁纸 `[{url, thumb, title, copyright}]`,边缘缓存 6h
- **壁纸网格** —— 8 张缩略图直接预览选择,自定义 URL 支持

### 修复
- 壁纸点击无效 —— `.nav-home` 实底背景遮挡 `.bg-wallpaper` 层,移除后正常显示

### 改动
- 后台「外观主题」区块迁移到公开页 FAB,后台只保留品牌设置
- 搜索栏右侧日/夜切换按钮移除(整合到 FAB)

## [3.2.0] — 2026-06-05

### 新增
- **`nav:settings` KV key** —— `{ logo, footerText, footerLink, sidebarCollapsed, bgType, bgUrl, bgOpacity, skinId }`
- **`GET/PUT /api/settings`** —— 公开读取 + 鉴权写入的视觉配置端点
- **`src/stores/settings.js`** —— Pinia 视觉配置 store
- **8 套行业皮肤** —— 科技蓝 / 商务金 / 医疗绿 / 教育紫 / 创意粉 / 极简灰 / 自然绿 / 深色专业
- **品牌设置** —— Logo URL、左下角文案、链接均后台可改
- **侧栏折叠按钮** —— 主内容区与侧栏边界处 ◀/▶ 按钮,状态持久化
- **背景壁纸支持** —— Bing 每日 / 自定义 URL / 透明度滑块 0-90%

## [3.1.0] — 2026-06-05

### 视觉美化升级
- **设计令牌体系** —— 重写 `src/assets/base.css`,引入完整 CSS 变量(颜色/间距/圆角/阴影/动画)
- **玻璃拟态** —— 头部 `backdrop-filter: blur(16px)`,侧栏 `blur(12px)` 半透明背景
- **卡片动效** —— 悬停 `translateY(-4px)` + 阴影加深 + 渐变光晕,点击 `scale(0.98)`
- **Toast 通知系统** —— 替代原生 alert(),`useToast` composable + 全局 ToastContainer
- **骨架屏加载** —— SkeletonCard + SkeletonGrid 替代转圈 spinner
- **路由过渡动画** —— 页面切换 fade+slide
- **实时搜索过滤** —— 按名称/URL/描述,`Ctrl+K` 聚焦,`Esc` 清除
- **字体优化** —— 引入 Inter + Noto Sans SC Google Fonts
- **NavHomeView CSS 压缩** —— 1522→913 行(-40%),`.dark` 块 200→10 行(变量驱动)

## [3.0.0] — 2026-06-05

### 重构:数据存储迁移到 Cloudflare KV

**破坏性变更**
- 不再依赖 GitHub API 读写导航数据
- 不再需要 `GITHUB_TOKEN`、`VITE_GITHUB_OWNER`、`VITE_GITHUB_REPO`、`VITE_GITHUB_BRANCH` 环境变量
- 不支持 Vercel 部署(仅 Cloudflare Pages)
- 站点图标上传功能已移除,新站点将自动使用 favicon 外部服务

**新增**
- 数据存储在 Cloudflare KV(key: `nav:data`),读写延迟 < 100ms
- 7 天自动过期的管理员 token
- 管理后台改密码(`PUT /api/password`,写入 KV `admin:password`)
- JSON 导入/导出备份
- `npm run kv:seed` / `kv:seed:preview` / `kv:dump` 管理脚本
- `npm run pages:dev` 本地全栈调试

**架构变更**
- Pinia Store 模块化: nav(数据)、auth(认证)、theme(主题)
- 统一请求层 `src/apis/dataClient.js`
- 共享认证工具 `functions/_lib/auth.js`
- `functions/api/data.js`: GET(边缘缓存) + PUT(认证写入 + 缓存失效)

**删除**
- `api/` Vercel Functions
- `vercel.json`
- `functions/api/github.js`
- `src/apis/useGitHubAPI.js`
- `src/apis/useNavigation.js`
- `src/views/HomeView.vue`、`AboutView.vue`、`TestView.vue`
- `src/components/HelloWorld.vue`、`TheWelcome.vue`、`WelcomeItem.vue`、`icons/*`
- `src/stores/counter.js`(拆分为 theme.js)

## [2.0.0] — earlier

- 初始版本: Vue 3 + Vite + GitHub API 数据持久化
