# 🚀 部署指南

## 已完成部署

### GitHub Pages (已部署)
- **网站地址**: https://gamelibs.github.io/simple-nav-site/
- **特点**: 免费，自动部署
- **限制**: 不支持环境变量，编辑功能不可用
- **更新方式**: 运行 `npm run deploy`

## 启用编辑功能的部署选项

### 1. Vercel 部署 (推荐)

#### 步骤：
1. 访问 [vercel.com](https://vercel.com)
2. 使用 GitHub 账号登录
3. 点击 "New Project"
4. 导入 `gamelibs/simple-nav-site` 仓库
5. 在环境变量设置中添加：
   ```
   REACT_APP_GITHUB_TOKEN=你的GitHub_token
   ```
6. 点击 "Deploy"

#### 优势：
- ✅ 支持环境变量
- ✅ 自动部署
- ✅ 全球 CDN
- ✅ 免费额度充足

### 2. Netlify 部署

#### 步骤：
1. 访问 [netlify.com](https://netlify.com)
2. 连接 GitHub 账号
3. 选择 `gamelibs/simple-nav-site` 仓库
4. 在 Site settings > Environment variables 中添加：
   ```
   REACT_APP_GITHUB_TOKEN=你的GitHub_token
   ```
5. 触发重新部署

#### 优势：
- ✅ 支持环境变量
- ✅ 表单处理
- ✅ 免费 SSL
- ✅ 自动部署

## 部署状态检查

### 检查网站是否正常
访问部署的网站，检查：
- ✅ 页面正常加载
- ✅ 网站列表显示正确
- ✅ 搜索功能正常
- ✅ 分类切换正常

### 检查编辑功能（仅 Vercel/Netlify）
1. 尝试以下方式激活编辑模式：
   - 按 `Ctrl+E` 或 `Cmd+E`
   - 访问 `你的网站地址?edit=1`
   - 连续按3次 `E` 键
   - 长按标题3秒

2. 如果显示编辑按钮，说明配置成功

## 更新部署

### 自动更新
所有平台都支持自动部署：
- 推送代码到 main 分支会自动触发重新部署

### 手动更新
```bash
# 本地更新
git add .
git commit -m "更新内容"
git push origin main

# GitHub Pages 手动部署
npm run deploy
```

## 环境变量安全

### ⚠️ 重要提醒
- 永远不要在代码中硬编码 token
- `.env` 文件已被 `.gitignore` 排除
- 在部署平台的环境变量设置中配置 token

### 生产环境配置
在部署平台设置以下环境变量：
```
REACT_APP_GITHUB_TOKEN=ghp_你的实际token
```

## 故障排除

### 编辑功能不可用
1. 检查环境变量是否正确设置
2. 检查 token 是否有 `repo` 权限
3. 检查 token 是否过期

### 网站无法访问
1. 检查部署状态
2. 查看构建日志
3. 验证域名设置

### 中文显示乱码
- 确保服务器正确设置了 UTF-8 编码
- 检查 HTML meta 标签

## 监控和维护

### 定期检查
- GitHub token 有效期
- 网站访问速度
- 编辑功能正常性

### 备份建议
- 定期导出网站数据
- 保存 token 的安全副本
- 备份重要配置文件

---

🎉 **恭喜！你的网站已成功部署上线！**

当前可用地址：
- GitHub Pages: https://gamelibs.github.io/simple-nav-site/
- Vercel/Netlify: 配置后可获得编辑功能
