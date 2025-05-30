import React, { useState, useEffect, useMemo } from 'react';
import { Card, Row, Col, Table, Select, Space, Button, Tabs, Spin, message } from 'antd';
import {
  TrophyOutlined,
  BarChartOutlined,
  TableOutlined,
  LineChartOutlined,
  HeatMapOutlined,
  PieChartOutlined,
  FilterOutlined,
  ReloadOutlined
} from '@ant-design/icons';
import { useThemeStore } from '../../stores/themeStore';
import { useTranslation } from '../../hooks/useTranslation';
import {
  EquityChart,
  DrawdownChart,
  ReturnsDistributionChart,
  MonthlyReturnsHeatmap,
  TradeAnalysisChart
} from '../../components/Charts';
import { StatisticsPanel } from '../../components/BacktestResults/StatisticsPanel';
import { TradeDetailsTable } from '../../components/BacktestResults/TradeDetailsTable';
import { ResultsFilter, FilterCriteria } from '../../components/BacktestResults/ResultsFilter';
import { ExportButton } from '../../components/BacktestResults/ExportButton';
import { dataUtils } from '../../services/mockApi';
import { backtestApi, BacktestStatus, BacktestResult, TradeRecord } from '../../services/api';

const { Option } = Select;
const { TabPane } = Tabs;

export const Results: React.FC = () => {
  const { isDark } = useThemeStore();
  const { t } = useTranslation();

  // 状态管理
  const [results, setResults] = useState<BacktestResult[]>([]);
  const [filteredResults, setFilteredResults] = useState<BacktestResult[]>([]);
  const [tasks, setTasks] = useState<BacktestStatus[]>([]);
  const [trades, setTrades] = useState<TradeRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');
  const [showFilter, setShowFilter] = useState(false);
  const [selectedStrategy, setSelectedStrategy] = useState('all');

  // 图表数据
  const [equityData, setEquityData] = useState<any>(null);
  const [drawdownData, setDrawdownData] = useState<any>(null);
  const [returnsData, setReturnsData] = useState<any>(null);
  const [monthlyData, setMonthlyData] = useState<any>(null);

  // 获取回测结果数据
  const fetchResults = async () => {
    try {
      setLoading(true);

      // 获取所有已完成的回测任务
      const taskList = await backtestApi.listTasks();
      const completedTasks = taskList.filter(task => task.status === 'completed');

      setTasks(completedTasks);

      // 提取所有结果
      const allResults = completedTasks.flatMap(task => task.results || []);
      setResults(allResults);
      setFilteredResults(allResults);

      // 提取所有交易记录
      const allTrades = allResults.flatMap(result => result.trade_records || []);
      setTrades(allTrades);

      // 生成图表数据
      if (allResults.length > 0) {
        updateChartData(allResults);
      } else {
        // 如果没有真实数据，使用默认数据
        generateDefaultData();
      }

    } catch (error) {
      console.error('Failed to fetch results:', error);
      message.error('获取回测结果失败，显示演示数据');
      // 使用默认数据
      generateDefaultData();
    } finally {
      setLoading(false);
    }
  };

  // 生成默认演示数据
  const generateDefaultData = () => {
    const defaultEquityData = dataUtils.generateDefaultEquityData();
    const defaultTrades = dataUtils.generateDefaultTradeRecords(100);
    const defaultMonthlyReturns = dataUtils.generateDefaultMonthlyReturns();

    setEquityData(defaultEquityData);
    setDrawdownData({
      dates: defaultEquityData.dates,
      drawdowns: defaultEquityData.drawdowns,
      strategy: defaultEquityData.strategy
    });
    setReturnsData({
      returns: defaultEquityData.values.slice(1).map((val, i) =>
        (val - defaultEquityData.values[i]) / defaultEquityData.values[i]
      ),
      strategy: defaultEquityData.strategy
    });
    setMonthlyData(defaultMonthlyReturns);
    setTrades(defaultTrades);
  };

  // 更新图表数据
  const updateChartData = (resultsData: BacktestResult[]) => {
    const filteredData = selectedStrategy === 'all'
      ? resultsData
      : resultsData.filter(result => result.strategy === selectedStrategy);

    // 资金曲线数据
    const equity = dataUtils.formatEquityData(filteredData);
    setEquityData(equity);

    // 回撤数据
    const drawdown = dataUtils.formatDrawdownData(filteredData);
    setDrawdownData(drawdown);

    // 收益分布数据
    const returns = dataUtils.formatReturnsDistribution(filteredData);
    setReturnsData(returns);

    // 月度收益数据
    const monthly = dataUtils.formatMonthlyReturns(filteredData);
    setMonthlyData(monthly);
  };

  useEffect(() => {
    fetchResults();
  }, []);

  // 当策略选择改变时更新图表数据
  useEffect(() => {
    if (results.length > 0) {
      updateChartData(results);
    }
  }, [selectedStrategy, results]);

  // 处理筛选条件变化
  const handleFilterChange = (criteria: FilterCriteria) => {
    let filtered = [...results];

    // 策略筛选
    if (criteria.strategies.length > 0) {
      filtered = filtered.filter(r => criteria.strategies.includes(r.strategy));
    }

    // 交易对筛选
    if (criteria.symbols.length > 0) {
      filtered = filtered.filter(r => criteria.symbols.includes(r.symbol));
    }

    // 收益率范围筛选
    filtered = filtered.filter(r => {
      const returnPct = r.final_return * 100;
      return returnPct >= criteria.returnRange[0] && returnPct <= criteria.returnRange[1];
    });

    // 夏普比率筛选
    filtered = filtered.filter(r =>
      r.sharpe_ratio >= criteria.sharpeRange[0] && r.sharpe_ratio <= criteria.sharpeRange[1]
    );

    // 回撤筛选
    filtered = filtered.filter(r => {
      const drawdownPct = r.max_drawdown * 100;
      return drawdownPct >= criteria.drawdownRange[0] && drawdownPct <= criteria.drawdownRange[1];
    });

    // 胜率筛选
    filtered = filtered.filter(r => {
      const winRatePct = r.win_rate * 100;
      return winRatePct >= criteria.winRateRange[0] && winRatePct <= criteria.winRateRange[1];
    });

    // 最小交易次数筛选
    filtered = filtered.filter(r => r.total_trades >= criteria.minTrades);

    // 只显示盈利策略
    if (criteria.showOnlyProfitable) {
      filtered = filtered.filter(r => r.final_return > 0);
    }

    // 日期范围筛选
    if (criteria.dateRange) {
      filtered = filtered.filter(r => {
        const createdAt = new Date(r.created_at);
        return createdAt >= criteria.dateRange![0].toDate() &&
               createdAt <= criteria.dateRange![1].toDate();
      });
    }

    // 排序
    filtered.sort((a, b) => {
      const aValue = (a as any)[criteria.sortBy];
      const bValue = (b as any)[criteria.sortBy];

      if (criteria.sortOrder === 'asc') {
        return aValue - bValue;
      } else {
        return bValue - aValue;
      }
    });

    setFilteredResults(filtered);
  };

  // 处理导出
  const handleExport = async (format: string, options: any) => {
    try {
      message.loading('正在导出数据...', 0);

      // 这里可以调用实际的导出API
      // await exportApi.exportResults(filteredResults, format, options);

      // 模拟导出延迟
      await new Promise(resolve => setTimeout(resolve, 2000));

      message.destroy();
      message.success(`${format.toUpperCase()} 文件导出成功`);
    } catch (error) {
      message.destroy();
      message.error('导出失败，请重试');
    }
  };

  // 获取可用的策略列表
  const availableStrategies = useMemo(() => {
    return [...new Set(results.map(r => r.strategy))];
  }, [results]);

  // 当策略筛选改变时更新图表数据
  useEffect(() => {
    if (results.length > 0) {
      const filteredResults = selectedStrategy === 'all'
        ? results
        : results.filter(result => result.strategy === selectedStrategy);

      const equityData = dataUtils.formatEquityData(filteredResults);
      setEquityData(equityData);
    }
  }, [selectedStrategy, results]);

  const columns = [
    {
      title: '策略',
      dataIndex: 'strategy',
      key: 'strategy',
    },
    {
      title: '交易对',
      dataIndex: 'symbol',
      key: 'symbol',
    },
    {
      title: '总收益率',
      dataIndex: 'final_return',
      key: 'final_return',
      render: (value: number) => (
        <span style={{ color: value > 0 ? '#00ff88' : '#ff4757' }}>
          {value > 0 ? '+' : ''}{dataUtils.formatPercentage(value)}
        </span>
      ),
      sorter: (a: BacktestResult, b: BacktestResult) => a.final_return - b.final_return,
    },
    {
      title: '年化收益率',
      dataIndex: 'annual_return',
      key: 'annual_return',
      render: (value: number) => dataUtils.formatPercentage(value),
      sorter: (a: BacktestResult, b: BacktestResult) => a.annual_return - b.annual_return,
    },
    {
      title: '夏普比率',
      dataIndex: 'sharpe_ratio',
      key: 'sharpe_ratio',
      render: (value: number) => dataUtils.formatNumber(value),
      sorter: (a: BacktestResult, b: BacktestResult) => a.sharpe_ratio - b.sharpe_ratio,
    },
    {
      title: '最大回撤',
      dataIndex: 'max_drawdown',
      key: 'max_drawdown',
      render: (value: number) => dataUtils.formatPercentage(value),
      sorter: (a: BacktestResult, b: BacktestResult) => a.max_drawdown - b.max_drawdown,
    },
    {
      title: '胜率',
      dataIndex: 'win_rate',
      key: 'win_rate',
      render: (value: number) => dataUtils.formatPercentage(value),
      sorter: (a: BacktestResult, b: BacktestResult) => a.win_rate - b.win_rate,
    },
    {
      title: '交易次数',
      dataIndex: 'total_trades',
      key: 'total_trades',
      render: (value: number) => dataUtils.formatNumber(value, 0),
      sorter: (a: BacktestResult, b: BacktestResult) => a.total_trades - b.total_trades,
    },
    {
      title: '创建时间',
      dataIndex: 'created_at',
      key: 'created_at',
      render: (value: string) => dataUtils.formatDateTime(value),
    },
  ];

  // 计算统计数据
  const stats = dataUtils.calculateStatistics(results);
  const avgReturn = stats.avgReturn / 100; // 转换为小数
  const avgSharpe = stats.avgSharpe;
  const avgDrawdown = stats.avgDrawdown / 100; // 转换为小数
  const avgWinRate = stats.avgWinRate;

  const cardStyle = {
    background: isDark ? '#242b3d' : '#ffffff',
    border: `1px solid ${isDark ? '#3a4553' : '#f0f0f0'}`,
    borderRadius: '8px',
  };

  return (
    <div style={{
      padding: '24px',
      background: isDark ? '#0a0e1a' : '#f5f5f5',
      minHeight: '100vh'
    }}>
      <Space direction="vertical" size="large" style={{ width: '100%' }}>
        {/* 页面标题和操作栏 */}
        <Card style={cardStyle}>
          <Row justify="space-between" align="middle">
            <Col>
              <Space>
                <BarChartOutlined style={{ fontSize: '24px', color: '#00d4ff' }} />
                <div>
                  <h2 style={{
                    margin: 0,
                    color: isDark ? '#ffffff' : '#000000',
                    fontSize: '24px',
                    fontWeight: 600
                  }}>
                    回测结果分析
                  </h2>
                  <p style={{
                    margin: 0,
                    color: isDark ? '#a0a9c0' : '#666666',
                    fontSize: '14px'
                  }}>
                    共 {results.length} 个回测结果，已筛选 {filteredResults.length} 个
                  </p>
                </div>
              </Space>
            </Col>
            <Col>
              <Space>
                <Button
                  icon={<FilterOutlined />}
                  onClick={() => setShowFilter(!showFilter)}
                  type={showFilter ? 'primary' : 'default'}
                >
                  {showFilter ? '隐藏筛选' : '显示筛选'}
                </Button>
                <Button
                  icon={<ReloadOutlined />}
                  onClick={fetchResults}
                  loading={loading}
                >
                  刷新数据
                </Button>
                <ExportButton
                  results={filteredResults}
                  trades={trades}
                  onExport={handleExport}
                  loading={loading}
                />
              </Space>
            </Col>
          </Row>
        </Card>

        {/* 筛选器 */}
        {showFilter && (
          <ResultsFilter
            results={results}
            onFilterChange={handleFilterChange}
            loading={loading}
          />
        )}

        {/* 统计指标面板 */}
        <StatisticsPanel
          results={filteredResults}
          loading={loading}
        />

        {/* 主要内容区域 - 标签页 */}
        <Card style={cardStyle}>
          <Tabs
            activeKey={activeTab}
            onChange={setActiveTab}
            type="card"
            size="large"
            style={{ margin: '-16px -16px 0 -16px' }}
          >
            <TabPane
              tab={
                <Space>
                  <LineChartOutlined />
                  <span>概览分析</span>
                </Space>
              }
              key="overview"
            >
              <div style={{ padding: '24px 0' }}>
                <Row gutter={[24, 24]}>
                  <Col xs={24} lg={12}>
                    <Card
                      title="资金曲线"
                      extra={
                        <Select
                          value={selectedStrategy}
                          onChange={setSelectedStrategy}
                          style={{ width: 150 }}
                          size="small"
                        >
                          <Option value="all">全部策略</Option>
                          {availableStrategies.map(strategy => (
                            <Option key={strategy} value={strategy}>
                              {strategy}
                            </Option>
                          ))}
                        </Select>
                      }
                      style={cardStyle}
                      bodyStyle={{ padding: '16px' }}
                    >
                      <EquityChart
                        data={equityData}
                        height={350}
                        loading={loading}
                      />
                    </Card>
                  </Col>
                  <Col xs={24} lg={12}>
                    <Card
                      title="回撤分析"
                      style={cardStyle}
                      bodyStyle={{ padding: '16px' }}
                    >
                      <DrawdownChart
                        data={drawdownData}
                        height={350}
                        loading={loading}
                      />
                    </Card>
                  </Col>
                </Row>
              </div>
            </TabPane>

            <TabPane
              tab={
                <Space>
                  <PieChartOutlined />
                  <span>收益分析</span>
                </Space>
              }
              key="returns"
            >
              <div style={{ padding: '24px 0' }}>
                <Row gutter={[24, 24]}>
                  <Col xs={24} lg={12}>
                    <Card
                      title="收益分布"
                      style={cardStyle}
                      bodyStyle={{ padding: '16px' }}
                    >
                      <ReturnsDistributionChart
                        data={returnsData}
                        height={350}
                        loading={loading}
                      />
                    </Card>
                  </Col>
                  <Col xs={24} lg={12}>
                    <Card
                      title="月度收益热力图"
                      style={cardStyle}
                      bodyStyle={{ padding: '16px' }}
                    >
                      <MonthlyReturnsHeatmap
                        data={monthlyData}
                        height={350}
                        loading={loading}
                      />
                    </Card>
                  </Col>
                </Row>
              </div>
            </TabPane>

            <TabPane
              tab={
                <Space>
                  <BarChartOutlined />
                  <span>交易分析</span>
                </Space>
              }
              key="trades"
            >
              <div style={{ padding: '24px 0' }}>
                <Row gutter={[24, 24]}>
                  <Col xs={24} lg={8}>
                    <Card
                      title="盈亏分布"
                      style={cardStyle}
                      bodyStyle={{ padding: '16px' }}
                    >
                      <TradeAnalysisChart
                        data={trades}
                        height={300}
                        chartType="pnl"
                        loading={loading}
                      />
                    </Card>
                  </Col>
                  <Col xs={24} lg={8}>
                    <Card
                      title="交易量分析"
                      style={cardStyle}
                      bodyStyle={{ padding: '16px' }}
                    >
                      <TradeAnalysisChart
                        data={trades}
                        height={300}
                        chartType="volume"
                        loading={loading}
                      />
                    </Card>
                  </Col>
                  <Col xs={24} lg={8}>
                    <Card
                      title="累计盈亏"
                      style={cardStyle}
                      bodyStyle={{ padding: '16px' }}
                    >
                      <TradeAnalysisChart
                        data={trades}
                        height={300}
                        chartType="cumulative"
                        loading={loading}
                      />
                    </Card>
                  </Col>
                </Row>
              </div>
            </TabPane>

            <TabPane
              tab={
                <Space>
                  <TableOutlined />
                  <span>详细数据</span>
                </Space>
              }
              key="details"
            >
              <div style={{ padding: '24px 0' }}>
                <Space direction="vertical" size="large" style={{ width: '100%' }}>
                  {/* 回测结果表格 */}
                  <Card
                    title="回测结果"
                    style={cardStyle}
                    bodyStyle={{ padding: '16px' }}
                  >
                    <Table
                      columns={columns}
                      dataSource={filteredResults}
                      rowKey={(record) => `${record.task_id}-${record.symbol}`}
                      pagination={{
                        pageSize: 20,
                        showSizeChanger: true,
                        showQuickJumper: true,
                        showTotal: (total, range) =>
                          `第 ${range[0]}-${range[1]} 条，共 ${total} 条结果`,
                      }}
                      loading={loading}
                      scroll={{ x: 1200 }}
                      size="small"
                      style={{ background: 'transparent' }}
                      locale={{
                        emptyText: loading ? '加载中...' : '暂无回测结果'
                      }}
                    />
                  </Card>

                  {/* 交易记录表格 */}
                  <Card
                    title="交易记录"
                    style={cardStyle}
                    bodyStyle={{ padding: '16px' }}
                  >
                    <TradeDetailsTable
                      trades={trades}
                      loading={loading}
                      onExport={() => handleExport('csv', { includeTrades: true })}
                    />
                  </Card>
                </Space>
              </div>
            </TabPane>
          </Tabs>
        </Card>
      </Space>
    </div>
  );
};
