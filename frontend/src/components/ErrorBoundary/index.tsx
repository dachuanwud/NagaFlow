import React, { Component, ErrorInfo, ReactNode } from 'react';
import { Alert, Button, Card, Space } from 'antd';
import { ExclamationCircleOutlined, ReloadOutlined } from '@ant-design/icons';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

interface State {
  hasError: boolean;
  error?: Error;
  errorInfo?: ErrorInfo;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    // 更新state以显示错误UI
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // 记录错误信息
    console.error('ErrorBoundary caught an error:', error, errorInfo);
    
    this.setState({
      error,
      errorInfo
    });

    // 调用外部错误处理函数
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: undefined, errorInfo: undefined });
  };

  handleReload = () => {
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      // 如果提供了自定义fallback，使用它
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // 默认错误UI
      return (
        <Card style={{ margin: '16px 0' }}>
          <Alert
            message="组件渲染错误"
            description={
              <Space direction="vertical" style={{ width: '100%' }}>
                <div>
                  组件遇到了一个错误，但这不会影响页面的其他功能。
                </div>
                {this.state.error && (
                  <details style={{ marginTop: 8 }}>
                    <summary style={{ cursor: 'pointer', color: '#666' }}>
                      查看错误详情
                    </summary>
                    <pre style={{ 
                      marginTop: 8, 
                      padding: 8, 
                      background: '#f5f5f5', 
                      fontSize: '12px',
                      overflow: 'auto',
                      maxHeight: '200px'
                    }}>
                      {this.state.error.toString()}
                      {this.state.errorInfo?.componentStack}
                    </pre>
                  </details>
                )}
                <Space>
                  <Button 
                    type="primary" 
                    icon={<ReloadOutlined />}
                    onClick={this.handleRetry}
                  >
                    重试
                  </Button>
                  <Button 
                    icon={<ReloadOutlined />}
                    onClick={this.handleReload}
                  >
                    刷新页面
                  </Button>
                </Space>
              </Space>
            }
            type="error"
            icon={<ExclamationCircleOutlined />}
            showIcon
          />
        </Card>
      );
    }

    return this.props.children;
  }
}

// 简化的错误边界组件，用于包装小组件
export const SimpleErrorBoundary: React.FC<{ children: ReactNode }> = ({ children }) => {
  return (
    <ErrorBoundary
      fallback={
        <Alert
          message="组件加载失败"
          description="该组件遇到了问题，请刷新页面重试"
          type="warning"
          showIcon
          style={{ margin: '8px 0' }}
        />
      }
    >
      {children}
    </ErrorBoundary>
  );
};
