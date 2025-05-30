import React, { useEffect, useState } from 'react';
import Plot from 'react-plotly.js';
import { useThemeStore } from '../../stores/themeStore';
import { Spin } from 'antd';
import { TradeRecord } from '../../services/api';

interface TradeAnalysisChartProps {
  data?: TradeRecord[];
  height?: number;
  title?: string;
  loading?: boolean;
  chartType?: 'pnl' | 'volume' | 'cumulative';
}

export const TradeAnalysisChart: React.FC<TradeAnalysisChartProps> = ({ 
  data, 
  height = 400, 
  title = "交易分析",
  loading = false,
  chartType = 'pnl'
}) => {
  const { isDark } = useThemeStore();
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 800);

    return () => clearTimeout(timer);
  }, []);

  if (loading || isLoading || !data || !data.length) {
    return (
      <div style={{
        height,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: isDark ? '#1a1f2e' : '#f5f5f5',
        borderRadius: '8px',
        color: isDark ? '#a0a9c0' : '#666',
        flexDirection: 'column',
        gap: '12px'
      }}>
        <Spin size="large" />
        <span>📈 加载交易分析数据中...</span>
      </div>
    );
  }

  // 按时间排序交易记录
  const sortedTrades = [...data].sort((a, b) => 
    new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
  );

  let plotData: any[] = [];
  let layoutConfig: any = {};

  switch (chartType) {
    case 'pnl':
      // 盈亏分布图
      const winningTrades = sortedTrades.filter(t => t.pnl > 0);
      const losingTrades = sortedTrades.filter(t => t.pnl < 0);
      
      plotData = [
        {
          x: winningTrades.map((_, i) => i + 1),
          y: winningTrades.map(t => t.pnl),
          type: 'bar' as const,
          name: '盈利交易',
          marker: {
            color: '#00ff88',
            opacity: 0.8,
          },
          hovertemplate: '<b>盈利交易 #%{x}</b><br>' +
                         '盈亏: $%{y:.2f}<br>' +
                         '<extra></extra>',
        },
        {
          x: losingTrades.map((_, i) => i + 1),
          y: losingTrades.map(t => t.pnl),
          type: 'bar' as const,
          name: '亏损交易',
          marker: {
            color: '#ff4757',
            opacity: 0.8,
          },
          hovertemplate: '<b>亏损交易 #%{x}</b><br>' +
                         '盈亏: $%{y:.2f}<br>' +
                         '<extra></extra>',
        }
      ];
      
      layoutConfig = {
        xaxis: {
          title: '交易序号',
        },
        yaxis: {
          title: '盈亏 ($)',
        },
        barmode: 'group',
      };
      break;

    case 'volume':
      // 交易量分析
      const dailyVolume = sortedTrades.reduce((acc, trade) => {
        const date = trade.timestamp.split('T')[0];
        if (!acc[date]) {
          acc[date] = { date, volume: 0, trades: 0 };
        }
        acc[date].volume += trade.quantity * trade.price;
        acc[date].trades += 1;
        return acc;
      }, {} as Record<string, { date: string; volume: number; trades: number }>);

      const volumeData = Object.values(dailyVolume);
      
      plotData = [
        {
          x: volumeData.map(d => d.date),
          y: volumeData.map(d => d.volume),
          type: 'bar' as const,
          name: '日交易量',
          marker: {
            color: '#00d4ff',
            opacity: 0.8,
          },
          hovertemplate: '<b>日期</b>: %{x}<br>' +
                         '<b>交易量</b>: $%{y:,.0f}<br>' +
                         '<extra></extra>',
        }
      ];
      
      layoutConfig = {
        xaxis: {
          title: '日期',
        },
        yaxis: {
          title: '交易量 ($)',
          tickformat: ',.0f',
        },
      };
      break;

    case 'cumulative':
      // 累计盈亏曲线
      let cumulativePnL = 0;
      const cumulativeData = sortedTrades.map(trade => {
        cumulativePnL += trade.pnl;
        return {
          timestamp: trade.timestamp,
          cumulative: cumulativePnL,
          pnl: trade.pnl,
        };
      });
      
      plotData = [
        {
          x: cumulativeData.map(d => d.timestamp),
          y: cumulativeData.map(d => d.cumulative),
          type: 'scatter' as const,
          mode: 'lines+markers' as const,
          name: '累计盈亏',
          line: {
            color: '#00d4ff',
            width: 2,
          },
          marker: {
            color: cumulativeData.map(d => d.pnl > 0 ? '#00ff88' : '#ff4757'),
            size: 6,
          },
          hovertemplate: '<b>时间</b>: %{x}<br>' +
                         '<b>累计盈亏</b>: $%{y:.2f}<br>' +
                         '<extra></extra>',
        }
      ];
      
      layoutConfig = {
        xaxis: {
          title: '时间',
        },
        yaxis: {
          title: '累计盈亏 ($)',
          tickformat: '.2f',
        },
      };
      break;
  }

  const layout = {
    title: {
      text: title,
      font: {
        color: isDark ? '#ffffff' : '#000000',
        size: 16,
        family: "'Inter', sans-serif",
      },
    },
    paper_bgcolor: isDark ? '#1a1f2e' : '#ffffff',
    plot_bgcolor: isDark ? '#1a1f2e' : '#ffffff',
    font: {
      color: isDark ? '#a0a9c0' : '#666666',
      family: "'Inter', sans-serif",
    },
    xaxis: {
      ...layoutConfig.xaxis,
      title: {
        text: layoutConfig.xaxis?.title || '',
        font: {
          color: isDark ? '#a0a9c0' : '#666666',
        },
      },
      gridcolor: isDark ? '#3a4553' : '#e0e0e0',
      zerolinecolor: isDark ? '#3a4553' : '#e0e0e0',
      tickfont: {
        color: isDark ? '#a0a9c0' : '#666666',
      },
    },
    yaxis: {
      ...layoutConfig.yaxis,
      title: {
        text: layoutConfig.yaxis?.title || '',
        font: {
          color: isDark ? '#a0a9c0' : '#666666',
        },
      },
      gridcolor: isDark ? '#3a4553' : '#e0e0e0',
      zerolinecolor: isDark ? '#3a4553' : '#e0e0e0',
      tickfont: {
        color: isDark ? '#a0a9c0' : '#666666',
      },
    },
    margin: {
      l: 80,
      r: 30,
      t: 50,
      b: 80,
    },
    showlegend: chartType === 'pnl',
    legend: {
      font: {
        color: isDark ? '#a0a9c0' : '#666666',
      },
    },
    hovermode: 'closest' as const,
    ...layoutConfig,
  };

  const config = {
    displayModeBar: true,
    displaylogo: false,
    modeBarButtonsToRemove: [
      'pan2d',
      'lasso2d',
      'select2d',
      'autoScale2d',
      'hoverClosestCartesian',
      'hoverCompareCartesian',
      'toggleSpikelines',
    ],
    responsive: true,
    locale: 'zh-CN',
  };

  return (
    <div style={{ 
      width: '100%', 
      height,
      borderRadius: '8px',
      overflow: 'hidden',
      background: isDark ? '#1a1f2e' : '#ffffff',
    }}>
      <Plot
        data={plotData}
        layout={layout}
        config={config}
        style={{ width: '100%', height: '100%' }}
        useResizeHandler={true}
      />
    </div>
  );
};
