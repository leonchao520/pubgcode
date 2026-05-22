# Stage 1: 依赖安装 & 构建
FROM node:20-alpine AS builder

WORKDIR /app

# 接收运行时 env vars 作为 build args（避免构建时内联 undefined）
ARG STEAM_API_KEY
ARG PUBG_API_KEY
ENV STEAM_API_KEY=$STEAM_API_KEY
ENV PUBG_API_KEY=$PUBG_API_KEY

# 安装构建工具 + OpenSSL（Prisma 依赖）
RUN apk add --no-cache python3 make g++ openssl

COPY package.json package-lock.json* ./
RUN npm ci --ignore-scripts

COPY prisma ./prisma
RUN npx prisma generate

COPY . .
RUN npm run build

# Stage 2: 生产运行
FROM node:20-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production

# 安装 wget + OpenSSL（Prisma 运行时依赖）
RUN apk add --no-cache wget openssl

# 从 builder 复制产物
COPY --from=builder /app/package.json ./
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public
COPY --from=builder /app/next.config.mjs ./next.config.mjs
COPY --from=builder /app/prisma ./prisma

# 生成 Prisma Client
RUN npx prisma generate

EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=5s --start-period=15s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:3000/api/query?q=test || exit 1

# 启动：初始化数据库 → 启动 Next.js
CMD ["sh", "-c", "npx prisma db push --skip-generate 2>&1; npm start"]
