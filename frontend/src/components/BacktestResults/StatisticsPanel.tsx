import React from 'react';
import { Card, Row, Col, Statistic, Tooltip, Progress, Typography, Space } from 'antd';
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
import { useResponsive } from '../../hooks/useResponsive';
import { useTheme } from '../../hooks/useTheme';
import { BacktestResult } from '../../services/api';
import { motion } from 'framer-motion';
import { CardContainer } from '../UI/Container';

const { Title, Text } = Typography;

interface StatisticsPanelProps {
  results: BacktestResult[];
  loading?: boolean;
}

export const StatisticsPanel: React.FC<StatisticsPanelProps> = ({
  results,
  loading = false
}) => {
  const { isDark } = useThemeStore();
  const { isMobile, isTablet } = useResponsive();
  const { colors, getCardStyle, getStatusColor, tokens } = useTheme();

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

  // 响应式列配置
  const getColSpan = () => {
    if (isMobile) {
      return { xs: 12, sm: 12, md: 8, lg: 6 };
    } else if (isTablet) {
      return { xs: 12, sm: 8, md: 6, lg: 6 };
    } else {
      return { xs: 24, sm: 12, md: 8, lg: 6 };
    }
  };

  const colSpan = getColSpan();

  // 动画配置
  const cardVariants = {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: -20 }
  };

  const staggerContainer = {
    animate: {
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  return (
    <motion.div
      variants={staggerContainer}
      initial="initial"
      animate="animate"
      style={{ width: '100%' }}
    >
      {/* 标题区域 */}
      <motion.div variants={cardVariants}>
        <CardContainer shadow="sm" padding="md" style={{ marginBottom: '24px' }}>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '12px'
          }}>
            <div>
              <Title level={3} style={{
                margin: 0,
                color: colors.text.primary,
                fontSize: isMobile ? '18px' : '20px'
              }}>
                <TrophyOutlined style={{ marginRight: '8px', color: getStatusColor('info') }} />
                策略表现概览
              </Title>
              <Text type="secondary" style={{ fontSize: '14px' }}>
                基于 {results.length} 个回测结果的综合分析
              </Text>
            </div>
            {!loading && results.length > 0 && (
              <div style={{ textAlign: 'right' }}>
                <Text type="secondary" style={{ fontSize: '12px' }}>
                  最佳策略收益率
                </Text>
                <div style={{
                  fontSize: '16px',
                  fontWeight: 600,
                  color: stats.totalReturn > 0 ? getStatusColor('success') : getStatusColor('error')
                }}>
                  {stats.totalReturn > 0 ? '+' : ''}{(stats.totalReturn * 100).toFixed(2)}%
                </div>
              </div>
            )}
          </div>
        </CardContainer>
      </motion.div>

      {/* 统计指标卡片 */}
      <Row gutter={[16, 16]}>
        {/* 总收益率 */}
        <Col {...colSpan}>
          <motion.div variants={cardVariants}>
            <CardContainer shadow="sm" padding="md" hover>
              <Statistic
                title={
                  <Space>
                    <DollarOutlined style={{ color: getStatusColor('info') }} />
                    <span style={{ color: colors.text.secondary }}>总收益率</span>
                    <Tooltip title="所有策略的平均总收益率">
                      <InfoCircleOutlined style={{ color: colors.text.tertiary }} />
                    </Tooltip>
                  </Space>
                }
                value={stats.totalReturn * 100}
                precision={2}
                suffix="%"
                valueStyle={{
                  color: getValueColor(stats.totalReturn),
                  fontSize: isMobile ? '18px' : '20px',
                  fontWeight: 600,
                }}
                prefix={stats.totalReturn > 0 ?
                  <RiseOutlined style={{ color: getStatusColor('success') }} /> :
                  <FallOutlined style={{ color: getStatusColor('error') }} />
                }
                loading={loading}
              />
            </CardContainer>
          </motion.div>
        </Col>

        {/* 年化收益率 */}
        <Col {...colSpan}>
          <motion.div variants={cardVariants}>
            <CardContainer shadow="sm" padding="md" hover>
              <Statistic
                title={
                  <Space>
                    <BarChartOutlined style={{ color: getStatusColor('info') }} />
                    <span style={{ color: colors.text.secondary }}>年化收益率</span>
                    <Tooltip title="年化收益率反映策略的长期盈利能力">
                      <InfoCircleOutlined style={{ color: colors.text.tertiary }} />
                    </Tooltip>
                  </Space>
                }
                value={stats.annualReturn * 100}
                precision={2}
                suffix="%"
                valueStyle={{
                  color: getValueColor(stats.annualReturn),
                  fontSize: isMobile ? '18px' : '20px',
                  fontWeight: 600,
                }}
                loading={loading}
              />
            </CardContainer>
          </motion.div>
        </Col>

        {/* 最大回撤 */}
        <Col {...colSpan}>
          <motion.div variants={cardVariants}>
            <CardContainer shadow="sm" padding="md" hover>
              <Statistic
                title={
                  <Space>
                    <FallOutlined style={{ color: getStatusColor('error') }} />
                    <span style={{ color: colors.text.secondary }}>最大回撤</span>
                    <Tooltip title="最大回撤反映策略的风险控制能力">
                      <InfoCircleOutlined style={{ color: colors.text.tertiary }} />
                    </Tooltip>
                  </Space>
                }
                value={Math.abs(stats.maxDrawdown * 100)}
                precision={2}
                suffix="%"
                valueStyle={{
                  color: getStatusColor('error'),
                  fontSize: isMobile ? '18px' : '20px',
                  fontWeight: 600,
                }}
                loading={loading}
              />
              {!loading && (
                <Progress
                  percent={Math.min(Math.abs(stats.maxDrawdown * 100), 100)}
                  strokeColor={getStatusColor('error')}
                  trailColor={colors.border.secondary}
                  showInfo={false}
                  size="small"
                  style={{ marginTop: '8px' }}
                />
              )}
            </CardContainer>
          </motion.div>
        </Col>

        {/* 夏普比率 */}
        <Col {...colSpan}>
          <motion.div variants={cardVariants}>
            <CardContainer shadow="sm" padding="md" hover>
              <Statistic
                title={
                  <Space>
                    <TrophyOutlined style={{ color: getStatusColor('warning') }} />
                    <span style={{ color: colors.text.secondary }}>夏普比率</span>
                    <Tooltip title="夏普比率衡量风险调整后的收益">
                      <InfoCircleOutlined style={{ color: colors.text.tertiary }} />
                    </Tooltip>
                  </Space>
                }
                value={stats.sharpeRatio}
                precision={2}
                valueStyle={{
                  color: stats.sharpeRatio > 1 ? getStatusColor('success') :
                         stats.sharpeRatio > 0 ? getStatusColor('info') : getStatusColor('error'),
                  fontSize: isMobile ? '18px' : '20px',
                  fontWeight: 600,
                }}
                loading={loading}
              />
              {!loading && (
                <div style={{ marginTop: '8px' }}>
                  <Text type="secondary" style={{ fontSize: '12px' }}>
                    {stats.sharpeRatio > 1 ? '优秀' :
                     stats.sharpeRatio > 0.5 ? '良好' :
                     stats.sharpeRatio > 0 ? '一般' : '较差'}
                  </Text>
                </div>
              )}
            </CardContainer>
          </motion.div>
        </Col>

        {/* 胜率 */}
        <Col {...colSpan}>
          <motion.div variants={cardVariants}>
            <CardContainer shadow="sm" padding="md" hover>
              <div>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  marginBottom: '8px'
                }}>
                  <TrophyOutlined style={{
                    color: getStatusColor('success'),
                    marginRight: '8px'
                  }} />
                  <span style={{
                    color: colors.text.secondary,
                    fontSize: '14px'
                  }}>
                    胜率
                  </span>
                  <Tooltip title="盈利交易占总交易的比例">
                    <InfoCircleOutlined style={{
                      color: colors.text.tertiary,
                      marginLeft: '4px',
                      fontSize: '12px'
                    }} />
                  </Tooltip>
                </div>
                <div style={{
                  color: stats.winRate > 0.5 ? getStatusColor('success') : getStatusColor('error'),
                  fontSize: isMobile ? '18px' : '20px',
                  fontWeight: 600,
                  marginBottom: '8px'
                }}>
                  {formatPercentage(stats.winRate)}
                </div>
                <Progress
                  percent={stats.winRate * 100}
                  showInfo={false}
                  strokeColor={stats.winRate > 0.5 ? getStatusColor('success') : getStatusColor('error')}
                  trailColor={colors.border.secondary}
                  size="small"
                />
              </div>
            </CardContainer>
          </motion.div>
        </Col>

        {/* 总交易次数 */}
        <Col {...colSpan}>
          <motion.div variants={cardVariants}>
            <CardContainer shadow="sm" padding="md" hover>
              <Statistic
                title={
                  <Space>
                    <BarChartOutlined style={{ color: getStatusColor('info') }} />
                    <span style={{ color: colors.text.secondary }}>总交易次数</span>
                  </Space>
                }
                value={stats.totalTrades}
                valueStyle={{
                  color: getStatusColor('info'),
                  fontSize: isMobile ? '18px' : '20px',
                  fontWeight: 600,
                }}
                loading={loading}
              />
            </CardContainer>
          </motion.div>
        </Col>

        {/* 波动率 */}
        <Col {...colSpan}>
          <motion.div variants={cardVariants}>
            <CardContainer shadow="sm" padding="md" hover>
              <Statistic
                title={
                  <Space>
                    <ThunderboltOutlined style={{ color: getStatusColor('warning') }} />
                    <span style={{ color: colors.text.secondary }}>波动率</span>
                    <Tooltip title="收益率的标准差，反映策略的稳定性">
                      <InfoCircleOutlined style={{ color: colors.text.tertiary }} />
                    </Tooltip>
                  </Space>
                }
                value={stats.volatility * 100}
                precision={2}
                suffix="%"
                valueStyle={{
                  color: getStatusColor('warning'),
                  fontSize: isMobile ? '18px' : '20px',
                  fontWeight: 600,
                }}
                loading={loading}
              />
            </CardContainer>
          </motion.div>
        </Col>

      </Row>
    </motion.div>
  );
};
