import React from 'react';
import { Card, Row, Col, Statistic, Tooltip, Progress } from 'antd';
import { 
  TrophyOutlined, 
  RiseOutlined, 
  FallOutlined, 
  BarChartOutlined,
  DollarOutlined,
  ThunderboltOutlined,
  InfoCircleOutlined,
  PercentageOutlined
} from '@ant-design/icons';
import { useThemeStore } from '../../stores/themeStore';
import { BacktestResult } from '../../services/api';

interface StatisticsPanelProps {
  results: BacktestResult[];
  loading?: boolean;
}

export const StatisticsPanel: React.FC<StatisticsPanelProps> = ({ 
  results, 
  loading = false 
}) => {
  const { isDark } = useThemeStore();

  // 计算综合统计指标
  const calculateStats = () => {
    if (!results || results.length === 0) {
      return {
        totalReturn: 0,
        annualReturn: 0,
        maxDrawdown: 0,
        sharpeRatio: 0,
        sortinoRatio: 0,
        calmarRatio: 0,
        winRate: 0,
        profitFactor: 0,
        totalTrades: 0,
        volatility: 0,
        var95: 0,
        cvar95: 0,
      };
    }

    const avgStats = {
      totalReturn: results.reduce((sum, r) => sum + r.final_return, 0) / results.length,
      annualReturn: results.reduce((sum, r) => sum + r.annual_return, 0) / results.length,
      maxDrawdown: results.reduce((sum, r) => sum + r.max_drawdown, 0) / results.length,
      sharpeRatio: results.reduce((sum, r) => sum + r.sharpe_ratio, 0) / results.length,
      sortinoRatio: results.reduce((sum, r) => sum + r.sortino_ratio, 0) / results.length,
      calmarRatio: results.reduce((sum, r) => sum + r.calmar_ratio, 0) / results.length,
      winRate: results.reduce((sum, r) => sum + r.win_rate, 0) / results.length,
      profitFactor: results.reduce((sum, r) => sum + r.profit_factor, 0) / results.length,
      totalTrades: results.reduce((sum, r) => sum + r.total_trades, 0),
      volatility: results.reduce((sum, r) => sum + r.volatility, 0) / results.length,
      var95: results.reduce((sum, r) => sum + r.var_95, 0) / results.length,
      cvar95: results.reduce((sum, r) => sum + r.cvar_95, 0) / results.length,
    };

    return avgStats;
  };

  const stats = calculateStats();

  const cardStyle = {
    background: isDark ? '#242b3d' : '#ffffff',
    border: `1px solid ${isDark ? '#3a4553' : '#f0f0f0'}`,
    borderRadius: '8px',
  };

  const getValueColor = (value: number, isPositive: boolean = true) => {
    if (value === 0) return isDark ? '#a0a9c0' : '#666666';
    return isPositive 
      ? (value > 0 ? '#00ff88' : '#ff4757')
      : (value > 0 ? '#ff4757' : '#00ff88');
  };

  const formatPercentage = (value: number) => `${(value * 100).toFixed(2)}%`;
  const formatNumber = (value: number, decimals: number = 2) => value.toFixed(decimals);

  return (
    <div style={{ width: '100%' }}>
      <Row gutter={[16, 16]}>
        {/* 收益指标 */}
        <Col xs={24} sm={12} lg={6}>
          <Card style={cardStyle} loading={loading}>
            <Statistic
              title={
                <span style={{ color: isDark ? '#a0a9c0' : '#666666' }}>
                  <DollarOutlined style={{ marginRight: 4 }} />
                  总收益率
                </span>
              }
              value={stats.totalReturn}
              precision={2}
              suffix="%"
              valueStyle={{ 
                color: getValueColor(stats.totalReturn),
                fontSize: '20px',
                fontWeight: 600,
              }}
              prefix={stats.totalReturn > 0 ? <RiseOutlined /> : <FallOutlined />}
            />
          </Card>
        </Col>

        <Col xs={24} sm={12} lg={6}>
          <Card style={cardStyle} loading={loading}>
            <Statistic
              title={
                <span style={{ color: isDark ? '#a0a9c0' : '#666666' }}>
                  <BarChartOutlined style={{ marginRight: 4 }} />
                  年化收益率
                </span>
              }
              value={stats.annualReturn}
              precision={2}
              suffix="%"
              valueStyle={{ 
                color: getValueColor(stats.annualReturn),
                fontSize: '20px',
                fontWeight: 600,
              }}
            />
          </Card>
        </Col>

        <Col xs={24} sm={12} lg={6}>
          <Card style={cardStyle} loading={loading}>
            <Statistic
              title={
                <span style={{ color: isDark ? '#a0a9c0' : '#666666' }}>
                  <FallOutlined style={{ marginRight: 4 }} />
                  最大回撤
                </span>
              }
              value={stats.maxDrawdown}
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

        <Col xs={24} sm={12} lg={6}>
          <Card style={cardStyle} loading={loading}>
            <Statistic
              title={
                <span style={{ color: isDark ? '#a0a9c0' : '#666666' }}>
                  <TrophyOutlined style={{ marginRight: 4 }} />
                  夏普比率
                </span>
              }
              value={stats.sharpeRatio}
              precision={2}
              valueStyle={{ 
                color: stats.sharpeRatio > 1 ? '#00ff88' : stats.sharpeRatio > 0 ? '#00d4ff' : '#ff4757',
                fontSize: '20px',
                fontWeight: 600,
              }}
            />
          </Card>
        </Col>

        {/* 风险指标 */}
        <Col xs={24} sm={12} lg={6}>
          <Card style={cardStyle} loading={loading}>
            <Statistic
              title={
                <Tooltip title="Sortino比率衡量下行风险调整后的收益">
                  <span style={{ color: isDark ? '#a0a9c0' : '#666666' }}>
                    <ThunderboltOutlined style={{ marginRight: 4 }} />
                    Sortino比率
                    <InfoCircleOutlined style={{ marginLeft: 4, fontSize: '12px' }} />
                  </span>
                </Tooltip>
              }
              value={stats.sortinoRatio}
              precision={2}
              valueStyle={{ 
                color: stats.sortinoRatio > 1 ? '#00ff88' : stats.sortinoRatio > 0 ? '#00d4ff' : '#ff4757',
                fontSize: '20px',
                fontWeight: 600,
              }}
            />
          </Card>
        </Col>

        <Col xs={24} sm={12} lg={6}>
          <Card style={cardStyle} loading={loading}>
            <Statistic
              title={
                <Tooltip title="Calmar比率 = 年化收益率 / 最大回撤">
                  <span style={{ color: isDark ? '#a0a9c0' : '#666666' }}>
                    <PercentageOutlined style={{ marginRight: 4 }} />
                    Calmar比率
                    <InfoCircleOutlined style={{ marginLeft: 4, fontSize: '12px' }} />
                  </span>
                </Tooltip>
              }
              value={stats.calmarRatio}
              precision={2}
              valueStyle={{ 
                color: stats.calmarRatio > 1 ? '#00ff88' : stats.calmarRatio > 0 ? '#00d4ff' : '#ff4757',
                fontSize: '20px',
                fontWeight: 600,
              }}
            />
          </Card>
        </Col>

        <Col xs={24} sm={12} lg={6}>
          <Card style={cardStyle} loading={loading}>
            <div>
              <div style={{ 
                color: isDark ? '#a0a9c0' : '#666666',
                fontSize: '14px',
                marginBottom: '8px'
              }}>
                <TrophyOutlined style={{ marginRight: 4 }} />
                胜率
              </div>
              <div style={{ 
                color: stats.winRate > 0.5 ? '#00ff88' : '#ff4757',
                fontSize: '20px',
                fontWeight: 600,
                marginBottom: '8px'
              }}>
                {formatPercentage(stats.winRate)}
              </div>
              <Progress
                percent={stats.winRate * 100}
                showInfo={false}
                strokeColor={stats.winRate > 0.5 ? '#00ff88' : '#ff4757'}
                trailColor={isDark ? '#3a4553' : '#f0f0f0'}
                size="small"
              />
            </div>
          </Card>
        </Col>

        <Col xs={24} sm={12} lg={6}>
          <Card style={cardStyle} loading={loading}>
            <Statistic
              title={
                <Tooltip title="盈利因子 = 总盈利 / 总亏损">
                  <span style={{ color: isDark ? '#a0a9c0' : '#666666' }}>
                    <DollarOutlined style={{ marginRight: 4 }} />
                    盈利因子
                    <InfoCircleOutlined style={{ marginLeft: 4, fontSize: '12px' }} />
                  </span>
                </Tooltip>
              }
              value={stats.profitFactor}
              precision={2}
              valueStyle={{ 
                color: stats.profitFactor > 1 ? '#00ff88' : '#ff4757',
                fontSize: '20px',
                fontWeight: 600,
              }}
            />
          </Card>
        </Col>

        {/* 交易统计 */}
        <Col xs={24} sm={12} lg={6}>
          <Card style={cardStyle} loading={loading}>
            <Statistic
              title={
                <span style={{ color: isDark ? '#a0a9c0' : '#666666' }}>
                  <BarChartOutlined style={{ marginRight: 4 }} />
                  总交易次数
                </span>
              }
              value={stats.totalTrades}
              valueStyle={{ 
                color: '#00d4ff',
                fontSize: '20px',
                fontWeight: 600,
              }}
            />
          </Card>
        </Col>

        <Col xs={24} sm={12} lg={6}>
          <Card style={cardStyle} loading={loading}>
            <Statistic
              title={
                <span style={{ color: isDark ? '#a0a9c0' : '#666666' }}>
                  <ThunderboltOutlined style={{ marginRight: 4 }} />
                  波动率
                </span>
              }
              value={stats.volatility}
              precision={2}
              suffix="%"
              valueStyle={{ 
                color: '#00d4ff',
                fontSize: '20px',
                fontWeight: 600,
              }}
            />
          </Card>
        </Col>

        <Col xs={24} sm={12} lg={6}>
          <Card style={cardStyle} loading={loading}>
            <Statistic
              title={
                <Tooltip title="95%置信度下的风险价值">
                  <span style={{ color: isDark ? '#a0a9c0' : '#666666' }}>
                    <FallOutlined style={{ marginRight: 4 }} />
                    VaR (95%)
                    <InfoCircleOutlined style={{ marginLeft: 4, fontSize: '12px' }} />
                  </span>
                </Tooltip>
              }
              value={stats.var95}
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

        <Col xs={24} sm={12} lg={6}>
          <Card style={cardStyle} loading={loading}>
            <Statistic
              title={
                <Tooltip title="95%置信度下的条件风险价值">
                  <span style={{ color: isDark ? '#a0a9c0' : '#666666' }}>
                    <FallOutlined style={{ marginRight: 4 }} />
                    CVaR (95%)
                    <InfoCircleOutlined style={{ marginLeft: 4, fontSize: '12px' }} />
                  </span>
                </Tooltip>
              }
              value={stats.cvar95}
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
      </Row>
    </div>
  );
};
