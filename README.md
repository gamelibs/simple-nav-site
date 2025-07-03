# 简约导航站 - 服务器部署版本

这是服务器部署分支，只包含运行必需的文件。

## 快速部署

```bash
# 克隆服务器分支
git clone -b server-deploy https://github.com/gamelibs/simple-nav-site.git nav-site

# 安装依赖
cd nav-site
npm install --production

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

## 版本信息

- 服务器版本: 1.0.2
- 最后更新: 2025年07月03日
