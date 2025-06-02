"""
回测CRUD操作
"""
from typing import List, Optional, Dict, Any
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_, desc, func
from datetime import datetime, timedelta

from .base import CRUDBase
from ..models.backtest import BacktestTask, BacktestResult


class CRUDBacktestTask(CRUDBase[BacktestTask, Dict[str, Any], Dict[str, Any]]):
    """回测任务CRUD操作类"""
    
    async def get_by_status(
        self, 
        db: AsyncSession, 
        status: str,
        skip: int = 0,
        limit: int = 100
    ) -> List[BacktestTask]:
        """根据状态获取任务列表"""
        return await self.get_multi_by_field(db, "status", status, skip, limit)
    
    async def get_running_tasks(self, db: AsyncSession) -> List[BacktestTask]:
        """获取正在运行的任务"""
        return await self.get_by_status(db, "running")
    
    async def get_recent_tasks(
        self, 
        db: AsyncSession, 
        days: int = 7,
        skip: int = 0,
        limit: int = 100
    ) -> List[BacktestTask]:
        """获取最近的任务"""
        since_date = datetime.utcnow() - timedelta(days=days)
        query = select(self.model).where(
            self.model.created_at >= since_date
        ).order_by(desc(self.model.created_at)).offset(skip).limit(limit)
        
        result = await db.execute(query)
        return result.scalars().all()
    
    async def update_task_status(
        self, 
        db: AsyncSession, 
        task_id: str, 
        status: str, 
        message: Optional[str] = None,
        progress: Optional[float] = None
    ) -> Optional[BacktestTask]:
        """更新任务状态"""
        task = await self.get(db, task_id)
        if not task:
            return None
        
        update_data = {"status": status}
        if message is not None:
            update_data["message"] = message
        if progress is not None:
            update_data["progress"] = progress
        if status in ["completed", "failed"]:
            update_data["completed_at"] = datetime.utcnow()
        
        return await self.update(db, db_obj=task, obj_in=update_data)
    
    async def update_task_progress(
        self, 
        db: AsyncSession, 
        task_id: str, 
        symbols_completed: int,
        message: Optional[str] = None
    ) -> Optional[BacktestTask]:
        """更新任务进度"""
        task = await self.get(db, task_id)
        if not task:
            return None
        
        progress = (symbols_completed / task.symbols_total * 100) if task.symbols_total > 0 else 0
        
        update_data = {
            "symbols_completed": symbols_completed,
            "progress": progress
        }
        if message:
            update_data["message"] = message
        
        return await self.update(db, db_obj=task, obj_in=update_data)
    
    async def get_task_statistics(self, db: AsyncSession) -> Dict[str, Any]:
        """获取任务统计信息"""
        total_tasks = await self.count(db)
        completed_tasks = await self.count(db, filters={"status": "completed"})
        failed_tasks = await self.count(db, filters={"status": "failed"})
        running_tasks = await self.count(db, filters={"status": "running"})
        
        return {
            "total_tasks": total_tasks,
            "completed_tasks": completed_tasks,
            "failed_tasks": failed_tasks,
            "running_tasks": running_tasks,
            "success_rate": (completed_tasks / total_tasks * 100) if total_tasks > 0 else 0
        }


class CRUDBacktestResult(CRUDBase[BacktestResult, Dict[str, Any], Dict[str, Any]]):
    """回测结果CRUD操作类"""
    
    async def get_by_task_id(
        self, 
        db: AsyncSession, 
        task_id: str,
        skip: int = 0,
        limit: int = 100
    ) -> List[BacktestResult]:
        """根据任务ID获取结果"""
        return await self.get_multi_by_field(db, "task_id", task_id, skip, limit)
    
    async def get_by_symbol(
        self, 
        db: AsyncSession, 
        symbol: str,
        skip: int = 0,
        limit: int = 100
    ) -> List[BacktestResult]:
        """根据交易对获取结果"""
        return await self.get_multi_by_field(db, "symbol", symbol, skip, limit)
    
    async def get_by_strategy(
        self, 
        db: AsyncSession, 
        strategy: str,
        skip: int = 0,
        limit: int = 100
    ) -> List[BacktestResult]:
        """根据策略获取结果"""
        return await self.get_multi_by_field(db, "strategy", strategy, skip, limit)
    
    async def get_top_performers(
        self, 
        db: AsyncSession, 
        metric: str = "sharpe_ratio",
        limit: int = 10
    ) -> List[BacktestResult]:
        """获取表现最佳的结果"""
        if not hasattr(self.model, metric):
            metric = "sharpe_ratio"
        
        query = select(self.model).order_by(
            desc(getattr(self.model, metric))
        ).limit(limit)
        
        result = await db.execute(query)
        return result.scalars().all()
    
    async def get_performance_summary(
        self, 
        db: AsyncSession, 
        task_id: Optional[str] = None
    ) -> Dict[str, Any]:
        """获取性能摘要"""
        query = select(
            func.count(self.model.id).label("total_results"),
            func.avg(self.model.final_return).label("avg_return"),
            func.avg(self.model.sharpe_ratio).label("avg_sharpe"),
            func.avg(self.model.max_drawdown).label("avg_drawdown"),
            func.avg(self.model.win_rate).label("avg_win_rate"),
            func.max(self.model.final_return).label("max_return"),
            func.min(self.model.final_return).label("min_return"),
        )
        
        if task_id:
            query = query.where(self.model.task_id == task_id)
        
        result = await db.execute(query)
        row = result.first()
        
        return {
            "total_results": row.total_results or 0,
            "average_return": float(row.avg_return or 0),
            "average_sharpe_ratio": float(row.avg_sharpe or 0),
            "average_max_drawdown": float(row.avg_drawdown or 0),
            "average_win_rate": float(row.avg_win_rate or 0),
            "best_return": float(row.max_return or 0),
            "worst_return": float(row.min_return or 0),
        }
    
    async def delete_results_by_task(self, db: AsyncSession, task_id: str) -> int:
        """删除指定任务的所有结果"""
        query = select(self.model).where(self.model.task_id == task_id)
        result = await db.execute(query)
        results = result.scalars().all()
        
        count = len(results)
        for result_obj in results:
            await db.delete(result_obj)
        
        await db.commit()
        return count


# 创建CRUD实例
backtest_task_crud = CRUDBacktestTask(BacktestTask)
backtest_result_crud = CRUDBacktestResult(BacktestResult)

# 组合CRUD操作
class BacktestCRUD:
    """回测相关的组合CRUD操作"""
    
    def __init__(self):
        self.task = backtest_task_crud
        self.result = backtest_result_crud
    
    async def create_task_with_results(
        self, 
        db: AsyncSession, 
        task_data: Dict[str, Any],
        results_data: List[Dict[str, Any]]
    ) -> BacktestTask:
        """创建任务并保存结果"""
        # 创建任务
        task = await self.task.create(db, obj_in=task_data)
        
        # 创建结果
        for result_data in results_data:
            result_data["task_id"] = task.task_id
            await self.result.create(db, obj_in=result_data)
        
        return task
    
    async def get_task_with_results(
        self, 
        db: AsyncSession, 
        task_id: str
    ) -> Optional[Dict[str, Any]]:
        """获取任务及其结果"""
        task = await self.task.get(db, task_id)
        if not task:
            return None
        
        results = await self.result.get_by_task_id(db, task_id)
        
        return {
            "task": task.to_dict(),
            "results": [result.to_dict() for result in results]
        }
    
    async def cleanup_old_tasks(
        self, 
        db: AsyncSession, 
        days: int = 30
    ) -> Dict[str, int]:
        """清理旧任务和结果"""
        cutoff_date = datetime.utcnow() - timedelta(days=days)
        
        # 获取要删除的任务
        query = select(self.task.model).where(
            and_(
                self.task.model.created_at < cutoff_date,
                self.task.model.status.in_(["completed", "failed"])
            )
        )
        result = await db.execute(query)
        old_tasks = result.scalars().all()
        
        tasks_deleted = 0
        results_deleted = 0
        
        for task in old_tasks:
            # 删除相关结果
            count = await self.result.delete_results_by_task(db, task.task_id)
            results_deleted += count
            
            # 删除任务
            await db.delete(task)
            tasks_deleted += 1
        
        await db.commit()
        
        return {
            "tasks_deleted": tasks_deleted,
            "results_deleted": results_deleted
        }


# 创建组合CRUD实例
backtest_crud = BacktestCRUD()
