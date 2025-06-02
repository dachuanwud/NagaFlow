from cta_api.function import *
import numpy as np


def signal(df, para=[9, 3, 3, 80, 20], proportion=1, leverage_rate=1):
    """
    KDJ随机指标策略
    :param df: 原始数据
    :param para: [period, k_period, d_period, overbought, oversold] KDJ计算参数
    :param proportion: 仓位比例
    :param leverage_rate: 杠杆倍数
    :return: 包含signal的数据
    
    # KDJ策略
    K线上穿D线且在超卖区域时做多
    K线下穿D线且在超买区域时做空
    """
    
    # ===== 获取策略参数
    period = int(para[0]) if len(para) > 0 else 9
    k_period = int(para[1]) if len(para) > 1 else 3
    d_period = int(para[2]) if len(para) > 2 else 3
    overbought = float(para[3]) if len(para) > 3 else 80
    oversold = float(para[4]) if len(para) > 4 else 20
    
    # ===== 计算KDJ指标
    # 计算最高价和最低价的滚动窗口
    df['highest'] = df['high'].rolling(window=period, min_periods=1).max()
    df['lowest'] = df['low'].rolling(window=period, min_periods=1).min()
    
    # 计算RSV (Raw Stochastic Value)
    df['rsv'] = (df['close'] - df['lowest']) / (df['highest'] - df['lowest'] + 1e-10) * 100
    
    # 计算K值 (使用简单移动平均)
    df['k'] = df['rsv'].rolling(window=k_period, min_periods=1).mean()
    
    # 计算D值
    df['d'] = df['k'].rolling(window=d_period, min_periods=1).mean()
    
    # 计算J值
    df['j'] = 3 * df['k'] - 2 * df['d']
    
    # ===== 找出交易信号
    # === 找出做多信号 (K线上穿D线且在超卖区域)
    condition1 = df['k'] > df['d']
    condition2 = df['k'].shift(1) <= df['d'].shift(1)
    condition3 = df['k'] < oversold + 10  # 在超卖区域附近
    df.loc[condition1 & condition2 & condition3, 'signal_long'] = 1
    
    # === 找出做多平仓信号 (K线下穿D线或进入超买区域)
    condition1 = (df['k'] < df['d']) & (df['k'].shift(1) >= df['d'].shift(1))
    condition2 = df['k'] > overbought
    df.loc[condition1 | condition2, 'signal_long'] = 0
    
    # === 找出做空信号 (K线下穿D线且在超买区域)
    condition1 = df['k'] < df['d']
    condition2 = df['k'].shift(1) >= df['d'].shift(1)
    condition3 = df['k'] > overbought - 10  # 在超买区域附近
    df.loc[condition1 & condition2 & condition3, 'signal_short'] = -1
    
    # === 找出做空平仓信号 (K线上穿D线或进入超卖区域)
    condition1 = (df['k'] > df['d']) & (df['k'].shift(1) <= df['d'].shift(1))
    condition2 = df['k'] < oversold
    df.loc[condition1 | condition2, 'signal_short'] = 0
    
    # ===== 合并信号
    df['signal'] = df[['signal_long', 'signal_short']].sum(axis=1, min_count=1, skipna=True)
    
    # ===== 由signal计算出实际的每天持有仓位
    # 在产生signal的K线，以收盘价买入
    df['signal'].fillna(method='ffill', inplace=True)
    df['signal'].fillna(value=0, inplace=True)  # 将初始行数的NaN填充为0
    df['pos'] = df['signal'] * proportion
    
    return df
