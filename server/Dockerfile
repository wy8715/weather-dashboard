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

# 复制依赖文件并安装（含开发依赖，用于编译 TypeScript）
COPY package.json package-lock.json ./
RUN npm ci

# 复制后端源码并编译
COPY tsconfig.json ./
COPY src/ ./src/
RUN npm run build

# 清理开发依赖，仅保留生产依赖
# 原生模块已在本阶段编译完成，直接供运行阶段复用，避免运行阶段再次联网下载
RUN npm prune --omit=dev

# ---------- 阶段二：运行 ----------
FROM node:20-alpine

WORKDIR /app

# 运行时仅需 curl 用于健康检查，原生模块已在构建阶段编译完成，无需再装编译工具链
RUN apk add --no-cache curl

# 从构建阶段复制生产依赖与编译产物，避免运行阶段再次执行 npm ci 联网安装原生模块
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist
COPY package.json ./

# 创建数据目录（挂载点）
RUN mkdir -p /app/data

# 健康检查（Alpine busybox wget 不支持 --spider，必须用 curl）
HEALTHCHECK --interval=30s --timeout=3s --start-period=10s --retries=3 \
  CMD curl -f http://localhost:3201/ || exit 1

EXPOSE 3201

CMD ["node", "dist/app/index.js"]
