"""
Kafka集成模块
提供电商平台的Kafka消息队列功能
"""

from .producer import EcommerceKafkaProducer, get_kafka_producer, close_kafka_producer

__all__ = [
    "EcommerceKafkaProducer",
    "get_kafka_producer", 
    "close_kafka_producer"
] 