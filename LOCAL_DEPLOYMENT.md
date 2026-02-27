# 🚀 数字神经元系统 V6 - 本地部署指南

本指南将帮助你在本地电脑上部署和运行数字神经元系统，实现真正的本地自动化能力（如打开浏览器、操作文件等）。

---

## 📋 环境要求

| 项目 | 版本要求 | 检查命令 |
|------|---------|---------|
| Node.js | >= 20.x | `node -v` |
| pnpm | >= 9.x | `pnpm -v` |
| Git | 最新版 | `git --version` |

### 安装 Node.js

```bash
# macOS (推荐使用 fnm)
brew install fnm
fnm install 20
fnm use 20

# Windows (推荐使用 fnm 或 nvm-windows)
winget install Schniz.fnm
fnm install 20
fnm use 20

# Linux
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs
```

### 安装 pnpm

```bash
npm install -g pnpm
```

---

## 🛠️ 快速开始

### 1. 克隆/下载项目

```bash
# 如果你有 Git 仓库地址
git clone <你的仓库地址>
cd projects

# 或者直接下载项目压缩包解压后进入目录
```

### 2. 安装依赖

```bash
pnpm install
```

### 3. 配置环境变量

创建 `.env.local` 文件：

```bash
# 复制示例文件（如果有的话）
cp .env.example .env.local

# 或直接创建
touch .env.local
```

编辑 `.env.local`，配置以下变量：

```env
# ═══════════════════════════════════════════════════════════════════
# 🔑 必需配置 - LLM API (用于 AI 对话能力)
# ═══════════════════════════════════════════════════════════════════

# Coze API 配置（推荐）
# 获取地址: https://www.coze.cn/open/oauth/pats
COZE_API_KEY=your_coze_api_key_here

# 或使用其他兼容 OpenAI 格式的 API
# OPENAI_API_KEY=your_openai_api_key
# OPENAI_BASE_URL=https://api.openai.com/v1  # 可选，自定义 API 地址

# ═══════════════════════════════════════════════════════════════════
# 🗄️ 可选配置 - 数据库持久化（不配置则使用内存存储）
# ═══════════════════════════════════════════════════════════════════

# Supabase 配置（推荐）
# 获取地址: https://supabase.com/dashboard
COZE_SUPABASE_URL=https://your-project.supabase.co
COZE_SUPABASE_ANON_KEY=your_supabase_anon_key

# ═══════════════════════════════════════════════════════════════════
# 📦 可选配置 - 对象存储（用于文件上传等功能）
# ═══════════════════════════════════════════════════════════════════

COZE_BUCKET_ENDPOINT_URL=https://your-bucket.s3.region.amazonaws.com
COZE_BUCKET_NAME=your-bucket-name
COZE_BUCKET_ACCESS_KEY=your_access_key
COZE_BUCKET_SECRET_KEY=your_secret_key

# ═══════════════════════════════════════════════════════════════════
# 🖥️ 本地自动化配置（本地部署时启用）
# ═══════════════════════════════════════════════════════════════════

# 启用本地自动化能力（打开浏览器、执行命令等）
ENABLE_LOCAL_AUTOMATION=true

# 允许访问的路径（逗号分隔）
LOCAL_ALLOWED_PATHS=/home,/Users,/Users/你的用户名/Desktop,/Users/你的用户名/Downloads

# 浏览器路径（可选，不设置则使用系统默认）
# CHROME_PATH=/Applications/Google Chrome.app/Contents/MacOS/Google Chrome
```

### 4. 启动开发服务器

```bash
# 开发模式（支持热更新）
pnpm dev

# 或使用默认端口 5000
npx next dev --port 5000
```

### 5. 访问应用

打开浏览器访问：**http://localhost:5000**

---

## 🌐 配置 LLM API

### 方案 A：使用 Coze（推荐）

1. 访问 [Coze 平台](https://www.coze.cn/)
2. 注册/登录账号
3. 进入 [个人访问令牌](https://www.coze.cn/open/oauth/pats) 页面
4. 创建新的令牌，复制到 `.env.local` 的 `COZE_API_KEY`

### 方案 B：使用 OpenAI

```env
OPENAI_API_KEY=sk-xxxxx
OPENAI_BASE_URL=https://api.openai.com/v1  # 或代理地址
```

### 方案 C：使用国内模型（如 DeepSeek、通义千问）

```env
# DeepSeek
OPENAI_API_KEY=sk-xxxxx
OPENAI_BASE_URL=https://api.deepseek.com/v1

# 通义千问
OPENAI_API_KEY=sk-xxxxx
OPENAI_BASE_URL=https://dashscope.aliyuncs.com/compatible-mode/v1
```

---

## 🗄️ 配置数据库（可选但推荐）

### 使用 Supabase（推荐，免费额度充足）

1. 访问 [Supabase](https://supabase.com/)，注册账号
2. 创建新项目
3. 进入 **Settings → API**
4. 复制以下值到 `.env.local`：
   - `URL` → `COZE_SUPABASE_URL`
   - `anon public` → `COZE_SUPABASE_ANON_KEY`

### 使用本地 PostgreSQL

```env
DATABASE_URL=postgresql://user:password@localhost:5432/neuron_v6
```

---

## 🤖 本地自动化能力

本地部署后，系统可以执行真正的电脑操作：

### 支持的自动化功能

| 功能 | 命令示例 | 说明 |
|------|---------|------|
| 打开浏览器 | "打开百度" | 自动打开默认浏览器访问网站 |
| 文件操作 | "读取桌面上的 test.txt" | 读写本地文件 |
| 执行命令 | "运行 python script.py" | 执行系统命令 |
| 截屏 | "截个图看看" | 捕获屏幕内容 |
| 应用控制 | "打开 VS Code" | 启动本地应用 |

### 安全提示

⚠️ 本地自动化会直接操作你的电脑，请：

1. **不要在不受信任的环境启用** `ENABLE_LOCAL_AUTOMATION=true`
2. **限制可访问路径**，只开放必要的目录
3. **审查 AI 的操作请求**，系统会提示确认危险操作

---

## 🔧 常见问题

### Q: 安装依赖失败？

```bash
# 清除缓存重试
pnpm store prune
rm -rf node_modules
pnpm install
```

### Q: 端口被占用？

```bash
# 查找占用进程
lsof -i :5000  # macOS/Linux
netstat -ano | findstr :5000  # Windows

# 使用其他端口
pnpm dev --port 3000
```

### Q: LLM 调用失败？

1. 检查 API Key 是否正确
2. 检查网络连接（国内用户可能需要代理）
3. 查看 API 额度是否充足

### Q: 数据库连接失败？

1. 确认 Supabase 项目状态正常
2. 检查 URL 和 Key 是否正确
3. 如果不使用数据库，可以删除相关配置，系统会使用内存存储

---

## 📦 生产部署

### 构建生产版本

```bash
pnpm build
```

### 启动生产服务

```bash
pnpm start
# 或指定端口
PORT=3000 pnpm start
```

### Docker 部署（可选）

```dockerfile
FROM node:20-alpine
WORKDIR /app
RUN npm install -g pnpm
COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile
COPY . .
RUN pnpm build
EXPOSE 5000
CMD ["pnpm", "start"]
```

---

## 🎯 下一步

- 访问 http://localhost:5000 开始对话
- 尝试说 "打开百度" 测试本地自动化
- 在设置中调整 AI 人格和偏好
- 探索更多工具和功能

有问题？查看项目文档或提交 Issue！
