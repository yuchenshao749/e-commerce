import React, { useState, useEffect } from 'react';
import { 
  Card, 
  Typography, 
  Row, 
  Col, 
  Statistic, 
  Badge, 
  Progress,
  Avatar,
  List,
  Divider,
  Space,
  Tag
} from 'antd';
import { 
  UserOutlined, 
  EyeOutlined, 
  ShoppingCartOutlined, 
  DollarOutlined,
  RiseOutlined,
  FallOutlined,
  FireOutlined,
  CrownOutlined
} from '@ant-design/icons';
import axios from 'axios';

const { Title, Text } = Typography;

const MinimalDashboard = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await axios.get('http://localhost:8000/api/analytics/real-time');
        setData(response.data);
        setLoading(false);
      } catch (error) {
        console.error('获取数据失败:', error);
        setLoading(false);
      }
    };

    fetchData();
    // 设置定时刷新，每10秒刷新一次数据
    const interval = setInterval(fetchData, 10000);
    
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '60vh',
        flexDirection: 'column'
      }}>
        <div className="loading-spinner" />
        <Title level={4} style={{ marginTop: 16, color: '#666' }}>
          加载实时数据中...
        </Title>
      </div>
    );
  }

  const StatCard = ({ title, value, icon, color, prefix, suffix, trend }) => (
    <Card
      className="stat-card-modern"
      style={{
        background: '#fff',
        borderRadius: 12,
        border: '1px solid #f0f0f0',
        boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
        overflow: 'hidden',
        position: 'relative'
      }}
      bodyStyle={{ padding: '24px' }}
    >
      <div style={{ position: 'relative', zIndex: 2 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div style={{ flex: 1 }}>
            <Text style={{ color: '#666', fontSize: 14, fontWeight: 500, display: 'block', marginBottom: 8 }}>
              {title}
            </Text>
            <div style={{ 
              fontSize: 28, 
              fontWeight: 'bold', 
              color: color,
              lineHeight: 1.2,
              marginBottom: 8
            }}>
              {prefix}{value}{suffix}
            </div>
            {trend && (
              <div style={{ marginTop: 4 }}>
                <Space size={4}>
                  {trend > 0 ? 
                    <RiseOutlined style={{ color: '#52c41a', fontSize: 12 }} /> : 
                    <FallOutlined style={{ color: '#ff4d4f', fontSize: 12 }} />
                  }
                  <Text style={{ 
                    color: trend > 0 ? '#52c41a' : '#ff4d4f',
                    fontSize: 12
                  }}>
                    {Math.abs(trend)}% 较昨日
                  </Text>
                </Space>
              </div>
            )}
          </div>
          <div style={{
            width: 60,
            height: 60,
            borderRadius: 12,
            background: `linear-gradient(135deg, ${color}15, ${color}25)`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginLeft: 16
          }}>
            <div style={{ 
              color: color, 
              fontSize: 24,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              {icon}
            </div>
          </div>
        </div>
      </div>
    </Card>
  );

  return (
    <div style={{ 
      background: '#f8f9fa',
      minHeight: '100%',
      padding: '24px'
    }}>
      {/* 页面标题 */}
      <div style={{ 
        background: '#fff',
        borderRadius: 12,
        padding: '24px 32px',
        marginBottom: 24,
        boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
        border: '1px solid #f0f0f0'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <Title level={2} style={{ margin: 0, color: '#1a1a1a', fontSize: 24 }}>
              📊 实时电商数据中心
            </Title>
            <Text style={{ color: '#666', fontSize: 14 }}>
              实时监控业务关键指标，洞察商业趋势
            </Text>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ 
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              padding: '4px 12px',
              background: '#f6ffed',
              border: '1px solid #b7eb8f',
              borderRadius: 20,
              fontSize: 12,
              color: '#52c41a',
              fontWeight: 500,
              marginBottom: 4
            }}>
              <div className="real-time-dot" />
              实时更新
            </div>
            <div>
              <Text style={{ color: '#999', fontSize: 12 }}>
                最后更新: {new Date().toLocaleTimeString()}
              </Text>
            </div>
          </div>
        </div>
      </div>

      {/* 核心指标卡片 */}
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={24} sm={12} lg={6}>
          <StatCard
            title="活跃用户"
            value={data?.active_users || 0}
            icon={<UserOutlined />}
            color="#1890ff"
            trend={12.5}
          />
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <StatCard
            title="页面浏览"
            value={data?.page_views || 0}
            icon={<EyeOutlined />}
            color="#52c41a"
            trend={8.2}
          />
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <StatCard
            title="购买订单"
            value={data?.purchases || 0}
            icon={<ShoppingCartOutlined />}
            color="#faad14"
            trend={-2.1}
          />
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <StatCard
            title="总收入"
            value={(data?.revenue || 0).toFixed(2)}
            icon={<DollarOutlined />}
            color="#ff4d4f"
            suffix=" 元"
            trend={15.8}
          />
        </Col>
      </Row>

      {/* 详细数据区域 */}
      <Row gutter={[16, 16]}>
        <Col xs={24} lg={12}>
          <Card
            title={
              <Space>
                <FireOutlined style={{ color: '#ff4d4f' }} />
                <span>🔥 热门商品排行</span>
              </Space>
            }
            style={{
              background: '#fff',
              borderRadius: 12,
              border: '1px solid #f0f0f0',
              boxShadow: '0 2px 8px rgba(0,0,0,0.06)'
            }}
            extra={<Tag color="red">实时</Tag>}
            bodyStyle={{ padding: '16px 24px' }}
          >
            {data?.popular_products?.length > 0 ? (
              <List
                dataSource={data.popular_products.slice(0, 5)}
                renderItem={(product, index) => (
                  <List.Item
                    style={{
                      padding: '12px 0',
                      borderBottom: index < 4 ? '1px solid #f0f0f0' : 'none'
                    }}
                  >
                    <List.Item.Meta
                      avatar={
                        <Avatar
                          style={{ 
                            backgroundColor: index < 3 ? '#ff4d4f' : '#1890ff',
                            fontWeight: 'bold',
                            fontSize: 14
                          }}
                          size={32}
                        >
                          {index + 1}
                        </Avatar>
                      }
                      title={
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <span style={{ fontSize: 14, fontWeight: 500 }}>商品 {product.product_id}</span>
                          {index < 3 && <CrownOutlined style={{ color: '#faad14', fontSize: 16 }} />}
                        </div>
                      }
                      description={
                        <div style={{ marginTop: 4 }}>
                          <Progress 
                            percent={Math.min((product.interactions / Math.max(...data.popular_products.map(p => p.interactions))) * 100, 100)} 
                            size="small"
                            strokeColor={{
                              '0%': '#ff4d4f',
                              '100%': '#ffec3d',
                            }}
                            format={() => `${product.interactions} 次互动`}
                            strokeWidth={6}
                          />
                        </div>
                      }
                    />
                  </List.Item>
                )}
              />
            ) : (
              <div style={{ textAlign: 'center', padding: '40px 0', color: '#999' }}>
                <ShoppingCartOutlined style={{ fontSize: 48, marginBottom: 16, color: '#d9d9d9' }} />
                <div>暂无商品数据</div>
              </div>
            )}
          </Card>
        </Col>

        <Col xs={24} lg={12}>
          <Card
            title={
              <Space>
                <div style={{
                  width: 20,
                  height: 20,
                  borderRadius: 4,
                  background: 'linear-gradient(135deg, #52c41a, #73d13d)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 12
                }}>
                  📂
                </div>
                <span>📈 热门分类趋势</span>
              </Space>
            }
            style={{
              background: '#fff',
              borderRadius: 12,
              border: '1px solid #f0f0f0',
              boxShadow: '0 2px 8px rgba(0,0,0,0.06)'
            }}
            extra={<Tag color="green">实时</Tag>}
            bodyStyle={{ padding: '16px 24px' }}
          >
            {data?.popular_categories?.length > 0 ? (
              <List
                dataSource={data.popular_categories.slice(0, 5)}
                renderItem={(category, index) => (
                  <List.Item
                    style={{
                      padding: '12px 0',
                      borderBottom: index < 4 ? '1px solid #f0f0f0' : 'none'
                    }}
                  >
                    <List.Item.Meta
                      avatar={
                        <Avatar
                          style={{ 
                            backgroundColor: index < 3 ? '#52c41a' : '#722ed1',
                            fontWeight: 'bold',
                            fontSize: 14
                          }}
                          size={32}
                        >
                          {index + 1}
                        </Avatar>
                      }
                      title={
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <span style={{ fontSize: 14, fontWeight: 500 }}>类别 {category.category_id}</span>
                          {index < 3 && <CrownOutlined style={{ color: '#faad14', fontSize: 16 }} />}
                        </div>
                      }
                      description={
                        <div style={{ marginTop: 4 }}>
                          <Progress 
                            percent={Math.min((category.interactions / Math.max(...data.popular_categories.map(c => c.interactions))) * 100, 100)} 
                            size="small"
                            strokeColor={{
                              '0%': '#52c41a',
                              '100%': '#73d13d',
                            }}
                            format={() => `${category.interactions} 次互动`}
                            strokeWidth={6}
                          />
                        </div>
                      }
                    />
                  </List.Item>
                )}
              />
            ) : (
              <div style={{ textAlign: 'center', padding: '40px 0', color: '#999' }}>
                <div style={{ fontSize: 48, marginBottom: 16 }}>📂</div>
                <div>暂无分类数据</div>
              </div>
            )}
          </Card>
        </Col>
      </Row>

      {/* 原始数据区域 - 可折叠 */}
      {data && (
        <Card
          title="🔧 系统数据详情"
          style={{
            marginTop: 24,
            background: '#fff',
            borderRadius: 12,
            border: '1px solid #f0f0f0',
            boxShadow: '0 2px 8px rgba(0,0,0,0.06)'
          }}
          size="small"
        >
          <details>
            <summary style={{ cursor: 'pointer', color: '#1890ff', fontSize: 14, fontWeight: 500 }}>
              点击查看原始JSON数据
            </summary>
            <Divider style={{ margin: '12px 0' }} />
            <pre style={{ 
              fontSize: 12, 
              maxHeight: 300, 
              overflow: 'auto',
              background: '#f8f9fa',
              padding: 16,
              borderRadius: 8,
              border: '1px solid #e9ecef',
              margin: 0
            }}>
              {JSON.stringify(data, null, 2)}
            </pre>
          </details>
        </Card>
      )}
    </div>
  );
};

export default MinimalDashboard; 