@echo off
chcp 65001 > nul
echo.
echo ==========================================
echo 电商实时数据分析系统 - Docker服务启动器
echo ==========================================
echo.

echo 🔍 检查Docker状态...
docker --version > nul 2>&1
if errorlevel 1 (
    echo ❌ Docker未安装或未启动，请先安装并启动Docker Desktop
    pause
    exit /b 1
)

docker-compose --version > nul 2>&1
if errorlevel 1 (
    echo ❌ Docker Compose未安装
    pause
    exit /b 1
)

echo ✅ Docker环境检查通过
echo.

echo 🚀 启动所有Docker服务...
echo.
echo 正在启动以下服务:
echo   📊 Kafka (消息队列) - localhost:9092
echo   🍃 MongoDB (数据库) - localhost:27017  
echo   🔥 Redis (缓存) - localhost:6379
echo   ⚡ Spark (流处理) - localhost:8085
echo   🔧 管理界面:
echo      - Kafka UI: http://localhost:8080
echo      - MongoDB Express: http://localhost:8081  
echo      - Redis Commander: http://localhost:8082
echo      - Spark UI: http://localhost:8085
echo.

docker-compose -p ecommerce-analytics up -d

if errorlevel 1 (
    echo ❌ Docker服务启动失败
    echo 💡 常见解决方案:
    echo    1. 确保Docker Desktop正在运行
    echo    2. 检查端口是否被占用: netstat -ano ^| findstr ":9092 :27017 :6379"
    echo    3. 重启Docker Desktop
    echo    4. 运行清理命令: docker system prune -f
    pause
    exit /b 1
)

echo.
echo ✅ 所有Docker服务启动成功！
echo.
echo 📋 服务状态检查：
docker-compose -p ecommerce-analytics ps

echo.
echo "🔧 管理界面地址："
echo "  • Kafka UI:        http://localhost:8080"
echo "  • MongoDB Express: http://localhost:8081 (admin/admin123)"
echo "  • Redis Commander: http://localhost:8082"
echo "  • Spark Master UI: http://localhost:8085"
echo.
echo "💡 服务连接信息："
echo "  • Kafka:    localhost:9092"
echo "  • MongoDB:  localhost:27017 (admin/admin123)"
echo "  • Redis:    localhost:6379 (密码: redis123)"
echo "  • Spark:    spark://localhost:7077"
echo.
echo "🎯 下一步: 启动后端服务"
echo "   cd PythonProject"
echo "   python start_backend.py"
echo.
echo "⏹️ 停止所有服务: docker-compose -p ecommerce-analytics down"
echo.

pause 