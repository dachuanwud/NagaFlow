import React, { useState, useEffect } from 'react';
import { Alert, Spin, Typography, Space, Tag } from 'antd';
import { InfoCircleOutlined, CheckCircleOutlined, ExclamationCircleOutlined } from '@ant-design/icons';
import { backtestApi, DataTimeRange } from '../../services/api';
import dayjs from 'dayjs';

const { Text } = Typography;

interface TimeRangeHintProps {
  selectedSymbols: string[];
  selectedDateRange: [dayjs.Dayjs, dayjs.Dayjs] | null;
  onDataRangeInfo?: (info: { hasValidData: boolean; suggestions?: string[] }) => void;
}

export const TimeRangeHint: React.FC<TimeRangeHintProps> = ({
  selectedSymbols,
  selectedDateRange,
  onDataRangeInfo
}) => {
  const [loading, setLoading] = useState(false);
  const [dataRanges, setDataRanges] = useState<Record<string, DataTimeRange>>({});
  const [analysis, setAnalysis] = useState<{
    hasValidData: boolean;
    overlappingRange: { start: string; end: string } | null;
    suggestions: string[];
    warnings: string[];
  } | null>(null);

  // 获取选中交易对的数据时间范围
  useEffect(() => {
    console.log('TimeRangeHint: selectedSymbols changed:', selectedSymbols);

    if (selectedSymbols.length === 0) {
      setDataRanges({});
      setAnalysis(null);
      onDataRangeInfo?.({ hasValidData: false });
      return;
    }

    const fetchDataRanges = async () => {
      console.log('TimeRangeHint: Starting to fetch data ranges for symbols:', selectedSymbols);
      setLoading(true);

      try {
        const ranges: Record<string, DataTimeRange> = {};

        // 并行获取所有选中交易对的数据范围，增加重试机制和数据质量检查
        const promises = selectedSymbols.map(async (symbol) => {
          console.log(`TimeRangeHint: Fetching data range for ${symbol}`);
          let retryCount = 0;
          const maxRetries = 2; // 减少重试次数以避免长时间阻塞

          while (retryCount < maxRetries) {
            try {
              const range = await backtestApi.getDataTimeRange(symbol);
              console.log(`TimeRangeHint: Got data range for ${symbol}:`, range);

              // 增强数据质量评估
              if (range && range.available) {
                // 兼容不同的记录数字段
                const recordCount = range.total_records || range.records_count || 0;
                const qualityInfo = assessDataQuality({
                  ...range,
                  total_records: recordCount
                });
                ranges[symbol] = {
                  ...range,
                  total_records: recordCount,
                  ...qualityInfo
                };
              } else {
                ranges[symbol] = {
                  symbol,
                  available: false,
                  message: '系统将自动获取数据',
                  start_date: null,
                  end_date: null,
                  total_records: 0,
                  quality_score: 'auto_fetch',
                  recommended: true,
                  quality_message: '系统将自动获取数据',
                  auto_fetch_available: true,
                  ...range
                };
              }
              break;
            } catch (error) {
              retryCount++;
              console.error(`TimeRangeHint: Error fetching ${symbol} (attempt ${retryCount}):`, error);

              if (retryCount >= maxRetries) {
                ranges[symbol] = {
                  symbol,
                  available: false,
                  message: '系统将在回测时自动获取数据',
                  start_date: null,
                  end_date: null,
                  total_records: 0,
                  quality_score: 'auto_fetch',
                  recommended: true,
                  quality_message: '数据获取失败，系统将自动处理',
                  auto_fetch_available: true
                };
              } else {
                // 等待后重试
                await new Promise(resolve => setTimeout(resolve, 500 * retryCount));
              }
            }
          }
        });

        await Promise.all(promises);
        console.log('TimeRangeHint: All data ranges fetched:', ranges);
        setDataRanges(ranges);

        // 分析数据范围
        try {
          analyzeDataRanges(ranges, selectedDateRange);
        } catch (analysisError) {
          console.error('TimeRangeHint: Error analyzing data ranges:', analysisError);
          // 设置默认分析结果
          const defaultAnalysis = {
            hasValidData: true,
            overlappingRange: null,
            suggestions: ['系统将自动处理数据获取'],
            warnings: []
          };
          setAnalysis(defaultAnalysis);
          onDataRangeInfo?.(defaultAnalysis);
        }

      } catch (error) {
        console.error('TimeRangeHint: Failed to fetch data ranges:', error);
        // 设置默认状态，避免组件崩溃
        const defaultAnalysis = {
          hasValidData: true,
          overlappingRange: null,
          suggestions: ['数据获取遇到问题，系统将自动处理'],
          warnings: []
        };
        setAnalysis(defaultAnalysis);
        onDataRangeInfo?.(defaultAnalysis);
      } finally {
        setLoading(false);
      }
    };

    // 添加延迟以避免频繁调用
    const timeoutId = setTimeout(fetchDataRanges, 300);
    return () => clearTimeout(timeoutId);
  }, [selectedSymbols]);

  // 当选择的时间范围变化时重新分析
  useEffect(() => {
    if (Object.keys(dataRanges).length > 0) {
      analyzeDataRanges(dataRanges, selectedDateRange);
    }
  }, [selectedDateRange, dataRanges]);

  // 数据质量评估函数
  const assessDataQuality = (range: DataTimeRange) => {
    const records = range.total_records || 0;
    let quality_score: 'high' | 'medium' | 'low' | 'unavailable' | 'auto_fetch';
    let recommended = false;
    let quality_message = '';

    // 检查是否支持自动获取
    if (range.auto_fetch_available || range.quality_score === 'auto_fetch') {
      quality_score = 'auto_fetch';
      recommended = true;
      quality_message = '系统将自动获取最新数据';
      return {
        quality_score,
        recommended,
        quality_message
      };
    }

    if (records >= 5000) {
      quality_score = 'high';
      recommended = true;
      quality_message = '数据充足，推荐使用';
    } else if (records >= 2000) {
      quality_score = 'medium';
      recommended = true;
      quality_message = '数据量适中，可以使用';
    } else if (records >= 1000) {
      quality_score = 'low';
      recommended = false;
      quality_message = `数据量较少 (${records} 条)，建议选择更长时间范围`;
    } else {
      quality_score = 'low';
      recommended = false;
      quality_message = `数据量不足 (${records} 条)，不建议使用`;
    }

    // 检查时间跨度
    if (range.start_date && range.end_date) {
      const timeSpan = dayjs(range.end_date).diff(dayjs(range.start_date), 'day');
      if (timeSpan < 30) {
        quality_message += '，时间跨度较短';
        recommended = false;
      }
    }

    return {
      quality_score,
      recommended,
      quality_message
    };
  };

  const analyzeDataRanges = (ranges: Record<string, DataTimeRange>, dateRange: [dayjs.Dayjs, dayjs.Dayjs] | null) => {
    const availableRanges = Object.values(ranges).filter(range => range.available && range.start_date && range.end_date);
    const autoFetchRanges = Object.values(ranges).filter(range => range.auto_fetch_available || range.quality_score === 'auto_fetch');

    // 如果没有可用数据但有自动获取选项
    if (availableRanges.length === 0) {
      if (autoFetchRanges.length > 0) {
        const analysisResult = {
          hasValidData: true,  // 改为true，因为系统会自动获取
          overlappingRange: null,
          suggestions: ['系统将在回测时自动获取所需数据'],
          warnings: []
        };
        setAnalysis(analysisResult);
        onDataRangeInfo?.(analysisResult);
        return;
      } else {
        const analysisResult = {
          hasValidData: false,
          overlappingRange: null,
          suggestions: ['请选择有可用数据的交易对'],
          warnings: ['所选交易对都没有可用数据']
        };
        setAnalysis(analysisResult);
        onDataRangeInfo?.(analysisResult);
        return;
      }
    }

    // 计算所有交易对的数据重叠时间范围
    const startDates = availableRanges.map(range => dayjs(range.start_date!));
    const endDates = availableRanges.map(range => dayjs(range.end_date!));

    // 使用reduce来找到最大和最小日期，避免dayjs.max/min方法不存在的问题
    const overlappingStart = startDates.reduce((latest, current) =>
      current.isAfter(latest) ? current : latest
    );
    const overlappingEnd = endDates.reduce((earliest, current) =>
      current.isBefore(earliest) ? current : earliest
    );

    const suggestions: string[] = [];
    const warnings: string[] = [];
    let hasValidData = true;

    // 检查是否有重叠的时间范围
    if (overlappingStart.isAfter(overlappingEnd)) {
      hasValidData = false;
      warnings.push('所选交易对的数据时间范围没有重叠');
      suggestions.push('请选择数据时间范围有重叠的交易对');
    } else {
      // 检查用户选择的时间范围
      if (dateRange) {
        const [userStart, userEnd] = dateRange;

        // 检查用户选择的时间范围是否在数据范围内
        if (userEnd.isBefore(overlappingStart) || userStart.isAfter(overlappingEnd)) {
          warnings.push(`选择的时间范围与数据范围不重叠`);
          suggestions.push(`建议选择 ${overlappingStart.format('YYYY-MM-DD')} 到 ${overlappingEnd.format('YYYY-MM-DD')} 之间的时间范围`);
        } else {
          // 检查数据量是否足够
          const actualStart = userStart.isAfter(overlappingStart) ? userStart : overlappingStart;
          const actualEnd = userEnd.isBefore(overlappingEnd) ? userEnd : overlappingEnd;
          const daysDiff = actualEnd.diff(actualStart, 'day');

          if (daysDiff < 30) {
            warnings.push('选择的时间范围较短，可能影响回测效果');
            suggestions.push('建议选择至少30天的时间范围以获得更可靠的回测结果');
          }

          if (userStart.isBefore(overlappingStart) || userEnd.isAfter(overlappingEnd)) {
            suggestions.push(`系统将自动调整到可用数据范围: ${actualStart.format('YYYY-MM-DD')} 到 ${actualEnd.format('YYYY-MM-DD')}`);
          }
        }
      } else {
        suggestions.push(`建议选择 ${overlappingStart.format('YYYY-MM-DD')} 到 ${overlappingEnd.format('YYYY-MM-DD')} 之间的时间范围`);
      }
    }

    const analysisResult = {
      hasValidData,
      overlappingRange: hasValidData ? {
        start: overlappingStart.format('YYYY-MM-DD'),
        end: overlappingEnd.format('YYYY-MM-DD')
      } : null,
      suggestions,
      warnings
    };

    setAnalysis(analysisResult);
    onDataRangeInfo?.(analysisResult);
  };

  if (selectedSymbols.length === 0) {
    return null;
  }

  if (loading) {
    return (
      <Alert
        message={
          <Space>
            <Spin size="small" />
            <Text>正在获取数据时间范围...</Text>
          </Space>
        }
        type="info"
        showIcon={false}
        style={{ marginBottom: 16 }}
      />
    );
  }

  if (!analysis) {
    console.log('TimeRangeHint: No analysis data, returning null');
    return null;
  }

  // 添加渲染保护
  try {

  const alertType = analysis.hasValidData ?
    (analysis.warnings.length > 0 ? 'warning' : 'success') : 'error';

  const icon = analysis.hasValidData ?
    (analysis.warnings.length > 0 ? <ExclamationCircleOutlined /> : <CheckCircleOutlined />) :
    <ExclamationCircleOutlined />;

  return (
    <Alert
      message="数据时间范围分析"
      description={
        <Space direction="vertical" size="small" style={{ width: '100%' }}>
          {/* 显示每个交易对的数据范围 */}
          <div>
            <Text strong>交易对数据范围:</Text>
            <div style={{ marginTop: 8 }}>
              {selectedSymbols.map(symbol => {
                const range = dataRanges[symbol];
                if (!range) return null;

                const qualityColor = range.quality_score === 'high' ? 'green' :
                                   range.quality_score === 'medium' ? 'orange' :
                                   range.quality_score === 'low' ? 'red' :
                                   range.quality_score === 'auto_fetch' ? 'blue' : 'default';

                return (
                  <div key={symbol} style={{ marginBottom: 8 }}>
                    <Space>
                      <Tag color={range.available ? 'blue' : 'red'}>
                        {symbol}
                      </Tag>
                      <Tag color={qualityColor} style={{ fontSize: '11px' }}>
                        {range.quality_score === 'high' ? '优质' :
                         range.quality_score === 'medium' ? '良好' :
                         range.quality_score === 'low' ? '一般' :
                         range.quality_score === 'auto_fetch' ? '自动获取' : '不可用'}
                      </Tag>
                      {range.recommended && (
                        <Tag color="green" style={{ fontSize: '11px' }}>推荐</Tag>
                      )}
                    </Space>
                    <div style={{ marginTop: 4, marginLeft: 8 }}>
                      {range.available ? (
                        <Space direction="vertical" size={2}>
                          <Text type="secondary" style={{ fontSize: '12px' }}>
                            时间范围: {range.start_date} 到 {range.end_date}
                          </Text>
                          <Text type="secondary" style={{ fontSize: '12px' }}>
                            数据量: {range.total_records} 条记录
                          </Text>
                          {range.quality_message && (
                            <Text
                              type={range.recommended ? "success" : "warning"}
                              style={{ fontSize: '12px' }}
                            >
                              {range.quality_message}
                            </Text>
                          )}
                        </Space>
                      ) : (
                        <Text type="danger" style={{ fontSize: '12px' }}>
                          {range.message}
                        </Text>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* 显示重叠范围 */}
          {analysis.overlappingRange && (
            <div>
              <Text strong>可用时间范围: </Text>
              <Tag color="blue">
                {analysis.overlappingRange.start} 到 {analysis.overlappingRange.end}
              </Tag>
            </div>
          )}

          {/* 显示警告 */}
          {analysis.warnings.length > 0 && (
            <div>
              <Text type="warning" strong>注意事项:</Text>
              <ul style={{ margin: '4px 0', paddingLeft: 20 }}>
                {analysis.warnings.map((warning, index) => (
                  <li key={index}>
                    <Text type="warning">{warning}</Text>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* 显示建议 */}
          {analysis.suggestions.length > 0 && (
            <div>
              <Text strong>建议:</Text>
              <ul style={{ margin: '4px 0', paddingLeft: 20 }}>
                {analysis.suggestions.map((suggestion, index) => (
                  <li key={index}>
                    <Text>{suggestion}</Text>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </Space>
      }
      type={alertType}
      icon={icon}
      style={{ marginBottom: 16 }}
    />
  );
  } catch (renderError) {
    console.error('TimeRangeHint: Render error:', renderError);
    return (
      <Alert
        message="数据时间范围组件渲染错误"
        description="组件遇到渲染问题，但不影响回测功能。系统将自动处理数据获取。"
        type="warning"
        showIcon
        style={{ marginBottom: 16 }}
      />
    );
  }
};
