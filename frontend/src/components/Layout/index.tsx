import React, { useState } from 'react';
import { Layout as AntLayout, Menu, Button, Typography, Space, Avatar, Badge, Dropdown, Input, Tooltip } from 'antd';
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
  BellOutlined,
  UserOutlined,
  SearchOutlined,
  LogoutOutlined,
  ProfileOutlined,
  GlobalOutlined,
} from '@ant-design/icons';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useThemeStore } from '../../stores/themeStore';
import { useTranslation } from '../../hooks/useTranslation';
import { useResponsive } from '../../hooks/useResponsive';
import { designTokens, getThemeColors } from '../../styles/designSystem';
import './index.css';

const { Header, Sider, Content } = AntLayout;
const { Title } = Typography;
const { Search } = Input;

interface LayoutProps {
  children: React.ReactNode;
}

export const Layout: React.FC<LayoutProps> = ({ children }) => {
  const [collapsed, setCollapsed] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { isDark, toggleTheme } = useThemeStore();
  const { t } = useTranslation();
  const { isMobile, isTablet } = useResponsive();
  const themeColors = getThemeColors(isDark);

  // 在移动端默认收起侧边栏
  React.useEffect(() => {
    if (isMobile) {
      setCollapsed(true);
    }
  }, [isMobile]);

  const menuItems = [
    {
      key: '/dashboard',
      icon: <DashboardOutlined />,
      label: t('nav.dashboard'),
    },
    {
      key: '/data',
      icon: <DatabaseOutlined />,
      label: t('nav.dataManagement'),
    },
    {
      key: '/strategies',
      icon: <CodeOutlined />,
      label: t('nav.strategyManagement'),
    },
    {
      key: '/backtest',
      icon: <HistoryOutlined />,
      label: t('nav.backtest'),
    },
    {
      key: '/results',
      icon: <BarChartOutlined />,
      label: t('nav.results'),
    },
    {
      key: '/settings',
      icon: <SettingOutlined />,
      label: t('nav.settings'),
    },
  ];

  const handleMenuClick = ({ key }: { key: string }) => {
    navigate(key);
  };

  // 用户菜单项
  const userMenuItems = [
    {
      key: 'profile',
      icon: <ProfileOutlined />,
      label: t('nav.profile'),
    },
    {
      key: 'settings',
      icon: <SettingOutlined />,
      label: t('nav.settings'),
    },
    {
      key: 'language',
      icon: <GlobalOutlined />,
      label: t('nav.language'),
    },
    {
      type: 'divider' as const,
    },
    {
      key: 'logout',
      icon: <LogoutOutlined />,
      label: t('nav.logout'),
      danger: true,
    },
  ];

  const handleUserMenuClick = ({ key }: { key: string }) => {
    switch (key) {
      case 'profile':
        navigate('/profile');
        break;
      case 'settings':
        navigate('/settings');
        break;
      case 'logout':
        // 处理登出逻辑
        console.log('Logout clicked');
        break;
      default:
        break;
    }
  };

  const handleSearch = (value: string) => {
    console.log('Search:', value);
    // 实现搜索逻辑
  };

  return (
    <AntLayout style={{ minHeight: '100vh' }}>
      <motion.div
        initial={{ x: -280 }}
        animate={{ x: 0 }}
        transition={{ duration: 0.3, ease: 'easeOut' }}
        style={{ position: 'relative', zIndex: 1 }}
      >
        <Sider
          trigger={null}
          collapsible
          collapsed={collapsed}
          theme={isDark ? 'dark' : 'light'}
          style={{
            background: themeColors.bg.secondary,
            borderRight: `1px solid ${themeColors.border.primary}`,
            boxShadow: isDark ? designTokens.shadowsDark.lg : designTokens.shadows.lg,
            position: 'fixed',
            left: 0,
            top: 0,
            bottom: 0,
            zIndex: 1000,
            height: '100vh',
            overflow: 'auto',
          }}
        >
          <motion.div
            className="logo-container"
            whileHover={{ scale: 1.02 }}
            transition={{ duration: 0.2 }}
          >
            <div className="logo">
              <motion.div
                animate={{ rotate: [0, 360] }}
                transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
              >
                <BarChartOutlined style={{ fontSize: '24px', color: '#00d4ff' }} />
              </motion.div>
              {!collapsed && (
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.2 }}
                >
                  <Title level={4} style={{ margin: 0, color: designTokens.colors.primary[500] }}>
                    NagaFlow
                  </Title>
                </motion.div>
              )}
            </div>
          </motion.div>

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
      </motion.div>

      <AntLayout style={{
        marginLeft: isMobile ? 0 : (collapsed ? 80 : 200),
        transition: 'margin-left 0.3s ease'
      }}>
        <Header
          style={{
            padding: `0 ${designTokens.spacing['2xl']}`,
            background: themeColors.bg.secondary,
            borderBottom: `1px solid ${themeColors.border.primary}`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            boxShadow: isDark ? designTokens.shadowsDark.sm : designTokens.shadows.sm,
            position: 'fixed',
            top: 0,
            right: 0,
            left: isMobile ? 0 : (collapsed ? 80 : 200),
            zIndex: 999,
            transition: 'left 0.3s ease',
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

          <Space size="middle">
            {/* 搜索框 */}
            <Search
              placeholder={t('common.searchPlaceholder')}
              allowClear
              onSearch={handleSearch}
              style={{
                width: 280,
                marginRight: designTokens.spacing.md,
              }}
              size="middle"
            />

            {/* 通知图标 */}
            <Tooltip title={t('common.notifications')}>
              <Badge count={3} size="small">
                <Button
                  type="text"
                  icon={<BellOutlined />}
                  style={{
                    fontSize: '16px',
                    color: themeColors.text.secondary,
                  }}
                />
              </Badge>
            </Tooltip>

            {/* 主题切换 */}
            <Tooltip title={isDark ? t('common.lightMode') : t('common.darkMode')}>
              <Button
                type="text"
                icon={<BulbOutlined />}
                onClick={toggleTheme}
                style={{
                  fontSize: '16px',
                  color: themeColors.text.secondary,
                }}
              />
            </Tooltip>

            {/* 用户头像和菜单 */}
            <Dropdown
              menu={{
                items: userMenuItems,
                onClick: handleUserMenuClick,
              }}
              placement="bottomRight"
              trigger={['click']}
            >
              <Space className="user-avatar-section" style={{ cursor: 'pointer' }}>
                <Avatar
                  size="default"
                  icon={<UserOutlined />}
                  style={{
                    backgroundColor: designTokens.colors.primary[500],
                  }}
                />
                <span style={{
                  color: themeColors.text.primary,
                  fontWeight: designTokens.typography.fontWeight.medium,
                }}>
                  {t('common.trader')}
                </span>
              </Space>
            </Dropdown>
          </Space>
        </Header>

        <Content
          style={{
            margin: `${designTokens.spacing['2xl']} ${designTokens.spacing['2xl']} ${designTokens.spacing['2xl']} ${designTokens.spacing['2xl']}`,
            marginTop: '88px', // Account for fixed header height
            padding: '0',
            background: 'transparent',
            overflow: 'auto',
            minHeight: 'calc(100vh - 88px)',
          }}
        >
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, ease: 'easeOut' }}
            style={{
              background: themeColors.bg.primary,
              borderRadius: designTokens.borderRadius.xl,
              padding: designTokens.spacing['2xl'],
              minHeight: 'calc(100vh - 152px)', // Adjusted for header and margins
              boxShadow: isDark ? designTokens.shadowsDark.lg : designTokens.shadows.lg,
            }}
          >
            {children}
          </motion.div>
        </Content>
      </AntLayout>
    </AntLayout>
  );
};
