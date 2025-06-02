from cta_api.function import *
import numpy as np


def signal(df, para=[20, 2.0, 1.5], proportion=1, leverage_rate=1):
    """
    ATR突破策略
    :param df: 原始数据
    :param para: [atr_period, entry_multiplier, exit_multiplier] ATR突破参数
    :param proportion: 仓位比例
    :param leverage_rate: 杠杆倍数
    :return: 包含signal的数据
    
    # ATR突破策略
    价格突破前期高点+ATR*倍数时做多
    价格跌破前期低点-ATR*倍数时做空
    """
    
    # ===== 获取策略参数
    atr_period = int(para[0]) if len(para) > 0 else 20
    entry_multiplier = float(para[1]) if len(para) > 1 else 2.0
    exit_multiplier = float(para[2]) if len(para) > 2 else 1.5
    
    # ===== 计算ATR指标
    # 计算真实波幅
    df['high_low'] = df['high'] - df['low']
    df['high_close'] = abs(df['high'] - df['close'].shift(1))
    df['low_close'] = abs(df['low'] - df['close'].shift(1))
    df['true_range'] = df[['high_low', 'high_close', 'low_close']].max(axis=1)
    
    # 计算ATR
    df['atr'] = df['true_range'].rolling(window=atr_period, min_periods=1).mean()
    
    # 计算前期高低点
    df['highest'] = df['high'].rolling(window=atr_period, min_periods=1).max()
    df['lowest'] = df['low'].rolling(window=atr_period, min_periods=1).min()
    
    # 计算突破点位
    df['upper_breakout'] = df['highest'] + df['atr'] * entry_multiplier
    df['lower_breakout'] = df['lowest'] - df['atr'] * entry_multiplier
    
    # 计算止损点位
    df['upper_stop'] = df['highest'] - df['atr'] * exit_multiplier
    df['lower_stop'] = df['lowest'] + df['atr'] * exit_multiplier
    
    # ===== 找出交易信号
    # === 找出做多信号 (价格突破上轨)
    condition1 = df['close'] > df['upper_breakout']
    condition2 = df['close'].shift(1) <= df['upper_breakout'].shift(1)
    df.loc[condition1 & condition2, 'signal_long'] = 1
    
    # === 找出做多平仓信号 (价格跌破止损位)
    condition1 = df['close'] < df['upper_stop']
    condition2 = df['close'].shift(1) >= df['upper_stop'].shift(1)
    df.loc[condition1 & condition2, 'signal_long'] = 0
    
    # === 找出做空信号 (价格突破下轨)
    condition1 = df['close'] < df['lower_breakout']
    condition2 = df['close'].shift(1) >= df['lower_breakout'].shift(1)
    df.loc[condition1 & condition2, 'signal_short'] = -1
    
    # === 找出做空平仓信号 (价格突破止损位)
    condition1 = df['close'] > df['lower_stop']
    condition2 = df['close'].shift(1) <= df['lower_stop'].shift(1)
    df.loc[condition1 & condition2, 'signal_short'] = 0
    
    # ===== 合并信号
    df['signal'] = df[['signal_long', 'signal_short']].sum(axis=1, min_count=1, skipna=True)
    
    # ===== 由signal计算出实际的每天持有仓位
    # 在产生signal的K线，以收盘价买入
    df['signal'].fillna(method='ffill', inplace=True)
    df['signal'].fillna(value=0, inplace=True)  # 将初始行数的NaN填充为0
    df['pos'] = df['signal'] * proportion
    
    return df
