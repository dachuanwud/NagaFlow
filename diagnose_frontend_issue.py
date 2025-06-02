#!/usr/bin/env python3
"""
诊断NagaFlow前端回测页面空白问题
"""
import os
import re
import json

def analyze_frontend_code():
    """分析前端代码中可能导致页面空白的问题"""
    print("🔍 NagaFlow前端回测页面空白问题诊断")
    print("=" * 60)
    
    issues = []
    
    # 1. 检查BacktestPage组件
    backtest_page_path = "frontend/src/pages/BacktestPage/index.tsx"
    if os.path.exists(backtest_page_path):
        print("\n1️⃣ 分析BacktestPage组件...")
        with open(backtest_page_path, 'r', encoding='utf-8') as f:
            content = f.read()
            
        # 检查可能的问题
        potential_issues = []
        
        # 检查状态管理
        if 'pageLoading' in content and 'setPageLoading' in content:
            print("   ✅ 找到页面加载状态管理")
            if 'pageLoading' in content and 'return' in content:
                loading_return_pattern = r'if\s*\(\s*pageLoading\s*\)\s*\{[^}]*return[^}]*\}'
                if re.search(loading_return_pattern, content, re.DOTALL):
                    print("   ✅ 找到页面加载时的返回逻辑")
                else:
                    potential_issues.append("页面加载状态可能没有正确的返回逻辑")
        
        # 检查错误状态
        if 'error' in content and 'setError' in content:
            print("   ✅ 找到错误状态管理")
            if 'if (error)' in content:
                print("   ✅ 找到错误状态的处理逻辑")
            else:
                potential_issues.append("错误状态可能没有正确的处理逻辑")
        
        # 检查数据获取
        if 'fetchSymbols' in content:
            print("   ✅ 找到交易对数据获取函数")
        else:
            potential_issues.append("缺少交易对数据获取函数")
            
        # 检查useEffect
        useeffect_count = content.count('useEffect')
        print(f"   📊 找到 {useeffect_count} 个useEffect钩子")
        
        # 检查可能的无限循环
        if 'useEffect' in content and '[]' not in content:
            potential_issues.append("可能存在useEffect依赖问题导致无限循环")
        
        # 检查组件渲染条件
        if 'selectedSymbols' in content:
            print("   ✅ 找到selectedSymbols状态")
        
        if potential_issues:
            print("   ⚠️ 发现潜在问题:")
            for issue in potential_issues:
                print(f"      - {issue}")
            issues.extend(potential_issues)
    else:
        issues.append("BacktestPage组件文件不存在")
    
    # 2. 检查TimeRangeHint组件
    time_range_hint_path = "frontend/src/components/TimeRangeHint/index.tsx"
    if os.path.exists(time_range_hint_path):
        print("\n2️⃣ 分析TimeRangeHint组件...")
        with open(time_range_hint_path, 'r', encoding='utf-8') as f:
            content = f.read()
            
        # 检查API调用
        if 'backtestApi.getDataTimeRange' in content:
            print("   ✅ 找到数据时间范围API调用")
        else:
            issues.append("TimeRangeHint组件缺少API调用")
            
        # 检查错误处理
        if 'try' in content and 'catch' in content:
            print("   ✅ 找到错误处理逻辑")
        else:
            issues.append("TimeRangeHint组件缺少错误处理")
            
        # 检查loading状态
        if 'loading' in content and 'setLoading' in content:
            print("   ✅ 找到loading状态管理")
        else:
            issues.append("TimeRangeHint组件缺少loading状态")
    
    # 3. 检查FactorConfiguration组件
    factor_config_path = "frontend/src/components/FactorConfiguration/index.tsx"
    if os.path.exists(factor_config_path):
        print("\n3️⃣ 分析FactorConfiguration组件...")
        with open(factor_config_path, 'r', encoding='utf-8') as f:
            content = f.read()
            
        # 检查API调用
        if 'strategiesApi.listFactors' in content:
            print("   ✅ 找到策略因子API调用")
        else:
            issues.append("FactorConfiguration组件缺少API调用")
    
    # 4. 检查API配置
    api_path = "frontend/src/services/api.ts"
    if os.path.exists(api_path):
        print("\n4️⃣ 分析API配置...")
        with open(api_path, 'r', encoding='utf-8') as f:
            content = f.read()
            
        # 检查基础URL
        if 'baseURL' in content or 'BASE_URL' in content:
            print("   ✅ 找到API基础URL配置")
        else:
            issues.append("API配置可能缺少基础URL")
            
        # 检查错误处理
        if 'interceptors' in content:
            print("   ✅ 找到API拦截器")
        else:
            issues.append("API配置可能缺少错误拦截器")
    
    # 5. 检查可能的JavaScript错误
    print("\n5️⃣ 检查常见JavaScript错误模式...")
    
    # 检查所有TypeScript文件
    tsx_files = []
    for root, dirs, files in os.walk("frontend/src"):
        for file in files:
            if file.endswith(('.tsx', '.ts')):
                tsx_files.append(os.path.join(root, file))
    
    print(f"   📊 找到 {len(tsx_files)} 个TypeScript文件")
    
    # 检查常见错误模式
    error_patterns = [
        (r'console\.error\(', "发现console.error调用"),
        (r'throw\s+new\s+Error\(', "发现抛出错误"),
        (r'\.catch\s*\(\s*\(\s*error\s*\)', "发现错误捕获"),
        (r'useState\s*\<[^>]*\>\s*\(\s*undefined\s*\)', "发现未定义的初始状态"),
    ]
    
    for file_path in tsx_files[:5]:  # 只检查前5个文件
        try:
            with open(file_path, 'r', encoding='utf-8') as f:
                content = f.read()
                
            for pattern, description in error_patterns:
                if re.search(pattern, content):
                    print(f"   ⚠️ {os.path.basename(file_path)}: {description}")
        except Exception as e:
            print(f"   ❌ 无法读取文件 {file_path}: {e}")
    
    # 6. 生成诊断报告
    print("\n" + "=" * 60)
    print("📋 诊断报告")
    print("=" * 60)
    
    if not issues:
        print("✅ 未发现明显的代码问题")
        print("\n🔍 建议检查:")
        print("1. 浏览器控制台是否有JavaScript错误")
        print("2. 网络请求是否失败")
        print("3. 后端API是否正常响应")
        print("4. 前端路由配置是否正确")
    else:
        print("❌ 发现以下潜在问题:")
        for i, issue in enumerate(issues, 1):
            print(f"{i}. {issue}")
        
        print("\n🔧 修复建议:")
        print("1. 检查组件的错误边界和加载状态")
        print("2. 验证API调用的错误处理")
        print("3. 确保所有依赖项正确安装")
        print("4. 检查TypeScript类型错误")
    
    # 7. 生成调试代码
    print("\n🛠️ 调试代码建议:")
    debug_code = '''
// 在BacktestPage组件中添加调试代码
useEffect(() => {
  console.log('BacktestPage mounted');
  console.log('pageLoading:', pageLoading);
  console.log('error:', error);
  console.log('symbols:', symbols);
  console.log('factors:', factors);
}, [pageLoading, error, symbols, factors]);

// 在选择交易对的onChange中添加调试
onChange={(values) => {
  console.log('Selected symbols:', values);
  setSelectedSymbols(values);
  form.setFieldsValue({ symbols: values });
}}
'''
    print(debug_code)
    
    return issues

if __name__ == "__main__":
    analyze_frontend_code()
