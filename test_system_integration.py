#!/usr/bin/env python3
"""
NagaFlow 系统集成测试脚本
验证所有核心功能是否正常工作
"""

import requests
import json
import time
import sys
from datetime import datetime

# 配置
BASE_URL = "http://localhost:8003"
FRONTEND_URL = "http://localhost:5173"

def test_health_check():
    """测试健康检查"""
    print("🔍 测试健康检查...")
    try:
        response = requests.get(f"{BASE_URL}/health", timeout=10)
        if response.status_code == 200:
            data = response.json()
            print(f"✅ 后端健康状态: {data['status']}")
            print(f"   数据库模式: {data['database_mode']}")
            return True
        else:
            print(f"❌ 健康检查失败: {response.status_code}")
            return False
    except Exception as e:
        print(f"❌ 健康检查异常: {e}")
        return False

def test_crypto_cta_integration():
    """测试 crypto_cta 集成"""
    print("\n🔍 测试 crypto_cta 集成...")
    try:
        response = requests.get(f"{BASE_URL}/api/backtest/test/crypto_cta", timeout=15)
        if response.status_code == 200:
            data = response.json()
            print(f"✅ crypto_cta 可用: {data['crypto_cta_available']}")
            print(f"   设置成功: {data['setup_success']}")
            print(f"   引擎类型: {data.get('engine', 'unknown')}")
            
            # 检查因子测试结果
            test_results = data.get('test_results', {})
            for factor, result in test_results.items():
                status = "✅" if result['status'] == 'success' else "❌"
                print(f"   {factor}: {status} - {result.get('module_path', 'N/A')}")
            
            return data['crypto_cta_available'] and data['setup_success']
        else:
            print(f"❌ crypto_cta 测试失败: {response.status_code}")
            return False
    except Exception as e:
        print(f"❌ crypto_cta 测试异常: {e}")
        return False

def test_available_symbols():
    """测试可用交易对"""
    print("\n🔍 测试可用交易对...")
    try:
        response = requests.get(f"{BASE_URL}/api/backtest/available-symbols", timeout=15)
        if response.status_code == 200:
            data = response.json()
            symbols = data.get('symbols', [])
            print(f"✅ 找到 {len(symbols)} 个可用交易对")
            if symbols:
                print(f"   示例: {symbols[:5]}")
                return True
            else:
                print("❌ 没有找到可用的交易对")
                return False
        else:
            print(f"❌ 获取交易对失败: {response.status_code}")
            return False
    except Exception as e:
        print(f"❌ 获取交易对异常: {e}")
        return False

def test_frontend_connection():
    """测试前端连接"""
    print("\n🔍 测试前端连接...")
    try:
        # 测试前端页面
        response = requests.get(FRONTEND_URL, timeout=10)
        if response.status_code == 200:
            print("✅ 前端页面可访问")
            
            # 测试前端API代理
            response = requests.get(f"{FRONTEND_URL}/api/health", timeout=10)
            if response.status_code == 200:
                print("✅ 前端API代理工作正常")
                return True
            else:
                print(f"❌ 前端API代理失败: {response.status_code}")
                return False
        else:
            print(f"❌ 前端页面不可访问: {response.status_code}")
            return False
    except Exception as e:
        print(f"❌ 前端连接异常: {e}")
        return False

def test_simple_backtest():
    """测试简单回测"""
    print("\n🔍 测试简单回测...")
    try:
        # 准备回测请求
        backtest_request = {
            "symbols": ["BTCUSDT"],
            "strategy": "sma",
            "parameters": {"short_window": 5, "long_window": 20},
            "date_start": "2024-01-01",
            "date_end": "2024-01-15",  # 缩短时间范围
            "rule_type": "1H",
            "leverage_rate": 1.0,
            "c_rate": 0.0008,
            "slippage": 0.001
        }
        
        print("   启动回测任务...")
        response = requests.post(
            f"{BASE_URL}/api/backtest/run",
            json=backtest_request,
            timeout=30
        )
        
        if response.status_code == 200:
            data = response.json()
            task_id = data.get('task_id')
            print(f"✅ 回测任务已启动: {task_id}")
            
            # 等待回测完成
            print("   等待回测完成...")
            max_wait = 60  # 最多等待60秒
            wait_time = 0
            
            while wait_time < max_wait:
                time.sleep(2)
                wait_time += 2
                
                status_response = requests.get(f"{BASE_URL}/api/backtest/status/{task_id}", timeout=10)
                if status_response.status_code == 200:
                    status_data = status_response.json()
                    status = status_data.get('status')
                    progress = status_data.get('progress', 0)
                    
                    print(f"   状态: {status}, 进度: {progress:.1f}%")
                    
                    if status == 'completed':
                        print("✅ 回测完成")
                        return True
                    elif status == 'failed':
                        message = status_data.get('message', 'Unknown error')
                        print(f"❌ 回测失败: {message}")
                        return False
                else:
                    print(f"❌ 获取状态失败: {status_response.status_code}")
                    return False
            
            print("❌ 回测超时")
            return False
        else:
            print(f"❌ 启动回测失败: {response.status_code}")
            if response.text:
                print(f"   错误信息: {response.text}")
            return False
    except Exception as e:
        print(f"❌ 回测异常: {e}")
        return False

def main():
    """主测试函数"""
    print("=" * 60)
    print("🌊 NagaFlow 系统集成测试")
    print("=" * 60)
    print(f"⏰ 测试时间: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    
    tests = [
        ("健康检查", test_health_check),
        ("crypto_cta 集成", test_crypto_cta_integration),
        ("可用交易对", test_available_symbols),
        ("前端连接", test_frontend_connection),
        ("简单回测", test_simple_backtest),
    ]
    
    results = []
    
    for test_name, test_func in tests:
        try:
            result = test_func()
            results.append((test_name, result))
        except Exception as e:
            print(f"❌ {test_name} 测试异常: {e}")
            results.append((test_name, False))
    
    # 输出测试结果
    print("\n" + "=" * 60)
    print("📊 测试结果汇总")
    print("=" * 60)
    
    passed = 0
    total = len(results)
    
    for test_name, result in results:
        status = "✅ 通过" if result else "❌ 失败"
        print(f"{test_name:20} : {status}")
        if result:
            passed += 1
    
    print("-" * 60)
    print(f"总计: {passed}/{total} 测试通过")
    
    if passed == total:
        print("🎉 所有测试通过！NagaFlow 系统运行正常")
        return 0
    else:
        print("⚠️  部分测试失败，请检查系统配置")
        return 1

if __name__ == "__main__":
    sys.exit(main())
