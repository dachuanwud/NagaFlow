import aiohttp
import asyncio
from lxml import objectify
from core.common import request_session, get_or_create_eventloop
import sys


async def get_symbols_by_session(session, params):
    data = await request_session(session, params)
    root = objectify.fromstring(data.encode('ascii'))
    result = []
    for item in root.CommonPrefixes:
        param = item.Prefix
        s = param.text.split('/')
        result.append(s[len(s) - 2])
    if root.IsTruncated:
        # 下一页的网址
        params['marker'] = root.NextMarker.text
        next = await get_symbols_by_session(session, params)
        result.extend(next)  # 初次循环时，link_lst 包含1000条以上的数据
    return result

async def get_symbols(params):
    connector = aiohttp.TCPConnector(
        ssl=False,
        use_dns_cache=False,  # 禁用DNS缓存
        ttl_dns_cache=0  # DNS缓存时间设为0
    )
    async with aiohttp.ClientSession(connector=connector) as session:
        result = await get_symbols_by_session(session, params)
        return result

def async_get_all_symbols(params):
    # 统一使用get_or_create_eventloop来处理事件循环
    # 这样可以避免在已有事件循环中调用asyncio.run()的错误
    try:
        # 尝试获取当前事件循环
        loop = asyncio.get_running_loop()
        # 如果已经在事件循环中，创建一个任务
        import concurrent.futures
        with concurrent.futures.ThreadPoolExecutor() as executor:
            future = executor.submit(lambda: get_or_create_eventloop().run_until_complete(get_symbols(params)))
            return future.result()
    except RuntimeError:
        # 没有运行中的事件循环，使用get_or_create_eventloop
        loop = get_or_create_eventloop()
        return loop.run_until_complete(get_symbols(params))

# 新增：真正的异步版本，用于FastAPI
async def async_get_all_symbols_async(params):
    """异步版本的获取所有交易对函数，用于FastAPI等异步环境"""
    return await get_symbols(params)

async def async_get_usdt_symbols_async(params):
    """异步版本的获取USDT交易对函数，用于FastAPI等异步环境"""
    all_symbols = await async_get_all_symbols_async(params)
    usdt = set()
    [usdt.add(i) for i in all_symbols if i.endswith('USDT')]
    return usdt

def async_get_usdt_symbols(params):
    all_symbols = async_get_all_symbols(params)
    usdt = set()
    [usdt.add(i) for i in all_symbols if i.endswith('USDT')]
    return usdt

def spot_symbols_filter(symbols):
    others = []
    stable_symbol = ['BKRW', 'USDC', 'USDP', 'TUSD', 'BUSD', 'FDUSD', 'DAI', 'EUR', 'GBP']
    # stable_symbols：稳定币交易对
    stable_symbols = [s + 'USDT' for s in stable_symbol]
    # special_symbols：容易误判的特殊交易对
    special_symbols = ['JUPUSDT']
    pure_spot_symbols = []
    for symbol in symbols:
        if symbol in special_symbols:
            pure_spot_symbols.append(symbol)
            continue
        if symbol.endswith('UPUSDT') or symbol.endswith('DOWNUSDT') or symbol.endswith('BULLUSDT') or symbol.endswith(
            'BEARUSDT'
        ):
            others.append(symbol)
            continue
        if symbol in stable_symbols:
            others.append(symbol)
            continue
        pure_spot_symbols.append(symbol)
    print('过滤掉的现货symbol', others)
    return pure_spot_symbols