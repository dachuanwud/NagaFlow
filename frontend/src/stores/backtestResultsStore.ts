import { create } from 'zustand';
import { BacktestResult, BacktestStatus, backtestApi } from '../services/api';

interface BacktestResultsState {
  // 策略结果数据
  results: BacktestResult[];
  tasks: BacktestStatus[];
  
  // 当前选中的策略
  selectedTaskId: string | null;
  selectedResult: BacktestResult | null;
  
  // 对比模式
  compareMode: boolean;
  compareTaskIds: string[];
  compareResults: BacktestResult[];
  
  // 加载状态
  loading: boolean;
  error: string | null;
  
  // Actions
  setResults: (results: BacktestResult[]) => void;
  setTasks: (tasks: BacktestStatus[]) => void;
  selectTask: (taskId: string) => void;
  clearSelection: () => void;
  
  // 对比功能
  toggleCompareMode: () => void;
  addToCompare: (taskId: string) => void;
  removeFromCompare: (taskId: string) => void;
  clearCompare: () => void;
  
  // 状态管理
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  
  // 数据获取
  refreshData: () => Promise<void>;
}

export const useBacktestResultsStore = create<BacktestResultsState>((set, get) => ({
  // 初始状态
  results: [],
  tasks: [],
  selectedTaskId: null,
  selectedResult: null,
  compareMode: false,
  compareTaskIds: [],
  compareResults: [],
  loading: false,
  error: null,
  
  // 设置结果数据
  setResults: (results) => {
    set({ results });
    
    // 如果有选中的任务，更新选中的结果
    const { selectedTaskId } = get();
    if (selectedTaskId) {
      const selectedResult = results.find(r => r.task_id === selectedTaskId);
      set({ selectedResult: selectedResult || null });
    }
    
    // 更新对比结果
    const { compareTaskIds } = get();
    const compareResults = results.filter(r => compareTaskIds.includes(r.task_id));
    set({ compareResults });
  },
  
  // 设置任务列表
  setTasks: (tasks) => {
    set({ tasks });
    
    // 提取已完成任务的结果
    const completedTasks = tasks.filter(t => t.status === 'completed' && t.results);
    const results = completedTasks.flatMap(t => t.results || []);
    get().setResults(results);
  },
  
  // 选择策略
  selectTask: (taskId) => {
    const { results } = get();
    const selectedResult = results.find(r => r.task_id === taskId);
    set({ 
      selectedTaskId: taskId, 
      selectedResult: selectedResult || null 
    });
  },
  
  // 清除选择
  clearSelection: () => {
    set({ 
      selectedTaskId: null, 
      selectedResult: null 
    });
  },
  
  // 切换对比模式
  toggleCompareMode: () => {
    const { compareMode } = get();
    set({ compareMode: !compareMode });
    
    // 如果关闭对比模式，清除对比数据
    if (compareMode) {
      get().clearCompare();
    }
  },
  
  // 添加到对比
  addToCompare: (taskId) => {
    const { compareTaskIds, results } = get();
    
    // 最多对比4个策略
    if (compareTaskIds.length >= 4) {
      return;
    }
    
    if (!compareTaskIds.includes(taskId)) {
      const newCompareTaskIds = [...compareTaskIds, taskId];
      const compareResults = results.filter(r => newCompareTaskIds.includes(r.task_id));
      
      set({ 
        compareTaskIds: newCompareTaskIds,
        compareResults 
      });
    }
  },
  
  // 从对比中移除
  removeFromCompare: (taskId) => {
    const { compareTaskIds, results } = get();
    const newCompareTaskIds = compareTaskIds.filter(id => id !== taskId);
    const compareResults = results.filter(r => newCompareTaskIds.includes(r.task_id));
    
    set({ 
      compareTaskIds: newCompareTaskIds,
      compareResults 
    });
  },
  
  // 清除对比
  clearCompare: () => {
    set({ 
      compareTaskIds: [],
      compareResults: [] 
    });
  },
  
  // 设置加载状态
  setLoading: (loading) => set({ loading }),
  
  // 设置错误
  setError: (error) => set({ error }),
  
  // 刷新数据
  refreshData: async () => {
    try {
      set({ loading: true, error: null });

      try {
        // 尝试获取回测任务列表
        const tasks = await backtestApi.listTasks();
        get().setTasks(tasks);
      } catch (apiError) {
        console.warn('Backend not available, using mock data:', apiError);

        // 后端不可用时使用模拟数据
        const mockTasks = [
          {
            task_id: 'demo_task_1',
            status: 'completed' as const,
            progress: 100,
            message: '回测完成',
            symbols_total: 1,
            symbols_completed: 1,
            results: [
              {
                task_id: 'demo_task_1',
                symbol: 'BTCUSDT',
                strategy: 'MA_Cross',
                parameters: { fast_period: 10, slow_period: 20 },
                final_return: 15.23,
                annual_return: 12.45,
                max_drawdown: -8.67,
                sharpe_ratio: 1.24,
                win_rate: 65.4,
                total_trades: 156,
                profit_factor: 1.85,
                volatility: 18.9,
                created_at: new Date().toISOString(),
                equity_curve: [],
                drawdown_periods: [],
                monthly_returns: [],
                trade_records: []
              }
            ]
          },
          {
            task_id: 'demo_task_2',
            status: 'completed' as const,
            progress: 100,
            message: '回测完成',
            symbols_total: 1,
            symbols_completed: 1,
            results: [
              {
                task_id: 'demo_task_2',
                symbol: 'ETHUSDT',
                strategy: 'RSI_Strategy',
                parameters: { rsi_period: 14, oversold: 30, overbought: 70 },
                final_return: -5.12,
                annual_return: -3.45,
                max_drawdown: -12.34,
                sharpe_ratio: 0.85,
                win_rate: 45.2,
                total_trades: 89,
                profit_factor: 0.92,
                volatility: 22.1,
                created_at: new Date(Date.now() - 86400000).toISOString(), // 1天前
                equity_curve: [],
                drawdown_periods: [],
                monthly_returns: [],
                trade_records: []
              }
            ]
          }
        ];

        get().setTasks(mockTasks);
        set({ error: '后端服务不可用，显示演示数据' });
      }

    } catch (error) {
      console.error('Failed to refresh backtest data:', error);
      set({ error: error instanceof Error ? error.message : '获取数据失败' });
    } finally {
      set({ loading: false });
    }
  },
}));
