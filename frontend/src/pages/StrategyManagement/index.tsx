import React, { useState, useEffect } from 'react';
import { Card, Table, Button, Space, Tag, Modal, Form, Input, Select, message, Switch } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, CodeOutlined, CopyOutlined } from '@ant-design/icons';
import { useThemeStore } from '../../stores/themeStore';
import { useTranslation } from '../../hooks/useTranslation';
import { designTokens, getThemeColors } from '../../styles/designSystem';
import { PageContainer, CardContainer, FlexContainer } from '../../components/UI/Container';
import { Heading, Text } from '../../components/UI/Typography';
import { PageTransition, CardAnimation } from '../../components/Animation/PageTransition';
import { strategiesApi, Strategy, FactorInfo } from '../../services/api';
import { dataUtils } from '../../services/mockApi';

const { Option } = Select;
const { TextArea } = Input;

export const StrategyManagement: React.FC = () => {
  const { isDark } = useThemeStore();
  const { t } = useTranslation();
  const themeColors = getThemeColors(isDark);
  const [strategies, setStrategies] = useState<Strategy[]>([]);
  const [factors, setFactors] = useState<FactorInfo[]>([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingStrategy, setEditingStrategy] = useState<Strategy | null>(null);
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [strategiesLoading, setStrategiesLoading] = useState(false);

  // 获取策略列表
  const fetchStrategies = async () => {
    try {
      setStrategiesLoading(true);
      const strategyList = await strategiesApi.listStrategies();
      setStrategies(strategyList);
    } catch (error) {
      console.error('Failed to fetch strategies:', error);
    } finally {
      setStrategiesLoading(false);
    }
  };

  // 获取可用因子列表
  const fetchFactors = async () => {
    try {
      const factorList = await strategiesApi.listFactors();
      setFactors(factorList);
    } catch (error) {
      console.error('Failed to fetch factors:', error);
    }
  };

  // 初始化数据
  useEffect(() => {
    fetchStrategies();
    fetchFactors();
  }, []);

  const handleCreate = () => {
    setEditingStrategy(null);
    form.resetFields();
    setModalVisible(true);
  };

  const handleEdit = (strategy: Strategy) => {
    setEditingStrategy(strategy);
    form.setFieldsValue({
      name: strategy.name,
      description: strategy.description,
      parameters: strategy.parameters,
      is_active: strategy.is_active,
    });
    setModalVisible(true);
  };

  const handleDelete = (id: string) => {
    Modal.confirm({
      title: '确认删除',
      content: '确定要删除这个策略吗？',
      onOk: async () => {
        try {
          await strategiesApi.deleteStrategy(id);
          message.success('策略删除成功');
          fetchStrategies();
        } catch (error) {
          console.error('Failed to delete strategy:', error);
          message.error('删除策略失败');
        }
      },
    });
  };

  const handleSubmit = async (values: any) => {
    try {
      setLoading(true);

      if (editingStrategy) {
        // 编辑策略
        await strategiesApi.updateStrategy(editingStrategy.id, values);
        message.success('策略更新成功');
      } else {
        // 创建新策略
        await strategiesApi.createStrategy(values);
        message.success('策略创建成功');
      }

      setModalVisible(false);
      fetchStrategies();

    } catch (error) {
      console.error('Failed to save strategy:', error);
      message.error(editingStrategy ? '更新策略失败' : '创建策略失败');
    } finally {
      setLoading(false);
    }
  };

  // 克隆策略
  const handleClone = async (strategy: Strategy) => {
    try {
      const newName = `${strategy.name} - 副本`;
      await strategiesApi.cloneStrategy(strategy.id, newName);
      message.success('策略克隆成功');
      fetchStrategies();
    } catch (error) {
      console.error('Failed to clone strategy:', error);
      message.error('克隆策略失败');
    }
  };

  // 切换策略状态
  const handleToggleActive = async (strategy: Strategy) => {
    try {
      await strategiesApi.updateStrategy(strategy.id, {
        is_active: !strategy.is_active
      });
      message.success(`策略已${strategy.is_active ? '停用' : '启用'}`);
      fetchStrategies();
    } catch (error) {
      console.error('Failed to toggle strategy status:', error);
      message.error('更新策略状态失败');
    }
  };

  const columns = [
    {
      title: '策略名称',
      dataIndex: 'name',
      key: 'name',
      render: (text: string, record: Strategy) => (
        <Space>
          <CodeOutlined style={{ color: designTokens.colors.primary[500] }} />
          <Text weight="semibold" as="span">{text}</Text>
          {!record.is_active && <Tag color="red">已停用</Tag>}
        </Space>
      ),
    },
    {
      title: '状态',
      dataIndex: 'is_active',
      key: 'is_active',
      render: (isActive: boolean, record: Strategy) => (
        <Switch
          checked={isActive}
          onChange={() => handleToggleActive(record)}
          checkedChildren="启用"
          unCheckedChildren="停用"
        />
      ),
    },
    {
      title: '描述',
      dataIndex: 'description',
      key: 'description',
      ellipsis: true,
    },
    {
      title: '参数',
      dataIndex: 'parameters',
      key: 'parameters',
      render: (parameters: Record<string, any>) => (
        <Text size="sm" color="secondary">
          {Object.keys(parameters).length > 0
            ? `${Object.keys(parameters).length} 个参数`
            : '无参数'
          }
        </Text>
      ),
    },
    {
      title: '创建时间',
      dataIndex: 'created_at',
      key: 'created_at',
      render: (text: string) => dataUtils.formatDateTime(text),
    },
    {
      title: '更新时间',
      dataIndex: 'updated_at',
      key: 'updated_at',
      render: (text: string) => dataUtils.formatDateTime(text),
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
            icon={<CopyOutlined />}
            onClick={() => handleClone(record)}
          >
            克隆
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
          loading={strategiesLoading}
          style={{ background: 'transparent' }}
          locale={{
            emptyText: strategiesLoading ? '加载中...' : '暂无策略'
          }}
        />
      </Card>

      <Modal
        title={editingStrategy ? '编辑策略' : '创建策略'}
        open={modalVisible}
        onCancel={() => setModalVisible(false)}
        onOk={() => form.submit()}
        confirmLoading={loading}
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
            name="description"
            label="策略描述"
            rules={[{ required: true, message: '请输入策略描述' }]}
          >
            <TextArea rows={3} placeholder="请输入策略描述" />
          </Form.Item>

          <Form.Item
            name="parameters"
            label="策略参数 (JSON格式)"
            help={'请输入有效的JSON格式参数，例如: {"period": 14, "threshold": 0.7}'}
          >
            <TextArea
              rows={4}
              placeholder='{"period": 14, "threshold": 0.7}'
            />
          </Form.Item>

          <Form.Item
            name="is_active"
            label="启用状态"
            valuePropName="checked"
          >
            <Switch checkedChildren="启用" unCheckedChildren="停用" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};
