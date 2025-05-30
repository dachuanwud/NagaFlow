import { useMemo } from 'react';
import { useThemeStore } from '../stores/themeStore';
import { designTokens, getThemeColors } from '../styles/designSystem';

// 主题相关的工具函数和值
export function useTheme() {
  const { isDark, toggleTheme } = useThemeStore();
  
  // 获取当前主题的颜色配置
  const colors = useMemo(() => getThemeColors(isDark), [isDark]);
  
  // 获取当前主题的阴影配置
  const shadows = useMemo(() => {
    return isDark ? designTokens.shadowsDark : designTokens.shadows;
  }, [isDark]);
  
  // 生成主题相关的样式对象
  const getCardStyle = useMemo(() => ({
    background: colors.bg.secondary,
    border: `1px solid ${colors.border.primary}`,
    borderRadius: designTokens.borderRadius.xl,
    boxShadow: shadows.md,
  }), [colors, shadows]);
  
  const getPageStyle = useMemo(() => ({
    background: colors.bg.primary,
    color: colors.text.primary,
    minHeight: '100vh',
  }), [colors]);
  
  const getInputStyle = useMemo(() => ({
    background: colors.bg.secondary,
    border: `1px solid ${colors.border.secondary}`,
    borderRadius: designTokens.borderRadius.md,
    color: colors.text.primary,
  }), [colors]);
  
  const getButtonStyle = useMemo(() => (variant: 'primary' | 'secondary' | 'ghost' = 'primary') => {
    const baseStyle = {
      borderRadius: designTokens.borderRadius.md,
      fontWeight: designTokens.typography.fontWeight.medium,
      transition: `all ${designTokens.animation.duration.normal} ${designTokens.animation.easing.ease}`,
    };
    
    switch (variant) {
      case 'primary':
        return {
          ...baseStyle,
          background: designTokens.colors.primary[500],
          color: '#ffffff',
          border: `1px solid ${designTokens.colors.primary[500]}`,
        };
      case 'secondary':
        return {
          ...baseStyle,
          background: colors.bg.secondary,
          color: colors.text.primary,
          border: `1px solid ${colors.border.primary}`,
        };
      case 'ghost':
        return {
          ...baseStyle,
          background: 'transparent',
          color: colors.text.secondary,
          border: `1px solid ${colors.border.secondary}`,
        };
      default:
        return baseStyle;
    }
  }, [colors]);
  
  // 获取状态颜色
  const getStatusColor = useMemo(() => (status: 'success' | 'error' | 'warning' | 'info') => {
    switch (status) {
      case 'success':
        return designTokens.colors.success[500];
      case 'error':
        return designTokens.colors.error[500];
      case 'warning':
        return designTokens.colors.warning[500];
      case 'info':
        return designTokens.colors.primary[500];
      default:
        return colors.text.primary;
    }
  }, [colors]);
  
  // 获取文本颜色
  const getTextColor = useMemo(() => (variant: 'primary' | 'secondary' | 'tertiary' | 'accent' = 'primary') => {
    switch (variant) {
      case 'primary':
        return colors.text.primary;
      case 'secondary':
        return colors.text.secondary;
      case 'tertiary':
        return colors.text.tertiary;
      case 'accent':
        return designTokens.colors.primary[500];
      default:
        return colors.text.primary;
    }
  }, [colors]);
  
  // 获取背景颜色
  const getBgColor = useMemo(() => (variant: 'primary' | 'secondary' | 'tertiary' | 'elevated' = 'primary') => {
    switch (variant) {
      case 'primary':
        return colors.bg.primary;
      case 'secondary':
        return colors.bg.secondary;
      case 'tertiary':
        return colors.bg.tertiary;
      case 'elevated':
        return colors.bg.elevated;
      default:
        return colors.bg.primary;
    }
  }, [colors]);
  
  // 获取边框颜色
  const getBorderColor = useMemo(() => (variant: 'primary' | 'secondary' | 'tertiary' = 'primary') => {
    switch (variant) {
      case 'primary':
        return colors.border.primary;
      case 'secondary':
        return colors.border.secondary;
      case 'tertiary':
        return colors.border.tertiary;
      default:
        return colors.border.primary;
    }
  }, [colors]);
  
  // 生成渐变背景
  const getGradient = useMemo(() => (direction: 'to-r' | 'to-b' | 'to-br' = 'to-r') => {
    const directionMap = {
      'to-r': 'to right',
      'to-b': 'to bottom',
      'to-br': 'to bottom right',
    };
    
    return `linear-gradient(${directionMap[direction]}, ${designTokens.colors.primary[500]}, ${designTokens.colors.primary[600]})`;
  }, []);
  
  // 获取悬停效果样式
  const getHoverStyle = useMemo(() => (type: 'lift' | 'glow' | 'scale' = 'lift') => {
    switch (type) {
      case 'lift':
        return {
          transform: 'translateY(-2px)',
          boxShadow: shadows.lg,
        };
      case 'glow':
        return {
          boxShadow: `0 0 20px ${designTokens.colors.primary[500]}40`,
        };
      case 'scale':
        return {
          transform: 'scale(1.02)',
        };
      default:
        return {};
    }
  }, [shadows]);
  
  return {
    // 基础主题状态
    isDark,
    toggleTheme,
    
    // 颜色配置
    colors,
    shadows,
    
    // 预设样式
    getCardStyle,
    getPageStyle,
    getInputStyle,
    getButtonStyle,
    
    // 颜色获取函数
    getStatusColor,
    getTextColor,
    getBgColor,
    getBorderColor,
    
    // 特效函数
    getGradient,
    getHoverStyle,
    
    // 设计令牌
    tokens: designTokens,
  };
}
