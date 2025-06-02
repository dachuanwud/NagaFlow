import React, { useEffect, useState } from 'react';
import Plot from 'react-plotly.js';
import { useThemeStore } from '../../stores/themeStore';
import { Spin } from 'antd';

interface DrawdownChartProps {
  data?: {
    dates: string[];
    drawdowns: number[];
    strategy?: string;
  };
  height?: number;
  title?: string;
  loading?: boolean;
}

export const DrawdownChart: React.FC<DrawdownChartProps> = ({
  data,
  height = 400,
  title = "回撤曲线",
  loading = false
}) => {
  const { isDark } = useThemeStore();

  if (loading || !data) {
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
        <span>📉 {loading ? '加载回撤数据中...' : '暂无回撤数据'}</span>
      </div>
    );
  }

  const plotData = [
    {
      x: data.dates,
      y: data.drawdowns.map(d => d * 100), // 转换为百分比
      type: 'scatter' as const,
      mode: 'lines' as const,
      name: '回撤',
      line: {
        color: '#ff4757',
        width: 2,
      },
      fill: 'tozeroy' as const,
      fillcolor: 'rgba(255, 71, 87, 0.2)',
      hovertemplate: '<b>日期</b>: %{x}<br>' +
                     '<b>回撤</b>: %{y:.2f}%<br>' +
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
        text: '日期',
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
        text: '回撤 (%)',
        font: {
          color: isDark ? '#a0a9c0' : '#666666',
        },
      },
      gridcolor: isDark ? '#3a4553' : '#e0e0e0',
      zerolinecolor: isDark ? '#3a4553' : '#e0e0e0',
      tickfont: {
        color: isDark ? '#a0a9c0' : '#666666',
      },
      tickformat: '.2f',
      range: [Math.min(...data.drawdowns.map(d => d * 100)) * 1.1, 0],
    },
    margin: {
      l: 80,
      r: 30,
      t: 50,
      b: 80,
    },
    showlegend: false,
    hovermode: 'x unified' as const,
    annotations: [
      {
        x: 0.02,
        y: 0.98,
        xref: 'paper',
        yref: 'paper',
        text: `最大回撤: ${(Math.min(...data.drawdowns) * 100).toFixed(2)}%`,
        showarrow: false,
        font: {
          color: '#ff4757',
          size: 12,
        },
        bgcolor: isDark ? 'rgba(255, 71, 87, 0.1)' : 'rgba(255, 71, 87, 0.05)',
        bordercolor: '#ff4757',
        borderwidth: 1,
        borderpad: 4,
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
