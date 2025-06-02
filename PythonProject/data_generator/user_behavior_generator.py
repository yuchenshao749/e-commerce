#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
电商实时数据分析系统 - 用户行为数据生成器
================================================================

文件作用：
    这是电商实时数据分析系统的数据生成器模块，负责：
    1. 模拟真实的电商用户行为数据
    2. 生成多样化的用户交互事件
    3. 实时发送数据到Kafka消息队列
    4. 支持多种用户行为类型（浏览、点击、购买等）
    5. 提供数据生成的统计和控制功能

主要功能模块：
    - 用户数据生成：创建虚拟用户档案
    - 商品数据生成：创建商品目录和分类
    - 行为事件生成：模拟各种用户交互行为
    - Kafka数据发送：实时推送生成的数据
    - 统计监控：跟踪数据生成状态和性能

支持的行为类型：
    - view: 商品浏览行为
    - click: 页面点击行为  
    - add_to_cart: 添加到购物车
    - purchase: 购买行为
    - rate: 商品评价行为

技术特性：
    - 多线程并发生成数据
    - 可配置的生成频率和数据量
    - 真实的数据分布和权重
    - 异常处理和故障恢复
    - 实时状态监控和日志记录

配置项：
    通过settings.DATA_GENERATOR_CONFIG进行配置：
    - events_per_second: 每秒生成事件数
    - batch_size: 批量发送大小
    - users_count/products_count: 用户和商品数量
    - behavior_patterns: 行为类型权重分布

作者: AI Assistant
创建时间: 2025-05-31
版本: 1.0.0
================================================================
"""

import sys
import os
from pathlib import Path

# 添加项目根目录到Python路径
project_root = Path(__file__).parent.parent
sys.path.insert(0, str(project_root))

import json
import random
import time
from datetime import datetime, timedelta
from typing import List, Dict, Any
from faker import Faker
from kafka import KafkaProducer
from kafka.errors import KafkaError
import logging
import threading
from concurrent.futures import ThreadPoolExecutor

from config.settings import settings, get_kafka_config
from utils.data_models import (
    UserBehavior, Product, User, ActionType,
    generate_session_id, generate_user_id, generate_product_id
)
from kafka_integration import get_kafka_producer

# 配置日志记录器
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# 初始化中文数据生成器
fake = Faker('zh_CN')


class EcommerceBehaviorGenerator:
    """
    电商用户行为数据生成器
    
    职责：
        1. 生成模拟的电商用户行为数据
        2. 管理用户、商品、分类等基础数据
        3. 实时发送数据到Kafka消息队列
        4. 提供数据生成的控制和监控功能
    
    属性：
        config: 数据生成器配置
        users: 用户数据列表
        products: 商品数据列表
        categories: 商品分类列表
        kafka_producer: Kafka生产者实例
        running: 运行状态标志
        stats: 生成统计信息
    
    方法：
        start_generation(): 启动数据生成
        stop_generation(): 停止数据生成
        get_status(): 获取运行状态
    """
    
    def __init__(self):
        """
        初始化数据生成器
        
        步骤：
            1. 加载配置信息
            2. 初始化运行状态
            3. 生成基础数据（用户、商品、分类）
            4. 设置统计计数器
        """
        self.config = settings.DATA_GENERATOR_CONFIG
        self.running = False
        self.kafka_producer = None
        
        # 统计信息
        self.stats = {
            "total_events": 0,
            "events_by_type": {},
            "start_time": None,
            "last_event_time": None,
            "errors": 0
        }
        
        # 预生成基础数据 - 注意初始化顺序
        logger.info("[INIT] 开始生成基础数据...")
        self.categories = self._generate_categories()  # 先初始化类别
        self.users = self._generate_users()            # 再初始化用户
        self.products = self._generate_products()      # 最后初始化商品（依赖类别）
        
        logger.info(f"[SUCCESS] 数据生成器初始化完成")
        logger.info(f"[INFO] 用户数量: {len(self.users)}")
        logger.info(f"[INFO] 商品数量: {len(self.products)}")
        logger.info(f"[INFO] 分类数量: {len(self.categories)}")
    
    def _generate_users(self) -> List[Dict[str, Any]]:
        """
        生成虚拟用户数据
        
        功能：
            - 创建指定数量的虚拟用户
            - 为每个用户分配随机属性
            - 包含年龄、性别、地理位置等信息
            - 设置VIP等级和偏好设备
        
        返回：用户数据列表
        """
        users = []
        logger.info(f"[GENERATING] 生成 {self.config['users_count']} 个用户...")
        
        for i in range(self.config["users_count"]):
            user = {
                "user_id": f"user_{i:06d}",
                "age": random.randint(18, 65),
                "gender": random.choice(["male", "female"]),
                "location": random.choice(self.config["locations"]),
                "registration_date": (datetime.now() - timedelta(days=random.randint(1, 365))).isoformat(),
                "vip_level": random.choices(
                    ["bronze", "silver", "gold", "platinum"],
                    weights=[0.5, 0.3, 0.15, 0.05]  # 铜牌用户最多，白金用户最少
                )[0],
                "preferred_device": random.choice(self.config["devices"])
            }
            users.append(user)
        
        logger.info(f"[SUCCESS] 用户数据生成完成")
        return users
    
    def _generate_categories(self) -> List[Dict[str, Any]]:
        """
        生成商品分类数据
        
        功能：
            - 创建多样化的商品分类
            - 涵盖主流电商平台的常见分类
            - 支持层级结构（当前为一级分类）
        
        返回：分类数据列表
        """
        # 定义常见的电商商品分类
        category_names = [
            "手机数码", "电脑办公", "家用电器", "服饰内衣", "鞋靴包袋",
            "运动户外", "汽车用品", "母婴用品", "美妆护肤", "个护清洁",
            "钟表珠宝", "食品饮料", "保健食品", "图书", "音像",
            "家居家装", "家纺用品", "居家日用", "厨具", "家庭清洁",
            "宠物生活", "生鲜", "传统滋补", "医药保健", "计生情趣",
            "工业品", "五金电工", "仪器仪表", "劳保安防", "商业办公",
            "农业生产", "加工定制", "二手商品", "拍卖", "房产",
            "旅游出行", "充值缴费", "票务", "教育培训", "本地生活",
            "安装维修", "数字内容", "全球购", "艺术品", "收藏品",
            "游戏", "娱乐", "理财", "众筹", "白条"
        ]
        
        categories = []
        logger.info(f"[GENERATING] 生成 {self.config['categories_count']} 个商品分类...")
        
        for i, name in enumerate(category_names[:self.config["categories_count"]]):
            category = {
                "category_id": f"cat_{i:03d}",
                "name": name,
                "level": 1,
                "parent_id": None
            }
            categories.append(category)
        
        logger.info(f"[SUCCESS] 商品分类生成完成")
        return categories
    
    def _generate_products(self) -> List[Dict[str, Any]]:
        """
        生成商品数据
        
        功能：
            - 为每个分类创建相应的商品
            - 设置真实的价格范围和属性
            - 包含库存、评分、评价数等信息
            - 添加商品标签和描述
        
        返回：商品数据列表
        """
        products = []
        logger.info(f"[GENERATING] 生成 {self.config['products_count']} 个商品...")
        
        for i in range(self.config["products_count"]):
            # 随机选择一个分类
            category = random.choice(self.categories)
            
            product = {
                "product_id": f"prod_{i:06d}",
                "name": f"{category['name']}商品_{i:04d}",
                "category_id": category["category_id"],
                "price": round(random.uniform(
                    self.config["price_range"]["min"],
                    self.config["price_range"]["max"]
                ), 2),
                "stock": random.randint(0, 1000),
                "rating": round(random.uniform(3.0, 5.0), 1),
                "review_count": random.randint(0, 1000),
                "brand": f"品牌_{random.randint(1, 100)}",
                "description": f"这是一个优质的{category['name']}产品",
                "tags": random.sample([
                    "热销", "新品", "推荐", "限时优惠", "包邮",
                    "正品保证", "品质之选", "用户好评", "性价比高"
                ], k=random.randint(1, 4))
            }
            products.append(product)
        
        logger.info(f"[SUCCESS] 商品数据生成完成")
        return products
    
    def _generate_behavior_event(self) -> Dict[str, Any]:
        """
        生成单个用户行为事件
        
        功能：
            - 随机选择用户和商品
            - 根据权重分布选择行为类型
            - 为不同行为类型添加特定字段
            - 生成真实的时间戳和会话信息
        
        支持的行为类型：
            - view: 商品浏览（包含浏览时长、页面类型）
            - click: 页面点击（包含点击位置、页面类型）
            - add_to_cart: 添加购物车（包含数量、价格）
            - purchase: 购买行为（包含支付方式、折扣）
            - rate: 商品评价（包含评分、评价文本）
        
        返回：行为事件数据字典
        """
        # 随机选择用户和商品
        user = random.choice(self.users)
        product = random.choice(self.products)
        
        # 根据权重选择行为类型
        action_type = random.choices(
            list(self.config["behavior_patterns"].keys()),
            weights=list(self.config["behavior_patterns"].values())
        )[0]
        
        # 构建基础行为数据
        behavior = {
            "user_id": user["user_id"],
            "action_type": action_type,
            "product_id": product["product_id"],
            "category_id": product["category_id"],
            "timestamp": datetime.now().isoformat(),
            "device": user["preferred_device"],
            "location": user["location"],
            "session_id": f"session_{random.randint(10000, 99999)}",
            "ip_address": f"{random.randint(1,255)}.{random.randint(1,255)}.{random.randint(1,255)}.{random.randint(1,255)}"
        }
        
        # 根据行为类型添加特定字段
        if action_type == "view":
            # 浏览行为：添加浏览时长和页面类型
            behavior.update({
                "view_duration": random.randint(5, 300),  # 浏览时长（秒）
                "page_type": random.choice(["list", "detail", "search"])
            })
        
        elif action_type == "click":
            # 点击行为：添加点击位置和页面类型
            behavior.update({
                "click_position": random.randint(1, 20),
                "page_type": random.choice(["homepage", "category", "search_result"])
            })
        
        elif action_type == "add_to_cart":
            # 购物车行为：添加数量和价格信息
            behavior.update({
                "quantity": random.randint(1, 5),
                "price": product["price"]
            })
        
        elif action_type == "purchase":
            # 购买行为：添加完整的交易信息
            quantity = random.randint(1, 3)
            total_amount = product["price"] * quantity
            discount = round(random.uniform(0, 0.2) * total_amount, 2)
            
            behavior.update({
                "quantity": quantity,
                "price": product["price"],
                "total_amount": round(total_amount, 2),
                "payment_method": random.choice(["alipay", "wechat", "credit_card", "debit_card"]),
                "discount": discount
            })
        
        elif action_type == "rate":
            # 评价行为：添加评分和评价文本
            behavior.update({
                "rating": random.randint(1, 5),
                "review_text": random.choice([
                    "商品质量很好，物流很快",
                    "性价比不错，推荐购买",
                    "包装精美，服务周到",
                    "商品与描述相符",
                    "满意的购物体验",
                    "产品功能强大，使用方便",
                    "售后服务态度很好",
                    "下次还会继续购买"
                ])
            })
        
        return behavior
    
    def start_generation(self):
        """
        启动数据生成
        
        功能：
            1. 初始化Kafka生产者连接
            2. 启动多线程数据生成器
            3. 开始实时统计和监控
            4. 处理异常和故障恢复
        
        技术实现：
            - 使用ThreadPoolExecutor进行并发生成
            - 按配置的频率控制生成速度
            - 批量发送数据提高性能
            - 实时记录统计信息
        """
        if self.running:
            logger.warning("[WARNING] 数据生成器已在运行中")
            return
        
        try:
            # 初始化Kafka生产者
            logger.info("[INIT] 初始化Kafka生产者连接...")
            self.kafka_producer = get_kafka_producer()
            
            # 重置统计信息
            self.stats.update({
                "total_events": 0,
                "events_by_type": {},
                "start_time": datetime.now().isoformat(),
                "last_event_time": None,
                "errors": 0
            })
            
            self.running = True
            logger.info("[SUCCESS] 数据生成器启动成功")
            
            # 使用线程池进行并发数据生成
            with ThreadPoolExecutor(max_workers=self.config.get("threads", 4)) as executor:
                # 启动统计日志线程
                stats_thread = threading.Thread(target=self._log_generation_stats)
                stats_thread.daemon = True
                stats_thread.start()
                
                # 主生成循环
                while self.running:
                    try:
                        # 根据配置的频率控制生成速度
                        events_per_batch = self.config.get("batch_size", 10)
                        
                        # 批量生成事件
                        futures = []
                        for _ in range(events_per_batch):
                            if not self.running:
                                break
                            future = executor.submit(self._generate_and_send_event)
                            futures.append(future)
                        
                        # 等待批次完成
                        for future in futures:
                            try:
                                future.result(timeout=5)  # 5秒超时
                            except Exception as e:
                                logger.error(f"[ERROR] 事件生成失败: {e}")
                                self.stats["errors"] += 1
                        
                        # 控制生成频率
                        sleep_time = 1.0 / self.config["events_per_second"] * events_per_batch
                        time.sleep(max(0.01, sleep_time))  # 最小睡眠10ms
                        
                    except KeyboardInterrupt:
                        logger.info("[INFO] 接收到中断信号，停止数据生成")
                        break
                    except Exception as e:
                        logger.error(f"[ERROR] 数据生成主循环异常: {e}")
                        self.stats["errors"] += 1
                        time.sleep(1)  # 异常时暂停1秒
            
        except Exception as e:
            logger.error(f"[ERROR] 数据生成器启动失败: {e}")
            self.running = False
            raise
        
        finally:
            self.running = False
            logger.info("[STOP] 数据生成器已停止")
    
    def _generate_and_send_event(self):
        """
        生成并发送单个事件到Kafka
        
        功能：
            1. 生成用户行为事件
            2. 序列化为JSON格式
            3. 发送到Kafka主题
            4. 更新统计计数器
            5. 处理发送异常
        """
        try:
            # 生成行为事件
            event = self._generate_behavior_event()
            
            # 序列化为JSON
            event_json = json.dumps(event, ensure_ascii=False)
            
            # 发送到Kafka
            kafka_config = get_kafka_config()
            future = self.kafka_producer.send(
                kafka_config["topics"]["user_behavior"],
                value=event_json.encode('utf-8')
            )
            
            # 等待发送确认（可选，影响性能）
            # future.get(timeout=1)
            
            # 更新统计信息
            self.stats["total_events"] += 1
            self.stats["last_event_time"] = datetime.now().isoformat()
            
            action_type = event["action_type"]
            if action_type in self.stats["events_by_type"]:
                self.stats["events_by_type"][action_type] += 1
            else:
                self.stats["events_by_type"][action_type] = 1
                
        except Exception as e:
            logger.error(f"[ERROR] 发送事件失败: {e}")
            self.stats["errors"] += 1
            raise
    
    def _log_generation_stats(self):
        """
        定期记录数据生成统计信息
        
        功能：
            - 每30秒输出一次统计信息
            - 显示总事件数、各类型事件分布
            - 计算生成速度和错误率
            - 监控系统运行状态
        """
        last_total = 0
        
        while self.running:
            try:
                time.sleep(30)  # 每30秒统计一次
                
                if not self.running:
                    break
                
                current_total = self.stats["total_events"]
                speed = (current_total - last_total) / 30  # 每秒生成数
                last_total = current_total
                
                logger.info(f"[STATS] 总事件数: {current_total}, 生成速度: {speed:.1f}/秒, 错误数: {self.stats['errors']}")
                
                # 显示各类型事件分布
                if self.stats["events_by_type"]:
                    type_stats = ", ".join([
                        f"{k}: {v}" for k, v in self.stats["events_by_type"].items()
                    ])
                    logger.info(f"[STATS] 事件类型分布: {type_stats}")
                
            except Exception as e:
                logger.error(f"[ERROR] 统计日志异常: {e}")
    
    def stop_generation(self):
        """
        停止数据生成
        
        功能：
            1. 设置停止标志
            2. 等待生成线程结束
            3. 关闭Kafka生产者连接
            4. 输出最终统计信息
        """
        if not self.running:
            logger.info("[INFO] 数据生成器未在运行")
            return
        
        logger.info("[STOP] 正在停止数据生成器...")
        self.running = False
        
        # 关闭Kafka生产者
        if self.kafka_producer:
            try:
                self.kafka_producer.flush()  # 确保所有消息都已发送
                self.kafka_producer.close()
                logger.info("[SUCCESS] Kafka生产者已关闭")
            except Exception as e:
                logger.error(f"[ERROR] 关闭Kafka生产者失败: {e}")
        
        # 输出最终统计信息
        self._log_final_stats()
        logger.info("[SUCCESS] 数据生成器已停止")
    
    def _log_final_stats(self):
        """输出最终统计信息"""
        if self.stats["start_time"]:
            start_time = datetime.fromisoformat(self.stats["start_time"])
            duration = (datetime.now() - start_time).total_seconds()
            avg_speed = self.stats["total_events"] / duration if duration > 0 else 0
            
            logger.info(f"[FINAL_STATS] 运行时长: {duration:.1f}秒")
            logger.info(f"[FINAL_STATS] 总事件数: {self.stats['total_events']}")
            logger.info(f"[FINAL_STATS] 平均速度: {avg_speed:.1f}事件/秒")
            logger.info(f"[FINAL_STATS] 错误总数: {self.stats['errors']}")
    
    def get_status(self) -> Dict[str, Any]:
        """
        获取数据生成器运行状态
        
        功能：
            - 返回当前运行状态
            - 提供详细的统计信息
            - 包含配置信息
            - 用于监控和调试
        
        返回：状态信息字典
        """
        status = {
            "running": self.running,
            "config": self.config,
            "stats": self.stats.copy(),
            "data_counts": {
                "users": len(self.users),
                "products": len(self.products),
                "categories": len(self.categories)
            },
            "kafka_connected": self.kafka_producer is not None,
            "timestamp": datetime.now().isoformat()
        }
        
        # 计算运行时长
        if self.stats["start_time"]:
            start_time = datetime.fromisoformat(self.stats["start_time"])
            status["runtime_seconds"] = (datetime.now() - start_time).total_seconds()
        
        return status


# =============================================================================
# 独立运行函数
# =============================================================================

def run_data_generator():
    """
    独立运行数据生成器的函数
    
    功能：
        - 用于在独立进程中启动数据生成器
        - 处理信号和异常
        - 确保优雅关闭
    
    用途：
        - 被main.py的多进程管理器调用
        - 可以作为独立脚本运行
    """
    logger.info("[STARTUP] 启动电商用户行为数据生成器...")
    
    generator = EcommerceBehaviorGenerator()
    
    try:
        generator.start_generation()
    except KeyboardInterrupt:
        logger.info("[INFO] 接收到中断信号")
    except Exception as e:
        logger.error(f"[ERROR] 数据生成器运行失败: {e}")
    finally:
        generator.stop_generation()


if __name__ == "__main__":
    # 配置日志系统
    import logging.config
    from config.settings import settings
    
    logging.config.dictConfig(settings.LOGGING_CONFIG)
    
    # 运行数据生成器
    run_data_generator() 