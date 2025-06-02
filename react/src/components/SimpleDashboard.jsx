import React, { useState, useEffect } from 'react';
import { Row, Col, Card, Statistic, Typography, Space, Alert } from 'antd';
import { 
  UserOutlined, 
  EyeOutlined, 
  ShoppingCartOutlined, 
  DollarOutlined,
  ArrowUpOutlined
} from '@ant-design/icons';
import axios from 'axios';

const { Title } = Typography;

const SimpleDashboard = () => {
  const [realTimeStats, setRealTimeStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // 获取数据的函数
  const fetchData = async () => {
    try {
      setError(null);
      const response = await axios.get('http://localhost:8000/api/analytics/real-time');
      console.log('Dashboard API 响应:', response.data);
      setRealTimeStats(response.data);
      setLoading(false);
    } catch (err) {
      console.error('获取数据失败:', err);
      setError('获取数据失败: ' + err.message);
      setLoading(false);
    }
  };

  useEffect(() => {
    console.log('SimpleDashboard 组件已加载');
    fetchData();
    
    // 每30秒更新一次数据
    const interval = setInterval(fetchData, 30000);
    
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <div style={{ padding: '24px', textAlign: 'center' }}>
        <Title level={3}>正在加载实时数据...</Title>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ padding: '24px' }}>
        <Alert
          message="数据加载失败"
          description={error}
          type="error"
          showIcon
        />
      </div>
    );
  }

  return (
    <div style={{ padding: '24px' }}>
      <Title level={2}>实时电商数据仪表板</Title>
      
      {/* 连接状态 */}
      <div style={{ marginBottom: 16, textAlign: 'right' }}>
        <Space>
          <span style={{ color: '#52c41a' }}>● 实时连接</span>
          <span style={{ color: '#666', fontSize: '0.9rem' }}>
            最后更新: {realTimeStats?.timestamp ? new Date(realTimeStats.timestamp).toLocaleTimeString() : '--'}
          </span>
        </Space>
      </div>

      {/* 关键指标卡片 */}
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="活跃用户"
              value={realTimeStats?.total_active_users || 0}
              precision={0}
              valueStyle={{ color: '#1890ff' }}
              prefix={<UserOutlined />}
              suffix={<ArrowUpOutlined style={{ fontSize: '14px', color: '#52c41a' }} />}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="页面浏览"
              value={realTimeStats?.total_page_views || 0}
              precision={0}
              valueStyle={{ color: '#52c41a' }}
              prefix={<EyeOutlined />}
              suffix={<ArrowUpOutlined style={{ fontSize: '14px', color: '#52c41a' }} />}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="购买数量"
              value={realTimeStats?.total_purchases || 0}
              precision={0}
              valueStyle={{ color: '#faad14' }}
              prefix={<ShoppingCartOutlined />}
              suffix={<ArrowUpOutlined style={{ fontSize: '14px', color: '#52c41a' }} />}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="总收入"
              value={realTimeStats?.total_revenue || 0}
              precision={2}
              valueStyle={{ color: '#ff4d4f' }}
              prefix={<DollarOutlined />}
              suffix="元"
            />
          </Card>
        </Col>
      </Row>

      {/* 详细数据 */}
      <Row gutter={[16, 16]}>
        <Col xs={24} lg={12}>
          <Card title="热门商品" style={{ height: '300px' }}>
            {realTimeStats?.popular_products?.length > 0 ? (
              <div>
                {realTimeStats.popular_products.map((product, index) => (
                  <div key={index} style={{ 
                    display: 'flex', 
                    justifyContent: 'space-between', 
                    padding: '8px 0',
                    borderBottom: index < realTimeStats.popular_products.length - 1 ? '1px solid #f0f0f0' : 'none'
                  }}>
                    <span>商品 {product.product_id}</span>
                    <span style={{ color: '#1890ff', fontWeight: 'bold' }}>
                      {product.interactions} 次互动
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <div style={{ textAlign: 'center', padding: '40px' }}>
                暂无热门商品数据
              </div>
            )}
          </Card>
        </Col>
        
        <Col xs={24} lg={12}>
          <Card title="热门类别" style={{ height: '300px' }}>
            {realTimeStats?.popular_categories?.length > 0 ? (
              <div>
                {realTimeStats.popular_categories.map((category, index) => (
                  <div key={index} style={{ 
                    display: 'flex', 
                    justifyContent: 'space-between', 
                    padding: '8px 0',
                    borderBottom: index < realTimeStats.popular_categories.length - 1 ? '1px solid #f0f0f0' : 'none'
                  }}>
                    <span>类别 {category.category_id}</span>
                    <span style={{ color: '#52c41a', fontWeight: 'bold' }}>
                      {category.interactions} 次互动
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <div style={{ textAlign: 'center', padding: '40px' }}>
                暂无热门类别数据
              </div>
            )}
          </Card>
        </Col>
      </Row>

      {/* 系统指标 */}
      <Card title="系统指标" style={{ marginTop: 24 }}>
        <Row gutter={16}>
          <Col span={8}>
            <Statistic
              title="转化率"
              value={realTimeStats?.conversion_rate || 0}
              precision={2}
              valueStyle={{ color: '#52c41a' }}
              suffix="%"
            />
          </Col>
          <Col span={8}>
            <Statistic
              title="平均会话时长"
              value={realTimeStats?.avg_session_duration || 0}
              precision={0}
              valueStyle={{ color: '#1890ff' }}
              suffix="秒"
            />
          </Col>
          <Col span={8}>
            <div style={{ textAlign: 'center' }}>
              <Title level={5} style={{ margin: 0 }}>系统状态</Title>
              <div style={{ color: '#52c41a', marginTop: 8 }}>
                ✓ 正常运行
              </div>
            </div>
          </Col>
        </Row>
      </Card>

      {/* 调试信息 */}
      <Card title="调试信息" style={{ marginTop: 24 }}>
        <pre style={{ 
          background: '#f5f5f5', 
          padding: '16px', 
          borderRadius: '4px',
          overflow: 'auto',
          maxHeight: '200px'
        }}>
          {JSON.stringify(realTimeStats, null, 2)}
        </pre>
      </Card>
    </div>
  );
};

export default SimpleDashboard; 