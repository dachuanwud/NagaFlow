import React, { useEffect, useState } from 'react';
import Plot from 'react-plotly.js';
import { useThemeStore } from '../../stores/themeStore';
import { Spin } from 'antd';
import { MonthlyReturn } from '../../services/api';

interface MonthlyReturnsHeatmapProps {
  data?: MonthlyReturn[];
  height?: number;
  title?: string;
  loading?: boolean;
}

export const MonthlyReturnsHeatmap: React.FC<MonthlyReturnsHeatmapProps> = ({ 
  data, 
  height = 400, 
  title = "月度收益热力图",
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
        <span>🔥 加载月度收益热力图中...</span>
      </div>
    );
  }

  // 处理数据，构建热力图矩阵
  const years = [...new Set(data.map(d => d.year))].sort();
  const months = ['1月', '2月', '3月', '4月', '5月', '6月', 
                  '7月', '8月', '9月', '10月', '11月', '12月'];
  
  // 创建数据矩阵
  const zData: number[][] = [];
  const textData: string[][] = [];
  const hoverData: string[][] = [];

  years.forEach(year => {
    const yearData: number[] = [];
    const yearText: string[] = [];
    const yearHover: string[] = [];
    
    for (let month = 1; month <= 12; month++) {
      const monthData = data.find(d => d.year === year && d.month === month);
      const returnValue = monthData ? monthData.return * 100 : null;
      
      yearData.push(returnValue || 0);
      yearText.push(returnValue ? `${returnValue.toFixed(1)}%` : '');
      yearHover.push(returnValue ? 
        `${year}年${month}月<br>收益率: ${returnValue.toFixed(2)}%` : 
        `${year}年${month}月<br>无数据`
      );
    }
    
    zData.push(yearData);
    textData.push(yearText);
    hoverData.push(yearHover);
  });

  const plotData = [
    {
      z: zData,
      x: months,
      y: years.map(y => y.toString()),
      type: 'heatmap' as const,
      colorscale: [
        [0, '#ff4757'],      // 深红色 (负收益)
        [0.3, '#ff6b7a'],    // 浅红色
        [0.45, '#ffffff'],   // 白色 (零收益)
        [0.55, '#ffffff'],   // 白色
        [0.7, '#70ff88'],    // 浅绿色
        [1, '#00ff88']       // 深绿色 (正收益)
      ],
      text: textData,
      texttemplate: '%{text}',
      textfont: {
        color: isDark ? '#ffffff' : '#000000',
        size: 11,
        family: "'Inter', sans-serif",
      },
      hovertemplate: '%{customdata}<extra></extra>',
      customdata: hoverData,
      showscale: true,
      colorbar: {
        title: {
          text: '收益率 (%)',
          font: {
            color: isDark ? '#a0a9c0' : '#666666',
          },
        },
        tickfont: {
          color: isDark ? '#a0a9c0' : '#666666',
        },
        tickformat: '.1f',
        ticksuffix: '%',
      },
    }
  ];

  // 计算年度收益率
  const yearlyReturns = years.map(year => {
    const yearData = data.filter(d => d.year === year);
    const yearlyReturn = yearData.reduce((acc, d) => acc * (1 + d.return), 1) - 1;
    return { year, return: yearlyReturn * 100 };
  });

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
        text: '月份',
        font: {
          color: isDark ? '#a0a9c0' : '#666666',
        },
      },
      tickfont: {
        color: isDark ? '#a0a9c0' : '#666666',
      },
      side: 'bottom',
    },
    yaxis: {
      title: {
        text: '年份',
        font: {
          color: isDark ? '#a0a9c0' : '#666666',
        },
      },
      tickfont: {
        color: isDark ? '#a0a9c0' : '#666666',
      },
      autorange: 'reversed',
    },
    margin: {
      l: 80,
      r: 120,
      t: 50,
      b: 80,
    },
    annotations: [
      {
        x: 1.15,
        y: 0.98,
        xref: 'paper',
        yref: 'paper',
        text: '年度收益率:<br>' + 
              yearlyReturns.map(yr => 
                `${yr.year}: ${yr.return.toFixed(1)}%`
              ).join('<br>'),
        showarrow: false,
        font: {
          color: isDark ? '#a0a9c0' : '#666666',
          size: 10,
        },
        bgcolor: isDark ? 'rgba(26, 31, 46, 0.9)' : 'rgba(255, 255, 255, 0.9)',
        bordercolor: isDark ? '#3a4553' : '#e0e0e0',
        borderwidth: 1,
        borderpad: 6,
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
