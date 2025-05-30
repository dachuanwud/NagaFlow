import React, { useState, useEffect } from 'react';
import { Card, Row, Col, Statistic, Table, Select, Space, Button } from 'antd';
import { TrophyOutlined, RiseOutlined, FallOutlined, DownloadOutlined } from '@ant-design/icons';
import { useThemeStore } from '../../stores/themeStore';
import { EquityChart } from '../../components/Charts';
import { mockApi } from '../../services/mockApi';

const { Option } = Select;

interface ResultData {
  strategy: string;
  symbol: string;
  totalReturn: number;
  annualReturn: number;
  sharpeRatio: number;
  maxDrawdown: number;
  winRate: number;
  totalTrades: number;
}

export const Results: React.FC = () => {
  const { isDark } = useThemeStore();
  const [selectedStrategy, setSelectedStrategy] = useState('all');
  const [equityData, setEquityData] = useState<any>(null);
  const [results, setResults] = useState<ResultData[]>([]);

  useEffect(() => {
    // 模拟结果数据
    const mockResults: ResultData[] = [
      {
        strategy: 'SMA策略',
        symbol: 'BTCUSDT',
        totalReturn: 25.6,
        annualReturn: 18.2,
        sharpeRatio: 1.8,
        maxDrawdown: 8.2,
        winRate: 65.4,
        totalTrades: 156,
      },
      {
        strategy: 'RSI策略',
        symbol: 'ETHUSDT',
        totalReturn: 18.9,
        annualReturn: 14.5,
        sharpeRatio: 1.5,
        maxDrawdown: 12.1,
        winRate: 58.7,
        totalTrades: 203,
      },
      {
        strategy: 'MACD策略',
        symbol: 'BNBUSDT',
        totalReturn: 32.1,
        annualReturn: 22.8,
        sharpeRatio: 2.1,
        maxDrawdown: 6.8,
        winRate: 71.2,
        totalTrades: 89,
      },
    ];
    setResults(mockResults);

    // Use mock API to generate equity curve data
    const equityData = mockApi.generateEquityData('Portfolio Strategy');
    setEquityData(equityData);
  }, []);

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
      dataIndex: 'totalReturn',
      key: 'totalReturn',
      render: (value: number) => (
        <span style={{ color: value > 0 ? '#00ff88' : '#ff4757' }}>
          {value > 0 ? '+' : ''}{value.toFixed(2)}%
        </span>
      ),
      sorter: (a: ResultData, b: ResultData) => a.totalReturn - b.totalReturn,
    },
    {
      title: '年化收益率',
      dataIndex: 'annualReturn',
      key: 'annualReturn',
      render: (value: number) => `${value.toFixed(2)}%`,
      sorter: (a: ResultData, b: ResultData) => a.annualReturn - b.annualReturn,
    },
    {
      title: '夏普比率',
      dataIndex: 'sharpeRatio',
      key: 'sharpeRatio',
      render: (value: number) => value.toFixed(2),
      sorter: (a: ResultData, b: ResultData) => a.sharpeRatio - b.sharpeRatio,
    },
    {
      title: '最大回撤',
      dataIndex: 'maxDrawdown',
      key: 'maxDrawdown',
      render: (value: number) => `${value.toFixed(2)}%`,
      sorter: (a: ResultData, b: ResultData) => a.maxDrawdown - b.maxDrawdown,
    },
    {
      title: '胜率',
      dataIndex: 'winRate',
      key: 'winRate',
      render: (value: number) => `${value.toFixed(1)}%`,
      sorter: (a: ResultData, b: ResultData) => a.winRate - b.winRate,
    },
    {
      title: '交易次数',
      dataIndex: 'totalTrades',
      key: 'totalTrades',
      sorter: (a: ResultData, b: ResultData) => a.totalTrades - b.totalTrades,
    },
  ];

  const avgReturn = results.length > 0 ? results.reduce((sum, r) => sum + r.totalReturn, 0) / results.length : 0;
  const avgSharpe = results.length > 0 ? results.reduce((sum, r) => sum + r.sharpeRatio, 0) / results.length : 0;
  const avgDrawdown = results.length > 0 ? results.reduce((sum, r) => sum + r.maxDrawdown, 0) / results.length : 0;
  const avgWinRate = results.length > 0 ? results.reduce((sum, r) => sum + r.winRate, 0) / results.length : 0;

  return (
    <div style={{ padding: '24px' }}>
      <Space direction="vertical" size="large" style={{ width: '100%' }}>
        {/* 统计概览 */}
        <Row gutter={[24, 24]}>
          <Col xs={24} sm={12} lg={6}>
            <Card style={{ background: isDark ? '#242b3d' : '#ffffff' }}>
              <Statistic
                title="平均收益率"
                value={avgReturn}
                precision={2}
                suffix="%"
                valueStyle={{ color: avgReturn > 0 ? '#00ff88' : '#ff4757' }}
                prefix={avgReturn > 0 ? <RiseOutlined /> : <FallOutlined />}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <Card style={{ background: isDark ? '#242b3d' : '#ffffff' }}>
              <Statistic
                title="平均夏普比率"
                value={avgSharpe}
                precision={2}
                valueStyle={{ color: '#00d4ff' }}
                prefix={<TrophyOutlined />}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <Card style={{ background: isDark ? '#242b3d' : '#ffffff' }}>
              <Statistic
                title="平均最大回撤"
                value={avgDrawdown}
                precision={2}
                suffix="%"
                valueStyle={{ color: '#ff4757' }}
                prefix={<FallOutlined />}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <Card style={{ background: isDark ? '#242b3d' : '#ffffff' }}>
              <Statistic
                title="平均胜率"
                value={avgWinRate}
                precision={1}
                suffix="%"
                valueStyle={{ color: '#00ff88' }}
                prefix={<RiseOutlined />}
              />
            </Card>
          </Col>
        </Row>

        {/* 资金曲线图表 */}
        <Card
          title="组合资金曲线"
          extra={
            <Space>
              <Select
                value={selectedStrategy}
                onChange={setSelectedStrategy}
                style={{ width: 150 }}
              >
                <Option value="all">全部策略</Option>
                <Option value="sma">SMA策略</Option>
                <Option value="rsi">RSI策略</Option>
                <Option value="macd">MACD策略</Option>
              </Select>
              <Button icon={<DownloadOutlined />}>导出</Button>
            </Space>
          }
          style={{
            background: isDark ? '#242b3d' : '#ffffff',
            border: `1px solid ${isDark ? '#3a4553' : '#f0f0f0'}`,
          }}
        >
          <EquityChart
            data={equityData}
            height={400}
            title="组合资金曲线"
          />
        </Card>

        {/* 详细结果表格 */}
        <Card
          title="详细结果"
          style={{
            background: isDark ? '#242b3d' : '#ffffff',
            border: `1px solid ${isDark ? '#3a4553' : '#f0f0f0'}`,
          }}
        >
          <Table
            columns={columns}
            dataSource={results}
            rowKey={(record) => `${record.strategy}-${record.symbol}`}
            pagination={{ pageSize: 10 }}
            style={{ background: 'transparent' }}
          />
        </Card>
      </Space>
    </div>
  );
};
