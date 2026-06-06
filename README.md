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
- **部署**: Cloudflare Pages (Git 连接 + Dashboard 配置,**全程网页操作,零命令行**)

## 🚀 部署到 Cloudflare Pages (零命令行)

> 全程在浏览器完成,不需要装 wrangler、Node.js、git CLI。你只要有 GitHub 账号和 Cloudflare 账号。

### Step 1 · Fork 本仓库到自己的 GitHub

打开本仓库页面 → 右上角 `Fork` → 选你的账号 → `Create fork`。
保留默认仓库名即可。

### Step 2 · 创建 KV 命名空间(存导航数据)

进 [Cloudflare Dashboard](https://dash.cloudflare.com) → 左侧 **Storage & Databases** → **KV** → `+ Create a namespace`:
- Namespace name: `NAV_KV`
- 点 `Add`

记下页面上显示的 **Namespace ID**(类似 `592feb8c4be9417b8dbbfc2b0f6a40cf`),稍后绑定要用。

### Step 3 · 用 Git 连接 Pages 自动构建

Dashboard → 左侧 **Workers & Pages** → 顶部 `Create` → **Pages** 选项卡 → `Connect to Git`:

1. **Select a repository**: 授权 GitHub → 选你刚 fork 的 `mao_nav`
2. **Set up builds and deployments**:
   - Project name: `mao-nav`(或任意你喜欢的名字)
   - Production branch: `master`
   - Framework preset: **None**
   - Build command: `npm run build`
   - Build output directory: `dist`
3. 点 `Save and Deploy`

等 1~2 分钟,首次构建会成功,你能看到 `xxx.pages.dev` 的 URL。但**先不要访问** — API 还跑不通,因为 KV 和密码都没绑。

### Step 4 · 绑定 KV 到 Pages 项目

Pages 项目页 → **Settings** → **Bindings**(老版本叫 **Functions**)→ `+ Add` → **KV namespace**:
- Variable name: `NAV_KV`(必须严格大写,跟代码里一致)
- KV namespace: 下拉选 `NAV_KV`
- 点 `Save`

### Step 5 · 设置管理员密码

同一个 Settings 页 → **Variables and Secrets** → `+ Add`:
- Variable name: `ADMIN_PASSWORD`
- Type: **Secret**(不是 Plaintext!)
- Value: 你的强密码(至少 8 位,记牢)
- 点 `Save`

### Step 6 · 重新部署让绑定生效

Pages 项目页 → **Deployments** 标签 → 最新一行右侧 `⋯` → **Retry deployment**。
等绿色 ✓ 出现,部署完成。

### Step 7 · 首次登录后台导入数据

打开 `https://你的项目.pages.dev/admin` → 输入 Step 5 设的密码登录(此时还没有导航数据,会显示空状态)。

进 **系统设置** → 滚动到 **📦 数据备份** → 点 **📥 从 JSON 导入** → 选择仓库根目录的 [`seed.json`](./seed.json)(60 个示例站点,12 个分类)。

导入成功后回到首页 (`/`),刷新即可看到导航。后续可在后台增删改任意分类与站点,实时写入 KV。

### Step 8 · 自定义域名 (可选)

Pages 项目页 → **Custom domains** → `Set up a custom domain` → 输入你的域名 → 按提示完成 CNAME 配置。

### Step 9 · 启用访问锁 (可选)

如果你想让公开站本身也需要密码才能访问(私人导航),Settings → Variables and Secrets → `+ Add` 一个**构建期变量**:
- Variable name: `VITE_OPEN_LOCK`
- Type: **Plaintext**
- Value: `true`

然后 Retry deployment。所有访客都得输入 `ADMIN_PASSWORD` 才能进首页。

---

### 🔧 替代方案:命令行部署 (高级用户)

如果你装了 Node.js 和 wrangler CLI,也可以走命令行流程:

<details>
<summary>展开命令行部署步骤</summary>

```bash
# 1. 装 wrangler 并登录
npm install -g wrangler
wrangler login

# 2. 克隆并安装依赖
git clone <你的-fork-url> mao_nav
cd mao_nav
npm install

# 3. 创建 KV namespace
npx wrangler kv namespace create NAV_KV
npx wrangler kv namespace create NAV_KV --preview
# 把输出的 id / preview_id 填入 wrangler.toml

# 4. 配置本地密钥(本地全栈调试用)
echo "ADMIN_PASSWORD=你的强密码" > .dev.vars

# 5. 种子化初始数据(填充 mock 60 个站点到 KV)
npm run kv:seed          # 预览 namespace(本地用)
node scripts/seed-kv.mjs --remote   # 生产 namespace(上线用)

# 6. 本地全栈调试(含 Functions + KV)
npm run build
npm run pages:dev
# 浏览器打开 http://localhost:8788

# 7. 首次部署
npx wrangler pages project create mao-nav --production-branch master
npx wrangler pages secret put ADMIN_PASSWORD --project-name mao-nav
npx wrangler pages deploy dist --project-name mao-nav --branch master

# 8. 绑定 KV(首次必做,Dashboard 操作见 Step 4)然后重 deploy
npx wrangler pages deploy dist --project-name mao-nav --branch master
```

</details>

## 🔑 环境变量

| 变量 | 作用域 | 必填 | 在哪里设 | 说明 |
|------|--------|------|---------|------|
| `ADMIN_PASSWORD` | 服务端 Secret | ✅ | Pages → Settings → Variables and Secrets (Secret 类型) | 管理员登录密码,数据 PUT 鉴权 |
| `VITE_OPEN_LOCK` | 构建期 Plaintext | ⛔ | Pages → Settings → Variables and Secrets (Plaintext 类型) | 设任意非空值开启公开站访问锁 |

> 本地 wrangler 调试时,服务端密钥写到项目根目录的 `.dev.vars`(已 gitignore)。

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
├── scripts/seed-kv.mjs       # KV 种子化脚本 (CLI 部署用)
├── seed.json                 # 初始数据,后台 → 数据备份 → 导入
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
