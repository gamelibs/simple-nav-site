# 简约导航站 - 服务器部署分支（server-deploy）

纯净部署分支，只包含运行必需的文件。日常只需操作 `deploy.sh` 一个脚本。

## 首次部署

```bash
# 克隆本分支
git clone -b server-deploy https://github.com/gamelibs/simple-nav-site.git nav-site
cd nav-site

# 配置编辑密码（重要！不配置将使用代码内默认密码）
echo 'EDIT_PASSWORD=你的强密码' > .env

# 一键部署（自动检查/安装 Node.js、装依赖、启动服务）
bash deploy.sh
```

## 日常更新

```bash
bash deploy.sh
```

脚本会自动完成：检查 Node.js 环境 → 同步远程 server-deploy 最新代码 → 按需更新依赖 → 重启服务 → 健康检查。

## 文件结构

- `build/` - 前端静态文件（构建产物）
- `nav-server.js` - Node.js 服务（含编辑模式密码鉴权）
- `deploy.sh` - 一键部署/更新脚本
- `package.json` / `package-lock.json` - 运行依赖（仅 express / cors / fs-extra）
- `src/data.json` - 站点数据文件
- `.env` - 编辑密码配置（需自行创建，不入库）

## 端口与反向代理

默认端口：15001。Caddy 配置示例：

```caddy
nav.ovoforge.com {
    reverse_proxy 127.0.0.1:15001
    encode gzip
}
```

## 说明

- 所有写接口（增删改网站、增删分类）都需要编辑密码派生的令牌，密码只存在于服务端
- 服务运行中的线上编辑会写入 `src/data.json`；deploy 同步时若检测到本地数据改动，会自动备份到 `.data-backup/`
- 建议使用 pm2 托管进程（脚本会自动检测，未安装则回退 nohup）
