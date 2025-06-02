import React from 'react';
import { Card, Table, Space, Tag, Typography, Row, Col, Statistic } from 'antd';
import { 
  TrophyOutlined,
  RiseOutlined,
  FallOutlined,
  BarChartOutlined,
  DollarOutlined
} from '@ant-design/icons';
import { useThemeStore } from '../../stores/themeStore';
import { useBacktestResultsStore } from '../../stores/backtestResultsStore';
import { BacktestResult } from '../../services/api';

const { Text, Title } = Typography;

export const StrategyComparison: React.FC = () => {
  const { isDark } = useThemeStore();
  const { compareResults, compareMode } = useBacktestResultsStore();

  const cardStyle = {
    background: isDark ? '#242b3d' : '#ffffff',
    border: `1px solid ${isDark ? '#3a4553' : '#f0f0f0'}`,
    borderRadius: '8px',
  };

  // 如果不在对比模式或没有对比数据，不显示
  if (!compareMode || compareResults.length === 0) {
    return null;
  }

  // 获取颜色
  const getValueColor = (value: number, isPositive: boolean = true) => {
    if (value === 0) return isDark ? '#a0a9c0' : '#666666';
    return isPositive 
      ? (value > 0 ? '#00ff88' : '#ff4757')
      : (value < 0 ? '#ff4757' : '#00ff88');
  };

  // 对比表格列定义
  const columns = [
    {
      title: '指标',
      dataIndex: 'metric',
      key: 'metric',
      fixed: 'left' as const,
      width: 120,
      render: (text: string) => (
        <Text strong style={{ color: isDark ? '#ffffff' : '#000000' }}>
          {text}
        </Text>
      ),
    },
    ...compareResults.map((result, index) => ({
      title: (
        <div style={{ textAlign: 'center' }}>
          <div style={{ color: isDark ? '#ffffff' : '#000000', fontWeight: 600 }}>
            {result.strategy || '策略'}
          </div>
          <div style={{ color: isDark ? '#a0a9c0' : '#666666', fontSize: '12px' }}>
            {result.symbol}
          </div>
        </div>
      ),
      dataIndex: `strategy_${index}`,
      key: `strategy_${index}`,
      width: 150,
      align: 'center' as const,
    })),
  ];

  // 构建对比数据
  const comparisonData = [
    {
      key: 'total_return',
      metric: '总收益率',
      ...compareResults.reduce((acc, result, index) => ({
        ...acc,
        [`strategy_${index}`]: (
          <Statistic
            value={result.final_return || 0}
            precision={2}
            suffix="%"
            valueStyle={{
              color: getValueColor(result.final_return || 0),
              fontSize: '14px',
            }}
            prefix={result.final_return && result.final_return > 0 ? <RiseOutlined /> : <FallOutlined />}
          />
        ),
      }), {}),
    },
    {
      key: 'annual_return',
      metric: '年化收益率',
      ...compareResults.reduce((acc, result, index) => ({
        ...acc,
        [`strategy_${index}`]: (
          <Statistic
            value={result.annual_return || 0}
            precision={2}
            suffix="%"
            valueStyle={{
              color: getValueColor(result.annual_return || 0),
              fontSize: '14px',
            }}
          />
        ),
      }), {}),
    },
    {
      key: 'max_drawdown',
      metric: '最大回撤',
      ...compareResults.reduce((acc, result, index) => ({
        ...acc,
        [`strategy_${index}`]: (
          <Statistic
            value={Math.abs(result.max_drawdown || 0)}
            precision={2}
            suffix="%"
            valueStyle={{
              color: '#ff4757',
              fontSize: '14px',
            }}
          />
        ),
      }), {}),
    },
    {
      key: 'sharpe_ratio',
      metric: '夏普比率',
      ...compareResults.reduce((acc, result, index) => ({
        ...acc,
        [`strategy_${index}`]: (
          <Statistic
            value={result.sharpe_ratio || 0}
            precision={2}
            valueStyle={{
              color: (result.sharpe_ratio || 0) > 1 ? '#00ff88' : 
                     (result.sharpe_ratio || 0) > 0 ? '#00d4ff' : '#ff4757',
              fontSize: '14px',
            }}
          />
        ),
      }), {}),
    },
    {
      key: 'win_rate',
      metric: '胜率',
      ...compareResults.reduce((acc, result, index) => ({
        ...acc,
        [`strategy_${index}`]: (
          <Statistic
            value={result.win_rate || 0}
            precision={1}
            suffix="%"
            valueStyle={{
              color: (result.win_rate || 0) > 50 ? '#00ff88' : '#ff4757',
              fontSize: '14px',
            }}
          />
        ),
      }), {}),
    },
    {
      key: 'total_trades',
      metric: '总交易次数',
      ...compareResults.reduce((acc, result, index) => ({
        ...acc,
        [`strategy_${index}`]: (
          <Statistic
            value={result.total_trades || 0}
            valueStyle={{
              color: '#00d4ff',
              fontSize: '14px',
            }}
          />
        ),
      }), {}),
    },
    {
      key: 'profit_factor',
      metric: '盈利因子',
      ...compareResults.reduce((acc, result, index) => ({
        ...acc,
        [`strategy_${index}`]: (
          <Statistic
            value={result.profit_factor || 0}
            precision={2}
            valueStyle={{
              color: (result.profit_factor || 0) > 1 ? '#00ff88' : '#ff4757',
              fontSize: '14px',
            }}
          />
        ),
      }), {}),
    },
    {
      key: 'volatility',
      metric: '波动率',
      ...compareResults.reduce((acc, result, index) => ({
        ...acc,
        [`strategy_${index}`]: (
          <Statistic
            value={result.volatility || 0}
            precision={1}
            suffix="%"
            valueStyle={{
              color: '#ffa726',
              fontSize: '14px',
            }}
          />
        ),
      }), {}),
    },
  ];

  // 计算最佳策略
  const getBestStrategy = (metric: keyof BacktestResult, isHigherBetter: boolean = true) => {
    if (compareResults.length === 0) return -1;
    
    let bestIndex = 0;
    let bestValue = compareResults[0][metric] as number || 0;
    
    compareResults.forEach((result, index) => {
      const value = result[metric] as number || 0;
      if (isHigherBetter ? value > bestValue : value < bestValue) {
        bestValue = value;
        bestIndex = index;
      }
    });
    
    return bestIndex;
  };

  return (
    <Card
      title={
        <Space>
          <BarChartOutlined style={{ color: '#00d4ff' }} />
          <span style={{ color: isDark ? '#ffffff' : '#000000' }}>
            策略对比分析
          </span>
          <Tag color="blue">{compareResults.length} 个策略</Tag>
        </Space>
      }
      style={cardStyle}
    >
      <Space direction="vertical" style={{ width: '100%' }} size="large">
        {/* 快速对比概览 */}
        <Row gutter={[16, 16]}>
          <Col xs={24} sm={12} lg={6}>
            <Card style={cardStyle} size="small">
              <Statistic
                title={
                  <span style={{ color: isDark ? '#a0a9c0' : '#666666' }}>
                    <TrophyOutlined style={{ marginRight: 4 }} />
                    最佳收益
                  </span>
                }
                value={Math.max(...compareResults.map(r => r.final_return || 0))}
                precision={2}
                suffix="%"
                valueStyle={{
                  color: '#00ff88',
                  fontSize: '18px',
                  fontWeight: 600,
                }}
              />
            </Card>
          </Col>
          
          <Col xs={24} sm={12} lg={6}>
            <Card style={cardStyle} size="small">
              <Statistic
                title={
                  <span style={{ color: isDark ? '#a0a9c0' : '#666666' }}>
                    <BarChartOutlined style={{ marginRight: 4 }} />
                    最佳夏普
                  </span>
                }
                value={Math.max(...compareResults.map(r => r.sharpe_ratio || 0))}
                precision={2}
                valueStyle={{
                  color: '#00d4ff',
                  fontSize: '18px',
                  fontWeight: 600,
                }}
              />
            </Card>
          </Col>
          
          <Col xs={24} sm={12} lg={6}>
            <Card style={cardStyle} size="small">
              <Statistic
                title={
                  <span style={{ color: isDark ? '#a0a9c0' : '#666666' }}>
                    <FallOutlined style={{ marginRight: 4 }} />
                    最小回撤
                  </span>
                }
                value={Math.min(...compareResults.map(r => Math.abs(r.max_drawdown || 0)))}
                precision={2}
                suffix="%"
                valueStyle={{
                  color: '#ffa726',
                  fontSize: '18px',
                  fontWeight: 600,
                }}
              />
            </Card>
          </Col>
          
          <Col xs={24} sm={12} lg={6}>
            <Card style={cardStyle} size="small">
              <Statistic
                title={
                  <span style={{ color: isDark ? '#a0a9c0' : '#666666' }}>
                    <DollarOutlined style={{ marginRight: 4 }} />
                    最高胜率
                  </span>
                }
                value={Math.max(...compareResults.map(r => r.win_rate || 0))}
                precision={1}
                suffix="%"
                valueStyle={{
                  color: '#00ff88',
                  fontSize: '18px',
                  fontWeight: 600,
                }}
              />
            </Card>
          </Col>
        </Row>

        {/* 详细对比表格 */}
        <Table
          columns={columns}
          dataSource={comparisonData}
          pagination={false}
          scroll={{ x: 'max-content' }}
          size="middle"
          bordered
          style={{
            background: isDark ? '#1a1f2e' : '#ffffff',
          }}
        />
      </Space>
    </Card>
  );
};
