#!/bin/bash

echo "=========================================="
echo "认知智能体 - 本地部署脚本"
echo "=========================================="

# 检查 Node.js
if ! command -v node &> /dev/null; then
    echo "❌ 请先安装 Node.js 18+"
    exit 1
fi

# 检查 pnpm
if ! command -v pnpm &> /dev/null; then
    echo "❌ 请先安装 pnpm:"
    echo "   npm install -g pnpm"
    exit 1
fi

echo "✅ 环境检查通过"
echo ""

# 检查 .env.local
if [ ! -f .env.local ]; then
    echo "⚠️  未找到 .env.local 文件"
    echo "📝 正在创建 .env.local ..."
    cp .env.example .env.local
    echo ""
    echo "⚠️  请编辑 .env.local 文件，填入你的 API Key："
    echo "   ARK_API_KEY=your-api-key-here"
    echo ""
    echo "   获取 API Key: https://console.volcengine.com/ark"
    echo ""
    read -p "配置完成后按回车继续..."
fi

# 安装依赖
echo "📦 安装依赖..."
pnpm install

echo ""
echo "=========================================="
echo "✅ 安装完成！"
echo ""
echo "🚀 启动开发服务器:"
echo "   pnpm dev"
echo ""
echo "🌐 访问地址:"
echo "   http://localhost:5000"
echo ""
echo "📖 更多信息请查看 README-DEPLOY.md"
echo "=========================================="
