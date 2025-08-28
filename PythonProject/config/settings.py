#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
电商实时数据分析系统 - 系统配置文件
================================================================

文件作用：
    这是整个系统的核心配置文件，包含：
    1. 所有组件的连接配置（数据库、消息队列等）
    2. Spark和Hadoop环境配置
    3. 机器学习模型参数配置
    4. 日志系统配置
    5. API服务配置

配置特性：
    - 支持环境变量覆盖
    - 自动路径检测和验证
    - 开发/生产环境分离
    - 详细的配置项说明

使用方式：
    from config.settings import settings
    mongo_config = settings.MONGODB_CONFIG

作者: AI Assistant
创建时间: 2025-05-31
版本: 1.0.0
================================================================
"""

import os
from pathlib import Path
from typing import List, Dict, Any

# =============================================================================
# 路径配置
# =============================================================================

# 项目根目录 (e-commerce)
# settings.py 位于 PythonProject/config/settings.py
# 因此，ACTUAL_PROJECT_ROOT 需要向上两级到 e-commerce 目录
ACTUAL_PROJECT_ROOT = Path(__file__).resolve().parent.parent.parent

# PythonProject 目录 (用于 jars, checkpoints 等相对路径)
PYTHON_PROJECT_DIR = Path(__file__).resolve().parent.parent


class Settings:
    """
    系统配置类
    
    包含所有系统组件的配置参数，支持环境变量覆盖
    按功能模块组织配置，便于维护和扩展
    """

    # =============================================================================
    # 应用基础配置
    # =============================================================================
    
    APP_NAME = "电商实时数据分析系统"
    APP_VERSION = "1.0.0"
    DEBUG = os.getenv("DEBUG", "false").lower() == "true"

    # =============================================================================
    # API服务配置
    # =============================================================================
    
    # API服务器主机和端口
    API_HOST = os.getenv("API_HOST", "0.0.0.0")
    API_PORT = int(os.getenv("API_PORT", 8000))
    
    # CORS跨域配置 - 允许的前端域名
    CORS_ORIGINS = [
        "http://localhost:3000",      # React开发服务器
        "http://127.0.0.1:3000",
        "http://localhost:3001",      # 备用端口
        "http://127.0.0.1:3001",
        "http://localhost:5173",      # Vite开发服务器
        "http://127.0.0.1:5173"
    ]

    # =============================================================================
    # Kafka消息队列配置
    # =============================================================================
    
    KAFKA_CONFIG = {
        # 基础连接配置
        "bootstrap_servers": os.getenv("KAFKA_BOOTSTRAP_SERVERS", "localhost:9092"),
        
        # 主题配置
        "topics": {
            "user_behavior": "user_behavior_topic",      # 用户行为事件主题
            "system_metrics": "system_metrics_topic"     # 系统指标主题
        },
        
        # 生产者配置
        "producer_config": {
            "acks": "all",                    # 确认所有副本写入
            "retries": 3,                     # 重试次数
            "batch_size": 16384,              # 批处理大小（字节）
            "linger_ms": 10,                  # 批处理等待时间（毫秒）
            "buffer_memory": 33554432,        # 生产者缓冲区大小
            "value_serializer": "json"        # 值序列化格式
        },
        
        # 消费者配置
        "consumer_config": {
            "group_id": "ecommerce_analytics",       # 消费者组ID
            "auto_offset_reset": "latest",           # 偏移量重置策略
            "enable_auto_commit": True,              # 自动提交偏移量
            "auto_commit_interval_ms": 1000,         # 自动提交间隔
            "session_timeout_ms": 30000,             # 会话超时时间
            "value_deserializer": "json"             # 值反序列化格式
        }
    }

    # =============================================================================
    # Hadoop和Spark环境配置
    # =============================================================================
    
    # Hadoop安装路径配置（仓库内置 windows 工具位于 hadoop/bin）
    HADOOP_HOME_PATH = str(ACTUAL_PROJECT_ROOT / "hadoop")
    HADOOP_HOME_BIN_PATH = str(Path(HADOOP_HOME_PATH) / "bin")

    # Spark工作目录配置
    SPARK_CHECKPOINT_DIR_ABS = str(PYTHON_PROJECT_DIR / "checkpoints")
    SPARK_WAREHOUSE_DIR_ABS = str(PYTHON_PROJECT_DIR / "spark-warehouse")
    SPARK_TMP_DIR_ABS = str(PYTHON_PROJECT_DIR / "tmp")

    # =============================================================================
    # Spark JAR文件依赖配置
    # =============================================================================
    
    # 定义必需的JAR文件路径
    SQL_KAFKA_JAR = PYTHON_PROJECT_DIR / "jars" / "spark-sql-kafka-0-10_2.12-3.5.0.jar"
    KAFKA_CLIENTS_JAR = PYTHON_PROJECT_DIR / "jars" / "kafka-clients-3.5.0.jar"
    MONGO_CONNECTOR_JAR = PYTHON_PROJECT_DIR / "jars" / "mongo-spark-connector_2.12-3.0.1.jar"
    COMMONS_POOL2_JAR = PYTHON_PROJECT_DIR / "jars" / "commons-pool2-2.11.1.jar"
    SPARK_TOKEN_PROVIDER_KAFKA_JAR = PYTHON_PROJECT_DIR / "jars" / "spark-token-provider-kafka-0-10_2.12-3.5.0.jar"

    # 自动检测可用的JAR文件
    jar_file_definitions = [
        {"name": "Spark SQL Kafka连接器", "path_obj": SQL_KAFKA_JAR},
        {"name": "Kafka客户端", "path_obj": KAFKA_CLIENTS_JAR},
        {"name": "MongoDB连接器", "path_obj": MONGO_CONNECTOR_JAR},
        {"name": "Apache Commons Pool2", "path_obj": COMMONS_POOL2_JAR},
        {"name": "Spark Token Provider Kafka", "path_obj": SPARK_TOKEN_PROVIDER_KAFKA_JAR},
    ]

    # 构建可用JAR文件列表
    existing_jar_paths_list = []
    for jar_def in jar_file_definitions:
        if jar_def["path_obj"].exists():
            existing_jar_paths_list.append(str(jar_def["path_obj"].resolve()))
            print(f"[SETTINGS_INFO] 发现JAR文件: {jar_def['name']}")
        else:
            print(f"[SETTINGS_WARN] JAR文件未找到: {jar_def['name']} - {jar_def['path_obj']}")

    # 构建JAR文件路径字符串
    SPARK_JARS_STRING = ",".join(existing_jar_paths_list)
    SPARK_CLASSPATH_STRING = os.pathsep.join(existing_jar_paths_list)

    # 检查Hadoop环境
    _valid_hadoop_home_bin = HADOOP_HOME_BIN_PATH and Path(HADOOP_HOME_BIN_PATH).is_dir()

    # =============================================================================
    # Spark核心配置
    # =============================================================================
    
    SPARK_CONFIG = {
        # 应用基础配置
        "app_name": "EcommerceRealTimeAnalytics",
        "master": os.getenv("SPARK_MASTER", "local[*]"),           # Spark运行模式
        "streaming_interval": int(os.getenv("SPARK_STREAMING_INTERVAL", 10)),  # 流处理间隔（秒）
        "checkpoint_dir": f"file:///{SPARK_CHECKPOINT_DIR_ABS.replace(os.sep, '/')}",
        "packages": [],  # 使用本地JAR文件，不从Maven下载
        
        "config": {
            # JAR文件和类路径配置
            "spark.jars": SPARK_JARS_STRING if SPARK_JARS_STRING else None,
            "spark.driver.extraClassPath": SPARK_CLASSPATH_STRING if SPARK_CLASSPATH_STRING else None,
            "spark.executor.extraClassPath": SPARK_CLASSPATH_STRING if SPARK_CLASSPATH_STRING else None,

            # 网络和主机配置
            "spark.driver.host": "localhost",
            "spark.hadoop.io.native.lib.available": "true",

            # JVM参数配置
            "spark.driver.extraJavaOptions": (
                f"-Djava.library.path={HADOOP_HOME_BIN_PATH.replace(os.sep, '/')} "
                f"-Dhadoop.home.dir={HADOOP_HOME_PATH.replace(os.sep, '/')} "
                f"-Dfile.encoding=UTF-8 "
                f"-Djava.net.preferIPv4Stack=true "
            ).strip() if _valid_hadoop_home_bin else 
                "-Dfile.encoding=UTF-8 -Djava.net.preferIPv4Stack=true",

            "spark.executor.extraJavaOptions": (
                f"-Djava.library.path={HADOOP_HOME_BIN_PATH.replace(os.sep, '/')} "
                f"-Dhadoop.home.dir={HADOOP_HOME_PATH.replace(os.sep, '/')} "
                f"-Dfile.encoding=UTF-8 "
                f"-Djava.net.preferIPv4Stack=true "
            ).strip() if _valid_hadoop_home_bin else 
                "-Dfile.encoding=UTF-8 -Djava.net.preferIPv4Stack=true",

            # 文件系统配置
            "spark.hadoop.fs.file.impl": "org.apache.hadoop.fs.LocalFileSystem",
            "spark.hadoop.fs.file.impl.disable.cache": "true",
            "spark.hadoop.fs.defaultFS": "file:///",
            
            # Spark UI配置
            "spark.ui.enabled": "true",
            "spark.ui.port": os.getenv("SPARK_UI_PORT", "4040"),
            "spark.ui.retainedJobs": "20",
            "spark.ui.retainedStages": "50",
            
            # 内存配置
            "spark.driver.memory": os.getenv("SPARK_DRIVER_MEMORY", "1g"),
            "spark.executor.memory": os.getenv("SPARK_EXECUTOR_MEMORY", "1g"),
            
            # 序列化配置
            "spark.serializer": "org.apache.spark.serializer.KryoSerializer",
            "spark.kryo.registrationRequired": "false",
            
            # 目录配置
            "spark.local.dir": SPARK_TMP_DIR_ABS.replace(os.sep, '/'),
            "spark.sql.warehouse.dir": f"file:///{SPARK_WAREHOUSE_DIR_ABS.replace(os.sep, '/')}",
            
            # 流处理配置
            "spark.sql.streaming.checkpointLocation.deleteDelayMs": "0",
            "spark.sql.streaming.stopGracefullyOnShutdown": "true",
            "spark.sql.streaming.forceDeleteTempCheckpointLocation": "true",
            
            # 性能优化配置
            "spark.sql.shuffle.partitions": os.getenv("SPARK_SHUFFLE_PARTITIONS", "10"),
            "spark.task.maxAttempts": "3",
            "spark.sql.adaptive.enabled": "true",
        }
    }

    # =============================================================================
    # MongoDB数据库配置
    # =============================================================================
    
    MONGODB_CONFIG = {
        # 连接基础配置
        "host": os.getenv("MONGODB_HOST", "localhost"),
        "port": int(os.getenv("MONGODB_PORT", 27017)),
        "database": os.getenv("MONGODB_DATABASE", "ecommerce_analytics"),
        "username": os.getenv("MONGODB_USERNAME", "admin"),
        "password": os.getenv("MONGODB_PASSWORD", "admin123"),
        
        # 集合配置
        "collections": {
            "user_behavior": "user_behavior",           # 用户行为数据
            "users": "users",                           # 用户信息
            "products": "products",                     # 商品信息
            "recommendations": "recommendations",       # 推荐结果
            "real_time_stats": "real_time_stats"       # 实时统计数据
        },
        
        # 连接池配置
        "connection_config": {
            "maxPoolSize": 100,              # 最大连接池大小
            "minPoolSize": 10,               # 最小连接池大小
            "maxIdleTimeMS": 30000,          # 最大空闲时间
            "waitQueueTimeoutMS": 10000,     # 等待队列超时
            "serverSelectionTimeoutMS": 5000,  # 服务器选择超时
            "connectTimeoutMS": 10000,       # 连接超时
            "socketTimeoutMS": 20000         # Socket超时
        }
    }

    # =============================================================================
    # Redis缓存配置
    # =============================================================================
    
    REDIS_CONFIG = {
        # 连接基础配置
        "host": os.getenv("REDIS_HOST", "localhost"),
        "port": int(os.getenv("REDIS_PORT", 6379)),
        "db": int(os.getenv("REDIS_DB", 0)),
        "password": os.getenv("REDIS_PASSWORD", "redis123"),
        "decode_responses": True,
        
        # 连接池配置
        "connection_pool_kwargs": {
            "max_connections": 50,           # 最大连接数
            "retry_on_timeout": True,        # 超时重试
            "socket_keepalive": True,        # 保持连接活跃
            "health_check_interval": 30      # 健康检查间隔（秒）
        },
        
        # 缓存TTL配置（秒）
        "cache_ttl": {
            "real_time_stats": 30,           # 实时统计数据缓存30秒
            "user_recommendations": 3600,    # 用户推荐缓存1小时
            "popular_products": 300,         # 热门商品缓存5分钟
            "session_data": 1800            # 会话数据缓存30分钟
        }
    }

    # =============================================================================
    # 机器学习模型配置
    # =============================================================================
    
    ML_CONFIG = {
        # 协同过滤推荐模型配置
        "recommendation_model": {
            "algorithm": "als",              # 算法类型：ALS (Alternating Least Squares)
            "rank": 50,                      # 隐因子数量
            "max_iter": 10,                  # 最大迭代次数
            "reg_param": 0.1,                # 正则化参数
            "implicit_prefs": False,         # 是否为隐式偏好
            "alpha": 1.0,                    # 隐式反馈的置信度参数
            "nonnegative": True,             # 是否使用非负约束
            "checkpoint_interval": 10        # 检查点间隔
        },
        
        # 基于内容的推荐配置
        "content_based": {
            "tfidf_max_features": 5000,      # TF-IDF最大特征数
            "similarity_threshold": 0.1,     # 相似度阈值
            "top_k_similar": 100             # 返回最相似的K个商品
        },
        
        # 模型文件路径配置
        "model_paths": {
            "als_model": str(PYTHON_PROJECT_DIR / "models" / "als_model"),
            "tfidf_vectorizer": str(PYTHON_PROJECT_DIR / "models" / "tfidf_vectorizer.pkl"),
            "similarity_matrix": str(PYTHON_PROJECT_DIR / "models" / "similarity_matrix.pkl")
        }
    }

    # =============================================================================
    # 数据生成器配置
    # =============================================================================
    
    DATA_GENERATOR_CONFIG = {
        # 基础数据规模
        "users_count": 1000,                 # 虚拟用户数量
        "products_count": 500,               # 商品数量
        "categories_count": 20,              # 商品分类数量
        "events_per_second": 10,             # 每秒生成事件数
        
        # 用户行为权重分布
        "behavior_patterns": {
            "view": 0.5,                     # 50% 浏览行为
            "click": 0.3,                    # 30% 点击行为
            "add_to_cart": 0.15,             # 15% 加购物车
            "purchase": 0.03,                # 3% 购买行为
            "rate": 0.02                     # 2% 评价行为
        },
        
        # 商品价格范围
        "price_range": {
            "min": 10.0,                     # 最低价格
            "max": 1000.0                    # 最高价格
        },
        
        # 支持的设备类型
        "devices": ["mobile", "desktop", "tablet"],
        
        # 支持的地理位置
        "locations": ["北京", "上海", "广州", "深圳", "杭州"]
    }

    # =============================================================================
    # 日志系统配置
    # =============================================================================
    
    LOGGING_CONFIG = {
        "version": 1,
        "disable_existing_loggers": False,
        
        # 日志格式定义
        "formatters": {
            "detailed": {
                "format": "[%(asctime)s] [%(levelname)s] [%(name)s.%(funcName)s:%(lineno)d] %(message)s",
                "datefmt": "%Y-%m-%d %H:%M:%S"
            },
            "simple": {
                "format": "[%(levelname)s] %(message)s"
            }
        },
        
        # 日志处理器定义
        "handlers": {
            # 控制台输出
            "console": {
                "class": "logging.StreamHandler",
                "level": "INFO",
                "formatter": "detailed",
                "stream": "ext://sys.stdout"
            },
            
            # 文件输出
            "file": {
                "class": "logging.handlers.RotatingFileHandler",
                "level": "DEBUG",
                "formatter": "detailed",
                "filename": str(PYTHON_PROJECT_DIR / "logs" / "app.log"),
                "maxBytes": 10485760,    # 10MB
                "backupCount": 5,
                "encoding": "utf-8"
            },
            
            # 错误日志文件
            "error_file": {
                "class": "logging.handlers.RotatingFileHandler",
                "level": "ERROR",
                "formatter": "detailed",
                "filename": str(PYTHON_PROJECT_DIR / "logs" / "error.log"),
                "maxBytes": 10485760,    # 10MB
                "backupCount": 3,
                "encoding": "utf-8"
            }
        },
        
        # 日志记录器定义
        "loggers": {
            # Spark相关日志
            "py4j": {
                "level": "WARN",
                "handlers": ["console"],
                "propagate": False
            },
            "pyspark": {
                "level": "WARN", 
                "handlers": ["console"],
                "propagate": False
            },
            
            # Kafka相关日志
            "kafka": {
                "level": "INFO",
                "handlers": ["console", "file"],
                "propagate": False
            },
            
            # 应用日志
            "data_generator": {
                "level": "INFO",
                "handlers": ["console", "file"],
                "propagate": False
            },
            "spark_processor": {
                "level": "INFO", 
                "handlers": ["console", "file"],
                "propagate": False
            }
        },
        
        # 根日志记录器
        "root": {
            "level": os.getenv("LOG_LEVEL", "INFO"),
            "handlers": ["console", "file", "error_file"]
        }
    }


# =============================================================================
# 配置访问函数
# =============================================================================

def get_mongodb_url() -> str:
    """
    构建MongoDB连接URL
    
    支持带认证和不带认证的连接字符串
    
    返回：MongoDB连接URL字符串
    """
    config = Settings.MONGODB_CONFIG
    
    # 检查是否有有效的用户名和密码
    username = config.get("username")
    password = config.get("password")
    
    if username and password:
        # 带认证的连接字符串，添加authSource=admin
        return (f"mongodb://{username}:{password}@"
                f"{config['host']}:{config['port']}/{config['database']}?authSource=admin")
    else:
        # 不带认证的连接字符串  
        return f"mongodb://{config['host']}:{config['port']}/{config['database']}"


def get_mongodb_config() -> Dict[str, Any]:
    """
    获取MongoDB配置
    
    返回：包含连接URL和其他配置的字典
    """
    config = Settings.MONGODB_CONFIG.copy()
    config["url"] = get_mongodb_url()
    return config


def get_redis_config() -> Dict[str, Any]:
    """
    获取Redis配置
    
    返回：Redis连接配置字典
    """
    return Settings.REDIS_CONFIG.copy()


def get_kafka_config() -> Dict[str, Any]:
    """
    获取Kafka配置
    
    返回：Kafka连接和主题配置字典
    """
    return Settings.KAFKA_CONFIG.copy()


def get_spark_config() -> Dict[str, Any]:
    """
    获取Spark配置
    
    返回：Spark应用配置字典
    """
    return Settings.SPARK_CONFIG.copy()


def ensure_directories():
    """
    确保必要的目录存在
    
    创建日志目录、检查点目录、临时目录等
    """
    directories = [
        Settings.SPARK_CHECKPOINT_DIR_ABS,
        Settings.SPARK_WAREHOUSE_DIR_ABS, 
        Settings.SPARK_TMP_DIR_ABS,
        str(PYTHON_PROJECT_DIR / "logs"),
        str(PYTHON_PROJECT_DIR / "models")
    ]
    
    for directory in directories:
        Path(directory).mkdir(parents=True, exist_ok=True)
        print(f"[SETTINGS_INFO] 确保目录存在: {directory}")


# =============================================================================
# 全局配置实例
# =============================================================================

# 创建全局配置实例
settings = Settings()

# 确保必要目录存在
ensure_directories()

# 输出配置摘要
print(f"[SETTINGS_INFO] 系统配置加载完成:")
print(f"[SETTINGS_INFO] - 应用名称: {settings.APP_NAME} v{settings.APP_VERSION}")
print(f"[SETTINGS_INFO] - API服务: {settings.API_HOST}:{settings.API_PORT}")
print(f"[SETTINGS_INFO] - MongoDB: {get_mongodb_config()['host']}:{get_mongodb_config()['port']}")
print(f"[SETTINGS_INFO] - Redis: {settings.REDIS_CONFIG['host']}:{settings.REDIS_CONFIG['port']}")
print(f"[SETTINGS_INFO] - Kafka: {settings.KAFKA_CONFIG['bootstrap_servers']}")
print(f"[SETTINGS_INFO] - Spark主模式: {settings.SPARK_CONFIG['master']}")
print(f"[SETTINGS_INFO] - 调试模式: {'开启' if settings.DEBUG else '关闭'}")