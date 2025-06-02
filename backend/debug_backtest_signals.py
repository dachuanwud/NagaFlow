#!/usr/bin/env python3
"""
NagaFlow回测信号诊断脚本
用于深入分析回测结果为0的根本原因
"""

import sys
import os
import pandas as pd
import numpy as np
from datetime import datetime, timedelta

# 添加项目路径
sys.path.append('/Users/lishechuan/Downloads/NagaFlow')
sys.path.append('/Users/lishechuan/Downloads/NagaFlow/backend')
sys.path.append('/Users/lishechuan/Downloads/NagaFlow/crypto_cta')

async def debug_signal_generation():
    """调试信号生成过程"""
    print("🔍 开始诊断回测信号生成过程")
    print("=" * 60)

    try:
        # 导入必要的模块
        from app.api.backtest import (
            load_existing_data, calculate_strategy_signals,
            calculate_equity_curve_simple, calculate_backtest_statistics,
            BacktestRequest, run_real_backtest
        )

        # 创建测试请求
        request = BacktestRequest(
            symbols=["BTCUSDT"],
            strategy="sma",
            parameters={"short_window": 5, "long_window": 20},
            date_start="2024-01-01",
            date_end="2024-01-31",
            rule_type="1H",
            leverage_rate=1.0,
            c_rate=0.001,
            slippage=0.001
        )

        print(f"📊 测试配置:")
        print(f"   交易对: {request.symbols[0]}")
        print(f"   策略: {request.strategy}")
        print(f"   参数: {request.parameters}")
        print(f"   时间范围: {request.date_start} 到 {request.date_end}")

        # 1. 加载数据
        print(f"\n🔄 步骤1: 加载真实数据")
        df = await load_existing_data(request.symbols[0], request)
        if df is None or df.empty:
            print("❌ 数据加载失败")
            return False

        print(f"✅ 数据加载成功: {len(df)} 条记录")
        print(f"   时间范围: {df['candle_begin_time'].min()} 到 {df['candle_begin_time'].max()}")
        print(f"   价格范围: {df['close'].min():.2f} - {df['close'].max():.2f}")

        # 检查数据质量
        print(f"\n📈 数据质量检查:")
        print(f"   缺失值: {df.isnull().sum().sum()}")
        print(f"   价格变化: {df['close'].pct_change().std():.6f}")
        print(f"   前5行数据:")
        print(df[['candle_begin_time', 'open', 'high', 'low', 'close', 'volume']].head())

        # 2. 计算策略信号
        print(f"\n🔄 步骤2: 计算策略信号")
        df_signals = calculate_strategy_signals(df, request.strategy, request.parameters)
        if df_signals is None or df_signals.empty:
            print("❌ 信号计算失败")
            return False

        print(f"✅ 信号计算成功: {len(df_signals)} 条记录")

        # 检查信号列
        signal_cols = ['signal', 'pos']
        for col in signal_cols:
            if col in df_signals.columns:
                unique_vals = df_signals[col].dropna().unique()
                count_nonzero = (df_signals[col] != 0).sum()
                print(f"   {col}列: 唯一值 {unique_vals}, 非零数量 {count_nonzero}")
            else:
                print(f"   ⚠️ 缺少{col}列")

        # 显示信号详情
        if 'signal' in df_signals.columns:
            signal_changes = df_signals[df_signals['signal'].diff() != 0]
            print(f"\n📊 信号变化详情 (共{len(signal_changes)}次):")
            if len(signal_changes) > 0:
                print(signal_changes[['candle_begin_time', 'close', 'signal', 'pos']].head(10))
            else:
                print("   ⚠️ 没有发现信号变化")

        # 3. 计算资金曲线
        print(f"\n🔄 步骤3: 计算资金曲线")
        df_equity = calculate_equity_curve_simple(df_signals, request.leverage_rate, request.c_rate, request.slippage)

        print(f"✅ 资金曲线计算完成")

        # 检查资金曲线
        if 'equity_curve' in df_equity.columns:
            initial_equity = df_equity['equity_curve'].iloc[0]
            final_equity = df_equity['equity_curve'].iloc[-1]
            max_equity = df_equity['equity_curve'].max()
            min_equity = df_equity['equity_curve'].min()

            print(f"   初始净值: {initial_equity:.6f}")
            print(f"   最终净值: {final_equity:.6f}")
            print(f"   最高净值: {max_equity:.6f}")
            print(f"   最低净值: {min_equity:.6f}")
            print(f"   总收益率: {(final_equity - initial_equity):.6f}")

            # 检查收益率分布
            if 'net_return' in df_equity.columns:
                returns = df_equity['net_return'].dropna()
                print(f"   收益率统计: 均值={returns.mean():.6f}, 标准差={returns.std():.6f}")
                print(f"   非零收益率数量: {(returns != 0).sum()}")

        # 4. 计算统计指标
        print(f"\n🔄 步骤4: 计算统计指标")
        result = calculate_backtest_statistics(df_equity, request.symbols[0], request)

        print(f"✅ 统计指标计算完成")
        print(f"   总收益率: {result.final_return:.6f}")
        print(f"   年化收益率: {result.annual_return:.6f}")
        print(f"   最大回撤: {result.max_drawdown:.6f}")
        print(f"   夏普比率: {result.sharpe_ratio:.6f}")
        print(f"   交易次数: {result.total_trades}")
        print(f"   胜率: {result.win_rate:.6f}")

        # 5. 深度分析问题
        print(f"\n🔍 深度问题分析:")

        # 检查持仓变化
        if 'pos' in df_equity.columns:
            pos_changes = df_equity['pos'].diff().fillna(0)
            trade_count = (pos_changes != 0).sum()
            print(f"   持仓变化次数: {trade_count}")

            if trade_count == 0:
                print("   ❌ 问题发现: 没有任何持仓变化，策略没有产生交易信号")

                # 进一步分析SMA策略
                if request.strategy == "sma":
                    short_window = request.parameters.get('short_window', 5)
                    long_window = request.parameters.get('long_window', 20)

                    # 手动计算移动平均线
                    df_test = df_equity.copy()
                    df_test['sma_short'] = df_test['close'].rolling(window=short_window).mean()
                    df_test['sma_long'] = df_test['close'].rolling(window=long_window).mean()

                    # 检查移动平均线
                    print(f"   SMA分析:")
                    print(f"     短期均线({short_window}): {df_test['sma_short'].dropna().iloc[-1]:.2f}")
                    print(f"     长期均线({long_window}): {df_test['sma_long'].dropna().iloc[-1]:.2f}")

                    # 检查交叉点
                    df_test['cross_up'] = (df_test['sma_short'] > df_test['sma_long']) & (df_test['sma_short'].shift(1) <= df_test['sma_long'].shift(1))
                    df_test['cross_down'] = (df_test['sma_short'] < df_test['sma_long']) & (df_test['sma_short'].shift(1) >= df_test['sma_long'].shift(1))

                    cross_up_count = df_test['cross_up'].sum()
                    cross_down_count = df_test['cross_down'].sum()

                    print(f"     上穿次数: {cross_up_count}")
                    print(f"     下穿次数: {cross_down_count}")

                    if cross_up_count == 0 and cross_down_count == 0:
                        print("     ❌ 在测试期间内没有发生均线交叉")
                        print("     💡 建议: 尝试更短的均线周期或更长的测试时间范围")

                        # 显示均线走势
                        print(f"     最近10期均线数据:")
                        recent_data = df_test[['candle_begin_time', 'close', 'sma_short', 'sma_long']].tail(10)
                        print(recent_data.to_string(index=False))
            else:
                print(f"   ✅ 发现 {trade_count} 次持仓变化")

                # 检查交易成本影响
                if 'strategy_return' in df_equity.columns and 'net_return' in df_equity.columns:
                    strategy_returns = df_equity['strategy_return'].dropna()
                    net_returns = df_equity['net_return'].dropna()

                    total_strategy_return = strategy_returns.sum()
                    total_net_return = net_returns.sum()
                    cost_impact = total_strategy_return - total_net_return

                    print(f"   策略总收益: {total_strategy_return:.6f}")
                    print(f"   净总收益: {total_net_return:.6f}")
                    print(f"   成本影响: {cost_impact:.6f}")

                    if abs(cost_impact) > abs(total_strategy_return):
                        print("   ❌ 问题发现: 交易成本过高，抵消了所有策略收益")
                        print("   💡 建议: 降低交易成本参数或优化策略减少交易频率")

        return True

    except Exception as e:
        print(f"❌ 诊断过程中发生错误: {e}")
        import traceback
        traceback.print_exc()
        return False

if __name__ == "__main__":
    import asyncio
    success = asyncio.run(debug_signal_generation())
    if success:
        print(f"\n🎉 诊断完成")
    else:
        print(f"\n❌ 诊断失败")

    sys.exit(0 if success else 1)
