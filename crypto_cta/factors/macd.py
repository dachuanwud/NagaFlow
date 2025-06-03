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
    
    # ===== 合并做多做空信号，去除重复信号
    # === 合并做多做空信号
    df['signal'] = df[['signal_long', 'signal_short']].sum(axis=1, min_count=1, skipna=True)  # 合并多空信号，即signal_long与signal_short相加，得到真实的交易信号
    # === 去除重复信号
    temp = df[df['signal'].notnull()][['signal']]  # 筛选siganla不为空的数据，并另存一个变量
    temp = temp[temp['signal'] != temp['signal'].shift(1)]  # 筛选出当前周期与上个周期持仓信号不一致的，即去除重复信号
    df['signal'] = temp['signal']  # 将处理后的signal覆盖到原始数据的signal列

    # ===== 删除无关变量
    df.drop(['ema_fast', 'ema_slow', 'macd', 'macd_signal', 'macd_histogram', 'signal_long', 'signal_short'], axis=1, inplace=True)  # 删除临时计算列

    # ===== 止盈止损
    # 校验当前的交易是否需要进行止盈止损
    df = process_stop_loss_close(df, proportion, leverage_rate=leverage_rate)  # 调用函数，判断是否需要止盈止损，df需包含signal列

    return df


# 策略参数组合
def para_list(fast_list=range(8, 16, 2), slow_list=range(20, 35, 3), signal_list=range(6, 12, 2)):
    """
    产生MACD策略的参数范围
    :param fast_list: 快速EMA周期的列表
    :param slow_list: 慢速EMA周期的列表
    :param signal_list: 信号线周期的列表
    :return:
        返回一个大的列表，格式为：[[12, 26, 9]]
    """

    # ===== 构建遍历的列表
    para_list = [[fast, slow, signal] for fast in fast_list for slow in slow_list for signal in signal_list if fast < slow]

    # ===== 返回参数列表
    return para_list
