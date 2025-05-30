// 数据格式化和辅助工具
import { BacktestResult, BacktestStatus, TradeRecord } from './api';

export const dataUtils = {
  // 格式化回测结果为图表数据
  formatEquityData: (results: BacktestResult[]) => {
    if (!results || results.length === 0) {
      return { dates: [], values: [], strategy: 'No Data' };
    }

    // 使用第一个结果的资金曲线数据
    const result = results[0];
    const dates = result.equity_curve.map(point => point.date);
    const values = result.equity_curve.map(point => point.value);

    return {
      dates,
      values,
      strategy: result.strategy
    };
  },

  // 格式化性能数据
  formatPerformanceData: (results: BacktestResult[]) => {
    if (!results || results.length === 0) {
      return { dates: [], values: [] };
    }

    // 合并所有策略的资金曲线
    const allPoints: Array<{ date: string; value: number }> = [];

    results.forEach(result => {
      result.equity_curve.forEach(point => {
        allPoints.push(point);
      });
    });

    // 按日期排序并去重
    const sortedPoints = allPoints
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
      .reduce((acc, current) => {
        const existingIndex = acc.findIndex(item => item.date === current.date);
        if (existingIndex >= 0) {
          // 如果日期已存在，取平均值
          acc[existingIndex].value = (acc[existingIndex].value + current.value) / 2;
        } else {
          acc.push(current);
        }
        return acc;
      }, [] as Array<{ date: string; value: number }>);

    return {
      dates: sortedPoints.map(point => point.date),
      values: sortedPoints.map(point => point.value)
    };
  },

  // 计算统计指标
  calculateStatistics: (results: BacktestResult[]) => {
    if (!results || results.length === 0) {
      return {
        avgReturn: 0,
        avgSharpe: 0,
        avgDrawdown: 0,
        totalTrades: 0,
        avgWinRate: 0
      };
    }

    const avgReturn = results.reduce((sum, r) => sum + r.final_return, 0) / results.length;
    const avgSharpe = results.reduce((sum, r) => sum + r.sharpe_ratio, 0) / results.length;
    const avgDrawdown = results.reduce((sum, r) => sum + r.max_drawdown, 0) / results.length;
    const totalTrades = results.reduce((sum, r) => sum + r.total_trades, 0);
    const avgWinRate = results.reduce((sum, r) => sum + r.win_rate, 0) / results.length;

    return {
      avgReturn: Number((avgReturn * 100).toFixed(2)),
      avgSharpe: Number(avgSharpe.toFixed(2)),
      avgDrawdown: Number((avgDrawdown * 100).toFixed(2)),
      totalTrades,
      avgWinRate: Number((avgWinRate * 100).toFixed(2))
    };
  },

  // 格式化日期时间
  formatDateTime: (dateString: string) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleString('zh-CN', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (error) {
      return dateString;
    }
  },

  // 格式化百分比
  formatPercentage: (value: number, decimals: number = 2) => {
    return `${(value * 100).toFixed(decimals)}%`;
  },

  // 格式化数字
  formatNumber: (value: number, decimals: number = 2) => {
    return value.toLocaleString('zh-CN', {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals
    });
  },

  // 格式化回撤数据
  formatDrawdownData: (results: BacktestResult[]) => {
    if (!results || results.length === 0) {
      return { dates: [], drawdowns: [], strategy: 'No Data' };
    }

    const result = results[0];
    const dates = result.equity_curve.map(point => point.date);
    const drawdowns = result.equity_curve.map(point => point.drawdown || 0);

    return {
      dates,
      drawdowns,
      strategy: result.strategy
    };
  },

  // 格式化收益分布数据
  formatReturnsDistribution: (results: BacktestResult[]) => {
    if (!results || results.length === 0) {
      return { returns: [], strategy: 'No Data' };
    }

    // 计算日收益率
    const allReturns: number[] = [];
    results.forEach(result => {
      const equityCurve = result.equity_curve;
      for (let i = 1; i < equityCurve.length; i++) {
        const dailyReturn = (equityCurve[i].value - equityCurve[i-1].value) / equityCurve[i-1].value;
        allReturns.push(dailyReturn);
      }
    });

    return {
      returns: allReturns,
      strategy: results[0].strategy
    };
  },

  // 格式化月度收益数据
  formatMonthlyReturns: (results: BacktestResult[]) => {
    if (!results || results.length === 0) {
      return [];
    }

    // 合并所有结果的月度收益
    const allMonthlyReturns: any[] = [];
    results.forEach(result => {
      if (result.monthly_returns) {
        allMonthlyReturns.push(...result.monthly_returns);
      }
    });

    return allMonthlyReturns;
  },

  // 生成默认的资金曲线数据（用于演示）
  generateDefaultEquityData: (strategy: string = 'SMA Strategy') => {
    const dates = [];
    const values = [];
    const drawdowns = [];
    const baseDate = new Date('2023-01-01');
    let currentValue = 10000; // Starting capital
    let peak = currentValue;

    for (let i = 0; i < 180; i++) { // 6 months of data
      const date = new Date(baseDate);
      date.setDate(date.getDate() + i);
      dates.push(date.toISOString().split('T')[0]);

      // Simulate strategy performance
      const dailyReturn = (Math.random() - 0.45) * 0.025; // Strategy with positive edge
      currentValue *= (1 + dailyReturn);

      // Update peak and calculate drawdown
      if (currentValue > peak) {
        peak = currentValue;
      }
      const drawdown = (peak - currentValue) / peak;

      values.push(Math.round(currentValue));
      drawdowns.push(drawdown);
    }

    return { dates, values, drawdowns, strategy };
  },

  // 生成默认的交易记录数据
  generateDefaultTradeRecords: (count: number = 50): TradeRecord[] => {
    const trades: TradeRecord[] = [];
    const symbols = ['BTC-USDT', 'ETH-USDT', 'BNB-USDT', 'ADA-USDT'];
    const baseDate = new Date('2023-01-01');

    for (let i = 0; i < count; i++) {
      const date = new Date(baseDate);
      date.setDate(date.getDate() + Math.floor(i / 2));
      date.setHours(9 + Math.floor(Math.random() * 8));
      date.setMinutes(Math.floor(Math.random() * 60));

      const symbol = symbols[Math.floor(Math.random() * symbols.length)];
      const side = Math.random() > 0.5 ? 'buy' : 'sell';
      const quantity = Math.random() * 10 + 0.1;
      const price = Math.random() * 50000 + 20000;
      const pnl = (Math.random() - 0.4) * 1000; // Slight positive bias

      trades.push({
        id: `trade_${i.toString().padStart(6, '0')}`,
        symbol,
        side,
        quantity,
        price,
        timestamp: date.toISOString(),
        pnl,
        commission: Math.abs(pnl) * 0.001,
        slippage: Math.abs(pnl) * 0.0005,
      });
    }

    return trades.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
  },

  // 生成默认的月度收益数据
  generateDefaultMonthlyReturns: () => {
    const monthlyReturns = [];
    const currentYear = new Date().getFullYear();

    for (let year = currentYear - 2; year <= currentYear; year++) {
      for (let month = 1; month <= 12; month++) {
        // Skip future months
        if (year === currentYear && month > new Date().getMonth() + 1) break;

        const monthlyReturn = (Math.random() - 0.4) * 0.15; // Slight positive bias
        monthlyReturns.push({
          year,
          month,
          return: monthlyReturn
        });
      }
    }

    return monthlyReturns;
  }
};
