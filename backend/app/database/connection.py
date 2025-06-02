"""
数据库连接管理
"""
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker
from sqlalchemy.pool import StaticPool
from typing import AsyncGenerator
import logging

from ..core.config import settings

logger = logging.getLogger(__name__)

# 创建异步数据库引擎
if "sqlite" in settings.async_database_url:
    # SQLite配置
    engine = create_async_engine(
        settings.async_database_url,
        echo=settings.database_echo,
        poolclass=StaticPool,
        connect_args={
            "check_same_thread": False,
        },
    )
else:
    # PostgreSQL配置
    engine = create_async_engine(
        settings.async_database_url,
        echo=settings.database_echo,
        pool_size=settings.db_pool_size,
        max_overflow=settings.db_max_overflow,
        pool_timeout=settings.db_pool_timeout,
    )

# 创建异步会话工厂
SessionLocal = async_sessionmaker(
    engine,
    class_=AsyncSession,
    expire_on_commit=False,
    autocommit=False,
    autoflush=False,
)


async def get_db() -> AsyncGenerator[AsyncSession, None]:
    """
    获取数据库会话
    用于FastAPI依赖注入
    """
    async with SessionLocal() as session:
        try:
            yield session
        except Exception as e:
            logger.error(f"数据库会话错误: {e}")
            await session.rollback()
            raise
        finally:
            await session.close()


async def init_db():
    """
    初始化数据库
    创建所有表
    """
    from .base import Base
    from ..models import strategy, backtest, data_status  # 导入所有模型
    
    try:
        async with engine.begin() as conn:
            # 创建所有表
            await conn.run_sync(Base.metadata.create_all)
        logger.info("数据库初始化成功")
    except Exception as e:
        logger.error(f"数据库初始化失败: {e}")
        raise


async def close_db():
    """
    关闭数据库连接
    """
    try:
        await engine.dispose()
        logger.info("数据库连接已关闭")
    except Exception as e:
        logger.error(f"关闭数据库连接失败: {e}")
        raise
