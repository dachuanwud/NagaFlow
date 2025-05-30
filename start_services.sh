#!/bin/bash

# NagaFlow Services Startup Script
# 解决网络连接问题的完整启动脚本

set -e

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 日志函数
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# 检查并设置PATH
setup_path() {
    log_info "设置环境变量..."
    
    # 添加Homebrew路径
    if [[ -d "/opt/homebrew/bin" ]]; then
        export PATH="/opt/homebrew/bin:$PATH"
        log_success "已添加Homebrew路径到PATH"
    fi
    
    # 检查Node.js和npm
    if ! command -v node &> /dev/null; then
        log_error "Node.js未安装或不在PATH中"
        log_info "请安装Node.js: brew install node"
        exit 1
    fi
    
    if ! command -v npm &> /dev/null; then
        log_error "npm未安装或不在PATH中"
        exit 1
    fi
    
    log_success "Node.js $(node --version) 和 npm $(npm --version) 已就绪"
}

# 检查端口占用
check_ports() {
    log_info "检查端口占用情况..."
    
    # 检查后端端口
    for port in 8000 8001 8002 8003 8004; do
        if lsof -i :$port &> /dev/null; then
            log_warning "端口 $port 已被占用"
        fi
    done
    
    # 检查前端端口
    for port in 3000 3001 3002 3003 3004; do
        if lsof -i :$port &> /dev/null; then
            log_warning "端口 $port 已被占用"
        fi
    done
}

# 启动后端服务
start_backend() {
    log_info "启动后端服务..."
    
    cd backend
    
    # 检查虚拟环境
    if [[ ! -d "venv" ]]; then
        log_error "后端虚拟环境不存在，请先运行: python3 -m venv venv"
        exit 1
    fi
    
    # 激活虚拟环境并安装依赖
    source venv/bin/activate
    
    if [[ -f "requirements.txt" ]]; then
        log_info "安装后端依赖..."
        pip install -r requirements.txt > /dev/null 2>&1
    fi
    
    # 启动后端服务器
    log_info "启动FastAPI服务器..."
    python main.py &
    BACKEND_PID=$!
    
    # 等待后端启动
    sleep 3
    
    # 检查后端是否启动成功
    for port in 8000 8001 8002 8003 8004; do
        if curl -s http://localhost:$port/health &> /dev/null; then
            log_success "后端服务已启动在端口 $port"
            BACKEND_PORT=$port
            break
        fi
    done
    
    if [[ -z "$BACKEND_PORT" ]]; then
        log_error "后端服务启动失败"
        exit 1
    fi
    
    cd ..
}

# 启动前端服务
start_frontend() {
    log_info "启动前端服务..."
    
    cd frontend
    
    # 检查node_modules
    if [[ ! -d "node_modules" ]]; then
        log_info "安装前端依赖..."
        npm install
    fi
    
    # 启动前端开发服务器
    log_info "启动Vite开发服务器..."
    npm run dev &
    FRONTEND_PID=$!
    
    # 等待前端启动
    sleep 5
    
    # 检查前端是否启动成功
    for port in 3000 3001 3002 3003 3004 3005; do
        if curl -s http://localhost:$port &> /dev/null; then
            log_success "前端服务已启动在端口 $port"
            FRONTEND_PORT=$port
            break
        fi
    done
    
    if [[ -z "$FRONTEND_PORT" ]]; then
        log_error "前端服务启动失败"
        exit 1
    fi
    
    cd ..
}

# 测试连接
test_connection() {
    log_info "测试前后端连接..."
    
    # 测试后端API
    if curl -s http://localhost:$BACKEND_PORT/health | grep -q "healthy"; then
        log_success "后端API连接正常"
    else
        log_error "后端API连接失败"
        return 1
    fi
    
    # 测试前端代理
    if curl -s http://localhost:$FRONTEND_PORT/api/data/status | grep -q "status"; then
        log_success "前端代理连接正常"
    else
        log_error "前端代理连接失败"
        return 1
    fi
    
    log_success "所有连接测试通过!"
}

# 清理函数
cleanup() {
    log_info "正在关闭服务..."
    
    if [[ ! -z "$BACKEND_PID" ]]; then
        kill $BACKEND_PID 2>/dev/null || true
    fi
    
    if [[ ! -z "$FRONTEND_PID" ]]; then
        kill $FRONTEND_PID 2>/dev/null || true
    fi
    
    log_success "服务已关闭"
}

# 主函数
main() {
    echo "🌊 NagaFlow Services Startup Script"
    echo "=================================="
    
    # 设置清理陷阱
    trap cleanup EXIT INT TERM
    
    # 检查是否在正确的目录
    if [[ ! -f "README.md" ]] || [[ ! -d "backend" ]] || [[ ! -d "frontend" ]]; then
        log_error "请在NagaFlow项目根目录运行此脚本"
        exit 1
    fi
    
    setup_path
    check_ports
    start_backend
    start_frontend
    test_connection
    
    echo ""
    log_success "🎉 NagaFlow服务启动完成!"
    echo ""
    echo "📊 服务信息:"
    echo "   后端API: http://localhost:$BACKEND_PORT"
    echo "   前端界面: http://localhost:$FRONTEND_PORT"
    echo "   API文档: http://localhost:$BACKEND_PORT/docs"
    echo ""
    echo "按 Ctrl+C 停止所有服务"
    
    # 保持脚本运行
    wait
}

# 运行主函数
main "$@"
