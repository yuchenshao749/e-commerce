#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
电商实时数据分析系统 - Spark流处理器
================================================================

文件作用：
    这是系统的核心数据处理引擎，基于Apache Spark Streaming构建：
    1. 实时接收Kafka中的用户行为数据
    2. 进行流式数据处理和聚合计算
    3. 计算实时业务指标（活跃用户数、转化率等）
    4. 将处理结果存储到MongoDB和Redis
    5. 支持容错处理和检查点机制

主要功能模块：
    - Kafka数据源集成：从消息队列读取用户行为事件
    - 实时数据解析：解析JSON格式的用户行为数据
    - 流式聚合计算：计算实时统计指标和热门商品/分类
    - 数据存储：批量写入MongoDB和更新Redis缓存
    - 检查点管理：确保数据处理的可靠性和一致性

技术特性：
    - 基于Apache Spark 3.5.0的流处理
    - 支持微批处理（Micro-batch）模式
    - 自动容错和故障恢复
    - 内存优化和性能调优
    - 灵活的批处理间隔配置

数据流向：
    Kafka Topics → Spark DataFrame → 数据解析 → 聚合计算 → MongoDB/Redis

支持的数据源：
    - user_behavior_topic: 用户行为事件数据

输出存储：
    - MongoDB: 原始数据和统计结果持久化
    - Redis: 实时数据缓存，供API快速查询

作者: AI Assistant
创建时间: 2025-05-31
版本: 1.0.0
================================================================
"""

import sys
import os
from pathlib import Path
import json
import logging
from datetime import datetime, timedelta
from typing import Dict, Any, List
import signal
import atexit
import time
import glob

# 添加项目根目录到Python路径
project_root_for_sys_path = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(project_root_for_sys_path))


def setup_environment_for_spark():
    """
    自动检测和配置Spark运行环境
    
    功能：
        1. 检测和设置JAVA_HOME环境变量
        2. 配置HADOOP_HOME和相关路径
        3. 设置PySpark Python解释器路径
        4. 优化JVM参数配置
    
    支持的Java版本：8, 11, 17
    支持的操作系统：Windows, macOS, Linux
    """
    logger_func = logging.getLogger(f"{__name__}.setup_environment_for_spark")

    # 1. 设置JAVA_HOME
    java_home = os.getenv('JAVA_HOME')
    if not java_home or not Path(java_home).is_dir():
        logger_func.warning("[ENV_SETUP] JAVA_HOME 未在环境中有效设置，尝试自动检测...")
        java_search_paths = [
            "C:\\Program Files\\Java\\openjdk-8", "C:\\Program Files\\Java\\jdk-8",
            "C:\\Program Files\\OpenJDK\\jdk-8u*", "C:\\Program Files\\AdoptOpenJDK\\jdk-8*",
            "C:\\Program Files\\Amazon Corretto\\jdk8*",
        ]
        detected_java_home = None
        for pattern in java_search_paths:
            try:
                matches = glob.glob(pattern)
                if matches:
                    for match_path in matches:
                        if Path(match_path).is_dir():
                            detected_java_home = str(Path(match_path).resolve())
                            break
                    if detected_java_home: 
                        break
            except Exception as e:
                logger_func.debug(f"检查Java路径'{pattern}'出错: {e}")

        if detected_java_home:
            java_home = detected_java_home
            os.environ['JAVA_HOME'] = java_home
            logger_func.info(f"[ENV_SETUP] 已自动检测并设置 JAVA_HOME: {java_home}")
        else:
            logger_func.error("[ENV_SETUP_ERROR] JAVA_HOME 未能自动检测，请手动设置")
    else:
        logger_func.info(f"[ENV_SETUP] 使用系统已设置的 JAVA_HOME: {java_home}")

    # 添加Java bin目录到PATH
    if java_home and Path(java_home).is_dir():
        java_bin_path = Path(java_home) / "bin"
        if java_bin_path.is_dir():
            if str(java_bin_path) not in os.environ.get('PATH', ''):
                os.environ['PATH'] = str(java_bin_path) + os.pathsep + os.environ.get('PATH', '')
                logger_func.info(f"[ENV_SETUP] 已将 JAVA_HOME/bin 添加到 PATH")

    # 2. 设置HADOOP_HOME
    logger_func.info("[ENV_SETUP] 正在处理 HADOOP_HOME...")
    system_hadoop_home = os.getenv('HADOOP_HOME')

    if system_hadoop_home and Path(system_hadoop_home).is_dir():
        logger_func.info(f"[ENV_SETUP] 检测到系统环境变量 HADOOP_HOME: {system_hadoop_home}")
        
        # 检查关键文件
        system_hadoop_bin_path = Path(system_hadoop_home) / "bin"
        if system_hadoop_bin_path.is_dir():
            winutils_path = system_hadoop_bin_path / "winutils.exe"
            hadoop_dll_path = system_hadoop_bin_path / "hadoop.dll"

            if winutils_path.exists() and hadoop_dll_path.exists():
                logger_func.info("[ENV_SETUP] 系统 HADOOP_HOME 配置有效")
                if str(system_hadoop_bin_path) not in os.environ.get('PATH', ''):
                    os.environ['PATH'] = str(system_hadoop_bin_path) + os.pathsep + os.environ.get('PATH', '')
                    logger_func.info("[ENV_SETUP] 已将 HADOOP_HOME/bin 添加到 PATH")
            else:
                logger_func.warning(f"[ENV_SETUP_WARN] HADOOP_HOME 下缺少必要文件: winutils.exe 或 hadoop.dll")
    else:
        logger_func.info("[ENV_SETUP] 系统环境变量 HADOOP_HOME 未设置或无效")

    # 3. 设置PySpark Python路径
    python_executable = sys.executable
    os.environ['PYSPARK_PYTHON'] = python_executable
    os.environ['PYSPARK_DRIVER_PYTHON'] = python_executable
    logger_func.info(f"[ENV_SETUP] PYSPARK_PYTHON 设置为: {python_executable}")

    logger_func.info("[ENV_SETUP] 环境设置完成")


# 在导入PySpark之前设置环境
setup_environment_for_spark()

# 导入PySpark相关模块
from pyspark.sql import SparkSession
from pyspark.sql.functions import col, from_json, to_timestamp, countDistinct, sum as _sum, when, desc
from pyspark.sql.types import StructType, StructField, StringType, IntegerType, DoubleType, TimestampType
from pyspark.sql.streaming import StreamingQuery

# 导入数据库连接库
import pymongo
import redis

# 导入项目配置和模块
from config.settings import get_spark_config, get_mongodb_config, get_redis_config, get_kafka_config, settings as project_settings

# 初始化日志记录器
logger = logging.getLogger(__name__)


class EcommerceStreamProcessor:
    """
    电商实时流处理器
    
    职责：
        1. 管理Spark应用的生命周期
        2. 配置和启动流处理任务
        3. 处理来自Kafka的实时数据流
        4. 执行数据聚合和统计计算
        5. 管理数据输出到存储系统
        6. 提供容错和故障恢复机制
    
    属性：
        spark: SparkSession实例
        mongo_client: MongoDB客户端连接
        redis_client: Redis客户端连接
        queries: 活跃的流查询列表
        spark_config_dict: Spark配置参数
        
    方法：
        start_processing(): 启动流处理
        stop_processing(): 停止流处理
        _process_batch_data(): 处理每个数据批次
    """
    
    def __init__(self):
        """
        初始化流处理器
        
        步骤：
            1. 加载系统配置
            2. 初始化Spark会话
            3. 建立数据库连接
            4. 设置流查询管理
        """
        # 加载配置
        self.spark_config_dict = get_spark_config()
        self.mongodb_config = get_mongodb_config()
        self.redis_config = get_redis_config()
        self.kafka_config = get_kafka_config()

        # 初始化组件
        self.spark: SparkSession = None
        self.mongo_client: pymongo.MongoClient = None
        self.redis_client: redis.Redis = None
        self.queries: List[StreamingQuery] = []

        # 设置Spark和数据库连接
        self._setup_spark()
        self._setup_connections()

    def _setup_spark(self):
        """
        初始化Spark会话
        
        功能：
            1. 根据配置创建SparkSession
            2. 应用性能优化参数
            3. 配置JAR依赖和类路径
            4. 设置JVM参数
            5. 测试Spark连接
        """
        try:
            logger.info("[SPARK_SETUP] 开始初始化Spark会话...")

            # 创建SparkSession Builder
            builder = SparkSession.builder \
                .appName(self.spark_config_dict["app_name"]) \
                .master(self.spark_config_dict["master"])

            # 配置JAR包依赖
            if self.spark_config_dict.get("packages") and isinstance(self.spark_config_dict["packages"], list) and \
                    self.spark_config_dict["packages"]:
                packages_str = ",".join(self.spark_config_dict["packages"])
                builder = builder.config("spark.jars.packages", packages_str)
                logger.info(f"[SPARK_SETUP] 配置Maven包: {packages_str}")

            # 应用系统配置中的所有Spark参数
            if self.spark_config_dict.get("config") and isinstance(self.spark_config_dict["config"], dict):
                logger.info(f"[SPARK_SETUP] 应用Spark配置项: {len(self.spark_config_dict['config'])}个")
                for key, value in self.spark_config_dict["config"].items():
                    if value is not None:  # 跳过None值的配置
                        builder = builder.config(key, value)

            # 重试连接机制
            max_retries = int(self.spark_config_dict.get("config", {}).get("spark.task.maxAttempts", 3))
            retry_delay = 10

            for attempt in range(max_retries):
                try:
                    logger.info(f"[SPARK_SETUP] Spark连接尝试 {attempt + 1}/{max_retries}")
                    self.spark = builder.getOrCreate()
                    
                    # 设置日志级别
                    self.spark.sparkContext.setLogLevel(
                        project_settings.SPARK_CONFIG.get("config", {}).get("spark.log.level", "WARN")
                    )

                    # 测试Spark连接
                    logger.info("[SPARK_SETUP] 执行Spark连接测试...")
                    test_df = self.spark.createDataFrame([("test_connection",)], ["value"])
                    test_df.count()
                    logger.info("[SPARK_SETUP] Spark连接测试成功")

                    # 输出JVM系统属性（调试用）
                    try:
                        jvm_java_library_path = self.spark.sparkContext._gateway.jvm.java.lang.System.getProperty("java.library.path")
                        jvm_hadoop_home_dir = self.spark.sparkContext._gateway.jvm.java.lang.System.getProperty("hadoop.home.dir")
                        logger.info(f"[SPARK_JVM] java.library.path: {jvm_java_library_path[:100]}..." if jvm_java_library_path else "[SPARK_JVM] java.library.path: 未设置")
                        logger.info(f"[SPARK_JVM] hadoop.home.dir: {jvm_hadoop_home_dir}" if jvm_hadoop_home_dir else "[SPARK_JVM] hadoop.home.dir: 未设置")
                    except Exception as e_jvm:
                        logger.debug(f"[SPARK_JVM] 无法获取JVM属性: {e_jvm}")

                    logger.info("[SPARK_SETUP] Spark会话初始化成功")
                    return

                except Exception as e:
                    logger.warning(f"[SPARK_SETUP] 连接尝试 {attempt + 1} 失败: {e}")
                    if attempt < max_retries - 1:
                        logger.info(f"[SPARK_SETUP] {retry_delay}秒后重试...")
                        time.sleep(retry_delay)
                        if self.spark:
                            try:
                                self.spark.stop()
                            except:
                                pass
                            self.spark = None
                    else:
                        logger.error("[SPARK_SETUP] 所有连接尝试均失败")
                        raise

        except Exception as e:
            logger.error(f"[SPARK_SETUP] Spark初始化失败: {e}", exc_info=True)
            raise

    def _setup_connections(self):
        """
        设置数据库连接
        
        功能：
            1. 建立MongoDB连接并测试
            2. 建立Redis连接并测试
            3. 验证连接可用性
        """
        try:
            # MongoDB连接
            self.mongo_client = pymongo.MongoClient(self.mongodb_config["url"])
            self.mongo_db = self.mongo_client[self.mongodb_config["database"]]

            # 测试MongoDB连接
            self.mongo_client.admin.command('ping')
            logger.info("[DATABASE] MongoDB连接成功")

            # Redis连接
            redis_config = get_redis_config()
            
            # 构建Redis连接参数，如果密码为None则不传递password参数
            redis_kwargs = {
                "host": redis_config["host"],
                "port": redis_config["port"],
                "db": redis_config["db"],
                "decode_responses": redis_config["decode_responses"]
            }
            
            # 只有在密码不为None时才添加password参数
            if redis_config.get("password") is not None:
                redis_kwargs["password"] = redis_config["password"]
                
            self.redis_client = redis.Redis(**redis_kwargs)

            # 测试Redis连接
            self.redis_client.ping()
            logger.info("[DATABASE] Redis连接成功")

        except Exception as e:
            logger.error(f"[DATABASE] 数据库连接失败: {e}")
            raise

    def _get_user_behavior_schema(self) -> StructType:
        """
        定义用户行为数据的Spark SQL结构
        
        返回：StructType，包含所有可能的用户行为字段
        
        支持的字段：
            - 基础字段：user_id, action_type, product_id, timestamp等
            - 商品信息：category_id, price, quantity等
            - 设备信息：device, location, ip_address等
            - 行为详情：view_duration, rating, payment_method等
        """
        return StructType([
            StructField("user_id", StringType(), True),
            StructField("action_type", StringType(), True),
            StructField("product_id", StringType(), True),
            StructField("category_id", StringType(), True),
            StructField("timestamp", StringType(), True),
            StructField("device", StringType(), True),
            StructField("location", StringType(), True),
            StructField("session_id", StringType(), True),
            StructField("ip_address", StringType(), True),
            StructField("quantity", IntegerType(), True),
            StructField("price", DoubleType(), True),
            StructField("total_amount", DoubleType(), True),
            StructField("payment_method", StringType(), True),
            StructField("discount", DoubleType(), True),
            StructField("rating", IntegerType(), True),
            StructField("review_text", StringType(), True),
            StructField("view_duration", IntegerType(), True),
            StructField("page_type", StringType(), True),
            StructField("click_position", IntegerType(), True),
            StructField("kafka_timestamp", StringType(), True)
        ])

    def _read_kafka_stream(self, topic: str):
        """
        从Kafka主题读取流数据
        
        参数：
            topic: Kafka主题名称
            
        返回：Spark DataFrame流
        
        配置：
            - 从最新偏移量开始读取
            - 支持容错处理
            - 限制每次处理的最大偏移量
        """
        return self.spark \
            .readStream \
            .format("kafka") \
            .option("kafka.bootstrap.servers", self.kafka_config["bootstrap_servers"]) \
            .option("subscribe", topic) \
            .option("startingOffsets", "latest") \
            .option("maxOffsetsPerTrigger", 1000) \
            .option("failOnDataLoss", "false") \
            .load()

    def _parse_user_behavior_data(self, kafka_df):
        """
        解析用户行为数据
        
        参数：
            kafka_df: 来自Kafka的原始DataFrame
            
        返回：解析后的结构化DataFrame
        
        处理步骤：
            1. 解析JSON格式的消息体
            2. 展开嵌套字段为列
            3. 转换时间戳格式
            4. 添加接收时间戳
        """
        schema = self._get_user_behavior_schema()

        # 解析JSON数据并展开为列
        parsed_df = kafka_df.select(
            from_json(col("value").cast("string"), schema).alias("data"),
            col("timestamp").alias("kafka_receive_time")
        ).select("data.*", "kafka_receive_time")

        # 转换时间戳格式
        return parsed_df.withColumn(
            "timestamp",
            to_timestamp(col("timestamp"), "yyyy-MM-dd'T'HH:mm:ss.SSSSSS")
        ).withColumn(
            "kafka_timestamp",
            to_timestamp(col("kafka_timestamp"), "yyyy-MM-dd'T'HH:mm:ss.SSSSSS")
        )

    def _write_to_mongodb(self, batch_df, batch_id):
        """
        将批处理数据写入MongoDB
        
        参数：
            batch_df: 批处理数据的DataFrame
            batch_id: 批次ID
            
        功能：
            1. 转换Spark DataFrame为pandas DataFrame
            2. 处理时间戳和数据类型
            3. 清理无效数据
            4. 批量插入MongoDB
        """
        try:
            if batch_df.count() > 0:
                # 处理时间戳类型，避免pandas转换错误
                processed_df = batch_df
                
                # 将时间戳列转换为字符串类型
                time_columns = ['timestamp', 'kafka_timestamp', 'kafka_receive_time']
                for col_name in time_columns:
                    if col_name in processed_df.columns:
                        processed_df = processed_df.withColumn(
                            col_name, 
                            col(col_name).cast("string")
                        )
                
                # 转换为pandas DataFrame
                pandas_df = processed_df.toPandas()

                # 处理NaN值
                pandas_df = pandas_df.fillna({
                    'quantity': 0,
                    'price': 0.0,
                    'total_amount': 0.0,
                    'discount': 0.0,
                    'rating': 0,
                    'view_duration': 0,
                    'click_position': 0
                })

                # 转换为字典列表并清理数据
                records = pandas_df.to_dict('records')
                cleaned_records = []
                for record in records:
                    cleaned_record = {}
                    for key, value in record.items():
                        if str(value) == 'nan' or str(value) == 'None':
                            cleaned_record[key] = None
                        elif isinstance(value, (int, float, str, bool)):
                            cleaned_record[key] = value
                        else:
                            cleaned_record[key] = str(value)
                    cleaned_records.append(cleaned_record)

                # 批量插入MongoDB
                if cleaned_records:
                    collection = self.mongo_db[self.mongodb_config["collections"]["user_behavior"]]
                    collection.insert_many(cleaned_records)
                    logger.info(f"[BATCH_{batch_id}] MongoDB写入 {len(cleaned_records)} 条记录")

        except Exception as e:
            logger.error(f"[BATCH_{batch_id}] MongoDB写入失败: {e}")
            import traceback
            logger.debug(f"错误详情: {traceback.format_exc()}")

    def _update_real_time_stats(self, batch_df, batch_id):
        """
        更新实时统计数据
        
        参数：
            batch_df: 批处理数据的DataFrame
            batch_id: 批次ID
            
        功能：
            1. 计算基础业务指标
            2. 统计热门商品和分类
            3. 计算转化率
            4. 更新Redis缓存
            5. 存储到MongoDB
            6. 更新累积热门商品和分类统计
        """
        try:
            if batch_df.count() == 0:
                logger.debug(f"[BATCH_{batch_id}] 无数据需要处理")
                return

            current_time = datetime.now()

            # 计算基础统计指标
            stats = batch_df.agg(
                countDistinct("user_id").alias("active_users"),
                _sum(when(col("action_type") == "view", 1).otherwise(0)).alias("page_views"),
                _sum(when(col("action_type") == "purchase", 1).otherwise(0)).alias("purchases"),
                _sum(when(col("action_type") == "purchase", col("total_amount")).otherwise(0)).alias("revenue")
            ).collect()[0]

            # 计算热门商品（基于浏览和点击）
            popular_products_df = batch_df \
                .filter(col("action_type").isin(["view", "click"])) \
                .groupBy("product_id") \
                .count() \
                .orderBy(desc("count")) \
                .limit(5)
            
            popular_products = popular_products_df.collect()

            # 计算热门分类
            popular_categories_df = batch_df \
                .filter(col("action_type").isin(["view", "click"])) \
                .groupBy("category_id") \
                .count() \
                .orderBy(desc("count")) \
                .limit(5)
            
            popular_categories = popular_categories_df.collect()

            # 更新累积热门商品统计
            self._update_popular_products(batch_df, batch_id)
            
            # 更新累积热门分类统计
            self._update_popular_categories(batch_df, batch_id)

            # 构建统计数据结构
            active_users_count = stats["active_users"] or 0
            page_views_count = stats["page_views"] or 0
            purchases_count = stats["purchases"] or 0
            revenue_amount = float(stats["revenue"] or 0.0)
            
            real_time_stats = {
                "active_users": active_users_count,
                "page_views": page_views_count,
                "purchases": purchases_count,
                "revenue": revenue_amount,
                "conversion_rate": (purchases_count / page_views_count * 100) if page_views_count > 0 else 0,
                "popular_products": [
                    {"product_id": row["product_id"], "interactions": row["count"]}
                    for row in popular_products
                ],
                "popular_categories": [
                    {"category_id": row["category_id"], "interactions": row["count"]}
                    for row in popular_categories
                ],
                "timestamp": current_time.isoformat(),
                "batch_id": batch_id,
                "time_window": "实时数据",
                "total_data_points": batch_df.count()
            }

            # 存储到Redis（实时缓存）
            redis_key = "real_time_stats:current"
            self.redis_client.setex(
                redis_key,
                self.redis_config["cache_ttl"]["real_time_stats"],
                json.dumps(real_time_stats, ensure_ascii=False)
            )

            # 存储到MongoDB（持久化）
            stats_collection = self.mongo_db[self.mongodb_config["collections"]["real_time_stats"]]
            stats_collection.insert_one(real_time_stats)

            logger.info(f"[BATCH_{batch_id}] 统计更新完成 - 活跃用户: {active_users_count}, "
                        f"页面浏览: {page_views_count}, 购买: {purchases_count}, 收入: {revenue_amount:.2f}")

        except Exception as e:
            logger.error(f"[BATCH_{batch_id}] 统计更新失败: {e}")
            import traceback
            logger.debug(f"错误详情: {traceback.format_exc()}")

    def _update_popular_products(self, batch_df, batch_id):
        """
        更新热门商品的累积统计
        
        参数：
            batch_df: 批处理数据的DataFrame
            batch_id: 批次ID
        """
        try:
            # 统计当前批次中每个商品的互动次数
            product_interactions = batch_df \
                .filter(col("action_type").isin(["view", "click", "add_to_cart", "purchase"])) \
                .groupBy("product_id") \
                .count() \
                .collect()
            
            if not product_interactions:
                return

            # 获取MongoDB集合
            products_collection = self.mongo_db.popular_products

            # 批量更新商品统计
            for row in product_interactions:
                product_id = row["product_id"]
                interactions = row["count"]

                # 使用upsert操作累积统计数据
                products_collection.update_one(
                    {"product_id": product_id},
                    {
                        "$inc": {"interactions": interactions},
                        "$set": {
                            "last_updated": datetime.now().isoformat(),
                            "batch_id": batch_id
                        },
                        "$setOnInsert": {
                            "product_id": product_id,
                            "name": f"商品 {product_id}",
                            "category": "电子商品",
                            "created_at": datetime.now().isoformat()
                        }
                    },
                    upsert=True
                )

            logger.debug(f"[BATCH_{batch_id}] 更新了 {len(product_interactions)} 个商品的统计")

        except Exception as e:
            logger.error(f"[BATCH_{batch_id}] 更新热门商品统计失败: {e}")

    def _update_popular_categories(self, batch_df, batch_id):
        """
        更新热门分类的累积统计
        
        参数：
            batch_df: 批处理数据的DataFrame
            batch_id: 批次ID
        """
        try:
            # 统计当前批次中每个分类的互动次数
            category_interactions = batch_df \
                .filter(col("action_type").isin(["view", "click", "add_to_cart", "purchase"])) \
                .groupBy("category_id") \
                .count() \
                .collect()
            
            if not category_interactions:
                return

            # 获取MongoDB集合
            categories_collection = self.mongo_db.popular_categories

            # 批量更新分类统计
            for row in category_interactions:
                category_id = row["category_id"]
                interactions = row["count"]

                # 使用upsert操作累积统计数据
                categories_collection.update_one(
                    {"category_id": category_id},
                    {
                        "$inc": {"interactions": interactions},
                        "$set": {
                            "last_updated": datetime.now().isoformat(),
                            "batch_id": batch_id
                        },
                        "$setOnInsert": {
                            "category_id": category_id,
                            "name": f"分类 {category_id}",
                            "products_count": 0,
                            "created_at": datetime.now().isoformat()
                        }
                    },
                    upsert=True
                )

            logger.debug(f"[BATCH_{batch_id}] 更新了 {len(category_interactions)} 个分类的统计")

        except Exception as e:
            logger.error(f"[BATCH_{batch_id}] 更新热门分类统计失败: {e}")

    def _process_user_behavior_stream(self):
        """
        处理用户行为流数据
        
        功能：
            1. 读取Kafka数据流
            2. 解析用户行为数据
            3. 配置流处理查询
            4. 设置检查点机制
            5. 启动流处理任务
        """
        try:
            # 从Kafka读取数据流
            kafka_df = self._read_kafka_stream(self.kafka_config["topics"]["user_behavior"])
            behavior_df = self._parse_user_behavior_data(kafka_df)

            # 检查点配置
            checkpoint_location = project_settings.SPARK_CONFIG.get("checkpoint_dir")
            
            if not checkpoint_location:
                logger.error("[STREAM_PROC] Spark检查点目录未配置")
                # 使用控制台输出进行测试
                logger.warning("[STREAM_PROC] 检查点目录未配置，将输出到控制台进行测试")
                query = behavior_df.writeStream \
                    .format("console") \
                    .option("truncate", "false") \
                    .option("numRows", 5) \
                    .trigger(processingTime=f"{self.spark_config_dict['streaming_interval']} seconds") \
                    .start()
                logger.info("[STREAM_PROC] 用户行为流处理启动成功（控制台模式）")
            else:
                # 确保检查点目录存在
                Path(checkpoint_location.replace("file:///", "")).mkdir(parents=True, exist_ok=True)
                logger.info(f"[STREAM_PROC] 使用检查点目录: {checkpoint_location}")
                
                # 使用foreachBatch进行真正的数据处理
                query = behavior_df.writeStream \
                    .foreachBatch(self._process_batch_data) \
                    .option("checkpointLocation", checkpoint_location) \
                    .trigger(processingTime=f"{self.spark_config_dict['streaming_interval']} seconds") \
                    .start()
                logger.info("[STREAM_PROC] 用户行为流处理启动成功（foreachBatch模式）")

            self.queries.append(query)

        except Exception as e:
            logger.error(f"[STREAM_PROC] 用户行为流处理启动失败: {e}", exc_info=True)
            raise

    def _process_batch_data(self, batch_df, batch_id):
        """
        处理每个批次的数据
        
        参数：
            batch_df: 当前批次的DataFrame
            batch_id: 批次唯一标识符
            
        功能：
            1. 验证数据有效性
            2. 调用数据写入方法
            3. 更新实时统计
            4. 记录处理日志
        """
        try:
            logger.debug(f"[BATCH_{batch_id}] 开始处理批次")
            
            # 检查数据量
            record_count = batch_df.count()
            if record_count == 0:
                logger.debug(f"[BATCH_{batch_id}] 批次无数据")
                return
            
            logger.info(f"[BATCH_{batch_id}] 处理 {record_count} 条记录")
            
            # 显示样本数据（调试用）
            if logger.isEnabledFor(logging.DEBUG):
                batch_df.show(5, truncate=False)
            
            # 写入MongoDB
            self._write_to_mongodb(batch_df, batch_id)
            
            # 更新实时统计
            self._update_real_time_stats(batch_df, batch_id)
            
            logger.info(f"[BATCH_{batch_id}] 批次处理完成")
            
        except Exception as e:
            logger.error(f"[BATCH_{batch_id}] 批次处理失败: {e}", exc_info=True)

    def start_processing(self):
        """
        启动流处理服务
        
        功能：
            1. 初始化流处理任务
            2. 启动用户行为数据流处理
            3. 注册流查询
            4. 监控处理状态
        """
        try:
            logger.info("[START] 启动Spark流处理服务...")
            
            # 启动用户行为流处理
            self._process_user_behavior_stream()

            logger.info("[SUCCESS] 所有流处理任务已启动")

        except Exception as e:
            logger.error(f"[ERROR] 流处理启动失败: {e}")
            raise

    def stop_processing(self):
        """
        停止流处理服务
        
        功能：
            1. 优雅停止所有流查询
            2. 等待查询完成
            3. 关闭Spark会话
            4. 关闭数据库连接
        """
        try:
            logger.info("[STOP] 停止流处理服务...")

            # 停止所有流查询
            for i, query in enumerate(self.queries):
                if query.isActive:
                    logger.info(f"[STOP] 停止流查询 {i+1}")
                    query.stop()

            # 等待所有查询停止
            for i, query in enumerate(self.queries):
                logger.info(f"[STOP] 等待流查询 {i+1} 完成...")
                query.awaitTermination(timeout=30)

            # 关闭Spark会话
            if self.spark:
                logger.info("[STOP] 关闭Spark会话...")
                self.spark.stop()

            # 关闭数据库连接
            if self.mongo_client:
                logger.info("[STOP] 关闭MongoDB连接...")
                self.mongo_client.close()

            if self.redis_client:
                logger.info("[STOP] 关闭Redis连接...")
                self.redis_client.close()

            logger.info("[SUCCESS] 流处理服务已停止")

        except Exception as e:
            logger.error(f"[ERROR] 停止流处理时出错: {e}")


def run_stream_processor():
    """
    运行流处理器的主函数
    
    功能：
        - 创建流处理器实例
        - 设置信号处理器
        - 启动处理并等待完成
        - 处理中断信号
        - 确保资源清理
    
    用途：
        - 被main.py的多进程管理器调用
        - 可以作为独立脚本运行
    """
    processor = EcommerceStreamProcessor()

    def signal_handler(signum, frame):
        logger.info("接收到停止信号，正在关闭流处理器...")
        processor.stop_processing()
        sys.exit(0)

    # 注册信号处理器
    signal.signal(signal.SIGINT, signal_handler)
    signal.signal(signal.SIGTERM, signal_handler)

    # 注册退出清理函数
    atexit.register(processor.stop_processing)

    try:
        # 启动流处理
        processor.start_processing()
        
        # 等待所有流查询完成
        for query in processor.queries:
            query.awaitTermination()

    except KeyboardInterrupt:
        logger.info("接收到中断信号，停止流处理器")
    except Exception as e:
        logger.error(f"流处理器运行失败: {e}", exc_info=True)
    finally:
        logger.info("确保流处理器资源清理...")
        processor.stop_processing()


if __name__ == "__main__":
    import logging
    import logging.config
    from config.settings import settings as project_settings

    # 应用日志配置
    if hasattr(project_settings, 'LOGGING_CONFIG'):
        logging.config.dictConfig(project_settings.LOGGING_CONFIG)

    logger = logging.getLogger(__name__)

    logger.info("[MAIN] 启动电商Spark流处理器...")
    run_stream_processor()
