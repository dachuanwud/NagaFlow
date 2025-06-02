"""
基础CRUD操作类
"""
from typing import Any, Dict, Generic, List, Optional, Type, TypeVar, Union
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, update, delete, func
from sqlalchemy.orm import selectinload
from pydantic import BaseModel

from ..database.base import Base

ModelType = TypeVar("ModelType", bound=Base)
CreateSchemaType = TypeVar("CreateSchemaType", bound=BaseModel)
UpdateSchemaType = TypeVar("UpdateSchemaType", bound=BaseModel)


class CRUDBase(Generic[ModelType, CreateSchemaType, UpdateSchemaType]):
    """基础CRUD操作类"""
    
    def __init__(self, model: Type[ModelType]):
        """
        初始化CRUD对象
        
        Args:
            model: SQLAlchemy模型类
        """
        self.model = model
    
    async def get(self, db: AsyncSession, id: Any) -> Optional[ModelType]:
        """根据ID获取单个对象"""
        result = await db.execute(select(self.model).where(self.model.id == id))
        return result.scalar_one_or_none()
    
    async def get_multi(
        self, 
        db: AsyncSession, 
        *, 
        skip: int = 0, 
        limit: int = 100,
        filters: Optional[Dict[str, Any]] = None
    ) -> List[ModelType]:
        """获取多个对象"""
        query = select(self.model)
        
        # 应用过滤条件
        if filters:
            for key, value in filters.items():
                if hasattr(self.model, key):
                    query = query.where(getattr(self.model, key) == value)
        
        query = query.offset(skip).limit(limit)
        result = await db.execute(query)
        return result.scalars().all()
    
    async def count(
        self, 
        db: AsyncSession, 
        filters: Optional[Dict[str, Any]] = None
    ) -> int:
        """获取对象总数"""
        query = select(func.count(self.model.id))
        
        # 应用过滤条件
        if filters:
            for key, value in filters.items():
                if hasattr(self.model, key):
                    query = query.where(getattr(self.model, key) == value)
        
        result = await db.execute(query)
        return result.scalar()
    
    async def create(self, db: AsyncSession, *, obj_in: CreateSchemaType) -> ModelType:
        """创建新对象"""
        obj_in_data = obj_in.dict() if hasattr(obj_in, 'dict') else obj_in
        db_obj = self.model(**obj_in_data)
        db.add(db_obj)
        await db.commit()
        await db.refresh(db_obj)
        return db_obj
    
    async def update(
        self,
        db: AsyncSession,
        *,
        db_obj: ModelType,
        obj_in: Union[UpdateSchemaType, Dict[str, Any]]
    ) -> ModelType:
        """更新对象"""
        obj_data = db_obj.__dict__.copy()
        
        if isinstance(obj_in, dict):
            update_data = obj_in
        else:
            update_data = obj_in.dict(exclude_unset=True) if hasattr(obj_in, 'dict') else obj_in
        
        for field in obj_data:
            if field in update_data:
                setattr(db_obj, field, update_data[field])
        
        db.add(db_obj)
        await db.commit()
        await db.refresh(db_obj)
        return db_obj
    
    async def remove(self, db: AsyncSession, *, id: Any) -> Optional[ModelType]:
        """删除对象"""
        obj = await self.get(db, id=id)
        if obj:
            await db.delete(obj)
            await db.commit()
        return obj
    
    async def get_by_field(
        self, 
        db: AsyncSession, 
        field_name: str, 
        field_value: Any
    ) -> Optional[ModelType]:
        """根据字段值获取对象"""
        if hasattr(self.model, field_name):
            query = select(self.model).where(getattr(self.model, field_name) == field_value)
            result = await db.execute(query)
            return result.scalar_one_or_none()
        return None
    
    async def get_multi_by_field(
        self, 
        db: AsyncSession, 
        field_name: str, 
        field_value: Any,
        skip: int = 0,
        limit: int = 100
    ) -> List[ModelType]:
        """根据字段值获取多个对象"""
        if hasattr(self.model, field_name):
            query = select(self.model).where(getattr(self.model, field_name) == field_value)
            query = query.offset(skip).limit(limit)
            result = await db.execute(query)
            return result.scalars().all()
        return []
