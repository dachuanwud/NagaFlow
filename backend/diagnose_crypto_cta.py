#!/usr/bin/env python3
"""
诊断 crypto_cta 集成问题的脚本
"""

import sys
import os

def diagnose_paths():
    """诊断路径问题"""
    print("=" * 60)
    print("🔍 路径诊断")
    print("=" * 60)
    
    current_dir = os.getcwd()
    script_dir = os.path.dirname(os.path.abspath(__file__))
    project_root = os.path.dirname(script_dir)
    
    print(f"当前工作目录: {current_dir}")
    print(f"脚本目录: {script_dir}")
    print(f"项目根目录: {project_root}")
    
    # 检查关键路径
    paths_to_check = {
        'crypto_cta': os.path.join(project_root, 'crypto_cta'),
        'backend': os.path.join(project_root, 'backend'),
        'crypto_cta/factors': os.path.join(project_root, 'crypto_cta', 'factors'),
        'crypto_cta/cta_api': os.path.join(project_root, 'crypto_cta', 'cta_api'),
    }
    
    for name, path in paths_to_check.items():
        exists = os.path.exists(path)
        print(f"{name}: {'✅' if exists else '❌'} {path}")
        
        if exists and os.path.isdir(path):
            try:
                contents = os.listdir(path)
                print(f"  内容: {contents[:5]}{'...' if len(contents) > 5 else ''}")
            except Exception as e:
                print(f"  无法列出内容: {e}")
    
    return project_root

def diagnose_imports(project_root):
    """诊断导入问题"""
    print("\n" + "=" * 60)
    print("🔍 导入诊断")
    print("=" * 60)
    
    crypto_cta_path = os.path.join(project_root, 'crypto_cta')
    
    # 添加路径到 sys.path
    if crypto_cta_path not in sys.path:
        sys.path.insert(0, crypto_cta_path)
        print(f"✅ 已添加 crypto_cta 路径到 sys.path")
    
    print(f"当前 sys.path 中包含 crypto_cta 的路径:")
    for i, path in enumerate(sys.path):
        if 'crypto_cta' in path:
            print(f"  [{i}] {path}")
    
    # 测试基础导入
    imports_to_test = [
        ('config', 'config'),
        ('cta_api.function', 'cta_api.function'),
        ('cta_api.cta_core', 'cta_api.cta_core'),
        ('factors.kdj', 'factors.kdj'),
        ('factors.sma', 'factors.sma'),
    ]
    
    successful_imports = []
    failed_imports = []
    
    for module_name, import_path in imports_to_test:
        try:
            module = __import__(import_path, fromlist=('',))
            successful_imports.append(module_name)
            print(f"✅ {module_name}: 导入成功")
            
            # 检查模块属性
            if hasattr(module, 'signal'):
                print(f"   包含 signal 函数")
            if hasattr(module, '__file__'):
                print(f"   文件位置: {module.__file__}")
                
        except Exception as e:
            failed_imports.append((module_name, str(e)))
            print(f"❌ {module_name}: 导入失败 - {e}")
    
    print(f"\n📊 导入结果:")
    print(f"  成功: {len(successful_imports)}")
    print(f"  失败: {len(failed_imports)}")
    
    return len(successful_imports) > 0

def diagnose_kdj_factor(project_root):
    """专门诊断 KDJ 因子"""
    print("\n" + "=" * 60)
    print("🔍 KDJ 因子诊断")
    print("=" * 60)
    
    kdj_path = os.path.join(project_root, 'crypto_cta', 'factors', 'kdj.py')
    
    if not os.path.exists(kdj_path):
        print(f"❌ KDJ 文件不存在: {kdj_path}")
        return False
    
    print(f"✅ KDJ 文件存在: {kdj_path}")
    
    # 读取文件内容
    try:
        with open(kdj_path, 'r', encoding='utf-8') as f:
            content = f.read()
        
        print(f"✅ 文件大小: {len(content)} 字符")
        
        # 检查关键函数
        if 'def signal(' in content:
            print("✅ 包含 signal 函数定义")
        else:
            print("❌ 缺少 signal 函数定义")
        
        # 检查参数格式
        if 'para=' in content:
            print("✅ 包含 para 参数")
        
        # 显示函数签名
        lines = content.split('\n')
        for i, line in enumerate(lines):
            if 'def signal(' in line:
                print(f"   函数签名: {line.strip()}")
                # 显示文档字符串
                for j in range(i+1, min(i+10, len(lines))):
                    if '"""' in lines[j] or "'''" in lines[j]:
                        print(f"   文档: {lines[j].strip()}")
                        break
                break
        
        return True
        
    except Exception as e:
        print(f"❌ 读取文件失败: {e}")
        return False

def diagnose_backend_integration():
    """诊断 backend 集成"""
    print("\n" + "=" * 60)
    print("🔍 Backend 集成诊断")
    print("=" * 60)
    
    try:
        # 尝试导入 backend 模块
        backend_path = os.path.dirname(os.path.abspath(__file__))
        if backend_path not in sys.path:
            sys.path.insert(0, backend_path)
        
        from app.api.backtest import setup_crypto_cta_imports
        print("✅ 成功导入 setup_crypto_cta_imports")
        
        # 执行导入设置
        result = setup_crypto_cta_imports()
        print(f"✅ setup_crypto_cta_imports 执行结果: {result}")
        
        return result
        
    except Exception as e:
        print(f"❌ Backend 集成失败: {e}")
        import traceback
        traceback.print_exc()
        return False

def main():
    """主诊断函数"""
    print("🔧 crypto_cta 集成诊断工具")
    print(f"🐍 Python 版本: {sys.version}")
    
    # 运行诊断
    project_root = diagnose_paths()
    imports_ok = diagnose_imports(project_root)
    kdj_ok = diagnose_kdj_factor(project_root)
    backend_ok = diagnose_backend_integration()
    
    # 总结
    print("\n" + "=" * 60)
    print("📊 诊断总结")
    print("=" * 60)
    
    results = {
        "路径检查": True,  # 如果能运行到这里说明路径基本正常
        "模块导入": imports_ok,
        "KDJ 因子": kdj_ok,
        "Backend 集成": backend_ok,
    }
    
    for check, result in results.items():
        status = "✅ 正常" if result else "❌ 异常"
        print(f"  {check}: {status}")
    
    all_ok = all(results.values())
    
    if all_ok:
        print("\n🎉 所有检查通过！crypto_cta 集成应该正常工作")
    else:
        print("\n⚠️ 发现问题，需要修复以下项目:")
        for check, result in results.items():
            if not result:
                print(f"  - {check}")
    
    return all_ok

if __name__ == "__main__":
    success = main()
    sys.exit(0 if success else 1)
