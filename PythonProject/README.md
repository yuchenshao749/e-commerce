# 电商实时数据分析系统

[![Python Version](https://img.shields.io/badge/python-3.8%2B-blue)](https://python.org)
[![Apache Spark](https://img.shields.io/badge/apache--spark-3.5.0-orange)](https://spark.apache.org)
[![Kafka](https://img.shields.io/badge/apache--kafka-2.8%2B-yellow)](https://kafka.apache.org)
[![MongoDB](https://img.shields.io/badge/mongodb-5.0%2B-green)](https://mongodb.com)
[![Redis](https://img.shields.io/badge/redis-6.0%2B-red)](https://redis.io)
[![FastAPI](https://img.shields.io/badge/fastapi-0.100%2B-teal)](https://fastapi.tiangolo.com)

一个基于Apache Spark、Kafka、MongoDB、Redis的大数据实时分析平台，专为电商场景设计，提供用户行为数据的实时采集、处理、存储和可视化展示。

## 📋 目录

- [功能特性](#-功能特性)
- [系统架构](#-系统架构)
- [技术栈](#-技术栈)
- [目录结构](#-目录结构)
- [快速开始](#-快速开始)
- [配置说明](#-配置说明)
- [API文档](#-api文档)
- [监控与维护](#-监控与维护)
- [开发指南](#-开发指南)
- [故障排除](#-故障排除)
- [版本更新](#-版本更新)

## 🚀 功能特性

### 🔥 实时数据处理
- **实时流处理**: 基于Apache Spark Streaming，毫秒级处理用户行为数据
- **多种数据源**: 支持Kafka、文件、数据库等多种数据输入源
- **弹性伸缩**: 自动适应数据流量波动，支持动态扩缩容

### 📊 数据分析能力
- **实时统计**: 活跃用户数、页面浏览量、购买转化率等核心指标
- **行为分析**: 用户浏览、点击、购买、评价等全链路行为追踪
- **趋势预测**: 基于机器学习的用户行为预测和商品推荐

### 🎯 个性化推荐
- **协同过滤**: 基于用户和物品的协同过滤推荐算法
- **实时更新**: 推荐模型实时更新，快速响应用户偏好变化
- **多维度推荐**: 支持基于行为、兴趣、地理位置等多维度推荐

### 📈 可视化展示
- **实时仪表板**: 现代化的Web界面，实时展示关键业务指标
- **数据钻取**: 支持多维度数据下钻分析
- **移动端适配**: 响应式设计，支持PC和移动端访问

### 🔧 系统管理
- **健康监控**: 全面的系统健康检查和性能监控
- **故障恢复**: 自动故障检测和恢复机制
- **日志管理**: 结构化日志记录，支持日志聚合和分析

## 🏗️ 系统架构

```
┌─────────────────────────────────────────────────────────────────┐
│                        前端展示层 (React)                       │
├─────────────────────────────────────────────────────────────────┤
│                      API服务层 (FastAPI)                       │
├─────────────────────────────────────────────────────────────────┤
│                      业务逻辑层                                  │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐             │
│  │ 推荐引擎    │  │ 数据分析    │  │ 用户管理    │             │
│  │ (ML Models) │  │ (Analytics) │  │ (User Mgmt) │             │
│  └─────────────┘  └─────────────┘  └─────────────┘             │
├─────────────────────────────────────────────────────────────────┤
│                      数据处理层                                  │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐             │
│  │ 实时处理    │  │ 批处理      │  │ 数据生成    │             │
│  │ (Spark)     │  │ (Spark)     │  │ (Generator) │             │
│  └─────────────┘  └─────────────┘  └─────────────┘             │
├─────────────────────────────────────────────────────────────────┤
│                      消息队列层                                  │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐             │
│  │ 用户行为    │  │ 系统事件    │  │ 推荐结果    │             │
│  │ (Kafka)     │  │ (Kafka)     │  │ (Kafka)     │             │
│  └─────────────┘  └─────────────┘  └─────────────┘             │
├─────────────────────────────────────────────────────────────────┤
│                      存储层                                      │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐             │
│  │ 文档存储    │  │ 缓存存储    │  │ 索引存储    │             │
│  │ (MongoDB)   │  │ (Redis)     │  │ (Spark)     │             │
│  └─────────────┘  └─────────────┘  └─────────────┘             │
└─────────────────────────────────────────────────────────────────┘
```

### 数据流向

```
用户行为 → 数据生成器 → Kafka消息队列 → Spark流处理 → 存储层 → API服务 → 前端展示
```

## 🛠️ 技术栈

### 后端技术
| 组件 | 版本 | 用途 | 说明 |
|------|------|------|------|
| **Python** | 3.8+ | 主要开发语言 | 应用开发、数据处理 |
| **Apache Spark** | 3.5.0 | 大数据处理引擎 | 实时流处理、批处理 |
| **Apache Kafka** | 2.8+ | 消息队列 | 数据传输、事件驱动 |
| **MongoDB** | 5.0+ | 文档数据库 | 用户数据、行为数据存储 |
| **Redis** | 6.0+ | 内存数据库 | 缓存、会话存储 |
| **FastAPI** | 0.100+ | Web框架 | REST API、WebSocket |

### 前端技术
| 组件 | 版本 | 用途 | 说明 |
|------|------|------|------|
| **React** | 18+ | 前端框架 | 用户界面开发 |
| **TypeScript** | 4.5+ | 开发语言 | 类型安全的JavaScript |
| **Vite** | 4+ | 构建工具 | 快速开发和构建 |
| **Tailwind CSS** | 3+ | CSS框架 | 响应式设计 |

### 开发工具
- **Docker**: 容器化部署
- **Jupyter Notebook**: 数据分析和模型开发
- **Apache Zookeeper**: Kafka集群管理
- **Nginx**: 反向代理和负载均衡

## 📁 目录结构

```
PythonProject/                          # 后端项目根目录
├── main.py                             # 主API服务器入口
├── requirements.txt                    # Python依赖包列表
├── README.md                           # 项目说明文档
│
├── config/                             # 配置管理
│   ├── __init__.py
│   └── settings.py                     # 系统配置定义
│
├── data_generator/                     # 数据生成模块
│   ├── __init__.py
│   └── user_behavior_generator.py      # 用户行为数据生成器
│
├── spark_processor/                    # Spark数据处理
│   ├── __init__.py
│   └── streaming_processor.py          # 实时流处理器
│
├── kafka_integration/                  # Kafka集成
│   ├── __init__.py
│   ├── producer.py                     # Kafka生产者
│   └── consumer.py                     # Kafka消费者
│
├── ml_models/                          # 机器学习模型
│   ├── __init__.py
│   ├── recommendation_engine.py        # 推荐引擎
│   └── behavior_predictor.py           # 行为预测模型
│
├── utils/                              # 工具模块
│   ├── __init__.py
│   ├── data_models.py                  # 数据模型定义
│   ├── database.py                     # 数据库连接工具
│   └── helpers.py                      # 通用辅助函数
│
├── logs/                               # 日志文件目录
│   └── .gitkeep
│
└── .venv/                              # Python虚拟环境
    └── ...
```

### 📂 详细目录说明

#### `/config` - 配置管理
- **settings.py**: 系统核心配置文件，包含数据库连接、Kafka配置、Spark参数等
- 支持环境变量覆盖，便于不同环境部署

#### `/data_generator` - 数据生成模块
- **user_behavior_generator.py**: 模拟电商用户行为数据生成器
- 功能：生成用户浏览、点击、购买、评价等多种行为数据
- 特性：可配置生成频率、数据分布权重、用户画像等

#### `/spark_processor` - Spark数据处理
- **streaming_processor.py**: Apache Spark流处理核心引擎
- 功能：实时处理Kafka中的用户行为数据，计算业务指标
- 特性：容错处理、检查点机制、动态批处理

#### `/kafka_integration` - Kafka集成
- **producer.py**: Kafka生产者，负责数据发送
- **consumer.py**: Kafka消费者，负责数据接收
- 功能：高性能消息队列操作，支持批量处理和错误重试

#### `/ml_models` - 机器学习模型
- **recommendation_engine.py**: 个性化推荐引擎
- **behavior_predictor.py**: 用户行为预测模型
- 功能：协同过滤、内容推荐、行为预测等AI能力

#### `/utils` - 工具模块
- **data_models.py**: Pydantic数据模型定义，确保数据类型安全
- **database.py**: 数据库连接和操作的封装
- **helpers.py**: 通用工具函数和辅助类

## 🚀 快速开始

### 环境要求

| 软件 | 最低版本 | 推荐版本 | 说明 |
|------|----------|----------|------|
| Python | 3.8 | 3.10+ | 主要运行环境 |
| Java | 8 | 11+ | Spark运行必需 |
| Apache Kafka | 2.8 | 3.0+ | 消息队列服务 |
| MongoDB | 5.0 | 6.0+ | 数据库服务 |
| Redis | 6.0 | 7.0+ | 缓存服务 |
| Hadoop (可选) | 3.2 | 3.3+ | Spark分布式存储 |

### 1. 环境准备

#### 1.1 安装Java环境
```bash
# Windows (使用Chocolatey)
choco install openjdk11

# macOS (使用Homebrew)
brew install openjdk@11

# 设置JAVA_HOME环境变量
export JAVA_HOME=/path/to/java
```

#### 1.2 安装Apache Kafka
```bash
# 下载Kafka
wget https://downloads.apache.org/kafka/2.13-3.5.0/kafka_2.13-3.5.0.tgz
tar -xzf kafka_2.13-3.5.0.tgz

# 启动Zookeeper
cd kafka_2.13-3.5.0
bin/zookeeper-server-start.sh config/zookeeper.properties

# 启动Kafka服务器
bin/kafka-server-start.sh config/server.properties
```

#### 1.3 安装MongoDB
```bash
# Windows: 下载MSI安装包
# https://www.mongodb.com/try/download/community

# macOS
brew install mongodb-community

# Ubuntu/Debian
sudo apt-get install mongodb-org
```

#### 1.4 安装Redis
```bash
# Windows: 下载MSI安装包或使用WSL
# macOS
brew install redis

# Ubuntu/Debian
sudo apt-get install redis-server
```

### 2. 项目安装

#### 2.1 克隆项目
```bash
git clone <repository-url>
cd e-commerce/PythonProject
```

#### 2.2 创建Python虚拟环境
```bash
# 创建虚拟环境
python -m venv .venv

# 激活虚拟环境
# Windows
.venv\Scripts\activate

# macOS/Linux
source .venv/bin/activate
```

#### 2.3 安装Python依赖
```bash
pip install -r requirements.txt
```

### 3. 配置设置

#### 3.1 数据库配置
编辑 `config/settings.py` 文件，确保数据库连接配置正确：

```python
# MongoDB配置
MONGODB_CONFIG = {
    "url": "mongodb://localhost:27017/",
    "database": "ecommerce_analytics"
}

# Redis配置
REDIS_CONFIG = {
    "host": "localhost",
    "port": 6379,
    "db": 0
}

# Kafka配置
KAFKA_CONFIG = {
    "bootstrap_servers": ["localhost:9092"],
    "topics": {
        "user_behavior": "user_behavior_events"
    }
}
```

#### 3.2 创建Kafka主题
```bash
# 创建用户行为事件主题
bin/kafka-topics.sh --create \
    --topic user_behavior_events \
    --bootstrap-server localhost:9092 \
    --partitions 3 \
    --replication-factor 1
```

### 4. 启动系统

#### 4.1 启动基础服务
```bash
# 启动MongoDB
mongod

# 启动Redis
redis-server

# 启动Kafka (如果未启动)
# 参考上面的Kafka启动步骤
```

#### 4.2 启动API服务器
```bash
cd PythonProject
python main.py
```

访问 `http://localhost:8000` 查看API文档

#### 4.3 启动前端界面 (可选)
```bash
cd react
npm install
npm run dev
```

访问 `http://localhost:3000` 查看前端界面

### 5. 验证安装

#### 5.1 检查API健康状态
```bash
curl http://localhost:8000/api/health
```

#### 5.2 启动数据生成器
通过API启动数据生成器：
```bash
curl -X POST http://localhost:8000/api/system/start-component/data_generator
```

#### 5.3 启动流处理器
```bash
curl -X POST http://localhost:8000/api/system/start-component/stream_processor
```

#### 5.4 查看实时数据
```bash
curl http://localhost:8000/api/analytics/real-time
```

## ⚙️ 配置说明

### 核心配置文件

#### `config/settings.py` 配置详解

```python
# =============================================================================
# 数据生成器配置
# =============================================================================
DATA_GENERATOR_CONFIG = {
    "events_per_second": 10,        # 每秒生成事件数
    "batch_size": 50,               # 批处理大小
    "users_count": 1000,            # 虚拟用户数量
    "products_count": 500,          # 商品数量
    "categories_count": 20,         # 商品分类数量
    
    # 行为类型权重分布
    "behavior_patterns": {
        "view": 0.6,               # 60% 浏览行为
        "click": 0.25,             # 25% 点击行为
        "add_to_cart": 0.1,        # 10% 加购物车
        "purchase": 0.04,          # 4% 购买行为
        "rate": 0.01               # 1% 评价行为
    },
    
    # 价格范围
    "price_range": {
        "min": 10.0,
        "max": 1000.0
    },
    
    # 支持的设备类型
    "devices": ["mobile", "desktop", "tablet"],
    
    # 支持的地理位置
    "locations": ["北京", "上海", "深圳", "杭州", "广州"]
}

# =============================================================================
# Spark配置
# =============================================================================
SPARK_CONFIG = {
    "app_name": "EcommerceRealTimeAnalytics",
    "master": "local[*]",          # 本地模式，使用所有CPU核心
    "packages": [
        "org.apache.spark:spark-sql-kafka-0-10_2.12:3.5.0",
        "org.mongodb.spark:mongo-spark-connector_2.12:10.2.0"
    ],
    
    # Spark性能配置
    "config": {
        "spark.sql.adaptive.enabled": "true",
        "spark.sql.adaptive.coalescePartitions.enabled": "true",
        "spark.serializer": "org.apache.spark.serializer.KryoSerializer",
        "spark.sql.streaming.checkpointLocation": "./checkpoints"
    },
    
    "streaming_interval": 5,        # 流处理间隔(秒)
    "checkpoint_dir": "file:///tmp/spark-checkpoints"
}
```

### 环境变量配置

支持通过环境变量覆盖配置：

```bash
# 数据库配置
export MONGODB_URL="mongodb://user:pass@host:port/database"
export REDIS_HOST="redis.example.com"
export REDIS_PORT="6379"

# Kafka配置
export KAFKA_SERVERS="kafka1:9092,kafka2:9092"

# API配置
export API_HOST="0.0.0.0"
export API_PORT="8000"

# 日志级别
export LOG_LEVEL="INFO"
```

## 📚 API文档

### REST API端点

#### 系统管理
```http
GET    /                              # 系统基本信息
GET    /api/health                    # 健康检查
GET    /api/system/status             # 系统状态
POST   /api/system/start-component/{component}  # 启动组件
POST   /api/system/stop-component/{component}   # 停止组件
```

#### 数据分析
```http
GET    /api/analytics/real-time       # 获取实时统计数据
GET    /api/analytics/trends          # 获取趋势分析数据
GET    /api/analytics/user/{user_id}  # 获取用户分析数据
```

#### 推荐系统
```http
GET    /api/products/recommendations/user/{user_id}     # 用户个性化推荐
GET    /api/products/popular                            # 热门商品
GET    /api/products/categories/{category_id}/popular   # 分类热门商品
```

### WebSocket端点

#### 实时数据推送
```javascript
// 连接WebSocket
const ws = new WebSocket('ws://localhost:8000/ws/real-time');

// 接收实时数据
ws.onmessage = function(event) {
    const data = JSON.parse(event.data);
    console.log('实时数据:', data);
};
```

### API响应示例

#### 实时统计数据
```json
{
    "active_users": 1250,
    "page_views": 15420,
    "purchases": 342,
    "revenue": 28596.50,
    "conversion_rate": 2.22,
    "popular_products": [
        {
            "product_id": "prod_001234",
            "interactions": 156
        }
    ],
    "popular_categories": [
        {
            "category_id": "cat_001",
            "interactions": 892
        }
    ],
    "timestamp": "2025-05-31T10:30:00.123456",
    "time_window": "实时数据"
}
```

## 📊 监控与维护

### 日志管理

#### 日志级别
- **DEBUG**: 详细的调试信息
- **INFO**: 一般信息记录
- **WARNING**: 警告信息
- **ERROR**: 错误信息
- **CRITICAL**: 严重错误

#### 日志文件位置
```
logs/
├── app.log                    # 应用主日志
├── spark.log                  # Spark日志
├── kafka.log                  # Kafka日志
└── error.log                  # 错误日志
```

### 性能监控

#### 系统指标
- **CPU使用率**: 监控系统CPU负载
- **内存使用**: 监控JVM和Python进程内存
- **磁盘I/O**: 监控数据读写性能
- **网络流量**: 监控数据传输带宽

#### 业务指标
- **事件处理速度**: 每秒处理的事件数量
- **端到端延迟**: 从数据生成到前端展示的延迟
- **错误率**: 系统组件错误率统计
- **数据准确性**: 数据处理的准确性验证

### 故障恢复

#### 自动重启机制
```python
# 组件健康检查
def health_check():
    return {
        "spark": check_spark_health(),
        "kafka": check_kafka_health(),
        "mongodb": check_mongodb_health(),
        "redis": check_redis_health()
    }

# 自动重启失败组件
def auto_restart_failed_components():
    health = health_check()
    for component, status in health.items():
        if status["status"] != "healthy":
            restart_component(component)
```

## 🔧 开发指南

### 添加新的数据源

#### 1. 定义数据模型
```python
# utils/data_models.py
class NewDataSource(BaseModel):
    source_id: str
    data_type: str
    timestamp: datetime
    content: Dict[str, Any]
```

#### 2. 创建数据处理器
```python
# spark_processor/new_processor.py
class NewDataProcessor:
    def process_stream(self, df):
        # 处理逻辑
        return processed_df
```

#### 3. 注册处理器
```python
# main.py
def register_processors():
    system.add_processor("new_data", NewDataProcessor())
```

### 添加新的API端点

#### 1. 定义路由
```python
@app.get("/api/new-endpoint")
async def new_endpoint():
    # API逻辑
    return {"message": "新端点"}
```

#### 2. 添加数据模型
```python
class NewResponse(BaseModel):
    status: str
    data: List[Dict[str, Any]]
    timestamp: datetime
```

#### 3. 更新文档
在README.md中添加新端点的说明。

### 扩展推荐算法

#### 1. 实现新算法
```python
# ml_models/new_algorithm.py
class NewRecommendationAlgorithm:
    def train(self, user_data, item_data):
        # 训练逻辑
        pass
    
    def predict(self, user_id, k=10):
        # 预测逻辑
        return recommendations
```

#### 2. 集成算法
```python
# ml_models/recommendation_engine.py
def add_algorithm(self, name, algorithm):
    self.algorithms[name] = algorithm
```

## 🐛 故障排除

### 常见问题及解决方案

#### 1. Spark启动失败
**问题**: `Exception in thread "main" java.lang.NoClassDefFoundError`

**解决方案**:
```bash
# 检查Java版本
java -version

# 设置JAVA_HOME
export JAVA_HOME=/path/to/java

# 检查Spark配置
spark-submit --version
```

#### 2. Kafka连接失败
**问题**: `Connection to node -1 could not be established`

**解决方案**:
```bash
# 检查Kafka服务状态
bin/kafka-broker-api-versions.sh --bootstrap-server localhost:9092

# 检查网络连接
telnet localhost 9092

# 重启Kafka服务
bin/kafka-server-stop.sh
bin/kafka-server-start.sh config/server.properties
```

#### 3. MongoDB连接超时
**问题**: `pymongo.errors.ServerSelectionTimeoutError`

**解决方案**:
```bash
# 检查MongoDB服务
sudo systemctl status mongod

# 检查连接配置
mongo --host localhost --port 27017

# 重启MongoDB
sudo systemctl restart mongod
```

#### 4. 内存不足错误
**问题**: `java.lang.OutOfMemoryError: Java heap space`

**解决方案**:
```python
# 增加Spark内存配置
SPARK_CONFIG = {
    "config": {
        "spark.executor.memory": "4g",
        "spark.driver.memory": "2g",
        "spark.executor.maxResultSize": "2g"
    }
}
```

#### 5. 数据处理延迟高
**问题**: 实时数据处理延迟过高

**解决方案**:
```python
# 优化批处理大小
"streaming_interval": 2,  # 减少处理间隔
"batch_size": 100,        # 增加批大小

# 启用自适应查询执行
"spark.sql.adaptive.enabled": "true",
"spark.sql.adaptive.coalescePartitions.enabled": "true"
```

### 调试技巧

#### 1. 启用详细日志
```python
# config/settings.py
LOGGING_CONFIG = {
    "loggers": {
        "root": {
            "level": "DEBUG"  # 改为DEBUG级别
        }
    }
}
```

#### 2. 使用性能分析工具
```bash
# 安装性能分析工具
pip install memory-profiler line-profiler

# 分析内存使用
python -m memory_profiler main.py

# 分析CPU使用
kernprof -l -v main.py
```

#### 3. 监控系统资源
```bash
# 监控系统资源
htop

# 监控Java进程
jps -l
jstat -gc <pid>

# 监控网络连接
netstat -tulpn
```

## 📈 版本更新

### 版本历史

#### v1.0.0 (2025-05-31)
- ✨ 初始版本发布
- 🚀 基础实时数据处理功能
- 📊 用户行为分析和推荐系统
- 🔧 完整的API服务和前端界面
- 📚 详细的文档和部署指南

### 即将发布的功能

#### v1.1.0 (计划中)
- 🔍 增强的数据搜索和过滤功能
- 📱 移动端原生应用支持
- 🌐 多语言和国际化支持
- 🔐 增强的安全认证机制
- 📈 更多业务指标和分析维度

#### v1.2.0 (规划中)
- 🤖 AI驱动的异常检测
- 📊 高级数据可视化图表
- 🔄 实时AB测试框架
- 🏗️ 微服务架构重构
- ☁️ 云原生部署支持

## 🤝 贡献指南

我们欢迎社区贡献！请遵循以下步骤：

1. **Fork项目** 到您的GitHub账户
2. **创建功能分支** (`git checkout -b feature/amazing-feature`)
3. **提交更改** (`git commit -m 'Add some amazing feature'`)
4. **推送到分支** (`git push origin feature/amazing-feature`)
5. **创建Pull Request**

### 代码规范
- 遵循PEP 8 Python代码规范
- 添加适当的注释和文档字符串
- 编写单元测试覆盖新功能
- 更新相关文档

## 📄 许可证

本项目采用 MIT 许可证 - 查看 [LICENSE](LICENSE) 文件了解详情。

## 📞 联系我们

- **项目维护者**: AI Assistant
- **邮箱**: support@example.com
- **问题反馈**: [GitHub Issues](https://github.com/your-repo/issues)
- **文档更新**: [GitHub Wiki](https://github.com/your-repo/wiki)

---

⭐ 如果这个项目对您有帮助，请给我们一个star！ 