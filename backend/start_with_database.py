#!/usr/bin/env python3
"""
NagaFlow Backend 数据库集成启动脚本
"""
import asyncio
import sys
import os
import uvicorn
import logging
from pathlib import Path

# 添加项目路径
project_root = Path(__file__).parent
sys.path.insert(0, str(project_root))
sys.path.insert(0, str(project_root.parent / 'bn_data'))
sys.path.insert(0, str(project_root.parent / 'crypto_cta'))

from app.core.config import settings
from app.database.connection import init_db, engine
from app.services.database_service import db_service

# 配置日志
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)


async def setup_database():
    """设置数据库"""
    try:
        logger.info("🔧 正在设置数据库...")
        
        if not settings.use_memory_storage:
            logger.info(f"数据库URL: {settings.async_database_url}")
            
            # 初始化数据库
            await init_db()
            logger.info("✅ 数据库初始化完成")
            
            # 设置数据库服务模式
            db_service.switch_to_database_mode()
            logger.info("✅ 数据库服务已启用")
            
            # 可选：导入示例数据
            await import_sample_data()
            
        else:
            logger.info("使用内存存储模式")
            db_service.switch_to_memory_mode()
        
        return True
        
    except Exception as e:
        logger.error(f"❌ 数据库设置失败: {e}")
        return False


async def import_sample_data():
    """导入示例数据"""
    try:
        from app.database.connection import SessionLocal
        from app.crud import strategy_crud
        import uuid
        
        async with SessionLocal() as db:
            # 检查是否已有数据
            existing_strategies = await strategy_crud.get_multi(db, limit=1)
            if existing_strategies:
                logger.info("数据库中已有数据，跳过示例数据导入")
                return
            
            logger.info("导入示例数据...")
            
            # 示例策略数据
            sample_strategies = [
                {
                    "id": str(uuid.uuid4()),
                    "name": "SMA双均线策略",
                    "description": "基于简单移动平均线的趋势跟踪策略",
                    "factors": ["sma"],
                    "parameters": {"n": 200, "m": 2},
                    "is_active": True,
                },
                {
                    "id": str(uuid.uuid4()),
                    "name": "RSI反转策略",
                    "description": "基于RSI指标的反转策略",
                    "factors": ["rsi"],
                    "parameters": {"period": 14, "overbought": 70, "oversold": 30},
                    "is_active": True,
                },
                {
                    "id": str(uuid.uuid4()),
                    "name": "MACD趋势策略",
                    "description": "基于MACD指标的趋势跟踪策略",
                    "factors": ["macd"],
                    "parameters": {"fast_period": 12, "slow_period": 26, "signal_period": 9},
                    "is_active": True,
                }
            ]
            
            for strategy_data in sample_strategies:
                await strategy_crud.create(db, obj_in=strategy_data)
                logger.info(f"✅ 导入策略: {strategy_data['name']}")
            
            logger.info("✅ 示例数据导入完成")
            
    except Exception as e:
        logger.warning(f"⚠️ 示例数据导入失败: {e}")


def print_startup_info():
    """打印启动信息"""
    print("\n" + "="*60)
    print("🚀 NagaFlow Backend - 数据库集成版本")
    print("="*60)
    print(f"📊 存储模式: {'内存存储' if settings.use_memory_storage else '数据库持久化'}")
    if not settings.use_memory_storage:
        print(f"🗄️ 数据库: {settings.async_database_url}")
    print(f"🌐 API文档: http://localhost:8000/docs")
    print(f"❤️ 健康检查: http://localhost:8000/health")
    print(f"⚙️ 管理接口: http://localhost:8000/admin/database-info")
    print("="*60)
    
    if not settings.use_memory_storage:
        print("\n📋 数据库管理命令:")
        print("  • 初始化数据库: python scripts/init_db.py")
        print("  • 测试数据库: python scripts/test_database.py")
        print("  • 导入数据: python scripts/migrate_data.py")
        print("  • 数据库迁移: alembic upgrade head")
        
    print("\n🔄 存储模式切换:")
    print("  • 切换到数据库模式: curl -X POST 'http://localhost:8000/admin/switch-storage-mode?use_memory=false'")
    print("  • 切换到内存模式: curl -X POST 'http://localhost:8000/admin/switch-storage-mode?use_memory=true'")
    print("\n")


async def main():
    """主函数"""
    print_startup_info()
    
    # 设置数据库
    if not await setup_database():
        logger.error("数据库设置失败，退出程序")
        sys.exit(1)
    
    # 查找可用端口
    def find_available_port():
        import socket
        ports = [8000, 8001, 8002, 8003, 8004]
        for port in ports:
            with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
                try:
                    s.bind(('localhost', port))
                    return port
                except OSError:
                    continue
        return None
    
    port = find_available_port()
    if port is None:
        logger.error("❌ 无法找到可用端口")
        sys.exit(1)
    
    logger.info(f"🚀 启动服务器在端口 {port}")
    
    try:
        # 启动服务器
        config = uvicorn.Config(
            "main:app",
            host="0.0.0.0",
            port=port,
            reload=True,
            log_level="info"
        )
        server = uvicorn.Server(config)
        await server.serve()
        
    except KeyboardInterrupt:
        logger.info("👋 服务器已停止")
    except Exception as e:
        logger.error(f"❌ 服务器启动失败: {e}")
    finally:
        # 清理资源
        if not settings.use_memory_storage:
            await engine.dispose()
            logger.info("✅ 数据库连接已关闭")


if __name__ == "__main__":
    try:
        asyncio.run(main())
    except KeyboardInterrupt:
        print("\n👋 再见！")
    except Exception as e:
        logger.error(f"❌ 程序异常退出: {e}")
        sys.exit(1)
