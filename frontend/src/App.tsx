import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ConfigProvider, theme } from 'antd';
import { Layout } from './components/Layout';
import { Dashboard } from './pages/Dashboard';
import { DataManagement } from './pages/DataManagement';
import { BacktestPage } from './pages/BacktestPage';
import { StrategyManagement } from './pages/StrategyManagement';
import { Results } from './pages/Results';
import { useThemeStore } from './stores/themeStore';
import './App.css';

function App() {
  const { isDark } = useThemeStore();

  return (
    <ConfigProvider
      theme={{
        algorithm: isDark ? theme.darkAlgorithm : theme.defaultAlgorithm,
        token: {
          colorPrimary: '#00d4ff',
          colorBgContainer: isDark ? '#242b3d' : '#ffffff',
          colorBgElevated: isDark ? '#1a1f2e' : '#ffffff',
        },
      }}
    >
      <Router>
        <Layout>
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/data" element={<DataManagement />} />
            <Route path="/backtest" element={<BacktestPage />} />
            <Route path="/strategies" element={<StrategyManagement />} />
            <Route path="/results" element={<Results />} />
          </Routes>
        </Layout>
      </Router>
    </ConfigProvider>
  );
}

export default App;
