import React, { useState, useEffect } from 'react';
import { Card, Table, Button, Progress, Tag, Space, Select, message } from 'antd';
import { DownloadOutlined, ReloadOutlined, DatabaseOutlined } from '@ant-design/icons';
import { useThemeStore } from '../../stores/themeStore';

const { Option } = Select;

interface SymbolData {
  symbol: string;
  status: 'available' | 'downloading' | 'completed' | 'error';
  lastUpdate: string;
  size: string;
}

export const DataManagement: React.FC = () => {
  const { isDark } = useThemeStore();
  const [loading, setLoading] = useState(false);
  const [downloadProgress, setDownloadProgress] = useState(0);
  const [selectedTradeType, setSelectedTradeType] = useState('swap');
  const [symbols, setSymbols] = useState<SymbolData[]>([]);

  // 模拟数据
  useEffect(() => {
    const mockSymbols: SymbolData[] = [
      { symbol: 'BTCUSDT', status: 'completed', lastUpdate: '2025-05-30 17:00', size: '2.3GB' },
      { symbol: 'ETHUSDT', status: 'completed', lastUpdate: '2025-05-30 17:00', size: '1.8GB' },
      { symbol: 'BNBUSDT', status: 'available', lastUpdate: '2025-05-29 16:00', size: '1.2GB' },
      { symbol: 'ADAUSDT', status: 'downloading', lastUpdate: '2025-05-30 16:30', size: '0.9GB' },
      { symbol: 'SOLUSDT', status: 'available', lastUpdate: '2025-05-29 15:00', size: '0.8GB' },
    ];
    setSymbols(mockSymbols);
  }, []);

  const handleDownload = async () => {
    setLoading(true);
    setDownloadProgress(0);
    
    // 模拟下载进度
    const interval = setInterval(() => {
      setDownloadProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval);
          setLoading(false);
          message.success('数据下载完成！');
          return 100;
        }
        return prev + 10;
      });
    }, 500);
  };

  const columns = [
    {
      title: '交易对',
      dataIndex: 'symbol',
      key: 'symbol',
      render: (text: string) => (
        <Space>
          <DatabaseOutlined />
          <strong>{text}</strong>
        </Space>
      ),
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => {
        const statusConfig = {
          available: { color: 'blue', text: '可用' },
          downloading: { color: 'orange', text: '下载中' },
          completed: { color: 'green', text: '已完成' },
          error: { color: 'red', text: '错误' },
        };
        const config = statusConfig[status as keyof typeof statusConfig];
        return <Tag color={config.color}>{config.text}</Tag>;
      },
    },
    {
      title: '最后更新',
      dataIndex: 'lastUpdate',
      key: 'lastUpdate',
    },
    {
      title: '数据大小',
      dataIndex: 'size',
      key: 'size',
    },
    {
      title: '操作',
      key: 'action',
      render: (_: any, record: SymbolData) => (
        <Space>
          <Button 
            size="small" 
            icon={<DownloadOutlined />}
            disabled={record.status === 'downloading'}
          >
            下载
          </Button>
          <Button size="small" icon={<ReloadOutlined />}>
            刷新
          </Button>
        </Space>
      ),
    },
  ];

  return (
    <div style={{ padding: '24px' }}>
      <Card
        title="数据管理"
        extra={
          <Space>
            <Select
              value={selectedTradeType}
              onChange={setSelectedTradeType}
              style={{ width: 120 }}
            >
              <Option value="swap">合约</Option>
              <Option value="spot">现货</Option>
            </Select>
            <Button
              type="primary"
              icon={<DownloadOutlined />}
              loading={loading}
              onClick={handleDownload}
            >
              批量下载
            </Button>
          </Space>
        }
        style={{
          background: isDark ? '#242b3d' : '#ffffff',
          border: `1px solid ${isDark ? '#3a4553' : '#f0f0f0'}`,
        }}
      >
        {loading && (
          <div style={{ marginBottom: '16px' }}>
            <Progress percent={downloadProgress} status="active" />
            <p style={{ marginTop: '8px', color: isDark ? '#a0a9c0' : '#666' }}>
              正在下载数据... {downloadProgress}%
            </p>
          </div>
        )}
        
        <Table
          columns={columns}
          dataSource={symbols}
          rowKey="symbol"
          pagination={{ pageSize: 10 }}
          style={{
            background: 'transparent',
          }}
        />
      </Card>
    </div>
  );
};
