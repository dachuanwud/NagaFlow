import React, { useEffect, useState } from 'react';
import Plot from 'react-plotly.js';
import { useThemeStore } from '../../stores/themeStore';

interface EquityChartProps {
  data?: {
    dates: string[];
    values: number[];
    strategy?: string;
  };
  height?: number;
  title?: string;
}

export const EquityChart: React.FC<EquityChartProps> = ({ 
  data, 
  height = 400, 
  title = "Equity Curve" 
}) => {
  const { isDark } = useThemeStore();
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Simulate loading delay
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 1000);

    return () => clearTimeout(timer);
  }, []);

  if (isLoading || !data) {
    return (
      <div style={{
        height,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: isDark ? '#1a1f2e' : '#f5f5f5',
        borderRadius: '8px',
        color: isDark ? '#a0a9c0' : '#666'
      }}>
        📈 Loading equity curve...
      </div>
    );
  }

  const plotData = [
    {
      x: data.dates,
      y: data.values,
      type: 'scatter' as const,
      mode: 'lines' as const,
      name: data.strategy || 'Strategy',
      line: {
        color: '#00d4ff',
        width: 2,
      },
      fill: 'tozeroy' as const,
      fillcolor: 'rgba(0, 212, 255, 0.1)',
    }
  ];

  const layout = {
    title: {
      text: title,
      font: {
        color: isDark ? '#ffffff' : '#000000',
        size: 16,
      },
    },
    paper_bgcolor: isDark ? '#1a1f2e' : '#ffffff',
    plot_bgcolor: isDark ? '#1a1f2e' : '#ffffff',
    font: {
      color: isDark ? '#a0a9c0' : '#666666',
    },
    xaxis: {
      title: 'Date',
      gridcolor: isDark ? '#3a4553' : '#e0e0e0',
      zerolinecolor: isDark ? '#3a4553' : '#e0e0e0',
      tickfont: {
        color: isDark ? '#a0a9c0' : '#666666',
      },
    },
    yaxis: {
      title: 'Portfolio Value',
      gridcolor: isDark ? '#3a4553' : '#e0e0e0',
      zerolinecolor: isDark ? '#3a4553' : '#e0e0e0',
      tickfont: {
        color: isDark ? '#a0a9c0' : '#666666',
      },
      tickformat: ',.0f',
    },
    margin: {
      l: 80,
      r: 30,
      t: 50,
      b: 80,
    },
    showlegend: true,
    legend: {
      font: {
        color: isDark ? '#a0a9c0' : '#666666',
      },
    },
    hovermode: 'x unified' as const,
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
  };

  return (
    <div style={{ width: '100%', height }}>
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
