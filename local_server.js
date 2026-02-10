const path = require('path');
const express = require('express');

const PORT = process.env.PORT || 9000;
const BUILD_DIR = path.join(__dirname, 'build');

const app = express();

// 提供静态文件
app.use(express.static(BUILD_DIR));

// SPA 回退：所有 GET 请求返回 build/index.html
app.get('*', (req, res) => {
  res.sendFile(path.join(BUILD_DIR, 'index.html'));
});

app.listen(PORT, () => {
  console.log(`🌐 本地服务器已启动: http://localhost:${PORT}`);
  console.log(`📁 提供 build 文件夹: ${BUILD_DIR}`);
});

module.exports = app;
