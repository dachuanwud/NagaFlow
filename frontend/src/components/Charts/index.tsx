import React, { useEffect, useRef } from 'react';
import { Spin } from 'antd';
import { motion } from 'framer-motion';
import { useThemeStore } from '../../stores/themeStore';
import { useTranslation } from '../../hooks/useTranslation';

interface PerformanceChartProps {
  data: any;
  height?: number;
  title?: string;
}

export const PerformanceChart: React.FC<PerformanceChartProps> = ({ 
  data, 
  height = 320, 
  title 
}) => {
  const { isDark } = useThemeStore();
  const { t } = useTranslation();
  const chartRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!data || !chartRef.current) return;

    // 这里可以集成 Plotly.js 或其他图表库
    // 目前显示一个模拟的图表
    const canvas = document.createElement('canvas');
    canvas.width = chartRef.current.offsetWidth;
    canvas.height = height;
    canvas.style.width = '100%';
    canvas.style.height = `${height}px`;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // 清空容器
    chartRef.current.innerHTML = '';
    chartRef.current.appendChild(canvas);

    // 绘制模拟的性能曲线
    ctx.strokeStyle = '#00d4ff';
    ctx.lineWidth = 2;
    ctx.beginPath();

    const points = 50;
    const baseValue = 100;
    let currentValue = baseValue;

    for (let i = 0; i < points; i++) {
      const x = (i / (points - 1)) * canvas.width;
      
      // 模拟价格波动
      const change = (Math.random() - 0.5) * 10;
      currentValue += change;
      currentValue = Math.max(50, Math.min(200, currentValue)); // 限制范围
      
      const y = height - ((currentValue - 50) / 150) * (height - 40) - 20;
      
      if (i === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
    }

    ctx.stroke();

    // 绘制网格线
    ctx.strokeStyle = isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)';
    ctx.lineWidth = 1;

    // 水平网格线
    for (let i = 1; i < 5; i++) {
      const y = (i / 5) * height;
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(canvas.width, y);
      ctx.stroke();
    }

    // 垂直网格线
    for (let i = 1; i < 6; i++) {
      const x = (i / 6) * canvas.width;
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, height);
      ctx.stroke();
    }

    // 添加标签
    ctx.fillStyle = isDark ? '#a0a9c0' : '#666';
    ctx.font = '12px Arial';
    ctx.fillText('0%', 10, height - 10);
    ctx.fillText('100%', 10, 20);
    ctx.fillText('今天', canvas.width - 40, height - 10);

  }, [data, height, isDark]);

  if (!data) {
    return (
      <div 
        style={{ 
          height, 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center' 
        }}
      >
        <Spin size="large" tip={t('common.loading')} />
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5, ease: 'easeOut' }}
      style={{ width: '100%', height }}
    >
      <div
        ref={chartRef}
        style={{
          width: '100%',
          height,
          background: isDark ? '#1a1f2e' : '#fafafa',
          borderRadius: '8px',
          padding: '10px',
          boxSizing: 'border-box',
        }}
      />
    </motion.div>
  );
};

// 简单的统计图表组件
interface SimpleChartProps {
  data: number[];
  labels: string[];
  color?: string;
  height?: number;
}

export const SimpleChart: React.FC<SimpleChartProps> = ({
  data,
  labels,
  color = '#00d4ff',
  height = 200,
}) => {
  const { isDark } = useThemeStore();
  const chartRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!chartRef.current || !data.length) return;

    const canvas = document.createElement('canvas');
    canvas.width = chartRef.current.offsetWidth;
    canvas.height = height;
    canvas.style.width = '100%';
    canvas.style.height = `${height}px`;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    chartRef.current.innerHTML = '';
    chartRef.current.appendChild(canvas);

    const maxValue = Math.max(...data);
    const barWidth = canvas.width / data.length * 0.8;
    const barSpacing = canvas.width / data.length * 0.2;

    data.forEach((value, index) => {
      const barHeight = (value / maxValue) * (height - 40);
      const x = index * (barWidth + barSpacing) + barSpacing / 2;
      const y = height - barHeight - 20;

      // 绘制柱状图
      ctx.fillStyle = color;
      ctx.fillRect(x, y, barWidth, barHeight);

      // 绘制标签
      ctx.fillStyle = isDark ? '#a0a9c0' : '#666';
      ctx.font = '10px Arial';
      ctx.textAlign = 'center';
      ctx.fillText(labels[index] || '', x + barWidth / 2, height - 5);
      ctx.fillText(value.toString(), x + barWidth / 2, y - 5);
    });

  }, [data, labels, color, height, isDark]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      style={{ width: '100%', height }}
    >
      <div
        ref={chartRef}
        style={{
          width: '100%',
          height,
          background: isDark ? '#1a1f2e' : '#fafafa',
          borderRadius: '8px',
          padding: '10px',
          boxSizing: 'border-box',
        }}
      />
    </motion.div>
  );
};
