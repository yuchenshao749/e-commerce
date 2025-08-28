# 电商实时数据分析系统

基于大数据技术栈的现代化电商实时数据分析平台，展示完整的数据处理pipeline和推荐系统实现。

## 🏗️ 系统架构

```
数据生成器 → Kafka → Spark流处理器 → MongoDB/Redis → FastAPI → React前端
     ↓           ↓         ↓            ↓          ↓         ↓
   用户行为    消息队列   实时计算      数据存储    API接口   数据展示
```

## 🚀 技术栈

### 后端大数据
- **Apache Spark 3.5.0**: 分布式流处理引擎
- **Apache Kafka**: 高吞吐量消息队列
- **MongoDB 7.0**: 文档数据库
- **Redis 7**: 内存缓存数据库
- **FastAPI**: 现代化Python Web框架

### 前端技术
- **React 18**: 现代化前端框架
- **Ant Design**: 企业级UI组件库
- **ECharts**: 数据可视化图表库
- **Axios**: HTTP客户端库

### 开发工具
- **Docker**: 容器化部署
- **Docker Compose**: 服务编排
- **Python 3.8+**: 后端开发语言
- **Node.js 16+**: 前端开发环境

## 📦 项目结构

```
电商实时数据分析系统/
├── docker-compose.yml              # Docker服务编排文件
├── start_docker_services.bat       # 一键启动Docker服务
├── mongo-init/                     # MongoDB初始化脚本
├── PythonProject/                  # 后端Python项目
│   ├── config/                     # 配置模块
│   ├── data_generator/             # 数据生成器
│   ├── spark_processor/            # Spark流处理器  
│   ├── kafka_integration/          # Kafka集成模块
│   ├── ml_models/                  # 机器学习模型
│   ├── utils/                      # 工具模块
│   ├── main.py                     # 主API服务器
│   ├── requirements.txt            # Python依赖
│   └── README.md                   # 后端详细说明
└── react/                          # 前端React项目
    ├── src/                        # 源代码目录
    ├── public/                     # 静态资源
    ├── package.json               # 前端依赖
    └── README.md                  # 前端详细说明
```

## 🚀 快速启动

### 📋 环境要求

**系统要求:**
- Windows 10/11, macOS 或 Linux
- 内存: 8GB+ (推荐 16GB)
- 磁盘空间: 5GB+

**必需软件:**
- [Docker Desktop](https://www.docker.com/products/docker-desktop/) (包含Docker和Docker Compose)
- [Python 3.8+](https://www.python.org/downloads/)
- [Node.js 16+](https://nodejs.org/) (前端需要)

### 🐳 步骤1: 启动Docker基础服务

**Windows系统:**
```cmd
# 双击运行或命令行执行
start_docker_services.bat
```

**Linux/macOS系统:**
```bash
# 启动所有基础服务
docker-compose up -d

# 查看服务状态
docker-compose ps
```

这将启动以下服务：
- **Kafka**: localhost:9092 (消息队列)
- **MongoDB**: localhost:27017 (数据库) 
- **Redis**: localhost:6379 (缓存)
- **Spark**: localhost:7077 (流处理引擎)

**管理界面** (可选，用于监控):
- Kafka UI: http://localhost:8080
- MongoDB Express: http://localhost:8081 (admin/admin123)
- Redis Commander: http://localhost:8082  
- Spark Master UI: http://localhost:8085

### 🔧 步骤2: 启动后端服务

```bash
# 进入后端目录
cd PythonProject

# 安装Python依赖
pip install -r requirements.txt

# 启动后端API服务器
python -m PythonProject.main
```

**后端服务地址:**
- API服务器: http://localhost:8000
- API文档: http://localhost:8000/docs
- 系统状态: http://localhost:8000/api/system/status

### 🎨 步骤3: 启动前端界面

```bash
# 进入前端目录  
cd react

# 安装前端依赖
npm install

# 启动前端开发服务器
npm start
```

**前端应用:** http://localhost:3000

### ⚡ 步骤4: 启动数据流处理

通过后端API启动系统组件:

```bash
# 启动数据生成器 (模拟用户行为)
curl -X POST http://localhost:8000/api/system/start-component/data_generator

# 启动Spark流处理器 (实时数据分析)
curl -X POST http://localhost:8000/api/system/start-component/stream_processor
```

或者通过前端界面操作，访问 http://localhost:3000 进行可视化管理。

## 📊 核心功能

### 🔄 实时数据处理
- **用户行为模拟**: 每秒生成100条真实的电商用户行为数据
- **消息队列缓冲**: Kafka高吞吐量消息传输
- **流式计算**: Spark每10秒批处理实时数据
- **双存储策略**: MongoDB存历史数据，Redis缓存实时统计

### 🎯 业务分析
- **实时指标监控**: 活跃用户数、页面浏览量、购买转化率
- **商品分析**: 热门商品排行、类别分析、价格趋势
- **用户分析**: 用户画像、行为路径、地域分布
- **实时告警**: 异常数据检测和业务指标监控

### 🤖 智能推荐
- **协同过滤推荐**: 基于ALS算法的用户-商品矩阵分解
- **内容推荐**: TF-IDF特征提取的商品相似度计算
- **热门推荐**: 基于统计的热度排序推荐
- **实时更新**: 增量学习和模型在线更新

### 📱 现代化界面
- **实时仪表板**: 动态更新的数据可视化图表
- **多维分析**: 时间序列、地域分布、用户行为等多角度分析
- **系统监控**: 服务状态监控和性能指标展示
- **交互式操作**: 系统组件的启停控制和参数配置

## 🎯 学习价值

这个项目涵盖了现代大数据和全栈开发的核心技术:

### 📈 大数据技术实践
- **流式数据处理**: Apache Spark Streaming实时处理
- **消息队列设计**: Kafka的topic设计和partition策略
- **数据存储策略**: MongoDB文档存储 + Redis缓存加速
- **数据建模**: 用户行为数据模型和推荐算法数据结构

### 🔧 系统架构设计
- **微服务架构**: 组件解耦和独立部署
- **异步处理**: 消息驱动的异步数据处理
- **缓存策略**: 多级缓存和热点数据优化
- **监控体系**: 健康检查、日志管理、指标监控

### 💻 全栈开发技能
- **后端API开发**: FastAPI框架和RESTful API设计
- **前端现代化开发**: React Hooks、状态管理、组件设计
- **数据可视化**: ECharts图表库和实时数据渲染
- **容器化部署**: Docker和Docker Compose服务编排

### 🧠 机器学习应用
- **推荐系统设计**: 协同过滤和内容推荐算法
- **特征工程**: 用户行为特征提取和处理
- **模型训练**: Scikit-learn和Spark MLlib的使用
- **在线学习**: 实时模型更新和增量训练

## 📈 技术亮点

- **企业级架构**: 参考真实电商平台的技术架构设计
- **高性能处理**: 支持每秒100+条数据的实时处理
- **生产就绪**: 完整的错误处理、日志记录、监控体系
- **可扩展设计**: 支持水平扩展和负载均衡
- **文档完善**: 详细的技术文档和使用说明

## 🛠️ 故障排除

### 常见问题

1. **Docker启动失败**
   ```bash
   # 检查Docker状态
   docker --version
   docker-compose --version
   
   # 重启Docker Desktop
   # 清理Docker资源
   docker system prune -f
   ```

2. **端口占用问题**
   ```bash
   # Windows检查端口占用
   netstat -ano | findstr :8000
   
   # 杀死占用进程
   taskkill /PID <进程ID> /F
   ```

3. **Python依赖安装失败**
   ```bash
   # 升级pip
   python -m pip install --upgrade pip
   
   # 使用清华源安装
   pip install -r requirements.txt -i https://pypi.tuna.tsinghua.edu.cn/simple
   ```

4. **内存不足**
   - 关闭其他应用程序释放内存
   - 在Docker Desktop中调整内存限制
   - 减少Spark worker内存配置

### 🔍 监控和调试

- **查看日志**: `docker-compose logs -f`
- **系统状态**: http://localhost:8000/api/system/status
- **Spark监控**: http://localhost:8085
- **数据库管理**: http://localhost:8081

## 📚 扩展学习

这个项目为进一步学习提供了良好的基础:

- **Kubernetes部署**: 将Docker Compose迁移到K8s
- **分布式集群**: 扩展为多节点Spark/Kafka集群
- **机器学习优化**: 尝试深度学习推荐算法
- **实时OLAP**: 集成ClickHouse或Druid进行实时分析
- **流式机器学习**: 使用Kafka Streams或Flink

## 📝 注意事项

1. **系统资源**: 建议至少8GB内存，16GB更佳
2. **启动顺序**: 必须先启动Docker服务，再启动后端
3. **网络配置**: 默认使用localhost，生产环境需要调整
4. **数据持久化**: Docker volumes确保数据不丢失
5. **防火墙设置**: 确保相关端口未被阻止

## 📞 技术支持

遇到问题可以:
- 查看详细的[后端文档](PythonProject/README.md)
- 查看详细的[前端文档](ReactProject/README.md)
- 检查[项目说明](项目说明.md)了解架构详情

---

🎯 **这是一个完整的企业级大数据实时分析系统演示，适合作为学习项目、技能展示或面试作品。项目展示了现代数据工程的最佳实践和全栈开发能力。** 