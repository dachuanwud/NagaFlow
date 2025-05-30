import React, { useState } from 'react';
import { Card, Table, Button, Space, Tag, Modal, Form, Input, Select } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, CodeOutlined } from '@ant-design/icons';
import { useThemeStore } from '../../stores/themeStore';

const { Option } = Select;
const { TextArea } = Input;

interface Strategy {
  id: string;
  name: string;
  description: string;
  type: 'sma' | 'rsi' | 'macd' | 'custom';
  parameters: Record<string, any>;
  isActive: boolean;
  createdAt: string;
  performance?: {
    return: number;
    sharpe: number;
    drawdown: number;
  };
}

export const StrategyManagement: React.FC = () => {
  const { isDark } = useThemeStore();
  const [strategies, setStrategies] = useState<Strategy[]>([
    {
      id: '1',
      name: 'SMA交叉策略',
      description: '基于简单移动平均线的交叉信号策略',
      type: 'sma',
      parameters: { fastPeriod: 10, slowPeriod: 30 },
      isActive: true,
      createdAt: '2025-05-30',
      performance: { return: 15.6, sharpe: 1.8, drawdown: 8.2 },
    },
    {
      id: '2',
      name: 'RSI超买超卖策略',
      description: '基于RSI指标的超买超卖策略',
      type: 'rsi',
      parameters: { period: 14, overbought: 70, oversold: 30 },
      isActive: false,
      createdAt: '2025-05-29',
      performance: { return: 12.3, sharpe: 1.5, drawdown: 6.8 },
    },
  ]);
  
  const [modalVisible, setModalVisible] = useState(false);
  const [editingStrategy, setEditingStrategy] = useState<Strategy | null>(null);
  const [form] = Form.useForm();

  const handleCreate = () => {
    setEditingStrategy(null);
    form.resetFields();
    setModalVisible(true);
  };

  const handleEdit = (strategy: Strategy) => {
    setEditingStrategy(strategy);
    form.setFieldsValue(strategy);
    setModalVisible(true);
  };

  const handleDelete = (id: string) => {
    Modal.confirm({
      title: '确认删除',
      content: '确定要删除这个策略吗？',
      onOk: () => {
        setStrategies(prev => prev.filter(s => s.id !== id));
      },
    });
  };

  const handleSubmit = async (values: any) => {
    if (editingStrategy) {
      // 编辑策略
      setStrategies(prev => prev.map(s => 
        s.id === editingStrategy.id 
          ? { ...s, ...values }
          : s
      ));
    } else {
      // 创建新策略
      const newStrategy: Strategy = {
        id: Date.now().toString(),
        ...values,
        isActive: true,
        createdAt: new Date().toISOString().split('T')[0],
      };
      setStrategies(prev => [newStrategy, ...prev]);
    }
    setModalVisible(false);
  };

  const columns = [
    {
      title: '策略名称',
      dataIndex: 'name',
      key: 'name',
      render: (text: string, record: Strategy) => (
        <Space>
          <CodeOutlined />
          <strong>{text}</strong>
          {!record.isActive && <Tag color="red">已停用</Tag>}
        </Space>
      ),
    },
    {
      title: '类型',
      dataIndex: 'type',
      key: 'type',
      render: (type: string) => {
        const typeConfig = {
          sma: { color: 'blue', text: 'SMA' },
          rsi: { color: 'green', text: 'RSI' },
          macd: { color: 'orange', text: 'MACD' },
          custom: { color: 'purple', text: '自定义' },
        };
        const config = typeConfig[type as keyof typeof typeConfig];
        return <Tag color={config.color}>{config.text}</Tag>;
      },
    },
    {
      title: '描述',
      dataIndex: 'description',
      key: 'description',
      ellipsis: true,
    },
    {
      title: '收益率',
      key: 'return',
      render: (_: any, record: Strategy) => (
        record.performance ? (
          <span style={{ color: record.performance.return > 0 ? '#00ff88' : '#ff4757' }}>
            {record.performance.return.toFixed(1)}%
          </span>
        ) : '-'
      ),
    },
    {
      title: '夏普比率',
      key: 'sharpe',
      render: (_: any, record: Strategy) => (
        record.performance ? record.performance.sharpe.toFixed(2) : '-'
      ),
    },
    {
      title: '最大回撤',
      key: 'drawdown',
      render: (_: any, record: Strategy) => (
        record.performance ? `${record.performance.drawdown.toFixed(1)}%` : '-'
      ),
    },
    {
      title: '创建时间',
      dataIndex: 'createdAt',
      key: 'createdAt',
    },
    {
      title: '操作',
      key: 'action',
      render: (_: any, record: Strategy) => (
        <Space>
          <Button 
            size="small" 
            icon={<EditOutlined />}
            onClick={() => handleEdit(record)}
          >
            编辑
          </Button>
          <Button 
            size="small" 
            danger
            icon={<DeleteOutlined />}
            onClick={() => handleDelete(record.id)}
          >
            删除
          </Button>
        </Space>
      ),
    },
  ];

  return (
    <div style={{ padding: '24px' }}>
      <Card
        title="策略管理"
        extra={
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={handleCreate}
          >
            创建策略
          </Button>
        }
        style={{
          background: isDark ? '#242b3d' : '#ffffff',
          border: `1px solid ${isDark ? '#3a4553' : '#f0f0f0'}`,
        }}
      >
        <Table
          columns={columns}
          dataSource={strategies}
          rowKey="id"
          pagination={{ pageSize: 10 }}
          style={{ background: 'transparent' }}
        />
      </Card>

      <Modal
        title={editingStrategy ? '编辑策略' : '创建策略'}
        open={modalVisible}
        onCancel={() => setModalVisible(false)}
        onOk={() => form.submit()}
        width={600}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
        >
          <Form.Item
            name="name"
            label="策略名称"
            rules={[{ required: true, message: '请输入策略名称' }]}
          >
            <Input placeholder="请输入策略名称" />
          </Form.Item>
          
          <Form.Item
            name="type"
            label="策略类型"
            rules={[{ required: true, message: '请选择策略类型' }]}
          >
            <Select placeholder="请选择策略类型">
              <Option value="sma">SMA策略</Option>
              <Option value="rsi">RSI策略</Option>
              <Option value="macd">MACD策略</Option>
              <Option value="custom">自定义策略</Option>
            </Select>
          </Form.Item>
          
          <Form.Item
            name="description"
            label="策略描述"
            rules={[{ required: true, message: '请输入策略描述' }]}
          >
            <TextArea rows={3} placeholder="请输入策略描述" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};
