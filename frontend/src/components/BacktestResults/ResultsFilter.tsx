import React, { useState } from 'react';
import { 
  Card, 
  Form, 
  Select, 
  Slider, 
  Switch, 
  Button, 
  Space, 
  Collapse,
  InputNumber,
  DatePicker,
  Tooltip
} from 'antd';
import { 
  FilterOutlined, 
  ReloadOutlined, 
  SettingOutlined,
  InfoCircleOutlined
} from '@ant-design/icons';
import { useThemeStore } from '../../stores/themeStore';
import { BacktestResult } from '../../services/api';
import dayjs from 'dayjs';

const { Option } = Select;
const { Panel } = Collapse;
const { RangePicker } = DatePicker;

export interface FilterCriteria {
  strategies: string[];
  symbols: string[];
  returnRange: [number, number];
  sharpeRange: [number, number];
  drawdownRange: [number, number];
  winRateRange: [number, number];
  tradesRange: [number, number];
  dateRange: [dayjs.Dayjs, dayjs.Dayjs] | null;
  sortBy: string;
  sortOrder: 'asc' | 'desc';
  showOnlyProfitable: boolean;
  minTrades: number;
}

interface ResultsFilterProps {
  results: BacktestResult[];
  onFilterChange: (criteria: FilterCriteria) => void;
  loading?: boolean;
}

export const ResultsFilter: React.FC<ResultsFilterProps> = ({
  results,
  onFilterChange,
  loading = false
}) => {
  const { isDark } = useThemeStore();
  const [form] = Form.useForm();

  // 从结果中提取可用的策略和交易对
  const availableStrategies = [...new Set(results.map(r => r.strategy))];
  const availableSymbols = [...new Set(results.map(r => r.symbol))];

  // 计算数据范围
  const dataRanges = {
    return: results.length > 0 ? [
      Math.min(...results.map(r => r.final_return * 100)),
      Math.max(...results.map(r => r.final_return * 100))
    ] : [-50, 50],
    sharpe: results.length > 0 ? [
      Math.min(...results.map(r => r.sharpe_ratio)),
      Math.max(...results.map(r => r.sharpe_ratio))
    ] : [-2, 3],
    drawdown: results.length > 0 ? [
      Math.min(...results.map(r => r.max_drawdown * 100)),
      Math.max(...results.map(r => r.max_drawdown * 100))
    ] : [0, 50],
    winRate: results.length > 0 ? [
      Math.min(...results.map(r => r.win_rate * 100)),
      Math.max(...results.map(r => r.win_rate * 100))
    ] : [0, 100],
    trades: results.length > 0 ? [
      Math.min(...results.map(r => r.total_trades)),
      Math.max(...results.map(r => r.total_trades))
    ] : [0, 1000],
  };

  const [filterCriteria, setFilterCriteria] = useState<FilterCriteria>({
    strategies: [],
    symbols: [],
    returnRange: [dataRanges.return[0], dataRanges.return[1]],
    sharpeRange: [dataRanges.sharpe[0], dataRanges.sharpe[1]],
    drawdownRange: [dataRanges.drawdown[0], dataRanges.drawdown[1]],
    winRateRange: [dataRanges.winRate[0], dataRanges.winRate[1]],
    tradesRange: [dataRanges.trades[0], dataRanges.trades[1]],
    dateRange: null,
    sortBy: 'final_return',
    sortOrder: 'desc',
    showOnlyProfitable: false,
    minTrades: 10,
  });

  const handleFilterChange = (field: keyof FilterCriteria, value: any) => {
    const newCriteria = { ...filterCriteria, [field]: value };
    setFilterCriteria(newCriteria);
    onFilterChange(newCriteria);
  };

  const handleReset = () => {
    const defaultCriteria: FilterCriteria = {
      strategies: [],
      symbols: [],
      returnRange: [dataRanges.return[0], dataRanges.return[1]],
      sharpeRange: [dataRanges.sharpe[0], dataRanges.sharpe[1]],
      drawdownRange: [dataRanges.drawdown[0], dataRanges.drawdown[1]],
      winRateRange: [dataRanges.winRate[0], dataRanges.winRate[1]],
      tradesRange: [dataRanges.trades[0], dataRanges.trades[1]],
      dateRange: null,
      sortBy: 'final_return',
      sortOrder: 'desc',
      showOnlyProfitable: false,
      minTrades: 10,
    };
    setFilterCriteria(defaultCriteria);
    onFilterChange(defaultCriteria);
    form.resetFields();
  };

  const cardStyle = {
    background: isDark ? '#242b3d' : '#ffffff',
    border: `1px solid ${isDark ? '#3a4553' : '#f0f0f0'}`,
    borderRadius: '8px',
  };

  return (
    <Card
      title={
        <Space>
          <FilterOutlined />
          <span>筛选条件</span>
        </Space>
      }
      extra={
        <Button 
          icon={<ReloadOutlined />} 
          onClick={handleReset}
          size="small"
        >
          重置
        </Button>
      }
      style={cardStyle}
      loading={loading}
    >
      <Form form={form} layout="vertical" size="small">
        <Collapse 
          defaultActiveKey={['basic']} 
          ghost
          expandIconPosition="end"
        >
          <Panel header="基础筛选" key="basic">
            <Space direction="vertical" style={{ width: '100%' }} size="middle">
              {/* 策略选择 */}
              <Form.Item label="策略" style={{ marginBottom: 0 }}>
                <Select
                  mode="multiple"
                  placeholder="选择策略（空为全部）"
                  value={filterCriteria.strategies}
                  onChange={(value) => handleFilterChange('strategies', value)}
                  style={{ width: '100%' }}
                  allowClear
                >
                  {availableStrategies.map(strategy => (
                    <Option key={strategy} value={strategy}>
                      {strategy}
                    </Option>
                  ))}
                </Select>
              </Form.Item>

              {/* 交易对选择 */}
              <Form.Item label="交易对" style={{ marginBottom: 0 }}>
                <Select
                  mode="multiple"
                  placeholder="选择交易对（空为全部）"
                  value={filterCriteria.symbols}
                  onChange={(value) => handleFilterChange('symbols', value)}
                  style={{ width: '100%' }}
                  allowClear
                >
                  {availableSymbols.map(symbol => (
                    <Option key={symbol} value={symbol}>
                      {symbol}
                    </Option>
                  ))}
                </Select>
              </Form.Item>

              {/* 日期范围 */}
              <Form.Item label="创建时间" style={{ marginBottom: 0 }}>
                <RangePicker
                  value={filterCriteria.dateRange}
                  onChange={(dates) => handleFilterChange('dateRange', dates)}
                  style={{ width: '100%' }}
                  placeholder={['开始日期', '结束日期']}
                />
              </Form.Item>
            </Space>
          </Panel>

          <Panel header="性能指标" key="performance">
            <Space direction="vertical" style={{ width: '100%' }} size="middle">
              {/* 收益率范围 */}
              <Form.Item 
                label={
                  <Tooltip title="总收益率筛选范围">
                    <span>
                      总收益率 (%)
                      <InfoCircleOutlined style={{ marginLeft: 4 }} />
                    </span>
                  </Tooltip>
                }
                style={{ marginBottom: 0 }}
              >
                <Slider
                  range
                  min={dataRanges.return[0]}
                  max={dataRanges.return[1]}
                  step={1}
                  value={filterCriteria.returnRange}
                  onChange={(value) => handleFilterChange('returnRange', value)}
                  tooltip={{ formatter: (value) => `${value}%` }}
                />
                <div style={{ 
                  display: 'flex', 
                  justifyContent: 'space-between',
                  fontSize: '12px',
                  color: isDark ? '#a0a9c0' : '#666666',
                  marginTop: '4px'
                }}>
                  <span>{filterCriteria.returnRange[0].toFixed(1)}%</span>
                  <span>{filterCriteria.returnRange[1].toFixed(1)}%</span>
                </div>
              </Form.Item>

              {/* 夏普比率范围 */}
              <Form.Item 
                label={
                  <Tooltip title="夏普比率筛选范围">
                    <span>
                      夏普比率
                      <InfoCircleOutlined style={{ marginLeft: 4 }} />
                    </span>
                  </Tooltip>
                }
                style={{ marginBottom: 0 }}
              >
                <Slider
                  range
                  min={dataRanges.sharpe[0]}
                  max={dataRanges.sharpe[1]}
                  step={0.1}
                  value={filterCriteria.sharpeRange}
                  onChange={(value) => handleFilterChange('sharpeRange', value)}
                  tooltip={{ formatter: (value) => value?.toFixed(1) }}
                />
                <div style={{ 
                  display: 'flex', 
                  justifyContent: 'space-between',
                  fontSize: '12px',
                  color: isDark ? '#a0a9c0' : '#666666',
                  marginTop: '4px'
                }}>
                  <span>{filterCriteria.sharpeRange[0].toFixed(1)}</span>
                  <span>{filterCriteria.sharpeRange[1].toFixed(1)}</span>
                </div>
              </Form.Item>

              {/* 最大回撤范围 */}
              <Form.Item 
                label={
                  <Tooltip title="最大回撤筛选范围">
                    <span>
                      最大回撤 (%)
                      <InfoCircleOutlined style={{ marginLeft: 4 }} />
                    </span>
                  </Tooltip>
                }
                style={{ marginBottom: 0 }}
              >
                <Slider
                  range
                  min={dataRanges.drawdown[0]}
                  max={dataRanges.drawdown[1]}
                  step={1}
                  value={filterCriteria.drawdownRange}
                  onChange={(value) => handleFilterChange('drawdownRange', value)}
                  tooltip={{ formatter: (value) => `${value}%` }}
                />
                <div style={{ 
                  display: 'flex', 
                  justifyContent: 'space-between',
                  fontSize: '12px',
                  color: isDark ? '#a0a9c0' : '#666666',
                  marginTop: '4px'
                }}>
                  <span>{filterCriteria.drawdownRange[0].toFixed(1)}%</span>
                  <span>{filterCriteria.drawdownRange[1].toFixed(1)}%</span>
                </div>
              </Form.Item>

              {/* 胜率范围 */}
              <Form.Item 
                label={
                  <Tooltip title="胜率筛选范围">
                    <span>
                      胜率 (%)
                      <InfoCircleOutlined style={{ marginLeft: 4 }} />
                    </span>
                  </Tooltip>
                }
                style={{ marginBottom: 0 }}
              >
                <Slider
                  range
                  min={dataRanges.winRate[0]}
                  max={dataRanges.winRate[1]}
                  step={1}
                  value={filterCriteria.winRateRange}
                  onChange={(value) => handleFilterChange('winRateRange', value)}
                  tooltip={{ formatter: (value) => `${value}%` }}
                />
                <div style={{ 
                  display: 'flex', 
                  justifyContent: 'space-between',
                  fontSize: '12px',
                  color: isDark ? '#a0a9c0' : '#666666',
                  marginTop: '4px'
                }}>
                  <span>{filterCriteria.winRateRange[0].toFixed(1)}%</span>
                  <span>{filterCriteria.winRateRange[1].toFixed(1)}%</span>
                </div>
              </Form.Item>
            </Space>
          </Panel>

          <Panel header="高级选项" key="advanced">
            <Space direction="vertical" style={{ width: '100%' }} size="middle">
              {/* 排序选项 */}
              <Form.Item label="排序方式" style={{ marginBottom: 0 }}>
                <Space.Compact style={{ width: '100%' }}>
                  <Select
                    value={filterCriteria.sortBy}
                    onChange={(value) => handleFilterChange('sortBy', value)}
                    style={{ width: '70%' }}
                  >
                    <Option value="final_return">总收益率</Option>
                    <Option value="annual_return">年化收益率</Option>
                    <Option value="sharpe_ratio">夏普比率</Option>
                    <Option value="max_drawdown">最大回撤</Option>
                    <Option value="win_rate">胜率</Option>
                    <Option value="total_trades">交易次数</Option>
                    <Option value="created_at">创建时间</Option>
                  </Select>
                  <Select
                    value={filterCriteria.sortOrder}
                    onChange={(value) => handleFilterChange('sortOrder', value)}
                    style={{ width: '30%' }}
                  >
                    <Option value="desc">降序</Option>
                    <Option value="asc">升序</Option>
                  </Select>
                </Space.Compact>
              </Form.Item>

              {/* 最小交易次数 */}
              <Form.Item 
                label={
                  <Tooltip title="过滤掉交易次数过少的结果">
                    <span>
                      最小交易次数
                      <InfoCircleOutlined style={{ marginLeft: 4 }} />
                    </span>
                  </Tooltip>
                }
                style={{ marginBottom: 0 }}
              >
                <InputNumber
                  min={0}
                  max={1000}
                  value={filterCriteria.minTrades}
                  onChange={(value) => handleFilterChange('minTrades', value || 0)}
                  style={{ width: '100%' }}
                />
              </Form.Item>

              {/* 只显示盈利策略 */}
              <Form.Item style={{ marginBottom: 0 }}>
                <Space>
                  <Switch
                    checked={filterCriteria.showOnlyProfitable}
                    onChange={(checked) => handleFilterChange('showOnlyProfitable', checked)}
                  />
                  <span>只显示盈利策略</span>
                </Space>
              </Form.Item>
            </Space>
          </Panel>
        </Collapse>
      </Form>
    </Card>
  );
};
