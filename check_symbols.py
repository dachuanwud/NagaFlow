#!/usr/bin/env python3
"""
快速检查本地数据中的交易对
"""
import pickle
import pandas as pd

def check_symbols():
    """检查交易对"""
    data_dir = '/Users/lishechuan/Downloads/FLDownload/coin-binance-spot-swap-preprocess-pkl-1h'
    
    print('=== 检查交易对 ===')
    
    # 检查spot数据
    try:
        print('正在加载spot数据...')
        with open(f'{data_dir}/spot_dict.pkl', 'rb') as f:
            spot_data = pickle.load(f)
        
        symbols = list(spot_data.keys())
        print(f'SPOT交易对总数: {len(symbols)}')
        
        # 查找BTC相关
        btc_symbols = [s for s in symbols if 'BTC' in s.upper()]
        print(f'BTC相关交易对: {btc_symbols}')
        
        # 查找ETH相关
        eth_symbols = [s for s in symbols if 'ETH' in s.upper()]
        print(f'ETH相关交易对: {eth_symbols[:5]}...')
        
        # 检查常见交易对格式
        common_formats = ['BTCUSDT', 'BTC-USDT', 'ETHUSDT', 'ETH-USDT']
        for fmt in common_formats:
            if fmt in symbols:
                print(f'✅ 找到 {fmt}')
                # 检查数据质量
                df = spot_data[fmt]
                valid_data = df.dropna(subset=['close'])
                print(f'   有效数据: {len(valid_data)} 条')
                if len(valid_data) > 0:
                    print(f'   时间范围: {valid_data["candle_begin_time"].min()} - {valid_data["candle_begin_time"].max()}')
            else:
                print(f'❌ 未找到 {fmt}')
        
    except Exception as e:
        print(f'❌ 检查spot数据失败: {e}')

if __name__ == '__main__':
    check_symbols()
