#!/usr/bin/env python3
"""
数据迁移脚本 - 将内存数据迁移到数据库
"""
import asyncio
import sys
import os
import uuid
from datetime import datetime
from typing import Dict, Any

# 添加项目路径
sys.path.append(os.path.dirname(os.path.dirname(__file__)))

from app.database.connection import SessionLocal, init_db
from app.crud import strategy_crud, backtest_crud
from app.core.config import settings
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


# 模拟的内存数据（实际使用时从现有系统导入）
SAMPLE_STRATEGIES = [
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


async def migrate_strategies():
    """迁移策略数据"""
    async with SessionLocal() as db:
        logger.info("开始迁移策略数据...")
        
        for strategy_data in SAMPLE_STRATEGIES:
            try:
                # 检查策略是否已存在
                existing = await strategy_crud.get_by_name(db, strategy_data["name"])
                if existing:
                    logger.info(f"策略 '{strategy_data['name']}' 已存在，跳过")
                    continue
                
                # 创建策略
                strategy = await strategy_crud.create(db, obj_in=strategy_data)
                logger.info(f"成功创建策略: {strategy.name}")
                
            except Exception as e:
                logger.error(f"创建策略失败 '{strategy_data['name']}': {e}")
        
        logger.info("策略数据迁移完成")


async def migrate_sample_backtest_data():
    """迁移示例回测数据"""
    async with SessionLocal() as db:
        logger.info("开始创建示例回测数据...")
        
        # 创建示例回测任务
        task_data = {
            "task_id": str(uuid.uuid4()),
            "status": "completed",
            "message": "示例回测任务已完成",
            "progress": 100.0,
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
            "symbols_completed": 2,
            "completed_at": datetime.utcnow(),
        }
        
        try:
            task = await backtest_crud.task.create(db, obj_in=task_data)
            logger.info(f"成功创建示例回测任务: {task.task_id}")
            
            # 创建示例回测结果
            results_data = [
                {
                    "id": str(uuid.uuid4()),
                    "task_id": task.task_id,
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
                },
                {
                    "id": str(uuid.uuid4()),
                    "task_id": task.task_id,
                    "symbol": "ETHUSDT",
                    "strategy": "sma",
                    "parameters": {"n": 200},
                    "final_return": 0.18,
                    "annual_return": 0.21,
                    "max_drawdown": -0.12,
                    "sharpe_ratio": 1.62,
                    "win_rate": 0.58,
                    "profit_loss_ratio": 1.2,
                    "total_trades": 38,
                    "equity_curve": [],
                    "trade_records": [],
                    "statistics": {},
                }
            ]
            
            for result_data in results_data:
                result = await backtest_crud.result.create(db, obj_in=result_data)
                logger.info(f"成功创建回测结果: {result.symbol}")
            
        except Exception as e:
            logger.error(f"创建示例回测数据失败: {e}")
        
        logger.info("示例回测数据创建完成")


async def main():
    """主函数"""
    try:
        logger.info("开始数据迁移...")
        logger.info(f"数据库URL: {settings.async_database_url}")
        
        # 确保数据库已初始化
        await init_db()
        
        # 迁移策略数据
        await migrate_strategies()
        
        # 创建示例回测数据
        await migrate_sample_backtest_data()
        
        logger.info("数据迁移完成！")
        
    except Exception as e:
        logger.error(f"数据迁移失败: {e}")
        raise


if __name__ == "__main__":
    asyncio.run(main())
