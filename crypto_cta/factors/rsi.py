from cta_api.function import *
import numpy as np


def signal(df, para=[14, 70, 30], proportion=1, leverage_rate=1):
    """
    RSI相对强弱指标策略
    :param df: 原始数据
    :param para: [period, overbought_level, oversold_level] RSI计算参数
    :param proportion: 仓位比例
    :param leverage_rate: 杠杆倍数
    :return: 包含signal的数据
    
    # RSI策略
    RSI > overbought_level 时做空
    RSI < oversold_level 时做多
    """
    
    # ===== 获取策略参数
    period = int(para[0]) if len(para) > 0 else 14
    overbought = float(para[1]) if len(para) > 1 else 70
    oversold = float(para[2]) if len(para) > 2 else 30
    
    # ===== 计算RSI指标
    # 计算价格变化
    df['price_change'] = df['close'].diff()
    
    # 计算上涨和下跌
    df['gain'] = df['price_change'].where(df['price_change'] > 0, 0)
    df['loss'] = -df['price_change'].where(df['price_change'] < 0, 0)
    
    # 计算平均收益和平均损失
    df['avg_gain'] = df['gain'].rolling(window=period, min_periods=1).mean()
    df['avg_loss'] = df['loss'].rolling(window=period, min_periods=1).mean()
    
    # 计算RS和RSI
    df['rs'] = df['avg_gain'] / (df['avg_loss'] + 1e-10)  # 避免除零
    df['rsi'] = 100 - (100 / (1 + df['rs']))
    
    # ===== 找出交易信号
    # === 找出做多信号 (RSI超卖)
    condition1 = df['rsi'] < oversold
    condition2 = df['rsi'].shift(1) >= oversold
    df.loc[condition1 & condition2, 'signal_long'] = 1
    
    # === 找出做多平仓信号 (RSI回到中性区域)
    condition1 = df['rsi'] > 50
    condition2 = df['rsi'].shift(1) <= 50
    df.loc[condition1 & condition2, 'signal_long'] = 0
    
    # === 找出做空信号 (RSI超买)
    condition1 = df['rsi'] > overbought
    condition2 = df['rsi'].shift(1) <= overbought
    df.loc[condition1 & condition2, 'signal_short'] = -1
    
    # === 找出做空平仓信号 (RSI回到中性区域)
    condition1 = df['rsi'] < 50
    condition2 = df['rsi'].shift(1) >= 50
    df.loc[condition1 & condition2, 'signal_short'] = 0
    
    # ===== 合并信号
    df['signal'] = df[['signal_long', 'signal_short']].sum(axis=1, min_count=1, skipna=True)
    
    # ===== 由signal计算出实际的每天持有仓位
    # 在产生signal的K线，以收盘价买入
    df['signal'].fillna(method='ffill', inplace=True)
    df['signal'].fillna(value=0, inplace=True)  # 将初始行数的NaN填充为0
    df['pos'] = df['signal'] * proportion
    
    return df
