#!/usr/bin/env python3
"""
NagaFlow Backend 启动脚本
简化版本，避免复杂的导入问题
"""

import sys
import os
import uvicorn
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

# 添加路径
project_root = os.path.dirname(os.path.abspath(__file__))
backend_path = os.path.join(project_root, 'backend')
sys.path.insert(0, backend_path)
sys.path.insert(0, os.path.join(project_root, 'bn_data'))
sys.path.insert(0, os.path.join(project_root, 'crypto_cta'))

print("🚀 启动NagaFlow后端服务")
print(f"📁 项目根目录: {project_root}")

# 创建FastAPI应用
app = FastAPI(
    title="NagaFlow API",
    description="加密货币量化交易系统Web API",
    version="1.0.0"
)

# 配置CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # 开发环境允许所有来源
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
async def root():
    """根路径"""
    return {
        "message": "Welcome to NagaFlow API",
        "version": "1.0.0",
        "docs": "/docs",
        "status": "running"
    }

@app.get("/health")
async def health_check():
    """健康检查"""
    return {"status": "healthy", "service": "NagaFlow Backend"}

# 测试API端点
@app.get("/test/crypto_cta")
async def test_crypto_cta():
    """测试crypto_cta模块"""
    try:
        # 测试导入
        from app.api.backtest import setup_crypto_cta_imports, CTA_AVAILABLE
        
        # 执行导入设置
        success = setup_crypto_cta_imports()
        
        return {
            "crypto_cta_available": CTA_AVAILABLE,
            "import_success": success,
            "message": "crypto_cta模块测试完成"
        }
    except Exception as e:
        return {
            "crypto_cta_available": False,
            "import_success": False,
            "error": str(e),
            "message": "crypto_cta模块测试失败"
        }

@app.get("/test/bn_data")
async def test_bn_data():
    """测试bn_data模块"""
    try:
        from app.api.data import BN_DATA_AVAILABLE
        
        return {
            "bn_data_available": BN_DATA_AVAILABLE,
            "message": "bn_data模块测试完成"
        }
    except Exception as e:
        return {
            "bn_data_available": False,
            "error": str(e),
            "message": "bn_data模块测试失败"
        }

@app.get("/test/factors")
async def test_factors():
    """测试因子功能"""
    try:
        from app.api.backtest import get_builtin_factor
        import pandas as pd
        
        # 创建测试数据
        test_data = pd.DataFrame({
            'candle_begin_time': pd.date_range('2024-01-01', periods=30, freq='H'),
            'open': [100.0] * 30,
            'high': [101.0] * 30,
            'low': [99.0] * 30,
            'close': [100.0 + i * 0.1 for i in range(30)],
            'volume': [1000.0] * 30
        })
        
        # 测试SMA因子
        sma_factor = get_builtin_factor('sma')
        sma_result = sma_factor.signal(test_data.copy(), para=[10])
        
        # 测试RSI因子
        rsi_factor = get_builtin_factor('rsi')
        rsi_result = rsi_factor.signal(test_data.copy(), para=[14, 70, 30])
        
        return {
            "factors_available": True,
            "sma_test": {
                "success": sma_result is not None and not sma_result.empty,
                "rows": len(sma_result) if sma_result is not None else 0,
                "signals": int(sma_result['signal'].notna().sum()) if sma_result is not None else 0
            },
            "rsi_test": {
                "success": rsi_result is not None and not rsi_result.empty,
                "rows": len(rsi_result) if rsi_result is not None else 0,
                "signals": int(rsi_result['signal'].notna().sum()) if rsi_result is not None else 0
            },
            "message": "因子功能测试完成"
        }
    except Exception as e:
        import traceback
        return {
            "factors_available": False,
            "error": str(e),
            "traceback": traceback.format_exc(),
            "message": "因子功能测试失败"
        }

@app.get("/test/data_files")
async def test_data_files():
    """测试数据文件读取"""
    try:
        from app.api.data import read_pickle_market_data
        
        # 测试读取BTCUSDT数据
        data = await read_pickle_market_data('BTCUSDT', '1H', 10)
        
        return {
            "data_files_available": data is not None,
            "data_count": len(data) if data else 0,
            "sample_data": data[:2] if data else None,
            "message": "数据文件测试完成"
        }
    except Exception as e:
        return {
            "data_files_available": False,
            "error": str(e),
            "message": "数据文件测试失败"
        }

def find_available_port():
    """查找可用端口"""
    import socket
    
    ports = [8000, 8001, 8002, 8003, 8004, 8005]
    for port in ports:
        with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
            try:
                s.bind(('localhost', port))
                return port
            except OSError:
                continue
    return 8000  # 默认端口

if __name__ == "__main__":
    port = find_available_port()
    print(f"🚀 启动服务器在端口 {port}")
    print(f"📖 API文档: http://localhost:{port}/docs")
    print(f"🧪 测试页面:")
    print(f"   - crypto_cta测试: http://localhost:{port}/test/crypto_cta")
    print(f"   - bn_data测试: http://localhost:{port}/test/bn_data")
    print(f"   - 因子测试: http://localhost:{port}/test/factors")
    print(f"   - 数据文件测试: http://localhost:{port}/test/data_files")
    
    uvicorn.run(
        app,
        host="0.0.0.0",
        port=port,
        log_level="info"
    )
