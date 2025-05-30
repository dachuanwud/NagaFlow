import React, { useState, useEffect } from 'react';
import { Modal, Card, Row, Col, Spin, Button, Space, Typography, Divider, Timeline, Tag, Alert } from 'antd';
import { 
  BarChartOutlined, 
  TrophyOutlined, 
  RocketOutlined, 
  ExperimentOutlined,
  LineChartOutlined,
  TableOutlined,
  DownloadOutlined,
  EyeOutlined,
  ClockCircleOutlined,
  CheckCircleOutlined,
  LoadingOutlined
} from '@ant-design/icons';
import { motion, AnimatePresence } from 'framer-motion';
import { useThemeStore } from '../../stores/themeStore';
import { useTranslation } from '../../hooks/useTranslation';
import { backtestApi, BacktestResult, BacktestStatus } from '../../services/api';

const { Title, Text, Paragraph } = Typography;

interface BacktestResultsModalProps {
  visible: boolean;
  taskId: string | null;
  onClose: () => void;
}

export const BacktestResultsModal: React.FC<BacktestResultsModalProps> = ({
  visible,
  taskId,
  onClose,
}) => {
  const { isDark } = useThemeStore();
  const { t } = useTranslation();
  const [loading, setLoading] = useState(false);
  const [taskData, setTaskData] = useState<BacktestStatus | null>(null);

  // 获取任务数据
  useEffect(() => {
    if (visible && taskId) {
      fetchTaskData();
    }
  }, [visible, taskId]);

  const fetchTaskData = async () => {
    if (!taskId) return;
    
    try {
      setLoading(true);
      const data = await backtestApi.getBacktestStatus(taskId);
      setTaskData(data);
    } catch (error) {
      console.error('Failed to fetch task data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleNavigateToResults = () => {
    // 关闭模态框并导航到结果页面
    onClose();
    window.open('/results', '_blank');
  };

  const cardStyle = {
    background: isDark ? '#242b3d' : '#ffffff',
    border: `1px solid ${isDark ? '#3a4553' : '#f0f0f0'}`,
    borderRadius: '12px',
    boxShadow: isDark 
      ? '0 4px 12px rgba(0, 0, 0, 0.3)' 
      : '0 4px 12px rgba(0, 0, 0, 0.1)',
  };

  const iconStyle = {
    fontSize: '48px',
    marginBottom: '16px',
  };

  const featureCards = [
    {
      icon: <LineChartOutlined style={{ ...iconStyle, color: '#1890ff' }} />,
      title: '资金曲线图表',
      description: '可视化展示策略的资金变化趋势，包括收益曲线和回撤分析',
      status: 'planned'
    },
    {
      icon: <BarChartOutlined style={{ ...iconStyle, color: '#52c41a' }} />,
      title: '性能统计分析',
      description: '详细的收益率、夏普比率、最大回撤等关键指标统计',
      status: 'planned'
    },
    {
      icon: <TableOutlined style={{ ...iconStyle, color: '#fa8c16' }} />,
      title: '交易记录明细',
      description: '完整的交易历史记录，支持筛选、排序和导出功能',
      status: 'planned'
    },
    {
      icon: <TrophyOutlined style={{ ...iconStyle, color: '#eb2f96' }} />,
      title: '策略对比分析',
      description: '多策略横向对比，帮助您选择最优的交易策略',
      status: 'planned'
    }
  ];

  const developmentTimeline = [
    {
      color: 'blue',
      dot: <ClockCircleOutlined />,
      children: (
        <div>
          <Text strong>第一阶段 - 基础图表展示</Text>
          <br />
          <Text type="secondary">实现资金曲线、收益分布等基础图表</Text>
        </div>
      )
    },
    {
      color: 'green',
      dot: <CheckCircleOutlined />,
      children: (
        <div>
          <Text strong>第二阶段 - 交互式分析</Text>
          <br />
          <Text type="secondary">添加数据筛选、时间范围选择等交互功能</Text>
        </div>
      )
    },
    {
      color: 'orange',
      dot: <LoadingOutlined />,
      children: (
        <div>
          <Text strong>第三阶段 - 高级功能</Text>
          <br />
          <Text type="secondary">策略对比、风险分析、报告导出等高级功能</Text>
        </div>
      )
    }
  ];

  return (
    <Modal
      title={
        <Space>
          <ExperimentOutlined />
          <span>回测结果查看</span>
          {taskData && (
            <Tag color={taskData.status === 'completed' ? 'green' : 'blue'}>
              {taskData.status === 'completed' ? '已完成' : '进行中'}
            </Tag>
          )}
        </Space>
      }
      open={visible}
      onCancel={onClose}
      width={1000}
      footer={[
        <Button key="close" onClick={onClose}>
          关闭
        </Button>,
        <Button 
          key="results" 
          type="primary" 
          icon={<EyeOutlined />}
          onClick={handleNavigateToResults}
        >
          前往结果页面
        </Button>
      ]}
      style={{
        top: 20,
      }}
      bodyStyle={{
        maxHeight: '70vh',
        overflowY: 'auto',
        padding: '24px',
      }}
    >
      <AnimatePresence>
        {loading ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{ 
              textAlign: 'center', 
              padding: '60px 0',
              background: isDark ? '#1a1f2e' : '#fafafa',
              borderRadius: '8px'
            }}
          >
            <Spin size="large" tip="正在加载任务信息..." />
          </motion.div>
        ) : (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
          >
            {/* 功能开发提示 */}
            <Alert
              message="功能正在开发中"
              description="我们正在努力开发强大的回测结果查看功能，敬请期待！您可以先前往结果页面查看现有功能。"
              type="info"
              showIcon
              style={{ marginBottom: '24px' }}
              action={
                <Button size="small" type="primary" onClick={handleNavigateToResults}>
                  立即体验
                </Button>
              }
            />

            {/* 任务信息 */}
            {taskData && (
              <Card style={{ ...cardStyle, marginBottom: '24px' }}>
                <Title level={4}>
                  <RocketOutlined style={{ marginRight: '8px', color: '#1890ff' }} />
                  任务信息
                </Title>
                <Row gutter={[16, 16]}>
                  <Col span={12}>
                    <Text strong>任务ID: </Text>
                    <Text code>{taskData.task_id.slice(0, 8)}...</Text>
                  </Col>
                  <Col span={12}>
                    <Text strong>状态: </Text>
                    <Tag color={taskData.status === 'completed' ? 'green' : 'blue'}>
                      {taskData.status === 'completed' ? '已完成' : '进行中'}
                    </Tag>
                  </Col>
                  <Col span={12}>
                    <Text strong>进度: </Text>
                    <Text>{taskData.symbols_completed}/{taskData.symbols_total} 交易对</Text>
                  </Col>
                  <Col span={12}>
                    <Text strong>结果数量: </Text>
                    <Text>{taskData.results?.length || 0} 个</Text>
                  </Col>
                </Row>
              </Card>
            )}

            {/* 即将推出的功能 */}
            <Card style={cardStyle}>
              <Title level={4}>
                <ExperimentOutlined style={{ marginRight: '8px', color: '#52c41a' }} />
                即将推出的功能
              </Title>
              
              <Row gutter={[24, 24]} style={{ marginBottom: '32px' }}>
                {featureCards.map((feature, index) => (
                  <Col xs={24} sm={12} key={index}>
                    <motion.div
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: index * 0.1 }}
                    >
                      <Card
                        style={{
                          ...cardStyle,
                          textAlign: 'center',
                          height: '200px',
                          display: 'flex',
                          flexDirection: 'column',
                          justifyContent: 'center',
                        }}
                        hoverable
                      >
                        {feature.icon}
                        <Title level={5} style={{ margin: '8px 0' }}>
                          {feature.title}
                        </Title>
                        <Paragraph 
                          type="secondary" 
                          style={{ 
                            fontSize: '12px',
                            margin: 0,
                            lineHeight: '1.4'
                          }}
                        >
                          {feature.description}
                        </Paragraph>
                      </Card>
                    </motion.div>
                  </Col>
                ))}
              </Row>

              <Divider />

              {/* 开发时间线 */}
              <Title level={5}>
                <ClockCircleOutlined style={{ marginRight: '8px' }} />
                开发计划
              </Title>
              <Timeline items={developmentTimeline} />

              <Divider />

              {/* 操作按钮 */}
              <div style={{ textAlign: 'center' }}>
                <Space size="large">
                  <Button 
                    type="primary" 
                    size="large"
                    icon={<EyeOutlined />}
                    onClick={handleNavigateToResults}
                  >
                    查看现有功能
                  </Button>
                  <Button 
                    size="large"
                    icon={<DownloadOutlined />}
                    disabled
                  >
                    导出报告 (开发中)
                  </Button>
                </Space>
              </div>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>
    </Modal>
  );
};
