#!/usr/bin/env python3
"""
数据库功能测试脚本
"""
import asyncio
import sys
import os
import uuid
from datetime import datetime

# 添加项目路径
sys.path.append(os.path.dirname(os.path.dirname(__file__)))

from app.database.connection import SessionLocal, init_db, engine
from app.services.database_service import db_service
from app.core.config import settings
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


async def test_strategy_operations():
    """测试策略相关操作"""
    logger.info("🧪 测试策略操作...")
    
    async with SessionLocal() as db:
        # 测试创建策略
        strategy_data = {
            "id": str(uuid.uuid4()),
            "name": "测试SMA策略",
            "description": "用于测试的SMA策略",
            "factors": ["sma"],
            "parameters": {"n": 200, "m": 2},
            "is_active": True,
        }
        
        created_strategy = await db_service.create_strategy(db, strategy_data)
        logger.info(f"✅ 创建策略成功: {created_strategy['name']}")
        
        # 测试获取策略
        retrieved_strategy = await db_service.get_strategy(db, created_strategy["id"])
        logger.info(f"✅ 获取策略成功: {retrieved_strategy['name']}")
        
        # 测试更新策略
        update_data = {"description": "更新后的策略描述"}
        updated_strategy = await db_service.update_strategy(db, created_strategy["id"], update_data)
        logger.info(f"✅ 更新策略成功: {updated_strategy['description']}")
        
        # 测试获取策略列表
        strategies = await db_service.get_strategies(db, skip=0, limit=10)
        logger.info(f"✅ 获取策略列表成功，共 {len(strategies)} 个策略")
        
        # 测试删除策略
        success = await db_service.delete_strategy(db, created_strategy["id"])
        logger.info(f"✅ 删除策略成功: {success}")


async def test_backtest_operations():
    """测试回测相关操作"""
    logger.info("🧪 测试回测操作...")
    
    async with SessionLocal() as db:
        # 测试创建回测任务
        task_data = {
            "task_id": str(uuid.uuid4()),
            "status": "pending",
            "message": "测试回测任务",
            "progress": 0.0,
            "symbols": ["BTCUSDT", "ETHUSDT"],
            "strategy": "sma",
            "parameters": {"n": 200},
            "date_start": "2024-01-01",
            "date_end": "2024-12-31",
            "rule_type": "1H",
            "leverage_rate": 1.0,
            "c_rate": 0.0008,
            "slippage": 0.001,
            "symbols_total": 2,
            "symbols_completed": 0,
        }
        
        created_task = await db_service.create_backtest_task(db, task_data)
        logger.info(f"✅ 创建回测任务成功: {created_task['task_id']}")
        
        # 测试更新任务状态
        update_data = {"status": "running", "progress": 50.0, "message": "回测进行中..."}
        updated_task = await db_service.update_backtest_task(db, created_task["task_id"], update_data)
        logger.info(f"✅ 更新任务状态成功: {updated_task['status']}")
        
        # 测试创建回测结果
        result_data = {
            "id": str(uuid.uuid4()),
            "task_id": created_task["task_id"],
            "symbol": "BTCUSDT",
            "strategy": "sma",
            "parameters": {"n": 200},
            "final_return": 0.25,
            "annual_return": 0.28,
            "max_drawdown": -0.15,
            "sharpe_ratio": 1.85,
            "win_rate": 0.65,
            "profit_loss_ratio": 1.4,
            "total_trades": 45,
            "equity_curve": [],
            "trade_records": [],
            "statistics": {},
        }
        
        created_result = await db_service.create_backtest_result(db, result_data)
        logger.info(f"✅ 创建回测结果成功: {created_result['symbol']}")
        
        # 测试获取回测结果
        results = await db_service.get_backtest_results(db, created_task["task_id"])
        logger.info(f"✅ 获取回测结果成功，共 {len(results)} 个结果")
        
        # 测试获取任务列表
        tasks = await db_service.get_backtest_tasks(db, skip=0, limit=10)
        logger.info(f"✅ 获取任务列表成功，共 {len(tasks)} 个任务")


async def test_data_status_operations():
    """测试数据状态相关操作"""
    logger.info("🧪 测试数据状态操作...")
    
    async with SessionLocal() as db:
        # 测试获取数据状态
        status = await db_service.get_data_status(db)
        logger.info(f"✅ 获取数据状态成功: {status['status']}")
        
        # 测试更新数据状态
        update_data = {
            "status": "downloading",
            "progress": 30.0,
            "message": "正在下载数据...",
            "symbols_total": 10,
            "symbols_completed": 3,
        }
        
        updated_status = await db_service.update_data_status(db, update_data)
        logger.info(f"✅ 更新数据状态成功: {updated_status['status']}")


async def test_memory_vs_database_mode():
    """测试内存模式与数据库模式的切换"""
    logger.info("🧪 测试存储模式切换...")
    
    # 测试内存模式
    db_service.switch_to_memory_mode()
    logger.info("✅ 切换到内存模式")
    
    # 在内存模式下创建策略
    strategy_data = {
        "id": str(uuid.uuid4()),
        "name": "内存模式测试策略",
        "description": "在内存模式下创建的策略",
        "factors": ["rsi"],
        "parameters": {"period": 14},
        "is_active": True,
    }
    
    memory_strategy = await db_service.create_strategy(None, strategy_data)
    logger.info(f"✅ 内存模式创建策略成功: {memory_strategy['name']}")
    
    # 获取内存中的策略
    memory_strategies = await db_service.get_strategies(None, skip=0, limit=10)
    logger.info(f"✅ 内存模式获取策略成功，共 {len(memory_strategies)} 个策略")
    
    # 切换回数据库模式
    db_service.switch_to_database_mode()
    logger.info("✅ 切换到数据库模式")
    
    # 清空内存存储
    db_service.clear_memory_storage()
    logger.info("✅ 清空内存存储")


async def main():
    """主测试函数"""
    try:
        logger.info("🚀 开始数据库功能测试...")
        logger.info(f"数据库URL: {settings.async_database_url}")
        
        # 初始化数据库
        await init_db()
        logger.info("✅ 数据库初始化完成")
        
        # 设置为数据库模式
        db_service.switch_to_database_mode()
        
        # 运行测试
        await test_strategy_operations()
        await test_backtest_operations()
        await test_data_status_operations()
        await test_memory_vs_database_mode()
        
        logger.info("🎉 所有数据库功能测试通过！")
        
    except Exception as e:
        logger.error(f"❌ 测试失败: {e}")
        raise
    finally:
        # 关闭数据库连接
        await engine.dispose()
        logger.info("✅ 数据库连接已关闭")


if __name__ == "__main__":
    asyncio.run(main())
