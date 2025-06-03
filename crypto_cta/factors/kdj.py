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
    
    # ===== 合并做多做空信号，去除重复信号
    # === 合并做多做空信号
    df['signal'] = df[['signal_long', 'signal_short']].sum(axis=1, min_count=1, skipna=True)  # 合并多空信号，即signal_long与signal_short相加，得到真实的交易信号
    # === 去除重复信号
    temp = df[df['signal'].notnull()][['signal']]  # 筛选siganla不为空的数据，并另存一个变量
    temp = temp[temp['signal'] != temp['signal'].shift(1)]  # 筛选出当前周期与上个周期持仓信号不一致的，即去除重复信号
    df['signal'] = temp['signal']  # 将处理后的signal覆盖到原始数据的signal列

    # ===== 删除无关变量
    df.drop(['highest', 'lowest', 'rsv', 'k', 'd', 'j', 'signal_long', 'signal_short'], axis=1, inplace=True)  # 删除临时计算列

    # ===== 止盈止损
    # 校验当前的交易是否需要进行止盈止损
    df = process_stop_loss_close(df, proportion, leverage_rate=leverage_rate)  # 调用函数，判断是否需要止盈止损，df需包含signal列

    return df


# 策略参数组合
def para_list(period_list=range(5, 20, 2), k_period_list=range(2, 6, 1), d_period_list=range(2, 6, 1)):
    """
    产生KDJ策略的参数范围
    :param period_list: KDJ周期值的列表
    :param k_period_list: K值平滑周期的列表
    :param d_period_list: D值平滑周期的列表
    :return:
        返回一个大的列表，格式为：[[9, 3, 3, 80, 20]]
    """

    # ===== 构建遍历的列表
    para_list = [[period, k_period, d_period, 80, 20] for period in period_list for k_period in k_period_list for d_period in d_period_list]

    # ===== 返回参数列表
    return para_list
