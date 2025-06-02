from typing import List, Dict, Any, Optional
from datetime import datetime
from pydantic import BaseModel, Field, validator
from enum import Enum
import uuid

class ActionType(str, Enum):
    """用户行为类型枚举"""
    VIEW = "view"
    CLICK = "click"
    ADD_TO_CART = "add_to_cart"
    PURCHASE = "purchase"
    SEARCH = "search"
    RATE = "rate"
    WISHLIST = "wishlist"

class UserBehavior(BaseModel):
    """用户行为数据模型"""
    user_id: str
    session_id: str
    product_id: Optional[str] = None
    category_id: Optional[str] = None
    action_type: ActionType
    timestamp: datetime
    device_type: str = Field(default="desktop")  # desktop, mobile, tablet
    page_url: Optional[str] = None
    search_query: Optional[str] = None
    rating: Optional[float] = Field(default=None, ge=1, le=5)
    price: Optional[float] = None
    quantity: Optional[int] = Field(default=1)
    duration_seconds: Optional[int] = None
    referrer: Optional[str] = None
    
    class Config:
        json_encoders = {
            datetime: lambda v: v.isoformat()
        }

class Product(BaseModel):
    """商品数据模型"""
    product_id: str
    name: str
    category_id: str
    category_name: str
    brand: str
    price: float
    description: str
    rating: float = Field(default=0, ge=0, le=5)
    review_count: int = Field(default=0, ge=0)
    stock_quantity: int = Field(default=0, ge=0)
    tags: List[str] = Field(default_factory=list)
    created_at: datetime
    updated_at: datetime
    
    class Config:
        json_encoders = {
            datetime: lambda v: v.isoformat()
        }

class User(BaseModel):
    """用户数据模型"""
    user_id: str
    username: str
    email: str
    age: int
    gender: str  # male, female, other
    location: str
    registration_date: datetime
    preferences: List[str] = Field(default_factory=list)  # 偏好的商品类别
    total_purchases: int = Field(default=0)
    total_spent: float = Field(default=0.0)
    
    class Config:
        json_encoders = {
            datetime: lambda v: v.isoformat()
        }

class Recommendation(BaseModel):
    """推荐结果数据模型"""
    user_id: str
    product_id: str
    score: float = Field(ge=0, le=1)
    reason: str  # 推荐理由
    algorithm: str  # 使用的推荐算法
    timestamp: datetime
    
    class Config:
        json_encoders = {
            datetime: lambda v: v.isoformat()
        }

class AnalyticsMetrics(BaseModel):
    """分析指标数据模型"""
    metric_name: str
    metric_value: float
    timestamp: datetime
    dimensions: Dict[str, Any] = Field(default_factory=dict)
    
    class Config:
        json_encoders = {
            datetime: lambda v: v.isoformat()
        }

class RealTimeStats(BaseModel):
    """实时统计数据模型"""
    active_users: int
    page_views: int
    purchases: int
    revenue: float
    popular_products: List[Dict[str, Any]]
    popular_categories: List[Dict[str, Any]]
    conversion_rate: float
    timestamp: str
    time_window: Optional[str] = "5分钟"  # 新增：时间窗口标识
    total_data_points: Optional[int] = 0  # 新增：数据点总数
    
    class Config:
        json_encoders = {
            datetime: lambda v: v.isoformat()
        }

def generate_session_id() -> str:
    """生成唯一的会话ID"""
    return str(uuid.uuid4())

def generate_user_id() -> str:
    """生成唯一的用户ID"""
    return f"user_{uuid.uuid4().hex[:8]}"

def generate_product_id() -> str:
    """生成唯一的商品ID"""
    return f"prod_{uuid.uuid4().hex[:8]}" 