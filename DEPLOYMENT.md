# 简约导航站 - 部署指南

本文档提供了打包和部署简约导航站的完整指南，包括前端应用和API服务器。

## 一、前端应用打包

### 1. 环境准备

确保您已安装最新版本的 Node.js (14.x 或更高版本) 和 npm。

```bash
node -v
npm -v
```

### 2. 安装依赖

在项目根目录下运行：

```bash
npm install
```

### 3. 配置生产环境变量

检查 `.env.production` 文件中的环境变量配置：

```
REACT_APP_API_BASE_URL=https://nav.ovokit.xyz/api
GENERATE_SOURCEMAP=false
```

确保 API 基础 URL 指向您的生产服务器地址。

### 4. 构建前端应用

运行构建命令生成生产环境优化的静态文件：

```bash
npm run build
```

成功后，将在 `build` 目录中生成可部署的静态文件。

## 二、部署静态资源

### 1. 使用 Nginx 部署 (推荐)

将 `build` 目录中的文件复制到 Nginx 的网站根目录，例如：

```bash
cp -r build/* /var/www/html/
```

配置 Nginx 配置文件 (例如 `/etc/nginx/sites-available/simple-nav-site`)：

```nginx
server {
    listen 80;
    server_name your-domain.com;
    root /var/www/html;
    
    location / {
        try_files $uri /index.html;
    }
    
    location /api {
        proxy_pass http://localhost:15001;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

重启 Nginx：

```bash
sudo nginx -t
sudo systemctl restart nginx
```

### 2. 使用静态文件服务器

如果您使用其他静态文件服务器，请确保：

1. 所有路由请求都重定向到 index.html
2. 所有 API 请求 (/api/*) 都正确代理到 API 服务器

## 三、部署 API 服务器

### 1. 使用脚本部署

使用项目附带的部署脚本：

```bash
bash deploy.sh
```

### 2. 手动部署

在项目根目录下运行：

```bash
# 安装生产依赖
npm install --production

# 启动服务器
node server.js
```

### 3. 使用 PM2 管理服务器 (推荐)

```bash
# 安装 PM2
npm install -g pm2

# 启动服务
pm2 start server.js --name simple-nav-site

# 设置开机自启
pm2 startup
pm2 save
```

## 四、验证部署

1. 访问您的网站域名，确认前端应用加载正常
2. 检查网站功能，包括分类浏览、搜索和管理功能
3. 检查 API 是否正常响应：`curl https://your-domain.com/api/health`

## 五、常见问题排查

### 1. 前端无法连接到 API

检查 `.env.production` 中的 API 地址是否正确配置，并确保 API 服务器正在运行。

### 2. 页面刷新后出现 404

确保您的静态服务器配置了正确的路由重定向规则，所有路由请求应该重定向到 index.html。

### 3. API 权限错误

确保 `src/data.json` 文件具有正确的读写权限，并且服务器进程有权限访问该文件。

```bash
chmod 644 src/data.json
```

## 六、数据备份

定期备份 `src/data.json` 文件，以防数据丢失：

```bash
# 创建数据备份脚本
cat > backup.sh << 'EOF'
#!/bin/bash
BACKUP_DIR="/path/to/backups"
mkdir -p $BACKUP_DIR
cp src/data.json $BACKUP_DIR/data_$(date +%Y%m%d_%H%M%S).json
echo "数据备份完成: $BACKUP_DIR/data_$(date +%Y%m%d_%H%M%S).json"
EOF

# 给脚本执行权限
chmod +x backup.sh
```

可以将此脚本添加到 crontab 定时任务中实现自动备份。

---

如有更多部署问题，请联系技术支持。