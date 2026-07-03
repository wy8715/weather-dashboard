# ============================================================
# 后端 Dockerfile - City Weather Dashboard 后端服务
# 多阶段构建：TS 编译 → Node 生产运行
# better-sqlite3 需要编译工具链（python3/make/g++）
# ============================================================

# ---------- 阶段一：构建 ----------
FROM node:20-alpine AS builder

WORKDIR /app

# better-sqlite3 是 C++ 原生模块，需要编译工具链
RUN apk add --no-cache python3 make g++

# 复制依赖文件并安装
COPY package.json package-lock.json ./
RUN npm ci

# 复制后端源码并编译
COPY tsconfig.json ./
COPY src/ ./src/
RUN npm run build

# ---------- 阶段二：运行 ----------
FROM node:20-alpine

WORKDIR /app

# better-sqlite3 运行时仍需这些库
RUN apk add --no-cache python3 make g++

# 复制 package 文件，只安装生产依赖
COPY package.json package-lock.json ./
RUN npm ci --omit=dev

# 从构建阶段复制编译产物
COPY --from=builder /app/dist ./dist

# 创建数据目录（挂载点）
RUN mkdir -p /app/data

# 健康检查
HEALTHCHECK --interval=30s --timeout=3s --start-period=10s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:3201/ || exit 1

EXPOSE 3201

CMD ["node", "dist/app/index.js"]
