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

## 更新已部署的应用

如果已经部署了应用，使用以下命令更新：

```bash
# 进入应用目录
cd nav-site

# 运行更新脚本
./update-server.sh
```

## 文件结构

- `build/` - 前端静态文件
- `server.js` - Node.js 服务器
- `package.json` - 依赖配置
- `src/data.json` - 数据文件
- `update-server.sh` - 服务器端更新脚本

## 端口

默认端口：15001
