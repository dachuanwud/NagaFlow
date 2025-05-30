"""
author: 李成蹊
微信: Matrix
"""
import ccxt
import pandas as pd
import os

# 代理，本来运行的时候需要设置一下
proxies = {
    # 'http': '127.0.0.1:7890',
    # 'https': '127.0.0.1:7890',
    'http': 'socks5://127.0.0.1:1080',
    'https': 'socks5h://127.0.0.1:1080',
}
# 初始化交易所
exchange = ccxt.binance({'proxies': proxies})

# 获取交易规则
data = exchange.fapiPublic_get_exchangeinfo()
# 获取BUSD和USDI的交易对
_symbol_list = [x for x in data['symbols'] if x['symbol'].endswith('BUSD') or x['symbol'].endswith('USDT')]

# 获取需要的最小下单量数据
min_qty_list = []
for symbol in _symbol_list:
    min_qty_list.append({
        '合约': symbol['symbol'].replace('USDT', '-USDT'),
        '最小下单量': symbol['filters'][1]['minQty']
    })

# 转成df
new_df = pd.DataFrame(min_qty_list)
print(new_df)

# 读取旧的数据
min_qty_path = os.path.join('最小下单量.csv')
old_df = pd.read_csv(min_qty_path, encoding='gbk')

# 数据合并
all_data_df = pd.concat([new_df, old_df], ignore_index=True)
# 去重
all_data_df.drop_duplicates(subset=['合约'], inplace=True)
all_data_df.to_csv(min_qty_path, encoding='gbk', index=False)
