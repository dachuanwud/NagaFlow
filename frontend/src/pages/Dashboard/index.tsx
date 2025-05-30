import React, { useEffect, useState } from 'react';
import { Row, Col, Card, Statistic, List, Tag, Button, Space } from 'antd';
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
import { useLoadingStore } from '../../stores/loadingStore';
import { useTranslation } from '../../hooks/useTranslation';
import { designTokens, getThemeColors } from '../../styles/designSystem';
import { PageContainer, CardContainer, GridContainer } from '../../components/UI/Container';
import { Heading, Text } from '../../components/UI/Typography';
import { PerformanceChart } from '../../components/Charts';
import { dataUtils } from '../../services/mockApi';
import { backtestApi, strategiesApi, dataApi, BacktestStatus, Strategy, SymbolInfo } from '../../services/api';
import { PageTransition, CardAnimation, ListItemAnimation, CountUpAnimation } from '../../components/Animation/PageTransition';
import { PageSkeleton } from '../../components/Loading';
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
  const themeColors = getThemeColors(isDark);

  return (
    <CardContainer hover padding="md" shadow="md">
      <Card
        style={{
          background: 'transparent',
          border: 'none',
          borderRadius: designTokens.borderRadius.xl,
        }}
        bodyStyle={{ padding: 0 }}
      >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <Text size="sm" color="secondary" style={{ marginBottom: designTokens.spacing.sm }}>
            {title}
          </Text>
          <Statistic
            value={value}
            valueStyle={{
              fontSize: designTokens.typography.fontSize['3xl'],
              fontWeight: designTokens.typography.fontWeight.bold,
              color: themeColors.text.primary,
            }}
            formatter={(val) => (
              <CountUpAnimation value={typeof val === 'number' ? val : parseFloat(val?.toString() || '0')} />
            )}
          />
          {change && (
            <div style={{
              color: changeType === 'positive'
                ? designTokens.colors.success[500]
                : changeType === 'negative'
                ? designTokens.colors.error[500]
                : themeColors.text.tertiary,
              fontSize: designTokens.typography.fontSize.sm,
              marginTop: designTokens.spacing.sm,
              display: 'flex',
              alignItems: 'center',
              gap: designTokens.spacing.xs,
            }}>
              {changeType === 'positive' && <ArrowUpOutlined />}
              {changeType === 'negative' && <ArrowDownOutlined />}
              {change}
            </div>
          )}
        </div>
        <div style={{
          width: '48px',
          height: '48px',
          borderRadius: designTokens.borderRadius.lg,
          background: `${color}20`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: color,
          fontSize: designTokens.typography.fontSize.lg,
        }}>
          {icon}
        </div>
      </div>
      </Card>
    </CardContainer>
  );
};

export const Dashboard: React.FC = () => {
  const { isDark } = useThemeStore();
  const { setPageLoading, pageLoading } = useLoadingStore();
  const { t } = useTranslation();
  const [performanceData, setPerformanceData] = useState<any>(null);
  const [selectedTimeframe, setSelectedTimeframe] = useState('1月');
  const [dashboardStats, setDashboardStats] = useState({
    activeFactors: 0,
    bestPerformance: 0,
    runningBacktests: 0,
    avgSharpe: 0,
  });
  const [recentTasks, setRecentTasks] = useState<BacktestStatus[]>([]);
  const [topStrategies, setTopStrategies] = useState<Strategy[]>([]);
  const themeColors = getThemeColors(isDark);

  // 获取仪表板数据
  const fetchDashboardData = async () => {
    try {
      setPageLoading('dashboard', true);

      // 并行获取各种数据
      const [tasks, strategies, symbols] = await Promise.all([
        backtestApi.listTasks().catch(() => []),
        strategiesApi.listStrategies().catch(() => []),
        dataApi.getSymbols().catch(() => []),
      ]);

      // 计算统计数据
      const runningTasks = tasks.filter(task => task.status === 'running' || task.status === 'pending');
      const completedTasks = tasks.filter(task => task.status === 'completed');

      // 获取最佳表现
      let bestPerformance = 0;
      let avgSharpe = 0;

      if (completedTasks.length > 0) {
        const allResults = completedTasks.flatMap(task => task.results || []);
        if (allResults.length > 0) {
          bestPerformance = Math.max(...allResults.map(r => r.final_return * 100));
          avgSharpe = allResults.reduce((sum, r) => sum + r.sharpe_ratio, 0) / allResults.length;
        }
      }

      setDashboardStats({
        activeFactors: strategies.filter(s => s.is_active).length,
        bestPerformance,
        runningBacktests: runningTasks.length,
        avgSharpe,
      });

      // 设置最近任务（最多3个）
      setRecentTasks(tasks.slice(0, 3));

      // 设置顶级策略（最多3个活跃策略）
      setTopStrategies(strategies.filter(s => s.is_active).slice(0, 3));

      // 生成性能数据（如果有完成的回测结果）
      if (completedTasks.length > 0) {
        const allResults = completedTasks.flatMap(task => task.results || []);
        const formattedData = dataUtils.formatPerformanceData(allResults);
        setPerformanceData(formattedData);
      } else {
        // 使用默认数据
        const defaultData = dataUtils.generateDefaultEquityData();
        setPerformanceData(defaultData);
      }

    } catch (error) {
      console.error('Failed to fetch dashboard data:', error);
      // 使用默认数据
      const defaultData = dataUtils.generateDefaultEquityData();
      setPerformanceData(defaultData);
    } finally {
      setPageLoading('dashboard', false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, [setPageLoading]);

  // 格式化最近活动
  const recentActivities = recentTasks.map(task => ({
    title: `回测任务: ${task.task_id.slice(0, 8)}...`,
    description: `${dataUtils.formatDateTime(new Date().toISOString())} • ${task.message || '正在处理'}`,
    status: task.status,
  }));

  // 格式化顶级策略
  const topFactors = topStrategies.map(strategy => ({
    name: strategy.name,
    type: 'Strategy',
    return: Math.random() * 50 + 20, // 临时随机数据，实际应该从回测结果获取
    updated: dataUtils.formatDateTime(strategy.updated_at),
  }));

  // 如果正在加载，显示骨架屏
  if (pageLoading.dashboard) {
    return <PageSkeleton />;
  }

  return (
    <PageTransition>
      <PageContainer padding="none">
        {/* 欢迎区域 */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: designTokens.spacing['3xl'],
          padding: designTokens.spacing.lg,
          background: `linear-gradient(135deg, ${designTokens.colors.primary[500]}15, ${designTokens.colors.success[500]}10)`,
          borderRadius: designTokens.borderRadius.xl,
          border: isDark
            ? `1px solid ${designTokens.colors.primary[500]}30`
            : `1px solid ${designTokens.colors.primary[500]}20`,
        }}>
          <div>
            <Heading level={2} style={{
              margin: 0,
              marginBottom: designTokens.spacing.sm,
              color: themeColors.text.primary,
            }}>
              {t('common.welcome')}
            </Heading>
            <Text size="md" color="secondary">
              {t('dashboard.welcomeSubtitle')}
            </Text>
          </div>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: designTokens.spacing.md,
          }}>
            <div style={{
              textAlign: 'right',
              marginRight: designTokens.spacing.lg,
            }}>
              <Text size="sm" color="secondary" style={{ display: 'block' }}>
                {t('dashboard.lastLogin')}
              </Text>
              <Text size="md" style={{ fontWeight: designTokens.typography.fontWeight.medium }}>
                {new Date().toLocaleDateString('zh-CN', {
                  month: 'long',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit'
                })}
              </Text>
            </div>
          </div>
        </div>

        {/* 统计卡片 */}
        <GridContainer columns={4} gap="lg" style={{ marginBottom: designTokens.spacing['4xl'] }}>
          <CardAnimation delay={0}>
            <StatCard
              title={t('dashboard.activeAIFactors')}
              value={dashboardStats.activeFactors}
              change={dashboardStats.activeFactors > 0 ? `${dashboardStats.activeFactors} 个活跃策略` : '暂无活跃策略'}
              changeType={dashboardStats.activeFactors > 0 ? "positive" : "neutral"}
              icon={<RobotOutlined />}
              color={designTokens.colors.primary[500]}
            />
          </CardAnimation>
          <CardAnimation delay={0.1}>
            <StatCard
              title={t('dashboard.bestFactorPerformance')}
              value={`${dashboardStats.bestPerformance.toFixed(1)}%`}
              change={dashboardStats.bestPerformance > 0 ? t('dashboard.annualReturn') : '暂无数据'}
              changeType={dashboardStats.bestPerformance > 0 ? "positive" : "neutral"}
              icon={<TrophyOutlined />}
              color={designTokens.colors.success[500]}
            />
          </CardAnimation>
          <CardAnimation delay={0.2}>
            <StatCard
              title={t('dashboard.runningBacktests')}
              value={dashboardStats.runningBacktests}
              change={dashboardStats.runningBacktests > 0 ? t('dashboard.processing') : '无运行任务'}
              changeType={dashboardStats.runningBacktests > 0 ? "neutral" : "positive"}
              icon={<ClockCircleOutlined />}
              color={designTokens.colors.warning[500]}
            />
          </CardAnimation>
          <CardAnimation delay={0.3}>
            <StatCard
              title={t('dashboard.sharpeRatio')}
              value={dashboardStats.avgSharpe.toFixed(2)}
              change={dashboardStats.avgSharpe > 0 ? `平均夏普比率` : '暂无数据'}
              changeType={dashboardStats.avgSharpe > 1 ? "positive" : "neutral"}
              icon={<LineChartOutlined />}
              color={designTokens.colors.primary[500]}
            />
          </CardAnimation>
        </GridContainer>

        <Row gutter={[24, 24]}>
          {/* 主要内容区域 */}
          <Col xs={24} lg={16}>
            <Space direction="vertical" size="large" style={{ width: '100%' }}>
              {/* 性能图表 */}
              <CardAnimation delay={0.4}>
                <Card
                  title={
                    <div style={{ display: 'flex', alignItems: 'center', gap: designTokens.spacing.sm }}>
                      <LineChartOutlined style={{ color: designTokens.colors.primary[500] }} />
                      {t('dashboard.portfolioPerformance')}
                    </div>
                  }
                  extra={
                    <Space>
                      {['1天', '1周', '1月', '1年'].map((timeframe) => (
                        <Button
                          key={timeframe}
                          size="small"
                          type={selectedTimeframe === timeframe ? 'primary' : 'default'}
                          onClick={() => setSelectedTimeframe(timeframe)}
                          style={{
                            borderRadius: designTokens.borderRadius.md,
                            fontWeight: selectedTimeframe === timeframe
                              ? designTokens.typography.fontWeight.semibold
                              : designTokens.typography.fontWeight.normal,
                            background: selectedTimeframe === timeframe
                              ? designTokens.colors.primary[500]
                              : 'transparent',
                            borderColor: selectedTimeframe === timeframe
                              ? designTokens.colors.primary[500]
                              : themeColors.border.primary,
                            color: selectedTimeframe === timeframe
                              ? '#ffffff'
                              : themeColors.text.primary,
                          }}
                        >
                          {timeframe}
                        </Button>
                      ))}
                    </Space>
                  }
                  style={{
                    background: themeColors.bg.secondary,
                    border: `1px solid ${themeColors.border.primary}`,
                    borderRadius: designTokens.borderRadius.xl,
                    boxShadow: isDark ? designTokens.shadowsDark.md : designTokens.shadows.md,
                  }}
                >
                  <PerformanceChart
                    data={performanceData}
                    height={320}
                    title={t('dashboard.portfolioPerformance')}
                  />
                </Card>
              </CardAnimation>

              {/* 最近活动 */}
              <CardAnimation delay={0.5}>
                <Card
                  title={
                    <div style={{ display: 'flex', alignItems: 'center', gap: designTokens.spacing.sm }}>
                      <ClockCircleOutlined style={{ color: designTokens.colors.warning[500] }} />
                      {t('dashboard.recentActivity')}
                    </div>
                  }
                  extra={<Button type="link">{t('common.viewAll')}</Button>}
                  style={{
                    background: themeColors.bg.secondary,
                    border: `1px solid ${themeColors.border.primary}`,
                    borderRadius: designTokens.borderRadius.xl,
                    boxShadow: isDark ? designTokens.shadowsDark.md : designTokens.shadows.md,
                  }}
                >
                  <List
                    dataSource={recentActivities}
                    renderItem={(item, index) => (
                      <ListItemAnimation index={index}>
                        <List.Item>
                          <List.Item.Meta
                            title={item.title}
                            description={item.description}
                          />
                          <Tag color={
                            item.status === 'success' ? 'green' :
                            item.status === 'completed' ? 'blue' : 'orange'
                          }>
                            {t(`status.${item.status}`)}
                          </Tag>
                        </List.Item>
                      </ListItemAnimation>
                    )}
                  />
                </Card>
              </CardAnimation>
          </Space>
        </Col>

          {/* 侧边栏 */}
          <Col xs={24} lg={8}>
            <Space direction="vertical" size="large" style={{ width: '100%' }}>
              {/* 顶级因子 */}
              <CardAnimation delay={0.6}>
                <Card
                  title={
                    <div style={{ display: 'flex', alignItems: 'center', gap: designTokens.spacing.sm }}>
                      <TrophyOutlined style={{ color: designTokens.colors.success[500] }} />
                      {t('dashboard.topAIFactors')}
                    </div>
                  }
                  extra={<Button type="link">{t('common.refresh')}</Button>}
                  style={{
                    background: themeColors.bg.secondary,
                    border: `1px solid ${themeColors.border.primary}`,
                    borderRadius: designTokens.borderRadius.xl,
                    boxShadow: isDark ? designTokens.shadowsDark.md : designTokens.shadows.md,
                  }}
                >
                  <List
                    dataSource={topFactors}
                    renderItem={(item, index) => (
                      <ListItemAnimation index={index}>
                        <List.Item style={{
                          padding: designTokens.spacing.md,
                          borderRadius: designTokens.borderRadius.lg,
                          transition: 'all 0.3s ease',
                          cursor: 'pointer',
                        }}>
                          <div style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'flex-start',
                            width: '100%',
                            gap: designTokens.spacing.md,
                          }}>
                            <div style={{ flex: 1, minWidth: 0 }}>
                              <div style={{
                                fontSize: designTokens.typography.fontSize.md,
                                fontWeight: designTokens.typography.fontWeight.semibold,
                                color: themeColors.text.primary,
                                marginBottom: designTokens.spacing.xs,
                                wordBreak: 'break-word',
                                lineHeight: designTokens.typography.lineHeight.tight,
                              }}>
                                {item.name}
                              </div>
                              <div style={{
                                fontSize: designTokens.typography.fontSize.sm,
                                color: themeColors.text.secondary,
                                display: 'flex',
                                alignItems: 'center',
                                gap: designTokens.spacing.xs,
                              }}>
                                <Tag
                                  color={item.type === 'LLM' ? 'blue' : item.type === 'ML' ? 'green' : 'orange'}
                                  size="small"
                                >
                                  {item.type}
                                </Tag>
                                <span>{t('dashboard.updated')} {item.updated}</span>
                              </div>
                            </div>
                            <div style={{
                              textAlign: 'right',
                              flexShrink: 0,
                            }}>
                              <div style={{
                                fontSize: designTokens.typography.fontSize.lg,
                                fontWeight: designTokens.typography.fontWeight.bold,
                                color: designTokens.colors.success[500],
                                lineHeight: 1,
                              }}>
                                <CountUpAnimation value={item.return} />%
                              </div>
                              <div style={{
                                fontSize: designTokens.typography.fontSize.xs,
                                color: themeColors.text.tertiary,
                                marginTop: designTokens.spacing.xs,
                              }}>
                                {t('dashboard.return')}
                              </div>
                            </div>
                          </div>
                        </List.Item>
                      </ListItemAnimation>
                    )}
                  />
                </Card>
              </CardAnimation>

              {/* 快速操作 */}
              <CardAnimation delay={0.7}>
                <Card
                  title={
                    <div style={{ display: 'flex', alignItems: 'center', gap: designTokens.spacing.sm }}>
                      <RobotOutlined style={{ color: designTokens.colors.primary[500] }} />
                      {t('dashboard.quickActions')}
                    </div>
                  }
                  style={{
                    background: themeColors.bg.secondary,
                    border: `1px solid ${themeColors.border.primary}`,
                    borderRadius: designTokens.borderRadius.xl,
                    boxShadow: isDark ? designTokens.shadowsDark.md : designTokens.shadows.md,
                  }}
                >
                  <Space direction="vertical" style={{ width: '100%' }} size="middle">
                    <Button
                      type="primary"
                      block
                      icon={<RobotOutlined />}
                      size="large"
                      style={{
                        borderRadius: designTokens.borderRadius.lg,
                        height: '48px',
                        fontWeight: designTokens.typography.fontWeight.semibold,
                        background: `linear-gradient(135deg, ${designTokens.colors.primary[500]}, ${designTokens.colors.primary[600]})`,
                        border: 'none',
                        boxShadow: `0 4px 12px ${designTokens.colors.primary[500]}30`,
                      }}
                    >
                      {t('dashboard.generateNewFactor')}
                    </Button>
                    <Button
                      block
                      icon={<PlayCircleOutlined />}
                      size="large"
                      style={{
                        borderRadius: designTokens.borderRadius.lg,
                        height: '48px',
                        fontWeight: designTokens.typography.fontWeight.medium,
                        borderColor: themeColors.border.primary,
                        color: themeColors.text.primary,
                      }}
                    >
                      {t('dashboard.runBacktest')}
                    </Button>
                    <Button
                      block
                      icon={<DownloadOutlined />}
                      size="large"
                      style={{
                        borderRadius: designTokens.borderRadius.lg,
                        height: '48px',
                        fontWeight: designTokens.typography.fontWeight.medium,
                        borderColor: themeColors.border.primary,
                        color: themeColors.text.primary,
                      }}
                    >
                      {t('dashboard.exportResults')}
                    </Button>
                  </Space>
                </Card>
              </CardAnimation>
            </Space>
          </Col>
        </Row>
      </PageContainer>
    </PageTransition>
  );
};
