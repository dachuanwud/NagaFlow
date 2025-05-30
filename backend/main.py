"""
NagaFlow Backend - FastAPI应用主入口
集成现有的bn_data和crypto_cta模块
"""
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from contextlib import asynccontextmanager
import uvicorn
import sys
import os

# 添加现有模块到Python路径
sys.path.append(os.path.join(os.path.dirname(__file__), '..', 'bn_data'))
sys.path.append(os.path.join(os.path.dirname(__file__), '..', 'crypto_cta'))

from app.api import data, backtest, strategies
from app.core.config import settings


@asynccontextmanager
async def lifespan(app: FastAPI):
    """应用生命周期管理"""
    # 启动时的初始化
    print("🚀 NagaFlow Backend starting...")
    yield
    # 关闭时的清理
    print("🛑 NagaFlow Backend shutting down...")


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
    allow_origins=["http://localhost:5173", "http://localhost:3000"],  # Vite默认端口
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 静态文件服务
app.mount("/static", StaticFiles(directory="static"), name="static")

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
        "docs": "/docs"
    }


@app.get("/health")
async def health_check():
    """健康检查"""
    return {"status": "healthy", "service": "NagaFlow Backend"}


if __name__ == "__main__":
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=8000,
        reload=True,
        log_level="info"
    )
