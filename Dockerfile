# ============================================================
# 前端 Dockerfile - City Weather Dashboard
# 多阶段构建：Vite 编译 → Nginx 静态服务
# ============================================================

# ---------- 阶段一：构建 ----------
FROM node:20-alpine AS builder

WORKDIR /app

# 复制依赖描述文件，利用 Docker 缓存层
COPY package.json package-lock.json ./
RUN npm ci

# 复制前端源码并构建
COPY tsconfig.json tsconfig.node.json vite.config.ts index.html ./
COPY public/ ./public/
COPY src/ ./src/
RUN npm run build

# ---------- 阶段二：运行 ----------
FROM nginx:alpine

# 复制构建产物到 Nginx 静态目录
COPY --from=builder /app/dist /usr/share/nginx/html

# 复制前端容器专用的 Nginx 配置
COPY deploy/nginx-frontend.conf /etc/nginx/conf.d/default.conf

# 健康检查
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:80/ || exit 1

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
