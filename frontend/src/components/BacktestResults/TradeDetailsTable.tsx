import React, { useState, useMemo } from 'react';
import { Table, Tag, Space, Button, Input, Select, DatePicker, Tooltip } from 'antd';
import { 
  SearchOutlined, 
  FilterOutlined, 
  DownloadOutlined,
  RiseOutlined,
  FallOutlined,
  DollarOutlined
} from '@ant-design/icons';
import { useThemeStore } from '../../stores/themeStore';
import { TradeRecord } from '../../services/api';
import dayjs from 'dayjs';

const { Search } = Input;
const { Option } = Select;
const { RangePicker } = DatePicker;

interface TradeDetailsTableProps {
  trades: TradeRecord[];
  loading?: boolean;
  onExport?: () => void;
}

export const TradeDetailsTable: React.FC<TradeDetailsTableProps> = ({
  trades,
  loading = false,
  onExport
}) => {
  const { isDark } = useThemeStore();
  const [searchText, setSearchText] = useState('');
  const [filterSide, setFilterSide] = useState<'all' | 'buy' | 'sell'>('all');
  const [filterPnL, setFilterPnL] = useState<'all' | 'profit' | 'loss'>('all');
  const [dateRange, setDateRange] = useState<[dayjs.Dayjs, dayjs.Dayjs] | null>(null);

  // 过滤和搜索逻辑
  const filteredTrades = useMemo(() => {
    return trades.filter(trade => {
      // 搜索过滤
      const matchesSearch = !searchText || 
        trade.symbol.toLowerCase().includes(searchText.toLowerCase()) ||
        trade.id.toLowerCase().includes(searchText.toLowerCase());

      // 交易方向过滤
      const matchesSide = filterSide === 'all' || trade.side === filterSide;

      // 盈亏过滤
      const matchesPnL = filterPnL === 'all' || 
        (filterPnL === 'profit' && trade.pnl > 0) ||
        (filterPnL === 'loss' && trade.pnl < 0);

      // 日期范围过滤
      const matchesDate = !dateRange || (
        dayjs(trade.timestamp).isAfter(dateRange[0]) &&
        dayjs(trade.timestamp).isBefore(dateRange[1])
      );

      return matchesSearch && matchesSide && matchesPnL && matchesDate;
    });
  }, [trades, searchText, filterSide, filterPnL, dateRange]);

  const columns = [
    {
      title: '交易ID',
      dataIndex: 'id',
      key: 'id',
      width: 120,
      render: (id: string) => (
        <span style={{ 
          fontFamily: 'monospace',
          color: isDark ? '#00d4ff' : '#1890ff'
        }}>
          {id.slice(-8)}
        </span>
      ),
    },
    {
      title: '交易对',
      dataIndex: 'symbol',
      key: 'symbol',
      width: 120,
      render: (symbol: string) => (
        <Tag color={isDark ? 'blue' : 'geekblue'}>
          {symbol}
        </Tag>
      ),
    },
    {
      title: '方向',
      dataIndex: 'side',
      key: 'side',
      width: 80,
      render: (side: 'buy' | 'sell') => (
        <Tag 
          color={side === 'buy' ? 'green' : 'red'}
          icon={side === 'buy' ? <RiseOutlined /> : <FallOutlined />}
        >
          {side === 'buy' ? '买入' : '卖出'}
        </Tag>
      ),
    },
    {
      title: '数量',
      dataIndex: 'quantity',
      key: 'quantity',
      width: 120,
      align: 'right' as const,
      render: (quantity: number) => (
        <span style={{ fontFamily: 'monospace' }}>
          {quantity.toLocaleString('zh-CN', { 
            minimumFractionDigits: 4,
            maximumFractionDigits: 4 
          })}
        </span>
      ),
    },
    {
      title: '价格',
      dataIndex: 'price',
      key: 'price',
      width: 120,
      align: 'right' as const,
      render: (price: number) => (
        <span style={{ fontFamily: 'monospace' }}>
          ${price.toLocaleString('zh-CN', { 
            minimumFractionDigits: 2,
            maximumFractionDigits: 6 
          })}
        </span>
      ),
    },
    {
      title: '盈亏',
      dataIndex: 'pnl',
      key: 'pnl',
      width: 120,
      align: 'right' as const,
      render: (pnl: number) => (
        <span 
          style={{ 
            color: pnl > 0 ? '#00ff88' : pnl < 0 ? '#ff4757' : isDark ? '#a0a9c0' : '#666666',
            fontFamily: 'monospace',
            fontWeight: 600
          }}
        >
          {pnl > 0 ? '+' : ''}${pnl.toFixed(2)}
        </span>
      ),
      sorter: (a: TradeRecord, b: TradeRecord) => a.pnl - b.pnl,
    },
    {
      title: '手续费',
      dataIndex: 'commission',
      key: 'commission',
      width: 100,
      align: 'right' as const,
      render: (commission: number) => (
        <span style={{ 
          fontFamily: 'monospace',
          color: '#ff4757'
        }}>
          ${commission.toFixed(2)}
        </span>
      ),
    },
    {
      title: '滑点',
      dataIndex: 'slippage',
      key: 'slippage',
      width: 100,
      align: 'right' as const,
      render: (slippage: number) => (
        <span style={{ 
          fontFamily: 'monospace',
          color: '#ff4757'
        }}>
          ${slippage.toFixed(2)}
        </span>
      ),
    },
    {
      title: '时间',
      dataIndex: 'timestamp',
      key: 'timestamp',
      width: 160,
      render: (timestamp: string) => (
        <span style={{ fontFamily: 'monospace' }}>
          {dayjs(timestamp).format('YYYY-MM-DD HH:mm:ss')}
        </span>
      ),
      sorter: (a: TradeRecord, b: TradeRecord) => 
        new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime(),
    },
  ];

  // 计算汇总统计
  const summary = useMemo(() => {
    const totalPnL = filteredTrades.reduce((sum, trade) => sum + trade.pnl, 0);
    const totalCommission = filteredTrades.reduce((sum, trade) => sum + trade.commission, 0);
    const totalSlippage = filteredTrades.reduce((sum, trade) => sum + trade.slippage, 0);
    const winningTrades = filteredTrades.filter(trade => trade.pnl > 0).length;
    const losingTrades = filteredTrades.filter(trade => trade.pnl < 0).length;
    const winRate = filteredTrades.length > 0 ? (winningTrades / filteredTrades.length) * 100 : 0;

    return {
      totalTrades: filteredTrades.length,
      totalPnL,
      totalCommission,
      totalSlippage,
      winningTrades,
      losingTrades,
      winRate,
    };
  }, [filteredTrades]);

  return (
    <div style={{ width: '100%' }}>
      {/* 过滤器和搜索 */}
      <div style={{ 
        marginBottom: '16px',
        padding: '16px',
        background: isDark ? '#242b3d' : '#fafafa',
        borderRadius: '8px',
        border: `1px solid ${isDark ? '#3a4553' : '#f0f0f0'}`
      }}>
        <Space wrap size="middle">
          <Search
            placeholder="搜索交易对或交易ID"
            allowClear
            style={{ width: 200 }}
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            prefix={<SearchOutlined />}
          />
          
          <Select
            value={filterSide}
            onChange={setFilterSide}
            style={{ width: 120 }}
            prefix={<FilterOutlined />}
          >
            <Option value="all">全部方向</Option>
            <Option value="buy">买入</Option>
            <Option value="sell">卖出</Option>
          </Select>

          <Select
            value={filterPnL}
            onChange={setFilterPnL}
            style={{ width: 120 }}
          >
            <Option value="all">全部盈亏</Option>
            <Option value="profit">盈利</Option>
            <Option value="loss">亏损</Option>
          </Select>

          <RangePicker
            value={dateRange}
            onChange={setDateRange}
            style={{ width: 240 }}
            placeholder={['开始日期', '结束日期']}
          />

          <Button
            icon={<DownloadOutlined />}
            onClick={onExport}
            type="primary"
          >
            导出数据
          </Button>
        </Space>
      </div>

      {/* 汇总统计 */}
      <div style={{ 
        marginBottom: '16px',
        padding: '12px 16px',
        background: isDark ? '#1a1f2e' : '#f0f9ff',
        borderRadius: '6px',
        border: `1px solid ${isDark ? '#3a4553' : '#e0f2fe'}`
      }}>
        <Space size="large" wrap>
          <span>
            <strong>总交易: </strong>
            <span style={{ color: '#00d4ff' }}>{summary.totalTrades}</span>
          </span>
          <span>
            <strong>总盈亏: </strong>
            <span style={{ 
              color: summary.totalPnL > 0 ? '#00ff88' : summary.totalPnL < 0 ? '#ff4757' : '#666666',
              fontWeight: 600
            }}>
              {summary.totalPnL > 0 ? '+' : ''}${summary.totalPnL.toFixed(2)}
            </span>
          </span>
          <span>
            <strong>胜率: </strong>
            <span style={{ color: summary.winRate > 50 ? '#00ff88' : '#ff4757' }}>
              {summary.winRate.toFixed(1)}%
            </span>
          </span>
          <span>
            <strong>总手续费: </strong>
            <span style={{ color: '#ff4757' }}>
              ${summary.totalCommission.toFixed(2)}
            </span>
          </span>
          <span>
            <strong>总滑点: </strong>
            <span style={{ color: '#ff4757' }}>
              ${summary.totalSlippage.toFixed(2)}
            </span>
          </span>
        </Space>
      </div>

      {/* 交易记录表格 */}
      <Table
        columns={columns}
        dataSource={filteredTrades}
        rowKey="id"
        loading={loading}
        pagination={{
          pageSize: 50,
          showSizeChanger: true,
          showQuickJumper: true,
          showTotal: (total, range) => 
            `第 ${range[0]}-${range[1]} 条，共 ${total} 条交易记录`,
        }}
        scroll={{ x: 1200 }}
        size="small"
        style={{
          background: isDark ? '#242b3d' : '#ffffff',
          borderRadius: '8px',
        }}
        locale={{
          emptyText: loading ? '加载中...' : '暂无交易记录'
        }}
      />
    </div>
  );
};
