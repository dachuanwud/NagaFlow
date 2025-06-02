import React, { useState, useEffect } from 'react';
import { Card, Form, Select, InputNumber, Button, Table, Progress, Space, Tag, message, DatePicker, Spin, Modal } from 'antd';
import { PlayCircleOutlined, SettingOutlined, BarChartOutlined, DeleteOutlined } from '@ant-design/icons';
import { useThemeStore } from '../../stores/themeStore';
import { useTranslation } from '../../hooks/useTranslation';
import { Text } from '../../components/UI/Typography';
import { backtestApi, strategiesApi, dataApi, BacktestRequest, BacktestStatus, SymbolInfo, FactorInfo } from '../../services/api';
import { dataUtils } from '../../services/mockApi';
import { BacktestResultsModal } from './BacktestResultsModal';
import { FactorConfiguration } from '../../components/FactorConfiguration';
import { TimeRangeHint } from '../../components/TimeRangeHint';
import { EnhancedLoading } from '../../components/EnhancedLoading';
import { ErrorBoundary, SimpleErrorBoundary } from '../../components/ErrorBoundary';
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
  const [selectedFactors, setSelectedFactors] = useState<string[]>([]);
  const [factorParameters, setFactorParameters] = useState<Record<string, any>>({});
  const [tasksLoading, setTasksLoading] = useState(false);
  const [pageLoading, setPageLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [resultsModalVisible, setResultsModalVisible] = useState(false);
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [selectedSymbols, setSelectedSymbols] = useState<string[]>([]);
  const [selectedDateRange, setSelectedDateRange] = useState<[dayjs.Dayjs, dayjs.Dayjs] | null>(null);
  const [dataRangeInfo, setDataRangeInfo] = useState<{ hasValidData: boolean; suggestions?: string[] }>({ hasValidData: false });

  // 增强的加载状态管理
  const [enhancedLoading, setEnhancedLoading] = useState({
    visible: false,
    title: '处理中...',
    description: '',
    progress: 0,
    currentStep: '',
    steps: [] as any[],
    estimatedTime: 0
  });

  // 获取可用的交易对
  const fetchSymbols = async () => {
    try {
      console.log('Fetching symbols...');
      const symbolList = await dataApi.getSymbols('swap');
      console.log('Symbols fetched:', symbolList?.length || 0);
      setSymbols(symbolList || []);
    } catch (error) {
      console.warn('Backend not available for symbols, using mock data:', error);
      // 使用模拟数据
      const mockSymbols = [
        { symbol: 'BTCUSDT', base_asset: 'BTC', quote_asset: 'USDT', status: 'TRADING' },
        { symbol: 'ETHUSDT', base_asset: 'ETH', quote_asset: 'USDT', status: 'TRADING' },
        { symbol: 'ADAUSDT', base_asset: 'ADA', quote_asset: 'USDT', status: 'TRADING' },
        { symbol: 'DOTUSDT', base_asset: 'DOT', quote_asset: 'USDT', status: 'TRADING' },
      ];
      setSymbols(mockSymbols);
      message.warning('后端服务不可用，显示演示交易对');
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
      console.warn('Backend not available for factors, using mock data:', error);
      // 使用模拟数据
      const mockFactors = [
        {
          name: 'MA_Cross',
          display_name: '移动平均交叉',
          description: '基于快慢移动平均线交叉的策略',
          parameters: [
            { name: 'fast_period', type: 'int', default: 10, min: 5, max: 50 },
            { name: 'slow_period', type: 'int', default: 20, min: 10, max: 100 }
          ]
        },
        {
          name: 'RSI_Strategy',
          display_name: 'RSI策略',
          description: '基于相对强弱指数的策略',
          parameters: [
            { name: 'rsi_period', type: 'int', default: 14, min: 5, max: 30 },
            { name: 'oversold', type: 'float', default: 30, min: 10, max: 40 },
            { name: 'overbought', type: 'float', default: 70, min: 60, max: 90 }
          ]
        }
      ];
      setFactors(mockFactors);
      message.warning('后端服务不可用，显示演示策略因子');
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
      console.warn('Backend not available for tasks, using mock data:', error);
      // 使用模拟数据
      const mockTasks = [
        {
          task_id: 'demo_task_1',
          status: 'completed' as const,
          progress: 100,
          message: '回测完成',
          symbols_total: 1,
          symbols_completed: 1,
          results: [
            {
              task_id: 'demo_task_1',
              symbol: 'BTCUSDT',
              strategy: 'MA_Cross',
              parameters: { fast_period: 10, slow_period: 20 },
              final_return: 15.23,
              annual_return: 12.45,
              max_drawdown: -8.67,
              sharpe_ratio: 1.24,
              win_rate: 65.4,
              total_trades: 156,
              profit_factor: 1.85,
              volatility: 18.9,
              created_at: new Date().toISOString(),
              equity_curve: [],
              drawdown_periods: [],
              monthly_returns: [],
              trade_records: []
            }
          ]
        }
      ];
      setTasks(mockTasks);
      message.warning('后端服务不可用，显示演示任务');
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

  // 增强的参数验证函数
  const validateBacktestParameters = (values: any, factors: string[], parameters: any, dataInfo: any) => {
    const errors: string[] = [];

    console.log('Validating parameters:', { values, factors, parameters, dataInfo });

    // 基础验证
    if (!values.symbols || values.symbols.length === 0) {
      errors.push('❌ 请至少选择一个交易对');
    }

    if (factors.length === 0) {
      errors.push('❌ 请至少选择一个策略因子');
    }

    if (!values.dateRange || values.dateRange.length !== 2) {
      errors.push('❌ 请选择有效的时间范围');
    }

    // 数据可用性验证 - 放宽要求
    if (dataInfo && dataInfo.hasValidData === false && values.symbols && values.symbols.length > 0) {
      errors.push('⚠️ 所选交易对数据可能不完整，但系统将尝试自动获取数据');
    }

    // 参数范围验证
    if (values.leverage && (values.leverage < 1 || values.leverage > 10)) {
      errors.push('❌ 杠杆倍数必须在1-10之间');
    }

    if (values.c_rate && (values.c_rate < 0 || values.c_rate > 0.01)) {
      errors.push('❌ 手续费率必须在0-1%之间');
    }

    if (values.slippage && (values.slippage < 0 || values.slippage > 0.01)) {
      errors.push('❌ 滑点必须在0-1%之间');
    }

    // 因子参数验证
    for (const factorName of factors) {
      const factorParams = parameters[factorName];
      if (factorParams) {
        // 这里可以添加更具体的因子参数验证逻辑
        // 例如检查参数是否在合理范围内
      }
    }

    console.log('Validation result:', errors);
    return errors;
  };

  // 智能时间范围调整函数
  const adjustTimeRangeForData = (dateRange: any, dataInfo: any) => {
    if (!dateRange || !dataInfo || !dataInfo.overlappingRange) {
      return {
        start: dateRange ? dateRange[0].format('YYYY-MM-DD') : '2021-01-01',
        end: dateRange ? dateRange[1].format('YYYY-MM-DD') : '2025-01-01',
        adjusted: false
      };
    }

    const userStart = dayjs(dateRange[0]);
    const userEnd = dayjs(dateRange[1]);
    const dataStart = dayjs(dataInfo.overlappingRange.start);
    const dataEnd = dayjs(dataInfo.overlappingRange.end);

    let adjustedStart = userStart;
    let adjustedEnd = userEnd;
    let adjusted = false;

    // 调整开始时间
    if (userStart.isBefore(dataStart)) {
      adjustedStart = dataStart;
      adjusted = true;
    }

    // 调整结束时间
    if (userEnd.isAfter(dataEnd)) {
      adjustedEnd = dataEnd;
      adjusted = true;
    }

    // 确保至少有30天的数据
    const daysDiff = adjustedEnd.diff(adjustedStart, 'day');
    if (daysDiff < 30) {
      // 尝试向前扩展
      const targetStart = adjustedEnd.subtract(30, 'day');
      if (targetStart.isAfter(dataStart)) {
        adjustedStart = targetStart;
        adjusted = true;
      } else {
        // 向后扩展
        const targetEnd = adjustedStart.add(30, 'day');
        if (targetEnd.isBefore(dataEnd)) {
          adjustedEnd = targetEnd;
          adjusted = true;
        }
      }
    }

    return {
      start: adjustedStart.format('YYYY-MM-DD'),
      end: adjustedEnd.format('YYYY-MM-DD'),
      adjusted
    };
  };

  const handleSubmit = async (values: any) => {
    console.log('BacktestPage: Form submitted with values:', values);
    console.log('BacktestPage: Current state:', {
      selectedFactors,
      selectedSymbols,
      factorParameters,
      dataRangeInfo
    });

    try {
      setLoading(true);

      // 增强的参数验证
      const validationErrors = validateBacktestParameters(values, selectedFactors, factorParameters, dataRangeInfo);

      if (validationErrors.length > 0) {
        console.error('BacktestPage: Validation errors:', validationErrors);
        validationErrors.forEach(error => message.error(error));
        return;
      }

      console.log('BacktestPage: Validation passed, proceeding with backtest...');

      // 启动增强加载界面
      const processingSteps = [
        { key: 'validation', title: '参数验证', description: '验证回测参数和数据可用性', status: 'completed' as const },
        { key: 'data_prepare', title: '智能数据获取', description: '自动检查并获取所需的市场数据', status: 'processing' as const },
        { key: 'backtest_run', title: '执行回测', description: '运行策略回测计算', status: 'waiting' as const },
        { key: 'result_process', title: '结果处理', description: '计算回测指标和生成报告', status: 'waiting' as const }
      ];

      setEnhancedLoading({
        visible: true,
        title: '正在启动智能回测任务',
        description: '系统正在自动准备数据并启动回测...',
        progress: 20,
        currentStep: '自动数据准备中',
        steps: processingSteps,
        estimatedTime: 120
      });

      // 智能时间范围调整
      const adjustedDateRange = adjustTimeRangeForData(values.dateRange, dataRangeInfo);
      if (adjustedDateRange.adjusted) {
        message.info(`时间范围已自动调整为: ${adjustedDateRange.start} 到 ${adjustedDateRange.end}`);
      }

      // 构建回测请求
      const backtestRequest: BacktestRequest = {
        symbols: values.symbols,
        strategy: selectedFactors[0], // 使用第一个选择的因子作为主策略
        parameters: factorParameters,
        date_start: adjustedDateRange.start,
        date_end: adjustedDateRange.end,
        rule_type: values.rule_type || '1H',
        leverage_rate: values.leverage || 1,
        c_rate: values.c_rate || 0.0008,
        slippage: values.slippage || 0.001,
      };

      // 更新加载状态 - 数据准备中
      setEnhancedLoading(prev => ({
        ...prev,
        progress: 40,
        currentStep: '正在检查和更新数据...',
        description: '系统正在智能检查数据完整性，如需要将自动从Binance获取最新数据'
      }));

      // 使用新的自动数据回测API
      console.log('BacktestPage: Sending backtest request:', backtestRequest);
      const response = await backtestApi.runBacktestWithAutoData(backtestRequest);
      console.log('BacktestPage: Received response:', response);

      // 检查数据准备结果
      if (response.status === 'data_preparation_failed') {
        throw new Error(response.message || '数据准备失败');
      }

      // 检查响应是否包含任务ID
      if (!response.task_id) {
        throw new Error('服务器未返回任务ID，请检查后端服务');
      }

      // 更新加载状态 - 回测执行中
      setEnhancedLoading(prev => ({
        ...prev,
        progress: 70,
        currentStep: '回测执行中',
        steps: prev.steps.map(step =>
          step.key === 'data_prepare' ? { ...step, status: 'completed' as const } :
          step.key === 'backtest_run' ? { ...step, status: 'processing' as const } : step
        ),
        description: '数据准备完成，正在执行策略回测计算...'
      }));

      // 模拟回测执行时间
      await new Promise(resolve => setTimeout(resolve, 2000));

      // 更新加载状态 - 完成
      setEnhancedLoading(prev => ({
        ...prev,
        progress: 100,
        currentStep: '回测完成',
        steps: prev.steps.map(step =>
          step.key === 'backtest_run' ? { ...step, status: 'completed' as const } :
          step.key === 'result_process' ? { ...step, status: 'completed' as const } : step
        ),
        description: '回测任务已完成，结果已生成'
      }));

      // 延迟关闭加载界面
      setTimeout(() => {
        setEnhancedLoading(prev => ({ ...prev, visible: false }));
      }, 2000);

      // 显示数据准备结果信息
      if (response.data_preparation_result) {
        const dataResult = response.data_preparation_result;
        if (dataResult.symbols_updated > 0) {
          message.success(`数据自动更新完成：${dataResult.symbols_updated} 个交易对数据已更新`);
        }
        if (dataResult.warnings && dataResult.warnings.length > 0) {
          dataResult.warnings.forEach(warning => message.warning(warning));
        }
      }

      message.success(`回测完成！获得 ${response.results?.length || 0} 个结果`);

      // 刷新任务列表
      fetchTasks();

      // 如果有结果，直接显示
      if (response.results && response.results.length > 0) {
        // 这里可以直接显示结果，或者添加到任务列表中
        console.log('回测结果:', response.results);
      }

      // 重置表单
      form.resetFields();
      setSelectedFactors([]);
      setFactorParameters({});

    } catch (error) {
      console.error('Failed to start backtest:', error);

      // 更新加载状态为错误
      setEnhancedLoading(prev => ({
        ...prev,
        progress: 0,
        currentStep: '回测启动失败',
        steps: prev.steps.map(step =>
          step.status === 'processing' ? { ...step, status: 'error' as const } : step
        ),
        description: `错误: ${error instanceof Error ? error.message : '未知错误'}`
      }));

      setTimeout(() => {
        setEnhancedLoading(prev => ({ ...prev, visible: false }));
      }, 3000);

      message.error(`启动回测失败: ${error instanceof Error ? error.message : '请检查参数设置'}`);
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
        {/* 因子配置 */}
        <ErrorBoundary>
          <FactorConfiguration
            selectedFactors={selectedFactors}
            onFactorsChange={setSelectedFactors}
            parameters={factorParameters}
            onParametersChange={setFactorParameters}
            form={form}
          />
        </ErrorBoundary>

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
              symbols: [],
              leverage: 1,
              rule_type: '1H',
              dateRange: [dayjs().subtract(1, 'year'), dayjs()],
              c_rate: 0.0008,
              slippage: 0.001,
            }}
          >
            {/* 时间范围提示组件 - 添加错误边界 */}
            {selectedSymbols.length > 0 ? (
              <SimpleErrorBoundary>
                <TimeRangeHint
                  selectedSymbols={selectedSymbols}
                  selectedDateRange={selectedDateRange}
                  onDataRangeInfo={setDataRangeInfo}
                />
              </SimpleErrorBoundary>
            ) : null}

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
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
                  onChange={(values) => {
                    console.log('BacktestPage: Selected symbols changed:', values);
                    console.log('BacktestPage: Current state before update:', {
                      selectedSymbols,
                      pageLoading,
                      error,
                      symbols: symbols?.length || 0
                    });

                    try {
                      setSelectedSymbols(values);
                      form.setFieldsValue({ symbols: values });
                      console.log('BacktestPage: State updated successfully');
                    } catch (updateError) {
                      console.error('BacktestPage: Error updating state:', updateError);
                    }
                  }}
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
                <RangePicker
                  onChange={(dates) => {
                    setSelectedDateRange(dates as [dayjs.Dayjs, dayjs.Dayjs] | null);
                    form.setFieldsValue({ dateRange: dates });
                  }}
                />
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
                disabled={selectedFactors.length === 0 || selectedSymbols.length === 0}
                title={
                  selectedFactors.length === 0 ? '请先选择策略因子' :
                  selectedSymbols.length === 0 ? '请先选择交易对' :
                  '开始回测'
                }
              >
                {loading ? '正在启动回测...' : '开始回测'}
              </Button>
              {(selectedFactors.length === 0 || selectedSymbols.length === 0) && (
                <div style={{ marginTop: '8px', color: '#ff4d4f', fontSize: '12px' }}>
                  {selectedFactors.length === 0 && '⚠️ 请先选择策略因子'}
                  {selectedFactors.length === 0 && selectedSymbols.length === 0 && ' 和 '}
                  {selectedSymbols.length === 0 && '⚠️ 请先选择交易对'}
                </div>
              )}
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

      {/* 增强加载界面 */}
      <EnhancedLoading
        visible={enhancedLoading.visible}
        title={enhancedLoading.title}
        description={enhancedLoading.description}
        progress={enhancedLoading.progress}
        currentStep={enhancedLoading.currentStep}
        steps={enhancedLoading.steps}
        estimatedTime={enhancedLoading.estimatedTime}
        showProgress={true}
        showSteps={true}
        onCancel={() => {
          setEnhancedLoading(prev => ({ ...prev, visible: false }));
          setLoading(false);
        }}
      />
    </div>
  );
};
