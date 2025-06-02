"""
NagaFlow Backend - FastAPI应用主入口
集成现有的bn_data和crypto_cta模块，支持数据库持久化
"""
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from contextlib import asynccontextmanager
import uvicorn
import sys
import os
import logging

# 添加现有模块到Python路径
sys.path.append(os.path.join(os.path.dirname(__file__), '..', 'bn_data'))
sys.path.append(os.path.join(os.path.dirname(__file__), '..', 'crypto_cta'))

from app.api import data, backtest, strategies
from app.core.config import settings
from app.database.connection import init_db, close_db
from app.services.database_service import db_service

# 配置日志
logging.basicConfig(
    level=getattr(logging, settings.log_level.upper()),
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    """应用生命周期管理"""
    # 启动时的初始化
    logger.info("🚀 NagaFlow Backend starting...")

    try:
        # 初始化数据库
        if not settings.use_memory_storage:
            logger.info("初始化数据库连接...")
            await init_db()
            logger.info("✅ 数据库初始化完成")
        else:
            logger.info("使用内存存储模式")

        # 设置数据库服务模式
        if settings.use_memory_storage:
            db_service.switch_to_memory_mode()
        else:
            db_service.switch_to_database_mode()

        logger.info(f"数据库模式: {'内存存储' if settings.use_memory_storage else '持久化存储'}")

    except Exception as e:
        logger.error(f"应用启动失败: {e}")
        raise

    yield

    # 关闭时的清理
    logger.info("🛑 NagaFlow Backend shutting down...")

    try:
        if not settings.use_memory_storage:
            await close_db()
            logger.info("✅ 数据库连接已关闭")
    except Exception as e:
        logger.error(f"关闭数据库连接失败: {e}")


# 创建FastAPI应用
app = FastAPI(
    title="NagaFlow API",
    description="加密货币量化交易系统Web API",
    version="1.0.0",
    lifespan=lifespan
)

# 配置CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:3000", "http://localhost:3001"],  # Vite默认端口
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 静态文件服务
static_dir = os.path.join(os.path.dirname(__file__), "static")
if not os.path.exists(static_dir):
    os.makedirs(static_dir)
app.mount("/static", StaticFiles(directory=static_dir), name="static")

# 注册API路由
app.include_router(data.router, prefix="/api/data", tags=["数据管理"])
app.include_router(backtest.router, prefix="/api/backtest", tags=["回测"])
app.include_router(strategies.router, prefix="/api/strategies", tags=["策略管理"])


@app.get("/")
async def root():
    """根路径"""
    return {
        "message": "Welcome to NagaFlow API",
        "version": "1.0.0",
        "docs": "/docs",
        "database_mode": "内存存储" if settings.use_memory_storage else "持久化存储"
    }


@app.get("/health")
async def health_check():
    """健康检查"""
    return {
        "status": "healthy",
        "service": "NagaFlow Backend",
        "database_mode": "memory" if settings.use_memory_storage else "persistent",
        "database_url": settings.async_database_url if not settings.use_memory_storage else "memory"
    }


@app.post("/admin/switch-storage-mode")
async def switch_storage_mode(use_memory: bool = False):
    """切换存储模式（管理员功能）"""
    try:
        if use_memory:
            db_service.switch_to_memory_mode()
            settings.use_memory_storage = True
        else:
            db_service.switch_to_database_mode()
            settings.use_memory_storage = False
            # 确保数据库已初始化
            await init_db()

        return {
            "message": f"存储模式已切换为: {'内存存储' if use_memory else '持久化存储'}",
            "current_mode": "memory" if use_memory else "persistent"
        }
    except Exception as e:
        logger.error(f"切换存储模式失败: {e}")
        raise HTTPException(status_code=500, detail=f"切换存储模式失败: {str(e)}")


@app.get("/admin/database-info")
async def get_database_info():
    """获取数据库信息（管理员功能）"""
    return {
        "database_url": settings.async_database_url,
        "use_memory_storage": settings.use_memory_storage,
        "database_echo": settings.database_echo,
        "pool_size": settings.db_pool_size,
        "max_overflow": settings.db_max_overflow,
        "pool_timeout": settings.db_pool_timeout,
    }


if __name__ == "__main__":
    import socket

    # 检查端口是否可用，如果不可用则使用备用端口
    def is_port_available(port):
        with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
            try:
                s.bind(('localhost', port))
                return True
            except OSError:
                return False

    # 尝试端口列表
    ports = [8000, 8001, 8002, 8003, 8004]
    selected_port = None

    for port in ports:
        if is_port_available(port):
            selected_port = port
            break

    if selected_port is None:
        print("❌ 无法找到可用端口，请手动停止占用端口的进程")
        exit(1)

    print(f"🚀 启动服务器在端口 {selected_port}")
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=selected_port,
        reload=True,
        log_level="info"
    )
