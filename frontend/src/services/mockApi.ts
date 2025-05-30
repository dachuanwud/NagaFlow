// Mock API service for testing charts without backend
export const mockApi = {
  // Generate mock performance data
  generatePerformanceData: () => {
    const dates = [];
    const values = [];
    const baseDate = new Date('2023-01-01');
    let currentValue = 100000;

    for (let i = 0; i < 365; i++) {
      const date = new Date(baseDate);
      date.setDate(date.getDate() + i);
      dates.push(date.toISOString().split('T')[0]);

      // Simulate portfolio growth with some volatility
      const dailyReturn = (Math.random() - 0.48) * 0.02; // Slightly positive bias
      currentValue *= (1 + dailyReturn);
      values.push(Math.round(currentValue));
    }

    return { dates, values };
  },

  // Generate mock equity curve data
  generateEquityData: (strategy: string = 'SMA Strategy') => {
    const dates = [];
    const values = [];
    const baseDate = new Date('2023-01-01');
    let currentValue = 10000; // Starting capital

    for (let i = 0; i < 180; i++) { // 6 months of data
      const date = new Date(baseDate);
      date.setDate(date.getDate() + i);
      dates.push(date.toISOString().split('T')[0]);

      // Simulate strategy performance
      const dailyReturn = (Math.random() - 0.45) * 0.025; // Strategy with positive edge
      currentValue *= (1 + dailyReturn);
      values.push(Math.round(currentValue));
    }

    return { dates, values, strategy };
  },

  // Mock backtest results
  getBacktestResults: () => {
    return {
      task_id: 'mock-task-123',
      status: 'completed',
      results: [
        {
          symbol: 'BTCUSDT',
          strategy: 'SMA Strategy',
          final_return: 1.25,
          annual_return: 0.18,
          max_drawdown: 0.08,
          sharpe_ratio: 1.8,
          win_rate: 0.65,
          total_trades: 150,
        },
        {
          symbol: 'ETHUSDT',
          strategy: 'RSI Strategy',
          final_return: 1.15,
          annual_return: 0.12,
          max_drawdown: 0.12,
          sharpe_ratio: 1.2,
          win_rate: 0.58,
          total_trades: 203,
        }
      ]
    };
  },

  // Mock market data
  getMarketData: (symbol: string) => {
    const dates = [];
    const prices = [];
    const baseDate = new Date('2023-01-01');
    let currentPrice = symbol === 'BTCUSDT' ? 45000 : 2500;

    for (let i = 0; i < 100; i++) {
      const date = new Date(baseDate);
      date.setHours(date.getHours() + i);
      dates.push(date.toISOString());

      // Simulate price movement
      const priceChange = (Math.random() - 0.5) * 0.02;
      currentPrice *= (1 + priceChange);
      prices.push(Math.round(currentPrice * 100) / 100);
    }

    return {
      symbol,
      data: dates.map((date, i) => ({
        timestamp: date,
        open: prices[i],
        high: prices[i] * 1.01,
        low: prices[i] * 0.99,
        close: prices[i],
        volume: Math.random() * 1000000
      }))
    };
  }
};
