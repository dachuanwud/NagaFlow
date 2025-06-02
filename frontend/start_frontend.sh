#!/bin/bash

# NagaFlow 前端启动脚本
# 确保在正确的端口启动开发服务器

echo "🚀 启动 NagaFlow 前端开发服务器..."

# 设置 Node.js 路径
export PATH="/opt/homebrew/bin:$PATH"

# 检查 Node.js 是否可用
if ! command -v node &> /dev/null; then
    echo "❌ 错误: Node.js 未找到"
    echo "请确保 Node.js 已安装并在 PATH 中"
    exit 1
fi

# 检查 npm 是否可用
if ! command -v npm &> /dev/null; then
    echo "❌ 错误: npm 未找到"
    echo "请确保 npm 已安装并在 PATH 中"
    exit 1
fi

# 进入前端目录
cd "$(dirname "$0")"

# 检查是否在正确的目录
if [ ! -f "package.json" ]; then
    echo "❌ 错误: 未找到 package.json 文件"
    echo "请确保在前端项目根目录运行此脚本"
    exit 1
fi

# 检查依赖是否已安装
if [ ! -d "node_modules" ]; then
    echo "📦 安装依赖..."
    npm install
fi

# 检查端口 5173 是否被占用
if lsof -Pi :5173 -sTCP:LISTEN -t >/dev/null ; then
    echo "⚠️  端口 5173 已被占用"
    echo "正在尝试停止现有服务..."
    
    # 尝试优雅地停止现有服务
    PID=$(lsof -Pi :5173 -sTCP:LISTEN -t)
    if [ ! -z "$PID" ]; then
        kill $PID
        sleep 2
        
        # 如果还在运行，强制停止
        if lsof -Pi :5173 -sTCP:LISTEN -t >/dev/null ; then
            kill -9 $PID
            sleep 1
        fi
    fi
fi

echo "🌐 启动开发服务器在端口 5173..."
echo "📱 应用将在以下地址可用:"
echo "   本地:   http://localhost:5173/"
echo "   网络:   http://$(ipconfig getifaddr en0):5173/ (如果可用)"
echo ""
echo "🔧 开发服务器功能:"
echo "   - 热重载 (Hot Reload)"
echo "   - 错误覆盖 (Error Overlay)"
echo "   - API 代理到 http://localhost:8003"
echo ""
echo "⏹️  按 Ctrl+C 停止服务器"
echo ""

# 启动开发服务器
npm run dev -- --port 5173 --host
