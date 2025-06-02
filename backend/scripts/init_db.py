#!/usr/bin/env python3
"""
数据库初始化脚本
"""
import asyncio
import sys
import os

# 添加项目路径
sys.path.append(os.path.dirname(os.path.dirname(__file__)))

from app.database.connection import init_db, engine
from app.core.config import settings
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


async def main():
    """初始化数据库"""
    try:
        logger.info("开始初始化数据库...")
        logger.info(f"数据库URL: {settings.async_database_url}")
        
        # 初始化数据库
        await init_db()
        
        logger.info("数据库初始化完成！")
        
        # 关闭连接
        await engine.dispose()
        
    except Exception as e:
        logger.error(f"数据库初始化失败: {e}")
        raise


if __name__ == "__main__":
    asyncio.run(main())
