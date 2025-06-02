"""
策略相关数据库模型
"""
from sqlalchemy import Column, String, Text, DateTime, Boolean, JSON, Index
from sqlalchemy.sql import func
from datetime import datetime
from typing import Dict, Any, List

from ..database.base import Base


class Strategy(Base):
    """策略模型"""
    __tablename__ = "strategies"
    
    # 主键
    id = Column(String(36), primary_key=True, index=True)
    
    # 基本信息
    name = Column(String(255), nullable=False, index=True)
    description = Column(Text)
    
    # 策略配置
    factors = Column(JSON, nullable=False, default=list)  # 使用的因子列表
    parameters = Column(JSON, nullable=False, default=dict)  # 策略参数
    
    # 状态
    is_active = Column(Boolean, default=True, index=True)
    
    # 时间戳
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)
    
    # 创建索引
    __table_args__ = (
        Index('idx_strategy_name_active', 'name', 'is_active'),
        Index('idx_strategy_created_at', 'created_at'),
    )
    
    def to_dict(self) -> Dict[str, Any]:
        """转换为字典格式"""
        return {
            "id": self.id,
            "name": self.name,
            "description": self.description,
            "factors": self.factors or [],
            "parameters": self.parameters or {},
            "is_active": self.is_active,
            "created_at": self.created_at,
            "updated_at": self.updated_at,
        }
    
    @classmethod
    def from_dict(cls, data: Dict[str, Any]) -> "Strategy":
        """从字典创建策略对象"""
        return cls(
            id=data.get("id"),
            name=data.get("name"),
            description=data.get("description"),
            factors=data.get("factors", []),
            parameters=data.get("parameters", {}),
            is_active=data.get("is_active", True),
        )
