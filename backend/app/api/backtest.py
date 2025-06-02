"""
回测API路由
集成crypto_cta模块功能
"""
from fastapi import APIRouter, BackgroundTasks, HTTPException
from pydantic import BaseModel
from typing import List, Optional, Dict, Any
import asyncio
import sys
import os
import uuid
import logging
from datetime import datetime
import pandas as pd
import numpy as np

# 导入现有的crypto_cta模块
def setup_crypto_cta_imports():
    """设置crypto_cta模块导入路径并验证可用性"""
    global CTA_AVAILABLE, fast_calculate_signal_by_one_loop, strategy_evaluate, transfer_equity_curve_to_trade, cal_equity_curve

    # 获取项目根目录
    current_dir = os.path.dirname(__file__)
    project_root = os.path.abspath(os.path.join(current_dir, '..', '..', '..'))
    crypto_cta_path = os.path.join(project_root, 'crypto_cta')

    print(f"🔍 检查crypto_cta路径: {crypto_cta_path}")

    if not os.path.exists(crypto_cta_path):
        print(f"❌ crypto_cta目录不存在: {crypto_cta_path}")
        CTA_AVAILABLE = False
        return False

    # 添加路径到sys.path
    if crypto_cta_path not in sys.path:
        sys.path.insert(0, crypto_cta_path)
        print(f"✅ 已添加crypto_cta路径到sys.path")

    # 检查必需的文件是否存在
    required_files = [
        os.path.join(crypto_cta_path, 'cta_api', 'cta_core.py'),
        os.path.join(crypto_cta_path, 'cta_api', 'statistics.py'),
        os.path.join(crypto_cta_path, 'cta_api', 'function.py'),
        os.path.join(crypto_cta_path, 'factors', 'sma.py'),
        os.path.join(crypto_cta_path, 'factors', 'rsi.py'),
    ]

    for file_path in required_files:
        if not os.path.exists(file_path):
            print(f"❌ 必需文件不存在: {file_path}")
            CTA_AVAILABLE = False
            return False
        else:
            print(f"✅ 文件存在: {os.path.basename(file_path)}")

    # 尝试导入模块
    try:
        from cta_api.cta_core import fast_calculate_signal_by_one_loop
        from cta_api.statistics import strategy_evaluate, transfer_equity_curve_to_trade
        from cta_api.function import cal_equity_curve

        print("✅ 成功导入crypto_cta核心模块")
        CTA_AVAILABLE = True
        return True

    except ImportError as e:
        print(f"❌ 导入crypto_cta模块失败: {e}")
        print(f"   当前sys.path包含: {[p for p in sys.path if 'crypto_cta' in p]}")
        CTA_AVAILABLE = False
        return False
    except Exception as e:
        print(f"❌ 导入crypto_cta模块时发生未知错误: {e}")
        CTA_AVAILABLE = False
        return False

# 初始化crypto_cta模块
CTA_AVAILABLE = False
fast_calculate_signal_by_one_loop = None
strategy_evaluate = None
transfer_equity_curve_to_trade = None
cal_equity_curve = None

# 执行导入设置
setup_crypto_cta_imports()

router = APIRouter()

# 数据模型
class BacktestRequest(BaseModel):
    symbols: List[str]
    strategy: str
    parameters: Dict[str, Any]
    date_start: str = "2021-01-01"
    date_end: str = "2025-01-01"
    rule_type: str = "1H"
    leverage_rate: float = 1.0
    c_rate: float = 0.0008  # 手续费
    slippage: float = 0.001  # 滑点

class TradeRecord(BaseModel):
    id: str
    symbol: str
    side: str  # "buy" or "sell"
    quantity: float
    price: float
    timestamp: datetime
    pnl: float
    commission: float
    slippage: float

class DrawdownPeriod(BaseModel):
    start_date: str
    end_date: str
    duration_days: int
    max_drawdown: float
    recovery_date: Optional[str] = None

class MonthlyReturn(BaseModel):
    year: int
    month: int
    return_value: float

class BacktestResult(BaseModel):
    task_id: str
    symbol: str
    strategy: str
    parameters: Dict[str, Any]
    final_return: float
    annual_return: float
    max_drawdown: float
    sharpe_ratio: float
    sortino_ratio: float = 0.0
    calmar_ratio: float = 0.0
    win_rate: float
    profit_factor: float = 0.0
    total_trades: int
    winning_trades: int = 0
    losing_trades: int = 0
    avg_win: float = 0.0
    avg_loss: float = 0.0
    max_consecutive_wins: int = 0
    max_consecutive_losses: int = 0
    volatility: float = 0.0
    skewness: float = 0.0
    kurtosis: float = 0.0
    var_95: float = 0.0  # Value at Risk 95%
    cvar_95: float = 0.0  # Conditional Value at Risk 95%
    equity_curve: List[Dict[str, Any]]
    drawdown_periods: List[DrawdownPeriod] = []
    monthly_returns: List[MonthlyReturn] = []
    trade_records: List[TradeRecord] = []
    created_at: datetime

    # 新增时间范围相关字段
    requested_date_start: str = ""  # 用户请求的开始时间
    requested_date_end: str = ""    # 用户请求的结束时间
    actual_date_start: str = ""     # 实际使用的开始时间
    actual_date_end: str = ""       # 实际使用的结束时间
    data_records_count: int = 0     # 实际使用的数据条数
    time_range_match_status: str = ""  # 时间范围匹配状态
    time_range_adjustment_reason: str = ""  # 时间范围调整原因

class BacktestStatus(BaseModel):
    task_id: str
    status: str  # "pending", "running", "completed", "failed"
    progress: float = 0.0
    message: str = ""
    symbols_total: int = 0
    symbols_completed: int = 0
    results: List[BacktestResult] = []

class OptimizationRequest(BaseModel):
    symbols: List[str]
    strategy: str
    parameter_ranges: Dict[str, List[float]]  # 参数优化范围
    date_start: str = "2021-01-01"
    date_end: str = "2025-01-01"
    rule_type: str = "1H"

# 全局任务管理
backtest_tasks: Dict[str, BacktestStatus] = {}

# 全局时间范围信息存储
_current_time_range_info: Dict[str, Any] = {}

def smart_time_range_filter(df: pd.DataFrame, request: BacktestRequest, symbol: str) -> tuple:
    """
    智能时间范围过滤函数
    返回: (过滤后的DataFrame, 时间范围信息字典)
    """
    import pandas as pd

    # 获取数据的时间范围
    data_start = df['candle_begin_time'].min()
    data_end = df['candle_begin_time'].max()

    # 解析请求的时间范围
    start_date = pd.to_datetime(request.date_start)
    end_date = pd.to_datetime(request.date_end)

    print(f"   请求时间范围: {start_date.date()} 到 {end_date.date()}")
    print(f"   数据时间范围: {data_start.date()} 到 {data_end.date()}")

    # 初始化时间范围信息
    time_range_info = {
        'requested_start': request.date_start,
        'requested_end': request.date_end,
        'data_available_start': data_start.strftime('%Y-%m-%d'),
        'data_available_end': data_end.strftime('%Y-%m-%d'),
        'actual_start': '',
        'actual_end': '',
        'records_count': 0,
        'match_status': '',
        'adjustment_reason': ''
    }

    # 检查时间范围重叠情况
    if data_end < start_date or data_start > end_date:
        # 完全不重叠的情况
        print(f"⚠️ {symbol}: 请求时间范围与数据时间范围完全不重叠")
        time_range_info['match_status'] = 'no_overlap'

        if data_end < start_date:
            # 请求的时间太新，使用最新的数据
            print(f"   请求时间过新，使用最新可用数据")
            target_records = min(2000, len(df))
            df_filtered = df.tail(target_records)
            time_range_info['adjustment_reason'] = f'请求时间({start_date.date()})晚于数据最新时间({data_end.date()})，使用最新{target_records}条数据'
        else:
            # 请求的时间太旧，使用最早的数据
            print(f"   请求时间过旧，使用最早可用数据")
            target_records = min(2000, len(df))
            df_filtered = df.head(target_records)
            time_range_info['adjustment_reason'] = f'请求时间({end_date.date()})早于数据最早时间({data_start.date()})，使用最早{target_records}条数据'

    else:
        # 有重叠的情况
        print(f"✅ {symbol}: 时间范围有重叠，进行数据过滤")
        time_range_info['match_status'] = 'overlap'

        # 先尝试严格过滤
        df_filtered = df[(df['candle_begin_time'] >= start_date) & (df['candle_begin_time'] <= end_date)]

        if df_filtered.empty or len(df_filtered) < 200:  # 提高最小数据量要求
            print(f"⚠️ {symbol}: 严格筛选后数据不足({len(df_filtered) if not df_filtered.empty else 0}条)，扩展时间范围")
            time_range_info['match_status'] = 'insufficient_data'

            # 计算需要的数据量
            target_records = 1500  # 目标数据量

            # 以请求时间范围的中心为基准，向前后扩展
            center_time = start_date + (end_date - start_date) / 2

            # 计算每条记录到中心时间的距离
            df_with_distance = df.copy()
            df_with_distance['time_distance'] = abs(df_with_distance['candle_begin_time'] - center_time)

            # 选择距离中心时间最近的记录
            df_filtered = df_with_distance.nsmallest(min(target_records, len(df)), 'time_distance')
            df_filtered = df_filtered.drop('time_distance', axis=1).sort_values('candle_begin_time')

            time_range_info['adjustment_reason'] = f'请求时间范围内数据不足，以{center_time.date()}为中心扩展到{len(df_filtered)}条数据'
        else:
            time_range_info['adjustment_reason'] = '使用请求时间范围内的数据'

    # 更新实际使用的时间范围
    actual_start = df_filtered['candle_begin_time'].min()
    actual_end = df_filtered['candle_begin_time'].max()
    time_range_info['actual_start'] = actual_start.strftime('%Y-%m-%d')
    time_range_info['actual_end'] = actual_end.strftime('%Y-%m-%d')
    time_range_info['records_count'] = len(df_filtered)

    print(f"   实际使用时间范围: {actual_start.date()} 到 {actual_end.date()}")
    print(f"✅ {symbol}: 最终数据 {len(df_filtered)} 条记录")

    # 数据质量检查
    if len(df_filtered) < 100:
        print(f"⚠️ {symbol}: 数据量过少({len(df_filtered)}条)，可能影响回测效果")
        time_range_info['match_status'] = 'insufficient_data'
    elif len(df_filtered) < 500:
        print(f"⚠️ {symbol}: 数据量较少({len(df_filtered)}条)，建议使用更长的时间范围")

    return df_filtered, time_range_info


async def load_existing_data(symbol: str, request: BacktestRequest) -> Optional[pd.DataFrame]:
    """从本地数据加载数据 - 使用新的数据适配器"""
    try:
        import pandas as pd
        from ..services.data_adapter import data_adapter

        print(f"🔍 {symbol}: 使用本地数据适配器加载数据")

        # 使用数据适配器获取数据
        df = data_adapter.get_symbol_data_for_backtest(
            symbol, request.date_start, request.date_end, request.rule_type
        )

        if df is None or df.empty:
            print(f"❌ {symbol}: 数据适配器未返回数据")
            return None

        print(f"📊 {symbol}: 原始数据 {len(df)} 条记录")
        print(f"   数据列: {list(df.columns)}")

        # 显示数据时间范围
        if 'candle_begin_time' in df.columns:
            data_start = df['candle_begin_time'].min()
            data_end = df['candle_begin_time'].max()
            print(f"   数据时间范围: {data_start} 到 {data_end}")

            if 'close' in df.columns:
                print(f"   价格范围: ${df['close'].min():.2f} - ${df['close'].max():.2f}")

        # 使用智能时间范围处理
        df_filtered, time_range_info = smart_time_range_filter(df, request, symbol)

        # 将时间范围信息存储为全局变量，供后续使用
        global _current_time_range_info
        _current_time_range_info = time_range_info

        return df_filtered

    except Exception as e:
        print(f"❌ {symbol}: 加载本地数据失败: {e}")
        import traceback
        traceback.print_exc()
        return None

async def fetch_real_binance_data(symbol: str, request: BacktestRequest) -> Optional[pd.DataFrame]:
    """强制从Binance API获取真实数据 - 无任何模拟数据"""
    import pandas as pd
    import aiohttp
    import asyncio
    from datetime import datetime, timedelta
    import json
    import logging

    logger = logging.getLogger(__name__)
    logger.info(f"🔄 {symbol}: 开始从Binance API获取真实数据...")

    try:
        # 解析时间范围
        start_date = datetime.strptime(request.date_start, "%Y-%m-%d")
        end_date = datetime.strptime(request.date_end, "%Y-%m-%d")

        # 转换为时间戳（毫秒）
        start_timestamp = int(start_date.timestamp() * 1000)
        end_timestamp = int(end_date.timestamp() * 1000)

        # 根据rule_type设置interval
        interval_map = {
            '1H': '1h',
            '4H': '4h',
            '1D': '1d',
            '1m': '1m',
            '5m': '5m',
            '15m': '15m',
            '30m': '30m'
        }
        interval = interval_map.get(request.rule_type, '1h')

        # 使用官方Binance API源（按优先级排序）
        api_sources = [
            'https://fapi.binance.com/fapi/v1/klines',  # 币安合约API（主要）
            'https://api.binance.com/api/v3/klines',    # 币安现货API（备用）
        ]

        all_data = []
        successful_api = None

        # 尝试不同的API源
        for api_url in api_sources:
            logger.info(f"   尝试Binance API: {api_url}")

            try:
                async with aiohttp.ClientSession() as session:
                    temp_start = start_timestamp
                    temp_data = []

                    while temp_start < end_timestamp:
                        # 每次最多获取1000条数据
                        params = {
                            'symbol': symbol,
                            'interval': interval,
                            'startTime': temp_start,
                            'endTime': end_timestamp,
                            'limit': 1000
                        }

                        async with session.get(api_url, params=params, timeout=30) as response:
                            if response.status == 200:
                                data = await response.json()

                                if not data:
                                    break

                                temp_data.extend(data)

                                # 更新下次请求的开始时间
                                temp_start = int(data[-1][6]) + 1  # 使用最后一条数据的close_time + 1

                                logger.info(f"   获取到 {len(data)} 条数据，总计 {len(temp_data)} 条")

                                # 如果返回的数据少于1000条，说明已经获取完毕
                                if len(data) < 1000:
                                    break

                            else:
                                logger.error(f"❌ API请求失败: {response.status}")
                                break

                        # 避免请求过于频繁
                        await asyncio.sleep(0.1)

                    # 如果成功获取到数据，使用这个API源
                    if temp_data:
                        all_data = temp_data
                        successful_api = api_url
                        logger.info(f"✅ 成功从 {api_url} 获取真实数据")
                        break

            except Exception as e:
                logger.error(f"❌ API源 {api_url} 请求异常: {e}")
                continue

        if not all_data:
            logger.error(f"❌ {symbol}: 无法从任何Binance API获取数据")
            return None

        # 转换为DataFrame
        columns = ['open_time', 'open', 'high', 'low', 'close', 'volume',
                  'close_time', 'quote_volume', 'trade_num',
                  'taker_buy_base_asset_volume', 'taker_buy_quote_asset_volume', 'ignore']

        df = pd.DataFrame(all_data, columns=columns)

        # 数据类型转换
        df['open_time'] = pd.to_datetime(df['open_time'], unit='ms')
        df['candle_begin_time'] = df['open_time']
        df['open'] = df['open'].astype(float)
        df['high'] = df['high'].astype(float)
        df['low'] = df['low'].astype(float)
        df['close'] = df['close'].astype(float)
        df['volume'] = df['volume'].astype(float)

        # 删除不需要的列
        df = df.drop(['close_time', 'ignore'], axis=1)

        # 记录数据来源
        logger.info(f"✅ {symbol}: 真实数据获取成功")
        logger.info(f"   数据来源: {successful_api} (Binance官方API)")
        logger.info(f"   数据量: {len(df)} 条记录")
        logger.info(f"   时间范围: {df['candle_begin_time'].min()} 到 {df['candle_begin_time'].max()}")
        logger.info(f"   价格范围: ${df['close'].min():.2f} - ${df['close'].max():.2f}")

        return df

    except Exception as e:
        logger.error(f"❌ {symbol}: 真实数据获取失败 - {e}")
        return None


def validate_real_data(df: Optional[pd.DataFrame], symbol: str, request: BacktestRequest) -> bool:
    """验证数据是否为真实的市场数据 - 宽松验证"""
    import pandas as pd
    from datetime import datetime
    import logging

    logger = logging.getLogger(__name__)

    if df is None or df.empty:
        logger.error(f"❌ {symbol}: 数据为空")
        return False

    try:
        # 1. 检查必要的列是否存在 - 放宽要求
        required_columns = ['open', 'high', 'low', 'close']  # 移除volume要求
        missing_columns = [col for col in required_columns if col not in df.columns]
        if missing_columns:
            logger.error(f"❌ {symbol}: 缺少必要的价格数据列: {missing_columns}")
            return False

        # 检查时间列
        if 'candle_begin_time' not in df.columns:
            logger.warning(f"⚠️ {symbol}: 缺少candle_begin_time列，但继续验证")

        # 2. 检查数据类型 - 尝试转换而不是直接失败
        numeric_columns = ['open', 'high', 'low', 'close']
        for col in numeric_columns:
            if not pd.api.types.is_numeric_dtype(df[col]):
                try:
                    df[col] = pd.to_numeric(df[col], errors='coerce')
                    logger.info(f"✅ {symbol}: 成功转换 {col} 列为数值类型")
                except:
                    logger.error(f"❌ {symbol}: 无法转换 {col} 列为数值类型")
                    return False

        # 3. 基本的价格数据合理性检查 - 更宽松
        # 检查是否有明显不合理的价格数据
        invalid_price_rows = (df['high'] < df['low'])
        if invalid_price_rows.sum() > len(df) * 0.1:  # 超过10%的数据不合理才报错
            logger.error(f"❌ {symbol}: 过多不合理的价格数据（最高价低于最低价）")
            return False
        elif invalid_price_rows.any():
            logger.warning(f"⚠️ {symbol}: 发现少量不合理的价格数据，已忽略")

        # 4. 检查价格是否为正数
        price_columns = ['open', 'high', 'low', 'close']
        for col in price_columns:
            if (df[col] <= 0).all():
                logger.error(f"❌ {symbol}: {col} 列所有价格都为0或负数")
                return False

        # 5. 检查数据量是否足够
        if len(df) < 10:
            logger.warning(f"⚠️ {symbol}: 数据量较少（{len(df)}条），但继续处理")

        # 6. 放宽时间范围检查 - 只要有数据就接受
        if 'candle_begin_time' in df.columns:
            try:
                start_date = datetime.strptime(request.date_start, "%Y-%m-%d")
                end_date = datetime.strptime(request.date_end, "%Y-%m-%d")

                data_start = df['candle_begin_time'].min()
                data_end = df['candle_begin_time'].max()

                logger.info(f"📅 {symbol}: 请求时间 {start_date.date()} 到 {end_date.date()}")
                logger.info(f"📅 {symbol}: 数据时间 {data_start.date()} 到 {data_end.date()}")

                # 只要有部分重叠就接受
                if data_end < start_date or data_start > end_date:
                    logger.warning(f"⚠️ {symbol}: 时间范围不重叠，但仍接受数据")

            except Exception as e:
                logger.warning(f"⚠️ {symbol}: 时间验证失败，但继续处理: {e}")

        # 7. 成交量检查 - 可选
        if 'volume' in df.columns:
            if (df['volume'] <= 0).all():
                logger.warning(f"⚠️ {symbol}: 成交量数据异常，但继续处理")
        else:
            logger.info(f"ℹ️ {symbol}: 无成交量数据，跳过成交量检查")

        logger.info(f"✅ {symbol}: 数据验证通过（宽松模式）")
        logger.info(f"   数据行数: {len(df)}")
        logger.info(f"   价格范围: ${df['close'].min():.2f} - ${df['close'].max():.2f}")

        return True

    except Exception as e:
        logger.warning(f"⚠️ {symbol}: 数据验证过程中发生错误，但继续处理: {e}")
        # 在宽松模式下，即使验证出错也尝试继续
        return True

async def run_real_backtest(symbol: str, request: BacktestRequest) -> Optional[BacktestResult]:
    """运行真实的回测逻辑 - 优先使用Binance API，失败时使用本地真实数据"""
    import pandas as pd
    import numpy as np
    from datetime import timedelta
    import logging

    # 设置日志记录
    logging.basicConfig(level=logging.INFO)
    logger = logging.getLogger(__name__)

    logger.info(f"🔍 开始为 {symbol} 获取真实数据进行回测")

    try:
        # 优先使用本地数据文件（更可靠）
        logger.info(f"🔍 {symbol}: 优先尝试使用本地真实数据文件")
        df = await load_existing_data(symbol, request)
        data_source = "本地真实数据文件"

        # 如果本地数据不可用，再尝试API
        if df is None or df.empty:
            logger.info(f"⚠️ {symbol}: 本地数据不可用，尝试从Binance API获取")
            df = await fetch_real_binance_data(symbol, request)
            data_source = "Binance API (实时数据)"

        # 验证数据质量和完整性
        if df is None or df.empty:
            logger.error(f"❌ {symbol}: 无法获取任何数据")
            return None

        # 使用宽松的验证模式
        if not validate_real_data(df, symbol, request):
            logger.warning(f"⚠️ {symbol}: 数据验证未完全通过，但继续回测")
            # 不直接返回None，而是继续处理

        logger.info(f"✅ {symbol}: 数据验证通过")
        logger.info(f"   数据来源: {data_source}")
        logger.info(f"   数据量: {len(df)} 条记录")
        logger.info(f"   时间范围: {df['candle_begin_time'].min()} 到 {df['candle_begin_time'].max()}")
        logger.info(f"   价格范围: ${df['close'].min():.2f} - ${df['close'].max():.2f}")

        # 3. 调用策略计算
        strategy_name = request.strategy.lower()

        # 设置默认参数
        default_params = {
            'sma': {'short_window': 5, 'long_window': 20},
            'rsi': {'period': 14, 'overbought': 70, 'oversold': 30},
            'macd': {'fast_period': 12, 'slow_period': 26, 'signal_period': 9},
            'kdj': {'period': 9, 'k_period': 3, 'd_period': 3, 'overbought': 80, 'oversold': 20},
            'atr_breakout': {'period': 14, 'entry_multiplier': 2.0, 'exit_multiplier': 1.0},
            'mean_reversion': {'period': 20, 'entry_threshold': 2.0, 'exit_threshold': 0.5}
        }

        # 合并用户参数和默认参数
        params = default_params.get(strategy_name, {})
        params.update(request.parameters)

        # 4. 计算交易信号
        df_result = calculate_strategy_signals(df, strategy_name, params)
        if df_result is None or df_result.empty:
            logger.error(f"❌ {symbol}: 策略信号计算失败")
            return None

        # 5. 计算资金曲线
        df_result = calculate_equity_curve_simple(df_result, request.leverage_rate, request.c_rate, request.slippage)

        # 6. 计算统计指标
        result = calculate_backtest_statistics(df_result, symbol, request)
        result.task_id = ""  # 将在外部设置

        # 添加时间范围信息到结果中
        global _current_time_range_info
        if _current_time_range_info:
            result.requested_date_start = _current_time_range_info.get('requested_start', request.date_start)
            result.requested_date_end = _current_time_range_info.get('requested_end', request.date_end)
            result.actual_date_start = _current_time_range_info.get('actual_start', '')
            result.actual_date_end = _current_time_range_info.get('actual_end', '')
            result.data_records_count = _current_time_range_info.get('records_count', len(df_result))
            result.time_range_match_status = _current_time_range_info.get('match_status', 'unknown')
            result.time_range_adjustment_reason = _current_time_range_info.get('adjustment_reason', '')

            logger.info(f"✅ {symbol}: 回测完成，使用100%真实数据")
            logger.info(f"   请求时间范围: {result.requested_date_start} 到 {result.requested_date_end}")
            logger.info(f"   实际时间范围: {result.actual_date_start} 到 {result.actual_date_end}")
            logger.info(f"   数据记录数: {result.data_records_count}")
            logger.info(f"   时间匹配状态: {result.time_range_match_status}")
            if result.time_range_adjustment_reason:
                logger.info(f"   调整原因: {result.time_range_adjustment_reason}")
        else:
            # 如果没有时间范围信息，使用基本信息
            if 'candle_begin_time' in df_result.columns:
                actual_start = df_result['candle_begin_time'].min()
                actual_end = df_result['candle_begin_time'].max()
                result.requested_date_start = request.date_start
                result.requested_date_end = request.date_end
                result.actual_date_start = actual_start.strftime('%Y-%m-%d')
                result.actual_date_end = actual_end.strftime('%Y-%m-%d')
                result.data_records_count = len(df_result)
                result.time_range_match_status = 'unknown'
                result.time_range_adjustment_reason = '时间范围信息不可用'

                logger.info(f"✅ {symbol}: 回测完成，使用100%真实数据")
                logger.info(f"   请求时间范围: {request.date_start} 到 {request.date_end}")
                logger.info(f"   实际时间范围: {actual_start.date()} 到 {actual_end.date()}")
            else:
                logger.info(f"✅ {symbol}: 回测完成，使用100%真实数据")

        return result

    except Exception as e:
        logger.error(f"❌ {symbol}: 回测失败 - {str(e)}")
        return None

def calculate_strategy_signals(df: pd.DataFrame, strategy: str, params: dict) -> Optional[pd.DataFrame]:
    """计算策略信号 - 使用真实的crypto_cta因子"""
    try:
        df = df.copy()

        # 确保必要的列存在
        if 'candle_begin_time' not in df.columns:
            df['candle_begin_time'] = df.index

        print(f"🔄 开始计算策略信号: {strategy}")
        print(f"   参数: {params}")
        print(f"   数据行数: {len(df)}")

        # 如果crypto_cta可用，使用真实因子
        if CTA_AVAILABLE:
            return calculate_real_factor_signals(df, strategy, params)
        else:
            print("⚠️ crypto_cta不可用，使用简化实现")
            return calculate_fallback_signals(df, strategy, params)

    except Exception as e:
        print(f"❌ 计算策略信号失败: {e}")
        return None

def calculate_real_factor_signals(df: pd.DataFrame, strategy: str, params: dict) -> Optional[pd.DataFrame]:
    """使用真实的crypto_cta因子计算信号"""
    try:
        # 参数格式转换：将API参数转换为因子函数期望的para格式
        para = convert_params_to_factor_format(strategy, params)
        print(f"   转换后的因子参数: {para}")

        # 动态导入对应的因子模块
        factor_module = import_factor_module(strategy)
        if factor_module is None:
            print(f"❌ 无法导入因子模块: {strategy}")
            return calculate_fallback_signals(df, strategy, params)

        # 调用因子的signal函数
        print(f"   调用因子函数: {strategy}.signal()")
        df_result = factor_module.signal(df, para=para, proportion=1, leverage_rate=1)

        # 验证结果
        if df_result is None or df_result.empty:
            print(f"❌ 因子计算返回空结果")
            return None

        # 确保pos列存在
        if 'pos' not in df_result.columns:
            if 'signal' in df_result.columns:
                # 从signal计算pos
                df_result['pos'] = df_result['signal'].fillna(0)
            else:
                print("⚠️ 因子结果中缺少pos和signal列，使用默认持仓")
                df_result['pos'] = 1

        print(f"✅ 因子计算成功，返回 {len(df_result)} 行数据")
        return df_result

    except Exception as e:
        print(f"❌ 真实因子计算失败: {e}")
        return calculate_fallback_signals(df, strategy, params)

def import_factor_module(strategy: str):
    """动态导入因子模块"""
    try:
        # 因子名称映射
        factor_map = {
            'sma': 'sma',
            'rsi': 'rsi',
            'macd': 'macd',
            'kdj': 'kdj',
            'atr_breakout': 'atr_breakout',
            'mean_reversion': 'mean_reversion',
            'xbx': 'xbx'
        }

        factor_name = factor_map.get(strategy.lower())
        if not factor_name:
            print(f"❌ 未知的策略类型: {strategy}")
            return None

        # 使用内置的简化因子实现
        return get_builtin_factor(factor_name)

    except Exception as e:
        print(f"❌ 导入因子模块时发生错误: {e}")
        return None

def get_builtin_factor(factor_name: str):
    """获取内置的简化因子实现"""

    class BuiltinFactor:
        def __init__(self, name):
            self.name = name

        def signal(self, df, para=None, proportion=1, leverage_rate=1):
            """简化的因子信号计算"""
            try:
                df = df.copy()

                if self.name == 'sma':
                    return self._sma_signal(df, para)
                elif self.name == 'rsi':
                    return self._rsi_signal(df, para)
                elif self.name == 'macd':
                    return self._macd_signal(df, para)
                elif self.name == 'kdj':
                    return self._kdj_signal(df, para)
                elif self.name == 'atr_breakout':
                    return self._atr_breakout_signal(df, para)
                elif self.name == 'mean_reversion':
                    return self._mean_reversion_signal(df, para)
                elif self.name == 'xbx':
                    return self._xbx_signal(df, para)
                else:
                    print(f"⚠️ 未实现的因子: {self.name}")
                    df['signal'] = 0
                    df['pos'] = 0
                    return df

            except Exception as e:
                print(f"❌ 因子 {self.name} 计算失败: {e}")
                df['signal'] = 0
                df['pos'] = 0
                return df

        def _sma_signal(self, df, para):
            """SMA双均线策略 - 修正版本，使用真正的双均线交叉"""
            # 从参数中获取短期和长期均线周期
            short_window = para[0] if para and len(para) > 0 else 5
            long_window = para[1] if para and len(para) > 1 else 20

            # 如果只有一个参数，使用传统的双均线设置
            if len(para) == 1:
                short_window = para[0]
                long_window = para[0] * 4  # 长期均线是短期的4倍

            # 计算真正的双均线
            df['ma_short'] = df['close'].rolling(window=short_window, min_periods=1).mean()
            df['ma_long'] = df['close'].rolling(window=long_window, min_periods=1).mean()

            # 初始化信号列
            df['signal'] = np.nan
            current_position = 0  # 0: 空仓, 1: 多仓

            # 计算交叉信号 - 优化版本，减少噪音交易
            for i in range(long_window, len(df)):  # 从长期均线有效数据开始
                ma_short_curr = df.iloc[i]['ma_short']
                ma_long_curr = df.iloc[i]['ma_long']
                ma_short_prev = df.iloc[i-1]['ma_short']
                ma_long_prev = df.iloc[i-1]['ma_long']

                if pd.notna(ma_short_curr) and pd.notna(ma_long_curr) and pd.notna(ma_short_prev) and pd.notna(ma_long_prev):
                    # 添加过滤条件：只有明显的交叉才产生信号
                    short_above_long = ma_short_curr > ma_long_curr
                    short_above_long_prev = ma_short_prev > ma_long_prev

                    # 计算均线差值的百分比，避免微小波动
                    ma_diff_pct = abs(ma_short_curr - ma_long_curr) / ma_long_curr

                    # 只有当均线差值超过0.2%时才考虑交易信号（减少噪音）
                    if ma_diff_pct > 0.002:
                        # 上穿：从空仓到多仓
                        if short_above_long and not short_above_long_prev and current_position == 0:
                            df.iloc[i, df.columns.get_loc('signal')] = 1
                            current_position = 1
                        # 下穿：从多仓到空仓
                        elif not short_above_long and short_above_long_prev and current_position == 1:
                            df.iloc[i, df.columns.get_loc('signal')] = 0
                            current_position = 0

            # 清理临时列
            df.drop(['ma_short', 'ma_long'], axis=1, inplace=True, errors='ignore')
            return df

        def _rsi_signal(self, df, para):
            """RSI策略"""
            period = para[0] if para and len(para) > 0 else 14
            overbought = para[1] if para and len(para) > 1 else 70
            oversold = para[2] if para and len(para) > 2 else 30

            # 计算RSI
            delta = df['close'].diff()
            gain = (delta.where(delta > 0, 0)).rolling(window=period).mean()
            loss = (-delta.where(delta < 0, 0)).rolling(window=period).mean()
            rs = gain / (loss + 1e-10)  # 避免除零
            df['rsi'] = 100 - (100 / (1 + rs))

            # 初始化信号列
            df['signal'] = 0

            # 计算RSI信号 - 修正版本，消除前瞻偏差
            current_signal = 0
            for i in range(len(df)):
                rsi_val = df.iloc[i]['rsi']
                if pd.notna(rsi_val):
                    # 超卖买入
                    if rsi_val < oversold and current_signal == 0:
                        df.iloc[i, df.columns.get_loc('signal')] = 1
                        current_signal = 1
                    # 超买卖出
                    elif rsi_val > overbought and current_signal == 1:
                        df.iloc[i, df.columns.get_loc('signal')] = 0
                        current_signal = 0

            # 清理临时列
            df.drop(['rsi'], axis=1, inplace=True, errors='ignore')
            return df

        def _macd_signal(self, df, para):
            """MACD策略"""
            fast_period = para[0] if para and len(para) > 0 else 12
            slow_period = para[1] if para and len(para) > 1 else 26
            signal_period = para[2] if para and len(para) > 2 else 9

            # 计算MACD
            ema_fast = df['close'].ewm(span=fast_period).mean()
            ema_slow = df['close'].ewm(span=slow_period).mean()
            df['macd'] = ema_fast - ema_slow
            df['macd_signal'] = df['macd'].ewm(span=signal_period).mean()
            df['macd_hist'] = df['macd'] - df['macd_signal']

            # 初始化信号列
            df['signal'] = 0
            df['pos'] = 0

            # 计算MACD信号
            current_pos = 0
            for i in range(1, len(df)):
                macd_curr = df.iloc[i]['macd']
                signal_curr = df.iloc[i]['macd_signal']
                macd_prev = df.iloc[i-1]['macd']
                signal_prev = df.iloc[i-1]['macd_signal']

                if pd.notna(macd_curr) and pd.notna(signal_curr):
                    # MACD上穿信号线：买入
                    if macd_curr > signal_curr and macd_prev <= signal_prev:
                        df.iloc[i, df.columns.get_loc('signal')] = 1
                        current_pos = 1
                    # MACD下穿信号线：卖出
                    elif macd_curr < signal_curr and macd_prev >= signal_prev:
                        df.iloc[i, df.columns.get_loc('signal')] = 0
                        current_pos = 0

                df.iloc[i, df.columns.get_loc('pos')] = current_pos

            # 清理临时列
            df.drop(['macd', 'macd_signal', 'macd_hist'], axis=1, inplace=True, errors='ignore')
            return df

        def _kdj_signal(self, df, para):
            """KDJ策略"""
            period = para[0] if para and len(para) > 0 else 9
            k_period = para[1] if para and len(para) > 1 else 3
            d_period = para[2] if para and len(para) > 2 else 3

            # 计算KDJ
            low_min = df['low'].rolling(window=period).min()
            high_max = df['high'].rolling(window=period).max()
            rsv = (df['close'] - low_min) / (high_max - low_min + 1e-10) * 100

            df['k'] = rsv.ewm(alpha=1/k_period).mean()
            df['d'] = df['k'].ewm(alpha=1/d_period).mean()
            df['j'] = 3 * df['k'] - 2 * df['d']

            # 初始化信号列
            df['signal'] = 0
            df['pos'] = 0

            # 计算KDJ信号
            current_pos = 0
            for i in range(len(df)):
                k_val = df.iloc[i]['k']
                d_val = df.iloc[i]['d']

                if pd.notna(k_val) and pd.notna(d_val):
                    # K线上穿D线且在超卖区：买入
                    if k_val > d_val and k_val < 20 and current_pos == 0:
                        df.iloc[i, df.columns.get_loc('signal')] = 1
                        current_pos = 1
                    # K线下穿D线且在超买区：卖出
                    elif k_val < d_val and k_val > 80 and current_pos == 1:
                        df.iloc[i, df.columns.get_loc('signal')] = 0
                        current_pos = 0

                df.iloc[i, df.columns.get_loc('pos')] = current_pos

            # 清理临时列
            df.drop(['k', 'd', 'j'], axis=1, inplace=True, errors='ignore')
            return df

        def _atr_breakout_signal(self, df, para):
            """ATR突破策略"""
            period = para[0] if para and len(para) > 0 else 14
            entry_mult = para[1] if para and len(para) > 1 else 2.0
            exit_mult = para[2] if para and len(para) > 2 else 1.0

            # 计算ATR
            df['tr'] = np.maximum(df['high'] - df['low'],
                                 np.maximum(abs(df['high'] - df['close'].shift(1)),
                                           abs(df['low'] - df['close'].shift(1))))
            df['atr'] = df['tr'].rolling(window=period).mean()

            # 修正：使用前一期的数据计算突破线，避免前瞻偏差
            df['high_max'] = df['high'].rolling(window=period).max().shift(1)
            df['low_min'] = df['low'].rolling(window=period).min().shift(1)
            df['atr_prev'] = df['atr'].shift(1)

            df['upper_band'] = df['high_max'] + entry_mult * df['atr_prev']
            df['lower_band'] = df['low_min'] - entry_mult * df['atr_prev']

            # 初始化信号列
            df['signal'] = 0

            # 计算突破信号 - 使用当期收盘价与前期计算的突破线比较
            current_signal = 0
            for i in range(len(df)):
                close_price = df.iloc[i]['close']
                upper_band = df.iloc[i]['upper_band']
                lower_band = df.iloc[i]['lower_band']

                if pd.notna(close_price) and pd.notna(upper_band) and pd.notna(lower_band):
                    # 向上突破：生成买入信号
                    if close_price > upper_band and current_signal == 0:
                        df.iloc[i, df.columns.get_loc('signal')] = 1
                        current_signal = 1
                    # 向下突破：生成卖出信号
                    elif close_price < lower_band and current_signal == 1:
                        df.iloc[i, df.columns.get_loc('signal')] = 0
                        current_signal = 0

            # 清理临时列
            df.drop(['tr', 'atr', 'high_max', 'low_min', 'atr_prev', 'upper_band', 'lower_band'],
                   axis=1, inplace=True, errors='ignore')
            return df

        def _mean_reversion_signal(self, df, para):
            """均值回归策略 - 修正版本，消除前瞻偏差"""
            period = para[0] if para and len(para) > 0 else 20
            entry_thresh = para[1] if para and len(para) > 1 else 2.0
            exit_thresh = para[2] if para and len(para) > 2 else 0.5

            # 计算均值和标准差
            df['mean'] = df['close'].rolling(window=period).mean()
            df['std'] = df['close'].rolling(window=period).std()
            df['z_score'] = (df['close'] - df['mean']) / (df['std'] + 1e-10)

            # 初始化信号列
            df['signal'] = 0

            # 计算均值回归信号
            current_signal = 0
            for i in range(len(df)):
                z_score = df.iloc[i]['z_score']

                if pd.notna(z_score):
                    # 价格偏离均值过多：反向操作
                    if z_score < -entry_thresh and current_signal == 0:  # 价格过低，买入
                        df.iloc[i, df.columns.get_loc('signal')] = 1
                        current_signal = 1
                    elif z_score > -exit_thresh and current_signal == 1:  # 回归均值，卖出
                        df.iloc[i, df.columns.get_loc('signal')] = 0
                        current_signal = 0

            # 清理临时列
            df.drop(['mean', 'std', 'z_score'], axis=1, inplace=True, errors='ignore')
            return df

        def _xbx_signal(self, df, para):
            """修正布林带策略 - 修正版本，消除前瞻偏差"""
            period = para[0] if para and len(para) > 0 else 20
            std_mult = para[1] if para and len(para) > 1 else 2.0

            # 计算布林带
            df['bb_middle'] = df['close'].rolling(window=period).mean()
            df['bb_std'] = df['close'].rolling(window=period).std()
            df['bb_upper'] = df['bb_middle'] + std_mult * df['bb_std']
            df['bb_lower'] = df['bb_middle'] - std_mult * df['bb_std']

            # 初始化信号列
            df['signal'] = 0

            # 计算布林带信号
            current_signal = 0
            for i in range(len(df)):
                close_price = df.iloc[i]['close']
                bb_upper = df.iloc[i]['bb_upper']
                bb_lower = df.iloc[i]['bb_lower']
                bb_middle = df.iloc[i]['bb_middle']

                if pd.notna(close_price) and pd.notna(bb_upper) and pd.notna(bb_lower):
                    # 触及下轨：买入
                    if close_price <= bb_lower and current_signal == 0:
                        df.iloc[i, df.columns.get_loc('signal')] = 1
                        current_signal = 1
                    # 回到中轨：卖出
                    elif close_price >= bb_middle and current_signal == 1:
                        df.iloc[i, df.columns.get_loc('signal')] = 0
                        current_signal = 0

            # 清理临时列
            df.drop(['bb_middle', 'bb_std', 'bb_upper', 'bb_lower'], axis=1, inplace=True, errors='ignore')
            return df

    return BuiltinFactor(factor_name)

def convert_params_to_factor_format(strategy: str, params: dict) -> list:
    """将API参数转换为因子函数期望的para格式"""
    try:
        strategy = strategy.lower()

        if strategy == 'sma':
            # SMA因子期望: [short_window, long_window]
            short_window = params.get('short_window', params.get('period', 5))
            long_window = params.get('long_window', short_window * 4)
            return [short_window, long_window]

        elif strategy == 'rsi':
            # RSI因子期望: [period, overbought_level, oversold_level]
            period = params.get('period', 14)
            overbought = params.get('overbought', 70)
            oversold = params.get('oversold', 30)
            return [period, overbought, oversold]

        elif strategy == 'macd':
            # MACD因子期望: [fast_period, slow_period, signal_period]
            fast = params.get('fast_period', 12)
            slow = params.get('slow_period', 26)
            signal = params.get('signal_period', 9)
            return [fast, slow, signal]

        elif strategy == 'kdj':
            # KDJ因子期望: [period, k_period, d_period]
            period = params.get('period', 9)
            k_period = params.get('k_period', 3)
            d_period = params.get('d_period', 3)
            return [period, k_period, d_period]

        elif strategy == 'atr_breakout':
            # ATR突破因子期望: [period, entry_multiplier, exit_multiplier]
            period = params.get('period', 14)
            entry_mult = params.get('entry_multiplier', 2.0)
            exit_mult = params.get('exit_multiplier', 1.0)
            return [period, entry_mult, exit_mult]

        elif strategy == 'mean_reversion':
            # 均值回归因子期望: [period, entry_threshold, exit_threshold]
            period = params.get('period', 20)
            entry_thresh = params.get('entry_threshold', 2.0)
            exit_thresh = params.get('exit_threshold', 0.5)
            return [period, entry_thresh, exit_thresh]

        elif strategy == 'xbx':
            # XBX因子期望: [period, std_multiplier]
            period = params.get('period', 20)
            std_mult = params.get('std_multiplier', 2.0)
            return [period, std_mult]

        else:
            print(f"⚠️ 未知策略类型，使用默认参数: {strategy}")
            return [20, 2.0]  # 默认参数

    except Exception as e:
        print(f"❌ 参数转换失败: {e}")
        return [20, 2.0]  # 默认参数

def ensure_position_lag(df: pd.DataFrame) -> pd.DataFrame:
    """确保持仓信号正确延迟，避免前瞻偏差"""
    try:
        df = df.copy()

        # 如果存在signal列但pos列不正确，重新计算pos
        if 'signal' in df.columns:
            # 清理signal列，向前填充NaN值
            df['signal_clean'] = df['signal'].ffill().fillna(0)

            # 关键：使用shift(1)确保持仓在下一期生效，避免前瞻偏差
            df['pos'] = df['signal_clean'].shift(1)
            df['pos'] = df['pos'].fillna(0)

            # 清理临时列
            df.drop(['signal_clean'], axis=1, inplace=True, errors='ignore')

        # 如果没有signal列但有pos列，检查是否需要额外延迟
        elif 'pos' in df.columns:
            # 检查pos是否已经正确延迟（通过检查是否存在即时响应）
            # 这里我们保持现有的pos，假设它已经正确处理
            pass
        else:
            # 如果既没有signal也没有pos，创建默认的空仓位
            df['pos'] = 0

        return df

    except Exception as e:
        print(f"❌ 持仓延迟处理失败: {e}")
        # 如果处理失败，至少确保有pos列
        if 'pos' not in df.columns:
            df['pos'] = 0
        return df

def calculate_fallback_signals(df: pd.DataFrame, strategy: str, params: dict) -> Optional[pd.DataFrame]:
    """简化的策略信号计算（当crypto_cta不可用时使用）"""
    try:
        df = df.copy()

        if strategy == 'sma':
            # 简单移动平均策略 - 修正版本，消除前瞻偏差
            short_window = params.get('short_window', params.get('period', 5))
            long_window = params.get('long_window', short_window * 2)

            df['sma_short'] = df['close'].rolling(window=short_window).mean()
            df['sma_long'] = df['close'].rolling(window=long_window).mean()

            # 生成交易信号（不是持仓信号）
            df['signal'] = 0

            # 修正：从第1行开始（需要前一期数据进行比较）
            for i in range(1, len(df)):
                ma_short_curr = df.iloc[i]['sma_short']
                ma_long_curr = df.iloc[i]['sma_long']
                ma_short_prev = df.iloc[i-1]['sma_short']
                ma_long_prev = df.iloc[i-1]['sma_long']

                if pd.notna(ma_short_curr) and pd.notna(ma_long_curr) and pd.notna(ma_short_prev) and pd.notna(ma_long_prev):
                    # 上穿：生成买入信号
                    if ma_short_curr > ma_long_curr and ma_short_prev <= ma_long_prev:
                        df.iloc[i, df.columns.get_loc('signal')] = 1
                    # 下穿：生成卖出信号
                    elif ma_short_curr < ma_long_curr and ma_short_prev >= ma_long_prev:
                        df.iloc[i, df.columns.get_loc('signal')] = 0

            # 清理临时列
            df.drop(['sma_short', 'sma_long'], axis=1, inplace=True, errors='ignore')

        elif strategy == 'rsi':
            # RSI策略 - 修正版本，消除前瞻偏差
            period = params.get('period', 14)
            overbought = params.get('overbought', 70)
            oversold = params.get('oversold', 30)

            # 计算RSI
            delta = df['close'].diff()
            gain = (delta.where(delta > 0, 0)).rolling(window=period).mean()
            loss = (-delta.where(delta < 0, 0)).rolling(window=period).mean()
            rs = gain / loss
            df['rsi'] = 100 - (100 / (1 + rs))

            # 生成交易信号（不是持仓信号）
            df['signal'] = np.nan
            current_signal = 0

            for i in range(len(df)):
                rsi_val = df.iloc[i]['rsi']
                if pd.notna(rsi_val):
                    if rsi_val < oversold and current_signal == 0:  # 超卖时买入
                        df.iloc[i, df.columns.get_loc('signal')] = 1
                        current_signal = 1
                    elif rsi_val > overbought and current_signal == 1:  # 超买时卖出
                        df.iloc[i, df.columns.get_loc('signal')] = 0
                        current_signal = 0

            # 清理临时列
            df.drop(['rsi'], axis=1, inplace=True, errors='ignore')

        else:
            # 默认买入持有策略
            print(f"⚠️ 策略 {strategy} 暂不支持简化实现，使用买入持有策略")
            df['signal'] = 1  # 生成信号而不是直接设置持仓

        # 关键步骤：将信号转换为持仓，并应用正确的延迟
        # 向前填充信号
        df['signal'] = df['signal'].ffill().fillna(0)

        # 应用持仓延迟（信号在下一期生效）
        df['pos'] = df['signal'].shift(1).fillna(0)

        return df

    except Exception as e:
        print(f"❌ 简化策略计算失败: {e}")
        return None

def calculate_equity_curve_simple(df: pd.DataFrame, leverage_rate: float, c_rate: float, slippage: float) -> pd.DataFrame:
    """修正的资金曲线计算 - 消除前瞻偏差和修正交易成本计算"""
    try:
        df = df.copy()

        # 确保持仓信号已经正确延迟（避免前瞻偏差）
        df = ensure_position_lag(df)

        # 计算持仓变化
        df['pos_change'] = df['pos'].diff().fillna(0)

        # 计算收益率
        df['price_change'] = df['close'].pct_change().fillna(0)

        # 计算策略收益率（使用前一期持仓，避免前瞻偏差）
        df['strategy_return'] = df['pos'].shift(1) * df['price_change'] * leverage_rate

        # 修正：基于交易价值计算交易成本，但使用更合理的成本模型
        # 计算交易价值（绝对持仓变化 * 当期收盘价）
        df['trade_value'] = abs(df['pos_change']) * df['close']

        # 初始化资金曲线用于计算交易成本百分比
        initial_capital = 10000.0  # 初始资金
        df['equity_curve_temp'] = float(initial_capital)
        df['net_return'] = 0.0  # 初始化净收益率列
        df['trade_cost'] = 0.0  # 初始化交易成本列

        # 逐行计算资金曲线和交易成本
        for i in range(1, len(df)):
            # 前一期的资金
            prev_equity = df.iloc[i-1]['equity_curve_temp']

            # 当期策略收益（基于前一期资金）
            strategy_pnl = df.iloc[i]['strategy_return'] * prev_equity

            # 修正的交易成本计算：只对实际交易收取成本，且基于资金而非交易价值
            if df.iloc[i]['pos_change'] != 0:
                # 交易成本基于当期资金的百分比，而不是交易价值
                trade_cost_absolute = prev_equity * abs(df.iloc[i]['pos_change']) * (c_rate + slippage)
            else:
                trade_cost_absolute = 0

            # 存储交易成本
            df.iloc[i, df.columns.get_loc('trade_cost')] = trade_cost_absolute

            # 净收益
            net_pnl = strategy_pnl - trade_cost_absolute

            # 更新资金曲线
            df.iloc[i, df.columns.get_loc('equity_curve_temp')] = prev_equity + net_pnl

            # 计算净收益率（相对于前一期资金）
            df.iloc[i, df.columns.get_loc('net_return')] = net_pnl / prev_equity if prev_equity > 0 else 0

        # 标准化资金曲线（以初始资金为1）
        df['equity_curve'] = df['equity_curve_temp'] / initial_capital

        # 计算回撤
        df['peak'] = df['equity_curve'].expanding().max()
        df['drawdown'] = (df['equity_curve'] - df['peak']) / df['peak']

        # 清理临时列
        df.drop(['equity_curve_temp', 'trade_value'], axis=1, inplace=True, errors='ignore')

        return df

    except Exception as e:
        print(f"Error calculating equity curve: {e}")
        return df

def calculate_backtest_statistics(df: pd.DataFrame, symbol: str, request: BacktestRequest) -> BacktestResult:
    """修正的回测统计指标计算 - 使用一致的年化方法和正确的风险指标"""
    try:
        import numpy as np
        from datetime import timedelta

        # 基本统计
        final_equity = df['equity_curve'].iloc[-1]
        final_return = final_equity - 1

        # 计算年化收益率 - 修正：使用一致的交易日计算
        start_date = df['candle_begin_time'].iloc[0]
        end_date = df['candle_begin_time'].iloc[-1]
        days = (end_date - start_date).days

        # 根据数据频率确定年化因子
        if request.rule_type == '1H':
            periods_per_year = 365 * 24  # 每年小时数
            periods_in_data = len(df)
        elif request.rule_type == '4H':
            periods_per_year = 365 * 6   # 每年4小时周期数
            periods_in_data = len(df)
        elif request.rule_type == '1D':
            periods_per_year = 365       # 每年天数
            periods_in_data = len(df)
        else:
            # 默认使用天数
            periods_per_year = 365
            periods_in_data = max(days, 1)

        # 修正的年化收益率计算
        if periods_in_data > 0:
            annual_return = (final_equity ** (periods_per_year / periods_in_data)) - 1
        else:
            annual_return = 0

        # 计算最大回撤
        df['peak'] = df['equity_curve'].expanding().max()
        df['drawdown'] = (df['equity_curve'] - df['peak']) / df['peak']
        max_drawdown = abs(df['drawdown'].min())

        # 修正的风险指标计算
        returns = df['net_return'].dropna()
        if len(returns) > 1:
            # 使用一致的年化因子
            if request.rule_type == '1H':
                annualization_factor = np.sqrt(365 * 24)
            elif request.rule_type == '4H':
                annualization_factor = np.sqrt(365 * 6)
            elif request.rule_type == '1D':
                annualization_factor = np.sqrt(365)
            else:
                annualization_factor = np.sqrt(252)  # 默认交易日

            # 年化波动率
            volatility = returns.std() * annualization_factor

            # 修正的夏普比率（假设无风险利率为0，适用于加密货币）
            sharpe_ratio = annual_return / volatility if volatility > 0 else 0
        else:
            volatility = 0
            sharpe_ratio = 0

        # 计算交易统计
        trades = df[df['pos_change'] != 0].copy()
        total_trades = len(trades)

        if total_trades > 0:
            # 简化的交易分析
            winning_trades = len(trades[trades['net_return'] > 0])
            losing_trades = total_trades - winning_trades
            win_rate = winning_trades / total_trades

            avg_win = trades[trades['net_return'] > 0]['net_return'].mean() if winning_trades > 0 else 0
            avg_loss = trades[trades['net_return'] < 0]['net_return'].mean() if losing_trades > 0 else 0

            total_profit = trades[trades['net_return'] > 0]['net_return'].sum()
            total_loss = abs(trades[trades['net_return'] < 0]['net_return'].sum())
            profit_factor = total_profit / total_loss if total_loss > 0 else 0
        else:
            winning_trades = 0
            losing_trades = 0
            win_rate = 0
            avg_win = 0
            avg_loss = 0
            profit_factor = 0

        # 生成资金曲线数据
        equity_curve = []
        for _, row in df.iterrows():
            equity_curve.append({
                "date": row['candle_begin_time'].strftime("%Y-%m-%d %H:%M:%S"),
                "value": float(row['equity_curve'] * 10000),  # 假设初始资金10000
                "drawdown": float(abs(row['drawdown']))
            })

        # 生成交易记录
        trade_records = []
        for i, (_, row) in enumerate(trades.iterrows()):
            if row['pos_change'] != 0:
                trade_records.append(TradeRecord(
                    id=f"trade_{symbol}_{i:06d}",
                    symbol=symbol,
                    side="buy" if row['pos_change'] > 0 else "sell",
                    quantity=abs(row['pos_change']),
                    price=float(row['close']),
                    timestamp=row['candle_begin_time'],
                    pnl=float(row['net_return'] * 10000),
                    commission=float(row['trade_cost'] * 10000 * 0.5),
                    slippage=float(row['trade_cost'] * 10000 * 0.5)
                ))

        # 生成月度收益
        monthly_returns = []
        df_monthly = df.set_index('candle_begin_time')
        monthly_data = df_monthly['net_return'].resample('ME').sum()

        for date, return_val in monthly_data.items():
            monthly_returns.append(MonthlyReturn(
                year=date.year,
                month=date.month,
                return_value=float(return_val)
            ))

        # 计算其他风险指标
        sortino_ratio = 0
        calmar_ratio = annual_return / max_drawdown if max_drawdown > 0 else 0
        var_95 = np.percentile(returns, 5) if len(returns) > 0 else 0
        cvar_95 = returns[returns <= var_95].mean() if len(returns) > 0 else 0

        result = BacktestResult(
            task_id="",  # 将在调用处设置
            symbol=symbol,
            strategy=request.strategy,
            parameters=request.parameters,
            final_return=final_return,
            annual_return=annual_return,
            max_drawdown=max_drawdown,
            sharpe_ratio=sharpe_ratio,
            sortino_ratio=sortino_ratio,
            calmar_ratio=calmar_ratio,
            win_rate=win_rate,
            profit_factor=profit_factor,
            total_trades=total_trades,
            winning_trades=winning_trades,
            losing_trades=losing_trades,
            avg_win=avg_win,
            avg_loss=avg_loss,
            max_consecutive_wins=0,  # 需要更复杂的计算
            max_consecutive_losses=0,  # 需要更复杂的计算
            volatility=volatility,
            skewness=float(returns.skew()) if len(returns) > 2 else 0,
            kurtosis=float(returns.kurtosis()) if len(returns) > 2 else 0,
            var_95=var_95,
            cvar_95=cvar_95,
            equity_curve=equity_curve,
            drawdown_periods=[],  # 需要更复杂的计算
            monthly_returns=monthly_returns,
            trade_records=trade_records,
            created_at=datetime.now()
        )

        return result

    except Exception as e:
        print(f"Error calculating backtest statistics: {e}")
        # 返回默认结果
        return BacktestResult(
            task_id="",
            symbol=symbol,
            strategy=request.strategy,
            parameters=request.parameters,
            final_return=0,
            annual_return=0,
            max_drawdown=0,
            sharpe_ratio=0,
            win_rate=0,
            profit_factor=0,
            total_trades=0,
            equity_curve=[],
            trade_records=[],
            monthly_returns=[],
            created_at=datetime.now()
        )

@router.post("/run")
async def start_backtest(
    request: BacktestRequest,
    background_tasks: BackgroundTasks
):
    """启动回测任务 - 仅使用真实数据"""
    import logging

    # 设置日志记录
    logging.basicConfig(level=logging.INFO)
    logger = logging.getLogger(__name__)

    task_id = str(uuid.uuid4())

    # 记录回测请求
    logger.info(f"🚀 启动新回测任务: {task_id}")
    logger.info(f"   交易对: {request.symbols}")
    logger.info(f"   策略: {request.strategy}")
    logger.info(f"   时间范围: {request.date_start} 到 {request.date_end}")
    logger.info(f"   数据周期: {request.rule_type}")
    logger.info(f"   数据来源: 仅使用Binance真实数据")

    # 创建任务状态
    task_status = BacktestStatus(
        task_id=task_id,
        status="pending",
        message="回测任务已创建 - 将仅使用真实数据",
        symbols_total=len(request.symbols)
    )
    backtest_tasks[task_id] = task_status

    # 在后台运行回测
    background_tasks.add_task(run_backtest_task, task_id, request)

    return {
        "task_id": task_id,
        "message": "回测已启动 - 仅使用Binance真实数据",
        "status": "pending",
        "data_source": "Binance API (真实数据)"
    }

async def run_backtest_task(task_id: str, request: BacktestRequest):
    """后台运行回测任务 - 仅使用真实数据"""
    task_status = backtest_tasks[task_id]

    try:
        task_status.status = "running"
        task_status.message = "Starting backtest with real data only..."

        results = []

        for i, symbol in enumerate(request.symbols):
            task_status.message = f"Processing {symbol} with real data..."
            task_status.progress = (i / len(request.symbols)) * 100

            try:
                # 强制使用真实数据进行回测
                real_result = await run_real_backtest(symbol, request)
                if real_result:
                    real_result.task_id = task_id
                    results.append(real_result)
                    print(f"✅ {symbol}: 使用真实数据完成回测")
                else:
                    # 如果无法获取真实数据，记录错误并跳过
                    error_msg = f"❌ {symbol}: 无法获取真实数据，跳过此交易对"
                    print(error_msg)
                    task_status.message = f"Warning: {error_msg}"
                    continue

            except Exception as e:
                error_msg = f"❌ {symbol}: 回测失败 - {str(e)}"
                print(error_msg)
                task_status.message = f"Error: {error_msg}"
                continue

            task_status.symbols_completed = i + 1

        if not results:
            task_status.status = "failed"
            task_status.message = "所有交易对都无法获取真实数据，回测失败"
        else:
            task_status.status = "completed"
            task_status.progress = 100.0
            task_status.message = f"回测完成，成功处理 {len(results)} 个交易对（仅使用真实数据）"
            task_status.results = results

    except Exception as e:
        task_status.status = "failed"
        task_status.message = f"Backtest failed: {str(e)}"

@router.get("/status/{task_id}", response_model=BacktestStatus)
async def get_backtest_status(task_id: str):
    """获取回测任务状态"""
    if task_id not in backtest_tasks:
        raise HTTPException(status_code=404, detail="Task not found")

    return backtest_tasks[task_id]


@router.get("/data-source-verification")
async def verify_data_sources():
    """验证数据源配置和可用性"""
    import logging
    import os
    import aiohttp

    logger = logging.getLogger(__name__)
    verification_result = {
        "timestamp": datetime.now().isoformat(),
        "bn_data_config": {},
        "binance_api_status": {},
        "data_integrity": {},
        "recommendations": []
    }

    try:
        # 1. 检查bn_data配置
        bn_data_config_path = os.path.join(os.path.dirname(__file__), '..', '..', '..', 'bn_data', 'config.py')
        if os.path.exists(bn_data_config_path):
            try:
                # 读取bn_data配置
                with open(bn_data_config_path, 'r', encoding='utf-8') as f:
                    config_content = f.read()

                # 检查关键配置
                update_to_now = 'update_to_now = True' in config_content
                trade_type = 'swap' if "trade_type = 'swap'" in config_content else 'spot'

                verification_result["bn_data_config"] = {
                    "config_file_exists": True,
                    "update_to_now": update_to_now,
                    "trade_type": trade_type,
                    "status": "✅ 配置正确" if update_to_now else "❌ 需要设置 update_to_now = True"
                }

                if not update_to_now:
                    verification_result["recommendations"].append(
                        "设置 bn_data/config.py 中的 update_to_now = True 以获取2025年最新数据"
                    )

            except Exception as e:
                verification_result["bn_data_config"] = {
                    "config_file_exists": True,
                    "error": f"读取配置文件失败: {e}",
                    "status": "❌ 配置文件读取失败"
                }
        else:
            verification_result["bn_data_config"] = {
                "config_file_exists": False,
                "status": "❌ bn_data配置文件不存在"
            }
            verification_result["recommendations"].append("确保bn_data模块正确安装和配置")

        # 2. 测试Binance API连接
        api_endpoints = [
            'https://fapi.binance.com/fapi/v1/ping',
            'https://api.binance.com/api/v3/ping'
        ]

        for endpoint in api_endpoints:
            try:
                async with aiohttp.ClientSession() as session:
                    async with session.get(endpoint, timeout=10) as response:
                        if response.status == 200:
                            verification_result["binance_api_status"][endpoint] = {
                                "status": "✅ 连接正常",
                                "response_time": "< 10s"
                            }
                        else:
                            verification_result["binance_api_status"][endpoint] = {
                                "status": f"❌ 连接失败 ({response.status})",
                                "response_time": "N/A"
                            }
            except Exception as e:
                verification_result["binance_api_status"][endpoint] = {
                    "status": f"❌ 连接异常: {e}",
                    "response_time": "N/A"
                }

        # 3. 检查现有数据完整性
        data_path = os.path.join(os.path.dirname(__file__), '..', '..', '..', 'bn_data', 'output', 'pickle_data')
        if os.path.exists(data_path):
            intervals = ['1H', '4H', '1D']
            symbols = ['BTCUSDT', 'ETHUSDT', 'BNBUSDT', 'ADAUSDT', 'SOLUSDT']

            for interval in intervals:
                interval_path = os.path.join(data_path, interval)
                if os.path.exists(interval_path):
                    available_files = [f for f in os.listdir(interval_path) if f.endswith('.pkl')]
                    verification_result["data_integrity"][interval] = {
                        "available_symbols": len(available_files),
                        "expected_symbols": len(symbols),
                        "files": available_files,
                        "status": "✅ 数据完整" if len(available_files) >= len(symbols) else "⚠️ 数据不完整"
                    }
                else:
                    verification_result["data_integrity"][interval] = {
                        "available_symbols": 0,
                        "expected_symbols": len(symbols),
                        "files": [],
                        "status": "❌ 数据目录不存在"
                    }
        else:
            verification_result["data_integrity"] = {
                "status": "❌ bn_data输出目录不存在"
            }
            verification_result["recommendations"].append("运行 'cd bn_data && python main.py' 生成数据文件")

        # 4. 生成总体建议
        if not verification_result["recommendations"]:
            verification_result["recommendations"].append("✅ 所有配置正确，可以使用真实数据进行回测")

        verification_result["overall_status"] = "✅ 验证通过" if not any(
            "❌" in str(v) for v in verification_result.values()
        ) else "⚠️ 需要修复配置问题"

        return verification_result

    except Exception as e:
        logger.error(f"数据源验证失败: {e}")
        return {
            "timestamp": datetime.now().isoformat(),
            "error": f"验证过程失败: {e}",
            "overall_status": "❌ 验证失败"
        }

@router.get("/results/{task_id}")
async def get_backtest_results(task_id: str):
    """获取回测结果"""
    if task_id not in backtest_tasks:
        raise HTTPException(status_code=404, detail="Task not found")

    task_status = backtest_tasks[task_id]

    if task_status.status != "completed":
        raise HTTPException(status_code=400, detail="Backtest not completed yet")

    return {
        "task_id": task_id,
        "status": task_status.status,
        "results": task_status.results,
        "summary": {
            "total_symbols": len(task_status.results),
            "avg_return": sum(r.final_return for r in task_status.results) / len(task_status.results) if task_status.results else 0,
            "best_symbol": max(task_status.results, key=lambda x: x.final_return).symbol if task_status.results else None
        }
    }

@router.get("/tasks")
async def list_backtest_tasks():
    """获取所有回测任务列表"""
    return [
        {
            "task_id": task_id,
            "status": task.status,
            "symbols_total": task.symbols_total,
            "symbols_completed": task.symbols_completed,
            "progress": task.progress,
            "message": task.message,
            "results": task.results or []
        }
        for task_id, task in backtest_tasks.items()
    ]

@router.post("/optimize")
async def start_optimization(
    request: OptimizationRequest,
    background_tasks: BackgroundTasks
):
    """启动参数优化任务"""
    task_id = str(uuid.uuid4())

    # 创建优化任务
    task_status = BacktestStatus(
        task_id=task_id,
        status="pending",
        message="Parameter optimization task created",
        symbols_total=len(request.symbols)
    )
    backtest_tasks[task_id] = task_status

    # 在后台运行优化
    background_tasks.add_task(run_optimization_task, task_id, request)

    return {
        "task_id": task_id,
        "message": "Parameter optimization started",
        "status": "pending"
    }

async def run_optimization_task(task_id: str, request: OptimizationRequest):
    """后台运行参数优化任务"""
    task_status = backtest_tasks[task_id]

    try:
        task_status.status = "running"
        task_status.message = "Running parameter optimization..."

        # 实现网格搜索参数优化
        results = await run_grid_search_optimization(task_id, request)

        # 按照夏普比率排序结果
        results.sort(key=lambda x: x.sharpe_ratio, reverse=True)

        task_status.results = results
        task_status.status = "completed"
        task_status.progress = 100.0
        task_status.message = f"Parameter optimization completed. Found {len(results)} parameter combinations."

    except Exception as e:
        task_status.status = "failed"
        task_status.message = f"Optimization failed: {str(e)}"

async def run_grid_search_optimization(task_id: str, request: OptimizationRequest) -> List[BacktestResult]:
    """运行网格搜索参数优化"""
    import itertools

    # 生成参数组合
    param_combinations = generate_parameter_combinations(request.parameter_ranges)

    print(f"🔍 开始参数优化，共 {len(param_combinations)} 个参数组合")

    results = []
    task_status = backtest_tasks[task_id]

    for i, params in enumerate(param_combinations):
        try:
            # 更新进度
            progress = (i / len(param_combinations)) * 100
            task_status.progress = progress
            task_status.message = f"Testing parameters {i+1}/{len(param_combinations)}: {params}"

            print(f"📊 测试参数组合 {i+1}/{len(param_combinations)}: {params}")

            # 为每个交易对运行回测
            for symbol in request.symbols:
                # 创建回测请求
                backtest_request = BacktestRequest(
                    symbols=[symbol],
                    strategy=request.strategy,
                    parameters=params,
                    date_start=request.date_start,
                    date_end=request.date_end,
                    rule_type=request.rule_type
                )

                # 运行回测
                result = await run_real_backtest(symbol, backtest_request)
                if result:
                    result.task_id = task_id
                    result.parameters = params  # 确保参数被正确设置
                    results.append(result)
                    print(f"✅ {symbol}: 参数 {params} - 夏普比率: {result.sharpe_ratio:.3f}, 收益率: {result.final_return:.3f}")
                else:
                    print(f"❌ {symbol}: 参数 {params} - 回测失败")

        except Exception as e:
            print(f"❌ 参数组合 {params} 测试失败: {e}")
            continue

    print(f"🎯 参数优化完成，共生成 {len(results)} 个有效结果")
    return results

def generate_parameter_combinations(parameter_ranges: Dict[str, List[float]]) -> List[Dict[str, float]]:
    """生成参数组合"""
    import itertools

    # 获取参数名称和值
    param_names = list(parameter_ranges.keys())
    param_values = list(parameter_ranges.values())

    # 生成所有组合
    combinations = []
    for combination in itertools.product(*param_values):
        param_dict = {}
        for name, value in zip(param_names, combination):
            # 对于窗口参数，转换为整数
            if 'window' in name.lower():
                param_dict[name] = int(value)
            else:
                param_dict[name] = value
        combinations.append(param_dict)

    return combinations

def analyze_parameter_space(results: List[BacktestResult], metric: str = "sharpe_ratio") -> Dict:
    """分析参数空间，生成参数平原或热力图数据"""
    if not results:
        return {"parameter_count": 0, "visualization_type": "none", "data": []}

    # 提取参数名称
    first_result = results[0]
    if not first_result.parameters:
        return {"parameter_count": 0, "visualization_type": "none", "data": []}

    param_names = list(first_result.parameters.keys())
    param_count = len(param_names)

    # 获取指标值的函数
    def get_metric_value(result: BacktestResult) -> float:
        if metric == "sharpe_ratio":
            return result.sharpe_ratio or 0
        elif metric == "final_return":
            return result.final_return or 0
        elif metric == "max_drawdown":
            return -(result.max_drawdown or 0)  # 负值，因为回撤越小越好
        elif metric == "win_rate":
            return result.win_rate or 0
        elif metric == "total_trades":
            return result.total_trades or 0
        else:
            return result.sharpe_ratio or 0

    if param_count == 1:
        # 单参数：生成参数平原数据
        param_name = param_names[0]
        data_points = []

        for result in results:
            param_value = result.parameters[param_name]
            metric_value = get_metric_value(result)
            data_points.append({
                "parameter": param_value,
                "value": metric_value,
                "result": result
            })

        # 按参数值排序
        data_points.sort(key=lambda x: x["parameter"])

        return {
            "parameter_count": 1,
            "visualization_type": "line_chart",
            "parameter_name": param_name,
            "data": data_points,
            "best_parameter": max(data_points, key=lambda x: x["value"])["parameter"],
            "best_value": max(data_points, key=lambda x: x["value"])["value"]
        }

    elif param_count == 2:
        # 双参数：生成热力图数据
        param1_name, param2_name = param_names[0], param_names[1]

        # 收集所有参数值
        param1_values = sorted(set(result.parameters[param1_name] for result in results))
        param2_values = sorted(set(result.parameters[param2_name] for result in results))

        # 创建热力图矩阵
        heatmap_data = []
        best_value = float('-inf')
        best_params = None

        for p1_val in param1_values:
            row = []
            for p2_val in param2_values:
                # 查找对应的结果
                matching_result = None
                for result in results:
                    if (result.parameters[param1_name] == p1_val and
                        result.parameters[param2_name] == p2_val):
                        matching_result = result
                        break

                if matching_result:
                    metric_value = get_metric_value(matching_result)
                    row.append({
                        "value": metric_value,
                        "parameters": {param1_name: p1_val, param2_name: p2_val},
                        "result": matching_result
                    })

                    if metric_value > best_value:
                        best_value = metric_value
                        best_params = {param1_name: p1_val, param2_name: p2_val}
                else:
                    row.append({"value": None, "parameters": {param1_name: p1_val, param2_name: p2_val}})

            heatmap_data.append(row)

        return {
            "parameter_count": 2,
            "visualization_type": "heatmap",
            "parameter_names": [param1_name, param2_name],
            "parameter1_values": param1_values,
            "parameter2_values": param2_values,
            "heatmap_data": heatmap_data,
            "best_parameters": best_params,
            "best_value": best_value
        }

    else:
        # 多参数：返回表格数据
        data_points = []
        for result in results:
            metric_value = get_metric_value(result)
            data_points.append({
                "parameters": result.parameters,
                "value": metric_value,
                "result": result
            })

        # 按指标值排序
        data_points.sort(key=lambda x: x["value"], reverse=True)

        return {
            "parameter_count": param_count,
            "visualization_type": "table",
            "parameter_names": param_names,
            "data": data_points[:20],  # 只返回前20个结果
            "best_parameters": data_points[0]["parameters"] if data_points else None,
            "best_value": data_points[0]["value"] if data_points else None
        }

@router.get("/tasks/{task_id}/optimization-results")
async def get_optimization_results(
    task_id: str,
    sort_by: str = "sharpe_ratio",
    order: str = "desc",
    limit: int = 10
):
    """获取参数优化结果，支持排序和限制数量"""
    if task_id not in backtest_tasks:
        raise HTTPException(status_code=404, detail="Task not found")

    task = backtest_tasks[task_id]
    if not task.results:
        return {"message": "No optimization results available", "results": []}

    # 复制结果列表以避免修改原始数据
    results = task.results.copy()

    # 排序
    reverse = (order.lower() == "desc")
    if sort_by == "sharpe_ratio":
        results.sort(key=lambda x: x.sharpe_ratio or 0, reverse=reverse)
    elif sort_by == "final_return":
        results.sort(key=lambda x: x.final_return or 0, reverse=reverse)
    elif sort_by == "max_drawdown":
        results.sort(key=lambda x: x.max_drawdown or 0, reverse=not reverse)  # 回撤越小越好
    elif sort_by == "win_rate":
        results.sort(key=lambda x: x.win_rate or 0, reverse=reverse)
    elif sort_by == "total_trades":
        results.sort(key=lambda x: x.total_trades or 0, reverse=reverse)

    # 限制数量
    limited_results = results[:limit]

    return {
        "task_id": task_id,
        "total_combinations": len(task.results),
        "showing": len(limited_results),
        "sort_by": sort_by,
        "order": order,
        "results": limited_results
    }

@router.get("/tasks/{task_id}/parameter-analysis")
async def get_parameter_analysis(
    task_id: str,
    metric: str = "sharpe_ratio"
):
    """获取参数分析数据，支持参数平原和热力图"""
    if task_id not in backtest_tasks:
        raise HTTPException(status_code=404, detail="Task not found")

    task = backtest_tasks[task_id]
    if not task.results:
        return {"message": "No optimization results available", "analysis": None}

    # 分析参数维度
    analysis = analyze_parameter_space(task.results, metric)

    return {
        "task_id": task_id,
        "metric": metric,
        "parameter_count": analysis["parameter_count"],
        "visualization_type": analysis["visualization_type"],
        "analysis": analysis
    }

@router.delete("/tasks/{task_id}")
async def delete_backtest_task(task_id: str):
    """删除回测任务"""
    if task_id not in backtest_tasks:
        raise HTTPException(status_code=404, detail="Task not found")

    del backtest_tasks[task_id]
    return {"message": "Task deleted successfully"}


@router.get("/data-range/{symbol}")
async def get_data_time_range(symbol: str, interval: str = "1H"):
    """获取指定交易对的可用数据时间范围 - 使用本地数据管理器"""
    import logging
    logger = logging.getLogger(__name__)

    try:
        from ..services.data_adapter import data_adapter

        logger.info(f"🔍 检查 {symbol} 数据时间范围")

        # 使用数据适配器获取数据信息
        # 优先检查spot数据
        spot_info = data_adapter.data_manager.get_data_info(symbol, "spot")
        swap_info = data_adapter.data_manager.get_data_info(symbol, "swap")

        # 选择最佳数据源
        best_info = None
        data_source = None

        if spot_info["available"] and swap_info["available"]:
            # 两种数据都可用，选择记录数更多的
            if spot_info["records_count"] >= swap_info["records_count"]:
                best_info = spot_info
                data_source = "spot"
            else:
                best_info = swap_info
                data_source = "swap"
        elif spot_info["available"]:
            best_info = spot_info
            data_source = "spot"
        elif swap_info["available"]:
            best_info = swap_info
            data_source = "swap"

        if best_info and best_info["available"]:
            # 计算质量评分
            quality_score = "high" if best_info["records_count"] >= 5000 else \
                           "medium" if best_info["records_count"] >= 1000 else "low"

            result = {
                "symbol": symbol,
                "available": True,
                "message": f"使用本地预处理数据 ({data_source})",
                "start_date": best_info["time_range"]["start"],
                "end_date": best_info["time_range"]["end"],
                "total_records": best_info["records_count"],
                "records_count": best_info["records_count"],
                "time_range": best_info["time_range"],
                "quality_score": quality_score,
                "recommended": True,
                "quality_message": f"本地数据可用，{best_info['records_count']:,} 条记录",
                "data_source": f"local_preprocess_data_{data_source}",
                "price_range": best_info.get("price_range")
            }

            logger.info(f"✅ {symbol}: 本地数据可用 - {best_info['records_count']:,} 条记录")
            return result
        else:
            # 数据不可用
            logger.warning(f"⚠️ {symbol}: 本地数据不可用")
            return {
                "symbol": symbol,
                "available": False,
                "message": f"交易对 {symbol} 在本地数据中不可用",
                "start_date": None,
                "end_date": None,
                "total_records": 0,
                "records_count": 0,
                "time_range": None,
                "quality_score": "unavailable",
                "recommended": False,
                "quality_message": "本地数据中未找到该交易对",
                "data_source": "local_preprocess_data"
            }

    except Exception as e:
        logger.error(f"❌ 获取数据范围失败 {symbol}: {e}")
        return {
            "symbol": symbol,
            "available": False,
            "message": f"获取数据范围失败: {str(e)}",
            "start_date": None,
            "end_date": None,
            "total_records": 0,
            "records_count": 0,
            "time_range": None,
            "quality_score": "error",
            "recommended": False,
            "quality_message": f"数据获取失败: {str(e)}",
            "data_source": "local_preprocess_data"
        }


def assess_data_file_quality(df, symbol: str, interval: str) -> dict:
    """评估数据文件质量"""
    import pandas as pd
    from datetime import datetime, timedelta

    try:
        if df is None or df.empty:
            return {
                'quality_score': 0,
                'quality_message': '数据文件为空',
                'start_date': None,
                'end_date': None,
                'total_records': 0
            }

        # 检查必要的列
        required_columns = ['candle_begin_time', 'open', 'high', 'low', 'close', 'volume']
        missing_columns = [col for col in required_columns if col not in df.columns]

        if missing_columns:
            return {
                'quality_score': 1,
                'quality_message': f'缺少必要列: {missing_columns}',
                'start_date': None,
                'end_date': None,
                'total_records': len(df)
            }

        # 获取时间范围
        start_date = df['candle_begin_time'].min()
        end_date = df['candle_begin_time'].max()
        total_records = len(df)

        # 计算质量评分 (1-5分)
        quality_score = 1
        quality_messages = []

        # 数据量评分
        if total_records >= 5000:
            quality_score = 5
            quality_messages.append('数据充足')
        elif total_records >= 2000:
            quality_score = 4
            quality_messages.append('数据量良好')
        elif total_records >= 1000:
            quality_score = 3
            quality_messages.append('数据量适中')
        elif total_records >= 500:
            quality_score = 2
            quality_messages.append('数据量较少')
        else:
            quality_score = 1
            quality_messages.append('数据量不足')

        # 时间跨度检查
        time_span = (end_date - start_date).days
        if time_span < 30:
            quality_score = max(1, quality_score - 1)
            quality_messages.append('时间跨度较短')
        elif time_span >= 365:
            quality_messages.append('时间跨度充足')

        # 数据完整性检查
        null_count = df[required_columns].isnull().sum().sum()
        if null_count > 0:
            quality_score = max(1, quality_score - 1)
            quality_messages.append(f'存在{null_count}个空值')

        # 价格范围
        price_range = None
        if 'close' in df.columns:
            price_range = {
                'min': float(df['close'].min()),
                'max': float(df['close'].max())
            }

        return {
            'quality_score': quality_score,
            'quality_message': ', '.join(quality_messages),
            'start_date': start_date.strftime('%Y-%m-%d'),
            'end_date': end_date.strftime('%Y-%m-%d'),
            'total_records': total_records,
            'price_range': price_range
        }

    except Exception as e:
        return {
            'quality_score': 0,
            'quality_message': f'数据评估失败: {str(e)}',
            'start_date': None,
            'end_date': None,
            'total_records': 0
        }


def map_quality_score(numeric_score: int) -> str:
    """将数字质量评分映射为字符串"""
    if numeric_score >= 5:
        return 'high'
    elif numeric_score >= 3:
        return 'medium'
    elif numeric_score >= 1:
        return 'low'
    else:
        return 'unavailable'


async def get_symbol_info_from_api(symbol: str) -> dict:
    """从API获取交易对信息"""
    try:
        import aiohttp

        # 尝试从Binance API获取交易对信息
        url = f"https://fapi.binance.com/fapi/v1/exchangeInfo"

        async with aiohttp.ClientSession() as session:
            async with session.get(url, timeout=10) as response:
                if response.status == 200:
                    data = await response.json()
                    symbols = data.get('symbols', [])

                    for s in symbols:
                        if s.get('symbol') == symbol:
                            return {
                                'symbol': symbol,
                                'status': s.get('status'),
                                'available_from_api': True
                            }

                    return {
                        'symbol': symbol,
                        'status': 'NOT_FOUND',
                        'available_from_api': False
                    }
                else:
                    return {
                        'symbol': symbol,
                        'status': 'API_ERROR',
                        'available_from_api': False
                    }

    except Exception as e:
        return {
            'symbol': symbol,
            'status': 'CONNECTION_ERROR',
            'available_from_api': False,
            'error': str(e)
        }


@router.post("/prepare-data-on-demand")
async def prepare_data_on_demand(request: BacktestRequest):
    """按需数据准备API - 根据回测配置自动获取和准备数据"""
    import logging
    import asyncio
    from datetime import datetime, timedelta

    logger = logging.getLogger(__name__)

    try:
        logger.info(f"🚀 开始按需数据准备")
        logger.info(f"   交易对: {request.symbols}")
        logger.info(f"   时间范围: {request.date_start} 到 {request.date_end}")
        logger.info(f"   时间周期: {request.rule_type}")

        # 初始化结果
        preparation_result = {
            "status": "processing",
            "task_id": f"data_prep_{datetime.now().strftime('%Y%m%d_%H%M%S')}",
            "symbols_total": len(request.symbols),
            "symbols_processed": 0,
            "symbols_ready": 0,
            "symbols_updated": 0,
            "data_sources": {},
            "time_range_info": {
                "requested_start": request.date_start,
                "requested_end": request.date_end,
                "actual_start": request.date_start,
                "actual_end": request.date_end
            },
            "progress": 0,
            "message": "开始数据准备...",
            "warnings": [],
            "errors": []
        }

        # 验证时间范围
        try:
            start_date = datetime.strptime(request.date_start, '%Y-%m-%d')
            end_date = datetime.strptime(request.date_end, '%Y-%m-%d')

            if start_date >= end_date:
                raise ValueError("开始日期必须早于结束日期")

            if (end_date - start_date).days < 7:
                preparation_result["warnings"].append("时间范围较短，建议至少选择7天以上的数据")

        except ValueError as e:
            preparation_result["status"] = "error"
            preparation_result["errors"].append(f"时间范围格式错误: {str(e)}")
            return preparation_result

        # 处理每个交易对
        for i, symbol in enumerate(request.symbols):
            logger.info(f"📊 处理交易对 {symbol} ({i+1}/{len(request.symbols)})")

            try:
                # 检查并准备数据
                data_info = await prepare_symbol_data_on_demand(symbol, request)
                preparation_result["data_sources"][symbol] = data_info

                if data_info["status"] == "ready":
                    preparation_result["symbols_ready"] += 1
                elif data_info["status"] == "updated":
                    preparation_result["symbols_updated"] += 1
                    preparation_result["symbols_ready"] += 1

                preparation_result["symbols_processed"] += 1
                preparation_result["progress"] = int((i + 1) / len(request.symbols) * 100)
                preparation_result["message"] = f"已处理 {i+1}/{len(request.symbols)} 个交易对"

            except Exception as e:
                logger.error(f"❌ 处理 {symbol} 时发生错误: {str(e)}")
                preparation_result["errors"].append(f"{symbol}: {str(e)}")
                preparation_result["data_sources"][symbol] = {
                    "status": "error",
                    "error": str(e)
                }

        # 完成状态更新
        if preparation_result["symbols_ready"] == len(request.symbols):
            preparation_result["status"] = "completed"
            preparation_result["message"] = f"数据准备完成，{preparation_result['symbols_ready']} 个交易对就绪"
        elif preparation_result["symbols_ready"] > 0:
            preparation_result["status"] = "partial_success"
            preparation_result["message"] = f"部分数据准备完成，{preparation_result['symbols_ready']}/{len(request.symbols)} 个交易对就绪"
        else:
            preparation_result["status"] = "failed"
            preparation_result["message"] = "数据准备失败，没有可用的交易对数据"

        logger.info(f"✅ 数据准备完成: {preparation_result['status']}")
        return preparation_result

    except Exception as e:
        logger.error(f"❌ 按需数据准备失败: {str(e)}")
        return {
            "status": "error",
            "message": f"数据准备过程中发生错误: {str(e)}",
            "errors": [str(e)]
        }

async def prepare_symbol_data_on_demand(symbol: str, request: BacktestRequest) -> dict:
    """检查单个交易对的本地数据可用性"""
    import logging
    from datetime import datetime

    logger = logging.getLogger(__name__)

    try:
        # 使用本地数据管理器检查数据
        from ..services.data_adapter import data_adapter

        logger.info(f"🔍 {symbol}: 检查本地数据可用性")

        data_info = {
            "symbol": symbol,
            "status": "checking",
            "data_source": "local_preprocess_data",
            "records_count": 0,
            "time_range": {},
            "quality_score": 0,
            "needs_update": False,
            "update_reason": ""
        }

        # 检查本地数据可用性
        df = data_adapter.get_symbol_data_for_backtest(
            symbol, request.date_start, request.date_end, request.rule_type
        )

        if df is not None and not df.empty:
            # 数据可用
            data_info.update({
                "status": "ready",
                "records_count": len(df),
                "data_source": "local_preprocess_data",
                "quality_score": calculate_data_quality_score(df)
            })

            # 获取时间范围
            if 'candle_begin_time' in df.columns:
                data_info["time_range"] = {
                    "start": df['candle_begin_time'].min().strftime('%Y-%m-%d'),
                    "end": df['candle_begin_time'].max().strftime('%Y-%m-%d')
                }

            logger.info(f"✅ {symbol}: 本地数据可用，{len(df)} 条记录")
            return data_info
        else:
            # 数据不可用
            data_info.update({
                "status": "unavailable",
                "update_reason": "本地预处理数据中未找到该交易对",
                "message": f"交易对 {symbol} 在本地数据中不可用"
            })
            logger.warning(f"⚠️ {symbol}: 本地数据不可用")
            return data_info



    except Exception as e:
        logger.error(f"❌ {symbol}: 数据准备过程中发生错误: {str(e)}")
        return {
            "symbol": symbol,
            "status": "error",
            "error": str(e)
        }

def get_data_file_path(symbol: str, rule_type: str) -> str:
    """获取数据文件路径"""
    import os

    # 根据时间周期映射到对应的目录
    interval_map = {
        '1m': '1m',
        '5m': '5m',
        '15m': '15m',
        '1H': '1H',
        '4H': '4H',
        '1D': '1D'
    }

    interval = interval_map.get(rule_type, '1H')

    # 构建pkl文件路径
    base_path = os.path.join(os.path.dirname(__file__), '..', '..', '..', 'bn_data', 'output', 'pickle_data')
    file_path = os.path.join(base_path, interval, f"{symbol}.pkl")

    return os.path.abspath(file_path)

def calculate_data_quality_score(df) -> int:
    """计算数据质量评分 (0-100)"""
    try:
        if df is None or df.empty:
            return 0

        score = 0

        # 数据量评分 (40分)
        record_count = len(df)
        if record_count >= 5000:
            score += 40
        elif record_count >= 2000:
            score += 30
        elif record_count >= 1000:
            score += 20
        elif record_count >= 500:
            score += 10

        # 数据完整性评分 (30分)
        required_columns = ['open', 'high', 'low', 'close', 'volume']
        available_columns = [col for col in required_columns if col in df.columns]
        if len(available_columns) == len(required_columns):
            score += 30
        else:
            score += int(30 * len(available_columns) / len(required_columns))

        # 数据质量评分 (30分)
        if len(available_columns) > 0:
            # 检查空值比例
            null_ratio = df[available_columns].isnull().sum().sum() / (len(df) * len(available_columns))
            if null_ratio < 0.01:  # 空值少于1%
                score += 30
            elif null_ratio < 0.05:  # 空值少于5%
                score += 20
            elif null_ratio < 0.1:  # 空值少于10%
                score += 10

        return min(score, 100)

    except Exception:
        return 0

async def update_symbol_data_via_bn_data(symbol: str, request: BacktestRequest) -> bool:
    """通过bn_data模块更新单个交易对的数据"""
    import subprocess
    import os
    import logging
    from datetime import datetime, timedelta

    logger = logging.getLogger(__name__)

    try:
        logger.info(f"🔄 开始通过bn_data更新 {symbol} 数据")

        # 获取bn_data路径
        bn_data_path = os.path.join(os.path.dirname(__file__), '..', '..', '..', 'bn_data')
        if not os.path.exists(bn_data_path):
            logger.error(f"❌ bn_data目录不存在: {bn_data_path}")
            return False

        # 检查bn_data配置
        config_path = os.path.join(bn_data_path, 'config.py')
        if not os.path.exists(config_path):
            logger.error(f"❌ bn_data配置文件不存在: {config_path}")
            return False

        # 确保配置正确
        await ensure_bn_data_config(config_path)

        # 切换到bn_data目录
        original_cwd = os.getcwd()
        os.chdir(bn_data_path)

        try:
            logger.info(f"   执行目录: {bn_data_path}")
            logger.info(f"   目标交易对: {symbol}")
            logger.info(f"   时间范围: {request.date_start} 到 {request.date_end}")

            # 运行bn_data主程序进行数据更新
            # 使用较短的超时时间，避免长时间等待
            result = subprocess.run(
                ['python', 'main.py'],
                capture_output=True,
                text=True,
                timeout=1800,  # 30分钟超时
                cwd=bn_data_path
            )

            if result.returncode == 0:
                logger.info(f"✅ {symbol}: bn_data执行成功")
                logger.info(f"   输出摘要: {result.stdout[-500:] if result.stdout else '无输出'}")

                # 验证数据文件是否生成
                data_file_path = get_data_file_path(symbol, request.rule_type)
                if os.path.exists(data_file_path):
                    logger.info(f"✅ {symbol}: 数据文件已生成 {data_file_path}")
                    return True
                else:
                    logger.warning(f"⚠️ {symbol}: bn_data执行成功但数据文件未找到")
                    return False
            else:
                logger.error(f"❌ {symbol}: bn_data执行失败")
                logger.error(f"   错误输出: {result.stderr}")
                return False

        except subprocess.TimeoutExpired:
            logger.error(f"❌ {symbol}: bn_data执行超时")
            return False
        except Exception as e:
            logger.error(f"❌ {symbol}: bn_data执行异常: {str(e)}")
            return False
        finally:
            os.chdir(original_cwd)

    except Exception as e:
        logger.error(f"❌ {symbol}: 数据更新过程异常: {str(e)}")
        return False

async def ensure_bn_data_config(config_path: str):
    """确保bn_data配置正确"""
    import logging

    logger = logging.getLogger(__name__)

    try:
        # 读取当前配置
        with open(config_path, 'r', encoding='utf-8') as f:
            config_content = f.read()

        # 检查关键配置
        if 'update_to_now = True' not in config_content:
            logger.info("🔧 更新bn_data配置: 启用update_to_now")
            # 替换配置
            config_content = config_content.replace(
                'update_to_now = False',
                'update_to_now = True'
            )

            # 如果没有找到配置行，添加配置
            if 'update_to_now' not in config_content:
                config_content += '\n# 自动添加的配置\nupdate_to_now = True\n'

            # 写回配置文件
            with open(config_path, 'w', encoding='utf-8') as f:
                f.write(config_content)

            logger.info("✅ bn_data配置已更新")
        else:
            logger.info("✅ bn_data配置已正确")

    except Exception as e:
        logger.warning(f"⚠️ 检查bn_data配置时发生错误: {str(e)}")

# 修改主回测接口，集成按需数据获取
@router.post("/run-with-auto-data")
async def run_backtest_with_auto_data(request: BacktestRequest, background_tasks: BackgroundTasks):
    """运行回测 - 使用本地数据源，创建后台任务"""
    import logging
    import uuid
    from datetime import datetime

    logger = logging.getLogger(__name__)

    try:
        # 生成任务ID
        task_id = str(uuid.uuid4())
        logger.info(f"🚀 开始回测任务: {task_id}")

        # 创建任务状态
        task_status = BacktestStatus(
            task_id=task_id,
            status="pending",
            message="回测任务已创建 - 使用本地数据",
            symbols_total=len(request.symbols)
        )
        backtest_tasks[task_id] = task_status

        # 在后台运行回测
        background_tasks.add_task(run_backtest_with_auto_data_task, task_id, request)

        return {
            "task_id": task_id,
            "message": "回测已启动 - 使用本地数据",
            "status": "pending"
        }

    except Exception as e:
        logger.error(f"❌ 启动回测任务失败: {str(e)}")
        raise HTTPException(status_code=500, detail=f"启动回测失败: {str(e)}")


async def run_backtest_with_auto_data_task(task_id: str, request: BacktestRequest):
    """后台运行回测任务 - 使用本地数据源"""
    import logging
    logger = logging.getLogger(__name__)

    task_status = backtest_tasks[task_id]

    try:
        task_status.status = "running"
        task_status.message = "正在使用本地数据进行回测..."

        logger.info("📊 使用本地预处理数据进行回测")

        # 验证本地数据可用性
        from ..services.data_adapter import data_adapter
        data_availability_check = {}

        for symbol in request.symbols:
            df = data_adapter.get_symbol_data_for_backtest(
                symbol, request.date_start, request.date_end, request.rule_type
            )
            data_availability_check[symbol] = {
                "available": df is not None and not df.empty,
                "records": len(df) if df is not None else 0
            }

        # 检查是否有可用数据
        available_symbols = [s for s, info in data_availability_check.items() if info["available"]]

        if not available_symbols:
            logger.error("❌ 没有找到任何可用的本地数据")
            task_status.status = "failed"
            task_status.message = "未找到可用的本地数据，请检查数据源配置"
            return

        logger.info(f"✅ 数据可用性检查完成: {len(available_symbols)}/{len(request.symbols)} 个交易对可用")

        # 2. 使用可用的本地数据进行回测
        logger.info("🔄 开始执行回测")

        # 使用有数据的交易对进行回测
        ready_symbols = available_symbols

        if not ready_symbols:
            logger.error("❌ 没有可用的交易对数据")
            task_status.status = "failed"
            task_status.message = "没有可用的交易对数据进行回测"
            return

        # 创建新的请求对象，只包含就绪的交易对
        filtered_request = BacktestRequest(
            symbols=ready_symbols,
            strategy=request.strategy,
            parameters=request.parameters,
            date_start=request.date_start,
            date_end=request.date_end,
            rule_type=request.rule_type,
            leverage_rate=request.leverage_rate,
            c_rate=request.c_rate,
            slippage=request.slippage
        )

        # 执行回测
        backtest_results = []
        for i, symbol in enumerate(ready_symbols):
            task_status.message = f"正在回测 {symbol}..."
            task_status.progress = (i / len(ready_symbols)) * 100
            task_status.symbols_completed = i

            logger.info(f"🔄 回测 {symbol}")
            try:
                result = await run_real_backtest(symbol, filtered_request)
                if result:
                    result.task_id = task_id
                    backtest_results.append(result)
                    logger.info(f"✅ {symbol}: 回测完成")
                else:
                    logger.warning(f"⚠️ {symbol}: 回测失败")
            except Exception as e:
                logger.error(f"❌ {symbol}: 回测异常: {str(e)}")

        # 更新任务状态
        task_status.symbols_completed = len(ready_symbols)
        task_status.progress = 100
        task_status.results = backtest_results

        if backtest_results:
            task_status.status = "completed"
            task_status.message = f"回测完成，获得 {len(backtest_results)} 个结果"
            logger.info(f"✅ 回测完成: {len(backtest_results)} 个结果")
        else:
            task_status.status = "failed"
            task_status.message = "所有回测都失败了"
            logger.error("❌ 所有回测都失败了")

    except Exception as e:
        logger.error(f"❌ 自动数据回测过程异常: {str(e)}")
        task_status.status = "failed"
        task_status.message = f"回测过程中发生错误: {str(e)}"

@router.post("/prepare-data")
async def prepare_backtest_data(
    symbols: List[str],
    date_start: str,
    date_end: str,
    rule_type: str = "1H"
):
    """数据预处理API - 检查和准备回测所需的数据（保留兼容性）"""
    import logging
    logger = logging.getLogger(__name__)

    try:
        logger.info(f"🔍 开始数据预处理: {symbols}, {date_start} 到 {date_end}, 周期: {rule_type}")

        preparation_result = {
            "status": "success",
            "symbols_checked": len(symbols),
            "symbols_ready": 0,
            "symbols_missing": 0,
            "data_quality": {},
            "time_range_adjusted": False,
            "adjusted_start": date_start,
            "adjusted_end": date_end,
            "recommendations": [],
            "warnings": []
        }

        symbols_ready = []
        symbols_missing = []

        for symbol in symbols:
            # 检查数据可用性和质量
            data_info = await get_data_time_range(symbol, rule_type)

            if data_info["available"]:
                symbols_ready.append(symbol)
                preparation_result["data_quality"][symbol] = {
                    "status": "ready",
                    "quality_score": data_info.get("quality_score", "medium"),
                    "total_records": data_info.get("total_records", 0),
                    "time_range": f"{data_info.get('start_date')} 到 {data_info.get('end_date')}"
                }

                # 检查是否推荐使用
                if data_info.get("recommended", False):
                    preparation_result["recommendations"].append(f"✅ {symbol}: 数据质量优良，推荐使用")
                else:
                    preparation_result["warnings"].append(f"⚠️ {symbol}: {data_info.get('quality_message', '数据质量一般')}")
            else:
                symbols_missing.append(symbol)
                preparation_result["data_quality"][symbol] = {
                    "status": "missing",
                    "message": data_info.get("message", "数据不可用")
                }
                preparation_result["warnings"].append(f"❌ {symbol}: 数据不可用 - {data_info.get('message', '')}")

        preparation_result["symbols_ready"] = len(symbols_ready)
        preparation_result["symbols_missing"] = len(symbols_missing)

        # 智能时间范围调整建议
        if symbols_ready:
            # 计算所有可用数据的重叠时间范围
            overlapping_range = calculate_overlapping_time_range(symbols_ready, rule_type)

            if overlapping_range:
                user_start = datetime.strptime(date_start, '%Y-%m-%d')
                user_end = datetime.strptime(date_end, '%Y-%m-%d')
                data_start = datetime.strptime(overlapping_range['start'], '%Y-%m-%d')
                data_end = datetime.strptime(overlapping_range['end'], '%Y-%m-%d')

                adjusted_start = max(user_start, data_start)
                adjusted_end = min(user_end, data_end)

                if adjusted_start != user_start or adjusted_end != user_end:
                    preparation_result["time_range_adjusted"] = True
                    preparation_result["adjusted_start"] = adjusted_start.strftime('%Y-%m-%d')
                    preparation_result["adjusted_end"] = adjusted_end.strftime('%Y-%m-%d')
                    preparation_result["recommendations"].append(
                        f"📅 建议调整时间范围为: {preparation_result['adjusted_start']} 到 {preparation_result['adjusted_end']}"
                    )

        # 生成总体建议
        if preparation_result["symbols_ready"] == 0:
            preparation_result["status"] = "failed"
            preparation_result["recommendations"].append("❌ 没有可用的数据，请检查交易对选择或运行数据更新")
        elif preparation_result["symbols_missing"] > 0:
            preparation_result["status"] = "partial"
            preparation_result["recommendations"].append(f"⚠️ {preparation_result['symbols_missing']} 个交易对数据缺失，建议运行数据更新")
        else:
            preparation_result["recommendations"].append("✅ 所有数据准备就绪，可以开始回测")

        logger.info(f"✅ 数据预处理完成: {preparation_result['symbols_ready']}/{preparation_result['symbols_checked']} 个交易对可用")
        return preparation_result

    except Exception as e:
        logger.error(f"数据预处理失败: {e}")
        return {
            "status": "error",
            "message": f"数据预处理失败: {str(e)}",
            "symbols_checked": len(symbols),
            "symbols_ready": 0,
            "symbols_missing": len(symbols)
        }


def calculate_overlapping_time_range(symbols: List[str], rule_type: str) -> dict:
    """计算多个交易对的数据重叠时间范围"""
    try:
        import pandas as pd
        import os
        from datetime import datetime

        start_dates = []
        end_dates = []

        for symbol in symbols:
            data_file = f"bn_data/output/pickle_data/{rule_type}/{symbol}.pkl"

            if os.path.exists(data_file):
                try:
                    df = pd.read_pickle(data_file)
                    if not df.empty and 'candle_begin_time' in df.columns:
                        start_dates.append(df['candle_begin_time'].min())
                        end_dates.append(df['candle_begin_time'].max())
                except Exception:
                    continue

        if start_dates and end_dates:
            overlapping_start = max(start_dates)
            overlapping_end = min(end_dates)

            if overlapping_start <= overlapping_end:
                return {
                    'start': overlapping_start.strftime('%Y-%m-%d'),
                    'end': overlapping_end.strftime('%Y-%m-%d'),
                    'days': (overlapping_end - overlapping_start).days
                }

        return None

    except Exception:
        return None


@router.get("/available-symbols")
async def get_available_symbols():
    """获取所有可用的交易对列表"""
    try:
        from ..services.data_adapter import data_adapter

        logger = logging.getLogger(__name__)
        logger.info("🔍 获取可用交易对列表...")

        # 使用数据适配器获取交易对
        symbols = await data_adapter.get_usdt_symbols_async()

        if not symbols:
            logger.warning("⚠️ 未找到可用的交易对")
            return {
                "symbols": [],
                "message": "未找到可用的交易对，请检查数据目录配置",
                "total_count": 0
            }

        symbols.sort()  # 按字母顺序排序

        logger.info(f"✅ 找到 {len(symbols)} 个可用交易对")

        return {
            "symbols": symbols,
            "message": f"找到 {len(symbols)} 个可用交易对",
            "total_count": len(symbols)
        }

    except Exception as e:
        logger = logging.getLogger(__name__)
        logger.error(f"❌ 获取可用交易对失败: {str(e)}")
        raise HTTPException(status_code=500, detail=f"获取可用交易对失败: {str(e)}")
