import React, { useState, useEffect } from 'react';
import { Card, Form, Select, Button, message, Space, Alert } from 'antd';
import { dataApi, SymbolInfo } from '../../services/api';

const { Option } = Select;

export const SimpleBacktestDebug: React.FC = () => {
  const [form] = Form.useForm();
  const [symbols, setSymbols] = useState<SymbolInfo[]>([]);
  const [selectedSymbols, setSelectedSymbols] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 获取交易对
  const fetchSymbols = async () => {
    try {
      setLoading(true);
      console.log('SimpleDebug: Fetching symbols...');
      const symbolList = await dataApi.getSymbols('swap');
      console.log('SimpleDebug: Symbols fetched:', symbolList?.length || 0);
      setSymbols(symbolList || []);
      setError(null);
    } catch (error) {
      console.error('SimpleDebug: Failed to fetch symbols:', error);
      setError('获取交易对失败: ' + (error instanceof Error ? error.message : '未知错误'));
      message.error('获取交易对失败');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    console.log('SimpleDebug: Component mounted');
    fetchSymbols();
  }, []);

  const handleSymbolChange = (values: string[]) => {
    console.log('SimpleDebug: Symbol selection changed:', values);
    console.log('SimpleDebug: Current state:', {
      symbols: symbols.length,
      selectedSymbols: selectedSymbols.length,
      loading,
      error
    });
    
    setSelectedSymbols(values);
    form.setFieldsValue({ symbols: values });
  };

  const handleSubmit = (values: any) => {
    console.log('SimpleDebug: Form submitted:', values);
    message.success('表单提交成功！');
  };

  console.log('SimpleDebug: Rendering with state:', {
    symbols: symbols.length,
    selectedSymbols: selectedSymbols.length,
    loading,
    error
  });

  if (error) {
    return (
      <div style={{ padding: '24px' }}>
        <Card title="调试页面 - 错误状态">
          <Alert
            message="错误"
            description={error}
            type="error"
            showIcon
            action={
              <Button size="small" onClick={fetchSymbols}>
                重试
              </Button>
            }
          />
        </Card>
      </div>
    );
  }

  return (
    <div style={{ padding: '24px' }}>
      <Card title="简化回测调试页面">
        <Space direction="vertical" size="large" style={{ width: '100%' }}>
          <Alert
            message="调试信息"
            description={`交易对数量: ${symbols.length}, 已选择: ${selectedSymbols.length}, 加载中: ${loading}`}
            type="info"
            showIcon
          />

          <Form
            form={form}
            layout="vertical"
            onFinish={handleSubmit}
            initialValues={{
              symbols: []
            }}
          >
            <Form.Item 
              name="symbols" 
              label="交易对选择" 
              rules={[{ required: true, message: '请选择交易对' }]}
            >
              <Select
                mode="multiple"
                placeholder="选择交易对"
                maxTagCount={3}
                loading={loading}
                showSearch
                filterOption={(input, option) =>
                  (option?.children as string)?.toLowerCase().includes(input.toLowerCase())
                }
                onChange={handleSymbolChange}
                style={{ width: '100%' }}
              >
                {symbols && symbols.length > 0 ? symbols.map(symbol => (
                  <Option key={symbol.symbol} value={symbol.symbol}>
                    {symbol.symbol}
                  </Option>
                )) : (
                  <Option disabled value="">
                    {loading ? '加载中...' : '暂无可用交易对'}
                  </Option>
                )}
              </Select>
            </Form.Item>

            {selectedSymbols.length > 0 && (
              <Alert
                message="已选择的交易对"
                description={selectedSymbols.join(', ')}
                type="success"
                showIcon
              />
            )}

            <Form.Item>
              <Button
                type="primary"
                htmlType="submit"
                disabled={selectedSymbols.length === 0}
              >
                测试提交
              </Button>
            </Form.Item>
          </Form>

          <div>
            <h4>调试操作:</h4>
            <Space>
              <Button onClick={fetchSymbols} loading={loading}>
                重新获取交易对
              </Button>
              <Button onClick={() => {
                console.log('Current state:', {
                  symbols,
                  selectedSymbols,
                  loading,
                  error
                });
              }}>
                打印状态到控制台
              </Button>
              <Button onClick={() => {
                setSelectedSymbols([]);
                form.resetFields();
              }}>
                清空选择
              </Button>
            </Space>
          </div>
        </Space>
      </Card>
    </div>
  );
};
