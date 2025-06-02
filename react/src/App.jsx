import React from 'react';
import { BrowserRouter as Router, Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import { Layout, Menu, theme, Typography } from 'antd';
import {
  DashboardOutlined,
  BarChartOutlined,
  UserOutlined,
  ShoppingCartOutlined,
  SettingOutlined,
  BugOutlined
} from '@ant-design/icons';

import MinimalDashboard from './components/MinimalDashboard';
import UserBehaviorAnalytics from './components/UserBehaviorAnalytics';
import RecommendationSystem from './components/RecommendationSystem';
import RealTimeMonitoring from './components/RealTimeMonitoring';
import TestPage from './components/TestPage';

import './App.css';

const { Header, Sider, Content } = Layout;
const { Title } = Typography;

const menuItems = [
  {
    key: '/',
    icon: <DashboardOutlined />,
    label: '实时仪表板',
  },
  {
    key: '/analytics',
    icon: <BarChartOutlined />,
    label: '用户行为分析',
  },
  {
    key: '/recommendations',
    icon: <ShoppingCartOutlined />,
    label: '推荐系统',
  },
  {
    key: '/monitoring',
    icon: <UserOutlined />,
    label: '实时监控',
  },
  {
    key: '/test',
    icon: <BugOutlined />,
    label: '测试页面',
  }
];

function AppContent() {
  const navigate = useNavigate();
  const location = useLocation();
  const {
    token: { colorBgContainer, borderRadiusLG },
  } = theme.useToken();

  const handleMenuClick = (e) => {
    navigate(e.key);
  };

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Sider 
        width={250}
        style={{
          background: colorBgContainer,
          borderRight: '1px solid #f0f0f0'
        }}
      >
        <div style={{ 
          padding: '16px', 
          borderBottom: '1px solid #f0f0f0',
          textAlign: 'center'
        }}>
          <Title level={4} style={{ margin: 0, color: '#1890ff' }}>
            电商数据分析平台
          </Title>
        </div>
        <Menu
          mode="inline"
          selectedKeys={[location.pathname]}
          items={menuItems}
          onClick={handleMenuClick}
          style={{ 
            height: 'calc(100% - 64px)',
            borderRight: 0 
          }}
        />
      </Sider>
      
      <Layout>
        <Header
          style={{
            padding: '0 24px',
            background: colorBgContainer,
            borderBottom: '1px solid #f0f0f0',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}
        >
          <Title level={3} style={{ margin: 0 }}>
            实时电商数据处理与推荐系统
          </Title>
          <div style={{ color: '#666' }}>
            基于 Spark + Kafka + MongoDB + React
          </div>
        </Header>
        
        <Content
          style={{
            margin: '24px',
            padding: 24,
            minHeight: 280,
            background: colorBgContainer,
            borderRadius: borderRadiusLG,
          }}
        >
          <Routes>
            <Route path="/" element={<MinimalDashboard />} />
            <Route path="/analytics" element={<UserBehaviorAnalytics />} />
            <Route path="/recommendations" element={<RecommendationSystem />} />
            <Route path="/monitoring" element={<RealTimeMonitoring />} />
            <Route path="/test" element={<TestPage />} />
          </Routes>
        </Content>
      </Layout>
    </Layout>
  );
}

function App() {
  return (
    <Router>
      <AppContent />
    </Router>
  );
}

export default App;
