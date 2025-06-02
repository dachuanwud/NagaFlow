import axios, { AxiosError } from 'axios';
import { message } from 'antd';

// 创建axios实例
const api = axios.create({
  baseURL: '/api', // 使用相对路径，通过Vite代理转发到后端
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// 错误处理函数
const handleApiError = (error: AxiosError) => {
  if (error.response) {
    // 服务器返回错误状态码
    const status = error.response.status;
    const data = error.response.data as any;

    switch (status) {
      case 400:
        message.error(data.detail || '请求参数错误');
        break;
      case 404:
        message.error(data.detail || '请求的资源不存在');
        break;
      case 500:
        message.error(data.detail || '服务器内部错误');
        break;
      default:
        message.error(data.detail || `请求失败 (${status})`);
    }
  } else if (error.request) {
    // 网络错误
    message.error('网络连接失败，请检查后端服务是否启动');
  } else {
    // 其他错误
    message.error('请求发生未知错误');
  }

  console.error('API Error:', error);
  return Promise.reject(error);
};

// 请求拦截器
api.interceptors.request.use(
  (config) => {
    // 可以在这里添加认证token等
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// 响应拦截器
api.interceptors.response.use(
  (response) => {
    return response.data;
  },
  handleApiError
);

// 数据类型定义
export interface SymbolInfo {
  symbol: string;
  status: string;
  last_update?: string;
}

export interface DataStatus {
  status: string;
  progress: number;
  message: string;
}

export interface BacktestRequest {
  symbols: string[];
  strategy: string;
  parameters: Record<string, any>;
  date_start?: string;
  date_end?: string;
  rule_type?: string;
  leverage_rate?: number;
  c_rate?: number;
  slippage?: number;
}

export interface TradeRecord {
  id: string;
  symbol: string;
  side: 'buy' | 'sell';
  quantity: number;
  price: number;
  timestamp: string;
  pnl: number;
  commission: number;
  slippage: number;
}

export interface DrawdownPeriod {
  start_date: string;
  end_date: string;
  duration_days: number;
  max_drawdown: number;
  recovery_date?: string;
}

export interface MonthlyReturn {
  year: number;
  month: number;
  return: number;
}

export interface BacktestResult {
  task_id: string;
  symbol: string;
  strategy: string;
  parameters: Record<string, any>;
  final_return: number;
  annual_return: number;
  max_drawdown: number;
  sharpe_ratio: number;
  sortino_ratio: number;
  calmar_ratio: number;
  win_rate: number;
  profit_factor: number;
  total_trades: number;
  winning_trades: number;
  losing_trades: number;
  avg_win: number;
  avg_loss: number;
  max_consecutive_wins: number;
  max_consecutive_losses: number;
  volatility: number;
  skewness: number;
  kurtosis: number;
  var_95: number; // Value at Risk 95%
  cvar_95: number; // Conditional Value at Risk 95%
  equity_curve: Array<{ date: string; value: number; drawdown: number }>;
  drawdown_periods: DrawdownPeriod[];
  monthly_returns: MonthlyReturn[];
  trade_records: TradeRecord[];
  created_at: string;

  // 新增：时间范围相关字段
  requested_date_start?: string;  // 用户请求的开始时间
  requested_date_end?: string;    // 用户请求的结束时间
  actual_date_start?: string;     // 实际使用的开始时间
  actual_date_end?: string;       // 实际使用的结束时间
  data_records_count?: number;    // 实际使用的数据条数
  time_range_match_status?: string;  // 时间范围匹配状态
  time_range_adjustment_reason?: string;  // 时间范围调整原因
}

export interface BacktestStatus {
  task_id: string;
  status: string;
  progress: number;
  message: string;
  symbols_total: number;
  symbols_completed: number;
  results: BacktestResult[];
}

// 新增：数据时间范围接口
export interface DataTimeRange {
  symbol: string;
  available: boolean;
  message: string;
  start_date: string | null;
  end_date: string | null;
  total_records: number;
  price_range?: {
    min: number | null;
    max: number | null;
  };
  // 新增：数据质量评估字段
  quality_score?: 'high' | 'medium' | 'low' | 'unavailable' | 'auto_fetch';
  recommended?: boolean;
  quality_message?: string;
  auto_fetch_available?: boolean;
  // 兼容后端返回的其他字段
  records_count?: number;
  time_range?: {
    start: string;
    end: string;
  };
  data_source?: string;
}

// 新增：可用交易对响应接口
export interface AvailableSymbolsResponse {
  symbols: string[];
  message: string;
  total_count: number;
}

export interface Strategy {
  id: string;
  name: string;
  description: string;
  factors: string[];
  parameters: Record<string, any>;
  created_at: string;
  updated_at: string;
  is_active: boolean;
}

export interface ParameterConstraint {
  min_value?: number;
  max_value?: number;
  step?: number;
  options?: any[];
  default: any;
  required: boolean;
}

export interface ParameterDefinition {
  name: string;
  display_name: string;
  description: string;
  type: 'integer' | 'float' | 'boolean' | 'string' | 'list' | 'range';
  constraint: ParameterConstraint;
  group?: string;
  order: number;
}

export interface FactorInfo {
  name: string;
  display_name: string;
  description: string;
  category: string;
  parameters: ParameterDefinition[];
  file_path: string;
  is_active: boolean;
}

// 数据管理API
export const dataApi = {
  getSymbols: (tradeType: string = 'swap'): Promise<SymbolInfo[]> =>
    api.get(`/data/symbols?trade_type=${tradeType}`),

  getDataStatus: (): Promise<DataStatus> =>
    api.get('/data/status'),

  startDownload: (data: {
    symbols?: string[];
    trade_type?: string;
    intervals?: string[];
  }) =>
    api.post('/data/download', data),

  getMarketData: (symbol: string, interval: string = '1H', limit: number = 1000) =>
    api.get(`/data/market/${symbol}?interval=${interval}&limit=${limit}`),

  clearCache: () =>
    api.delete('/data/cache'),
};

// 回测API
export const backtestApi = {
  runBacktest: (data: BacktestRequest) =>
    api.post('/backtest/run', data),

  getBacktestStatus: (taskId: string): Promise<BacktestStatus> =>
    api.get(`/backtest/status/${taskId}`),

  getBacktestResults: (taskId: string) =>
    api.get(`/backtest/results/${taskId}`),

  listTasks: (): Promise<BacktestStatus[]> =>
    api.get('/backtest/tasks'),

  startOptimization: (data: any) =>
    api.post('/backtest/optimize', data),

  deleteTask: (taskId: string) =>
    api.delete(`/backtest/tasks/${taskId}`),

  // 新增：获取数据时间范围
  getDataTimeRange: (symbol: string): Promise<DataTimeRange> =>
    api.get(`/backtest/data-range/${symbol}`),

  // 新增：获取可用交易对
  getAvailableSymbols: (): Promise<AvailableSymbolsResponse> =>
    api.get('/backtest/available-symbols'),

  // 新增：数据预处理
  prepareData: (data: {
    symbols: string[];
    date_start: string;
    date_end: string;
    rule_type?: string;
  }) =>
    api.post('/backtest/prepare-data', data),

  // 新增：按需数据准备
  prepareDataOnDemand: (data: BacktestRequest) =>
    api.post('/backtest/prepare-data-on-demand', data),

  // 新增：自动数据回测
  runBacktestWithAutoData: (data: BacktestRequest) =>
    api.post('/backtest/run-with-auto-data', data),
};

// 策略管理API
export const strategiesApi = {
  listStrategies: (): Promise<Strategy[]> =>
    api.get('/strategies/'),

  getStrategy: (id: string): Promise<Strategy> =>
    api.get(`/strategies/${id}`),

  createStrategy: (data: {
    name: string;
    description: string;
    factors: string[];
    parameters: Record<string, any>;
  }): Promise<Strategy> =>
    api.post('/strategies/', data),

  updateStrategy: (id: string, data: {
    name?: string;
    description?: string;
    factors?: string[];
    parameters?: Record<string, any>;
    is_active?: boolean;
  }): Promise<Strategy> =>
    api.put(`/strategies/${id}`, data),

  deleteStrategy: (id: string) =>
    api.delete(`/strategies/${id}`),

  listFactors: (): Promise<FactorInfo[]> =>
    api.get('/strategies/factors'),

  getFactorInfo: (factorName: string): Promise<FactorInfo> =>
    api.get(`/strategies/factors/${factorName}`),

  validateFactorParameters: (factorName: string, parameters: Record<string, any>) =>
    api.post(`/strategies/factors/${factorName}/validate`, parameters),

  getFactorCategories: (): Promise<{ categories: string[] }> =>
    api.get('/strategies/factors/categories'),

  validateStrategy: (id: string) =>
    api.get(`/strategies/${id}/validate`),

  cloneStrategy: (id: string, newName: string): Promise<Strategy> =>
    api.post(`/strategies/${id}/clone?new_name=${encodeURIComponent(newName)}`),
};

export default api;
