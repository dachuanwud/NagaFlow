import React, { useState } from 'react';
import { Button, Dropdown, Modal, Form, Select, Checkbox, Space, message } from 'antd';
import { 
  DownloadOutlined, 
  FileExcelOutlined, 
  FilePdfOutlined,
  FileTextOutlined,
  SettingOutlined
} from '@ant-design/icons';
import { useThemeStore } from '../../stores/themeStore';
import { BacktestResult, TradeRecord } from '../../services/api';

const { Option } = Select;

interface ExportButtonProps {
  results: BacktestResult[];
  trades?: TradeRecord[];
  onExport?: (format: string, options: ExportOptions) => void;
  loading?: boolean;
}

export interface ExportOptions {
  format: 'csv' | 'excel' | 'pdf' | 'json';
  includeCharts: boolean;
  includeStatistics: boolean;
  includeTrades: boolean;
  includeEquityCurve: boolean;
  dateRange?: [string, string];
  selectedFields: string[];
}

export const ExportButton: React.FC<ExportButtonProps> = ({
  results,
  trades = [],
  onExport,
  loading = false
}) => {
  const { isDark } = useThemeStore();
  const [modalVisible, setModalVisible] = useState(false);
  const [form] = Form.useForm();
  const [exportLoading, setExportLoading] = useState(false);

  const availableFields = [
    { key: 'symbol', label: '交易对' },
    { key: 'strategy', label: '策略' },
    { key: 'final_return', label: '总收益率' },
    { key: 'annual_return', label: '年化收益率' },
    { key: 'max_drawdown', label: '最大回撤' },
    { key: 'sharpe_ratio', label: '夏普比率' },
    { key: 'sortino_ratio', label: 'Sortino比率' },
    { key: 'calmar_ratio', label: 'Calmar比率' },
    { key: 'win_rate', label: '胜率' },
    { key: 'profit_factor', label: '盈利因子' },
    { key: 'total_trades', label: '总交易次数' },
    { key: 'winning_trades', label: '盈利交易次数' },
    { key: 'losing_trades', label: '亏损交易次数' },
    { key: 'avg_win', label: '平均盈利' },
    { key: 'avg_loss', label: '平均亏损' },
    { key: 'volatility', label: '波动率' },
    { key: 'var_95', label: 'VaR (95%)' },
    { key: 'cvar_95', label: 'CVaR (95%)' },
    { key: 'created_at', label: '创建时间' },
  ];

  const handleQuickExport = async (format: 'csv' | 'excel' | 'pdf') => {
    setExportLoading(true);
    try {
      const defaultOptions: ExportOptions = {
        format,
        includeCharts: format === 'pdf',
        includeStatistics: true,
        includeTrades: false,
        includeEquityCurve: format === 'pdf',
        selectedFields: availableFields.map(f => f.key),
      };

      if (onExport) {
        await onExport(format, defaultOptions);
      } else {
        // 默认导出逻辑
        await handleDefaultExport(format, defaultOptions);
      }
      
      message.success(`${format.toUpperCase()} 文件导出成功`);
    } catch (error) {
      message.error('导出失败，请重试');
      console.error('Export error:', error);
    } finally {
      setExportLoading(false);
    }
  };

  const handleCustomExport = async () => {
    try {
      const values = await form.validateFields();
      setExportLoading(true);

      const options: ExportOptions = {
        format: values.format,
        includeCharts: values.includeCharts || false,
        includeStatistics: values.includeStatistics || false,
        includeTrades: values.includeTrades || false,
        includeEquityCurve: values.includeEquityCurve || false,
        selectedFields: values.selectedFields || availableFields.map(f => f.key),
      };

      if (onExport) {
        await onExport(values.format, options);
      } else {
        await handleDefaultExport(values.format, options);
      }

      message.success('自定义导出成功');
      setModalVisible(false);
      form.resetFields();
    } catch (error) {
      message.error('导出失败，请重试');
      console.error('Custom export error:', error);
    } finally {
      setExportLoading(false);
    }
  };

  const handleDefaultExport = async (format: string, options: ExportOptions) => {
    // 默认导出实现
    const data = results.map(result => {
      const row: any = {};
      options.selectedFields.forEach(field => {
        if (field in result) {
          let value = (result as any)[field];
          
          // 格式化特定字段
          if (['final_return', 'annual_return', 'max_drawdown', 'win_rate', 'volatility', 'var_95', 'cvar_95'].includes(field)) {
            value = `${(value * 100).toFixed(2)}%`;
          } else if (['sharpe_ratio', 'sortino_ratio', 'calmar_ratio', 'profit_factor'].includes(field)) {
            value = value.toFixed(2);
          } else if (field === 'created_at') {
            value = new Date(value).toLocaleString('zh-CN');
          }
          
          row[availableFields.find(f => f.key === field)?.label || field] = value;
        }
      });
      return row;
    });

    if (format === 'csv') {
      downloadCSV(data, 'backtest_results.csv');
    } else if (format === 'json') {
      downloadJSON({ results: data, trades: options.includeTrades ? trades : [] }, 'backtest_results.json');
    }
  };

  const downloadCSV = (data: any[], filename: string) => {
    if (data.length === 0) return;
    
    const headers = Object.keys(data[0]);
    const csvContent = [
      headers.join(','),
      ...data.map(row => headers.map(header => `"${row[header] || ''}"`).join(','))
    ].join('\n');

    const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = filename;
    link.click();
  };

  const downloadJSON = (data: any, filename: string) => {
    const jsonContent = JSON.stringify(data, null, 2);
    const blob = new Blob([jsonContent], { type: 'application/json' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = filename;
    link.click();
  };

  const menuItems = [
    {
      key: 'csv',
      label: (
        <Space>
          <FileTextOutlined />
          快速导出 CSV
        </Space>
      ),
      onClick: () => handleQuickExport('csv'),
    },
    {
      key: 'excel',
      label: (
        <Space>
          <FileExcelOutlined />
          快速导出 Excel
        </Space>
      ),
      onClick: () => handleQuickExport('excel'),
    },
    {
      key: 'pdf',
      label: (
        <Space>
          <FilePdfOutlined />
          快速导出 PDF
        </Space>
      ),
      onClick: () => handleQuickExport('pdf'),
    },
    {
      type: 'divider' as const,
    },
    {
      key: 'custom',
      label: (
        <Space>
          <SettingOutlined />
          自定义导出
        </Space>
      ),
      onClick: () => setModalVisible(true),
    },
  ];

  return (
    <>
      <Dropdown
        menu={{ items: menuItems }}
        placement="bottomRight"
        disabled={loading || results.length === 0}
      >
        <Button
          icon={<DownloadOutlined />}
          loading={exportLoading}
          disabled={loading || results.length === 0}
        >
          导出数据
        </Button>
      </Dropdown>

      <Modal
        title="自定义导出设置"
        open={modalVisible}
        onOk={handleCustomExport}
        onCancel={() => {
          setModalVisible(false);
          form.resetFields();
        }}
        confirmLoading={exportLoading}
        width={600}
        style={{
          top: 50,
        }}
      >
        <Form
          form={form}
          layout="vertical"
          initialValues={{
            format: 'csv',
            includeStatistics: true,
            selectedFields: availableFields.slice(0, 10).map(f => f.key),
          }}
        >
          <Form.Item
            name="format"
            label="导出格式"
            rules={[{ required: true, message: '请选择导出格式' }]}
          >
            <Select>
              <Option value="csv">CSV 文件</Option>
              <Option value="excel">Excel 文件</Option>
              <Option value="pdf">PDF 报告</Option>
              <Option value="json">JSON 数据</Option>
            </Select>
          </Form.Item>

          <Form.Item name="selectedFields" label="导出字段">
            <Checkbox.Group
              options={availableFields.map(field => ({
                label: field.label,
                value: field.key,
              }))}
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(2, 1fr)',
                gap: '8px',
              }}
            />
          </Form.Item>

          <Form.Item label="附加内容">
            <Space direction="vertical">
              <Form.Item name="includeStatistics" valuePropName="checked" style={{ marginBottom: 0 }}>
                <Checkbox>包含统计摘要</Checkbox>
              </Form.Item>
              <Form.Item name="includeTrades" valuePropName="checked" style={{ marginBottom: 0 }}>
                <Checkbox>包含交易记录</Checkbox>
              </Form.Item>
              <Form.Item name="includeEquityCurve" valuePropName="checked" style={{ marginBottom: 0 }}>
                <Checkbox>包含资金曲线数据</Checkbox>
              </Form.Item>
              <Form.Item name="includeCharts" valuePropName="checked" style={{ marginBottom: 0 }}>
                <Checkbox>包含图表 (仅PDF)</Checkbox>
              </Form.Item>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </>
  );
};
