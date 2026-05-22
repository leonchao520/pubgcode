import { NextRequest, NextResponse } from "next/server";
import { fetchLeaderboard, GAME_MODE_LABELS, SHARD_LABELS, type GameMode, type LeaderboardShard } from "@/lib/pubg";
import { getCached, setCached } from "@/lib/redis";

export const runtime = "nodejs";

const VALID_MODES: GameMode[] = ["solo", "solo-fpp", "duo", "duo-fpp", "squad", "squad-fpp"];
const VALID_SHARDS: LeaderboardShard[] = ["pc-eu", "pc-na", "pc-as", "pc-krjp"];
const CACHE_TTL = 600; // 排行榜缓存 10 分钟

export async function GET(req: NextRequest) {
  const mode = (req.nextUrl.searchParams.get("mode") || "squad-fpp") as GameMode;
  const shard = (req.nextUrl.searchParams.get("shard") || "pc-eu") as LeaderboardShard;
  const seasonId = req.nextUrl.searchParams.get("season") || undefined;

  if (!VALID_MODES.includes(mode)) {
    return NextResponse.json({ error: `无效模式: ${mode}` }, { status: 400 });
  }
  if (!VALID_SHARDS.includes(shard)) {
    return NextResponse.json({ error: `无效区服: ${shard}` }, { status: 400 });
  }

  const cacheKey = `gq:leaderboard:${shard}:${mode}:${seasonId || "auto"}`;

  const cached = await getCached(cacheKey);
  if (cached) {
    return NextResponse.json({ ...(cached as object), fromCache: true });
  }

  const data = await fetchLeaderboard(shard, mode, seasonId);
  if (!data) {
    return NextResponse.json({ error: "获取排行榜失败，可能赛季或区服暂无数据" }, { status: 502 });
  }

  await setCached(cacheKey, data);

  return NextResponse.json({
    ...data,
    shardLabel: SHARD_LABELS[shard],
    modeLabel: GAME_MODE_LABELS[mode],
    modes: VALID_MODES.map((m) => ({ id: m, label: GAME_MODE_LABELS[m] })),
    shards: VALID_SHARDS.map((s) => ({ id: s, label: SHARD_LABELS[s] })),
    fromCache: false,
  });
}
