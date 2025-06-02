"""
应用配置文件
"""
from pydantic_settings import BaseSettings
from typing import List, Optional
import os

class Settings(BaseSettings):
    # 应用基础配置
    app_name: str = "NagaFlow"
    app_version: str = "1.0.0"
    debug: bool = True

    # API配置
    api_prefix: str = "/api"

    # CORS配置
    allowed_origins: List[str] = [
        "http://localhost:3000",
        "http://localhost:5173",
        "http://127.0.0.1:3000",
        "http://127.0.0.1:5173"
    ]

    # 数据路径配置
    data_root_path: str = os.path.join(os.path.dirname(__file__), "..", "..", "..")
    bn_data_path: str = os.path.join(data_root_path, "bn_data")
    crypto_cta_path: str = os.path.join(data_root_path, "crypto_cta")

    # 静态文件配置
    static_files_path: str = os.path.join(os.path.dirname(__file__), "..", "..", "static")

    # 日志配置
    log_level: str = "INFO"
    log_file: str = "nagaflow.log"

    # 数据库配置
    database_url: str = "sqlite+aiosqlite:///./nagaflow.db"
    database_echo: bool = False  # 是否打印SQL语句
    use_memory_storage: bool = False  # 是否使用内存存储（兼容模式）

    # PostgreSQL配置（生产环境）
    postgres_host: Optional[str] = None
    postgres_port: int = 5432
    postgres_user: Optional[str] = None
    postgres_password: Optional[str] = None
    postgres_db: Optional[str] = None

    # 数据库连接池配置
    db_pool_size: int = 10
    db_max_overflow: int = 20
    db_pool_timeout: int = 30

    @property
    def async_database_url(self) -> str:
        """获取异步数据库URL"""
        if self.postgres_host and self.postgres_user and self.postgres_password and self.postgres_db:
            return f"postgresql+asyncpg://{self.postgres_user}:{self.postgres_password}@{self.postgres_host}:{self.postgres_port}/{self.postgres_db}"
        return self.database_url

    @property
    def sync_database_url(self) -> str:
        """获取同步数据库URL（用于Alembic迁移）"""
        if self.postgres_host and self.postgres_user and self.postgres_password and self.postgres_db:
            return f"postgresql://{self.postgres_user}:{self.postgres_password}@{self.postgres_host}:{self.postgres_port}/{self.postgres_db}"
        return self.database_url.replace("+aiosqlite", "")

    class Config:
        env_file = ".env"

# 创建全局设置实例
settings = Settings()
