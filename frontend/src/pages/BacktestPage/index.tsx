import React, { useState } from 'react';
import { Card, Form, Select, InputNumber, Button, Table, Progress, Space, Tag } from 'antd';
import { PlayCircleOutlined, SettingOutlined, BarChartOutlined } from '@ant-design/icons';
import { useThemeStore } from '../../stores/themeStore';

const { Option } = Select;

interface BacktestTask {
  id: string;
  strategy: string;
  symbols: string[];
  status: 'pending' | 'running' | 'completed' | 'failed';
  progress: number;
  result?: {
    totalReturn: number;
    sharpeRatio: number;
    maxDrawdown: number;
  };
}

export const BacktestPage: React.FC = () => {
  const { isDark } = useThemeStore();
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [tasks, setTasks] = useState<BacktestTask[]>([
    {
      id: '1',
      strategy: 'SMA策略',
      symbols: ['BTCUSDT', 'ETHUSDT'],
      status: 'completed',
      progress: 100,
      result: {
        totalReturn: 25.6,
        sharpeRatio: 1.8,
        maxDrawdown: 8.2,
      },
    },
    {
      id: '2',
      strategy: 'RSI策略',
      symbols: ['BNBUSDT'],
      status: 'running',
      progress: 65,
    },
  ]);

  const handleSubmit = async (values: any) => {
    setLoading(true);
    
    // 模拟回测任务创建
    const newTask: BacktestTask = {
      id: Date.now().toString(),
      strategy: values.strategy,
      symbols: values.symbols,
      status: 'pending',
      progress: 0,
    };
    
    setTasks(prev => [newTask, ...prev]);
    
    // 模拟任务执行
    setTimeout(() => {
      setTasks(prev => prev.map(task => 
        task.id === newTask.id 
          ? { ...task, status: 'running', progress: 30 }
          : task
      ));
    }, 1000);
    
    setTimeout(() => {
      setTasks(prev => prev.map(task => 
        task.id === newTask.id 
          ? { 
              ...task, 
              status: 'completed', 
              progress: 100,
              result: {
                totalReturn: Math.random() * 50 - 10,
                sharpeRatio: Math.random() * 3,
                maxDrawdown: Math.random() * 20,
              }
            }
          : task
      ));
      setLoading(false);
    }, 3000);
  };

  const columns = [
    {
      title: '任务ID',
      dataIndex: 'id',
      key: 'id',
      width: 100,
    },
    {
      title: '策略',
      dataIndex: 'strategy',
      key: 'strategy',
    },
    {
      title: '交易对',
      dataIndex: 'symbols',
      key: 'symbols',
      render: (symbols: string[]) => (
        <Space>
          {symbols.map(symbol => (
            <Tag key={symbol}>{symbol}</Tag>
          ))}
        </Space>
      ),
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => {
        const statusConfig = {
          pending: { color: 'blue', text: '等待中' },
          running: { color: 'orange', text: '运行中' },
          completed: { color: 'green', text: '已完成' },
          failed: { color: 'red', text: '失败' },
        };
        const config = statusConfig[status as keyof typeof statusConfig];
        return <Tag color={config.color}>{config.text}</Tag>;
      },
    },
    {
      title: '进度',
      dataIndex: 'progress',
      key: 'progress',
      render: (progress: number) => (
        <Progress percent={progress} size="small" />
      ),
    },
    {
      title: '总收益率',
      key: 'totalReturn',
      render: (_: any, record: BacktestTask) => (
        record.result ? (
          <span style={{ color: record.result.totalReturn > 0 ? '#00ff88' : '#ff4757' }}>
            {record.result.totalReturn.toFixed(2)}%
          </span>
        ) : '-'
      ),
    },
    {
      title: '夏普比率',
      key: 'sharpeRatio',
      render: (_: any, record: BacktestTask) => (
        record.result ? record.result.sharpeRatio.toFixed(2) : '-'
      ),
    },
    {
      title: '最大回撤',
      key: 'maxDrawdown',
      render: (_: any, record: BacktestTask) => (
        record.result ? `${record.result.maxDrawdown.toFixed(2)}%` : '-'
      ),
    },
    {
      title: '操作',
      key: 'action',
      render: (_: any, record: BacktestTask) => (
        <Space>
          <Button size="small" icon={<BarChartOutlined />}>
            查看结果
          </Button>
        </Space>
      ),
    },
  ];

  return (
    <div style={{ padding: '24px' }}>
      <Space direction="vertical" size="large" style={{ width: '100%' }}>
        {/* 回测配置 */}
        <Card
          title="回测配置"
          icon={<SettingOutlined />}
          style={{
            background: isDark ? '#242b3d' : '#ffffff',
            border: `1px solid ${isDark ? '#3a4553' : '#f0f0f0'}`,
          }}
        >
          <Form
            form={form}
            layout="inline"
            onFinish={handleSubmit}
            initialValues={{
              strategy: 'sma',
              symbols: ['BTCUSDT'],
              leverage: 1,
              startDate: '2024-01-01',
              endDate: '2024-12-31',
            }}
          >
            <Form.Item name="strategy" label="策略">
              <Select style={{ width: 150 }}>
                <Option value="sma">SMA策略</Option>
                <Option value="rsi">RSI策略</Option>
                <Option value="macd">MACD策略</Option>
              </Select>
            </Form.Item>
            
            <Form.Item name="symbols" label="交易对">
              <Select mode="multiple" style={{ width: 200 }}>
                <Option value="BTCUSDT">BTCUSDT</Option>
                <Option value="ETHUSDT">ETHUSDT</Option>
                <Option value="BNBUSDT">BNBUSDT</Option>
                <Option value="ADAUSDT">ADAUSDT</Option>
              </Select>
            </Form.Item>
            
            <Form.Item name="leverage" label="杠杆倍数">
              <InputNumber min={1} max={10} style={{ width: 100 }} />
            </Form.Item>
            
            <Form.Item>
              <Button
                type="primary"
                htmlType="submit"
                icon={<PlayCircleOutlined />}
                loading={loading}
              >
                开始回测
              </Button>
            </Form.Item>
          </Form>
        </Card>

        {/* 回测任务列表 */}
        <Card
          title="回测任务"
          style={{
            background: isDark ? '#242b3d' : '#ffffff',
            border: `1px solid ${isDark ? '#3a4553' : '#f0f0f0'}`,
          }}
        >
          <Table
            columns={columns}
            dataSource={tasks}
            rowKey="id"
            pagination={{ pageSize: 10 }}
            style={{ background: 'transparent' }}
          />
        </Card>
      </Space>
    </div>
  );
};
