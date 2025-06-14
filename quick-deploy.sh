#!/bin/bash

# 服务器快速部署脚本
# 使用方法: ./quick-deploy.sh [目录名]

REPO_URL="https://github.com/gamelibs/simple-nav-site.git"
BRANCH="server-deploy"  # 服务器专用分支，只包含运行必需文件
DIR="${1:-simple-nav-site-server}"

echo "🚀 服务器快速部署"
echo "📦 从 $BRANCH 分支克隆服务器文件到 $DIR"

# 直接克隆服务器分支
echo "📥 克隆服务器分支..."
git clone -b "$BRANCH" --single-branch --depth 1 "$REPO_URL" "$DIR"

cd "$DIR"

# 安装生产依赖
echo "📦 安装生产依赖..."
npm install --only=production

echo ""
echo "✅ 部署完成!"
echo ""
echo "� 启动命令:"
echo "cd $DIR"
echo "pm2 start server.js --name nav-site"
echo ""
echo "� PM2 管理:"
echo "pm2 logs nav-site      # 查看日志"
echo "pm2 restart nav-site   # 重启"
echo "pm2 stop nav-site      # 停止"
echo ""
