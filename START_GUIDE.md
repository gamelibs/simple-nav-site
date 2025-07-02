# 启动指南

## 快速启动

### 方法一：直接启动服务器（推荐）
```bash
npm run serve
```
或
```bash
node server.js
```

然后在浏览器中访问：http://localhost:15001

### 方法二：重新构建并启动
```bash
npm run build-and-serve
```

### 方法三：开发模式
```bash
npm run dev
```
这将同时启动开发服务器和 API 服务器

## 功能说明

启动后你可以：

1. **访问网站**：http://localhost:15001
   - 查看构建后的静态网站
   - 使用所有前端功能

2. **API 接口**：http://localhost:15001/api
   - `/api/data` - 获取所有数据
   - `/api/sites` - 网站管理（增删改）
   - `/api/categories` - 分类管理
   - `/api/health` - 健康检查

3. **编辑功能**：
   - 在网站界面中可以直接编辑、添加、删除网站
   - 所有更改会实时保存到 `src/data.json` 文件
   - 前端与后端 API 完全集成

## 端口说明

- 服务器端口：15001
- 包含静态文件托管 + API 服务

## 文件结构

- `build/` - 构建后的静态文件
- `src/data.json` - 数据存储文件
- `server.js` - Express 服务器
- `public/icons/` - 图标文件

## 注意事项

1. 确保 `build/` 目录存在且包含构建文件
2. 如果 `build/` 目录不存在，请先运行 `npm run build`
3. 数据会保存在 `src/data.json` 文件中
4. 图标文件位于 `public/icons/` 和 `build/icons/` 目录
