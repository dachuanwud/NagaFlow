from cta_api.function import *
import numpy as np


def signal(df, para=[20, 2.0, 0.5], proportion=1, leverage_rate=1):
    """
    均值回归策略
    :param df: 原始数据
    :param para: [period, entry_threshold, exit_threshold] 均值回归参数
    :param proportion: 仓位比例
    :param leverage_rate: 杠杆倍数
    :return: 包含signal的数据
    
    # 均值回归策略
    价格偏离均线超过阈值时反向开仓
    价格回归到均线附近时平仓
    """
    
    # ===== 获取策略参数
    period = int(para[0]) if len(para) > 0 else 20
    entry_threshold = float(para[1]) if len(para) > 1 else 2.0
    exit_threshold = float(para[2]) if len(para) > 2 else 0.5
    
    # ===== 计算指标
    # 计算移动平均线
    df['ma'] = df['close'].rolling(window=period, min_periods=1).mean()
    
    # 计算标准差
    df['std'] = df['close'].rolling(window=period, min_periods=1).std()
    
    # 计算价格偏离度 (标准化)
    df['deviation'] = (df['close'] - df['ma']) / (df['std'] + 1e-10)
    
    # 计算上下轨
    df['upper_band'] = df['ma'] + df['std'] * entry_threshold
    df['lower_band'] = df['ma'] - df['std'] * entry_threshold
    
    # 计算平仓轨道
    df['upper_exit'] = df['ma'] + df['std'] * exit_threshold
    df['lower_exit'] = df['ma'] - df['std'] * exit_threshold
    
    # ===== 找出交易信号
    # === 找出做多信号 (价格跌破下轨，预期反弹)
    condition1 = df['close'] < df['lower_band']
    condition2 = df['close'].shift(1) >= df['lower_band'].shift(1)
    df.loc[condition1 & condition2, 'signal_long'] = 1
    
    # === 找出做多平仓信号 (价格回到均线上方)
    condition1 = df['close'] > df['upper_exit']
    condition2 = df['close'].shift(1) <= df['upper_exit'].shift(1)
    df.loc[condition1 & condition2, 'signal_long'] = 0
    
    # === 找出做空信号 (价格突破上轨，预期回落)
    condition1 = df['close'] > df['upper_band']
    condition2 = df['close'].shift(1) <= df['upper_band'].shift(1)
    df.loc[condition1 & condition2, 'signal_short'] = -1
    
    # === 找出做空平仓信号 (价格回到均线下方)
    condition1 = df['close'] < df['lower_exit']
    condition2 = df['close'].shift(1) >= df['lower_exit'].shift(1)
    df.loc[condition1 & condition2, 'signal_short'] = 0
    
    # ===== 额外的止损逻辑
    # 如果偏离度过大，强制平仓
    max_deviation = entry_threshold * 1.5
    df.loc[df['deviation'] > max_deviation, 'signal_short'] = 0  # 强制平空仓
    df.loc[df['deviation'] < -max_deviation, 'signal_long'] = 0  # 强制平多仓
    
    # ===== 合并信号
    df['signal'] = df[['signal_long', 'signal_short']].sum(axis=1, min_count=1, skipna=True)
    
    # ===== 由signal计算出实际的每天持有仓位
    # 在产生signal的K线，以收盘价买入
    df['signal'].fillna(method='ffill', inplace=True)
    df['signal'].fillna(value=0, inplace=True)  # 将初始行数的NaN填充为0
    df['pos'] = df['signal'] * proportion
    
    return df
