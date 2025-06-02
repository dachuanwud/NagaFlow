import React, { useState } from 'react';
import { Card, Button, Form, Select, DatePicker, InputNumber, message, Space, Alert } from 'antd';
import { PlayCircleOutlined } from '@ant-design/icons';
import { backtestApi, BacktestRequest } from '../../services/api';
import dayjs from 'dayjs';

const { Option } = Select;
const { RangePicker } = DatePicker;

export const TestSubmitPage: React.FC = () => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [lastResponse, setLastResponse] = useState<any>(null);

  const handleTestSubmit = async (values: any) => {
    console.log('TestSubmit: Form values:', values);
    
    try {
      setLoading(true);
      setLastResponse(null);

      // 构建简单的测试请求
      const testRequest: BacktestRequest = {
        symbols: values.symbols || ['BTCUSDT'],
        strategy: 'simple_moving_average',
        parameters: {
          simple_moving_average: {
            period: 20
          }
        },
        date_start: values.dateRange ? values.dateRange[0].format('YYYY-MM-DD') : '2024-06-01',
        date_end: values.dateRange ? values.dateRange[1].format('YYYY-MM-DD') : '2025-06-01',
        rule_type: values.rule_type || '1H',
        leverage_rate: values.leverage || 1,
        c_rate: values.c_rate || 0.0008,
        slippage: values.slippage || 0.001,
      };

      console.log('TestSubmit: Sending request:', testRequest);

      const response = await backtestApi.runBacktestWithAutoData(testRequest);
      
      console.log('TestSubmit: Response received:', response);
      setLastResponse(response);
      
      message.success('回测请求发送成功！');
      
    } catch (error) {
      console.error('TestSubmit: Error:', error);
      message.error(`请求失败: ${error instanceof Error ? error.message : '未知错误'}`);
      setLastResponse({ error: error instanceof Error ? error.message : '未知错误' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: '24px' }}>
      <Space direction="vertical" size="large" style={{ width: '100%' }}>
        <Alert
          message="回测提交测试页面"
          description="这是一个简化的测试页面，用于验证回测API调用是否正常工作"
          type="info"
          showIcon
        />

        <Card title="测试回测提交">
          <Form
            form={form}
            layout="vertical"
            onFinish={handleTestSubmit}
            initialValues={{
              symbols: ['BTCUSDT'],
              leverage: 1,
              rule_type: '1H',
              dateRange: [dayjs().subtract(1, 'month'), dayjs()],
              c_rate: 0.0008,
              slippage: 0.001,
            }}
          >
            <Form.Item name="symbols" label="交易对">
              <Select mode="multiple" placeholder="选择交易对">
                <Option value="BTCUSDT">BTCUSDT</Option>
                <Option value="ETHUSDT">ETHUSDT</Option>
                <Option value="ADAUSDT">ADAUSDT</Option>
              </Select>
            </Form.Item>

            <Form.Item name="dateRange" label="时间范围">
              <RangePicker />
            </Form.Item>

            <Form.Item name="rule_type" label="时间周期">
              <Select>
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

            <Form.Item>
              <Button
                type="primary"
                htmlType="submit"
                icon={<PlayCircleOutlined />}
                loading={loading}
                size="large"
              >
                {loading ? '发送中...' : '测试提交'}
              </Button>
            </Form.Item>
          </Form>
        </Card>

        {lastResponse && (
          <Card title="最后响应">
            <pre style={{ 
              background: '#f5f5f5', 
              padding: '16px', 
              borderRadius: '4px',
              overflow: 'auto',
              maxHeight: '400px'
            }}>
              {JSON.stringify(lastResponse, null, 2)}
            </pre>
          </Card>
        )}
      </Space>
    </div>
  );
};
