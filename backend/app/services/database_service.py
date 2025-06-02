"""
数据库服务层 - 提供高级数据库操作接口
"""
from typing import Dict, Any, List, Optional, Union
from sqlalchemy.ext.asyncio import AsyncSession
import logging

from ..core.config import settings
from ..crud import strategy_crud, backtest_crud, data_status_crud
from ..models.strategy import Strategy
from ..models.backtest import BacktestTask, BacktestResult
from ..models.data_status import DataDownloadStatus, DataUpdateRecord

logger = logging.getLogger(__name__)


class DatabaseService:
    """数据库服务类 - 提供统一的数据库操作接口"""
    
    def __init__(self):
        self.use_memory = settings.use_memory_storage
        self._memory_storage = {
            "strategies": {},
            "backtest_tasks": {},
            "backtest_results": {},
            "data_status": None,
        }
    
    # ==================== 策略相关操作 ====================
    
    async def get_strategy(
        self, 
        db: Optional[AsyncSession], 
        strategy_id: str
    ) -> Optional[Dict[str, Any]]:
        """获取策略"""
        if self.use_memory:
            strategy = self._memory_storage["strategies"].get(strategy_id)
            return strategy.to_dict() if strategy else None
        
        if not db:
            raise ValueError("数据库会话不能为空")
        
        strategy = await strategy_crud.get(db, strategy_id)
        return strategy.to_dict() if strategy else None
    
    async def get_strategies(
        self, 
        db: Optional[AsyncSession],
        skip: int = 0,
        limit: int = 100,
        active_only: bool = True
    ) -> List[Dict[str, Any]]:
        """获取策略列表"""
        if self.use_memory:
            strategies = list(self._memory_storage["strategies"].values())
            if active_only:
                strategies = [s for s in strategies if s.get("is_active", True)]
            return [s.to_dict() if hasattr(s, 'to_dict') else s for s in strategies[skip:skip+limit]]
        
        if not db:
            raise ValueError("数据库会话不能为空")
        
        if active_only:
            strategies = await strategy_crud.get_active_strategies(db, skip, limit)
        else:
            strategies = await strategy_crud.get_multi(db, skip=skip, limit=limit)
        
        return [strategy.to_dict() for strategy in strategies]
    
    async def create_strategy(
        self, 
        db: Optional[AsyncSession], 
        strategy_data: Dict[str, Any]
    ) -> Dict[str, Any]:
        """创建策略"""
        if self.use_memory:
            from ..models.strategy import Strategy
            strategy = Strategy.from_dict(strategy_data)
            self._memory_storage["strategies"][strategy.id] = strategy
            return strategy.to_dict()
        
        if not db:
            raise ValueError("数据库会话不能为空")
        
        strategy = await strategy_crud.create_strategy(db, strategy_data)
        return strategy.to_dict()
    
    async def update_strategy(
        self, 
        db: Optional[AsyncSession], 
        strategy_id: str, 
        update_data: Dict[str, Any]
    ) -> Optional[Dict[str, Any]]:
        """更新策略"""
        if self.use_memory:
            strategy = self._memory_storage["strategies"].get(strategy_id)
            if strategy:
                for key, value in update_data.items():
                    setattr(strategy, key, value)
                return strategy.to_dict()
            return None
        
        if not db:
            raise ValueError("数据库会话不能为空")
        
        strategy = await strategy_crud.update_strategy(db, strategy_id, update_data)
        return strategy.to_dict() if strategy else None
    
    async def delete_strategy(
        self, 
        db: Optional[AsyncSession], 
        strategy_id: str
    ) -> bool:
        """删除策略"""
        if self.use_memory:
            if strategy_id in self._memory_storage["strategies"]:
                del self._memory_storage["strategies"][strategy_id]
                return True
            return False
        
        if not db:
            raise ValueError("数据库会话不能为空")
        
        strategy = await strategy_crud.deactivate_strategy(db, strategy_id)
        return strategy is not None
    
    # ==================== 回测相关操作 ====================
    
    async def get_backtest_task(
        self, 
        db: Optional[AsyncSession], 
        task_id: str
    ) -> Optional[Dict[str, Any]]:
        """获取回测任务"""
        if self.use_memory:
            task = self._memory_storage["backtest_tasks"].get(task_id)
            return task.to_dict() if task else None
        
        if not db:
            raise ValueError("数据库会话不能为空")
        
        task = await backtest_crud.task.get(db, task_id)
        return task.to_dict() if task else None
    
    async def get_backtest_tasks(
        self, 
        db: Optional[AsyncSession],
        skip: int = 0,
        limit: int = 100,
        status: Optional[str] = None
    ) -> List[Dict[str, Any]]:
        """获取回测任务列表"""
        if self.use_memory:
            tasks = list(self._memory_storage["backtest_tasks"].values())
            if status:
                tasks = [t for t in tasks if t.get("status") == status]
            return [t.to_dict() if hasattr(t, 'to_dict') else t for t in tasks[skip:skip+limit]]
        
        if not db:
            raise ValueError("数据库会话不能为空")
        
        if status:
            tasks = await backtest_crud.task.get_by_status(db, status, skip, limit)
        else:
            tasks = await backtest_crud.task.get_multi(db, skip=skip, limit=limit)
        
        return [task.to_dict() for task in tasks]
    
    async def create_backtest_task(
        self, 
        db: Optional[AsyncSession], 
        task_data: Dict[str, Any]
    ) -> Dict[str, Any]:
        """创建回测任务"""
        if self.use_memory:
            from ..models.backtest import BacktestTask
            task = BacktestTask(**task_data)
            self._memory_storage["backtest_tasks"][task.task_id] = task
            return task.to_dict()
        
        if not db:
            raise ValueError("数据库会话不能为空")
        
        task = await backtest_crud.task.create(db, obj_in=task_data)
        return task.to_dict()
    
    async def update_backtest_task(
        self, 
        db: Optional[AsyncSession], 
        task_id: str, 
        update_data: Dict[str, Any]
    ) -> Optional[Dict[str, Any]]:
        """更新回测任务"""
        if self.use_memory:
            task = self._memory_storage["backtest_tasks"].get(task_id)
            if task:
                for key, value in update_data.items():
                    setattr(task, key, value)
                return task.to_dict()
            return None
        
        if not db:
            raise ValueError("数据库会话不能为空")
        
        task = await backtest_crud.task.get(db, task_id)
        if task:
            updated_task = await backtest_crud.task.update(db, db_obj=task, obj_in=update_data)
            return updated_task.to_dict()
        return None
    
    async def create_backtest_result(
        self, 
        db: Optional[AsyncSession], 
        result_data: Dict[str, Any]
    ) -> Dict[str, Any]:
        """创建回测结果"""
        if self.use_memory:
            from ..models.backtest import BacktestResult
            result = BacktestResult(**result_data)
            # 在内存模式下，我们可以简单地存储在任务相关的结果中
            task_id = result_data.get("task_id")
            if task_id not in self._memory_storage["backtest_results"]:
                self._memory_storage["backtest_results"][task_id] = []
            self._memory_storage["backtest_results"][task_id].append(result)
            return result.to_dict()
        
        if not db:
            raise ValueError("数据库会话不能为空")
        
        result = await backtest_crud.result.create(db, obj_in=result_data)
        return result.to_dict()
    
    async def get_backtest_results(
        self, 
        db: Optional[AsyncSession], 
        task_id: str
    ) -> List[Dict[str, Any]]:
        """获取回测结果"""
        if self.use_memory:
            results = self._memory_storage["backtest_results"].get(task_id, [])
            return [r.to_dict() if hasattr(r, 'to_dict') else r for r in results]
        
        if not db:
            raise ValueError("数据库会话不能为空")
        
        results = await backtest_crud.result.get_by_task_id(db, task_id)
        return [result.to_dict() for result in results]
    
    # ==================== 数据状态相关操作 ====================
    
    async def get_data_status(self, db: Optional[AsyncSession]) -> Dict[str, Any]:
        """获取数据状态"""
        if self.use_memory:
            status = self._memory_storage.get("data_status")
            if status:
                return status.to_dict() if hasattr(status, 'to_dict') else status
            return {
                "status": "idle",
                "progress": 0.0,
                "message": "Ready to download data",
                "symbols_total": 0,
                "symbols_completed": 0,
            }
        
        if not db:
            raise ValueError("数据库会话不能为空")
        
        status = await data_status_crud.download.get_current_status(db)
        if status:
            return status.to_dict()
        
        return {
            "status": "idle",
            "progress": 0.0,
            "message": "Ready to download data",
            "symbols_total": 0,
            "symbols_completed": 0,
        }
    
    async def update_data_status(
        self, 
        db: Optional[AsyncSession], 
        status_data: Dict[str, Any]
    ) -> Dict[str, Any]:
        """更新数据状态"""
        if self.use_memory:
            from ..models.data_status import DataDownloadStatus
            if self._memory_storage["data_status"] is None:
                self._memory_storage["data_status"] = DataDownloadStatus(**status_data)
            else:
                for key, value in status_data.items():
                    setattr(self._memory_storage["data_status"], key, value)
            return self._memory_storage["data_status"].to_dict()
        
        if not db:
            raise ValueError("数据库会话不能为空")
        
        current_status = await data_status_crud.download.get_current_status(db)
        if current_status:
            updated_status = await data_status_crud.download.update_download_status(
                db, current_status.id, **status_data
            )
            return updated_status.to_dict() if updated_status else {}
        else:
            # 创建新的状态记录
            new_status = await data_status_crud.download.create(db, obj_in=status_data)
            return new_status.to_dict()
    
    # ==================== 工具方法 ====================
    
    def switch_to_database_mode(self):
        """切换到数据库模式"""
        self.use_memory = False
        logger.info("已切换到数据库模式")
    
    def switch_to_memory_mode(self):
        """切换到内存模式"""
        self.use_memory = True
        logger.info("已切换到内存模式")
    
    def clear_memory_storage(self):
        """清空内存存储"""
        self._memory_storage = {
            "strategies": {},
            "backtest_tasks": {},
            "backtest_results": {},
            "data_status": None,
        }
        logger.info("内存存储已清空")


# 创建全局数据库服务实例
db_service = DatabaseService()
