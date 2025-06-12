#!/bin/bash

# 简约导航站服务器部署脚本

echo "🚀 开始部署简约导航站..."

# 设置变量
SERVER_PORT=15001
BUILD_DIR="build"
SERVER_FILE="server.js"
DATA_DIR="src"

# 检查必需文件
echo "📋 检查部署文件..."
if [ ! -d "$BUILD_DIR" ]; then
    echo "❌ 错误: $BUILD_DIR 目录不存在，请先运行 npm run build"
    exit 1
fi

if [ ! -f "$SERVER_FILE" ]; then
    echo "❌ 错误: $SERVER_FILE 文件不存在"
    exit 1
fi

if [ ! -f "package.json" ]; then
    echo "❌ 错误: package.json 文件不存在"
    exit 1
fi

echo "✅ 部署文件检查完成"

# 安装依赖
echo "📦 安装服务器依赖..."
npm install --production

# 启动服务器
echo "🚀 启动服务器..."
echo "服务器将在端口 $SERVER_PORT 启动"
echo "API 地址: http://localhost:$SERVER_PORT/api"
echo "静态文件目录: $BUILD_DIR"
echo "数据文件: $DATA_DIR/data.json"

# 检查端口是否被占用
if lsof -Pi :$SERVER_PORT -sTCP:LISTEN -t >/dev/null; then
    echo "⚠️  警告: 端口 $SERVER_PORT 已被占用"
    echo "请手动停止占用端口的进程或修改端口号"
fi

echo "💡 使用以下命令启动服务器:"
echo "node $SERVER_FILE"
echo ""
echo "💡 使用 PM2 启动 (推荐生产环境):"
echo "pm2 start $SERVER_FILE --name simple-nav-site"
echo ""
echo "🎉 部署准备完成！"
