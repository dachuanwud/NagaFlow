"""
数据适配器
提供统一的数据接口，保持与原有API的兼容性
"""
import pandas as pd
from typing import List, Dict, Optional, Tuple
import logging
from datetime import datetime

from .local_data_manager import local_data_manager

logger = logging.getLogger(__name__)

class DataAdapter:
    """数据适配器，提供统一的数据访问接口"""
    
    def __init__(self):
        """初始化数据适配器"""
        self.data_manager = local_data_manager
        logger.info("✅ 数据适配器初始化完成")
    
    async def get_usdt_symbols_async(self) -> List[str]:
        """
        异步获取USDT交易对列表
        兼容原有的bn_data接口
        
        Returns:
            USDT交易对列表
        """
        try:
            symbols = self.data_manager.get_available_symbols("all")
            # 过滤USDT交易对
            usdt_symbols = [s for s in symbols if s.endswith("USDT")]
            
            logger.info(f"📊 获取到 {len(usdt_symbols)} 个USDT交易对")
            return usdt_symbols
            
        except Exception as e:
            logger.error(f"❌ 获取USDT交易对失败: {e}")
            return []
    
    def spot_symbols_filter(self, symbols: List[str]) -> List[str]:
        """
        过滤现货交易对
        兼容原有的bn_data接口
        
        Args:
            symbols: 交易对列表
            
        Returns:
            过滤后的现货交易对列表
        """
        try:
            available_symbols = self.data_manager.get_available_symbols("spot")
            filtered = [s for s in symbols if s in available_symbols]
            
            logger.info(f"📊 从 {len(symbols)} 个交易对中过滤出 {len(filtered)} 个现货交易对")
            return filtered
            
        except Exception as e:
            logger.error(f"❌ 过滤现货交易对失败: {e}")
            return symbols  # 返回原列表作为备用
    
    def get_symbol_data_for_backtest(self, symbol: str, start_date: str, 
                                   end_date: str, interval: str = "1H") -> Optional[pd.DataFrame]:
        """
        获取回测用的交易对数据
        
        Args:
            symbol: 交易对名称
            start_date: 开始日期
            end_date: 结束日期
            interval: 时间间隔（目前只支持1H）
            
        Returns:
            DataFrame 或 None
        """
        try:
            # 优先尝试spot数据
            df = self.data_manager.get_symbol_data(symbol, "spot", start_date, end_date)
            
            if df is None or df.empty:
                # 尝试swap数据
                df = self.data_manager.get_symbol_data(symbol, "swap", start_date, end_date)
                logger.info(f"📊 {symbol}: 使用swap数据")
            else:
                logger.info(f"📊 {symbol}: 使用spot数据")
            
            if df is None or df.empty:
                logger.warning(f"⚠️ {symbol}: 未找到数据")
                return None
            
            # 确保数据格式符合回测引擎要求
            df = self._prepare_for_backtest(df, symbol)
            
            logger.info(f"✅ {symbol}: 获取到 {len(df)} 条回测数据")
            return df
            
        except Exception as e:
            logger.error(f"❌ {symbol}: 获取回测数据失败: {e}")
            return None
    
    def _prepare_for_backtest(self, df: pd.DataFrame, symbol: str) -> pd.DataFrame:
        """
        为回测准备数据格式
        
        Args:
            df: 原始数据
            symbol: 交易对名称
            
        Returns:
            处理后的DataFrame
        """
        # 确保必要的列存在
        required_columns = ['candle_begin_time', 'open', 'high', 'low', 'close', 'volume']
        
        for col in required_columns:
            if col not in df.columns:
                logger.error(f"❌ {symbol}: 缺少必要列 {col}")
                return pd.DataFrame()
        
        # 移除无效数据
        df = df.dropna(subset=['open', 'high', 'low', 'close']).copy()
        
        # 确保数据类型正确
        numeric_columns = ['open', 'high', 'low', 'close', 'volume']
        for col in numeric_columns:
            if col in df.columns:
                df[col] = pd.to_numeric(df[col], errors='coerce')
        
        # 确保时间列格式正确
        df['candle_begin_time'] = pd.to_datetime(df['candle_begin_time'])
        
        # 按时间排序
        df = df.sort_values('candle_begin_time').reset_index(drop=True)
        
        # 添加回测引擎需要的额外列
        if 'quote_volume' not in df.columns:
            df['quote_volume'] = df['volume'] * df['close']
        
        if 'trade_num' not in df.columns:
            df['trade_num'] = 0
        
        if 'taker_buy_base_asset_volume' not in df.columns:
            df['taker_buy_base_asset_volume'] = df['volume'] * 0.5
        
        if 'taker_buy_quote_asset_volume' not in df.columns:
            df['taker_buy_quote_asset_volume'] = df['quote_volume'] * 0.5
        
        if 'offset' not in df.columns:
            df['offset'] = 0
        
        if 'kline_pct' not in df.columns:
            df['kline_pct'] = df['close'].pct_change().fillna(0)
        
        # 确保symbol列正确
        df['symbol'] = symbol
        
        return df
    
    def check_data_availability_for_backtest(self, symbols: List[str], 
                                           start_date: str, end_date: str,
                                           min_records: int = 1000) -> Dict:
        """
        检查回测数据可用性
        
        Args:
            symbols: 交易对列表
            start_date: 开始日期
            end_date: 结束日期
            min_records: 最小记录数
            
        Returns:
            可用性检查结果
        """
        return self.data_manager.check_data_availability(symbols, start_date, end_date, min_records)
    
    def get_intelligent_time_range_for_backtest(self, symbols: List[str],
                                              requested_start: str, requested_end: str,
                                              min_records: int = 1000) -> Dict:
        """
        为回测获取智能时间范围
        
        Args:
            symbols: 交易对列表
            requested_start: 请求的开始时间
            requested_end: 请求的结束时间
            min_records: 最小记录数
            
        Returns:
            优化后的时间范围信息
        """
        return self.data_manager.get_intelligent_time_range(
            symbols, requested_start, requested_end, min_records
        )
    
    def get_data_status_summary(self) -> Dict:
        """
        获取数据状态摘要
        
        Returns:
            数据状态摘要
        """
        try:
            spot_symbols = self.data_manager.get_available_symbols("spot")
            swap_symbols = self.data_manager.get_available_symbols("swap")
            all_symbols = self.data_manager.get_available_symbols("all")
            
            # 获取一些示例数据的信息
            sample_symbols = ["BTCUSDT", "ETHUSDT", "BNBUSDT"]
            sample_info = {}
            
            for symbol in sample_symbols:
                info = self.data_manager.get_data_info(symbol, "spot")
                if not info["available"]:
                    info = self.data_manager.get_data_info(symbol, "swap")
                sample_info[symbol] = info
            
            return {
                "data_source": "本地预处理数据",
                "data_directory": self.data_manager.data_dir,
                "total_symbols": len(all_symbols),
                "spot_symbols": len(spot_symbols),
                "swap_symbols": len(swap_symbols),
                "sample_data": sample_info,
                "status": "healthy" if len(all_symbols) > 0 else "no_data",
                "last_updated": datetime.now().isoformat()
            }
            
        except Exception as e:
            logger.error(f"❌ 获取数据状态摘要失败: {e}")
            return {
                "data_source": "本地预处理数据",
                "status": "error",
                "error": str(e),
                "last_updated": datetime.now().isoformat()
            }
    
    def validate_symbol_format(self, symbol: str) -> str:
        """
        验证并标准化交易对格式
        
        Args:
            symbol: 交易对名称
            
        Returns:
            标准化的交易对名称
        """
        # 移除可能的连字符
        standard_symbol = symbol.replace("-", "").upper()
        
        # 验证是否为USDT交易对
        if not standard_symbol.endswith("USDT"):
            logger.warning(f"⚠️ 非USDT交易对: {symbol}")
        
        return standard_symbol


# 全局实例
data_adapter = DataAdapter()
