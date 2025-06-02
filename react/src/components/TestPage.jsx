import React, { useState, useEffect } from 'react';
import { 
  Card, 
  Button, 
  Space, 
  Typography, 
  Alert, 
  Divider, 
  Row, 
  Col,
  Spin,
  Tag,
  List,
  message,
  Statistic,
  Progress
} from 'antd';
import { 
  PlayCircleOutlined, 
  StopOutlined, 
  ReloadOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  ExclamationCircleOutlined,
  ApiOutlined,
  DatabaseOutlined,
  CloudServerOutlined
} from '@ant-design/icons';
import axios from 'axios';

const { Title, Text, Paragraph } = Typography;

const TestPage = () => {
  const [systemStatus, setSystemStatus] = useState(null);
  const [loading, setLoading] = useState(false);
  const [testResults, setTestResults] = useState({});
  const [componentLoading, setComponentLoading] = useState({});

  // 获取系统状态
  const fetchSystemStatus = async () => {
    setLoading(true);
    try {
      const response = await axios.get('http://localhost:8000/api/system/status');
      setSystemStatus(response.data);
    } catch (error) {
      console.error('获取系统状态失败:', error);
      message.error('获取系统状态失败');
    } finally {
      setLoading(false);
    }
  };

  // 测试API接口
  const testAPI = async (endpoint, name) => {
    setTestResults(prev => ({ ...prev, [endpoint]: { loading: true } }));
    
    try {
      const startTime = Date.now();
      const response = await axios.get(`http://localhost:8000${endpoint}`);
      const endTime = Date.now();
      const responseTime = endTime - startTime;
      
      setTestResults(prev => ({
        ...prev,
        [endpoint]: {
          success: true,
          data: response.data,
          responseTime,
          status: response.status,
          loading: false
        }
      }));
      
      message.success(`${name} 测试成功`);
    } catch (error) {
      setTestResults(prev => ({
        ...prev,
        [endpoint]: {
          success: false,
          error: error.message,
          status: error.response?.status,
          loading: false
        }
      }));
      
      message.error(`${name} 测试失败`);
    }
  };

  // 控制系统组件
  const controlComponent = async (component, action) => {
    setComponentLoading(prev => ({ ...prev, [component]: true }));
    
    try {
      const response = await axios.post(
        `http://localhost:8000/api/system/${action}-component/${component}`
      );
      
      message.success(response.data.message);
      
      // 刷新系统状态
      setTimeout(fetchSystemStatus, 1000);
    } catch (error) {
      console.error(`${action} ${component} 失败:`, error);
      message.error(error.response?.data?.detail || `${action} ${component} 失败`);
    } finally {
      setComponentLoading(prev => ({ ...prev, [component]: false }));
    }
  };

  // 一键测试所有API
  const testAllAPIs = async () => {
    const endpoints = [
      { url: '/api/health', name: '健康检查' },
      { url: '/api/analytics/real-time', name: '实时数据' },
      { url: '/api/analytics/metrics', name: '系统指标' },
      { url: '/api/recommendations/user_12345678', name: '用户推荐' },
      { url: '/api/system/status', name: '系统状态' }
    ];

    for (const endpoint of endpoints) {
      await testAPI(endpoint.url, endpoint.name);
      // 添加延迟避免请求过于频繁
      await new Promise(resolve => setTimeout(resolve, 500));
    }
  };

  useEffect(() => {
    fetchSystemStatus();
  }, []);

  const getStatusIcon = (status) => {
    switch (status) {
      case 'running':
      case 'connected':
      case 'healthy':
        return <CheckCircleOutlined style={{ color: '#52c41a' }} />;
      case 'stopped':
      case 'disconnected':
      case 'unhealthy':
        return <CloseCircleOutlined style={{ color: '#ff4d4f' }} />;
      default:
        return <ExclamationCircleOutlined style={{ color: '#faad14' }} />;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'running':
      case 'connected':
      case 'healthy':
        return 'success';
      case 'stopped':
      case 'disconnected':
      case 'unhealthy':
        return 'error';
      default:
        return 'warning';
    }
  };

  return (
    <div className="fade-in">
      <Title level={2}>系统测试中心</Title>
      <Paragraph>
        此页面用于测试系统各个组件的运行状态和API接口的响应情况。
      </Paragraph>

      {/* 系统状态概览 */}
      <Card 
        title="系统状态概览" 
        style={{ marginBottom: 24 }}
        extra={
          <Button 
            icon={<ReloadOutlined />}
            onClick={fetchSystemStatus}
            loading={loading}
          >
            刷新状态
          </Button>
        }
      >
        {loading ? (
          <div style={{ textAlign: 'center', padding: '50px 0' }}>
            <Spin size="large" />
            <div style={{ marginTop: 16 }}>正在获取系统状态...</div>
          </div>
        ) : systemStatus ? (
          <Row gutter={[16, 16]}>
            <Col xs={24} sm={8}>
              <Card size="small">
                <Statistic
                  title="系统总体状态"
                  value={systemStatus.overall_status || '未知'}
                  valueStyle={{ 
                    color: systemStatus.overall_status === 'running' ? '#52c41a' : '#ff4d4f' 
                  }}
                  prefix={getStatusIcon(systemStatus.overall_status)}
                />
              </Card>
            </Col>
            <Col xs={24} sm={8}>
              <Card size="small">
                <Statistic
                  title="运行组件数"
                  value={systemStatus.components ? 
                    Object.values(systemStatus.components).filter(status => 
                      status === 'running' || status === 'connected'
                    ).length : 0
                  }
                  suffix={`/ ${systemStatus.components ? Object.keys(systemStatus.components).length : 0}`}
                  valueStyle={{ color: '#1890ff' }}
                />
              </Card>
            </Col>
            <Col xs={24} sm={8}>
              <Card size="small">
                <Statistic
                  title="最后更新"
                  value={systemStatus.timestamp ? 
                    new Date(systemStatus.timestamp).toLocaleTimeString() : '未知'
                  }
                  valueStyle={{ color: '#722ed1' }}
                />
              </Card>
            </Col>
          </Row>
        ) : (
          <Alert message="无法获取系统状态" type="error" />
        )}
      </Card>

      {/* 组件控制 */}
      <Card title="组件控制" style={{ marginBottom: 24 }}>
        <Row gutter={[16, 16]}>
          <Col xs={24} sm={12}>
            <Card 
              size="small" 
              title={
                <Space>
                  <DatabaseOutlined />
                  数据生成器
                </Space>
              }
              extra={
                systemStatus?.components?.data_generator && (
                  <Tag color={getStatusColor(systemStatus.components.data_generator)}>
                    {systemStatus.components.data_generator}
                  </Tag>
                )
              }
            >
              <Paragraph style={{ fontSize: 14, marginBottom: 16 }}>
                生成模拟的电商用户行为数据并发送到Kafka消息队列
              </Paragraph>
              <Space>
                <Button
                  type="primary"
                  icon={<PlayCircleOutlined />}
                  onClick={() => controlComponent('data_generator', 'start')}
                  loading={componentLoading.data_generator}
                  disabled={systemStatus?.components?.data_generator === 'running'}
                >
                  启动
                </Button>
                <Button
                  icon={<StopOutlined />}
                  onClick={() => controlComponent('data_generator', 'stop')}
                  loading={componentLoading.data_generator}
                  disabled={systemStatus?.components?.data_generator === 'stopped'}
                >
                  停止
                </Button>
              </Space>
            </Card>
          </Col>
          
          <Col xs={24} sm={12}>
            <Card 
              size="small"
              title={
                <Space>
                  <CloudServerOutlined />
                  流处理器
                </Space>
              }
              extra={
                systemStatus?.components?.stream_processor && (
                  <Tag color={getStatusColor(systemStatus.components.stream_processor)}>
                    {systemStatus.components.stream_processor}
                  </Tag>
                )
              }
            >
              <Paragraph style={{ fontSize: 14, marginBottom: 16 }}>
                实时处理Kafka中的数据流，计算统计指标并存储到数据库
              </Paragraph>
              <Space>
                <Button
                  type="primary"
                  icon={<PlayCircleOutlined />}
                  onClick={() => controlComponent('stream_processor', 'start')}
                  loading={componentLoading.stream_processor}
                  disabled={systemStatus?.components?.stream_processor === 'running'}
                >
                  启动
                </Button>
                <Button
                  icon={<StopOutlined />}
                  onClick={() => controlComponent('stream_processor', 'stop')}
                  loading={componentLoading.stream_processor}
                  disabled={systemStatus?.components?.stream_processor === 'stopped'}
                >
                  停止
                </Button>
              </Space>
            </Card>
          </Col>
        </Row>
      </Card>

      {/* API 测试 */}
      <Card 
        title="API 接口测试" 
        style={{ marginBottom: 24 }}
        extra={
          <Button 
            type="primary" 
            onClick={testAllAPIs}
            icon={<ApiOutlined />}
          >
            一键测试所有API
          </Button>
        }
      >
        <Row gutter={[16, 16]}>
          {[
            { url: '/api/health', name: '健康检查', desc: '检查系统组件连接状态' },
            { url: '/api/analytics/real-time', name: '实时数据', desc: '获取实时统计数据' },
            { url: '/api/analytics/metrics', name: '系统指标', desc: '获取CPU、内存等系统指标' },
            { url: '/api/recommendations/user_12345678', name: '用户推荐', desc: '获取用户个性化推荐' },
            { url: '/api/system/status', name: '系统状态', desc: '获取详细系统状态' }
          ].map((api) => (
            <Col xs={24} lg={12} key={api.url}>
              <Card 
                size="small"
                title={api.name}
                extra={
                  testResults[api.url] && !testResults[api.url].loading && (
                    <Tag color={testResults[api.url].success ? 'success' : 'error'}>
                      {testResults[api.url].success ? '成功' : '失败'}
                    </Tag>
                  )
                }
              >
                <Paragraph style={{ fontSize: 14, marginBottom: 12 }}>
                  {api.desc}
                </Paragraph>
                <div style={{ marginBottom: 12 }}>
                  <Text code>{api.url}</Text>
                </div>
                
                {testResults[api.url] && (
                  <div style={{ marginBottom: 12 }}>
                    {testResults[api.url].loading ? (
                      <Spin size="small" />
                    ) : testResults[api.url].success ? (
                      <div>
                        <Space>
                          <Tag color="success">状态码: {testResults[api.url].status}</Tag>
                          <Tag color="blue">响应时间: {testResults[api.url].responseTime}ms</Tag>
                        </Space>
                      </div>
                    ) : (
                      <Alert 
                        message={`错误: ${testResults[api.url].error}`} 
                        type="error" 
                        size="small" 
                      />
                    )}
                  </div>
                )}
                
                <Button 
                  size="small"
                  onClick={() => testAPI(api.url, api.name)}
                  loading={testResults[api.url]?.loading}
                >
                  测试接口
                </Button>
              </Card>
            </Col>
          ))}
        </Row>
      </Card>

      {/* 测试结果详情 */}
      {Object.keys(testResults).length > 0 && (
        <Card title="测试结果详情">
          <List
            dataSource={Object.entries(testResults)}
            renderItem={([endpoint, result]) => (
              <List.Item>
                <List.Item.Meta
                  avatar={
                    result.loading ? 
                      <Spin size="small" /> : 
                      getStatusIcon(result.success ? 'healthy' : 'unhealthy')
                  }
                  title={endpoint}
                  description={
                    result.loading ? '测试中...' : 
                    result.success ? 
                      `成功 - 响应时间: ${result.responseTime}ms` : 
                      `失败 - ${result.error}`
                  }
                />
                {result.success && result.data && (
                  <div style={{ marginTop: 8 }}>
                    <details>
                      <summary style={{ cursor: 'pointer', color: '#1890ff' }}>
                        查看响应数据
                      </summary>
                      <pre style={{ 
                        marginTop: 8, 
                        padding: 8, 
                        background: '#f5f5f5', 
                        borderRadius: 4,
                        fontSize: 12,
                        maxHeight: 200,
                        overflow: 'auto'
                      }}>
                        {JSON.stringify(result.data, null, 2)}
                      </pre>
                    </details>
                  </div>
                )}
              </List.Item>
            )}
          />
        </Card>
      )}
    </div>
  );
};

export default TestPage; 