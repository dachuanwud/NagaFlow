import React, { useState, useEffect } from 'react';
import {
  Card,
  Form,
  Select,
  InputNumber,
  Switch,
  Input,
  Collapse,
  Space,
  Typography,
  Tooltip,
  Alert,
  Divider,
  Tag,
  Row,
  Col,
  Button
} from 'antd';
import {
  InfoCircleOutlined,
  SettingOutlined,
  CheckCircleOutlined,
  ExclamationCircleOutlined
} from '@ant-design/icons';
import { useThemeStore } from '../../stores/themeStore';
import { strategiesApi, FactorInfo, ParameterDefinition } from '../../services/api';

const { Option } = Select;
const { Panel } = Collapse;
const { Text, Title } = Typography;

interface FactorConfigurationProps {
  selectedFactors: string[];
  onFactorsChange: (factors: string[]) => void;
  parameters: Record<string, any>;
  onParametersChange: (parameters: Record<string, any>) => void;
  form: any;
}

export const FactorConfiguration: React.FC<FactorConfigurationProps> = ({
  selectedFactors,
  onFactorsChange,
  parameters,
  onParametersChange,
  form
}) => {
  const { isDark } = useThemeStore();
  const [factors, setFactors] = useState<FactorInfo[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [validationResults, setValidationResults] = useState<Record<string, any>>({});

  useEffect(() => {
    fetchFactors();
    fetchCategories();
  }, []);

  const fetchFactors = async () => {
    try {
      setLoading(true);
      const factorList = await strategiesApi.listFactors();
      setFactors(factorList);
    } catch (error) {
      console.error('Failed to fetch factors:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const result = await strategiesApi.getFactorCategories();
      setCategories(result.categories);
    } catch (error) {
      console.error('Failed to fetch categories:', error);
    }
  };

  const validateFactorParameters = async (factorName: string, factorParams: Record<string, any>) => {
    try {
      const result = await strategiesApi.validateFactorParameters(factorName, factorParams);
      setValidationResults(prev => ({
        ...prev,
        [factorName]: result
      }));
    } catch (error) {
      console.error('Failed to validate parameters:', error);
    }
  };

  const handleFactorChange = (newFactors: string[]) => {
    onFactorsChange(newFactors);
    
    // 清理不再使用的因子参数
    const newParameters = { ...parameters };
    Object.keys(newParameters).forEach(key => {
      const factorName = key.split('.')[0];
      if (!newFactors.includes(factorName)) {
        delete newParameters[key];
      }
    });
    
    // 为新选择的因子设置默认参数
    newFactors.forEach(factorName => {
      const factor = factors.find(f => f.name === factorName);
      if (factor) {
        factor.parameters.forEach(param => {
          const paramKey = `${factorName}.${param.name}`;
          if (!(paramKey in newParameters)) {
            newParameters[paramKey] = param.constraint.default;
          }
        });
      }
    });
    
    onParametersChange(newParameters);
  };

  const handleParameterChange = (factorName: string, paramName: string, value: any) => {
    const paramKey = `${factorName}.${paramName}`;
    const newParameters = {
      ...parameters,
      [paramKey]: value
    };
    onParametersChange(newParameters);
    
    // 验证该因子的参数
    const factorParams = {};
    Object.keys(newParameters).forEach(key => {
      if (key.startsWith(`${factorName}.`)) {
        const param = key.split('.')[1];
        factorParams[param] = newParameters[key];
      }
    });
    
    validateFactorParameters(factorName, factorParams);
  };

  const renderParameterInput = (factor: FactorInfo, param: ParameterDefinition) => {
    const paramKey = `${factor.name}.${param.name}`;
    const value = parameters[paramKey] ?? param.constraint.default;
    
    const commonProps = {
      value,
      onChange: (val: any) => handleParameterChange(factor.name, param.name, val),
      style: { width: '100%' }
    };

    switch (param.type) {
      case 'integer':
        return (
          <InputNumber
            {...commonProps}
            min={param.constraint.min_value}
            max={param.constraint.max_value}
            step={param.constraint.step || 1}
            precision={0}
          />
        );
      case 'float':
        return (
          <InputNumber
            {...commonProps}
            min={param.constraint.min_value}
            max={param.constraint.max_value}
            step={param.constraint.step || 0.1}
            precision={2}
          />
        );
      case 'boolean':
        return (
          <Switch
            checked={value}
            onChange={(checked) => handleParameterChange(factor.name, param.name, checked)}
          />
        );
      case 'string':
        return (
          <Input
            {...commonProps}
            placeholder={param.description}
          />
        );
      case 'list':
        return (
          <Select
            {...commonProps}
            mode="tags"
            placeholder="输入参数值"
          />
        );
      default:
        return (
          <Input
            {...commonProps}
            placeholder={param.description}
          />
        );
    }
  };

  const getValidationIcon = (factorName: string) => {
    const result = validationResults[factorName];
    if (!result) return null;
    
    if (result.is_valid) {
      return <CheckCircleOutlined style={{ color: '#52c41a' }} />;
    } else {
      return <ExclamationCircleOutlined style={{ color: '#ff4d4f' }} />;
    }
  };

  const cardStyle = {
    background: isDark ? '#242b3d' : '#ffffff',
    border: `1px solid ${isDark ? '#3a4553' : '#f0f0f0'}`,
  };

  const groupedFactors = factors.reduce((acc, factor) => {
    if (!acc[factor.category]) {
      acc[factor.category] = [];
    }
    acc[factor.category].push(factor);
    return acc;
  }, {} as Record<string, FactorInfo[]>);

  return (
    <Card
      title={
        <Space>
          <SettingOutlined />
          <span>因子配置</span>
        </Space>
      }
      style={cardStyle}
      loading={loading}
    >
      <Space direction="vertical" style={{ width: '100%' }} size="large">
        {/* 因子选择 */}
        <div>
          <Title level={5}>选择因子</Title>
          <Select
            mode="multiple"
            placeholder="选择要使用的因子"
            value={selectedFactors}
            onChange={handleFactorChange}
            style={{ width: '100%' }}
            optionLabelProp="label"
          >
            {categories.map(category => (
              <Select.OptGroup key={category} label={category}>
                {groupedFactors[category]?.map(factor => (
                  <Option
                    key={factor.name}
                    value={factor.name}
                    label={factor.display_name}
                  >
                    <Space>
                      <span>{factor.display_name}</span>
                      <Text type="secondary" style={{ fontSize: '12px' }}>
                        {factor.description}
                      </Text>
                    </Space>
                  </Option>
                ))}
              </Select.OptGroup>
            ))}
          </Select>
        </div>

        {/* 参数配置 */}
        {selectedFactors.length > 0 && (
          <div>
            <Title level={5}>参数配置</Title>
            <Collapse ghost>
              {selectedFactors.map(factorName => {
                const factor = factors.find(f => f.name === factorName);
                if (!factor) return null;

                const validation = validationResults[factorName];
                
                return (
                  <Panel
                    key={factorName}
                    header={
                      <Space>
                        <span>{factor.display_name}</span>
                        <Tag color={isDark ? 'blue' : 'processing'}>{factor.category}</Tag>
                        {getValidationIcon(factorName)}
                      </Space>
                    }
                    extra={
                      <Tooltip title={factor.description}>
                        <InfoCircleOutlined />
                      </Tooltip>
                    }
                  >
                    <Space direction="vertical" style={{ width: '100%' }} size="middle">
                      {validation && !validation.is_valid && (
                        <Alert
                          message="参数验证失败"
                          description={
                            <ul style={{ margin: 0, paddingLeft: '20px' }}>
                              {validation.errors.map((error: string, index: number) => (
                                <li key={index}>{error}</li>
                              ))}
                            </ul>
                          }
                          type="error"
                          showIcon
                          size="small"
                        />
                      )}
                      
                      {/* 按组显示参数 */}
                      {Object.entries(
                        factor.parameters.reduce((acc, param) => {
                          const group = param.group || '基础参数';
                          if (!acc[group]) acc[group] = [];
                          acc[group].push(param);
                          return acc;
                        }, {} as Record<string, ParameterDefinition[]>)
                      ).map(([groupName, params]) => (
                        <div key={groupName}>
                          <Divider orientation="left" style={{ margin: '8px 0' }}>
                            <Text strong style={{ fontSize: '12px' }}>{groupName}</Text>
                          </Divider>
                          <Row gutter={[16, 16]}>
                            {params
                              .sort((a, b) => a.order - b.order)
                              .map(param => (
                                <Col xs={24} sm={12} lg={8} key={param.name}>
                                  <Form.Item
                                    label={
                                      <Space>
                                        <span>{param.display_name}</span>
                                        <Tooltip title={param.description}>
                                          <InfoCircleOutlined style={{ fontSize: '12px' }} />
                                        </Tooltip>
                                      </Space>
                                    }
                                    style={{ marginBottom: '8px' }}
                                  >
                                    {renderParameterInput(factor, param)}
                                  </Form.Item>
                                </Col>
                              ))}
                          </Row>
                        </div>
                      ))}
                    </Space>
                  </Panel>
                );
              })}
            </Collapse>
          </div>
        )}
      </Space>
    </Card>
  );
};
