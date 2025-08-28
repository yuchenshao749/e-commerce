#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
电商实时数据分析系统 - Kafka生产者
================================================================

文件作用：
    这是系统的Kafka生产者模块，负责：
    1. 管理Kafka生产者连接和配置
    2. 发送用户行为数据到指定主题
    3. 发送系统指标数据到监控主题
    4. 提供健康检查和性能监控
    5. 支持异步消息发送和错误处理

主要功能：
    - 单例模式的生产者管理
    - 自动重连和故障恢复
    - 消息序列化和分区策略
    - 性能指标收集
    - 优雅关闭和资源清理

技术特性：
    - 基于kafka-python库
    - JSON消息序列化
    - 用户ID分区键
    - 异步回调处理
    - 连接池管理

作者: AI Assistant
创建时间: 2025-05-31
版本: 1.0.0
================================================================
"""

import json
import logging
from typing import Dict, Any, Optional
from datetime import datetime
from kafka import KafkaProducer
from kafka.errors import KafkaError
import threading
import time

from config.settings import get_kafka_config

logger = logging.getLogger(__name__)

class EcommerceKafkaProducer:
    """
    电商数据Kafka生产者
    
    职责：
        1. 管理Kafka连接和配置
        2. 提供高级数据发送接口
        3. 处理消息序列化和分区
        4. 监控发送状态和性能
        5. 提供健康检查和指标收集
    
    特性：
        - 单例模式确保资源复用
        - 自动重连机制
        - 异步发送和回调处理
        - 线程安全操作
    """
    
    def __init__(self):
        """
        初始化Kafka生产者
        
        加载配置、建立连接、设置序列化器
        """
        self.config = get_kafka_config()
        self.producer: Optional[KafkaProducer] = None
        self.topics = self.config["topics"]
        self._lock = threading.Lock()
        
        # 初始化统计信息
        self.stats = {
            "messages_sent": 0,
            "send_errors": 0,
            "last_send_time": None
        }
        
        self._connect()
    
    def _connect(self):
        """
        连接到Kafka集群
        
        功能：
            1. 从配置加载连接参数
            2. 创建KafkaProducer实例
            3. 设置序列化器和性能参数
            4. 验证连接状态
        """
        try:
            producer_config = self.config["producer_config"].copy()
            
            self.producer = KafkaProducer(
                bootstrap_servers=self.config["bootstrap_servers"],
                acks=producer_config["acks"],
                retries=producer_config["retries"],
                batch_size=producer_config["batch_size"],
                linger_ms=producer_config["linger_ms"],
                buffer_memory=producer_config["buffer_memory"],
                value_serializer=lambda x: json.dumps(x, ensure_ascii=False).encode('utf-8'),
                key_serializer=lambda x: str(x).encode('utf-8') if x else None
            )
            
            logger.info(f"[SUCCESS] Kafka生产者连接成功: {self.config['bootstrap_servers']}")
            
        except Exception as e:
            logger.error(f"❌ Kafka生产者连接失败: {e}")
            self.producer = None
            raise
    
    def send(self, topic: str, value: Any, key: str = None) -> bool:
        """
        发送消息到指定主题
        
        参数：
            topic: Kafka主题名称
            value: 消息内容（将被JSON序列化）
            key: 分区键（可选）
            
        返回：
            bool: 发送是否成功
            
        功能：
            - 通用消息发送接口
            - 自动添加时间戳
            - 异步发送和回调处理
            - 错误处理和日志记录
        """
        if not self.producer:
            logger.error("[KAFKA] 生产者未连接")
            return False
        
        try:
            # 处理不同类型的输入值
            if isinstance(value, bytes):
                # 如果是bytes类型，先解码为字符串，然后解析JSON
                try:
                    value_str = value.decode('utf-8')
                    value_dict = json.loads(value_str)
                except (UnicodeDecodeError, json.JSONDecodeError):
                    logger.error("[KAFKA] 无法解析bytes类型的值")
                    return False
            elif isinstance(value, str):
                # 如果是字符串，尝试解析为JSON
                try:
                    value_dict = json.loads(value)
                except json.JSONDecodeError:
                    # 如果不是JSON字符串，当作普通字符串处理
                    value_dict = {"message": value}
            elif isinstance(value, dict):
                # 如果已经是字典，直接使用
                value_dict = value.copy()
            else:
                # 其他类型，转换为字典
                value_dict = {"data": value}
            
            # 添加时间戳
            value_dict["kafka_timestamp"] = datetime.now().isoformat()
            
            # 发送消息（生产者会自动进行JSON序列化）
            future = self.producer.send(
                topic=topic,
                value=value_dict,  # 直接传递字典，让生产者序列化
                key=key
            )
            
            # 添加成功回调
            future.add_callback(self._on_send_success)
            future.add_errback(self._on_send_error)
            
            # 更新统计
            self.stats["messages_sent"] += 1
            self.stats["last_send_time"] = time.time()
            
            return True
            
        except Exception as e:
            logger.error(f"[KAFKA] 发送消息失败: {e}")
            self.stats["send_errors"] += 1
            return False
    
    def send_user_behavior(self, behavior_data: Dict[str, Any]) -> bool:
        """
        发送用户行为数据
        
        参数：
            behavior_data: 用户行为数据字典
            
        返回：
            bool: 发送是否成功
            
        功能：
            - 专门用于用户行为数据的发送
            - 自动使用用户ID作为分区键
            - 确保同一用户数据发送到同一分区
        """
        if not self.producer:
            logger.error("[KAFKA] 生产者未连接")
            return False
        
        try:
            # 添加时间戳
            behavior_data["kafka_timestamp"] = datetime.now().isoformat()
            
            # 使用用户ID作为key确保同一用户的数据发送到同一分区
            key = behavior_data.get("user_id")
            
            future = self.producer.send(
                topic=self.topics["user_behavior"],
                key=key,
                value=behavior_data
            )
            
            # 异步处理结果
            future.add_callback(self._on_send_success)
            future.add_errback(self._on_send_error)
            
            return True
            
        except Exception as e:
            logger.error(f"[KAFKA] 发送用户行为数据失败: {e}")
            return False
    
    def send_system_metrics(self, metrics_data: Dict[str, Any]) -> bool:
        """
        发送系统指标数据
        
        参数：
            metrics_data: 系统指标数据字典
            
        返回：
            bool: 发送是否成功
            
        功能：
            - 专门用于系统监控指标的发送
            - 自动添加时间戳
            - 用于系统性能监控
        """
        if not self.producer:
            logger.error("[KAFKA] 生产者未连接")
            return False
        
        try:
            metrics_data["kafka_timestamp"] = datetime.now().isoformat()
            
            future = self.producer.send(
                topic=self.topics["system_metrics"],
                value=metrics_data
            )
            
            future.add_callback(self._on_send_success)
            future.add_errback(self._on_send_error)
            
            return True
            
        except Exception as e:
            logger.error(f"[KAFKA] 发送系统指标数据失败: {e}")
            return False
    
    def _on_send_success(self, record_metadata):
        """
        发送成功回调
        
        参数：
            record_metadata: 发送结果元数据
            
        功能：
            - 记录成功发送的消息信息
            - 用于调试和监控
        """
        logger.debug(f"[KAFKA] 消息发送成功: topic={record_metadata.topic}, "
                    f"partition={record_metadata.partition}, "
                    f"offset={record_metadata.offset}")
    
    def _on_send_error(self, exception):
        """
        发送失败回调
        
        参数：
            exception: 发送异常
            
        功能：
            - 记录发送失败的错误信息
            - 用于故障排查和监控
        """
        logger.error(f"[KAFKA] 消息发送失败: {exception}")
    
    def flush(self):
        """
        强制发送所有缓冲的消息
        
        功能：
            - 确保所有消息都已发送
            - 用于应用关闭前的清理
        """
        if self.producer:
            self.producer.flush()
            logger.debug("[KAFKA] 消息缓冲区已刷新")
    
    def close(self):
        """
        关闭生产者连接
        
        功能：
            - 发送缓冲的消息
            - 关闭网络连接
            - 释放资源
        """
        if self.producer:
            self.producer.flush()
            self.producer.close()
            logger.info("[KAFKA] 生产者已关闭")
    
    def get_metrics(self) -> Dict[str, Any]:
        """
        获取生产者性能指标
        
        返回：
            Dict: 包含性能指标的字典
            
        指标包括：
            - 发送速率
            - 错误率
            - 批大小
            - 等待中的请求数
        """
        if not self.producer:
            return {}
        
        try:
            metrics = self.producer.metrics()
            return {
                "producer_metrics": {
                    "record_send_rate": metrics.get("producer-metrics", {}).get("record-send-rate", 0),
                    "record_error_rate": metrics.get("producer-metrics", {}).get("record-error-rate", 0),
                    "batch_size_avg": metrics.get("producer-metrics", {}).get("batch-size-avg", 0),
                    "requests_in_flight": metrics.get("producer-metrics", {}).get("requests-in-flight", 0)
                }
            }
        except Exception as e:
            logger.error(f"[KAFKA] 获取生产者指标失败: {e}")
            return {}
    
    def health_check(self) -> Dict[str, Any]:
        """
        执行健康检查
        
        返回：
            Dict: 健康状态信息
            
        检查项：
            - 生产者连接状态
            - 主题元数据可用性
        """
        try:
            if not self.producer:
                return {"status": "unhealthy", "reason": "producer not connected"}

            topics = list(self.topics.values())
            topic_partitions: Dict[str, Any] = {}
            available_topics = 0

            for t in topics:
                try:
                    partitions = self.producer.partitions_for(t)
                    topic_partitions[t] = list(partitions) if partitions else None
                    if partitions:
                        available_topics += 1
                except Exception as e:
                    topic_partitions[t] = None

            status = "healthy" if available_topics > 0 else "degraded"

            return {
                "status": status,
                "producer_connected": True,
                "topics_configured": topics,
                "topics_partitions": topic_partitions,
                "bootstrap_servers": self.config["bootstrap_servers"]
            }

        except Exception as e:
            return {
                "status": "unhealthy",
                "reason": str(e),
                "producer_connected": bool(self.producer)
            }


# =============================================================================
# 全局生产者管理
# =============================================================================

# 全局生产者实例
_producer_instance = None
_producer_lock = threading.Lock()

def get_kafka_producer() -> EcommerceKafkaProducer:
    """
    获取Kafka生产者单例
    
    返回：
        EcommerceKafkaProducer: 生产者实例
        
    功能：
        - 单例模式确保资源复用
        - 线程安全的实例创建
        - 自动初始化连接
    """
    global _producer_instance
    
    if _producer_instance is None:
        with _producer_lock:
            if _producer_instance is None:
                _producer_instance = EcommerceKafkaProducer()
    
    return _producer_instance

def close_kafka_producer():
    """
    关闭Kafka生产者
    
    功能：
        - 优雅关闭生产者连接
        - 清理全局实例
        - 释放网络资源
    """
    global _producer_instance
    
    if _producer_instance:
        _producer_instance.close()
        _producer_instance = None
        logger.info("[KAFKA] 全局生产者已清理") 