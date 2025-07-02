#!/bin/bash

# 简约导航站构建验证和部署脚本

echo "🔍 验证构建文件..."

BUILD_DIR="build"

# 检查构建目录是否存在
if [ ! -d "$BUILD_DIR" ]; then
  echo "❌ 构建目录不存在，请先运行 npm run build"
  exit 1
fi

# 检查关键文件
REQUIRED_FILES=("index.html" "static/js/" "static/css/")

for file in "${REQUIRED_FILES[@]}"; do
  if [ ! -e "$BUILD_DIR/$file" ]; then
    echo "❌ 缺少必要文件: $BUILD_DIR/$file"
    exit 1
  fi
done

echo "✅ 构建验证通过！"
echo "📊 构建统计信息:"

# 统计文件大小
JS_SIZE=$(du -sh "$BUILD_DIR/static/js" | cut -f1)
CSS_SIZE=$(du -sh "$BUILD_DIR/static/css" | cut -f1)
TOTAL_SIZE=$(du -sh "$BUILD_DIR" | cut -f1)

echo "JavaScript 文件大小: $JS_SIZE"
echo "CSS 文件大小: $CSS_SIZE"
echo "总大小: $TOTAL_SIZE"

echo ""
echo "🚀 部署指南:"
echo "1. 将 build 目录中的文件复制到你的网站服务器"
echo "2. 确保正确配置了 API 服务器地址"
echo "3. 使用 serve -s build 本地测试构建"
echo ""
echo "📝 详细部署说明请参考 DEPLOYMENT.md"
