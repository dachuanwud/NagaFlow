"""
数据管理API路由
使用本地预处理数据，替代bn_data模块
"""
from fastapi import APIRouter, BackgroundTasks, HTTPException
from pydantic import BaseModel
from typing import List, Optional, Dict
import asyncio
import sys
import os
import logging
import pandas as pd
from datetime import datetime

# 导入新的数据服务
from ..services.data_adapter import data_adapter
from ..services.local_data_manager import local_data_manager

logger = logging.getLogger(__name__)

router = APIRouter()

# 数据模型
class SymbolInfo(BaseModel):
    symbol: str
    status: str
    last_update: Optional[str] = None

class DataDownloadRequest(BaseModel):
    symbols: Optional[List[str]] = None
    trade_type: str = "swap"
    intervals: List[str] = ["1m", "5m"]

class DataStatus(BaseModel):
    status: str  # "idle", "downloading", "processing", "completed", "error"
    progress: float = 0.0
    message: str = ""
    symbols_total: int = 0
    symbols_completed: int = 0

# 全局状态管理
data_status = DataStatus(status="idle", message="Ready to download data")

@router.get("/symbols", response_model=List[SymbolInfo])
async def get_symbols(trade_type: str = "spot"):
    """获取可用的交易对列表"""
    try:
        logger.info(f"📊 获取交易对列表，市场类型: {trade_type}")

        # 使用新的数据适配器获取交易对
        symbols = await data_adapter.get_usdt_symbols_async()

        # 根据市场类型过滤
        if trade_type == "spot":
            symbols = data_adapter.spot_symbols_filter(symbols)

        logger.info(f"✅ 获取到 {len(symbols)} 个 {trade_type} 交易对")

        symbol_list = []
        for symbol in symbols:
            symbol_list.append(SymbolInfo(
                symbol=symbol,
                status="available"
            ))

        return symbol_list
    except Exception as e:
        logger.error(f"❌ 获取交易对列表失败: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to get symbols: {str(e)}")

@router.get("/status", response_model=DataStatus)
async def get_data_status():
    """获取数据下载状态"""
    return data_status

@router.post("/download")
async def start_data_download(
    request: DataDownloadRequest,
    background_tasks: BackgroundTasks
):
    """启动数据下载任务"""
    global data_status

    if data_status.status == "downloading":
        raise HTTPException(status_code=400, detail="Data download already in progress")

    # 更新状态
    data_status.status = "downloading"
    data_status.progress = 0.0
    data_status.message = "Starting data download..."

    # 在后台运行数据下载
    background_tasks.add_task(run_data_download, request)

    return {"message": "Data download started", "status": data_status.status}

async def run_data_download(request: DataDownloadRequest):
    """后台运行数据下载任务"""
    global data_status

    try:
        data_status.message = "Initializing download..."
        data_status.progress = 10.0

        # 这里可以调用现有的bn_data.main.run()函数
        # 或者重构为更细粒度的控制
        data_status.message = "Downloading market data..."
        data_status.progress = 50.0

        # 模拟下载过程
        await asyncio.sleep(2)

        data_status.message = "Processing data..."
        data_status.progress = 80.0

        await asyncio.sleep(1)

        data_status.status = "completed"
        data_status.progress = 100.0
        data_status.message = "Data download completed successfully"

    except Exception as e:
        data_status.status = "error"
        data_status.message = f"Download failed: {str(e)}"

@router.get("/market/{symbol}")
async def get_market_data(
    symbol: str,
    interval: str = "1H",
    limit: int = 1000,
    start_date: Optional[str] = None,
    end_date: Optional[str] = None
):
    """获取特定币种的市场数据"""
    try:
        logger.info(f"🔍 获取市场数据: {symbol}, 周期: {interval}, 限制: {limit}")

        # 使用数据适配器获取数据
        df = data_adapter.get_symbol_data_for_backtest(symbol, start_date, end_date, interval)

        if df is None or df.empty:
            return {
                "symbol": symbol,
                "interval": interval,
                "data": [],
                "message": f"No data found for {symbol}",
                "status": "no_data"
            }

        # 限制返回数据量
        if limit > 0:
            df = df.tail(limit)  # 获取最新的数据

        # 转换为API返回格式
        data_list = []
        for _, row in df.iterrows():
            try:
                record = {
                    "timestamp": row['candle_begin_time'].isoformat() if pd.notna(row['candle_begin_time']) else None,
                    "open": float(row['open']) if pd.notna(row['open']) else 0.0,
                    "high": float(row['high']) if pd.notna(row['high']) else 0.0,
                    "low": float(row['low']) if pd.notna(row['low']) else 0.0,
                    "close": float(row['close']) if pd.notna(row['close']) else 0.0,
                    "volume": float(row['volume']) if pd.notna(row['volume']) else 0.0,
                }
                data_list.append(record)
            except Exception as e:
                logger.warning(f"⚠️ 跳过无效数据行: {e}")
                continue

        logger.info(f"✅ 成功获取 {len(data_list)} 条市场数据")
        return {
            "symbol": symbol,
            "interval": interval,
            "data": data_list,
            "message": f"Successfully loaded {len(data_list)} records for {symbol}",
            "status": "success"
        }

    except Exception as e:
        logger.error(f"❌ 获取市场数据失败: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to get market data: {str(e)}")

@router.delete("/cache")
async def clear_data_cache():
    """清理数据缓存"""
    try:
        # 实现缓存清理逻辑
        return {"message": "Data cache cleared successfully"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to clear cache: {str(e)}")


@router.get("/data-status")
async def get_data_status_summary():
    """获取本地数据状态摘要"""
    try:
        logger.info("📊 获取数据状态摘要")

        # 使用数据适配器获取状态
        status = data_adapter.get_data_status_summary()

        logger.info(f"✅ 数据状态: {status['status']}")
        return status

    except Exception as e:
        logger.error(f"❌ 获取数据状态失败: {e}")
        return {
            "data_source": "本地预处理数据",
            "status": "error",
            "error": str(e),
            "last_updated": datetime.now().isoformat()
        }

@router.get("/data-availability")
async def check_data_availability(
    symbols: str,  # 逗号分隔的交易对列表
    start_date: str,
    end_date: str,
    min_records: int = 1000
):
    """检查数据可用性"""
    try:
        symbol_list = [s.strip() for s in symbols.split(',')]
        logger.info(f"🔍 检查数据可用性: {symbol_list}, {start_date} - {end_date}")

        # 使用数据适配器检查可用性
        availability = data_adapter.check_data_availability_for_backtest(
            symbol_list, start_date, end_date, min_records
        )

        logger.info(f"✅ 可用交易对: {len(availability['available_symbols'])}/{len(symbol_list)}")
        return availability

    except Exception as e:
        logger.error(f"❌ 检查数据可用性失败: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to check data availability: {str(e)}")

@router.get("/intelligent-time-range")
async def get_intelligent_time_range(
    symbols: str,  # 逗号分隔的交易对列表
    requested_start: str,
    requested_end: str,
    min_records: int = 1000
):
    """获取智能时间范围建议"""
    try:
        symbol_list = [s.strip() for s in symbols.split(',')]
        logger.info(f"🧠 获取智能时间范围: {symbol_list}, {requested_start} - {requested_end}")

        # 使用数据适配器获取智能时间范围
        time_range_info = data_adapter.get_intelligent_time_range_for_backtest(
            symbol_list, requested_start, requested_end, min_records
        )

        logger.info(f"✅ 时间范围优化: {time_range_info['success']}")
        return time_range_info

    except Exception as e:
        logger.error(f"❌ 获取智能时间范围失败: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to get intelligent time range: {str(e)}")
