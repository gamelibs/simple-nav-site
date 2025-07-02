# 🚀 快速启动指南

## 环境要求
- Node.js 14.0+
- npm 6.0+

## 一键启动（推荐）

### 方法1: 手动启动（稳定）
```bash
# 1. 安装依赖
npm install

# 2. 启动后端服务器（终端1）
node server.js

# 3. 启动前端开发服务器（终端2）
npm start
```

### 方法2: 并行启动（需要concurrently）
```bash
# 1. 安装依赖
npm install

# 2. 安装并行启动工具
npm install -g concurrently

# 3. 同时启动前后端
npm run dev
```

## 访问地址
- 🌐 前端应用: http://localhost:3000
- 🔌 后端API: http://localhost:15001
- 📊 健康检查: http://localhost:15001/api/health

## 编辑功能
激活编辑模式的方法：
1. URL参数: `http://localhost:3000?edit=1`
2. 快捷键: `Ctrl+E` 或 `Cmd+E`
3. 连续按3次字母 `E`
4. 长按标题3秒

## 常见问题

### Q: 端口被占用怎么办？
A: 修改 `server.js` 中的 `PORT` 变量，同时更新 `src/hooks/useLocalAPI.js` 中的 `API_BASE_URL`

### Q: 前端启动失败？
A: 确保先启动后端服务器，前端需要连接到API

### Q: 编辑功能不工作？
A: 检查后端服务器是否正常运行，查看浏览器控制台错误信息

### Q: 数据丢失了？
A: 所有数据保存在 `src/data.json` 文件中，检查该文件是否存在

## 生产部署
```bash
# 构建前端
npm run build

# 使用部署脚本
chmod +x deploy.sh
./deploy.sh

# 启动生产服务器
node server.js
```

详细说明请查看 README.md 和 DEPLOYMENT.md
