"""
应用配置文件
"""
from pydantic_settings import BaseSettings
from typing import List
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
    
    class Config:
        env_file = ".env"

# 创建全局设置实例
settings = Settings()
