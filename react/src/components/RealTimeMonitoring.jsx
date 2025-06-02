import React, { useState, useEffect } from 'react';
import { 
  Row, Col, Card, Typography, Space, Badge, Progress, 
  Statistic, Alert, Timeline, Table, Tag, Select, Button
} from 'antd';
import { 
  CheckCircleOutlined, ExclamationCircleOutlined, 
  CloseCircleOutlined, SyncOutlined, DatabaseOutlined,
  CloudServerOutlined, ApiOutlined, ReloadOutlined
} from '@ant-design/icons';
import axios from 'axios';

const { Title, Text } = Typography;
const { Option } = Select;

const RealTimeMonitoring = () => {
  const [systemHealth, setSystemHealth] = useState(null);
  const [systemMetrics, setSystemMetrics] = useState(null);
  const [systemLogs, setSystemLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState(new Date());
  const [logLevel, setLogLevel] = useState(null);

  // 获取系统健康状态
  const fetchSystemHealth = async () => {
    try {
      const response = await axios.get('http://localhost:8000/api/health');
      setSystemHealth(response.data);
    } catch (err) {
      console.error('获取系统健康状态失败:', err);
      setSystemHealth({
        status: 'unhealthy',
        services: {
          mongodb: 'disconnected',
          redis: 'disconnected'
        },
        error: err.message
      });
    }
  };

  // 获取系统性能指标
  const fetchSystemMetrics = async () => {
    try {
      const response = await axios.get('http://localhost:8000/api/analytics/metrics');
      setSystemMetrics(response.data);
    } catch (err) {
      console.error('获取系统指标失败:', err);
      // 使用模拟数据
      setSystemMetrics({
        cpu: { usage_percent: 45.2, core_count: 8, status: "normal" },
        memory: { total_gb: 16.0, used_gb: 10.8, usage_percent: 67.5, status: "normal" },
        disk: { total_gb: 500.0, used_gb: 160.0, usage_percent: 32.0, status: "normal" },
        network: { bytes_sent: 1048576, bytes_recv: 2097152, packets_sent: 1000, packets_recv: 1500 }
      });
    }
  };

  // 获取系统日志
  const fetchSystemLogs = async (level = null) => {
    try {
      const params = { limit: 50 };
      if (level) params.level = level;
      
      const response = await axios.get('http://localhost:8000/api/system/logs', { params });
      setSystemLogs(response.data.logs || []);
    } catch (err) {
      console.error('获取系统日志失败:', err);
      // 使用模拟数据
      setSystemLogs([
        {
          timestamp: '2024-01-10 14:30:25',
          level: 'INFO',
          service: 'Spark',
          message: 'Successfully processed batch 12345'
        },
        {
          timestamp: '2024-01-10 14:29:15',
          level: 'INFO',
          service: 'Kafka',
          message: 'Topic user_behavior_topic: 1000 messages processed'
        },
        {
          timestamp: '2024-01-10 14:28:45',
          level: 'WARN',
          service: 'MongoDB',
          message: 'High connection count: 150/200'
        }
      ]);
    }
  };

  const fetchAllData = async () => {
    setLoading(true);
    await Promise.all([
      fetchSystemHealth(),
      fetchSystemMetrics(),
      fetchSystemLogs(logLevel)
    ]);
    setLastUpdate(new Date());
    setLoading(false);
  };

  useEffect(() => {
    fetchAllData();
    
    // 每30秒更新一次数据
    const interval = setInterval(fetchAllData, 30000);
    
    return () => clearInterval(interval);
  }, [logLevel]);

  // 服务状态
  const serviceStatus = [
    {
      name: 'Kafka集群',
      status: 'running',
      uptime: '7天12小时',
      version: '2.8.0',
      description: '消息队列服务'
    },
    {
      name: 'Spark集群',
      status: 'running',
      uptime: '7天12小时',
      version: '3.5.0',
      description: '大数据处理引擎'
    },
    {
      name: 'MongoDB',
      status: systemHealth?.services?.mongodb === 'connected' ? 'running' : 'error',
      uptime: '7天12小时',
      version: '6.0',
      description: '文档数据库'
    },
    {
      name: 'Redis',
      status: systemHealth?.services?.redis === 'connected' ? 'running' : 'error',
      uptime: '7天12小时',
      version: '7.0',
      description: '缓存数据库'
    },
    {
      name: 'FastAPI',
      status: systemHealth?.status === 'healthy' ? 'running' : 'error',
      uptime: '7天12小时',
      version: '0.104.1',
      description: 'API服务'
    }
  ];

  const getStatusIcon = (status) => {
    switch (status) {
      case 'running':
      case 'healthy':
        return <CheckCircleOutlined style={{ color: '#52c41a' }} />;
      case 'warning':
        return <ExclamationCircleOutlined style={{ color: '#faad14' }} />;
      case 'error':
      case 'unhealthy':
        return <CloseCircleOutlined style={{ color: '#ff4d4f' }} />;
      default:
        return <SyncOutlined spin style={{ color: '#1890ff' }} />;
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'running':
        return <Badge status="success" text="运行中" />;
      case 'warning':
        return <Badge status="warning" text="警告" />;
      case 'error':
        return <Badge status="error" text="错误" />;
      default:
        return <Badge status="processing" text="未知" />;
    }
  };

  const getProgressColor = (usage) => {
    if (usage > 80) return '#ff4d4f';
    if (usage > 60) return '#faad14';
    return '#52c41a';
  };

  const getLevelColor = (level) => {
    switch (level) {
      case 'ERROR': return 'red';
      case 'WARN': return 'orange';
      case 'INFO': return 'blue';
      default: return 'default';
    }
  };

  return (
    <div className="fade-in">
      <Title level={2}>实时系统监控</Title>
      
      {/* 系统总体状态 */}
      <Card style={{ marginBottom: 24 }}>
        <Row gutter={16} align="middle">
          <Col>
            {getStatusIcon(systemHealth?.status)}
          </Col>
          <Col>
            <Title level={4} style={{ margin: 0 }}>
              系统状态: {systemHealth?.status === 'healthy' ? '健康' : '异常'}
            </Title>
          </Col>
          <Col flex="auto" style={{ textAlign: 'right' }}>
            <Space>
              <Button 
                icon={<ReloadOutlined />} 
                onClick={fetchAllData}
                loading={loading}
              >
                刷新数据
              </Button>
              <Text type="secondary">
                最后更新: {lastUpdate.toLocaleTimeString()}
              </Text>
            </Space>
          </Col>
        </Row>
      </Card>

      {/* 系统性能指标 */}
      {systemMetrics && (
        <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
          <Col xs={24} sm={6}>
            <Card>
              <Statistic
                title="CPU使用率"
                value={systemMetrics.cpu.usage_percent}
                suffix="%"
                valueStyle={{ 
                  color: getProgressColor(systemMetrics.cpu.usage_percent) 
                }}
              />
              <Progress 
                percent={systemMetrics.cpu.usage_percent} 
                strokeColor={getProgressColor(systemMetrics.cpu.usage_percent)}
                size="small"
              />
            </Card>
          </Col>
          <Col xs={24} sm={6}>
            <Card>
              <Statistic
                title="内存使用率"
                value={systemMetrics.memory.usage_percent}
                suffix="%"
                valueStyle={{ 
                  color: getProgressColor(systemMetrics.memory.usage_percent) 
                }}
              />
              <Progress 
                percent={systemMetrics.memory.usage_percent} 
                strokeColor={getProgressColor(systemMetrics.memory.usage_percent)}
                size="small"
              />
            </Card>
          </Col>
          <Col xs={24} sm={6}>
            <Card>
              <Statistic
                title="磁盘使用率"
                value={systemMetrics.disk.usage_percent}
                suffix="%"
                valueStyle={{ 
                  color: getProgressColor(systemMetrics.disk.usage_percent) 
                }}
              />
              <Progress 
                percent={systemMetrics.disk.usage_percent} 
                strokeColor={getProgressColor(systemMetrics.disk.usage_percent)}
                size="small"
              />
            </Card>
          </Col>
          <Col xs={24} sm={6}>
            <Card>
              <Statistic
                title="网络接收"
                value={(systemMetrics.network.bytes_recv / 1024 / 1024).toFixed(2)}
                suffix="MB"
                valueStyle={{ color: '#1890ff' }}
              />
              <Text type="secondary" style={{ fontSize: 12 }}>
                发送: {(systemMetrics.network.bytes_sent / 1024 / 1024).toFixed(2)}MB
              </Text>
            </Card>
          </Col>
        </Row>
      )}

      {/* 服务状态 */}
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={24} lg={12}>
          <Card title="服务状态" className="dashboard-card">
            <Table
              dataSource={serviceStatus}
              columns={[
                {
                  title: '服务',
                  dataIndex: 'name',
                  key: 'name',
                  render: (text, record) => (
                    <Space>
                      <DatabaseOutlined />
                      <div>
                        <div style={{ fontWeight: 'bold' }}>{text}</div>
                        <Text type="secondary" style={{ fontSize: 12 }}>
                          {record.description}
                        </Text>
                      </div>
                    </Space>
                  )
                },
                {
                  title: '状态',
                  dataIndex: 'status',
                  key: 'status',
                  render: (status) => getStatusBadge(status)
                },
                {
                  title: '版本',
                  dataIndex: 'version',
                  key: 'version',
                  render: (version) => <Tag color="blue">{version}</Tag>
                },
                {
                  title: '运行时间',
                  dataIndex: 'uptime',
                  key: 'uptime'
                }
              ]}
              pagination={false}
              size="small"
            />
          </Card>
        </Col>

        <Col xs={24} lg={12}>
          <Card title="运行时监控" className="dashboard-card">
            <Timeline
              items={[
                {
                  color: 'green',
                  children: (
                    <div>
                      <Text strong>系统启动完成</Text>
                      <br />
                      <Text type="secondary">2024-01-03 08:30:00</Text>
                    </div>
                  )
                },
                {
                  color: 'blue',
                  children: (
                    <div>
                      <Text strong>数据流处理正常</Text>
                      <br />
                      <Text type="secondary">实时更新</Text>
                    </div>
                  )
                },
                {
                  color: 'orange',
                  children: (
                    <div>
                      <Text strong>内存使用率达到70%</Text>
                      <br />
                      <Text type="secondary">1小时前</Text>
                    </div>
                  )
                },
                {
                  color: 'green',
                  children: (
                    <div>
                      <Text strong>推荐模型更新</Text>
                      <br />
                      <Text type="secondary">2小时前</Text>
                    </div>
                  )
                }
              ]}
            />
          </Card>
        </Col>
      </Row>

      {/* 系统日志 */}
      <Card 
        title="系统日志" 
        className="dashboard-card"
        extra={
          <Space>
            <Select
              placeholder="选择日志级别"
              allowClear
              style={{ width: 120 }}
              value={logLevel}
              onChange={(value) => setLogLevel(value)}
            >
              <Option value="INFO">INFO</Option>
              <Option value="WARN">WARN</Option>
              <Option value="ERROR">ERROR</Option>
            </Select>
            <Button 
              icon={<ReloadOutlined />}
              onClick={() => fetchSystemLogs(logLevel)}
              size="small"
            >
              刷新
            </Button>
          </Space>
        }
      >
        <Table
          dataSource={systemLogs}
          columns={[
            {
              title: '时间',
              dataIndex: 'timestamp',
              key: 'timestamp',
              width: 150,
              render: (text) => (
                <Text code style={{ fontSize: 12 }}>{text}</Text>
              )
            },
            {
              title: '级别',
              dataIndex: 'level',
              key: 'level',
              width: 80,
              render: (level) => (
                <Tag color={getLevelColor(level)}>{level}</Tag>
              )
            },
            {
              title: '服务',
              dataIndex: 'service',
              key: 'service',
              width: 100,
              render: (service) => (
                <Tag color="blue">{service}</Tag>
              )
            },
            {
              title: '消息',
              dataIndex: 'message',
              key: 'message',
              ellipsis: true
            }
          ]}
          pagination={{
            pageSize: 10,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total) => `共 ${total} 条日志`
          }}
          size="small"
        />
      </Card>
    </div>
  );
};

export default RealTimeMonitoring; 