# PUBG.BAR — 玩家数据查询站

PUBG 玩家封禁状态 / 战绩 / Steam 数据查询，基于 Next.js 14 App Router 全栈构建。

## 功能

- **昵称查询**：输入 PUBG 昵称，查询封禁状态 / 本赛季战绩
- **Steam ID 查询**：输入 17 位 Steam64 ID，查询 VAC 封禁 / 游戏时长
- **大小写关联**：成功查询后记录正确昵称，后续不区分大小写
- **结果缓存**：API 结果缓存 5 分钟，减少重复请求
- **限速防护**：每 IP 每分钟 20 次，防止滥用

## 技术栈

| 层次 | 技术 |
|------|------|
| 框架 | Next.js 14 App Router |
| 数据库 | PostgreSQL 16 + Prisma ORM |
| 缓存/限速 | Redis 7 (Upstash / 自托管) |
| 样式 | Tailwind CSS |
| 部署 | Docker / Vercel |

## 目录结构

```
game-query/
├── app/
│   ├── layout.tsx              # 全局布局
│   ├── page.tsx                # 主查询页
│   ├── globals.css
│   ├── api/query/route.ts      # GET /api/query?q=...
│   └── result/[name]/page.tsx  # 结果页（SSR）
├── components/
│   ├── ResultCard.tsx          # 查询结果卡片
│   └── LoadingCard.tsx         # 骨架屏
├── lib/
│   ├── db.ts                   # Prisma 客户端
│   ├── redis.ts                # Redis 客户端 + Rate Limiter
│   ├── pubg.ts                 # PUBG 官方 API 封装
│   ├── steam.ts                # Steam Web API 封装
│   └── query.ts                # 查询核心逻辑（聚合）
├── prisma/
│   └── schema.prisma           # 数据库 Schema
├── Dockerfile                  # 多阶段构建
└── docker-compose.yml          # 一键部署编排
```

## 快速启动

### Docker 部署（推荐）

一条命令搞定，包含 Next.js + PostgreSQL + Redis 全套服务。

```bash
# 1. 配置环境变量
cp .env.example .env
# 编辑 .env，填入 PUBG_API_KEY 和 STEAM_API_KEY

# 2. 启动全部服务
docker compose up -d --build

# 3. 查看日志
docker compose logs -f app
```

访问 http://localhost:3000

**Docker 服务组成：**

| 服务 | 端口 | 说明 |
|------|------|------|
| `app` | 3000 | Next.js 应用（自动 prisma db push + 启动） |
| `db` | 5432 | PostgreSQL 16（带健康检查） |
| `redis` | 6379 | Redis 7（替代 Upstash，自托管） |

**常用命令：**

```bash
docker compose up -d          # 后台启动
docker compose down           # 停止并删除容器
docker compose down -v        # 停止 + 清数据（⚠️ 数据库和 Redis 数据会丢）
docker compose up -d --build  # 重新构建并启动
docker compose restart app    # 只重启应用
```

**数据持久化：** PostgreSQL 和 Redis 数据通过 Docker Volume 持久化，`docker compose down` 不会丢失数据；只有加 `-v` 才会清除。

### 本地开发

```bash
npm install
cp .env.example .env.local   # 编辑填入所有 Key
npm run db:generate
npm run db:push
npm run dev
```

## 环境变量

| 变量 | 说明 | 获取地址 |
|------|------|---------|
| `PUBG_API_KEY` | PUBG 官方 API Key | https://developer.pubg.com/ |
| `STEAM_API_KEY` | Steam Web API Key | https://steamcommunity.com/dev/apikey |
| `POSTGRES_*` / `REDIS_*` | Docker 部署已内置，无需手动配置 | — |
| `UPSTASH_REDIS_*` | 仅 Vercel 部署需要 | https://upstash.com |

## API 文档

### GET /api/query?q={input}

查询玩家信息。

**请求参数**

| 参数 | 说明 |
|------|------|
| `q` | 玩家昵称 或 17 位 Steam64 ID |

**响应示例**

```json
{
  "type": "name",
  "input": "shroud",
  "pubg": {
    "id": "account.xxx",
    "name": "shroud",
    "banType": "Innocent",
    "seasonStats": {
      "kills": 1523,
      "wins": 48,
      "top10s": 200,
      "matches": 430,
      "kda": 3.72,
      "damageDealt": 1200000
    }
  },
  "fromCache": false
}
```

## 部署到 Vercel

```bash
npm i -g vercel
vercel --prod
```

在 Vercel 控制台添加环境变量后，数据库和 Redis 需要分别配置 Vercel Postgres 和 Upstash Redis 集成。

## 注意事项

- PUBG 官方 API 有延迟，非实时数据，以游戏内为准
- Steam API 免费额度充足，无需担心费用
- Docker 部署自带 PostgreSQL + Redis，无需外部依赖
- 本项目仅供学习使用，与 PUBG / Steam 官方无关
