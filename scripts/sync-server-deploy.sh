#!/usr/bin/env bash
# ============================================================
# 将 main 分支的最新构建产物同步到 server-deploy 部署分支
#
# 流程：
#   1. 检查当前在 main 分支且工作区干净（build/ 除外）
#   2. npm run build 构建
#   3. 构建产物有变化则先提交到 main
#   4. 切换到 server-deploy，检出 main 的 build/，提交并推送
#   5. 切回 main
#
# 用法：bash scripts/sync-server-deploy.sh  或  npm run sync:deploy
#
# 注意：默认不同步 src/data.json —— 服务器上的线上编辑数据
# 以服务器本地为准（deploy.sh 更新代码前会自动备份），避免
# 用 main 的旧数据覆盖线上数据。
# ============================================================
set -euo pipefail

cd "$(dirname "$0")/.."

info() { echo -e "\033[1;34m[sync]\033[0m $*"; }
ok()   { echo -e "\033[1;32m[sync]\033[0m $*"; }
err()  { echo -e "\033[1;31m[sync]\033[0m ❌ $*" >&2; }

# ---------- 1. 前置检查 ----------
if [ "$(git branch --show-current)" != "main" ]; then
  err "请先切换到 main 分支再运行本脚本"
  exit 1
fi
if [ -n "$(git status --porcelain -- . ':!build')" ]; then
  err "工作区有未提交改动（build/ 除外），请先提交或暂存"
  git status --short -- . ':!build'
  exit 1
fi

# ---------- 2. 构建 ----------
info "构建生产版本..."
npm run build

# ---------- 3. 构建产物提交到 main ----------
if [ -n "$(git status --porcelain -- build)" ]; then
  git add build
  git commit -m "chore: 更新构建产物"
  ok "构建产物已提交到 main"
else
  info "构建产物无变化，跳过 main 提交"
fi

# ---------- 4. 同步到 server-deploy ----------
info "切换到 server-deploy 并同步 build/ ..."
git checkout server-deploy
git checkout main -- build

if [ -n "$(git status --porcelain -- build)" ]; then
  git add build
  git commit -m "chore: 同步 main 最新构建产物"
  git push origin server-deploy
  ok "已推送到 origin/server-deploy"
else
  info "server-deploy 的 build/ 已是最新，无需提交"
fi

# ---------- 5. 切回 main ----------
git checkout main

ok "同步完成！到服务器项目目录执行 bash deploy.sh 即可更新线上服务"
