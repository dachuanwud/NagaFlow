import React from 'react';
import { Card, Select, Space, Tag, Button, Tooltip, Typography, Empty } from 'antd';
import {
  BarChartOutlined,
  SwapOutlined,
  CloseOutlined,
  TrophyOutlined,
  CalendarOutlined,
  DollarOutlined
} from '@ant-design/icons';
import { useThemeStore } from '../../stores/themeStore';
import { useBacktestResultsStore } from '../../stores/backtestResultsStore';
import { BacktestResult } from '../../services/api';
import dayjs from 'dayjs';

const { Option } = Select;
const { Text, Title } = Typography;

interface StrategySelectorProps {
  onStrategyChange?: (taskId: string | null) => void;
}

export const StrategySelector: React.FC<StrategySelectorProps> = ({ onStrategyChange }) => {
  const { isDark } = useThemeStore();
  const {
    tasks,
    results,
    selectedTaskId,
    compareMode,
    compareTaskIds,
    selectTask,
    clearSelection,
    toggleCompareMode,
    addToCompare,
    removeFromCompare,
    clearCompare
  } = useBacktestResultsStore();

  const cardStyle = {
    background: isDark ? '#242b3d' : '#ffffff',
    border: `1px solid ${isDark ? '#3a4553' : '#f0f0f0'}`,
    borderRadius: '8px',
  };

  // 获取已完成的任务
  const completedTasks = tasks.filter(task => 
    task.status === 'completed' && task.results && task.results.length > 0
  );

  // 处理策略选择
  const handleStrategySelect = (taskId: string) => {
    selectTask(taskId);
    onStrategyChange?.(taskId);
  };

  // 处理清除选择
  const handleClearSelection = () => {
    clearSelection();
    onStrategyChange?.(null);
  };

  // 获取策略的关键指标预览
  const getStrategyPreview = (result: BacktestResult) => {
    return {
      return: result.final_return?.toFixed(2) || '0.00',
      sharpe: result.sharpe_ratio?.toFixed(2) || '0.00',
      maxDrawdown: result.max_drawdown?.toFixed(2) || '0.00',
      winRate: result.win_rate?.toFixed(1) || '0.0'
    };
  };

  // 获取策略显示名称
  const getStrategyDisplayName = (task: any) => {
    const result = task.results?.[0];
    if (!result) return `策略 ${task.task_id.slice(0, 8)}`;
    
    return `${result.strategy || '未知策略'} - ${result.symbol || ''}`;
  };

  // 渲染策略选项
  const renderStrategyOption = (task: any) => {
    const result = task.results?.[0];
    if (!result) return null;

    const preview = getStrategyPreview(result);
    const isSelected = selectedTaskId === task.task_id;
    const isInCompare = compareTaskIds.includes(task.task_id);

    return (
      <Option key={task.task_id} value={task.task_id}>
        <div style={{ 
          padding: '8px 0',
          borderLeft: isSelected ? `3px solid #00d4ff` : 'none',
          paddingLeft: isSelected ? '8px' : '0'
        }}>
          <div style={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center',
            marginBottom: '4px'
          }}>
            <Text strong style={{ color: isDark ? '#ffffff' : '#000000' }}>
              {getStrategyDisplayName(task)}
            </Text>
            <Space size={4}>
              {isInCompare && (
                <Tag color="blue" size="small">对比中</Tag>
              )}
              <Tag 
                color={parseFloat(preview.return) > 0 ? 'green' : 'red'} 
                size="small"
              >
                {preview.return}%
              </Tag>
            </Space>
          </div>
          
          <div style={{ display: 'flex', gap: '12px' }}>
            <Text size="small" style={{ color: isDark ? '#a0a9c0' : '#666666' }}>
              <TrophyOutlined style={{ marginRight: '2px' }} />
              夏普: {preview.sharpe}
            </Text>
            <Text size="small" style={{ color: isDark ? '#a0a9c0' : '#666666' }}>
              <DollarOutlined style={{ marginRight: '2px' }} />
              胜率: {preview.winRate}%
            </Text>
            <Text size="small" style={{ color: isDark ? '#a0a9c0' : '#666666' }}>
              <CalendarOutlined style={{ marginRight: '2px' }} />
              {dayjs(result.created_at).format('MM-DD HH:mm')}
            </Text>
          </div>
        </div>
      </Option>
    );
  };

  if (completedTasks.length === 0) {
    return (
      <Card style={cardStyle}>
        <Empty
          image={Empty.PRESENTED_IMAGE_SIMPLE}
          description={
            <Text style={{ color: isDark ? '#a0a9c0' : '#666666' }}>
              暂无已完成的回测策略
            </Text>
          }
        />
      </Card>
    );
  }

  return (
    <Card 
      title={
        <Space>
          <BarChartOutlined style={{ color: '#00d4ff' }} />
          <span style={{ color: isDark ? '#ffffff' : '#000000' }}>
            策略选择器
          </span>
          <Tag color="blue">{completedTasks.length} 个策略</Tag>
        </Space>
      }
      style={cardStyle}
      extra={
        <Space>
          {/* 对比模式切换 */}
          <Tooltip title={compareMode ? '退出对比模式' : '进入对比模式'}>
            <Button
              type={compareMode ? 'primary' : 'default'}
              icon={<SwapOutlined />}
              onClick={toggleCompareMode}
              size="small"
            >
              {compareMode ? '对比模式' : '对比'}
            </Button>
          </Tooltip>
          
          {/* 清除选择 */}
          {selectedTaskId && (
            <Tooltip title="清除选择">
              <Button
                icon={<CloseOutlined />}
                onClick={handleClearSelection}
                size="small"
              />
            </Tooltip>
          )}
        </Space>
      }
    >
      <Space direction="vertical" style={{ width: '100%' }} size="middle">
        {/* 策略选择下拉框 */}
        <div>
          <Text style={{ 
            color: isDark ? '#a0a9c0' : '#666666',
            marginBottom: '8px',
            display: 'block'
          }}>
            选择要查看的策略：
          </Text>
          <Select
            style={{ width: '100%' }}
            placeholder="请选择一个策略查看详细结果"
            value={selectedTaskId}
            onChange={handleStrategySelect}
            allowClear
            onClear={handleClearSelection}
            showSearch
            filterOption={(input, option) => {
              const task = completedTasks.find(t => t.task_id === option?.value);
              const displayName = task ? getStrategyDisplayName(task) : '';
              return displayName.toLowerCase().includes(input.toLowerCase());
            }}
          >
            {completedTasks.map(renderStrategyOption)}
          </Select>
        </div>

        {/* 对比模式面板 */}
        {compareMode && (
          <div>
            <div style={{ 
              display: 'flex', 
              justifyContent: 'space-between', 
              alignItems: 'center',
              marginBottom: '8px'
            }}>
              <Text style={{ color: isDark ? '#a0a9c0' : '#666666' }}>
                对比策略 (最多4个)：
              </Text>
              {compareTaskIds.length > 0 && (
                <Button 
                  size="small" 
                  type="link" 
                  onClick={clearCompare}
                  style={{ padding: 0 }}
                >
                  清空
                </Button>
              )}
            </div>
            
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
              {compareTaskIds.map(taskId => {
                const task = completedTasks.find(t => t.task_id === taskId);
                if (!task) return null;
                
                return (
                  <Tag
                    key={taskId}
                    closable
                    onClose={() => removeFromCompare(taskId)}
                    color="blue"
                  >
                    {getStrategyDisplayName(task)}
                  </Tag>
                );
              })}
              
              {compareTaskIds.length < 4 && (
                <Select
                  style={{ minWidth: '200px' }}
                  placeholder="添加策略到对比"
                  value={undefined}
                  onChange={addToCompare}
                  size="small"
                >
                  {completedTasks
                    .filter(task => !compareTaskIds.includes(task.task_id))
                    .map(task => (
                      <Option key={task.task_id} value={task.task_id}>
                        {getStrategyDisplayName(task)}
                      </Option>
                    ))
                  }
                </Select>
              )}
            </div>
          </div>
        )}
      </Space>
    </Card>
  );
};
