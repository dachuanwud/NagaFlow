import React, { useState, useEffect } from 'react';
import { Card, Form, Select, InputNumber, Button, Table, Progress, Space, Tag, message, DatePicker, Spin, Modal } from 'antd';
import { PlayCircleOutlined, SettingOutlined, BarChartOutlined, DeleteOutlined } from '@ant-design/icons';
import { useThemeStore } from '../../stores/themeStore';
import { useTranslation } from '../../hooks/useTranslation';
import { Text } from '../../components/UI/Typography';
import { backtestApi, strategiesApi, dataApi, BacktestRequest, BacktestStatus, SymbolInfo, FactorInfo } from '../../services/api';
import { dataUtils } from '../../services/mockApi';
import { BacktestResultsModal } from './BacktestResultsModal';
import dayjs from 'dayjs';

const { Option } = Select;
const { RangePicker } = DatePicker;

export const BacktestPage: React.FC = () => {
  const { isDark } = useThemeStore();
  const { t } = useTranslation();
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [tasks, setTasks] = useState<BacktestStatus[]>([]);
  const [symbols, setSymbols] = useState<SymbolInfo[]>([]);
  const [factors, setFactors] = useState<FactorInfo[]>([]);
  const [tasksLoading, setTasksLoading] = useState(false);
  const [pageLoading, setPageLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [resultsModalVisible, setResultsModalVisible] = useState(false);
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);

  // 获取可用的交易对
  const fetchSymbols = async () => {
    try {
      console.log('Fetching symbols...');
      const symbolList = await dataApi.getSymbols('swap');
      console.log('Symbols fetched:', symbolList?.length || 0);
      setSymbols(symbolList || []);
    } catch (error) {
      console.error('Failed to fetch symbols:', error);
      message.error('获取交易对失败');
    }
  };

  // 获取可用的策略因子
  const fetchFactors = async () => {
    try {
      console.log('Fetching factors...');
      const factorList = await strategiesApi.listFactors();
      console.log('Factors fetched:', factorList?.length || 0);
      setFactors(factorList || []);
    } catch (error) {
      console.error('Failed to fetch factors:', error);
      message.error('获取策略因子失败');
    }
  };

  // 获取回测任务列表
  const fetchTasks = async () => {
    try {
      setTasksLoading(true);
      console.log('Fetching tasks...');
      const taskList = await backtestApi.listTasks();
      console.log('Tasks fetched:', taskList?.length || 0);
      setTasks(taskList || []);
    } catch (error) {
      console.error('Failed to fetch tasks:', error);
      message.error('获取任务列表失败');
    } finally {
      setTasksLoading(false);
    }
  };

  // 轮询任务状态
  const pollTaskStatus = async (taskId: string) => {
    try {
      const status = await backtestApi.getBacktestStatus(taskId);

      setTasks(prev => prev.map(task =>
        task.task_id === taskId ? status : task
      ));

      // 如果任务还在运行，继续轮询
      if (status.status === 'running' || status.status === 'pending') {
        setTimeout(() => pollTaskStatus(taskId), 3000);
      }
    } catch (error) {
      console.error('Failed to poll task status:', error);
    }
  };

  // 初始化数据
  useEffect(() => {
    const initializeData = async () => {
      try {
        setPageLoading(true);
        setError(null);
        console.log('Initializing BacktestPage...');

        // 并行获取所有数据
        await Promise.all([
          fetchSymbols(),
          fetchFactors(),
          fetchTasks()
        ]);

        console.log('BacktestPage initialization complete');
      } catch (error) {
        console.error('Failed to initialize page:', error);
        setError('页面初始化失败，请刷新重试');
      } finally {
        setPageLoading(false);
      }
    };

    initializeData();
  }, []);

  const handleSubmit = async (values: any) => {
    try {
      setLoading(true);

      // 构建回测请求
      const backtestRequest: BacktestRequest = {
        symbols: values.symbols,
        strategy: values.strategy,
        parameters: values.parameters || {},
        date_start: values.dateRange ? values.dateRange[0].format('YYYY-MM-DD') : '2021-01-01',
        date_end: values.dateRange ? values.dateRange[1].format('YYYY-MM-DD') : '2025-01-01',
        rule_type: values.rule_type || '1H',
        leverage_rate: values.leverage || 1,
        c_rate: values.c_rate || 0.0008,
        slippage: values.slippage || 0.001,
      };

      // 启动回测任务
      const response = await backtestApi.runBacktest(backtestRequest);

      message.success('回测任务已启动');

      // 刷新任务列表
      fetchTasks();

      // 开始轮询任务状态
      if (response.task_id) {
        pollTaskStatus(response.task_id);
      }

      // 重置表单
      form.resetFields();

    } catch (error) {
      console.error('Failed to start backtest:', error);
      message.error('启动回测失败');
    } finally {
      setLoading(false);
    }
  };

  // 删除任务
  const handleDeleteTask = async (taskId: string) => {
    try {
      await backtestApi.deleteTask(taskId);
      message.success('任务已删除');
      fetchTasks();
    } catch (error) {
      console.error('Failed to delete task:', error);
      message.error('删除任务失败');
    }
  };

  // 查看回测结果
  const handleViewResults = async (taskId: string) => {
    setSelectedTaskId(taskId);
    setResultsModalVisible(true);
  };

  const columns = [
    {
      title: '任务ID',
      dataIndex: 'task_id',
      key: 'task_id',
      width: 120,
      render: (text: string) => text.slice(0, 8) + '...',
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
        const config = statusConfig[status as keyof typeof statusConfig] ||
                      { color: 'default', text: status };
        return <Tag color={config.color}>{config.text}</Tag>;
      },
    },
    {
      title: '进度',
      dataIndex: 'progress',
      key: 'progress',
      render: (progress: number, record: BacktestStatus) => (
        <div>
          <Progress percent={Math.round(progress)} size="small" />
          <Text size="xs" color="secondary">
            {record.symbols_completed}/{record.symbols_total} 交易对
          </Text>
        </div>
      ),
    },
    {
      title: '消息',
      dataIndex: 'message',
      key: 'message',
      ellipsis: true,
    },
    {
      title: '结果统计',
      key: 'results',
      render: (_: any, record: BacktestStatus) => {
        if (record.results && record.results.length > 0) {
          const stats = dataUtils.calculateStatistics(record.results);
          return (
            <div>
              <Text size="sm">平均收益: {stats.avgReturn}%</Text><br />
              <Text size="sm">平均夏普: {stats.avgSharpe}</Text>
            </div>
          );
        }
        return '-';
      },
    },
    {
      title: '操作',
      key: 'action',
      render: (_: any, record: BacktestStatus) => (
        <Space>
          <Button
            size="small"
            icon={<BarChartOutlined />}
            disabled={record.status !== 'completed'}
            onClick={() => handleViewResults(record.task_id)}
          >
            查看结果
          </Button>
          <Button
            size="small"
            icon={<DeleteOutlined />}
            danger
            onClick={() => handleDeleteTask(record.task_id)}
          >
            删除
          </Button>
        </Space>
      ),
    },
  ];

  // 如果页面正在加载，显示加载状态
  if (pageLoading) {
    return (
      <div style={{ padding: '24px', textAlign: 'center' }}>
        <Card>
          <div style={{ padding: '60px 0' }}>
            <Spin size="large" tip="正在加载回测页面..." />
          </div>
        </Card>
      </div>
    );
  }

  // 如果有错误，显示错误状态
  if (error) {
    return (
      <div style={{ padding: '24px' }}>
        <Card>
          <div style={{ textAlign: 'center', padding: '60px 0' }}>
            <h3>页面加载失败</h3>
            <p>{error}</p>
            <Button type="primary" onClick={() => window.location.reload()}>
              刷新页面
            </Button>
          </div>
        </Card>
      </div>
    );
  }

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
            layout="vertical"
            onFinish={handleSubmit}
            initialValues={{
              strategy: factors.length > 0 ? factors[0].name : undefined,
              symbols: [],
              leverage: 1,
              rule_type: '1H',
              dateRange: [dayjs().subtract(1, 'year'), dayjs()],
              c_rate: 0.0008,
              slippage: 0.001,
            }}
          >
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
              <Form.Item name="strategy" label="策略因子" rules={[{ required: true, message: '请选择策略' }]}>
                <Select placeholder="选择策略因子" loading={factors.length === 0}>
                  {factors && factors.length > 0 ? factors.map(factor => (
                    <Option key={factor.name} value={factor.name}>
                      {factor.description || factor.name}
                    </Option>
                  )) : (
                    <Option disabled value="">暂无可用策略</Option>
                  )}
                </Select>
              </Form.Item>

              <Form.Item name="symbols" label="交易对" rules={[{ required: true, message: '请选择交易对' }]}>
                <Select
                  mode="multiple"
                  placeholder="选择交易对"
                  maxTagCount={3}
                  loading={symbols.length === 0}
                  showSearch
                  filterOption={(input, option) =>
                    (option?.children as string)?.toLowerCase().includes(input.toLowerCase())
                  }
                >
                  {symbols && symbols.length > 0 ? symbols.map(symbol => (
                    <Option key={symbol.symbol} value={symbol.symbol}>
                      {symbol.symbol}
                    </Option>
                  )) : (
                    <Option disabled value="">暂无可用交易对</Option>
                  )}
                </Select>
              </Form.Item>

              <Form.Item name="dateRange" label="回测时间范围" rules={[{ required: true, message: '请选择时间范围' }]}>
                <RangePicker />
              </Form.Item>

              <Form.Item name="rule_type" label="时间周期">
                <Select>
                  <Option value="1m">1分钟</Option>
                  <Option value="5m">5分钟</Option>
                  <Option value="15m">15分钟</Option>
                  <Option value="1H">1小时</Option>
                  <Option value="4H">4小时</Option>
                  <Option value="1D">1天</Option>
                </Select>
              </Form.Item>

              <Form.Item name="leverage" label="杠杆倍数">
                <InputNumber min={1} max={10} style={{ width: '100%' }} />
              </Form.Item>

              <Form.Item name="c_rate" label="手续费率">
                <InputNumber min={0} max={0.01} step={0.0001} style={{ width: '100%' }} />
              </Form.Item>

              <Form.Item name="slippage" label="滑点">
                <InputNumber min={0} max={0.01} step={0.0001} style={{ width: '100%' }} />
              </Form.Item>
            </div>

            <Form.Item style={{ marginTop: '16px' }}>
              <Button
                type="primary"
                htmlType="submit"
                icon={<PlayCircleOutlined />}
                loading={loading}
                size="large"
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
            rowKey="task_id"
            pagination={{ pageSize: 10 }}
            loading={tasksLoading}
            style={{ background: 'transparent' }}
            locale={{
              emptyText: tasksLoading ? '加载中...' : '暂无回测任务'
            }}
          />
        </Card>
      </Space>

      {/* 回测结果查看模态框 */}
      <BacktestResultsModal
        visible={resultsModalVisible}
        taskId={selectedTaskId}
        onClose={() => {
          setResultsModalVisible(false);
          setSelectedTaskId(null);
        }}
      />
    </div>
  );
};
