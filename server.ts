import express from "express";
import cors from "cors";
import { queryPlayer } from "./lib/query";
import { prisma } from "./lib/db";
import { getRatelimit } from "./lib/redis";
import { fetchLeaderboard, GAME_MODE_LABELS, SHARD_LABELS, getCurrentSeasonId } from "./lib/pubg";
import type { GameMode, LeaderboardShard } from "./lib/pubg";

const app = express();
const PORT = Number(process.env.API_PORT) || 3001;

app.use(cors());
app.use(express.json());

// 简单的 IP 限流
async function rateLimit(req: express.Request): Promise<{ ok: boolean; remaining: number }> {
  try {
    const ip = (req.headers["x-forwarded-for"] as string)?.split(",")[0]?.trim()
      || req.socket.remoteAddress || "127.0.0.1";
    const ratelimit = await getRatelimit();
    const { success, remaining } = await ratelimit.limit(ip);
    return { ok: success, remaining };
  } catch {
    return { ok: true, remaining: -1 };
  }
}

// ─── 路由 ─────────────────────────────────────

// GET /api/query?q=xxx&season=xxx
app.get("/api/query", async (req, res) => {
  const { ok, remaining } = await rateLimit(req);
  res.setHeader("X-RateLimit-Remaining", String(remaining));
  if (!ok) return res.status(429).json({ error: "请求过于频繁" });

  const q = (req.query.q as string)?.trim();
  if (!q || q.length < 2) return res.status(400).json({ error: "无效输入" });

  const season = (req.query.season as string) || undefined;
  const result = await queryPlayer(q, season);

  // 日志
  prisma.queryLog.create({
    data: {
      input: q, type: result.type,
      ip: req.socket.remoteAddress || "",
      success: !result.error,
    },
  }).catch(() => {});

  res.json(result);
});

// GET /api/history?page=1&q=&type=all
app.get("/api/history", async (req, res) => {
  const page = Number(req.query.page || "1");
  const q = (req.query.q as string || "").trim();
  const type = (req.query.type as string || "all");
  const pageSize = 20;

  const where = {
    ...(q ? { input: { contains: q, mode: "insensitive" as const } } : {}),
    ...(type !== "all" ? { type } : {}),
  };

  const [total, logs, recentPlayers, stats] = await Promise.all([
    prisma.queryLog.count({ where }),
    prisma.queryLog.findMany({
      where, orderBy: { createdAt: "desc" },
      skip: (page - 1) * pageSize, take: pageSize,
      select: { id: true, input: true, type: true, success: true, createdAt: true },
    }),
    prisma.player.findMany({
      orderBy: { queriedAt: "desc" }, take: 50,
      select: { name: true, steamId: true, favorite: true, queriedAt: true },
    }),
    Promise.all([
      prisma.queryLog.count(),
      prisma.queryLog.count({ where: { success: true } }),
      prisma.queryLog.count({ where: { type: "name" } }),
      prisma.queryLog.count({ where: { type: "steamid" } }),
    ]),
  ]);

  const [totalAll, totalSuccess, totalName, totalSteam] = stats;
  res.json({
    logs: logs.map(l => ({ ...l, createdAt: l.createdAt.toISOString() })),
    recentPlayers: recentPlayers.map(p => ({ ...p, queriedAt: p.queriedAt.toISOString() })),
    pagination: { page, pageSize, total, totalPages: Math.ceil(total / pageSize) },
    stats: { totalAll, totalSuccess, totalName, totalSteam },
  });
});

// GET /api/favorites — 列出收藏
app.get("/api/favorites", async (_req, res) => {
  const favorites = await prisma.player.findMany({
    where: { favorite: true },
    orderBy: { queriedAt: "desc" },
    select: { name: true, steamId: true, queriedAt: true },
    take: 50,
  });
  res.json(favorites.map(p => ({
    ...p, queriedAt: p.queriedAt.toISOString(),
  })));
});

// POST /api/favorites — 切换收藏
app.post("/api/favorites", async (req, res) => {
  const name: string | undefined = req.body?.name;
  if (!name) return res.status(400).json({ error: "invalid name" });

  const nameLower = name.toLowerCase();
  const player = await prisma.player.findUnique({ where: { nameLower } });

  if (!player) {
    await prisma.player.create({
      data: { name, nameLower, favorite: true },
    });
    return res.json({ favorited: true });
  }

  const updated = await prisma.player.update({
    where: { nameLower },
    data: { favorite: !player.favorite },
  });
  return res.json({ favorited: updated.favorite });
});

// GET /api/status — PUBG 服务器状态 + Steam 在线人数（服务端代理，避免 CORS）
app.get("/api/status", async (_req, res) => {
  const result: any = { pubgStatus: "未知", steamOnline: null };
  try {
    const pubgRes = await fetch("https://api.pubg.com/status");
    result.pubgStatus = pubgRes.ok ? "正常运行" : "异常";
  } catch {}
  try {
    const url = process.env.STEAM_API_KEY
      ? `https://api.steampowered.com/ISteamUserStats/GetNumberOfCurrentPlayers/v1/?appid=578080&key=${process.env.STEAM_API_KEY}`
      : `https://api.steampowered.com/ISteamUserStats/GetNumberOfCurrentPlayers/v1/?appid=578080`;
    const steamRes = await fetch(url);
    const json: any = await steamRes.json();
    result.steamOnline = json?.response?.player_count ?? null;
  } catch {}
  res.json(result);
});

// GET /api/leaderboard?shard=pc-as&mode=squad-fpp&season=xxx
const VALID_MODES: GameMode[] = ["solo", "solo-fpp", "duo", "duo-fpp", "squad", "squad-fpp"];
const VALID_SHARDS: LeaderboardShard[] = ["pc-eu", "pc-na", "pc-as", "pc-krjp"];

app.get("/api/leaderboard", async (req, res) => {
  const mode = (req.query.mode as string || "squad-fpp") as GameMode;
  const shard = (req.query.shard as string || "pc-as") as LeaderboardShard;
  const seasonId = req.query.season as string | undefined;

  if (!VALID_MODES.includes(mode)) {
    return res.status(400).json({ error: `无效模式: ${mode}` });
  }
  if (!VALID_SHARDS.includes(shard)) {
    return res.status(400).json({ error: `无效区服: ${shard}` });
  }

  const data = await fetchLeaderboard(shard, mode, seasonId);
  if (!data) {
    return res.status(502).json({ error: "获取排行榜失败，可能赛季或区服暂无数据" });
  }

  res.json({
    ...data,
    shardLabel: SHARD_LABELS[shard],
    modeLabel: GAME_MODE_LABELS[mode],
    modes: VALID_MODES.map((m) => ({ id: m, label: GAME_MODE_LABELS[m] })),
    shards: VALID_SHARDS.map((s) => ({ id: s, label: SHARD_LABELS[s] })),
  });
});

// 健康检查

app.listen(PORT, () => {
  console.log(`🔌 API server running on http://0.0.0.0:${PORT}`);
});
