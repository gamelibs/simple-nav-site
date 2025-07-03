#!/bin/bash

# 综合更新脚本 - 构建、同步和部署
# 将 local-api-version 分支的变更同步到 server-deploy 分支
# 创建日期: 2025年7月3日
# 最后修改日期: $(date "+%Y年%m月%d日")

SOURCE_BRANCH="local-api-version"
TARGET_BRANCH="server-deploy"

echo "🔄 开始服务器更新流程..."
echo "📦 1. 确保在 $SOURCE_BRANCH 分支并拉取最新代码"

# 检查当前分支
CURRENT_BRANCH=$(git rev-parse --abbrev-ref HEAD)
if [ "$CURRENT_BRANCH" != "$SOURCE_BRANCH" ]; then
    echo "⚠️ 当前不在 $SOURCE_BRANCH 分支，正在切换..."
    git checkout "$SOURCE_BRANCH"
fi
git pull origin "$SOURCE_BRANCH"

echo "🏗️  2. 执行构建"
npm run build
if [ $? -ne 0 ]; then
    echo "❌ 构建失败，请修复错误后重试"
    exit 1
fi
echo "✅ 构建完成"

# 更新服务器版本信息
echo "📝 3. 更新服务器版本信息..."
TODAY=$(date "+%Y年%m月%d日")
sed -i '' "s/\/\/ 最后更新日期:.*$/\/\/ 最后更新日期: $TODAY/" server.js
VERSION=$(grep "服务器版本:" server.js | sed -E 's/\/\/ 服务器版本: ([0-9]+\.[0-9]+\.[0-9]+)/\1/')
VERSION_PARTS=(${VERSION//./ })
((VERSION_PARTS[2]++))
NEW_VERSION="${VERSION_PARTS[0]}.${VERSION_PARTS[1]}.${VERSION_PARTS[2]}"
sed -i '' "s/\/\/ 服务器版本:.*$/\/\/ 服务器版本: $NEW_VERSION/" server.js
echo "✅ 服务器版本已更新至 $NEW_VERSION"

echo "🔄 4. 切换到 $TARGET_BRANCH 分支"
git checkout -B "$TARGET_BRANCH"

# 删除不必要的文件，只保留服务器运行需要的
echo "🧹 5. 清理不必要的文件..."

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
echo "📋 6. 恢复必要文件..."
for file in "${KEEP_FILES[@]}"; do
    # 跳过 node_modules 目录，如果它已经存在
    if [[ "$file" == "node_modules/" && -d "node_modules" ]]; then
        echo "⏩ 跳过已存在的 node_modules 目录"
        continue
    fi

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

# 创建简化版的 README
cat > README.md << EOF
# 简约导航站 - 服务器部署版本

这是服务器部署分支，只包含运行必需的文件。

## 快速部署

\`\`\`bash
# 克隆服务器分支
git clone -b server-deploy https://github.com/gamelibs/simple-nav-site.git nav-site

# 安装依赖
cd nav-site
npm install --production

# 使用 PM2 启动
pm2 start server.js --name nav-site
\`\`\`

## 文件结构

- \`build/\` - 前端静态文件
- \`server.js\` - Node.js 服务器
- \`package.json\` - 依赖配置
- \`src/data.json\` - 数据文件

## 端口

默认端口：15001

## 版本信息

- 服务器版本: $NEW_VERSION
- 最后更新: $TODAY
EOF

# 提交更改
git add .
git commit -m "服务器部署版本更新 $(date '+%Y-%m-%d')

- 更新前端构建文件至最新版本
- 更新服务器脚本至 $NEW_VERSION
- 更新部署日期: $TODAY"

echo ""
echo "✅ 服务器版本更新完成! 版本: $NEW_VERSION"
echo ""
echo "📤 推送到远程仓库命令:"
echo "git push origin $TARGET_BRANCH --force"
echo ""
echo "🚀 服务器部署命令:"
echo "1. 在服务器上: git pull"
echo "2. 重启服务: pm2 restart nav-site"
echo ""
echo "🔙 返回开发分支:"
echo "git checkout $SOURCE_BRANCH"
echo ""
