"""
本地数据管理器
负责管理本地预处理的加密货币数据
"""
import os
import pickle
import pandas as pd
from typing import Dict, List, Optional, Tuple
from datetime import datetime, timedelta
import logging

logger = logging.getLogger(__name__)

class LocalDataManager:
    """本地数据管理器"""

    def __init__(self, data_dir: Optional[str] = None):
        """
        初始化本地数据管理器

        Args:
            data_dir: 本地数据目录路径
        """
        if data_dir is None:
            # 直接使用您指定的数据目录
            data_dir = "/Users/lishechuan/Downloads/FLDownload/coin-binance-spot-swap-preprocess-pkl-1h"

            if not os.path.exists(data_dir):
                logger.error(f"❌ 指定的数据目录不存在: {data_dir}")
                raise ValueError(f"数据目录不存在: {data_dir}")

            logger.info(f"✅ 使用数据目录: {data_dir}")

        self.data_dir = data_dir
        self.spot_data: Optional[Dict] = None
        self.swap_data: Optional[Dict] = None
        self._data_loaded = False

        # 创建数据目录（如果不存在）
        if not os.path.exists(data_dir):
            logger.warning(f"⚠️ 数据目录不存在，将创建: {data_dir}")
            os.makedirs(data_dir, exist_ok=True)

        logger.info(f"✅ 初始化本地数据管理器，数据目录: {data_dir}")

    def _load_data(self) -> None:
        """加载数据文件"""
        if self._data_loaded:
            return

        try:
            logger.info("🔄 开始加载本地数据文件...")

            # 加载spot数据
            spot_file = os.path.join(self.data_dir, "spot_dict.pkl")
            if os.path.exists(spot_file):
                logger.info("📊 加载spot数据...")
                with open(spot_file, 'rb') as f:
                    self.spot_data = pickle.load(f)
                logger.info(f"✅ spot数据加载完成，包含 {len(self.spot_data)} 个交易对")
            else:
                logger.warning(f"⚠️ spot数据文件不存在: {spot_file}")
                self.spot_data = {}

            # 加载swap数据
            swap_file = os.path.join(self.data_dir, "swap_dict.pkl")
            if os.path.exists(swap_file):
                logger.info("📊 加载swap数据...")
                with open(swap_file, 'rb') as f:
                    self.swap_data = pickle.load(f)
                logger.info(f"✅ swap数据加载完成，包含 {len(self.swap_data)} 个交易对")
            else:
                logger.warning(f"⚠️ swap数据文件不存在: {swap_file}")
                self.swap_data = {}

            self._data_loaded = True

            # 检查是否有任何数据
            total_symbols = len(self.spot_data) + len(self.swap_data)
            if total_symbols == 0:
                logger.warning("⚠️ 没有找到任何本地数据文件")
                logger.warning(f"   请确保数据文件存在于: {self.data_dir}")
                logger.warning("   需要的文件: spot_dict.pkl 和/或 swap_dict.pkl")
            else:
                logger.info(f"🎉 数据文件加载完成，共 {total_symbols} 个交易对")

        except Exception as e:
            logger.error(f"❌ 加载数据文件失败: {e}")
            self.spot_data = {}
            self.swap_data = {}
            self._data_loaded = True

    def get_available_symbols(self, market_type: str = "all") -> List[str]:
        """
        获取可用的交易对列表

        Args:
            market_type: 市场类型 ("spot", "swap", "all")

        Returns:
            交易对列表
        """
        self._load_data()

        symbols = set()

        if market_type in ["spot", "all"] and self.spot_data:
            symbols.update(self.spot_data.keys())

        if market_type in ["swap", "all"] and self.swap_data:
            symbols.update(self.swap_data.keys())

        # 转换为标准格式（移除连字符）
        standard_symbols = []
        for symbol in symbols:
            standard_symbol = symbol.replace("-", "")
            standard_symbols.append(standard_symbol)

        return sorted(list(set(standard_symbols)))

    def get_symbol_data(self, symbol: str, market_type: str = "spot",
                       start_date: Optional[str] = None,
                       end_date: Optional[str] = None) -> Optional[pd.DataFrame]:
        """
        获取指定交易对的数据

        Args:
            symbol: 交易对名称（如 BTCUSDT）
            market_type: 市场类型 ("spot" 或 "swap")
            start_date: 开始日期 (YYYY-MM-DD)
            end_date: 结束日期 (YYYY-MM-DD)

        Returns:
            DataFrame 或 None
        """
        self._load_data()

        # 转换为本地数据格式（添加连字符）
        local_symbol = self._convert_to_local_format(symbol)

        # 选择数据源
        data_dict = self.spot_data if market_type == "spot" else self.swap_data

        if not data_dict or local_symbol not in data_dict:
            logger.warning(f"⚠️ 未找到交易对数据: {local_symbol} ({market_type})")
            return None

        df = data_dict[local_symbol].copy()

        # 数据清洗和标准化
        df = self._standardize_dataframe(df, symbol)

        # 时间范围筛选
        if start_date or end_date:
            df = self._filter_by_date_range(df, start_date, end_date)

        return df

    def _convert_to_local_format(self, symbol: str) -> str:
        """
        将标准格式交易对转换为本地格式
        BTCUSDT -> BTC-USDT
        """
        if "-" in symbol:
            return symbol

        # 常见的基础货币
        base_currencies = ["BTC", "ETH", "BNB", "ADA", "SOL", "DOT", "LINK", "UNI", "AVAX", "MATIC"]

        for base in base_currencies:
            if symbol.startswith(base) and symbol.endswith("USDT"):
                return f"{base}-USDT"

        # 处理其他情况，尝试智能分割
        if symbol.endswith("USDT"):
            base = symbol[:-4]
            return f"{base}-USDT"

        return symbol

    def _standardize_dataframe(self, df: pd.DataFrame, symbol: str) -> pd.DataFrame:
        """
        标准化DataFrame格式，使其与回测引擎兼容
        """
        # 确保必要的列存在
        required_columns = ['candle_begin_time', 'open', 'high', 'low', 'close', 'volume']

        for col in required_columns:
            if col not in df.columns:
                logger.error(f"❌ 缺少必要列: {col}")
                return pd.DataFrame()

        # 移除无效数据
        df = df.dropna(subset=['open', 'high', 'low', 'close'])

        # 确保时间列格式正确
        if df['candle_begin_time'].dtype != 'datetime64[ns]':
            df['candle_begin_time'] = pd.to_datetime(df['candle_begin_time'])

        # 按时间排序
        df = df.sort_values('candle_begin_time').reset_index(drop=True)

        # 添加symbol列（如果不存在）
        if 'symbol' not in df.columns:
            df['symbol'] = symbol

        logger.info(f"📊 {symbol}: 标准化后数据 {len(df)} 条记录")

        return df

    def _filter_by_date_range(self, df: pd.DataFrame, start_date: Optional[str],
                             end_date: Optional[str]) -> pd.DataFrame:
        """
        按日期范围筛选数据
        """
        if df.empty:
            return df

        if start_date:
            start_dt = pd.to_datetime(start_date)
            df = df[df['candle_begin_time'] >= start_dt]

        if end_date:
            end_dt = pd.to_datetime(end_date) + timedelta(days=1)  # 包含结束日期
            df = df[df['candle_begin_time'] < end_dt]

        return df.reset_index(drop=True)

    def get_data_info(self, symbol: str, market_type: str = "spot") -> Dict:
        """
        获取数据信息

        Args:
            symbol: 交易对名称
            market_type: 市场类型

        Returns:
            数据信息字典
        """
        df = self.get_symbol_data(symbol, market_type)

        if df is None or df.empty:
            return {
                "available": False,
                "symbol": symbol,
                "market_type": market_type,
                "records_count": 0,
                "time_range": None,
                "data_source": "local_file"
            }

        valid_data = df.dropna(subset=['close'])

        return {
            "available": True,
            "symbol": symbol,
            "market_type": market_type,
            "records_count": len(valid_data),
            "time_range": {
                "start": valid_data['candle_begin_time'].min().strftime('%Y-%m-%d'),
                "end": valid_data['candle_begin_time'].max().strftime('%Y-%m-%d')
            },
            "data_source": "local_file",
            "price_range": {
                "min": float(valid_data['close'].min()),
                "max": float(valid_data['close'].max()),
                "avg": float(valid_data['close'].mean())
            } if len(valid_data) > 0 else None
        }


    def check_data_availability(self, symbols: List[str], start_date: str,
                               end_date: str, min_records: int = 1000) -> Dict:
        """
        检查多个交易对的数据可用性

        Args:
            symbols: 交易对列表
            start_date: 开始日期
            end_date: 结束日期
            min_records: 最小记录数要求

        Returns:
            可用性检查结果
        """
        self._load_data()

        results = {
            "total_symbols": len(symbols),
            "available_symbols": [],
            "unavailable_symbols": [],
            "data_quality": {},
            "recommendations": []
        }

        for symbol in symbols:
            # 优先检查spot数据
            df = self.get_symbol_data(symbol, "spot", start_date, end_date)

            if df is None or df.empty:
                # 尝试swap数据
                df = self.get_symbol_data(symbol, "swap", start_date, end_date)
                market_type = "swap"
            else:
                market_type = "spot"

            if df is None or df.empty:
                results["unavailable_symbols"].append(symbol)
                continue

            valid_records = len(df.dropna(subset=['close']))

            if valid_records >= min_records:
                results["available_symbols"].append(symbol)
                results["data_quality"][symbol] = {
                    "market_type": market_type,
                    "records": valid_records,
                    "quality": "good" if valid_records >= min_records * 1.5 else "acceptable"
                }
            else:
                results["unavailable_symbols"].append(symbol)
                results["data_quality"][symbol] = {
                    "market_type": market_type,
                    "records": valid_records,
                    "quality": "insufficient"
                }

        # 生成建议
        if results["unavailable_symbols"]:
            results["recommendations"].append(
                f"以下交易对数据不足: {', '.join(results['unavailable_symbols'][:5])}"
            )

        if len(results["available_symbols"]) < len(symbols) * 0.5:
            results["recommendations"].append("建议调整时间范围或选择其他交易对")

        return results

    def get_intelligent_time_range(self, symbols: List[str],
                                  requested_start: str, requested_end: str,
                                  min_records: int = 1000) -> Dict:
        """
        智能时间范围选择，自动调整到最佳可用数据范围

        Args:
            symbols: 交易对列表
            requested_start: 请求的开始时间
            requested_end: 请求的结束时间
            min_records: 最小记录数要求

        Returns:
            优化后的时间范围和数据可用性信息
        """
        self._load_data()

        # 收集所有交易对的数据范围
        symbol_ranges = {}
        for symbol in symbols:
            info = self.get_data_info(symbol, "spot")
            if not info["available"]:
                info = self.get_data_info(symbol, "swap")

            if info["available"]:
                symbol_ranges[symbol] = info["time_range"]

        if not symbol_ranges:
            return {
                "success": False,
                "message": "没有找到任何可用的数据",
                "suggested_range": None,
                "available_symbols": []
            }

        # 找到公共时间范围
        all_starts = [pd.to_datetime(r["start"]) for r in symbol_ranges.values()]
        all_ends = [pd.to_datetime(r["end"]) for r in symbol_ranges.values()]

        common_start = max(all_starts)
        common_end = min(all_ends)

        # 检查请求的时间范围是否合理
        requested_start_dt = pd.to_datetime(requested_start)
        requested_end_dt = pd.to_datetime(requested_end)

        # 调整时间范围
        adjusted_start = max(common_start, requested_start_dt)
        adjusted_end = min(common_end, requested_end_dt)

        # 确保有足够的数据
        if adjusted_end <= adjusted_start:
            adjusted_start = common_start
            adjusted_end = common_end

        # 验证调整后的范围
        final_symbols = []
        for symbol in symbols:
            df = self.get_symbol_data(
                symbol, "spot",
                adjusted_start.strftime('%Y-%m-%d'),
                adjusted_end.strftime('%Y-%m-%d')
            )
            if df is None or df.empty:
                df = self.get_symbol_data(
                    symbol, "swap",
                    adjusted_start.strftime('%Y-%m-%d'),
                    adjusted_end.strftime('%Y-%m-%d')
                )

            if df is not None and len(df) >= min_records:
                final_symbols.append(symbol)

        return {
            "success": len(final_symbols) > 0,
            "message": f"找到 {len(final_symbols)} 个交易对的有效数据",
            "requested_range": {
                "start": requested_start,
                "end": requested_end
            },
            "suggested_range": {
                "start": adjusted_start.strftime('%Y-%m-%d'),
                "end": adjusted_end.strftime('%Y-%m-%d')
            },
            "available_symbols": final_symbols,
            "unavailable_symbols": [s for s in symbols if s not in final_symbols],
            "data_coverage": len(final_symbols) / len(symbols) if symbols else 0
        }


# 全局实例
local_data_manager = LocalDataManager()
