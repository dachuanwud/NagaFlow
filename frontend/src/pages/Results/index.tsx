import React, { useState, useEffect } from 'react';
import { Card, Row, Col, Statistic, Typography, Space, Spin, Alert, Empty, Tag } from 'antd';
import {
  TrophyOutlined,
  BarChartOutlined,
  DollarOutlined,
  RiseOutlined,
  FallOutlined,
  ReloadOutlined
} from '@ant-design/icons';
import { useThemeStore } from '../../stores/themeStore';
import { useBacktestResultsStore } from '../../stores/backtestResultsStore';
import { StrategySelector, StrategyComparison } from '../../components/BacktestResults';

const { Title, Text } = Typography;

export const Results: React.FC = () => {
  const { isDark } = useThemeStore();
  const {
    selectedResult,
    compareMode,
    loading,
    error,
    refreshData
  } = useBacktestResultsStore();

  const [pageLoading, setPageLoading] = useState(true);

  const cardStyle = {
    background: isDark ? '#242b3d' : '#ffffff',
    border: `1px solid ${isDark ? '#3a4553' : '#f0f0f0'}`,
    borderRadius: '8px',
  };

  // 初始化数据
  useEffect(() => {
    const initializeData = async () => {
      try {
        setPageLoading(true);
        await refreshData();
      } catch (error) {
        console.error('Failed to initialize results page:', error);
      } finally {
        setPageLoading(false);
      }
    };

    initializeData();
  }, [refreshData]);

  const getValueColor = (value: number, isPositive: boolean = true) => {
    if (value === 0) return isDark ? '#a0a9c0' : '#666666';
    return isPositive
      ? (value > 0 ? '#00ff88' : '#ff4757')
      : (value < 0 ? '#ff4757' : '#00ff88');
  };

  // 页面加载状态
  if (pageLoading) {
    return (
      <div style={{
        padding: '24px',
        background: isDark ? '#0a0e1a' : '#f5f5f5',
        minHeight: '100vh',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center'
      }}>
        <Spin size="large" tip="正在加载回测结果..." />
      </div>
    );
  }

  // 错误状态
  if (error) {
    return (
      <div style={{
        padding: '24px',
        background: isDark ? '#0a0e1a' : '#f5f5f5',
        minHeight: '100vh'
      }}>
        <Alert
          message="加载失败"
          description={error}
          type="error"
          showIcon
          action={
            <Space>
              <ReloadOutlined onClick={refreshData} style={{ cursor: 'pointer' }} />
            </Space>
          }
        />
      </div>
    );
  }

  return (
    <div style={{
      padding: '24px',
      background: isDark ? '#0a0e1a' : '#f5f5f5',
      minHeight: '100vh'
    }}>
      <Space direction="vertical" size="large" style={{ width: '100%' }}>
        {/* 页面标题 */}
        <Card style={cardStyle}>
          <Row justify="space-between" align="middle">
            <Col>
              <Space>
                <BarChartOutlined style={{ fontSize: '24px', color: '#00d4ff' }} />
                <div>
                  <Title level={2} style={{
                    margin: 0,
                    color: isDark ? '#ffffff' : '#000000',
                    fontSize: '24px',
                    fontWeight: 600
                  }}>
                    回测结果分析
                  </Title>
                  <Text type="secondary" style={{ fontSize: '14px' }}>
                    多策略回测结果管理与对比分析
                  </Text>
                </div>
              </Space>
            </Col>
          </Row>
        </Card>

        {/* 策略选择器 */}
        <StrategySelector />

        {/* 策略对比面板 */}
        <StrategyComparison />

        {/* 选中策略的详细统计指标 */}
        {selectedResult ? (
          <Card
            title={
              <Space>
                <TrophyOutlined style={{ color: '#00d4ff' }} />
                <span style={{ color: isDark ? '#ffffff' : '#000000' }}>
                  策略表现详情
                </span>
                <Tag color="blue">
                  {selectedResult.strategy} - {selectedResult.symbol}
                </Tag>
              </Space>
            }
            style={cardStyle}
          >
            <Row gutter={[16, 16]}>
              {/* 总收益率 */}
              <Col xs={24} sm={12} lg={6}>
                <Card style={cardStyle} loading={loading}>
                  <Statistic
                    title={
                      <span style={{ color: isDark ? '#a0a9c0' : '#666666' }}>
                        <DollarOutlined style={{ marginRight: 4 }} />
                        总收益率
                      </span>
                    }
                    value={selectedResult.final_return || 0}
                    precision={2}
                    suffix="%"
                    valueStyle={{
                      color: getValueColor(selectedResult.final_return || 0),
                      fontSize: '20px',
                      fontWeight: 600,
                    }}
                    prefix={selectedResult.final_return && selectedResult.final_return > 0 ? <RiseOutlined /> : <FallOutlined />}
                  />
                </Card>
              </Col>

              {/* 年化收益率 */}
              <Col xs={24} sm={12} lg={6}>
                <Card style={cardStyle} loading={loading}>
                  <Statistic
                    title={
                      <span style={{ color: isDark ? '#a0a9c0' : '#666666' }}>
                        <BarChartOutlined style={{ marginRight: 4 }} />
                        年化收益率
                      </span>
                    }
                    value={selectedResult.annual_return || 0}
                    precision={2}
                    suffix="%"
                    valueStyle={{
                      color: getValueColor(selectedResult.annual_return || 0),
                      fontSize: '20px',
                      fontWeight: 600,
                    }}
                  />
                </Card>
              </Col>

              {/* 最大回撤 */}
              <Col xs={24} sm={12} lg={6}>
                <Card style={cardStyle} loading={loading}>
                  <Statistic
                    title={
                      <span style={{ color: isDark ? '#a0a9c0' : '#666666' }}>
                        <FallOutlined style={{ marginRight: 4 }} />
                        最大回撤
                      </span>
                    }
                    value={Math.abs(selectedResult.max_drawdown || 0)}
                    precision={2}
                    suffix="%"
                    valueStyle={{
                      color: '#ff4757',
                      fontSize: '20px',
                      fontWeight: 600,
                    }}
                  />
                </Card>
              </Col>

              {/* 夏普比率 */}
              <Col xs={24} sm={12} lg={6}>
                <Card style={cardStyle} loading={loading}>
                  <Statistic
                    title={
                      <span style={{ color: isDark ? '#a0a9c0' : '#666666' }}>
                        <TrophyOutlined style={{ marginRight: 4 }} />
                        夏普比率
                      </span>
                    }
                    value={selectedResult.sharpe_ratio || 0}
                    precision={2}
                    valueStyle={{
                      color: (selectedResult.sharpe_ratio || 0) > 1 ? '#00ff88' :
                             (selectedResult.sharpe_ratio || 0) > 0 ? '#00d4ff' : '#ff4757',
                      fontSize: '20px',
                      fontWeight: 600,
                    }}
                  />
                </Card>
              </Col>

              {/* 胜率 */}
              <Col xs={24} sm={12} lg={6}>
                <Card style={cardStyle} loading={loading}>
                  <Statistic
                    title={
                      <span style={{ color: isDark ? '#a0a9c0' : '#666666' }}>
                        <TrophyOutlined style={{ marginRight: 4 }} />
                        胜率
                      </span>
                    }
                    value={selectedResult.win_rate || 0}
                    precision={1}
                    suffix="%"
                    valueStyle={{
                      color: (selectedResult.win_rate || 0) > 50 ? '#00ff88' : '#ff4757',
                      fontSize: '20px',
                      fontWeight: 600,
                    }}
                  />
                </Card>
              </Col>

              {/* 总交易次数 */}
              <Col xs={24} sm={12} lg={6}>
                <Card style={cardStyle} loading={loading}>
                  <Statistic
                    title={
                      <span style={{ color: isDark ? '#a0a9c0' : '#666666' }}>
                        <BarChartOutlined style={{ marginRight: 4 }} />
                        总交易次数
                      </span>
                    }
                    value={selectedResult.total_trades || 0}
                    valueStyle={{
                      color: '#00d4ff',
                      fontSize: '20px',
                      fontWeight: 600,
                    }}
                  />
                </Card>
              </Col>

              {/* 波动率 */}
              <Col xs={24} sm={12} lg={6}>
                <Card style={cardStyle} loading={loading}>
                  <Statistic
                    title={
                      <span style={{ color: isDark ? '#a0a9c0' : '#666666' }}>
                        <BarChartOutlined style={{ marginRight: 4 }} />
                        波动率
                      </span>
                    }
                    value={selectedResult.volatility || 0}
                    precision={1}
                    suffix="%"
                    valueStyle={{
                      color: '#ffa726',
                      fontSize: '20px',
                      fontWeight: 600,
                    }}
                  />
                </Card>
              </Col>

              {/* 盈利因子 */}
              <Col xs={24} sm={12} lg={6}>
                <Card style={cardStyle} loading={loading}>
                  <Statistic
                    title={
                      <span style={{ color: isDark ? '#a0a9c0' : '#666666' }}>
                        <DollarOutlined style={{ marginRight: 4 }} />
                        盈利因子
                      </span>
                    }
                    value={selectedResult.profit_factor || 0}
                    precision={2}
                    valueStyle={{
                      color: (selectedResult.profit_factor || 0) > 1 ? '#00ff88' : '#ff4757',
                      fontSize: '20px',
                      fontWeight: 600,
                    }}
                  />
                </Card>
              </Col>
            </Row>
          </Card>
        ) : (
          // 未选择策略时的提示
          <Card style={cardStyle}>
            <Empty
              image={Empty.PRESENTED_IMAGE_SIMPLE}
              description={
                <Text style={{ color: isDark ? '#a0a9c0' : '#666666' }}>
                  请从上方策略选择器中选择一个策略查看详细结果
                </Text>
              }
            />
          </Card>
        )}

      </Space>
    </div>
  );
};
