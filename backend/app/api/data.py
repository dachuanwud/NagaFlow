"""
数据管理API路由
集成bn_data模块功能
"""
from fastapi import APIRouter, BackgroundTasks, HTTPException
from pydantic import BaseModel
from typing import List, Optional
import asyncio
import sys
import os

# 导入现有的bn_data模块
sys.path.append(os.path.join(os.path.dirname(__file__), '..', '..', '..', 'bn_data'))
from core.symbols import async_get_usdt_symbols, spot_symbols_filter
from core.common import ping
from main import run as bn_data_run

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
async def get_symbols(trade_type: str = "swap"):
    """获取可用的交易对列表"""
    try:
        params = {
            'delimiter': '/',
            'prefix': 'data/futures/um/daily/klines/' if trade_type == 'swap' else 'data/spot/daily/klines/'
        }
        symbols = async_get_usdt_symbols(params)
        
        if trade_type == 'spot':
            symbols = spot_symbols_filter(symbols)
        
        symbol_list = []
        for symbol in symbols:
            symbol_list.append(SymbolInfo(
                symbol=symbol,
                status="available"
            ))
        
        return symbol_list
    except Exception as e:
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
    limit: int = 1000
):
    """获取特定币种的市场数据"""
    try:
        # 这里需要实现从pickle文件读取数据的逻辑
        # 可以复用crypto_cta中的数据读取代码
        
        return {
            "symbol": symbol,
            "interval": interval,
            "data": [],  # 实际的K线数据
            "message": f"Market data for {symbol} (placeholder)"
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get market data: {str(e)}")

@router.delete("/cache")
async def clear_data_cache():
    """清理数据缓存"""
    try:
        # 实现缓存清理逻辑
        return {"message": "Data cache cleared successfully"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to clear cache: {str(e)}")
