import React, { useEffect, useState } from 'react';
import Plot from 'react-plotly.js';
import { useThemeStore } from '../../stores/themeStore';
import { Spin } from 'antd';

interface ReturnsDistributionChartProps {
  data?: {
    returns: number[];
    strategy?: string;
  };
  height?: number;
  title?: string;
  loading?: boolean;
}

export const ReturnsDistributionChart: React.FC<ReturnsDistributionChartProps> = ({ 
  data, 
  height = 400, 
  title = "收益分布",
  loading = false
}) => {
  const { isDark } = useThemeStore();
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 800);

    return () => clearTimeout(timer);
  }, []);

  if (loading || isLoading || !data || !data.returns.length) {
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
        <span>📊 加载收益分布数据中...</span>
      </div>
    );
  }

  // 计算统计指标
  const returns = data.returns.map(r => r * 100); // 转换为百分比
  const mean = returns.reduce((sum, r) => sum + r, 0) / returns.length;
  const variance = returns.reduce((sum, r) => sum + Math.pow(r - mean, 2), 0) / returns.length;
  const stdDev = Math.sqrt(variance);
  const skewness = returns.reduce((sum, r) => sum + Math.pow((r - mean) / stdDev, 3), 0) / returns.length;
  const kurtosis = returns.reduce((sum, r) => sum + Math.pow((r - mean) / stdDev, 4), 0) / returns.length - 3;

  const plotData = [
    {
      x: returns,
      type: 'histogram' as const,
      name: '收益分布',
      marker: {
        color: returns.map(r => r >= 0 ? '#00ff88' : '#ff4757'),
        opacity: 0.7,
        line: {
          color: isDark ? '#3a4553' : '#ffffff',
          width: 1,
        },
      },
      nbinsx: Math.min(30, Math.max(10, Math.floor(returns.length / 10))),
      hovertemplate: '<b>收益区间</b>: %{x:.2f}%<br>' +
                     '<b>频次</b>: %{y}<br>' +
                     '<extra></extra>',
    }
  ];

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
      title: {
        text: '日收益率 (%)',
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
      title: {
        text: '频次',
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
    showlegend: false,
    hovermode: 'closest' as const,
    shapes: [
      // 均值线
      {
        type: 'line',
        x0: mean,
        x1: mean,
        y0: 0,
        y1: 1,
        yref: 'paper',
        line: {
          color: '#00d4ff',
          width: 2,
          dash: 'dash',
        },
      }
    ],
    annotations: [
      {
        x: 0.02,
        y: 0.98,
        xref: 'paper',
        yref: 'paper',
        text: `均值: ${mean.toFixed(2)}%<br>` +
              `标准差: ${stdDev.toFixed(2)}%<br>` +
              `偏度: ${skewness.toFixed(2)}<br>` +
              `峰度: ${kurtosis.toFixed(2)}`,
        showarrow: false,
        font: {
          color: isDark ? '#a0a9c0' : '#666666',
          size: 11,
        },
        bgcolor: isDark ? 'rgba(26, 31, 46, 0.9)' : 'rgba(255, 255, 255, 0.9)',
        bordercolor: isDark ? '#3a4553' : '#e0e0e0',
        borderwidth: 1,
        borderpad: 8,
        align: 'left',
      }
    ],
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
