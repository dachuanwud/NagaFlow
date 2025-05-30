import React, { useEffect, useState } from 'react';
import { Row, Col, Card, Statistic, Progress, List, Tag, Button, Space } from 'antd';
import {
  RobotOutlined,
  TrophyOutlined,
  ClockCircleOutlined,
  LineChartOutlined,
  ArrowUpOutlined,
  ArrowDownOutlined,
  PlayCircleOutlined,
  DownloadOutlined,
} from '@ant-design/icons';
import { useThemeStore } from '../../stores/themeStore';
import { PerformanceChart } from '../../components/Charts';
import { mockApi } from '../../services/mockApi';
import './index.css';

interface StatCardProps {
  title: string;
  value: string | number;
  change?: string;
  changeType?: 'positive' | 'negative' | 'neutral';
  icon: React.ReactNode;
  color: string;
}

const StatCard: React.FC<StatCardProps> = ({ title, value, change, changeType, icon, color }) => {
  const { isDark } = useThemeStore();

  return (
    <Card
      style={{
        background: isDark ? '#242b3d' : '#ffffff',
        border: `1px solid ${isDark ? '#3a4553' : '#f0f0f0'}`,
      }}
      bodyStyle={{ padding: '24px' }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <div style={{ color: isDark ? '#a0a9c0' : '#666', fontSize: '14px', marginBottom: '8px' }}>
            {title}
          </div>
          <Statistic
            value={value}
            valueStyle={{ fontSize: '32px', fontWeight: 'bold' }}
          />
          {change && (
            <div style={{
              color: changeType === 'positive' ? '#00ff88' : changeType === 'negative' ? '#ff4757' : '#a0a9c0',
              fontSize: '14px',
              marginTop: '8px',
              display: 'flex',
              alignItems: 'center',
              gap: '4px'
            }}>
              {changeType === 'positive' && <ArrowUpOutlined />}
              {changeType === 'negative' && <ArrowDownOutlined />}
              {change}
            </div>
          )}
        </div>
        <div style={{
          width: '40px',
          height: '40px',
          borderRadius: '8px',
          background: `${color}20`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: color,
          fontSize: '18px'
        }}>
          {icon}
        </div>
      </div>
    </Card>
  );
};

export const Dashboard: React.FC = () => {
  const { isDark } = useThemeStore();
  const [performanceData, setPerformanceData] = useState<any>(null);

  useEffect(() => {
    // Use mock API to generate performance data
    const data = mockApi.generatePerformanceData();
    setPerformanceData(data);
  }, []);

  const recentActivities = [
    {
      title: 'AI_Momentum_v2.1 Generated',
      description: '2 hours ago • LLM Generator',
      status: 'success',
    },
    {
      title: 'Backtest Completed: Portfolio_Alpha_Mix',
      description: '4 hours ago • 89.2% Annual Return',
      status: 'completed',
    },
    {
      title: 'Genetic Algorithm Optimization Started',
      description: '6 hours ago • 3 factors evolving',
      status: 'running',
    },
  ];

  const topFactors = [
    { name: 'AI_Momentum_Enhanced', type: 'LLM', return: 94.7, updated: '2h ago' },
    { name: 'Volume_AI_Pattern', type: 'ML', return: 87.3, updated: '4h ago' },
    { name: 'Genetic_Optimized_v3', type: 'GA', return: 82.9, updated: '1d ago' },
  ];

  return (
    <div className="dashboard">
      {/* 统计卡片 */}
      <Row gutter={[24, 24]} style={{ marginBottom: '32px' }}>
        <Col xs={24} sm={12} lg={6}>
          <StatCard
            title="Active AI Factors"
            value={24}
            change="+12% this week"
            changeType="positive"
            icon={<RobotOutlined />}
            color="#00d4ff"
          />
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <StatCard
            title="Best Factor Performance"
            value="94.7%"
            change="Annual Return"
            changeType="positive"
            icon={<TrophyOutlined />}
            color="#00ff88"
          />
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <StatCard
            title="Running Backtests"
            value={3}
            change="Processing..."
            changeType="neutral"
            icon={<ClockCircleOutlined />}
            color="#ffc107"
          />
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <StatCard
            title="Sharpe Ratio"
            value={2.84}
            change="+0.3 vs benchmark"
            changeType="positive"
            icon={<LineChartOutlined />}
            color="#00d4ff"
          />
        </Col>
      </Row>

      <Row gutter={[24, 24]}>
        {/* 主要内容区域 */}
        <Col xs={24} lg={16}>
          <Space direction="vertical" size="large" style={{ width: '100%' }}>
            {/* 性能图表 */}
            <Card
              title="Portfolio Performance"
              extra={
                <Space>
                  <Button size="small">1D</Button>
                  <Button size="small">1W</Button>
                  <Button size="small" type="primary">1M</Button>
                  <Button size="small">1Y</Button>
                </Space>
              }
              style={{
                background: isDark ? '#242b3d' : '#ffffff',
                border: `1px solid ${isDark ? '#3a4553' : '#f0f0f0'}`,
              }}
            >
              <PerformanceChart
                data={performanceData}
                height={320}
                title="Portfolio Performance"
              />
            </Card>

            {/* 最近活动 */}
            <Card
              title="Recent Activity"
              extra={<Button type="link">View All</Button>}
              style={{
                background: isDark ? '#242b3d' : '#ffffff',
                border: `1px solid ${isDark ? '#3a4553' : '#f0f0f0'}`,
              }}
            >
              <List
                dataSource={recentActivities}
                renderItem={(item) => (
                  <List.Item>
                    <List.Item.Meta
                      title={item.title}
                      description={item.description}
                    />
                    <Tag color={
                      item.status === 'success' ? 'green' :
                      item.status === 'completed' ? 'blue' : 'orange'
                    }>
                      {item.status}
                    </Tag>
                  </List.Item>
                )}
              />
            </Card>
          </Space>
        </Col>

        {/* 侧边栏 */}
        <Col xs={24} lg={8}>
          <Space direction="vertical" size="large" style={{ width: '100%' }}>
            {/* 顶级因子 */}
            <Card
              title="Top AI Factors"
              extra={<Button type="link">Refresh</Button>}
              style={{
                background: isDark ? '#242b3d' : '#ffffff',
                border: `1px solid ${isDark ? '#3a4553' : '#f0f0f0'}`,
              }}
            >
              <List
                dataSource={topFactors}
                renderItem={(item) => (
                  <List.Item>
                    <List.Item.Meta
                      title={item.name}
                      description={`${item.type} • Updated ${item.updated}`}
                    />
                    <div style={{ textAlign: 'right' }}>
                      <div style={{
                        fontSize: '18px',
                        fontWeight: 'bold',
                        color: '#00ff88'
                      }}>
                        {item.return}%
                      </div>
                      <small style={{ color: isDark ? '#a0a9c0' : '#666' }}>Return</small>
                    </div>
                  </List.Item>
                )}
              />
            </Card>

            {/* 快速操作 */}
            <Card
              title="Quick Actions"
              style={{
                background: isDark ? '#242b3d' : '#ffffff',
                border: `1px solid ${isDark ? '#3a4553' : '#f0f0f0'}`,
              }}
            >
              <Space direction="vertical" style={{ width: '100%' }} size="middle">
                <Button type="primary" block icon={<RobotOutlined />}>
                  Generate New Factor
                </Button>
                <Button block icon={<PlayCircleOutlined />}>
                  Run Backtest
                </Button>
                <Button block icon={<DownloadOutlined />}>
                  Export Results
                </Button>
              </Space>
            </Card>
          </Space>
        </Col>
      </Row>
    </div>
  );
};
