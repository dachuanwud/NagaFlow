"""
回测API路由
集成crypto_cta模块功能
"""
from fastapi import APIRouter, BackgroundTasks, HTTPException
from pydantic import BaseModel
from typing import List, Optional, Dict, Any
import asyncio
import sys
import os
import uuid
from datetime import datetime

# 导入现有的crypto_cta模块
sys.path.append(os.path.join(os.path.dirname(__file__), '..', '..', '..', 'crypto_cta'))
from cta_api.cta_core import fast_calculate_signal_by_one_loop

router = APIRouter()

# 数据模型
class BacktestRequest(BaseModel):
    symbols: List[str]
    strategy: str
    parameters: Dict[str, Any]
    date_start: str = "2021-01-01"
    date_end: str = "2025-01-01"
    rule_type: str = "1H"
    leverage_rate: float = 1.0
    c_rate: float = 0.0008  # 手续费
    slippage: float = 0.001  # 滑点

class BacktestResult(BaseModel):
    task_id: str
    symbol: str
    strategy: str
    parameters: Dict[str, Any]
    final_return: float
    annual_return: float
    max_drawdown: float
    sharpe_ratio: float
    win_rate: float
    total_trades: int
    equity_curve: List[Dict[str, Any]]
    created_at: datetime

class BacktestStatus(BaseModel):
    task_id: str
    status: str  # "pending", "running", "completed", "failed"
    progress: float = 0.0
    message: str = ""
    symbols_total: int = 0
    symbols_completed: int = 0
    results: List[BacktestResult] = []

class OptimizationRequest(BaseModel):
    symbols: List[str]
    strategy: str
    parameter_ranges: Dict[str, List[float]]  # 参数优化范围
    date_start: str = "2021-01-01"
    date_end: str = "2025-01-01"
    rule_type: str = "1H"

# 全局任务管理
backtest_tasks: Dict[str, BacktestStatus] = {}

@router.post("/run")
async def start_backtest(
    request: BacktestRequest,
    background_tasks: BackgroundTasks
):
    """启动回测任务"""
    task_id = str(uuid.uuid4())
    
    # 创建任务状态
    task_status = BacktestStatus(
        task_id=task_id,
        status="pending",
        message="Backtest task created",
        symbols_total=len(request.symbols)
    )
    backtest_tasks[task_id] = task_status
    
    # 在后台运行回测
    background_tasks.add_task(run_backtest_task, task_id, request)
    
    return {
        "task_id": task_id,
        "message": "Backtest started",
        "status": "pending"
    }

async def run_backtest_task(task_id: str, request: BacktestRequest):
    """后台运行回测任务"""
    task_status = backtest_tasks[task_id]
    
    try:
        task_status.status = "running"
        task_status.message = "Starting backtest..."
        
        results = []
        
        for i, symbol in enumerate(request.symbols):
            task_status.message = f"Processing {symbol}..."
            task_status.progress = (i / len(request.symbols)) * 100
            
            try:
                # 调用现有的回测函数
                # 这里需要适配现有的fast_calculate_signal_by_one_loop函数
                
                # 模拟回测结果
                result = BacktestResult(
                    task_id=task_id,
                    symbol=symbol,
                    strategy=request.strategy,
                    parameters=request.parameters,
                    final_return=1.25,  # 模拟数据
                    annual_return=0.15,
                    max_drawdown=0.08,
                    sharpe_ratio=1.8,
                    win_rate=0.65,
                    total_trades=150,
                    equity_curve=[],  # 实际的资金曲线数据
                    created_at=datetime.now()
                )
                results.append(result)
                
                # 模拟处理时间
                await asyncio.sleep(1)
                
            except Exception as e:
                print(f"Error processing {symbol}: {str(e)}")
                continue
            
            task_status.symbols_completed = i + 1
        
        task_status.status = "completed"
        task_status.progress = 100.0
        task_status.message = "Backtest completed successfully"
        task_status.results = results
        
    except Exception as e:
        task_status.status = "failed"
        task_status.message = f"Backtest failed: {str(e)}"

@router.get("/status/{task_id}", response_model=BacktestStatus)
async def get_backtest_status(task_id: str):
    """获取回测任务状态"""
    if task_id not in backtest_tasks:
        raise HTTPException(status_code=404, detail="Task not found")
    
    return backtest_tasks[task_id]

@router.get("/results/{task_id}")
async def get_backtest_results(task_id: str):
    """获取回测结果"""
    if task_id not in backtest_tasks:
        raise HTTPException(status_code=404, detail="Task not found")
    
    task_status = backtest_tasks[task_id]
    
    if task_status.status != "completed":
        raise HTTPException(status_code=400, detail="Backtest not completed yet")
    
    return {
        "task_id": task_id,
        "status": task_status.status,
        "results": task_status.results,
        "summary": {
            "total_symbols": len(task_status.results),
            "avg_return": sum(r.final_return for r in task_status.results) / len(task_status.results) if task_status.results else 0,
            "best_symbol": max(task_status.results, key=lambda x: x.final_return).symbol if task_status.results else None
        }
    }

@router.get("/tasks")
async def list_backtest_tasks():
    """获取所有回测任务列表"""
    return {
        "tasks": [
            {
                "task_id": task_id,
                "status": task.status,
                "symbols_total": task.symbols_total,
                "symbols_completed": task.symbols_completed,
                "progress": task.progress
            }
            for task_id, task in backtest_tasks.items()
        ]
    }

@router.post("/optimize")
async def start_optimization(
    request: OptimizationRequest,
    background_tasks: BackgroundTasks
):
    """启动参数优化任务"""
    task_id = str(uuid.uuid4())
    
    # 创建优化任务
    task_status = BacktestStatus(
        task_id=task_id,
        status="pending",
        message="Parameter optimization task created",
        symbols_total=len(request.symbols)
    )
    backtest_tasks[task_id] = task_status
    
    # 在后台运行优化
    background_tasks.add_task(run_optimization_task, task_id, request)
    
    return {
        "task_id": task_id,
        "message": "Parameter optimization started",
        "status": "pending"
    }

async def run_optimization_task(task_id: str, request: OptimizationRequest):
    """后台运行参数优化任务"""
    task_status = backtest_tasks[task_id]
    
    try:
        task_status.status = "running"
        task_status.message = "Running parameter optimization..."
        
        # 这里实现参数优化逻辑
        # 可以使用遗传算法、网格搜索等方法
        
        # 模拟优化过程
        await asyncio.sleep(5)
        
        task_status.status = "completed"
        task_status.progress = 100.0
        task_status.message = "Parameter optimization completed"
        
    except Exception as e:
        task_status.status = "failed"
        task_status.message = f"Optimization failed: {str(e)}"

@router.delete("/tasks/{task_id}")
async def delete_backtest_task(task_id: str):
    """删除回测任务"""
    if task_id not in backtest_tasks:
        raise HTTPException(status_code=404, detail="Task not found")
    
    del backtest_tasks[task_id]
    return {"message": "Task deleted successfully"}
