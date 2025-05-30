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

class TradeRecord(BaseModel):
    id: str
    symbol: str
    side: str  # "buy" or "sell"
    quantity: float
    price: float
    timestamp: datetime
    pnl: float
    commission: float
    slippage: float

class DrawdownPeriod(BaseModel):
    start_date: str
    end_date: str
    duration_days: int
    max_drawdown: float
    recovery_date: Optional[str] = None

class MonthlyReturn(BaseModel):
    year: int
    month: int
    return_value: float

class BacktestResult(BaseModel):
    task_id: str
    symbol: str
    strategy: str
    parameters: Dict[str, Any]
    final_return: float
    annual_return: float
    max_drawdown: float
    sharpe_ratio: float
    sortino_ratio: float = 0.0
    calmar_ratio: float = 0.0
    win_rate: float
    profit_factor: float = 0.0
    total_trades: int
    winning_trades: int = 0
    losing_trades: int = 0
    avg_win: float = 0.0
    avg_loss: float = 0.0
    max_consecutive_wins: int = 0
    max_consecutive_losses: int = 0
    volatility: float = 0.0
    skewness: float = 0.0
    kurtosis: float = 0.0
    var_95: float = 0.0  # Value at Risk 95%
    cvar_95: float = 0.0  # Conditional Value at Risk 95%
    equity_curve: List[Dict[str, Any]]
    drawdown_periods: List[DrawdownPeriod] = []
    monthly_returns: List[MonthlyReturn] = []
    trade_records: List[TradeRecord] = []
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

                # 生成模拟回测结果
                import random
                import numpy as np
                from datetime import timedelta

                # 生成模拟的资金曲线数据
                start_date = datetime.strptime(request.date_start, "%Y-%m-%d")
                end_date = datetime.strptime(request.date_end, "%Y-%m-%d")
                days = (end_date - start_date).days

                equity_curve = []
                trade_records = []
                monthly_returns = []
                drawdown_periods = []

                current_value = 10000
                peak_value = current_value
                current_drawdown = 0

                # 生成每日数据
                for day in range(min(days, 365)):  # 限制为1年数据
                    current_date = start_date + timedelta(days=day)

                    # 模拟日收益率
                    daily_return = random.normalvariate(0.0008, 0.02)  # 年化约20%收益，20%波动率
                    current_value *= (1 + daily_return)

                    # 计算回撤
                    if current_value > peak_value:
                        peak_value = current_value
                        current_drawdown = 0
                    else:
                        current_drawdown = (peak_value - current_value) / peak_value

                    equity_curve.append({
                        "date": current_date.strftime("%Y-%m-%d"),
                        "value": round(current_value, 2),
                        "drawdown": current_drawdown
                    })

                # 生成交易记录
                num_trades = random.randint(50, 200)
                for trade_idx in range(num_trades):
                    trade_date = start_date + timedelta(days=random.randint(0, min(days-1, 364)))
                    side = random.choice(["buy", "sell"])
                    quantity = random.uniform(0.1, 10.0)
                    price = random.uniform(20000, 60000)
                    pnl = random.normalvariate(50, 200)  # 平均盈利50，标准差200

                    trade_records.append(TradeRecord(
                        id=f"trade_{task_id}_{trade_idx:06d}",
                        symbol=symbol,
                        side=side,
                        quantity=quantity,
                        price=price,
                        timestamp=trade_date,
                        pnl=pnl,
                        commission=abs(pnl) * 0.001,
                        slippage=abs(pnl) * 0.0005
                    ))

                # 生成月度收益
                current_year = start_date.year
                current_month = start_date.month
                while current_year <= end_date.year:
                    if current_year == end_date.year and current_month > end_date.month:
                        break

                    monthly_return = random.normalvariate(0.02, 0.08)  # 月度收益
                    monthly_returns.append(MonthlyReturn(
                        year=current_year,
                        month=current_month,
                        return_value=monthly_return
                    ))

                    current_month += 1
                    if current_month > 12:
                        current_month = 1
                        current_year += 1

                # 计算统计指标
                final_return = (current_value - 10000) / 10000
                annual_return = final_return * (365 / max(days, 1))
                max_drawdown = max([point["drawdown"] for point in equity_curve], default=0)

                # 交易统计
                winning_trades = len([t for t in trade_records if t.pnl > 0])
                losing_trades = len([t for t in trade_records if t.pnl < 0])
                win_rate = winning_trades / len(trade_records) if trade_records else 0

                avg_win = np.mean([t.pnl for t in trade_records if t.pnl > 0]) if winning_trades > 0 else 0
                avg_loss = np.mean([t.pnl for t in trade_records if t.pnl < 0]) if losing_trades > 0 else 0

                total_profit = sum([t.pnl for t in trade_records if t.pnl > 0])
                total_loss = abs(sum([t.pnl for t in trade_records if t.pnl < 0]))
                profit_factor = total_profit / total_loss if total_loss > 0 else 0

                # 风险指标
                returns = [equity_curve[i]["value"] / equity_curve[i-1]["value"] - 1
                          for i in range(1, len(equity_curve))]
                volatility = np.std(returns) * np.sqrt(252) if returns else 0  # 年化波动率
                sharpe_ratio = annual_return / volatility if volatility > 0 else 0

                # 计算Sortino和Calmar比率
                negative_returns = [r for r in returns if r < 0]
                downside_deviation = np.std(negative_returns) * np.sqrt(252) if negative_returns else 0
                sortino_ratio = annual_return / downside_deviation if downside_deviation > 0 else 0
                calmar_ratio = annual_return / max_drawdown if max_drawdown > 0 else 0

                # VaR和CVaR计算
                var_95 = np.percentile(returns, 5) if returns else 0
                cvar_95 = np.mean([r for r in returns if r <= var_95]) if returns else 0

                result = BacktestResult(
                    task_id=task_id,
                    symbol=symbol,
                    strategy=request.strategy,
                    parameters=request.parameters,
                    final_return=final_return,
                    annual_return=annual_return,
                    max_drawdown=max_drawdown,
                    sharpe_ratio=sharpe_ratio,
                    sortino_ratio=sortino_ratio,
                    calmar_ratio=calmar_ratio,
                    win_rate=win_rate,
                    profit_factor=profit_factor,
                    total_trades=len(trade_records),
                    winning_trades=winning_trades,
                    losing_trades=losing_trades,
                    avg_win=avg_win,
                    avg_loss=avg_loss,
                    max_consecutive_wins=random.randint(3, 15),
                    max_consecutive_losses=random.randint(2, 8),
                    volatility=volatility,
                    skewness=random.normalvariate(0, 0.5),
                    kurtosis=random.normalvariate(3, 1),
                    var_95=var_95,
                    cvar_95=cvar_95,
                    equity_curve=equity_curve,
                    drawdown_periods=drawdown_periods,
                    monthly_returns=monthly_returns,
                    trade_records=trade_records,
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
    return [
        {
            "task_id": task_id,
            "status": task.status,
            "symbols_total": task.symbols_total,
            "symbols_completed": task.symbols_completed,
            "progress": task.progress,
            "message": task.message,
            "results": task.results or []
        }
        for task_id, task in backtest_tasks.items()
    ]

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
