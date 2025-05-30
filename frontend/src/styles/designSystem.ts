// 统一设计系统配置
export const designTokens = {
  // 颜色系统
  colors: {
    // 主色调
    primary: {
      50: '#e6f9ff',
      100: '#b3f0ff',
      200: '#80e7ff',
      300: '#4ddeff',
      400: '#1ad5ff',
      500: '#00d4ff', // 主色
      600: '#00b8e6',
      700: '#009bcc',
      800: '#007eb3',
      900: '#006199',
    },
    
    // 成功色
    success: {
      50: '#e6fff2',
      100: '#b3ffdb',
      200: '#80ffc4',
      300: '#4dffad',
      400: '#1aff96',
      500: '#00ff88', // 成功色
      600: '#00e67a',
      700: '#00cc6c',
      800: '#00b35e',
      900: '#009950',
    },
    
    // 错误色
    error: {
      50: '#ffe6e6',
      100: '#ffb3b3',
      200: '#ff8080',
      300: '#ff4d4d',
      400: '#ff1a1a',
      500: '#ff4757', // 错误色
      600: '#e6404e',
      700: '#cc3945',
      800: '#b3323c',
      900: '#992b33',
    },
    
    // 警告色
    warning: {
      50: '#fff9e6',
      100: '#ffecb3',
      200: '#ffdf80',
      300: '#ffd24d',
      400: '#ffc51a',
      500: '#ffc107', // 警告色
      600: '#e6ad06',
      700: '#cc9a05',
      800: '#b38604',
      900: '#997303',
    },
    
    // 中性色 - 浅色主题
    light: {
      bg: {
        primary: '#ffffff',
        secondary: '#f8f9fa',
        tertiary: '#f5f5f5',
        elevated: '#ffffff',
      },
      text: {
        primary: '#1a1a1a',
        secondary: '#666666',
        tertiary: '#999999',
        disabled: '#cccccc',
      },
      border: {
        primary: '#e0e0e0',
        secondary: '#f0f0f0',
        tertiary: '#f5f5f5',
      },
    },
    
    // 中性色 - 深色主题
    dark: {
      bg: {
        primary: '#0a0e1a',
        secondary: '#1a1f2e',
        tertiary: '#242b3d',
        elevated: '#2a3441',
      },
      text: {
        primary: '#ffffff',
        secondary: '#a0a9c0',
        tertiary: '#6b7280',
        disabled: '#4b5563',
      },
      border: {
        primary: '#3a4553',
        secondary: '#2d3748',
        tertiary: '#1a202c',
      },
    },
  },
  
  // 间距系统
  spacing: {
    xs: '4px',
    sm: '8px',
    md: '12px',
    lg: '16px',
    xl: '20px',
    '2xl': '24px',
    '3xl': '32px',
    '4xl': '40px',
    '5xl': '48px',
    '6xl': '64px',
  },
  
  // 圆角系统
  borderRadius: {
    none: '0',
    sm: '4px',
    md: '6px',
    lg: '8px',
    xl: '12px',
    '2xl': '16px',
    '3xl': '24px',
    full: '9999px',
  },
  
  // 阴影系统
  shadows: {
    none: 'none',
    sm: '0 1px 2px rgba(0, 0, 0, 0.05)',
    md: '0 4px 6px rgba(0, 0, 0, 0.07)',
    lg: '0 10px 15px rgba(0, 0, 0, 0.1)',
    xl: '0 20px 25px rgba(0, 0, 0, 0.1)',
    '2xl': '0 25px 50px rgba(0, 0, 0, 0.25)',
    inner: 'inset 0 2px 4px rgba(0, 0, 0, 0.06)',
  },
  
  // 深色主题阴影
  shadowsDark: {
    none: 'none',
    sm: '0 1px 2px rgba(0, 0, 0, 0.2)',
    md: '0 4px 6px rgba(0, 0, 0, 0.3)',
    lg: '0 10px 15px rgba(0, 0, 0, 0.4)',
    xl: '0 20px 25px rgba(0, 0, 0, 0.5)',
    '2xl': '0 25px 50px rgba(0, 0, 0, 0.6)',
    inner: 'inset 0 2px 4px rgba(0, 0, 0, 0.3)',
  },
  
  // 字体系统
  typography: {
    fontFamily: {
      primary: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif",
      mono: "'JetBrains Mono', 'Fira Code', 'Monaco', monospace",
    },
    fontSize: {
      xs: '12px',
      sm: '14px',
      md: '16px',
      lg: '18px',
      xl: '20px',
      '2xl': '24px',
      '3xl': '30px',
      '4xl': '36px',
      '5xl': '48px',
    },
    fontWeight: {
      light: 300,
      normal: 400,
      medium: 500,
      semibold: 600,
      bold: 700,
    },
    lineHeight: {
      tight: 1.25,
      normal: 1.5,
      relaxed: 1.75,
    },
  },
  
  // 动画系统
  animation: {
    duration: {
      fast: '0.15s',
      normal: '0.3s',
      slow: '0.5s',
    },
    easing: {
      ease: 'cubic-bezier(0.25, 0.46, 0.45, 0.94)',
      easeIn: 'cubic-bezier(0.4, 0, 1, 1)',
      easeOut: 'cubic-bezier(0, 0, 0.2, 1)',
      easeInOut: 'cubic-bezier(0.4, 0, 0.2, 1)',
    },
  },
  
  // 断点系统
  breakpoints: {
    xs: '0px',
    sm: '576px',
    md: '768px',
    lg: '992px',
    xl: '1200px',
    '2xl': '1400px',
  },
  
  // Z-index 层级
  zIndex: {
    dropdown: 1000,
    sticky: 1020,
    fixed: 1030,
    modal: 1040,
    popover: 1050,
    tooltip: 1060,
    toast: 1070,
  },
};

// 主题获取函数
export const getThemeColors = (isDark: boolean) => {
  return isDark ? designTokens.colors.dark : designTokens.colors.light;
};

// 响应式断点工具
export const mediaQueries = {
  xs: `@media (min-width: ${designTokens.breakpoints.xs})`,
  sm: `@media (min-width: ${designTokens.breakpoints.sm})`,
  md: `@media (min-width: ${designTokens.breakpoints.md})`,
  lg: `@media (min-width: ${designTokens.breakpoints.lg})`,
  xl: `@media (min-width: ${designTokens.breakpoints.xl})`,
  '2xl': `@media (min-width: ${designTokens.breakpoints['2xl']})`,
};
