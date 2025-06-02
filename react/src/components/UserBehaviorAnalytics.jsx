import React, { useState, useEffect } from 'react';
import { 
  Row, Col, Card, DatePicker, Select, Button, Space, Spin, Alert, 
  Typography, Statistic, Table, Tag
} from 'antd';
import { 
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer 
} from 'recharts';
import { SearchOutlined, DownloadOutlined, FilterOutlined } from '@ant-design/icons';
import axios from 'axios';
import dayjs from 'dayjs';

const { Title } = Typography;
const { RangePicker } = DatePicker;
const { Option } = Select;

const UserBehaviorAnalytics = () => {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const [filters, setFilters] = useState({
    dateRange: [dayjs().subtract(7, 'day'), dayjs()],
    actionType: null
  });

  // 获取用户行为分析数据
  const fetchAnalyticsData = async () => {
    setLoading(true);
    setError(null);

    try {
      const params = {};
      if (filters.dateRange) {
        params.start_date = filters.dateRange[0].toISOString();
        params.end_date = filters.dateRange[1].toISOString();
      }
      if (filters.actionType) {
        params.action_type = filters.actionType;
      }

      const response = await axios.get('http://localhost:8000/api/analytics/user-behavior', {
        params
      });

      setData(response.data);
    } catch (err) {
      console.error('获取用户行为分析数据失败:', err);
      setError('获取数据失败: ' + (err.response?.data?.detail || err.message));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalyticsData();
  }, []);

  // 处理筛选条件变化
  const handleFilterChange = (key, value) => {
    setFilters(prev => ({
      ...prev,
      [key]: value
    }));
  };

  // 应用筛选
  const applyFilters = () => {
    fetchAnalyticsData();
  };

  // 导出数据
  const exportData = () => {
    if (data) {
      const exportData = {
        filters: filters,
        timestamp: new Date().toISOString(),
        data: data
      };
      
      const blob = new Blob([JSON.stringify(exportData, null, 2)], {
        type: 'application/json'
      });
      
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `user_behavior_analytics_${dayjs().format('YYYY-MM-DD')}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }
  };

  // 图表颜色配置
  const colors = ['#1890ff', '#52c41a', '#faad14', '#ff4d4f', '#722ed1', '#fa8c16', '#13c2c2'];

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
      <Title level={2}>用户行为分析</Title>
      
      {/* 筛选器 */}
      <Card style={{ marginBottom: 24 }}>
        <Row gutter={16} align="middle">
          <Col xs={24} sm={8}>
            <Space direction="vertical" style={{ width: '100%' }}>
              <span>日期范围:</span>
              <RangePicker
                style={{ width: '100%' }}
                value={filters.dateRange}
                onChange={(dates) => handleFilterChange('dateRange', dates)}
                allowClear={false}
              />
            </Space>
          </Col>
          <Col xs={24} sm={6}>
            <Space direction="vertical" style={{ width: '100%' }}>
              <span>行为类型:</span>
              <Select
                style={{ width: '100%' }}
                placeholder="选择行为类型"
                allowClear
                value={filters.actionType}
                onChange={(value) => handleFilterChange('actionType', value)}
              >
                <Option value="view">浏览</Option>
                <Option value="click">点击</Option>
                <Option value="add_to_cart">加入购物车</Option>
                <Option value="purchase">购买</Option>
                <Option value="search">搜索</Option>
                <Option value="rate">评分</Option>
              </Select>
            </Space>
          </Col>
          <Col xs={24} sm={10}>
            <Space style={{ marginTop: 24 }}>
              <Button
                type="primary"
                icon={<SearchOutlined />}
                onClick={applyFilters}
                loading={loading}
              >
                查询
              </Button>
              <Button
                icon={<DownloadOutlined />}
                onClick={exportData}
                disabled={!data}
              >
                导出数据
              </Button>
            </Space>
          </Col>
        </Row>
      </Card>

      {loading ? (
        <div className="loading-container">
          <Spin size="large" />
          <div style={{ marginTop: 16 }}>正在分析用户行为数据...</div>
        </div>
      ) : data ? (
        <>
          {/* 概览统计 */}
          <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
            <Col xs={24} sm={8}>
              <Card>
                <Statistic
                  title="总行为数"
                  value={data.action_statistics?.reduce((sum, item) => sum + item.count, 0) || 0}
                  valueStyle={{ color: '#1890ff' }}
                />
              </Card>
            </Col>
            <Col xs={24} sm={8}>
              <Card>
                <Statistic
                  title="设备类型数"
                  value={data.device_statistics?.length || 0}
                  valueStyle={{ color: '#52c41a' }}
                />
              </Card>
            </Col>
            <Col xs={24} sm={8}>
              <Card>
                <Statistic
                  title="活跃时段数"
                  value={data.hourly_statistics?.filter(item => item.count > 0).length || 0}
                  valueStyle={{ color: '#faad14' }}
                />
              </Card>
            </Col>
          </Row>

          {/* 行为类型分布图 */}
          <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
            <Col xs={24} lg={12}>
              <Card title="行为类型分布" className="dashboard-card">
                {data.action_statistics && data.action_statistics.length > 0 ? (
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={data.action_statistics}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="action_type" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Bar dataKey="count" fill="#1890ff" />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div style={{ textAlign: 'center', padding: '50px 0' }}>
                    暂无行为类型数据
                  </div>
                )}
              </Card>
            </Col>
            
            <Col xs={24} lg={12}>
              <Card title="设备类型分布" className="dashboard-card">
                {data.device_statistics && data.device_statistics.length > 0 ? (
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={data.device_statistics}
                        cx="50%"
                        cy="50%"
                        outerRadius={100}
                        fill="#8884d8"
                        dataKey="count"
                        nameKey="device_type"
                        label={({ device_type, percent }) => `${device_type} ${(percent * 100).toFixed(0)}%`}
                      >
                        {data.device_statistics.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <div style={{ textAlign: 'center', padding: '50px 0' }}>
                    暂无设备类型数据
                  </div>
                )}
              </Card>
            </Col>
          </Row>

          {/* 时间分布和地理分布 */}
          <Row gutter={[16, 16]}>
            <Col xs={24} lg={12}>
              <Card title="小时分布" className="dashboard-card">
                {data.hourly_statistics && data.hourly_statistics.length > 0 ? (
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={data.hourly_statistics}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis 
                        dataKey="hour" 
                        label={{ value: '小时', position: 'insideBottom', offset: -5 }}
                      />
                      <YAxis label={{ value: '活动数量', angle: -90, position: 'insideLeft' }} />
                      <Tooltip 
                        labelFormatter={(value) => `${value}:00`}
                        formatter={(value) => [value, '活动数量']}
                      />
                      <Legend />
                      <Line 
                        type="monotone" 
                        dataKey="count" 
                        stroke="#52c41a" 
                        strokeWidth={2}
                        dot={{ r: 4 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                ) : (
                  <div style={{ textAlign: 'center', padding: '50px 0' }}>
                    暂无时间分布数据
                  </div>
                )}
              </Card>
            </Col>
            
            <Col xs={24} lg={12}>
              <Card title="地理位置分布" className="dashboard-card">
                {data.location_statistics && data.location_statistics.length > 0 ? (
                  <Table
                    dataSource={data.location_statistics}
                    rowKey={(record, index) => `location-${record.location}-${index}`}
                    columns={[
                      {
                        title: '位置',
                        dataIndex: 'location',
                        key: 'location',
                        render: (text) => <Tag color="blue">{text}</Tag>
                      },
                      {
                        title: '用户数量',
                        dataIndex: 'count',
                        key: 'count',
                        render: (text) => <span style={{ fontWeight: 'bold' }}>{text}</span>
                      },
                      {
                        title: '占比',
                        key: 'percentage',
                        render: (_, record) => {
                          const total = data.location_statistics.reduce((sum, item) => sum + item.count, 0);
                          const percentage = ((record.count / total) * 100).toFixed(1);
                          return <Tag color="green">{percentage}%</Tag>;
                        }
                      }
                    ]}
                    pagination={false}
                    size="small"
                  />
                ) : (
                  <div style={{ textAlign: 'center', padding: '50px 0' }}>
                    暂无地理位置数据
                  </div>
                )}
              </Card>
            </Col>
          </Row>

          {/* 查询信息 */}
          {data.query_info && (
            <Card title="查询信息" style={{ marginTop: 24 }}>
              <Row gutter={16}>
                <Col span={6}>
                  <Statistic
                    title="查询记录总数"
                    value={data.query_info.total_records || 0}
                    valueStyle={{ color: '#1890ff' }}
                  />
                </Col>
                <Col span={6}>
                  <Statistic
                    title="开始日期"
                    value={data.query_info.start_date ? dayjs(data.query_info.start_date).format('YYYY-MM-DD') : '全部'}
                    valueStyle={{ color: '#52c41a' }}
                  />
                </Col>
                <Col span={6}>
                  <Statistic
                    title="结束日期"
                    value={data.query_info.end_date ? dayjs(data.query_info.end_date).format('YYYY-MM-DD') : '全部'}
                    valueStyle={{ color: '#52c41a' }}
                  />
                </Col>
                <Col span={6}>
                  <Statistic
                    title="行为类型"
                    value={data.query_info.action_type || '全部'}
                    valueStyle={{ color: '#faad14' }}
                  />
                </Col>
              </Row>
            </Card>
          )}
        </>
      ) : (
        <div className="loading-container">
          <div style={{ textAlign: 'center', padding: '50px 0' }}>
            <Title level={4}>暂无数据</Title>
            <div>请先启动数据生成器和流处理器，或调整筛选条件</div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserBehaviorAnalytics; 