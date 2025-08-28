// MongoDB初始化脚本
print('开始初始化电商数据库...');

// 切换到与应用一致的数据库
db = db.getSiblingDB('ecommerce_analytics');

// 创建用户集合并插入示例数据
db.users.insertMany([
  {
    user_id: "user_001",
    name: "张三",
    email: "zhangsan@example.com",
    age: 28,
    gender: "M",
    registration_date: new Date(),
    last_login: new Date()
  },
  {
    user_id: "user_002", 
    name: "李四",
    email: "lisi@example.com",
    age: 32,
    gender: "F",
    registration_date: new Date(),
    last_login: new Date()
  }
]);

// 创建产品集合并插入示例数据
db.products.insertMany([
  {
    product_id: "prod_001",
    name: "智能手机",
    category: "电子产品",
    price: 2999.99,
    stock: 100,
    description: "最新款智能手机",
    created_at: new Date()
  },
  {
    product_id: "prod_002",
    name: "笔记本电脑", 
    category: "电子产品",
    price: 5999.99,
    stock: 50,
    description: "高性能笔记本电脑",
    created_at: new Date()
  }
]);

// 创建订单集合
db.orders.createIndex({ "user_id": 1 });
db.orders.createIndex({ "order_date": -1 });

// 创建用户行为集合（与应用集合名一致）
db.user_behavior.createIndex({ "user_id": 1 });
db.user_behavior.createIndex({ "timestamp": -1 });
db.user_behavior.createIndex({ "action_type": 1 });

// 创建热门商品/分类集合（供累计统计）
db.popular_products.createIndex({ "product_id": 1 }, { unique: true });
db.popular_categories.createIndex({ "category_id": 1 }, { unique: true });

// 创建实时统计集合
db.real_time_stats.createIndex({ "timestamp": -1 });

print('电商数据库初始化完成！');
print('创建的集合: users, products, orders, user_behaviors, real_time_stats');
print('插入的示例数据: 2个用户, 2个产品');
print('数据库连接信息:');
print('- 主机: localhost:27017');
print('- 数据库: ecommerce');
print('- 用户名: admin');
print('- 密码: admin123'); 