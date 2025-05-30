import React, { useState, useEffect } from 'react';
import { Card, Table, Button, Progress, Tag, Space, Select, message } from 'antd';
import { DownloadOutlined, ReloadOutlined, DatabaseOutlined } from '@ant-design/icons';
import { useThemeStore } from '../../stores/themeStore';
import { useTranslation } from '../../hooks/useTranslation';
import { designTokens, getThemeColors } from '../../styles/designSystem';
import { PageContainer, CardContainer } from '../../components/UI/Container';
import { Heading, Text } from '../../components/UI/Typography';
import { PageTransition } from '../../components/Animation/PageTransition';
import { dataApi, SymbolInfo, DataStatus } from '../../services/api';
import { dataUtils } from '../../services/mockApi';

const { Option } = Select;

export const DataManagement: React.FC = () => {
  const { isDark } = useThemeStore();
  const { t } = useTranslation();
  const themeColors = getThemeColors(isDark);
  const [loading, setLoading] = useState(false);
  const [selectedTradeType, setSelectedTradeType] = useState('swap');
  const [symbols, setSymbols] = useState<SymbolInfo[]>([]);
  const [dataStatus, setDataStatus] = useState<DataStatus | null>(null);
  const [symbolsLoading, setSymbolsLoading] = useState(false);

  // 获取交易对列表
  const fetchSymbols = async (tradeType: string = selectedTradeType) => {
    try {
      setSymbolsLoading(true);
      const symbolList = await dataApi.getSymbols(tradeType);
      setSymbols(symbolList);
    } catch (error) {
      console.error('Failed to fetch symbols:', error);
      // 如果API失败，显示空列表
      setSymbols([]);
    } finally {
      setSymbolsLoading(false);
    }
  };

  // 获取数据下载状态
  const fetchDataStatus = async () => {
    try {
      const status = await dataApi.getDataStatus();
      setDataStatus(status);

      // 如果正在下载，继续轮询状态
      if (status.status === 'downloading') {
        setTimeout(fetchDataStatus, 2000);
      }
    } catch (error) {
      console.error('Failed to fetch data status:', error);
    }
  };

  // 初始化数据
  useEffect(() => {
    fetchSymbols();
    fetchDataStatus();
  }, []);

  // 当交易类型改变时重新获取数据
  useEffect(() => {
    fetchSymbols(selectedTradeType);
  }, [selectedTradeType]);

  // 处理批量下载
  const handleDownload = async () => {
    try {
      setLoading(true);

      // 启动下载任务
      await dataApi.startDownload({
        trade_type: selectedTradeType,
        intervals: ['1m', '5m']
      });

      message.success('数据下载任务已启动');

      // 开始轮询下载状态
      fetchDataStatus();

    } catch (error) {
      console.error('Failed to start download:', error);
      message.error('启动下载失败');
    } finally {
      setLoading(false);
    }
  };

  // 处理单个交易对下载
  const handleSingleDownload = async (symbol: string) => {
    try {
      await dataApi.startDownload({
        symbols: [symbol],
        trade_type: selectedTradeType,
        intervals: ['1m', '5m']
      });

      message.success(`${symbol} 数据下载任务已启动`);
      fetchDataStatus();

    } catch (error) {
      console.error('Failed to start single download:', error);
      message.error(`${symbol} 下载失败`);
    }
  };

  // 刷新单个交易对数据
  const handleRefresh = async (symbol: string) => {
    try {
      await dataApi.getMarketData(symbol);
      message.success(`${symbol} 数据已刷新`);
      fetchSymbols();
    } catch (error) {
      console.error('Failed to refresh data:', error);
      message.error(`${symbol} 刷新失败`);
    }
  };

  const columns = [
    {
      title: t('dataManagement.symbol'),
      dataIndex: 'symbol',
      key: 'symbol',
      render: (text: string) => (
        <Space>
          <DatabaseOutlined style={{ color: designTokens.colors.primary[500] }} />
          <Text weight="semibold" as="span">{text}</Text>
        </Space>
      ),
    },
    {
      title: t('dataManagement.status'),
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => {
        const statusConfig = {
          available: { color: 'blue', text: t('dataManagement.available') },
          downloading: { color: 'orange', text: t('dataManagement.downloading') },
          completed: { color: 'green', text: t('dataManagement.completed') },
          error: { color: 'red', text: t('dataManagement.failed') },
        };
        const config = statusConfig[status as keyof typeof statusConfig] ||
                      { color: 'default', text: status };
        return <Tag color={config.color}>{config.text}</Tag>;
      },
    },
    {
      title: t('dataManagement.lastUpdate'),
      dataIndex: 'last_update',
      key: 'last_update',
      render: (text: string) => text ? dataUtils.formatDateTime(text) : '-',
    },
    {
      title: t('dataManagement.actions'),
      key: 'action',
      render: (_: any, record: SymbolInfo) => (
        <Space>
          <Button
            size="small"
            icon={<DownloadOutlined />}
            disabled={dataStatus?.status === 'downloading'}
            onClick={() => handleSingleDownload(record.symbol)}
          >
            {t('common.download')}
          </Button>
          <Button
            size="small"
            icon={<ReloadOutlined />}
            onClick={() => handleRefresh(record.symbol)}
          >
            {t('common.refresh')}
          </Button>
        </Space>
      ),
    },
  ];

  return (
    <PageTransition>
      <PageContainer padding="none">
        <Heading level={2} style={{ marginBottom: designTokens.spacing['3xl'] }}>
          {t('dataManagement.title')}
        </Heading>

        <CardContainer padding="lg" shadow="md">
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: designTokens.spacing['2xl']
          }}>
            <Heading level={4} style={{ margin: 0 }}>
              {t('dataManagement.downloadData')}
            </Heading>
            <Space size="middle">
              <Select
                value={selectedTradeType}
                onChange={setSelectedTradeType}
                style={{ width: 120 }}
              >
                <Option value="swap">{t('dataManagement.futures')}</Option>
                <Option value="spot">{t('dataManagement.spot')}</Option>
              </Select>
              <Button
                type="primary"
                icon={<DownloadOutlined />}
                loading={loading}
                onClick={handleDownload}
              >
                {t('dataManagement.batchDownload')}
              </Button>
            </Space>
          </div>

          {dataStatus?.status === 'downloading' && (
            <div style={{ marginBottom: designTokens.spacing['2xl'] }}>
              <Progress
                percent={Math.round(dataStatus.progress)}
                status="active"
              />
              <Text
                size="sm"
                color="secondary"
                style={{ marginTop: designTokens.spacing.sm }}
              >
                {dataStatus.message} ({Math.round(dataStatus.progress)}%)
              </Text>
            </div>
          )}

          <Table
            columns={columns}
            dataSource={symbols}
            rowKey="symbol"
            pagination={{ pageSize: 10 }}
            loading={symbolsLoading}
            style={{ background: 'transparent' }}
            locale={{
              emptyText: symbolsLoading ? '加载中...' : '暂无数据'
            }}
          />
        </CardContainer>
      </PageContainer>
    </PageTransition>
  );
};
