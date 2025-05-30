#!/usr/bin/env python3
"""
测试前后端API连接的脚本
用于验证所有API端点是否正常工作
"""

import requests
import json
import time
from datetime import datetime

# API基础URL
BASE_URL = "http://localhost:8003/api"

def test_api_endpoint(method, endpoint, data=None, expected_status=200):
    """测试API端点"""
    url = f"{BASE_URL}{endpoint}"

    try:
        if method.upper() == 'GET':
            response = requests.get(url, timeout=10)
        elif method.upper() == 'POST':
            response = requests.post(url, json=data, timeout=10)
        elif method.upper() == 'PUT':
            response = requests.put(url, json=data, timeout=10)
        elif method.upper() == 'DELETE':
            response = requests.delete(url, timeout=10)
        else:
            print(f"❌ 不支持的HTTP方法: {method}")
            return False

        print(f"📡 {method} {endpoint}")
        print(f"   状态码: {response.status_code}")

        if response.status_code == expected_status:
            print(f"   ✅ 成功")
            if response.content:
                try:
                    result = response.json()
                    print(f"   📄 响应: {json.dumps(result, indent=2, ensure_ascii=False)[:200]}...")
                except:
                    print(f"   📄 响应: {response.text[:200]}...")
            return True
        else:
            print(f"   ❌ 失败 (期望: {expected_status})")
            print(f"   📄 错误: {response.text}")
            return False

    except requests.exceptions.ConnectionError:
        print(f"❌ {method} {endpoint} - 连接失败 (后端服务未启动?)")
        return False
    except requests.exceptions.Timeout:
        print(f"❌ {method} {endpoint} - 请求超时")
        return False
    except Exception as e:
        print(f"❌ {method} {endpoint} - 错误: {str(e)}")
        return False

def main():
    """主测试函数"""
    print("🚀 开始测试NagaFlow API连接...")
    print("=" * 50)

    # 测试计数器
    total_tests = 0
    passed_tests = 0

    # 1. 测试数据管理API
    print("\n📊 测试数据管理API")
    print("-" * 30)

    tests = [
        ("GET", "/data/symbols", None),
        ("GET", "/data/symbols?trade_type=swap", None),
        ("GET", "/data/status", None),
    ]

    for method, endpoint, data in tests:
        total_tests += 1
        if test_api_endpoint(method, endpoint, data):
            passed_tests += 1
        print()

    # 2. 测试策略管理API
    print("\n🎯 测试策略管理API")
    print("-" * 30)

    tests = [
        ("GET", "/strategies/", None),
        ("GET", "/strategies/factors", None),
    ]

    for method, endpoint, data in tests:
        total_tests += 1
        if test_api_endpoint(method, endpoint, data):
            passed_tests += 1
        print()

    # 3. 测试回测API
    print("\n📈 测试回测API")
    print("-" * 30)

    tests = [
        ("GET", "/backtest/tasks", None),
    ]

    for method, endpoint, data in tests:
        total_tests += 1
        if test_api_endpoint(method, endpoint, data):
            passed_tests += 1
        print()

    # 4. 测试创建策略
    print("\n🔧 测试创建策略")
    print("-" * 30)

    strategy_data = {
        "name": "测试策略",
        "description": "API连接测试策略",
        "parameters": {"period": 14, "threshold": 0.7}
    }

    total_tests += 1
    if test_api_endpoint("POST", "/strategies/", strategy_data, 201):
        passed_tests += 1
    print()

    # 5. 测试数据下载
    print("\n💾 测试数据下载")
    print("-" * 30)

    download_data = {
        "symbols": ["BTCUSDT"],
        "trade_type": "swap",
        "intervals": ["1m"]
    }

    total_tests += 1
    if test_api_endpoint("POST", "/data/download", download_data):
        passed_tests += 1
    print()

    # 输出测试结果
    print("=" * 50)
    print(f"📊 测试完成!")
    print(f"   总测试数: {total_tests}")
    print(f"   通过测试: {passed_tests}")
    print(f"   失败测试: {total_tests - passed_tests}")
    print(f"   成功率: {(passed_tests/total_tests*100):.1f}%")

    if passed_tests == total_tests:
        print("🎉 所有API测试通过! 前后端连接正常!")
    else:
        print("⚠️  部分API测试失败，请检查后端服务状态")

    print("\n💡 提示:")
    print("   - 确保后端服务已启动 (python main.py)")
    print("   - 确保端口8000未被占用")
    print("   - 检查防火墙设置")

if __name__ == "__main__":
    main()
