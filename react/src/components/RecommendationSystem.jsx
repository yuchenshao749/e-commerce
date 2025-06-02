import React, { useState, useEffect } from 'react';
import { 
  Row, Col, Card, Input, Button, Space, Spin, Alert, Typography, 
  List, Tag, Rate, Progress, Statistic, Tabs, Select, Badge
} from 'antd';
import { 
  SearchOutlined, UserOutlined, ShoppingOutlined, 
  RobotOutlined, ThunderboltOutlined, ReloadOutlined
} from '@ant-design/icons';
import axios from 'axios';

const { Title, Text, Paragraph } = Typography;
const { Search } = Input;
const { TabPane } = Tabs;
const { Option } = Select;

const RecommendationSystem = () => {
  const [loading, setLoading] = useState(false);
  const [trainLoading, setTrainLoading] = useState(false);
  const [userId, setUserId] = useState('user_12345678');
  const [recommendations, setRecommendations] = useState([]);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('recommendations');

  // 获取用户推荐
  const fetchRecommendations = async (searchUserId = userId) => {
    if (!searchUserId.trim()) {
      setError('请输入用户ID');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await axios.get(`http://localhost:8000/api/recommendations/${searchUserId}`, {
        params: { limit: 10 }
      });

      setRecommendations(response.data.recommendations || []);
    } catch (err) {
      console.error('获取推荐失败:', err);
      setError('获取推荐失败: ' + (err.response?.data?.detail || err.message));
    } finally {
      setLoading(false);
    }
  };

  // 训练推荐模型
  const trainModel = async () => {
    setTrainLoading(true);
    try {
      const response = await axios.post('http://localhost:8000/api/recommendations/train');
      // 训练启动成功，可以显示一些提示
      setError(null);
      // 可以添加成功提示
    } catch (err) {
      console.error('模型训练失败:', err);
      setError('模型训练失败: ' + (err.response?.data?.detail || err.message));
    } finally {
      setTrainLoading(false);
    }
  };

  useEffect(() => {
    fetchRecommendations();
  }, []);

  // 算法信息
  const algorithmInfo = [
    {
      name: '协同过滤',
      description: '基于用户行为相似性的推荐算法',
      accuracy: 85,
      coverage: 78,
      status: 'active'
    },
    {
      name: '基于内容',
      description: '根据商品特征和用户偏好推荐',
      accuracy: 72,
      coverage: 92,
      status: 'active'
    },
    {
      name: '热门推荐',
      description: '基于商品流行度的推荐算法',
      accuracy: 68,
      coverage: 95,
      status: 'active'
    }
  ];

  // 推荐指标
  const metrics = {
    totalUsers: 10000,
    recommendedToday: 8750,
    avgResponseTime: 120,
    modelAccuracy: 82.5
  };

  return (
    <div className="fade-in">
      <Title level={2}>智能推荐系统</Title>
      
      <Tabs activeKey={activeTab} onChange={setActiveTab}>
        {/* 用户推荐 */}
        <TabPane tab="用户推荐" key="recommendations">
          {/* 搜索用户 */}
          <Card style={{ marginBottom: 24 }}>
            <Row gutter={16} align="middle">
              <Col xs={24} sm={12}>
                <Search
                  placeholder="输入用户ID查看推荐"
                  enterButton={<SearchOutlined />}
                  size="large"
                  value={userId}
                  onChange={(e) => setUserId(e.target.value)}
                  onSearch={fetchRecommendations}
                  loading={loading}
                />
              </Col>
              <Col xs={24} sm={12}>
                <Space style={{ marginTop: { xs: 16, sm: 0 } }}>
                  <Button 
                    icon={<ReloadOutlined />} 
                    onClick={() => fetchRecommendations()}
                    loading={loading}
                  >
                    刷新推荐
                  </Button>
                  <Button 
                    type="primary" 
                    icon={<ThunderboltOutlined />}
                    onClick={trainModel}
                    loading={trainLoading}
                  >
                    训练模型
                  </Button>
                </Space>
              </Col>
            </Row>
          </Card>

          {error && (
            <Alert
              message="获取推荐失败"
              description={error}
              type="error"
              showIcon
              style={{ marginBottom: 24 }}
            />
          )}

          {/* 推荐结果 */}
          {loading ? (
            <div className="loading-container">
              <Spin size="large" />
              <div style={{ marginTop: 16 }}>正在生成个性化推荐...</div>
            </div>
          ) : recommendations.length > 0 ? (
            <Card title={`为用户 ${userId} 的推荐结果`} className="dashboard-card">
              <List
                grid={{ 
                  gutter: 16, 
                  xs: 1, 
                  sm: 2, 
                  md: 3, 
                  lg: 3, 
                  xl: 4, 
                  xxl: 4 
                }}
                dataSource={recommendations}
                renderItem={(item, index) => (
                  <List.Item>
                    <Card
                      className="recommendation-card"
                      size="small"
                      hoverable
                      actions={[
                        <Button type="link" size="small">
                          查看详情
                        </Button>
                      ]}
                    >
                      <Card.Meta
                        avatar={
                          <div style={{ 
                            width: 40, 
                            height: 40, 
                            backgroundColor: '#f0f0f0',
                            borderRadius: '50%',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                          }}>
                            <ShoppingOutlined style={{ fontSize: 18, color: '#999' }} />
                          </div>
                        }
                        title={
                          <Space>
                            <Text strong>商品 {item.product_id?.slice(-8)}</Text>
                            <span className="recommendation-score">
                              {(item.score * 100).toFixed(1)}%
                            </span>
                          </Space>
                        }
                        description={
                          <div>
                            <Paragraph 
                              ellipsis={{ rows: 2 }} 
                              style={{ margin: '8px 0', fontSize: '0.9rem' }}
                            >
                              {item.reason}
                            </Paragraph>
                            <div style={{ marginTop: 8 }}>
                              <Tag color={
                                item.algorithm === 'collaborative_filtering' ? 'blue' :
                                item.algorithm === 'content_based' ? 'green' : 'orange'
                              }>
                                {item.algorithm === 'collaborative_filtering' ? '协同过滤' :
                                 item.algorithm === 'content_based' ? '基于内容' : '热门推荐'}
                              </Tag>
                            </div>
                          </div>
                        }
                      />
                    </Card>
                  </List.Item>
                )}
              />
            </Card>
          ) : (
            <div className="empty-container">
              <Title level={4}>暂无推荐</Title>
              <p>请输入用户ID获取推荐结果</p>
            </div>
          )}
        </TabPane>

        {/* 算法信息 */}
        <TabPane tab="算法信息" key="algorithms">
          <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
            <Col xs={24} sm={8}>
              <Card>
                <Statistic
                  title="总用户数"
                  value={metrics.totalUsers}
                  valueStyle={{ color: '#1890ff' }}
                  prefix={<UserOutlined />}
                />
              </Card>
            </Col>
            <Col xs={24} sm={8}>
              <Card>
                <Statistic
                  title="今日推荐数"
                  value={metrics.recommendedToday}
                  valueStyle={{ color: '#52c41a' }}
                  prefix={<RobotOutlined />}
                />
              </Card>
            </Col>
            <Col xs={24} sm={8}>
              <Card>
                <Statistic
                  title="平均响应时间"
                  value={metrics.avgResponseTime}
                  suffix="ms"
                  valueStyle={{ color: '#faad14' }}
                  prefix={<ThunderboltOutlined />}
                />
              </Card>
            </Col>
          </Row>

          <Row gutter={[16, 16]}>
            {algorithmInfo.map((algorithm, index) => (
              <Col xs={24} lg={8} key={algorithm.name}>
                <Card
                  title={
                    <Space>
                      <RobotOutlined style={{ color: '#1890ff' }} />
                      {algorithm.name}
                    </Space>
                  }
                  extra={
                    <Badge 
                      status={algorithm.status === 'active' ? 'success' : 'default'} 
                      text={algorithm.status === 'active' ? '运行中' : '停用'} 
                    />
                  }
                  className="dashboard-card"
                >
                  <Paragraph style={{ marginBottom: 16 }}>
                    {algorithm.description}
                  </Paragraph>
                  
                  <div style={{ marginBottom: 12 }}>
                    <Text strong>准确率</Text>
                    <Progress 
                      percent={algorithm.accuracy} 
                      size="small" 
                      strokeColor="#52c41a"
                      format={percent => `${percent}%`}
                    />
                  </div>
                  
                  <div>
                    <Text strong>覆盖率</Text>
                    <Progress 
                      percent={algorithm.coverage} 
                      size="small" 
                      strokeColor="#1890ff"
                      format={percent => `${percent}%`}
                    />
                  </div>
                </Card>
              </Col>
            ))}
          </Row>
          
          <Card title="模型性能指标" style={{ marginTop: 24 }}>
            <Row gutter={16}>
              <Col span={6}>
                <Statistic
                  title="模型准确率"
                  value={metrics.modelAccuracy}
                  suffix="%"
                  precision={1}
                  valueStyle={{ color: '#52c41a' }}
                />
              </Col>
              <Col span={6}>
                <Statistic
                  title="训练数据量"
                  value="10K"
                  valueStyle={{ color: '#1890ff' }}
                />
              </Col>
              <Col span={6}>
                <Statistic
                  title="模型版本"
                  value="v2.1.0"
                  valueStyle={{ color: '#722ed1' }}
                />
              </Col>
              <Col span={6}>
                <Statistic
                  title="上次训练"
                  value="2小时前"
                  valueStyle={{ color: '#faad14' }}
                />
              </Col>
            </Row>
          </Card>
        </TabPane>

        {/* 系统监控 */}
        <TabPane tab="系统监控" key="monitoring">
          <Alert
            message="实时监控"
            description="推荐系统运行状态和性能指标实时监控"
            type="info"
            showIcon
            style={{ marginBottom: 24 }}
          />
          
          <Row gutter={[16, 16]}>
            <Col xs={24} lg={12}>
              <Card title="系统状态" className="dashboard-card">
                <List
                  dataSource={[
                    { service: '推荐引擎', status: 'running', uptime: '7天12小时' },
                    { service: '协同过滤模型', status: 'running', uptime: '7天12小时' },
                    { service: '内容推荐模型', status: 'running', uptime: '7天12小时' },
                    { service: '热门推荐服务', status: 'running', uptime: '7天12小时' }
                  ]}
                  renderItem={item => (
                    <List.Item>
                      <List.Item.Meta
                        avatar={
                          <Badge 
                            status={item.status === 'running' ? 'success' : 'error'} 
                          />
                        }
                        title={item.service}
                        description={`运行时间: ${item.uptime}`}
                      />
                    </List.Item>
                  )}
                />
              </Card>
            </Col>
            
            <Col xs={24} lg={12}>
              <Card title="性能指标" className="dashboard-card">
                <div style={{ marginBottom: 16 }}>
                  <Text strong>CPU使用率</Text>
                  <Progress percent={45} size="small" strokeColor="#52c41a" />
                </div>
                <div style={{ marginBottom: 16 }}>
                  <Text strong>内存使用率</Text>
                  <Progress percent={68} size="small" strokeColor="#1890ff" />
                </div>
                <div style={{ marginBottom: 16 }}>
                  <Text strong>缓存命中率</Text>
                  <Progress percent={89} size="small" strokeColor="#722ed1" />
                </div>
                <div>
                  <Text strong>推荐成功率</Text>
                  <Progress percent={92} size="small" strokeColor="#faad14" />
                </div>
              </Card>
            </Col>
          </Row>
        </TabPane>
      </Tabs>
    </div>
  );
};

export default RecommendationSystem; 