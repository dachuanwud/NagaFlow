#!/bin/bash
# NagaFlow Backend 启动脚本

echo "🚀 启动 NagaFlow Backend..."

# 切换到backend目录
cd "$(dirname "$0")"

# 检查虚拟环境是否存在
if [ ! -d "venv" ]; then
    echo "❌ 虚拟环境不存在，请先运行安装脚本"
    exit 1
fi

# 设置环境变量并启动服务器
echo "📡 启动服务器在 http://localhost:8000"
PYTHONPATH=./venv/lib/python3.13/site-packages /opt/homebrew/bin/python3 main.py
