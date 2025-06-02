"""
数据状态CRUD操作
"""
from typing import List, Optional, Dict, Any
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, desc, and_
from datetime import datetime, timedelta

from .base import CRUDBase
from ..models.data_status import DataDownloadStatus, DataUpdateRecord


class CRUDDataDownloadStatus(CRUDBase[DataDownloadStatus, Dict[str, Any], Dict[str, Any]]):
    """数据下载状态CRUD操作类"""
    
    async def get_current_status(self, db: AsyncSession) -> Optional[DataDownloadStatus]:
        """获取当前下载状态"""
        query = select(self.model).order_by(desc(self.model.created_at)).limit(1)
        result = await db.execute(query)
        return result.scalar_one_or_none()
    
    async def get_by_status(
        self, 
        db: AsyncSession, 
        status: str,
        skip: int = 0,
        limit: int = 100
    ) -> List[DataDownloadStatus]:
        """根据状态获取下载记录"""
        return await self.get_multi_by_field(db, "status", status, skip, limit)
    
    async def get_active_downloads(self, db: AsyncSession) -> List[DataDownloadStatus]:
        """获取活跃的下载任务"""
        query = select(self.model).where(
            self.model.status.in_(["downloading", "processing"])
        )
        result = await db.execute(query)
        return result.scalars().all()
    
    async def update_download_status(
        self, 
        db: AsyncSession, 
        download_id: str, 
        status: str,
        progress: Optional[float] = None,
        message: Optional[str] = None,
        symbols_completed: Optional[int] = None,
        error_details: Optional[Dict[str, Any]] = None
    ) -> Optional[DataDownloadStatus]:
        """更新下载状态"""
        download = await self.get(db, download_id)
        if not download:
            return None
        
        update_data = {"status": status}
        
        if progress is not None:
            update_data["progress"] = progress
        if message is not None:
            update_data["message"] = message
        if symbols_completed is not None:
            update_data["symbols_completed"] = symbols_completed
        if error_details is not None:
            update_data["error_details"] = error_details
        if status in ["completed", "error"]:
            update_data["completed_at"] = datetime.utcnow()
        
        return await self.update(db, db_obj=download, obj_in=update_data)
    
    async def create_download_task(
        self, 
        db: AsyncSession, 
        symbols: List[str],
        trade_type: str = "swap",
        intervals: List[str] = None
    ) -> DataDownloadStatus:
        """创建新的下载任务"""
        if intervals is None:
            intervals = ["1m", "5m"]
        
        download_data = {
            "id": f"download_{datetime.utcnow().strftime('%Y%m%d_%H%M%S')}",
            "status": "idle",
            "progress": 0.0,
            "message": "Download task created",
            "symbols": symbols,
            "trade_type": trade_type,
            "intervals": intervals,
            "symbols_total": len(symbols),
            "symbols_completed": 0,
        }
        
        return await self.create(db, obj_in=download_data)


class CRUDDataUpdateRecord(CRUDBase[DataUpdateRecord, Dict[str, Any], Dict[str, Any]]):
    """数据更新记录CRUD操作类"""
    
    async def get_by_update_type(
        self, 
        db: AsyncSession, 
        update_type: str,
        skip: int = 0,
        limit: int = 100
    ) -> List[DataUpdateRecord]:
        """根据更新类型获取记录"""
        return await self.get_multi_by_field(db, "update_type", update_type, skip, limit)
    
    async def get_recent_updates(
        self, 
        db: AsyncSession, 
        days: int = 7,
        skip: int = 0,
        limit: int = 100
    ) -> List[DataUpdateRecord]:
        """获取最近的更新记录"""
        since_date = datetime.utcnow() - timedelta(days=days)
        query = select(self.model).where(
            self.model.created_at >= since_date
        ).order_by(desc(self.model.created_at)).offset(skip).limit(limit)
        
        result = await db.execute(query)
        return result.scalars().all()
    
    async def get_successful_updates(
        self, 
        db: AsyncSession, 
        update_type: Optional[str] = None,
        skip: int = 0,
        limit: int = 100
    ) -> List[DataUpdateRecord]:
        """获取成功的更新记录"""
        query = select(self.model).where(self.model.status == "success")
        
        if update_type:
            query = query.where(self.model.update_type == update_type)
        
        query = query.order_by(desc(self.model.created_at)).offset(skip).limit(limit)
        result = await db.execute(query)
        return result.scalars().all()
    
    async def create_update_record(
        self, 
        db: AsyncSession, 
        update_type: str,
        symbols_updated: List[str] = None,
        data_source: str = None,
        target_year: str = None
    ) -> DataUpdateRecord:
        """创建新的更新记录"""
        record_data = {
            "id": f"update_{datetime.utcnow().strftime('%Y%m%d_%H%M%S')}",
            "update_type": update_type,
            "status": "in_progress",
            "symbols_updated": symbols_updated or [],
            "data_source": data_source,
            "target_year": target_year,
            "records_processed": 0,
            "files_updated": 0,
        }
        
        return await self.create(db, obj_in=record_data)
    
    async def complete_update_record(
        self, 
        db: AsyncSession, 
        record_id: str,
        success: bool,
        records_processed: int = 0,
        files_updated: int = 0,
        message: str = None
    ) -> Optional[DataUpdateRecord]:
        """完成更新记录"""
        record = await self.get(db, record_id)
        if not record:
            return None
        
        update_data = {
            "status": "success" if success else "failed",
            "records_processed": records_processed,
            "files_updated": files_updated,
            "completed_at": datetime.utcnow(),
        }
        
        if success:
            update_data["success_message"] = message or "Update completed successfully"
        else:
            update_data["error_message"] = message or "Update failed"
        
        return await self.update(db, db_obj=record, obj_in=update_data)
    
    async def get_update_statistics(
        self, 
        db: AsyncSession, 
        update_type: Optional[str] = None
    ) -> Dict[str, Any]:
        """获取更新统计信息"""
        query_base = select(self.model)
        if update_type:
            query_base = query_base.where(self.model.update_type == update_type)
        
        total_updates = await self.count(db, filters={"update_type": update_type} if update_type else None)
        successful_updates = await self.count(db, filters={
            "status": "success",
            **({"update_type": update_type} if update_type else {})
        })
        failed_updates = await self.count(db, filters={
            "status": "failed",
            **({"update_type": update_type} if update_type else {})
        })
        
        return {
            "total_updates": total_updates,
            "successful_updates": successful_updates,
            "failed_updates": failed_updates,
            "success_rate": (successful_updates / total_updates * 100) if total_updates > 0 else 0
        }


# 创建CRUD实例
data_download_status_crud = CRUDDataDownloadStatus(DataDownloadStatus)
data_update_record_crud = CRUDDataUpdateRecord(DataUpdateRecord)

# 组合CRUD操作
class DataStatusCRUD:
    """数据状态相关的组合CRUD操作"""
    
    def __init__(self):
        self.download = data_download_status_crud
        self.update = data_update_record_crud
    
    async def get_overall_status(self, db: AsyncSession) -> Dict[str, Any]:
        """获取整体数据状态"""
        current_download = await self.download.get_current_status(db)
        active_downloads = await self.download.get_active_downloads(db)
        recent_updates = await self.update.get_recent_updates(db, days=1, limit=5)
        
        return {
            "current_download": current_download.to_dict() if current_download else None,
            "active_downloads_count": len(active_downloads),
            "recent_updates": [update.to_dict() for update in recent_updates],
            "last_update_time": recent_updates[0].created_at if recent_updates else None,
        }
    
    async def cleanup_old_records(
        self, 
        db: AsyncSession, 
        days: int = 90
    ) -> Dict[str, int]:
        """清理旧记录"""
        cutoff_date = datetime.utcnow() - timedelta(days=days)
        
        # 清理下载状态记录
        download_query = select(self.download.model).where(
            and_(
                self.download.model.created_at < cutoff_date,
                self.download.model.status.in_(["completed", "error"])
            )
        )
        download_result = await db.execute(download_query)
        old_downloads = download_result.scalars().all()
        
        # 清理更新记录
        update_query = select(self.update.model).where(
            and_(
                self.update.model.created_at < cutoff_date,
                self.update.model.status.in_(["success", "failed"])
            )
        )
        update_result = await db.execute(update_query)
        old_updates = update_result.scalars().all()
        
        downloads_deleted = 0
        updates_deleted = 0
        
        for download in old_downloads:
            await db.delete(download)
            downloads_deleted += 1
        
        for update in old_updates:
            await db.delete(update)
            updates_deleted += 1
        
        await db.commit()
        
        return {
            "downloads_deleted": downloads_deleted,
            "updates_deleted": updates_deleted
        }


# 创建组合CRUD实例
data_status_crud = DataStatusCRUD()
