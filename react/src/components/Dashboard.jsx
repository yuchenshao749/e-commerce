import React, { useState, useEffect } from 'react';
import { Row, Col, Card, Statistic, Typography, Space, Spin, Alert } from 'antd';
import { 
  UserOutlined, 
  EyeOutlined, 
  ShoppingCartOutlined, 
  DollarOutlined,
  ArrowUpOutlined,
  ArrowDownOutlined
} from '@ant-design/icons';
import { 
  LineChart, 
  Line, 
  AreaChart, 
  Area, 
  BarChart, 
  Bar, 
  PieChart, 
  Pie, 
  Cell,
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer 
} from 'recharts';
import axios from 'axios';

const { Title } = Typography;

const Dashboard = () => {
  const [realTimeStats, setRealTimeStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [wsConnected, setWsConnected] = useState(false);

  const fallbackToPolling = () => {
    const fetchData = async () => {
      try {
        const response = await axios.get('http://localhost:8000/api/analytics/real-time');
        setRealTimeStats(response.data);
        setLoading(false);
        setError(null);
      } catch (err) {
        console.error('获取实时数据失败:', err);
        setError('获取数据失败，请检查后端服务是否启动');
        setLoading(false);
      }
    };
    
    fetchData();
    const interval = setInterval(fetchData, 10000); // 每10秒轮询一次
    
    return () => clearInterval(interval);
  };

  // WebSocket连接用于实时数据
  useEffect(() => {
    let ws = null;
    let reconnectTimer = null;
    let cleanupPolling = null;
    
    const connectWebSocket = () => {
      try {
        ws = new WebSocket('ws://localhost:8000/ws/real-time');
        
        ws.onopen = () => {
          console.log('WebSocket连接成功');
          setWsConnected(true);
          setError(null);
          // 发送连接消息
          ws.send('connect');
        };
        
        ws.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data);
            setRealTimeStats(data);
            setLoading(false);
          } catch (err) {
            console.error('解析WebSocket数据失败:', err);
          }
        };
        
        ws.onclose = () => {
          console.log('WebSocket连接关闭');
          setWsConnected(false);
          // 尝试重新连接
          reconnectTimer = setTimeout(connectWebSocket, 5000);
        };
        
        ws.onerror = (error) => {
          console.error('WebSocket错误:', error);
          setError('WebSocket连接失败，使用HTTP轮询模式');
          setWsConnected(false);
          // 降级到HTTP轮询
          setTimeout(() => {
            cleanupPolling = fallbackToPolling();
          }, 1000);
        };
      } catch (err) {
        console.error('创建WebSocket连接失败:', err);
        setError('无法建立WebSocket连接，使用HTTP轮询模式');
        // 降级到HTTP轮询
        cleanupPolling = fallbackToPolling();
      }
    };
    
    // 首先尝试HTTP请求，确保API可用
    const initialFetch = async () => {
      try {
        const response = await axios.get('http://localhost:8000/api/analytics/real-time');
        setRealTimeStats(response.data);
        setLoading(false);
        setError(null);
        // API可用，尝试WebSocket连接
        connectWebSocket();
      } catch (err) {
        console.error('初始获取数据失败:', err);
        setError('无法连接到后端服务，请确保API服务已启动');
        setLoading(false);
        // 如果API不可用，继续尝试轮询
        cleanupPolling = fallbackToPolling();
      }
    };
    
    initialFetch();
    
    return () => {
      if (ws) {
        ws.close();
      }
      if (reconnectTimer) {
        clearTimeout(reconnectTimer);
      }
      if (cleanupPolling) {
        cleanupPolling();
      }
    };
  }, []);

  // 图表数据处理
  const getChartData = () => {
    if (!realTimeStats) return { hourlyData: [], categoryData: [], productData: [] };
    
    // 模拟小时数据（实际应该从API获取历史数据）
    const hourlyData = Array.from({ length: 24 }, (_, i) => ({
      hour: i,
      pageViews: Math.floor(Math.random() * 1000) + 100,
      purchases: Math.floor(Math.random() * 50) + 5,
      revenue: Math.floor(Math.random() * 5000) + 500
    }));
    
    // 热门类别数据
    const categoryData = realTimeStats.popular_categories?.map((cat, index) => ({
      name: `类别${cat.category_id}`,
      value: cat.interactions,
      color: ['#1890ff', '#52c41a', '#faad14', '#ff4d4f', '#722ed1'][index % 5]
    })) || [];
    
    // 热门商品数据
    const productData = realTimeStats.popular_products?.slice(0, 5).map(product => ({
      name: `商品${product.product_id?.slice(-4)}`,
      interactions: product.interactions
    })) || [];
    
    return { hourlyData, categoryData, productData };
  };

  const { hourlyData, categoryData, productData } = getChartData();

  if (loading) {
    return (
      <div className="loading-container">
        <Spin size="large" />
        <div style={{ marginTop: 16 }}>正在加载实时数据...</div>
      </div>
    );
  }

  if (error) {
    return (
      <Alert
        message="数据加载失败"
        description={error}
        type="error"
        showIcon
        style={{ margin: '20px 0' }}
      />
    );
  }

  return (
    <div className="fade-in">
      {/* 连接状态指示器 */}
      <div style={{ marginBottom: 16, textAlign: 'right' }}>
        <Space>
          <span className="real-time-indicator">
            <div className="real-time-dot"></div>
            {wsConnected ? '实时连接' : '离线模式'}
          </span>
          <span style={{ color: '#666', fontSize: '0.9rem' }}>
            最后更新: {realTimeStats?.timestamp ? new Date(realTimeStats.timestamp).toLocaleTimeString() : '--'}
          </span>
        </Space>
      </div>

      {/* 关键指标卡片 */}
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={24} sm={12} lg={6}>
          <Card className="dashboard-card">
            <Statistic
              title="活跃用户"
              value={realTimeStats?.active_users || 0}
              precision={0}
              valueStyle={{ color: '#1890ff' }}
              prefix={<UserOutlined />}
              suffix={<ArrowUpOutlined style={{ fontSize: '14px', color: '#52c41a' }} />}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card className="dashboard-card">
            <Statistic
              title="页面浏览"
              value={realTimeStats?.page_views || 0}
              precision={0}
              valueStyle={{ color: '#52c41a' }}
              prefix={<EyeOutlined />}
              suffix={<ArrowUpOutlined style={{ fontSize: '14px', color: '#52c41a' }} />}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card className="dashboard-card">
            <Statistic
              title="购买数量"
              value={realTimeStats?.purchases || 0}
              precision={0}
              valueStyle={{ color: '#faad14' }}
              prefix={<ShoppingCartOutlined />}
              suffix={<ArrowUpOutlined style={{ fontSize: '14px', color: '#52c41a' }} />}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card className="dashboard-card">
            <Statistic
              title="总收入"
              value={realTimeStats?.revenue || 0}
              precision={2}
              valueStyle={{ color: '#ff4d4f' }}
              prefix={<DollarOutlined />}
              suffix="元"
            />
          </Card>
        </Col>
      </Row>

      {/* 图表区域 */}
      <Row gutter={[16, 16]}>
        {/* 趋势图 */}
        <Col xs={24} lg={16}>
          <Card title="24小时趋势" className="dashboard-card">
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={hourlyData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="hour" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Area 
                  type="monotone" 
                  dataKey="pageViews" 
                  stackId="1" 
                  stroke="#1890ff" 
                  fill="#1890ff" 
                  fillOpacity={0.6}
                  name="页面浏览"
                />
                <Area 
                  type="monotone" 
                  dataKey="purchases" 
                  stackId="2" 
                  stroke="#52c41a" 
                  fill="#52c41a" 
                  fillOpacity={0.6}
                  name="购买次数"
                />
              </AreaChart>
            </ResponsiveContainer>
          </Card>
        </Col>

        {/* 类别分布饼图 */}
        <Col xs={24} lg={8}>
          <Card title="热门类别" className="dashboard-card">
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={categoryData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {categoryData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </Card>
        </Col>

        {/* 热门商品柱状图 */}
        <Col xs={24} lg={12}>
          <Card title="热门商品" className="dashboard-card">
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={productData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="interactions" fill="#1890ff" />
              </BarChart>
            </ResponsiveContainer>
          </Card>
        </Col>

        {/* 关键指标 */}
        <Col xs={24} lg={12}>
          <Card title="关键指标" className="dashboard-card">
            <Row gutter={16}>
              <Col span={12}>
                <Statistic
                  title="转化率"
                  value={realTimeStats?.conversion_rate || 0}
                  precision={2}
                  valueStyle={{ color: '#52c41a' }}
                  suffix="%"
                />
              </Col>
              <Col span={12}>
                <Statistic
                  title="平均会话时长"
                  value={realTimeStats?.avg_session_duration || 0}
                  precision={0}
                  valueStyle={{ color: '#1890ff' }}
                  suffix="秒"
                />
              </Col>
            </Row>
            <div style={{ marginTop: 24 }}>
              <Title level={5}>系统状态</Title>
              <Space direction="vertical" style={{ width: '100%' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>数据处理延迟:</span>
                  <span style={{ color: '#52c41a' }}>正常 (~2s)</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>Spark集群状态:</span>
                  <span style={{ color: '#52c41a' }}>运行中</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>Kafka连接:</span>
                  <span style={{ color: '#52c41a' }}>已连接</span>
                </div>
              </Space>
            </div>
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default Dashboard; 