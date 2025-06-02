import React, { useState, useEffect } from 'react';
import axios from 'axios';

const BasicDashboard = () => {
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
    // 每30秒更新一次
    const interval = setInterval(fetchData, 30000);
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return <div style={{ padding: 20 }}>加载中...</div>;
  }

  return (
    <div style={{ 
      padding: 20, 
      fontFamily: 'Arial, sans-serif',
      backgroundColor: '#f5f5f5',
      minHeight: '100vh'
    }}>
      <h1 style={{ color: '#333', marginBottom: 30 }}>电商数据仪表板</h1>
      
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(4, 1fr)', 
        gap: 20,
        marginBottom: 30
      }}>
        <div style={{ 
          backgroundColor: 'white', 
          padding: 20, 
          borderRadius: 8,
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
          textAlign: 'center'
        }}>
          <h3 style={{ color: '#1890ff', margin: 0 }}>活跃用户</h3>
          <div style={{ fontSize: 32, fontWeight: 'bold', margin: '10px 0' }}>
            {data?.total_active_users || 0}
          </div>
        </div>
        
        <div style={{ 
          backgroundColor: 'white', 
          padding: 20, 
          borderRadius: 8,
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
          textAlign: 'center'
        }}>
          <h3 style={{ color: '#52c41a', margin: 0 }}>页面浏览</h3>
          <div style={{ fontSize: 32, fontWeight: 'bold', margin: '10px 0' }}>
            {data?.total_page_views || 0}
          </div>
        </div>
        
        <div style={{ 
          backgroundColor: 'white', 
          padding: 20, 
          borderRadius: 8,
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
          textAlign: 'center'
        }}>
          <h3 style={{ color: '#faad14', margin: 0 }}>购买数量</h3>
          <div style={{ fontSize: 32, fontWeight: 'bold', margin: '10px 0' }}>
            {data?.total_purchases || 0}
          </div>
        </div>
        
        <div style={{ 
          backgroundColor: 'white', 
          padding: 20, 
          borderRadius: 8,
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
          textAlign: 'center'
        }}>
          <h3 style={{ color: '#ff4d4f', margin: 0 }}>总收入</h3>
          <div style={{ fontSize: 32, fontWeight: 'bold', margin: '10px 0' }}>
            ¥{data?.total_revenue?.toFixed(2) || 0}
          </div>
        </div>
      </div>

      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: '1fr 1fr', 
        gap: 20,
        marginBottom: 30
      }}>
        <div style={{ 
          backgroundColor: 'white', 
          padding: 20, 
          borderRadius: 8,
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
        }}>
          <h3 style={{ marginTop: 0 }}>热门商品</h3>
          {data?.popular_products?.map((product, index) => (
            <div key={index} style={{ 
              padding: '10px 0', 
              borderBottom: '1px solid #eee',
              display: 'flex',
              justifyContent: 'space-between'
            }}>
              <span>商品 {product.product_id}</span>
              <span style={{ color: '#1890ff', fontWeight: 'bold' }}>
                {product.interactions} 次互动
              </span>
            </div>
          )) || <div>暂无数据</div>}
        </div>
        
        <div style={{ 
          backgroundColor: 'white', 
          padding: 20, 
          borderRadius: 8,
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
        }}>
          <h3 style={{ marginTop: 0 }}>热门类别</h3>
          {data?.popular_categories?.map((category, index) => (
            <div key={index} style={{ 
              padding: '10px 0', 
              borderBottom: '1px solid #eee',
              display: 'flex',
              justifyContent: 'space-between'
            }}>
              <span>类别 {category.category_id}</span>
              <span style={{ color: '#52c41a', fontWeight: 'bold' }}>
                {category.interactions} 次互动
              </span>
            </div>
          )) || <div>暂无数据</div>}
        </div>
      </div>

      <div style={{ 
        backgroundColor: 'white', 
        padding: 20, 
        borderRadius: 8,
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
      }}>
        <h3 style={{ marginTop: 0 }}>其他指标</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 20 }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 24, fontWeight: 'bold', color: '#52c41a' }}>
              {data?.conversion_rate?.toFixed(2) || 0}%
            </div>
            <div>转化率</div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 24, fontWeight: 'bold', color: '#1890ff' }}>
              {data?.avg_session_duration || 0}s
            </div>
            <div>平均会话时长</div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 24, fontWeight: 'bold', color: '#52c41a' }}>
              ✓
            </div>
            <div>系统状态</div>
          </div>
        </div>
      </div>

      <div style={{ marginTop: 20, fontSize: 12, color: '#666' }}>
        最后更新: {data?.timestamp ? new Date(data.timestamp).toLocaleString() : '--'}
      </div>
    </div>
  );
};

export default BasicDashboard; 