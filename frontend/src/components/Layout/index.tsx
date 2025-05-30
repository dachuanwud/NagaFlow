import React, { useState } from 'react';
import { Layout as AntLayout, Menu, Button, Typography, Space } from 'antd';
import {
  DashboardOutlined,
  DatabaseOutlined,
  HistoryOutlined,
  SettingOutlined,
  BarChartOutlined,
  CodeOutlined,
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  BulbOutlined,
} from '@ant-design/icons';
import { useNavigate, useLocation } from 'react-router-dom';
import { useThemeStore } from '../../stores/themeStore';
import './index.css';

const { Header, Sider, Content } = AntLayout;
const { Title } = Typography;

interface LayoutProps {
  children: React.ReactNode;
}

export const Layout: React.FC<LayoutProps> = ({ children }) => {
  const [collapsed, setCollapsed] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { isDark, toggleTheme } = useThemeStore();

  const menuItems = [
    {
      key: '/dashboard',
      icon: <DashboardOutlined />,
      label: 'Dashboard',
    },
    {
      key: '/data',
      icon: <DatabaseOutlined />,
      label: '数据管理',
    },
    {
      key: '/strategies',
      icon: <CodeOutlined />,
      label: '策略管理',
    },
    {
      key: '/backtest',
      icon: <HistoryOutlined />,
      label: '回测',
    },
    {
      key: '/results',
      icon: <BarChartOutlined />,
      label: '结果分析',
    },
    {
      key: '/settings',
      icon: <SettingOutlined />,
      label: '设置',
    },
  ];

  const handleMenuClick = ({ key }: { key: string }) => {
    navigate(key);
  };

  return (
    <AntLayout style={{ minHeight: '100vh' }}>
      <Sider
        trigger={null}
        collapsible
        collapsed={collapsed}
        theme={isDark ? 'dark' : 'light'}
        style={{
          background: isDark ? '#1a1f2e' : '#ffffff',
          borderRight: `1px solid ${isDark ? '#3a4553' : '#f0f0f0'}`,
        }}
      >
        <div className="logo-container">
          <div className="logo">
            <BarChartOutlined style={{ fontSize: '24px', color: '#00d4ff' }} />
            {!collapsed && (
              <Title level={4} style={{ margin: 0, color: '#00d4ff' }}>
                NagaFlow
              </Title>
            )}
          </div>
        </div>
        
        <Menu
          theme={isDark ? 'dark' : 'light'}
          mode="inline"
          selectedKeys={[location.pathname]}
          items={menuItems}
          onClick={handleMenuClick}
          style={{
            background: 'transparent',
            border: 'none',
          }}
        />
      </Sider>
      
      <AntLayout>
        <Header
          style={{
            padding: '0 24px',
            background: isDark ? '#242b3d' : '#ffffff',
            borderBottom: `1px solid ${isDark ? '#3a4553' : '#f0f0f0'}`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <Space>
            <Button
              type="text"
              icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
              onClick={() => setCollapsed(!collapsed)}
              style={{
                fontSize: '16px',
                width: 64,
                height: 64,
              }}
            />
            <Title level={3} style={{ margin: 0 }}>
              {menuItems.find(item => item.key === location.pathname)?.label || 'NagaFlow'}
            </Title>
          </Space>
          
          <Space>
            <Button
              type="text"
              icon={<BulbOutlined />}
              onClick={toggleTheme}
              style={{ fontSize: '16px' }}
            />
            <span style={{ color: isDark ? '#a0a9c0' : '#666' }}>
              Welcome back, Trader
            </span>
          </Space>
        </Header>
        
        <Content
          style={{
            margin: '24px',
            padding: '24px',
            background: isDark ? '#0a0e1a' : '#f5f5f5',
            borderRadius: '8px',
            overflow: 'auto',
          }}
        >
          {children}
        </Content>
      </AntLayout>
    </AntLayout>
  );
};
