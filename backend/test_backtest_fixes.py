#!/usr/bin/env python3
"""
测试回测修复的脚本
验证前瞻偏差修复、交易成本计算修正、风险指标一致性等
"""

import sys
import os
import pandas as pd
import numpy as np
from datetime import datetime, timedelta

# 添加项目路径
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.api.backtest import (
    BacktestRequest,
    calculate_fallback_signals,
    calculate_equity_curve_simple,
    calculate_backtest_statistics,
    ensure_position_lag
)

def create_test_data(periods=100):
    """创建测试数据"""
    np.random.seed(42)  # 确保结果可重复

    dates = pd.date_range(start='2023-01-01', periods=periods, freq='1h')

    # 创建模拟价格数据（带趋势）
    price_base = 100
    returns = np.random.normal(0.0001, 0.02, periods)  # 小幅随机波动

    # 只在数据范围内添加趋势
    if periods > 40:
        returns[20:40] = np.random.normal(0.001, 0.02, 20)  # 上涨趋势段
    if periods > 80:
        returns[60:80] = np.random.normal(-0.001, 0.02, 20)  # 下跌趋势段

    prices = [price_base]
    for ret in returns[1:]:
        prices.append(prices[-1] * (1 + ret))

    df = pd.DataFrame({
        'candle_begin_time': dates,
        'open': prices,
        'high': [p * (1 + abs(np.random.normal(0, 0.005))) for p in prices],
        'low': [p * (1 - abs(np.random.normal(0, 0.005))) for p in prices],
        'close': prices,
        'volume': np.random.uniform(1000, 10000, periods)
    })

    # 确保OHLC数据一致性
    for i in range(len(df)):
        df.loc[i, 'high'] = max(df.loc[i, 'open'], df.loc[i, 'close'], df.loc[i, 'high'])
        df.loc[i, 'low'] = min(df.loc[i, 'open'], df.loc[i, 'close'], df.loc[i, 'low'])

    return df

def test_position_lag():
    """测试持仓延迟功能"""
    print("🧪 测试1: 持仓延迟功能")

    # 创建简单的信号数据
    df = pd.DataFrame({
        'signal': [0, 1, 1, 0, 0, 1, 1, 1, 0, 0],
        'close': [100, 101, 102, 103, 104, 105, 106, 107, 108, 109]
    })

    # 应用持仓延迟
    df_fixed = ensure_position_lag(df)

    print("原始信号:", df['signal'].tolist())
    print("延迟持仓:", df_fixed['pos'].tolist())

    # 验证延迟是否正确
    expected_pos = [0, 0, 1, 1, 0, 0, 1, 1, 1, 0]  # 信号延迟一期
    assert df_fixed['pos'].tolist() == expected_pos, f"持仓延迟错误: 期望 {expected_pos}, 实际 {df_fixed['pos'].tolist()}"

    print("✅ 持仓延迟测试通过")

def test_sma_strategy():
    """测试SMA策略的前瞻偏差修复"""
    print("\n🧪 测试2: SMA策略前瞻偏差修复")

    df = create_test_data(50)

    # 测试SMA策略
    params = {'short_window': 5, 'long_window': 10}
    df_result = calculate_fallback_signals(df, 'sma', params)

    # 验证信号生成
    print(f"生成信号数量: {df_result['signal'].sum()}")
    print(f"持仓变化次数: {(df_result['pos'].diff() != 0).sum()}")

    # 验证持仓延迟
    signal_changes = df_result[df_result['signal'].diff() != 0].index.tolist()
    pos_changes = df_result[df_result['pos'].diff() != 0].index.tolist()

    if signal_changes and pos_changes:
        # 持仓变化应该比信号变化晚1期
        assert all(p > s for s, p in zip(signal_changes, pos_changes) if p > 0), "持仓变化应该滞后于信号变化"

    print("✅ SMA策略前瞻偏差修复测试通过")

def test_equity_curve_calculation():
    """测试资金曲线计算修正"""
    print("\n🧪 测试3: 资金曲线计算修正")

    df = create_test_data(30)

    # 创建简单的持仓信号
    df['pos'] = [0] * 10 + [1] * 10 + [0] * 10  # 中间10期持仓

    # 计算资金曲线
    df_result = calculate_equity_curve_simple(df, leverage_rate=1.0, c_rate=0.001, slippage=0.001)

    print(f"初始资金曲线: {df_result['equity_curve'].iloc[0]:.4f}")
    print(f"最终资金曲线: {df_result['equity_curve'].iloc[-1]:.4f}")
    print(f"最大回撤: {abs(df_result['drawdown'].min()):.4f}")

    # 验证资金曲线的基本属性
    assert df_result['equity_curve'].iloc[0] == 1.0, "初始资金曲线应该为1"
    assert not df_result['equity_curve'].isna().any(), "资金曲线不应该有NaN值"
    assert (df_result['equity_curve'] > 0).all(), "资金曲线应该始终为正"

    print("✅ 资金曲线计算修正测试通过")

def test_risk_metrics():
    """测试风险指标计算一致性"""
    print("\n🧪 测试4: 风险指标计算一致性")

    df = create_test_data(100)
    df['pos'] = [1] * 100  # 买入持有

    # 计算资金曲线
    df_result = calculate_equity_curve_simple(df, leverage_rate=1.0, c_rate=0.001, slippage=0.001)

    # 创建回测请求
    request = BacktestRequest(
        symbols=['BTCUSDT'],
        strategy='sma',
        parameters={'short_window': 5, 'long_window': 10},
        rule_type='1H'
    )

    # 计算统计指标
    stats = calculate_backtest_statistics(df_result, 'BTCUSDT', request)

    print(f"年化收益率: {stats.annual_return:.4f}")
    print(f"年化波动率: {stats.volatility:.4f}")
    print(f"夏普比率: {stats.sharpe_ratio:.4f}")
    print(f"最大回撤: {stats.max_drawdown:.4f}")

    # 验证指标的合理性
    assert not np.isnan(stats.annual_return), "年化收益率不应该是NaN"
    assert not np.isnan(stats.volatility), "波动率不应该是NaN"
    assert stats.volatility >= 0, "波动率应该非负"
    assert stats.max_drawdown >= 0, "最大回撤应该非负"

    print("✅ 风险指标计算一致性测试通过")

def test_transaction_costs():
    """测试交易成本计算修正"""
    print("\n🧪 测试5: 交易成本计算修正")

    df = create_test_data(20)

    # 创建频繁交易的持仓信号
    df['pos'] = [0, 1, 0, 1, 0, 1, 0, 1, 0, 1] * 2

    # 计算资金曲线
    df_result = calculate_equity_curve_simple(df, leverage_rate=1.0, c_rate=0.01, slippage=0.01)  # 高交易成本

    # 验证交易成本的影响
    total_trades = (df_result['pos'].diff() != 0).sum()
    final_equity = df_result['equity_curve'].iloc[-1]

    print(f"总交易次数: {total_trades}")
    print(f"最终资金: {final_equity:.4f}")

    # 频繁交易 + 高成本应该导致资金减少
    assert final_equity < 1.0, "频繁交易和高成本应该导致资金减少"
    assert total_trades > 5, "应该有多次交易"

    print("✅ 交易成本计算修正测试通过")

def run_comprehensive_test():
    """运行综合测试"""
    print("🚀 开始运行NagaFlow回测修复综合测试")
    print("=" * 60)

    try:
        test_position_lag()
        test_sma_strategy()
        test_equity_curve_calculation()
        test_risk_metrics()
        test_transaction_costs()

        print("\n" + "=" * 60)
        print("🎉 所有测试通过！回测修复验证成功")
        print("✅ 前瞻偏差已消除")
        print("✅ 交易成本计算已修正")
        print("✅ 风险指标计算已标准化")
        print("✅ 持仓延迟机制正常工作")

    except Exception as e:
        print(f"\n❌ 测试失败: {e}")
        import traceback
        traceback.print_exc()
        return False

    return True

if __name__ == "__main__":
    success = run_comprehensive_test()
    sys.exit(0 if success else 1)
