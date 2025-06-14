#!/bin/bash

# 创建服务器部署分支脚本
# 从 local-api-version 分支提取必要文件到 server-deploy 分支

SOURCE_BRANCH="local-api-version"
TARGET_BRANCH="server-deploy"

echo "🔄 创建服务器部署分支"
echo "📤 从 $SOURCE_BRANCH 提取文件到 $TARGET_BRANCH"

# 确保在正确分支
git checkout "$SOURCE_BRANCH"
git pull origin "$SOURCE_BRANCH"

# 创建并切换到服务器分支
git checkout -B "$TARGET_BRANCH"

# 删除不必要的文件，只保留服务器运行需要的
echo "🧹 清理不必要的文件..."

# 保留的文件和目录
KEEP_FILES=(
    "build/"
    "server.js"
    "package.json"
    "src/data.json"
    ".gitignore"
    "README.md"
)

# 删除所有文件
git rm -rf . 2>/dev/null || true

# 从源分支恢复需要的文件
echo "📋 恢复必要文件..."
for file in "${KEEP_FILES[@]}"; do
    if git show "$SOURCE_BRANCH:$file" > /dev/null 2>&1; then
        if [[ "$file" == */ ]]; then
            # 目录
            mkdir -p "$file"
            git checkout "$SOURCE_BRANCH" -- "$file" 2>/dev/null || echo "⚠️  $file 不存在"
        else
            # 文件
            git checkout "$SOURCE_BRANCH" -- "$file" 2>/dev/null || echo "⚠️  $file 不存在"
        fi
        echo "✅ 已恢复: $file"
    else
        echo "⚠️  文件不存在: $file"
    fi
done

# 创建服务器专用的 package.json（只包含生产依赖）
if [ -f "package.json" ]; then
    echo "📦 优化 package.json..."
    # 这里可以用 jq 工具进一步优化，移除开发依赖
fi

# 创建简单的 README
cat > README.md << 'EOF'
# Simple Nav Site - Server Deploy

这是服务器部署分支，只包含运行必需的文件。

## 快速部署

```bash
# 克隆服务器分支
git clone -b server-deploy https://github.com/gamelibs/simple-nav-site.git nav-site

# 安装依赖
cd nav-site
npm install --only=production

# 使用 PM2 启动
pm2 start server.js --name nav-site
```

## 文件结构

- `build/` - 前端静态文件
- `server.js` - Node.js 服务器
- `package.json` - 依赖配置
- `src/data.json` - 数据文件

## 端口

默认端口：15001
EOF

# 提交更改
git add .
git commit -m "服务器部署版本 - 只包含运行必需文件

- build/ 静态文件
- server.js 服务器
- package.json 依赖配置
- src/data.json 数据文件"

echo ""
echo "✅ 服务器分支创建完成!"
echo ""
echo "📤 推送到远程仓库:"
echo "git push origin $TARGET_BRANCH"
echo ""
echo "🚀 服务器部署命令:"
echo "git clone -b $TARGET_BRANCH https://github.com/gamelibs/simple-nav-site.git"
echo ""
