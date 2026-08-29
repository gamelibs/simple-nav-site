#!/usr/bin/env bash
# ============================================================
# 简约导航站 一键部署/更新脚本（server-deploy 分支）
#
# 功能：
#   1. 检查并按需安装 Node.js 运行环境
#   2. 同步远程 server-deploy 分支最新代码
#   3. 按需安装/更新依赖
#   4. 启动或重启 nav-site 服务（优先 pm2，其次 nohup）
#   5. 健康检查
#
# 用法：
#   bash deploy.sh          或        npm run deploy
#
# 编辑密码：在项目根目录创建 .env 文件，写入一行：
#   EDIT_PASSWORD=你的强密码
# ============================================================
set -euo pipefail

APP_NAME="nav-site"
BRANCH="server-deploy"
PORT=15001
MIN_NODE_MAJOR=16
BACKUP_DIR=".data-backup"

info() { echo -e "\033[1;34m[deploy]\033[0m $*"; }
ok()   { echo -e "\033[1;32m[deploy]\033[0m $*"; }
warn() { echo -e "\033[1;33m[deploy]\033[0m ⚠️  $*"; }
err()  { echo -e "\033[1;31m[deploy]\033[0m ❌ $*" >&2; }

# 切换到脚本所在目录（项目根目录）
cd "$(dirname "$0")"

# ---------- 1. 检查 / 安装 Node.js ----------
node_ok() {
  command -v node >/dev/null 2>&1 && \
  [ "$(node -v | sed -e 's/^v//' -e 's/\..*//')" -ge "$MIN_NODE_MAJOR" ]
}

if node_ok; then
  info "Node.js $(node -v) 已就绪"
else
  warn "未检测到 Node.js >= $MIN_NODE_MAJOR，尝试自动安装..."
  if command -v apt-get >/dev/null 2>&1; then
    curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
    sudo apt-get install -y nodejs
  elif command -v dnf >/dev/null 2>&1; then
    curl -fsSL https://rpm.nodesource.com/setup_20.x | sudo bash -
    sudo dnf install -y nodejs
  elif command -v yum >/dev/null 2>&1; then
    curl -fsSL https://rpm.nodesource.com/setup_20.x | sudo bash -
    sudo yum install -y nodejs
  elif command -v brew >/dev/null 2>&1; then
    brew install node
  else
    err "无法自动安装 Node.js，请手动安装 Node.js >= $MIN_NODE_MAJOR 后重试"
    exit 1
  fi
  node_ok || { err "Node.js 安装失败"; exit 1; }
  ok "Node.js $(node -v) 安装完成"
fi

# ---------- 2. 同步远程代码 ----------
info "检查远程 $BRANCH 分支更新..."
git fetch origin "$BRANCH"

LOCAL=$(git rev-parse HEAD)
REMOTE=$(git rev-parse "origin/$BRANCH")
CHANGED=0

if [ "$LOCAL" != "$REMOTE" ]; then
  # 线上编辑产生的 data.json 改动不能静默丢弃，先备份
  if ! git diff --quiet -- src/data.json 2>/dev/null; then
    mkdir -p "$BACKUP_DIR"
    cp src/data.json "$BACKUP_DIR/data.json.$(date +%Y%m%d%H%M%S)"
    warn "检测到本地 data.json 有改动（可能是线上编辑产生），已备份到 $BACKUP_DIR/"
  fi
  info "发现新版本 $REMOTE，同步中..."
  git reset --hard "origin/$BRANCH"
  CHANGED=1
  ok "代码已更新到最新版本"
else
  info "代码已是最新（$LOCAL）"
fi

# ---------- 3. 按需安装依赖 ----------
if [ ! -d node_modules ] || [ "$CHANGED" = "1" ] || [ package-lock.json -nt node_modules ]; then
  info "安装/更新依赖..."
  npm ci --omit=dev
  ok "依赖安装完成"
else
  info "依赖无变化，跳过安装"
fi

# ---------- 4. 读取编辑密码 ----------
if [ -f .env ]; then
  set -a; . ./.env; set +a
  info "已从 .env 加载配置"
fi
if [ -z "${EDIT_PASSWORD:-}" ]; then
  warn "未设置 EDIT_PASSWORD，服务将使用代码内默认密码（不安全）"
  warn "请创建 .env 文件写入: EDIT_PASSWORD=你的强密码"
fi

# ---------- 5. 启动 / 重启服务 ----------
if command -v pm2 >/dev/null 2>&1; then
  if pm2 describe "$APP_NAME" >/dev/null 2>&1; then
    info "pm2 重启 $APP_NAME..."
    EDIT_PASSWORD="${EDIT_PASSWORD:-}" pm2 restart "$APP_NAME" --update-env
  else
    info "pm2 首次启动 $APP_NAME..."
    EDIT_PASSWORD="${EDIT_PASSWORD:-}" pm2 start nav-server.js --name "$APP_NAME"
    pm2 save
  fi
else
  warn "未安装 pm2，使用 nohup 后台运行（建议执行: npm i -g pm2 后重新运行本脚本）"
  pkill -f "node nav-server.js" 2>/dev/null || true
  sleep 1
  EDIT_PASSWORD="${EDIT_PASSWORD:-}" nohup node nav-server.js > server.log 2>&1 &
  info "服务已通过 nohup 启动，日志: server.log"
fi

# ---------- 6. 健康检查 ----------
sleep 2
if curl -fsS "http://127.0.0.1:$PORT/api/health" >/dev/null 2>&1; then
  ok "部署完成，服务运行正常 ✅  http://127.0.0.1:$PORT"
else
  err "健康检查未通过，请查看日志（pm2 logs $APP_NAME 或 server.log）"
  exit 1
fi
