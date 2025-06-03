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
    
    # ===== 合并做多做空信号，去除重复信号
    # === 合并做多做空信号
    df['signal'] = df[['signal_long', 'signal_short']].sum(axis=1, min_count=1, skipna=True)  # 合并多空信号，即signal_long与signal_short相加，得到真实的交易信号
    # === 去除重复信号
    temp = df[df['signal'].notnull()][['signal']]  # 筛选siganla不为空的数据，并另存一个变量
    temp = temp[temp['signal'] != temp['signal'].shift(1)]  # 筛选出当前周期与上个周期持仓信号不一致的，即去除重复信号
    df['signal'] = temp['signal']  # 将处理后的signal覆盖到原始数据的signal列

    # ===== 删除无关变量
    df.drop(['price_change', 'gain', 'loss', 'avg_gain', 'avg_loss', 'rs', 'rsi', 'signal_long', 'signal_short'], axis=1, inplace=True)  # 删除临时计算列

    # ===== 止盈止损
    # 校验当前的交易是否需要进行止盈止损
    df = process_stop_loss_close(df, proportion, leverage_rate=leverage_rate)  # 调用函数，判断是否需要止盈止损，df需包含signal列

    return df


# 策略参数组合
def para_list(period_list=range(10, 25, 2), overbought_list=[65, 70, 75, 80], oversold_list=[15, 20, 25, 30]):
    """
    产生RSI策略的参数范围
    :param period_list: RSI周期值的列表
    :param overbought_list: 超买阈值的列表
    :param oversold_list: 超卖阈值的列表
    :return:
        返回一个大的列表，格式为：[[14, 70, 30]]
    """

    # ===== 构建遍历的列表
    para_list = [[period, overbought, oversold] for period in period_list for overbought in overbought_list for oversold in oversold_list]

    # ===== 返回参数列表
    return para_list
