"""
数据状态相关数据库模型
"""
from sqlalchemy import Column, String, Text, DateTime, Float, Integer, JSON, Index
from sqlalchemy.sql import func
from datetime import datetime
from typing import Dict, Any, List, Optional

from ..database.base import Base


class DataDownloadStatus(Base):
    """数据下载状态模型"""
    __tablename__ = "data_download_status"
    
    # 主键
    id = Column(String(36), primary_key=True, index=True)
    
    # 状态信息
    status = Column(String(50), nullable=False, index=True, default="idle")  # idle, downloading, processing, completed, error
    progress = Column(Float, default=0.0)
    message = Column(Text)
    
    # 下载配置
    symbols = Column(JSON)  # 下载的交易对列表
    trade_type = Column(String(20), default="swap")  # 交易类型
    intervals = Column(JSON, default=list)  # 时间间隔
    
    # 统计信息
    symbols_total = Column(Integer, default=0)
    symbols_completed = Column(Integer, default=0)
    
    # 错误信息
    error_details = Column(JSON)  # 错误详情
    
    # 时间戳
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)
    completed_at = Column(DateTime(timezone=True))
    
    # 创建索引
    __table_args__ = (
        Index('idx_download_status_created', 'status', 'created_at'),
        Index('idx_download_trade_type', 'trade_type'),
    )
    
    def to_dict(self) -> Dict[str, Any]:
        """转换为字典格式"""
        return {
            "id": self.id,
            "status": self.status,
            "progress": self.progress,
            "message": self.message,
            "symbols": self.symbols or [],
            "trade_type": self.trade_type,
            "intervals": self.intervals or [],
            "symbols_total": self.symbols_total,
            "symbols_completed": self.symbols_completed,
            "error_details": self.error_details or {},
            "created_at": self.created_at,
            "updated_at": self.updated_at,
            "completed_at": self.completed_at,
        }


class DataUpdateRecord(Base):
    """数据更新记录模型"""
    __tablename__ = "data_update_records"
    
    # 主键
    id = Column(String(36), primary_key=True, index=True)
    
    # 更新信息
    update_type = Column(String(50), nullable=False, index=True)  # real_data, market_data, etc.
    status = Column(String(50), nullable=False, index=True)  # success, failed, in_progress
    
    # 更新详情
    symbols_updated = Column(JSON)  # 更新的交易对
    data_source = Column(String(100))  # 数据源
    target_year = Column(String(10))  # 目标年份
    
    # 统计信息
    records_processed = Column(Integer, default=0)
    files_updated = Column(Integer, default=0)
    
    # 结果信息
    success_message = Column(Text)
    error_message = Column(Text)
    
    # 时间戳
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    completed_at = Column(DateTime(timezone=True))
    
    # 创建索引
    __table_args__ = (
        Index('idx_update_type_status', 'update_type', 'status'),
        Index('idx_update_created_at', 'created_at'),
    )
    
    def to_dict(self) -> Dict[str, Any]:
        """转换为字典格式"""
        return {
            "id": self.id,
            "update_type": self.update_type,
            "status": self.status,
            "symbols_updated": self.symbols_updated or [],
            "data_source": self.data_source,
            "target_year": self.target_year,
            "records_processed": self.records_processed,
            "files_updated": self.files_updated,
            "success_message": self.success_message,
            "error_message": self.error_message,
            "created_at": self.created_at,
            "completed_at": self.completed_at,
        }
