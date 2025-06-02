import React from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import { ConfigProvider, theme } from 'antd';
import zhCN from 'antd/locale/zh_CN';
import dayjs from 'dayjs';
import 'dayjs/locale/zh-cn';
import { AnimatePresence } from 'framer-motion';
import { Layout } from './components/Layout';
import { Dashboard } from './pages/Dashboard';
import { DataManagement } from './pages/DataManagement';
import { BacktestPage } from './pages/BacktestPage';
import { BacktestPageDebug } from './pages/BacktestPage/debug';
import { TestSubmitPage } from './pages/BacktestPage/test-submit';
import { StrategyManagement } from './pages/StrategyManagement';
import { Results } from './pages/Results';
import { useThemeStore } from './stores/themeStore';
import { useLoadingStore } from './stores/loadingStore';
import { GlobalLoading } from './components/Loading';
import { designTokens, getThemeColors } from './styles/designSystem';
import './App.css';

// 设置 dayjs 中文本地化
dayjs.locale('zh-cn');

// 路由动画包装组件
const AnimatedRoutes: React.FC = () => {
  const location = useLocation();

  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
        <Route path="/" element={<Dashboard />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/data" element={<DataManagement />} />
        <Route path="/backtest" element={<BacktestPage />} />
        <Route path="/backtest-test" element={<TestSubmitPage />} />
        <Route path="/strategies" element={<StrategyManagement />} />
        <Route path="/results" element={<Results />} />
      </Routes>
    </AnimatePresence>
  );
};

function App() {
  const { isDark } = useThemeStore();
  const { globalLoading } = useLoadingStore();
  const themeColors = getThemeColors(isDark);

  return (
    <ConfigProvider
      locale={zhCN}
      theme={{
        algorithm: isDark ? theme.darkAlgorithm : theme.defaultAlgorithm,
        token: {
          colorPrimary: designTokens.colors.primary[500],
          colorBgContainer: themeColors.bg.secondary,
          colorBgElevated: themeColors.bg.elevated,
          colorBgLayout: themeColors.bg.primary,
          colorText: themeColors.text.primary,
          colorTextSecondary: themeColors.text.secondary,
          colorTextTertiary: themeColors.text.tertiary,
          colorBorder: themeColors.border.primary,
          colorBorderSecondary: themeColors.border.secondary,
          borderRadius: parseInt(designTokens.borderRadius.lg),
          borderRadiusLG: parseInt(designTokens.borderRadius.xl),
          borderRadiusSM: parseInt(designTokens.borderRadius.md),
          fontFamily: designTokens.typography.fontFamily.primary,
          fontSize: parseInt(designTokens.typography.fontSize.md),
          wireframe: false,
        },
        components: {
          Card: {
            borderRadiusLG: parseInt(designTokens.borderRadius.xl),
            paddingLG: parseInt(designTokens.spacing['2xl']),
            boxShadowTertiary: isDark ? designTokens.shadowsDark.md : designTokens.shadows.md,
          },
          Button: {
            borderRadius: parseInt(designTokens.borderRadius.md),
            paddingContentHorizontal: parseInt(designTokens.spacing.lg),
          },
          Table: {
            borderRadiusLG: parseInt(designTokens.borderRadius.lg),
          },
          Input: {
            borderRadius: parseInt(designTokens.borderRadius.md),
            paddingBlock: parseInt(designTokens.spacing.sm),
            paddingInline: parseInt(designTokens.spacing.md),
          },
          Select: {
            borderRadius: parseInt(designTokens.borderRadius.md),
          },
        },
      }}
    >
      <Router>
        <Layout>
          <AnimatedRoutes />
        </Layout>
        <GlobalLoading loading={globalLoading} />
      </Router>
    </ConfigProvider>
  );
}

export default App;
