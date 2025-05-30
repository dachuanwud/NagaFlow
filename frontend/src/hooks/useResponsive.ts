import { useState, useEffect } from 'react';
import { designTokens } from '../styles/designSystem';

// 响应式断点类型
export type Breakpoint = 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl';

// 断点配置
const breakpoints = {
  xs: 0,
  sm: 576,
  md: 768,
  lg: 992,
  xl: 1200,
  '2xl': 1400,
};

// 获取当前断点
function getCurrentBreakpoint(width: number): Breakpoint {
  if (width >= breakpoints['2xl']) return '2xl';
  if (width >= breakpoints.xl) return 'xl';
  if (width >= breakpoints.lg) return 'lg';
  if (width >= breakpoints.md) return 'md';
  if (width >= breakpoints.sm) return 'sm';
  return 'xs';
}

// 检查是否匹配指定断点
function matchesBreakpoint(width: number, breakpoint: Breakpoint): boolean {
  return width >= breakpoints[breakpoint];
}

// 响应式 Hook
export function useResponsive() {
  const [windowSize, setWindowSize] = useState({
    width: typeof window !== 'undefined' ? window.innerWidth : 1200,
    height: typeof window !== 'undefined' ? window.innerHeight : 800,
  });

  const [currentBreakpoint, setCurrentBreakpoint] = useState<Breakpoint>(
    getCurrentBreakpoint(windowSize.width)
  );

  useEffect(() => {
    function handleResize() {
      const newWidth = window.innerWidth;
      const newHeight = window.innerHeight;
      
      setWindowSize({
        width: newWidth,
        height: newHeight,
      });
      
      setCurrentBreakpoint(getCurrentBreakpoint(newWidth));
    }

    window.addEventListener('resize', handleResize);
    
    // 初始化时也要检查一次
    handleResize();

    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // 断点检查函数
  const isXs = currentBreakpoint === 'xs';
  const isSm = currentBreakpoint === 'sm';
  const isMd = currentBreakpoint === 'md';
  const isLg = currentBreakpoint === 'lg';
  const isXl = currentBreakpoint === 'xl';
  const is2Xl = currentBreakpoint === '2xl';

  // 范围检查函数
  const isMobile = matchesBreakpoint(windowSize.width, 'xs') && !matchesBreakpoint(windowSize.width, 'md');
  const isTablet = matchesBreakpoint(windowSize.width, 'md') && !matchesBreakpoint(windowSize.width, 'lg');
  const isDesktop = matchesBreakpoint(windowSize.width, 'lg');

  // 最小宽度检查
  const isAtLeast = (breakpoint: Breakpoint) => matchesBreakpoint(windowSize.width, breakpoint);
  
  // 最大宽度检查
  const isAtMost = (breakpoint: Breakpoint) => {
    const nextBreakpoints: Record<Breakpoint, Breakpoint | null> = {
      'xs': 'sm',
      'sm': 'md',
      'md': 'lg',
      'lg': 'xl',
      'xl': '2xl',
      '2xl': null,
    };
    
    const nextBreakpoint = nextBreakpoints[breakpoint];
    if (!nextBreakpoint) return true;
    
    return windowSize.width < breakpoints[nextBreakpoint];
  };

  // 范围检查
  const isBetween = (minBreakpoint: Breakpoint, maxBreakpoint: Breakpoint) => {
    return isAtLeast(minBreakpoint) && isAtMost(maxBreakpoint);
  };

  return {
    // 窗口尺寸
    windowSize,
    
    // 当前断点
    currentBreakpoint,
    
    // 具体断点检查
    isXs,
    isSm,
    isMd,
    isLg,
    isXl,
    is2Xl,
    
    // 设备类型检查
    isMobile,
    isTablet,
    isDesktop,
    
    // 断点比较函数
    isAtLeast,
    isAtMost,
    isBetween,
    
    // 工具函数
    matchesBreakpoint: (breakpoint: Breakpoint) => matchesBreakpoint(windowSize.width, breakpoint),
  };
}

// 响应式值 Hook
export function useResponsiveValue<T>(values: Partial<Record<Breakpoint, T>>, defaultValue: T): T {
  const { currentBreakpoint } = useResponsive();
  
  // 按优先级顺序查找值
  const breakpointOrder: Breakpoint[] = ['2xl', 'xl', 'lg', 'md', 'sm', 'xs'];
  const currentIndex = breakpointOrder.indexOf(currentBreakpoint);
  
  // 从当前断点开始，向下查找可用的值
  for (let i = currentIndex; i < breakpointOrder.length; i++) {
    const breakpoint = breakpointOrder[i];
    if (values[breakpoint] !== undefined) {
      return values[breakpoint] as T;
    }
  }
  
  return defaultValue;
}

// 响应式网格列数 Hook
export function useResponsiveColumns(
  columns: Partial<Record<Breakpoint, number>>,
  defaultColumns: number = 1
): number {
  return useResponsiveValue(columns, defaultColumns);
}

// 响应式间距 Hook
export function useResponsiveSpacing(
  spacing: Partial<Record<Breakpoint, keyof typeof designTokens.spacing>>,
  defaultSpacing: keyof typeof designTokens.spacing = 'md'
): string {
  const spacingKey = useResponsiveValue(spacing, defaultSpacing);
  return designTokens.spacing[spacingKey];
}
