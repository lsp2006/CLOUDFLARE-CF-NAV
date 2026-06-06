# 猫猫导航 mao_nav

> 一个极简美观的个人导航站,数据存储在 Cloudflare KV,后台编辑秒级生效,完全脱离 GitHub API。

[![Vue 3](https://img.shields.io/badge/Vue-3.5-42b883)](https://vuejs.org/)
[![Vite](https://img.shields.io/badge/Vite-5-646cff)](https://vitejs.dev/)
[![Cloudflare Pages](https://img.shields.io/badge/Cloudflare-Pages-f38020)](https://pages.cloudflare.com/)
[![License](https://img.shields.io/badge/License-MIT-yellow)](LICENSE)

## ✨ 核心功能

- 🗂️ **分类管理 + 拖拽排序** —— 后台编辑分类与网站,实时保存到 KV
- 🎨 **8 套行业皮肤** —— 科技蓝/商务金/医疗绿/教育紫/创意粉/极简灰/自然绿/深色专业
- 🌅 **Bing 每日壁纸** —— 服务端代理,自动加载近 8 天壁纸,透明度可调
- 🪟 **玻璃拟态 UI** —— 头部 + 侧栏毛玻璃背景,卡片悬停动效
- 🌙 **夜间模式** —— 跟随系统或手动切换
- 🔍 **实时搜索 + 快捷键** —— `Ctrl+K` 聚焦,`Esc` 清除,`/` 快速搜索
- 🔒 **后台密码可改** —— 管理后台直接修改,无需登录 CF 面板
- 📦 **JSON 导入/导出** —— 数据备份与跨环境迁移
- 📱 **响应式 + PWA-ready** —— 移动端优化,可装到手机主屏

## 🛠 技术栈

- **前端**: Vue 3 + `<script setup>` + Pinia + Vue Router + Vite 5
- **后端**: Cloudflare Pages Functions (Edge Workers)
- **存储**: Cloudflare KV (单 binding 多 key)
- **认证**: SHA-256 token + iat 7 天过期
- **部署**: Cloudflare Pages (`wrangler pages deploy`)

## 🚀 部署到 Cloudflare Pages

### 0. 准备工作

```bash
# 安装 wrangler CLI 并登录 Cloudflare
npm install -g wrangler
wrangler login
```

### 1. 克隆并安装依赖

```bash
git clone <your-fork-url> mao_nav
cd mao_nav
npm install
```

### 2. 创建 KV namespace

```bash
# 生产 namespace
npx wrangler kv namespace create NAV_KV
# 预览 namespace (本地开发用)
npx wrangler kv namespace create NAV_KV --preview
```

把输出的 `id` 和 `preview_id` 填入 `wrangler.toml`:

```toml
[[kv_namespaces]]
binding = "NAV_KV"
id = "你的生产 namespace id"
preview_id = "你的预览 namespace id"
```

### 3. 配置本地开发密钥

```bash
echo "ADMIN_PASSWORD=你设的强密码" > .dev.vars
```

### 4. 种子化初始数据

```bash
# 种子到预览 namespace (本地 dev 用)
npm run kv:seed
# 种子到生产 namespace (上线前)
node scripts/seed-kv.mjs --remote
```

### 5. 本地全栈调试

```bash
npm run build
npm run pages:dev
# 浏览器打开 http://localhost:8788
# 管理后台 http://localhost:8788/admin
```

### 6. 首次部署

```bash
# 创建 Pages 项目
npx wrangler pages project create mao-nav --production-branch master

# 设置生产环境密钥
npx wrangler pages secret put ADMIN_PASSWORD --project-name mao-nav
# 提示后输入密码

# 部署
npx wrangler pages deploy dist --project-name mao-nav --branch master
```

### 7. 配置 KV 绑定 (首次必做)

部署后,需要把 KV namespace 绑定到 Pages 项目的生产环境。

**方法 A — Dashboard**: Cloudflare Dashboard → Workers & Pages → `mao-nav` → Settings → Functions → KV namespace bindings → Add binding:
- Variable name: `NAV_KV`
- KV namespace: 选你创建的生产 namespace

**方法 B — API (推荐脚本化)**:

```bash
ACCOUNT_ID="你的 Cloudflare 账户 ID"
KV_ID="你的生产 namespace ID"
CF_TOKEN=$(grep oauth_token ~/.wrangler/config/default.toml | cut -d'"' -f2)

curl -X PATCH \
  "https://api.cloudflare.com/client/v4/accounts/$ACCOUNT_ID/pages/projects/mao-nav" \
  -H "Authorization: Bearer $CF_TOKEN" \
  -H "Content-Type: application/json" \
  -d "{\"deployment_configs\":{\"production\":{\"kv_namespaces\":{\"NAV_KV\":{\"namespace_id\":\"$KV_ID\"}}}}}"
```

绑定后**重新部署一次**让 Functions 拿到新绑定:

```bash
npx wrangler pages deploy dist --project-name mao-nav --branch master
```

### 8. 验证

```bash
# 测试公开接口
curl https://mao-nav-xxx.pages.dev/api/data

# 测试管理员登录
curl -X POST https://mao-nav-xxx.pages.dev/api/verify \
  -H "Content-Type: application/json" \
  -d '{"password":"你的密码"}'
```

### 9. 自定义域名 (可选)

CF Dashboard → Pages → 项目 → Custom domains → Set up a custom domain → 输入你的域名(CNAME 自动配置)。

## 🔑 环境变量

| 变量 | 作用域 | 必填 | 说明 |
|------|--------|------|------|
| `ADMIN_PASSWORD` | 服务端 secret | ✅ | 管理员登录密码,数据 PUT 鉴权 |
| `VITE_OPEN_LOCK` | 构建期 | ⛔ | 设任意非空值开启公开站访问锁 |

**本地**: `.dev.vars`(已 gitignore)
**生产**: CF Dashboard → Settings → Environment variables

## 📁 项目结构

```
mao_nav/
├── functions/
│   ├── _lib/auth.js          # 共享 token 认证
│   └── api/
│       ├── data.js           # GET 公开导航数据 / PUT 鉴权写入
│       ├── verify.js         # POST 密码 → token
│       ├── password.js       # PUT 改密码 (写入 KV)
│       ├── settings.js       # GET/PUT 视觉配置
│       └── bing.js           # GET Bing 壁纸代理
├── src/
│   ├── apis/dataClient.js    # 前端请求层
│   ├── stores/
│   │   ├── nav.js            # 导航数据
│   │   ├── auth.js           # 认证状态
│   │   ├── theme.js          # 暗黑模式
│   │   └── settings.js       # 视觉配置
│   ├── skins.js              # 8 套皮肤定义
│   ├── components/
│   │   ├── base/             # ToastContainer / SkeletonGrid / ThemePanel
│   │   └── admin/            # 管理后台组件
│   ├── views/
│   │   ├── NavHomeView.vue   # 公开首页
│   │   └── AdminView.vue     # /admin 管理后台
│   └── mock/mock_data.js     # 初始种子数据
├── scripts/seed-kv.mjs       # KV 种子化脚本
├── wrangler.toml             # CF Pages 配置
└── .env.example
```

## 🗄️ KV 数据模型

| Key | 用途 |
|-----|------|
| `nav:data` | `{ title, search, categories: [...] }` 导航数据 |
| `nav:settings` | `{ logo, footerText, footerLink, sidebarCollapsed, bgType, bgUrl, bgOpacity, skinId }` 视觉配置 |
| `admin:password` | 后台修改的新密码(可选,默认走环境变量) |

## 📦 NPM Scripts

| 命令 | 说明 |
|------|------|
| `npm run dev` | Vite 本地开发(无 Functions) |
| `npm run build` | 生产构建 |
| `npm run pages:dev` | 全栈本地调试(含 Functions + KV) |
| `npm run kv:seed` | 种子预览 KV |
| `npm run kv:seed:preview` | 同上 |
| `npm run kv:dump` | 导出生产 KV 数据 |
| `npm run lint` | ESLint 修复 |

## 🎨 主题快捷面板

公开页右上角 ⚙️ 按钮 → 抽屉:
- 夜间模式切换
- 8 套行业皮肤(点击即时预览)
- 8 张 Bing 壁纸网格(或自定义 URL)
- 透明度滑块
- 管理员登录后可保存为站点全局默认

未登录用户的调整为本地预览,刷新后恢复站点默认。

## 🔧 数据备份

后台 → 系统设置 → 📦 数据备份 → 导出 JSON / 从 JSON 导入。

或用 wrangler CLI:

```bash
npx wrangler kv key get nav:data --binding NAV_KV --remote > backup.json
```

## 🩹 回滚

误操作后:
1. CF Dashboard → Pages → Deployments → 回滚到上一次成功部署
2. 或从备份 JSON 导入: 后台 → 数据备份 → 从 JSON 导入

## 📜 License

MIT
