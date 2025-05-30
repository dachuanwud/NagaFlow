import axios from 'axios';

// 创建axios实例
const api = axios.create({
  baseURL: '/api',
  timeout: 30000,
});

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
  (error) => {
    console.error('API Error:', error);
    return Promise.reject(error);
  }
);

// 数据管理API
export const dataApi = {
  getSymbols: (tradeType: string = 'swap') =>
    api.get(`/data/symbols?trade_type=${tradeType}`),
  
  getDataStatus: () =>
    api.get('/data/status'),
  
  startDownload: (data: any) =>
    api.post('/data/download', data),
  
  getMarketData: (symbol: string, interval: string = '1H', limit: number = 1000) =>
    api.get(`/data/market/${symbol}?interval=${interval}&limit=${limit}`),
  
  clearCache: () =>
    api.delete('/data/cache'),
};

// 回测API
export const backtestApi = {
  runBacktest: (data: any) =>
    api.post('/backtest/run', data),
  
  getBacktestStatus: (taskId: string) =>
    api.get(`/backtest/status/${taskId}`),
  
  getBacktestResults: (taskId: string) =>
    api.get(`/backtest/results/${taskId}`),
  
  listTasks: () =>
    api.get('/backtest/tasks'),
  
  startOptimization: (data: any) =>
    api.post('/backtest/optimize', data),
  
  deleteTask: (taskId: string) =>
    api.delete(`/backtest/tasks/${taskId}`),
};

// 策略管理API
export const strategyApi = {
  listStrategies: () =>
    api.get('/strategies/'),
  
  getStrategy: (id: string) =>
    api.get(`/strategies/${id}`),
  
  createStrategy: (data: any) =>
    api.post('/strategies/', data),
  
  updateStrategy: (id: string, data: any) =>
    api.put(`/strategies/${id}`, data),
  
  deleteStrategy: (id: string) =>
    api.delete(`/strategies/${id}`),
  
  listFactors: () =>
    api.get('/strategies/factors'),
  
  validateStrategy: (id: string) =>
    api.get(`/strategies/${id}/validate`),
  
  cloneStrategy: (id: string, newName: string) =>
    api.post(`/strategies/${id}/clone?new_name=${newName}`),
};

export default api;
