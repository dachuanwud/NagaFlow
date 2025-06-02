"""
回测相关数据库模型
"""
from sqlalchemy import Column, String, Text, DateTime, Boolean, JSON, Float, Integer, Index
from sqlalchemy.sql import func
from datetime import datetime
from typing import Dict, Any, List, Optional

from ..database.base import Base


class BacktestTask(Base):
    """回测任务模型"""
    __tablename__ = "backtest_tasks"
    
    # 主键
    task_id = Column(String(36), primary_key=True, index=True)
    
    # 任务基本信息
    status = Column(String(50), nullable=False, index=True, default="pending")  # pending, running, completed, failed
    message = Column(Text)
    progress = Column(Float, default=0.0)
    
    # 回测配置
    symbols = Column(JSON, nullable=False)  # 交易对列表
    strategy = Column(String(100), nullable=False)  # 策略名称
    parameters = Column(JSON, nullable=False, default=dict)  # 策略参数
    
    # 时间配置
    date_start = Column(String(20), nullable=False)
    date_end = Column(String(20), nullable=False)
    rule_type = Column(String(10), nullable=False, default="1H")
    
    # 交易配置
    leverage_rate = Column(Float, default=1.0)
    c_rate = Column(Float, default=0.0008)  # 手续费
    slippage = Column(Float, default=0.001)  # 滑点
    
    # 统计信息
    symbols_total = Column(Integer, default=0)
    symbols_completed = Column(Integer, default=0)
    
    # 时间戳
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)
    completed_at = Column(DateTime(timezone=True))
    
    # 创建索引
    __table_args__ = (
        Index('idx_backtest_status_created', 'status', 'created_at'),
        Index('idx_backtest_strategy', 'strategy'),
    )
    
    def to_dict(self) -> Dict[str, Any]:
        """转换为字典格式"""
        return {
            "task_id": self.task_id,
            "status": self.status,
            "message": self.message,
            "progress": self.progress,
            "symbols": self.symbols or [],
            "strategy": self.strategy,
            "parameters": self.parameters or {},
            "date_start": self.date_start,
            "date_end": self.date_end,
            "rule_type": self.rule_type,
            "leverage_rate": self.leverage_rate,
            "c_rate": self.c_rate,
            "slippage": self.slippage,
            "symbols_total": self.symbols_total,
            "symbols_completed": self.symbols_completed,
            "created_at": self.created_at,
            "updated_at": self.updated_at,
            "completed_at": self.completed_at,
        }


class BacktestResult(Base):
    """回测结果模型"""
    __tablename__ = "backtest_results"
    
    # 主键
    id = Column(String(36), primary_key=True, index=True)
    
    # 关联任务
    task_id = Column(String(36), nullable=False, index=True)
    
    # 基本信息
    symbol = Column(String(50), nullable=False, index=True)
    strategy = Column(String(100), nullable=False)
    parameters = Column(JSON, nullable=False, default=dict)
    
    # 性能指标
    final_return = Column(Float)  # 最终收益率
    annual_return = Column(Float)  # 年化收益率
    max_drawdown = Column(Float)  # 最大回撤
    sharpe_ratio = Column(Float)  # 夏普比率
    win_rate = Column(Float)  # 胜率
    profit_loss_ratio = Column(Float)  # 盈亏比
    total_trades = Column(Integer)  # 总交易次数
    
    # 详细数据
    equity_curve = Column(JSON)  # 资金曲线
    trade_records = Column(JSON)  # 交易记录
    statistics = Column(JSON)  # 详细统计
    
    # 时间戳
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    
    # 创建索引
    __table_args__ = (
        Index('idx_result_task_symbol', 'task_id', 'symbol'),
        Index('idx_result_strategy_performance', 'strategy', 'sharpe_ratio'),
        Index('idx_result_symbol_performance', 'symbol', 'final_return'),
    )
    
    def to_dict(self) -> Dict[str, Any]:
        """转换为字典格式"""
        return {
            "id": self.id,
            "task_id": self.task_id,
            "symbol": self.symbol,
            "strategy": self.strategy,
            "parameters": self.parameters or {},
            "final_return": self.final_return,
            "annual_return": self.annual_return,
            "max_drawdown": self.max_drawdown,
            "sharpe_ratio": self.sharpe_ratio,
            "win_rate": self.win_rate,
            "profit_loss_ratio": self.profit_loss_ratio,
            "total_trades": self.total_trades,
            "equity_curve": self.equity_curve or [],
            "trade_records": self.trade_records or [],
            "statistics": self.statistics or {},
            "created_at": self.created_at,
        }
