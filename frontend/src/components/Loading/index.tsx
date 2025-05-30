import React from 'react';
import { Spin, Skeleton, Card, Row, Col } from 'antd';
import { motion } from 'framer-motion';
import { useThemeStore } from '../../stores/themeStore';
import { useTranslation } from '../../hooks/useTranslation';

// 全局加载组件
interface GlobalLoadingProps {
  loading: boolean;
  tip?: string;
}

export const GlobalLoading: React.FC<GlobalLoadingProps> = ({ 
  loading, 
  tip 
}) => {
  const { t } = useTranslation();
  const { isDark } = useThemeStore();

  if (!loading) return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: isDark ? 'rgba(0, 0, 0, 0.8)' : 'rgba(255, 255, 255, 0.8)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 9999,
        backdropFilter: 'blur(4px)',
      }}
    >
      <Spin size="large" tip={tip || t('common.loading')} />
    </motion.div>
  );
};

// 页面加载骨架屏
export const PageSkeleton: React.FC = () => {
  return (
    <div style={{ padding: '24px' }}>
      <Row gutter={[24, 24]}>
        {/* 统计卡片骨架 */}
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Skeleton active paragraph={{ rows: 2 }} />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Skeleton active paragraph={{ rows: 2 }} />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Skeleton active paragraph={{ rows: 2 }} />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Skeleton active paragraph={{ rows: 2 }} />
          </Card>
        </Col>
      </Row>

      <Row gutter={[24, 24]} style={{ marginTop: '24px' }}>
        {/* 主要内容区域骨架 */}
        <Col xs={24} lg={16}>
          <Card>
            <Skeleton active paragraph={{ rows: 8 }} />
          </Card>
        </Col>
        
        {/* 侧边栏骨架 */}
        <Col xs={24} lg={8}>
          <Card style={{ marginBottom: '24px' }}>
            <Skeleton active paragraph={{ rows: 4 }} />
          </Card>
          <Card>
            <Skeleton active paragraph={{ rows: 3 }} />
          </Card>
        </Col>
      </Row>
    </div>
  );
};

// 表格加载骨架
interface TableSkeletonProps {
  rows?: number;
  columns?: number;
}

export const TableSkeleton: React.FC<TableSkeletonProps> = ({ 
  rows = 5, 
  columns = 4 
}) => {
  return (
    <div>
      {Array.from({ length: rows }).map((_, index) => (
        <div
          key={index}
          style={{
            display: 'flex',
            gap: '16px',
            marginBottom: '16px',
            padding: '12px 0',
            borderBottom: '1px solid #f0f0f0',
          }}
        >
          {Array.from({ length: columns }).map((_, colIndex) => (
            <Skeleton.Input
              key={colIndex}
              active
              style={{ width: `${100 / columns}%` }}
            />
          ))}
        </div>
      ))}
    </div>
  );
};

// 图表加载骨架
export const ChartSkeleton: React.FC = () => {
  return (
    <div style={{ height: '320px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <Skeleton.Node active style={{ width: '100%', height: '100%' }}>
        <div style={{
          width: '100%',
          height: '100%',
          background: 'linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%)',
          backgroundSize: '200% 100%',
          animation: 'loading 1.5s infinite',
          borderRadius: '8px',
        }} />
      </Skeleton.Node>
    </div>
  );
};

// 卡片加载组件
interface CardLoadingProps {
  loading: boolean;
  children: React.ReactNode;
  height?: number;
}

export const CardLoading: React.FC<CardLoadingProps> = ({ 
  loading, 
  children, 
  height = 200 
}) => {
  if (loading) {
    return (
      <Card style={{ height }}>
        <Skeleton active paragraph={{ rows: 3 }} />
      </Card>
    );
  }

  return <>{children}</>;
};

// 按钮加载状态
interface LoadingButtonProps {
  loading: boolean;
  children: React.ReactNode;
  onClick?: () => void;
  type?: 'primary' | 'default' | 'dashed' | 'link' | 'text';
  size?: 'small' | 'middle' | 'large';
  disabled?: boolean;
  className?: string;
}

export const LoadingButton: React.FC<LoadingButtonProps> = ({
  loading,
  children,
  onClick,
  type = 'default',
  size = 'middle',
  disabled = false,
  className,
}) => {
  return (
    <motion.button
      className={`ant-btn ant-btn-${type} ant-btn-${size} ${className || ''}`}
      onClick={loading || disabled ? undefined : onClick}
      disabled={loading || disabled}
      whileHover={!loading && !disabled ? { scale: 1.02 } : {}}
      whileTap={!loading && !disabled ? { scale: 0.98 } : {}}
      transition={{ duration: 0.1 }}
      style={{
        cursor: loading || disabled ? 'not-allowed' : 'pointer',
        opacity: loading || disabled ? 0.6 : 1,
      }}
    >
      {loading && <Spin size="small" style={{ marginRight: '8px' }} />}
      {children}
    </motion.button>
  );
};

// 脉冲加载动画
export const PulseLoading: React.FC = () => {
  return (
    <motion.div
      style={{
        width: '12px',
        height: '12px',
        borderRadius: '50%',
        background: '#00d4ff',
      }}
      animate={{
        scale: [1, 1.2, 1],
        opacity: [1, 0.7, 1],
      }}
      transition={{
        duration: 1.5,
        repeat: Infinity,
        ease: 'easeInOut',
      }}
    />
  );
};
