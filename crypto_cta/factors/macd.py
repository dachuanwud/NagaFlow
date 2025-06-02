from cta_api.function import *
import numpy as np


def signal(df, para=[12, 26, 9], proportion=1, leverage_rate=1):
    """
    MACD指标策略
    :param df: 原始数据
    :param para: [fast_period, slow_period, signal_period] MACD计算参数
    :param proportion: 仓位比例
    :param leverage_rate: 杠杆倍数
    :return: 包含signal的数据
    
    # MACD策略
    MACD线上穿信号线时做多
    MACD线下穿信号线时做空
    """
    
    # ===== 获取策略参数
    fast_period = int(para[0]) if len(para) > 0 else 12
    slow_period = int(para[1]) if len(para) > 1 else 26
    signal_period = int(para[2]) if len(para) > 2 else 9
    
    # ===== 计算MACD指标
    # 计算快速和慢速EMA
    df['ema_fast'] = df['close'].ewm(span=fast_period, min_periods=1).mean()
    df['ema_slow'] = df['close'].ewm(span=slow_period, min_periods=1).mean()
    
    # 计算MACD线
    df['macd'] = df['ema_fast'] - df['ema_slow']
    
    # 计算信号线
    df['macd_signal'] = df['macd'].ewm(span=signal_period, min_periods=1).mean()
    
    # 计算MACD柱状图
    df['macd_histogram'] = df['macd'] - df['macd_signal']
    
    # ===== 找出交易信号
    # === 找出做多信号 (MACD上穿信号线)
    condition1 = df['macd'] > df['macd_signal']
    condition2 = df['macd'].shift(1) <= df['macd_signal'].shift(1)
    df.loc[condition1 & condition2, 'signal_long'] = 1
    
    # === 找出做多平仓信号 (MACD下穿信号线)
    condition1 = df['macd'] < df['macd_signal']
    condition2 = df['macd'].shift(1) >= df['macd_signal'].shift(1)
    df.loc[condition1 & condition2, 'signal_long'] = 0
    
    # === 找出做空信号 (MACD下穿信号线)
    condition1 = df['macd'] < df['macd_signal']
    condition2 = df['macd'].shift(1) >= df['macd_signal'].shift(1)
    df.loc[condition1 & condition2, 'signal_short'] = -1
    
    # === 找出做空平仓信号 (MACD上穿信号线)
    condition1 = df['macd'] > df['macd_signal']
    condition2 = df['macd'].shift(1) <= df['macd_signal'].shift(1)
    df.loc[condition1 & condition2, 'signal_short'] = 0
    
    # ===== 合并信号
    df['signal'] = df[['signal_long', 'signal_short']].sum(axis=1, min_count=1, skipna=True)
    
    # ===== 由signal计算出实际的每天持有仓位
    # 在产生signal的K线，以收盘价买入
    df['signal'].fillna(method='ffill', inplace=True)
    df['signal'].fillna(value=0, inplace=True)  # 将初始行数的NaN填充为0
    df['pos'] = df['signal'] * proportion
    
    return df
