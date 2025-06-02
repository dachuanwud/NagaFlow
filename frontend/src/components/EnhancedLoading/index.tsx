import React from 'react';
import { Spin, Progress, Typography, Space, Card, Timeline, Tag } from 'antd';
import { CheckCircleOutlined, LoadingOutlined, ClockCircleOutlined } from '@ant-design/icons';
import { useThemeStore } from '../../stores/themeStore';

const { Text, Title } = Typography;

interface LoadingStep {
  key: string;
  title: string;
  description: string;
  status: 'waiting' | 'processing' | 'completed' | 'error';
  duration?: number;
}

interface EnhancedLoadingProps {
  visible: boolean;
  title?: string;
  description?: string;
  progress?: number;
  steps?: LoadingStep[];
  currentStep?: string;
  showProgress?: boolean;
  showSteps?: boolean;
  estimatedTime?: number;
  onCancel?: () => void;
}

export const EnhancedLoading: React.FC<EnhancedLoadingProps> = ({
  visible,
  title = '处理中...',
  description,
  progress = 0,
  steps = [],
  currentStep,
  showProgress = true,
  showSteps = true,
  estimatedTime,
  onCancel
}) => {
  const { isDark } = useThemeStore();

  if (!visible) return null;

  const getStepIcon = (step: LoadingStep) => {
    switch (step.status) {
      case 'completed':
        return <CheckCircleOutlined style={{ color: '#52c41a' }} />;
      case 'processing':
        return <LoadingOutlined style={{ color: '#1890ff' }} />;
      case 'error':
        return <CheckCircleOutlined style={{ color: '#ff4d4f' }} />;
      default:
        return <ClockCircleOutlined style={{ color: '#d9d9d9' }} />;
    }
  };

  const getStepColor = (step: LoadingStep) => {
    switch (step.status) {
      case 'completed':
        return 'green';
      case 'processing':
        return 'blue';
      case 'error':
        return 'red';
      default:
        return 'default';
    }
  };

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
      }}
    >
      <Card
        style={{
          width: '90%',
          maxWidth: 600,
          background: isDark ? '#1f1f1f' : '#ffffff',
          border: `1px solid ${isDark ? '#434343' : '#d9d9d9'}`,
        }}
        bodyStyle={{ padding: '32px' }}
      >
        <Space direction="vertical" size="large" style={{ width: '100%' }}>
          {/* 标题和描述 */}
          <div style={{ textAlign: 'center' }}>
            <Spin size="large" />
            <Title level={4} style={{ marginTop: 16, marginBottom: 8 }}>
              {title}
            </Title>
            {description && (
              <Text type="secondary">{description}</Text>
            )}
          </div>

          {/* 进度条 */}
          {showProgress && (
            <div>
              <Progress
                percent={Math.round(progress)}
                status={progress === 100 ? 'success' : 'active'}
                strokeColor={isDark ? '#1890ff' : undefined}
              />
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 8 }}>
                <Text type="secondary">进度: {Math.round(progress)}%</Text>
                {estimatedTime && (
                  <Text type="secondary">
                    预计剩余: {Math.max(0, Math.round(estimatedTime * (100 - progress) / 100))}秒
                  </Text>
                )}
              </div>
            </div>
          )}

          {/* 步骤时间线 */}
          {showSteps && steps.length > 0 && (
            <div>
              <Title level={5}>处理步骤</Title>
              <Timeline>
                {steps.map((step) => (
                  <Timeline.Item
                    key={step.key}
                    dot={getStepIcon(step)}
                    color={getStepColor(step)}
                  >
                    <div>
                      <Space>
                        <Text strong>{step.title}</Text>
                        <Tag color={getStepColor(step)}>
                          {step.status === 'waiting' && '等待中'}
                          {step.status === 'processing' && '处理中'}
                          {step.status === 'completed' && '已完成'}
                          {step.status === 'error' && '失败'}
                        </Tag>
                        {step.duration && step.status === 'completed' && (
                          <Text type="secondary" style={{ fontSize: '12px' }}>
                            ({step.duration}s)
                          </Text>
                        )}
                      </Space>
                      <div style={{ marginTop: 4 }}>
                        <Text type="secondary" style={{ fontSize: '12px' }}>
                          {step.description}
                        </Text>
                      </div>
                    </div>
                  </Timeline.Item>
                ))}
              </Timeline>
            </div>
          )}

          {/* 当前步骤高亮 */}
          {currentStep && (
            <div style={{ textAlign: 'center', padding: '16px', backgroundColor: isDark ? '#262626' : '#f5f5f5', borderRadius: '6px' }}>
              <Text strong>当前步骤: {currentStep}</Text>
            </div>
          )}

          {/* 取消按钮 */}
          {onCancel && (
            <div style={{ textAlign: 'center' }}>
              <Text
                type="secondary"
                style={{ cursor: 'pointer', textDecoration: 'underline' }}
                onClick={onCancel}
              >
                取消操作
              </Text>
            </div>
          )}
        </Space>
      </Card>
    </div>
  );
};

export default EnhancedLoading;
