"""
策略CRUD操作
"""
from typing import List, Optional, Dict, Any
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_

from .base import CRUDBase
from ..models.strategy import Strategy


class CRUDStrategy(CRUDBase[Strategy, Dict[str, Any], Dict[str, Any]]):
    """策略CRUD操作类"""
    
    async def get_by_name(self, db: AsyncSession, name: str) -> Optional[Strategy]:
        """根据策略名称获取策略"""
        return await self.get_by_field(db, "name", name)
    
    async def get_active_strategies(
        self, 
        db: AsyncSession, 
        skip: int = 0, 
        limit: int = 100
    ) -> List[Strategy]:
        """获取活跃的策略列表"""
        return await self.get_multi_by_field(db, "is_active", True, skip, limit)
    
    async def search_strategies(
        self, 
        db: AsyncSession, 
        search_term: str,
        skip: int = 0,
        limit: int = 100
    ) -> List[Strategy]:
        """搜索策略"""
        query = select(self.model).where(
            and_(
                self.model.is_active == True,
                self.model.name.contains(search_term)
            )
        ).offset(skip).limit(limit)
        
        result = await db.execute(query)
        return result.scalars().all()
    
    async def get_strategies_by_factor(
        self, 
        db: AsyncSession, 
        factor_name: str,
        skip: int = 0,
        limit: int = 100
    ) -> List[Strategy]:
        """根据因子名称获取策略"""
        # 注意：这里需要使用JSON查询，具体语法取决于数据库类型
        # SQLite和PostgreSQL的JSON查询语法不同
        query = select(self.model).where(
            and_(
                self.model.is_active == True,
                self.model.factors.contains([factor_name])  # 简化版本，实际可能需要更复杂的JSON查询
            )
        ).offset(skip).limit(limit)
        
        result = await db.execute(query)
        return result.scalars().all()
    
    async def create_strategy(
        self, 
        db: AsyncSession, 
        strategy_data: Dict[str, Any]
    ) -> Strategy:
        """创建新策略"""
        # 检查策略名称是否已存在
        existing = await self.get_by_name(db, strategy_data["name"])
        if existing:
            raise ValueError(f"策略名称 '{strategy_data['name']}' 已存在")
        
        return await self.create(db, obj_in=strategy_data)
    
    async def update_strategy(
        self, 
        db: AsyncSession, 
        strategy_id: str, 
        update_data: Dict[str, Any]
    ) -> Optional[Strategy]:
        """更新策略"""
        strategy = await self.get(db, strategy_id)
        if not strategy:
            return None
        
        # 如果更新名称，检查是否与其他策略冲突
        if "name" in update_data and update_data["name"] != strategy.name:
            existing = await self.get_by_name(db, update_data["name"])
            if existing and existing.id != strategy_id:
                raise ValueError(f"策略名称 '{update_data['name']}' 已存在")
        
        return await self.update(db, db_obj=strategy, obj_in=update_data)
    
    async def deactivate_strategy(self, db: AsyncSession, strategy_id: str) -> Optional[Strategy]:
        """停用策略（软删除）"""
        strategy = await self.get(db, strategy_id)
        if strategy:
            return await self.update(db, db_obj=strategy, obj_in={"is_active": False})
        return None
    
    async def activate_strategy(self, db: AsyncSession, strategy_id: str) -> Optional[Strategy]:
        """激活策略"""
        strategy = await self.get(db, strategy_id)
        if strategy:
            return await self.update(db, db_obj=strategy, obj_in={"is_active": True})
        return None
    
    async def get_strategy_statistics(self, db: AsyncSession) -> Dict[str, Any]:
        """获取策略统计信息"""
        total_count = await self.count(db)
        active_count = await self.count(db, filters={"is_active": True})
        inactive_count = total_count - active_count
        
        return {
            "total_strategies": total_count,
            "active_strategies": active_count,
            "inactive_strategies": inactive_count,
        }


# 创建策略CRUD实例
strategy_crud = CRUDStrategy(Strategy)
