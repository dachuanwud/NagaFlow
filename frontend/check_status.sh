#!/bin/bash

# NagaFlow 前端状态检查脚本

echo "🔍 NagaFlow 前端状态检查"
echo "=========================="

# 检查当前目录
echo "📁 当前目录: $(pwd)"

# 检查Node.js和npm
echo ""
echo "🔧 环境检查:"
export PATH="/opt/homebrew/bin:$PATH"

if command -v node &> /dev/null; then
    echo "✅ Node.js: $(node --version)"
else
    echo "❌ Node.js 未找到"
fi

if command -v npm &> /dev/null; then
    echo "✅ npm: $(npm --version)"
else
    echo "❌ npm 未找到"
fi

# 检查package.json
echo ""
echo "📦 项目检查:"
if [ -f "package.json" ]; then
    echo "✅ package.json 存在"
else
    echo "❌ package.json 不存在"
fi

# 检查node_modules
if [ -d "node_modules" ]; then
    echo "✅ node_modules 存在"
else
    echo "❌ node_modules 不存在，需要运行 npm install"
fi

# 检查配置文件
echo ""
echo "⚙️  配置文件检查:"
if [ -f "vite.config.ts" ]; then
    echo "✅ vite.config.ts 存在"
else
    echo "❌ vite.config.ts 不存在"
fi

if [ -f "tsconfig.json" ]; then
    echo "✅ tsconfig.json 存在"
else
    echo "❌ tsconfig.json 不存在"
fi

if [ -f "index.html" ]; then
    echo "✅ index.html 存在"
else
    echo "❌ index.html 不存在"
fi

# 检查端口占用
echo ""
echo "🌐 端口检查:"
if lsof -Pi :5173 -sTCP:LISTEN -t >/dev/null ; then
    PID=$(lsof -Pi :5173 -sTCP:LISTEN -t)
    echo "⚠️  端口 5173 被占用 (PID: $PID)"
    
    # 检查是否是我们的Vite服务器
    if ps aux | grep $PID | grep -q vite; then
        echo "✅ 正在运行 Vite 开发服务器"
    else
        echo "❌ 端口被其他进程占用"
    fi
else
    echo "✅ 端口 5173 可用"
fi

# 检查网络连接
echo ""
echo "🔗 网络检查:"
if curl -s -I http://localhost:5173/ >/dev/null 2>&1; then
    echo "✅ 前端服务器响应正常"
    
    # 检查状态码
    STATUS=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:5173/)
    echo "📊 HTTP状态码: $STATUS"
    
    if [ "$STATUS" = "200" ]; then
        echo "✅ 页面加载正常"
    else
        echo "⚠️  页面返回状态码: $STATUS"
    fi
else
    echo "❌ 前端服务器无响应"
fi

# 检查后端连接
echo ""
echo "🔌 后端连接检查:"
if curl -s -I http://localhost:8003/ >/dev/null 2>&1; then
    echo "✅ 后端服务器响应正常"
else
    echo "⚠️  后端服务器无响应（前端将使用演示数据）"
fi

# 检查关键文件
echo ""
echo "📄 关键文件检查:"
KEY_FILES=(
    "src/main.tsx"
    "src/App.tsx"
    "src/pages/Results/index.tsx"
    "src/components/BacktestResults/StrategySelector.tsx"
    "src/stores/backtestResultsStore.ts"
)

for file in "${KEY_FILES[@]}"; do
    if [ -f "$file" ]; then
        echo "✅ $file"
    else
        echo "❌ $file 缺失"
    fi
done

# 总结
echo ""
echo "📋 状态总结:"
echo "=========================="

if lsof -Pi :5173 -sTCP:LISTEN -t >/dev/null && curl -s -I http://localhost:5173/ >/dev/null 2>&1; then
    echo "🎉 前端服务正常运行"
    echo "🌐 访问地址: http://localhost:5173/"
    echo ""
    echo "📱 可用页面:"
    echo "   - 主页: http://localhost:5173/"
    echo "   - 回测结果: http://localhost:5173/results"
    echo "   - 回测页面: http://localhost:5173/backtest"
    echo "   - 数据管理: http://localhost:5173/data"
    echo "   - 策略管理: http://localhost:5173/strategies"
else
    echo "❌ 前端服务未正常运行"
    echo ""
    echo "🔧 启动建议:"
    echo "   1. 确保在 frontend 目录中"
    echo "   2. 运行: ./start_frontend.sh"
    echo "   3. 或手动运行: npm run dev -- --port 5173 --host"
fi

echo ""
echo "⏰ 检查完成时间: $(date)"
