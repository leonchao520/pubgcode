const PUBG_BASE = "https://api.pubg.com/shards/steam";

function getHeaders(): Record<string, string> {
  const apiKey = process.env.PUBG_API_KEY;
  if (!apiKey) throw new Error("PUBG_API_KEY 未设置");
  return {
    Accept: "application/vnd.api+json",
    Authorization: `Bearer ${apiKey}`,
  };
}

/* ─── 类型定义 ─────────────────────────────── */

export interface GameModeStats {
  kills: number; wins: number; assists: number;
  top10s: number; matches: number; kda: number;
  damageDealt: number; avgRank: number;
  headshotKills: number; roadKills: number;
  teamKills: number; longestKill: number;
  timeSurvived: number; suicides: number;
}

export interface TierInfo {
  tier: string; subTier: string;
}

export interface SeasonInfo {
  id: string; displayName: string; isCurrentSeason: boolean;
}

export interface PubgPlayerData {
  id: string; name: string; banType: string;
  clanId?: string;
}

export interface SeasonStats {
  seasonId: string; seasonName: string;
  stats: Record<string, GameModeStats>; // key = mode (squad-fpp, solo, duo, etc.)
}

export interface RankedStats {
  stats: Record<string, GameModeStats & { currentTier: TierInfo; rankPoints: number }>;
}

export interface LifetimeStats extends GameModeStats {
  currentTier?: TierInfo; rankPoints?: number;
}

/* ─── API 函数 ─────────────────────────────── */

/** 从赛季 ID 中提取可排序的日期字符串 */
export function extractSeasonDate(seasonId: string): string {
  // 匹配 division.bro.official.pc-2018-01 或 division.bro.official.2018-09 等格式
  const match = seasonId.match(/(\d{4})-(\d{2})$/);
  if (match) return `${match[1]}-${match[2]}`;
  // 兜底：匹配年+月连写 如 -201801
  const match2 = seasonId.match(/-(\d{4})(\d{2})/);
  if (match2) return `${match2[1]}-${match2[2]}`;
  return seasonId; // fallback
}

/** 按编号排序赛季并分配「第 X 赛季」显示名，同时过滤 console/beta/pre 等无效赛季 */
export function sortAndNumberSeasons(seasons: SeasonInfo[]): SeasonInfo[] {
  // 只保留 PC 正式赛季（排除 console、beta、pre-release）
  let filtered = seasons.filter((s) => {
    const id = s.id.toLowerCase();
    if (id.includes("console")) return false;
    if (id.includes("-beta")) return false;
    if (id.includes("-pre")) return false;
    return true;
  });

  // 去重：pc-2018-01 和 2018-01 是同一赛季的不同 ID，优先保留带 pc- 的
  const dateMap = new Map<string, SeasonInfo>();
  for (const s of filtered) {
    const date = extractSeasonDate(s.id);
    const existing = dateMap.get(date);
    if (!existing || s.id.includes("pc-")) {
      dateMap.set(date, s);
    }
  }
  filtered = Array.from(dateMap.values());

  return filtered
    .sort((a, b) => extractSeasonDate(a.id).localeCompare(extractSeasonDate(b.id)))
    .map((s, i) => ({
      ...s,
      displayName: `第 ${i + 1} 赛季`,
    }));
}

/** 获取所有赛季列表 */
export async function fetchSeasons(): Promise<SeasonInfo[]> {
  const res = await fetch(`${PUBG_BASE}/seasons`, {
    headers: getHeaders(),
    signal: AbortSignal.timeout(10000),
  });
  if (!res.ok) return [];
  const json = await res.json();
  const raw = (json.data || []).map((s: any) => ({
    id: s.id,
    displayName: s.attributes?.displayName || s.id,
    isCurrentSeason: s.attributes?.isCurrentSeason === true,
  }));
  return sortAndNumberSeasons(raw);
}

/** 获取当前赛季 ID */
export async function getCurrentSeasonId(): Promise<string> {
  const seasons = await fetchSeasons();
  const current = seasons.find(s => s.isCurrentSeason);
  return current?.id || "division.bro.official.pc-2018-01";
}

/** 按昵称查玩家 */
export async function fetchPubgPlayerByName(name: string): Promise<PubgPlayerData | null> {
  const res = await fetch(
    `${PUBG_BASE}/players?filter[playerNames]=${encodeURIComponent(name)}`,
    { headers: getHeaders() }
  );
  if (res.status === 404) return null;
  if (res.status === 429) throw new Error("PUBG API 限流，请稍后再试");
  if (!res.ok) throw new Error(`PUBG API error: ${res.status}`);
  const json = await res.json();
  const p = json.data?.[0];
  if (!p) return null;
  return { id: p.id, name: p.attributes.name, banType: p.attributes.banType ?? "Innocent", clanId: p.attributes.clanId || undefined };
}

/* ─── 公会 ─────────────────────────────────── */

export interface ClanInfo {
  id: string;
  name: string;
  tag: string;
}

/** 根据 clanId 查询公会信息 */
export async function fetchClan(clanId: string): Promise<ClanInfo | null> {
  const res = await fetch(
    `${PUBG_BASE}/clans/${clanId}`,
    { headers: getHeaders(), signal: AbortSignal.timeout(8000) }
  );
  if (!res.ok) return null;
  const json = await res.json();
  const attrs = json.data?.attributes;
  if (!attrs) return null;
  return {
    id: json.data.id,
    name: attrs.clanName || "?",
    tag: attrs.clanTag || "",
  };
}

/* ─── 数据解析 ─────────────────────────────── */

function parseModeStats(raw: Record<string, any>): GameModeStats | null {
  if (!raw) return null;
  const m = raw.roundsPlayed ?? 0;
  if (m === 0) return null;
  const d = (m - (raw.wins ?? 0));
  return {
    kills: raw.kills ?? 0,
    wins: raw.wins ?? 0,
    assists: raw.assists ?? 0,
    top10s: raw.top10s ?? 0,
    matches: m,
    kda: d > 0 ? Number((( (raw.kills??0) + (raw.assists??0) ) / d).toFixed(2)) : (raw.kills??0) + (raw.assists??0),
    damageDealt: Math.round(raw.damageDealt ?? 0),
    avgRank: raw.avgRank ?? raw.averageRank ?? 0,
    headshotKills: raw.headshotKills ?? 0,
    roadKills: raw.roadKills ?? 0,
    teamKills: raw.teamKills ?? 0,
    longestKill: Math.round(raw.longestKill ?? 0),
    timeSurvived: raw.timeSurvived ?? 0,
    suicides: raw.suicides ?? 0,
  };
}

/* ─── 普通模式赛季数据 ────────────────────── */

export async function fetchNormalSeason(
  playerId: string, seasonId: string
): Promise<SeasonStats | null> {
  const res = await fetch(
    `${PUBG_BASE}/players/${playerId}/seasons/${seasonId}`,
    { headers: getHeaders() }
  );
  if (res.status === 404 || res.status === 403) return null;
  if (!res.ok) return null;

  const json = await res.json();
  const gamemode = json.data?.attributes?.gameModeStats || {};
  const stats: Record<string, GameModeStats> = {};
  for (const [mode, raw] of Object.entries(gamemode)) {
    const parsed = parseModeStats(raw as any);
    if (parsed) stats[mode] = parsed;
  }
  return { seasonId, seasonName: json.data?.attributes?.seasonId || seasonId, stats };
}

/* ─── 竞技模式赛季数据 ───────────────────── */

export async function fetchRankedSeason(
  playerId: string, seasonId: string
): Promise<RankedStats | null> {
  const res = await fetch(
    `${PUBG_BASE}/players/${playerId}/seasons/${seasonId}/ranked`,
    { headers: getHeaders() }
  );
  if (res.status === 404 || res.status === 403) return null;
  if (!res.ok) return null;

  const json = await res.json();
  const gamemode = json.data?.attributes?.rankedGameModeStats || {};
  const stats: Record<string, GameModeStats & { currentTier: TierInfo; rankPoints: number }> = {};
  for (const [mode, raw] of Object.entries(gamemode)) {
    const parsed = parseModeStats(raw as any);
    if (parsed) {
      stats[mode] = {
        ...parsed,
        currentTier: (raw as any).currentTier || { tier: "?", subTier: "" },
        rankPoints: (raw as any).rankPoints || (raw as any).currentRankPoint || 0,
      };
    }
  }
  return { stats };
}

/* ─── 生涯数据 ───────────────────────────── */

export async function fetchLifetimeStats(playerId: string): Promise<LifetimeStats | null> {
  const res = await fetch(
    `${PUBG_BASE}/players/${playerId}/seasons/lifetime`,
    { headers: getHeaders() }
  );
  if (!res.ok) return null;
  const json = await res.json();
  const attrs = json.data?.attributes;
  if (!attrs) return null;

  const lifetime = attrs.gameModeStats?.["squad-fpp"] || attrs.gameModeStats?.["squad"]
    || attrs.gameModeStats?.["solo"] || attrs.gameModeStats?.["duo"] || {};

  const k = lifetime.kills ?? 0, a = lifetime.assists ?? 0;
  const d = Math.max((lifetime.losses ?? (lifetime.roundsPlayed ?? 0) - (lifetime.wins ?? 0)), 1);
  return {
    kills: k, wins: lifetime.wins ?? 0, assists: a,
    top10s: lifetime.top10s ?? 0, matches: lifetime.roundsPlayed ?? 0,
    kda: Number(((k + a) / d).toFixed(2)),
    damageDealt: Math.round(lifetime.damageDealt ?? 0),
    avgRank: (lifetime.avgRank ?? lifetime.averageRank) ?? 0,
    headshotKills: lifetime.headshotKills ?? 0,
    roadKills: lifetime.roadKills ?? 0,
    teamKills: lifetime.teamKills ?? 0,
    longestKill: Math.round(lifetime.longestKill ?? 0),
    timeSurvived: lifetime.timeSurvived ?? 0,
    suicides: lifetime.suicides ?? 0,
  };
}

/* ═══════════ 生存专精等级 ═════════════════════════ */

export interface SurvivalMastery {
  xp: number;
  tier: number;   // 1-5 级
  level: number;   // 1-500，每 tier 100 级
  totalMatchesPlayed: number;
  latestMatchId: string;
  stats: {
    damageDealt: number;
    damageTaken: number;
    distanceOnFoot: number;
    distanceByVehicle: number;
    distanceBySwimming: number;
    distanceTotal: number;
    boosts: number;
    heals: number;
    killStreaks: number;
    longestKill: number;
    roadKills: number;
    teamKills: number;
    timeSurvived: number;
    top10s: number;
    vehiclesDestroyed: number;
  };
}

/** 获取生存专精等级 */
export async function fetchSurvivalMastery(playerId: string): Promise<SurvivalMastery | null> {
  const res = await fetch(
    `${PUBG_BASE}/players/${playerId}/survival_mastery`,
    { headers: getHeaders() }
  );
  if (!res.ok) return null;
  const json = await res.json();
  const attrs = json.data?.attributes;
  if (!attrs) return null;

  const s = attrs.stats || {};
  return {
    xp: attrs.xp || 0,
    tier: attrs.tier || 1,
    level: attrs.level || 1,
    totalMatchesPlayed: attrs.totalMatchesPlayed || 0,
    latestMatchId: attrs.latestMatchId || "",
    stats: {
      damageDealt: s.damageDealt?.total || 0,
      damageTaken: s.damageTaken?.total || 0,
      distanceOnFoot: s.distanceOnFoot?.total || 0,
      distanceByVehicle: s.distanceByVehicle?.total || 0,
      distanceBySwimming: s.distanceBySwimming?.total || 0,
      distanceTotal: s.distanceTotal?.total || 0,
      boosts: s.boosts?.total || s.boostItems?.total || 0,
      heals: s.healed?.total || s.heals?.total || 0,
      killStreaks: s.killStreaks?.total || 0,
      longestKill: s.longestKill?.careerBest || 0,
      roadKills: s.roadKills?.total || 0,
      teamKills: s.teamKills?.total || 0,
      timeSurvived: s.timeSurvived?.total || 0,
      top10s: s.top10s?.total || 0,
      vehiclesDestroyed: s.vehiclesDestroyed?.total || 0,
    },
  };
}

/* ═══════════ 最近对局 ═══════════════════════════════ */

export interface MatchPlayer {
  name: string; kill: number; assist: number; dbno: number;
  damage: number; timeSurvived: number; headshot: number;
  longestKill: number;
  walkDistance: number; rideDistance: number; swimDistance: number;
  revives: number; heals: number; boosts: number;
  deathType: string; killPlace: number;
}

export interface MatchSummary {
  id: string; createdAt: string; mapName: string;
  gameMode: string; duration: number;
  playerStats: MatchPlayer; winPlace: number;
  totalParticipants: number;
  teamPlayers: { name: string; kill: number; damage: number; dbno: number; headshot: number; timeSurvived: number }[];
}

/** 获取玩家最近 match IDs */
export async function fetchPlayerMatchIds(playerId: string, count = 10): Promise<string[]> {
  const res = await fetch(`${PUBG_BASE}/players/${playerId}`, { headers: getHeaders() });
  if (!res.ok) return [];
  const json = await res.json();
  return (json.data?.relationships?.matches?.data || []).slice(0, count).map((m: any) => m.id);
}

/** 获取单场对局详情 */
export async function fetchMatchDetails(matchId: string, playerId?: string): Promise<MatchSummary | null> {
  const res = await fetch(`${PUBG_BASE}/matches/${matchId}`, { headers: getHeaders() });
  if (!res.ok) return null;
  const json = await res.json();
  const attrs = json.data?.attributes;
  const included = json.included || [];

  // 收集所有参与者（按 playerId 匹配目标玩家）
  let allStats: any = null;
  const teamList: { name: string; kill: number; damage: number; dbno: number; headshot: number; timeSurvived: number }[] = [];
  let totalParticipants = 0;

  for (const item of included) {
    if (item.type !== "participant") continue;
    const s = item.attributes?.stats;
    if (!s) continue;
    totalParticipants++;
    teamList.push({
      name: s.name || "?", kill: s.kills || 0,
      damage: Math.round(s.damageDealt || 0),
      dbno: s.DBNOs || 0, headshot: s.headshotKills || 0,
      timeSurvived: s.timeSurvived || 0,
    });
    // 匹配目标玩家（playerId 可以多次匹配，取最新的覆盖前面的）
    if (s.playerId === playerId) {
      allStats = s;
    }
  }
  
  // 如果没匹配到目标玩家，用第一个参与者
  if (!allStats) {
    const first = included.find((i: any) => i.type === "participant" && i.attributes?.stats);
    allStats = first?.attributes?.stats || null;
  }

  const ps = allStats || { kills: 0, assists: 0, DBNOs: 0, damageDealt: 0, timeSurvived: 0, headshotKills: 0, walkDistance: 0, rideDistance: 0, swimDistance: 0, revives: 0, heals: 0, boosts: 0, deathType: "alive", longestKill: 0, killPlace: 0 };

  return {
    id: matchId, createdAt: attrs?.createdAt || "",
    mapName: attrs?.mapName || "?", gameMode: attrs?.gameMode || "?",
    duration: attrs?.duration || 0,
    winPlace: allStats?.winPlace ?? 0,
    totalParticipants,
    playerStats: {
      name: ps.name || "?", kill: ps.kills || 0, assist: ps.assists || 0,
      dbno: ps.DBNOs || 0, damage: Math.round(ps.damageDealt || 0),
      timeSurvived: ps.timeSurvived || 0, headshot: ps.headshotKills || 0,
      longestKill: Math.round(ps.longestKill || 0),
      walkDistance: Math.round((ps.walkDistance || 0) / 10) / 100,
      rideDistance: Math.round((ps.rideDistance || 0) / 10) / 100,
      swimDistance: Math.round((ps.swimDistance || 0) / 10) / 100,
      revives: ps.revives || 0, heals: ps.heals || 0, boosts: ps.boosts || 0,
      deathType: ps.deathType || "alive", killPlace: ps.killPlace || 0,
    },
    teamPlayers: teamList.slice(0, 4),
  };
}

/** 获取最近 N 场对局 */
export async function fetchRecentMatches(playerId: string, count = 10): Promise<MatchSummary[]> {
  const ids = await fetchPlayerMatchIds(playerId, count);
  const matches = await Promise.all(ids.map(id => fetchMatchDetails(id, playerId)));
  return matches.filter(Boolean) as MatchSummary[];
}

/* ═══════════ 武器专精等级 ═════════════════════════ */

export interface WeaponMastery {
  weaponId: string;
  level: number;
  damageTotal: number;
  kills: number;
  headshots: number;
  defeats: number;
  longestDefeat: number;
  mostDefeatsInGame: number;
  tier: number;
  xp: number;
  shotsFired: number;
  shotsHit: number;
  hitsTotal: number;
  hitRatio: number;
  /** 累计击倒数 */
  dbnoTotal?: number;
  /** 单局最多击倒 */
  mostDbnoInGame?: number;
}

/** 获取武器专精数据 */
export async function fetchWeaponMastery(playerId: string): Promise<WeaponMastery[]> {
  const res = await fetch(
    `${PUBG_BASE}/players/${playerId}/weapon_mastery`,
    { headers: getHeaders(), signal: AbortSignal.timeout(10000) }
  );
  if (!res.ok) return [];
  const json = await res.json();

  // API 返回 { data: { attributes: { weaponSummaries: { "Item_Weapon_XXX_C": {...} } } } }
  const summaries = json.data?.attributes?.weaponSummaries || {};

  return Object.entries(summaries).map(([weaponId, summary]: [string, any]) => {
    // OfficialStatsTotal = 匹配模式, CompetitiveStatsTotal = 竞技模式
    // StatsTotal 永远为 0，不要用
    const official = summary.OfficialStatsTotal || {};
    const competitive = summary.CompetitiveStatsTotal || {};
    
    // 合并匹配 + 竞技数据
    const kills = (official.Kills || 0) + (competitive.Kills || 0);
    const defeats = (official.Defeats || 0) + (competitive.Defeats || 0);
    const damageTotal = (official.DamagePlayer || 0) + (competitive.DamagePlayer || 0);
    const headshots = (official.HeadShots || 0) + (competitive.HeadShots || 0);
    const groggies = (official.Groggies || 0) + (competitive.Groggies || 0);
    const mostKills = Math.max(official.MostKillsInAGame || 0, competitive.MostKillsInAGame || 0);
    const mostGroggies = Math.max(official.MostGroggiesInAGame || 0, competitive.MostGroggiesInAGame || 0);
    const longestKill = Math.max(official.LongestKill || 0, competitive.LongestKill || 0);
    
    // ShotsFired/ShotsHit 只看 OfficialStatsTotal（Competitive 没有这些字段）
    const shotsFired = official.ShotsFired || 0;
    const shotsHit = official.ShotsHit || 0;
    
    return {
      weaponId,
      level: summary.LevelCurrent || 1,
      damageTotal,
      kills,
      headshots,
      defeats,
      longestDefeat: Math.round(longestKill),
      mostDefeatsInGame: mostKills,
      tier: summary.TierCurrent || 1,
      xp: summary.XPTotal || 0,
      shotsFired,
      shotsHit,
      hitsTotal: official.HitsTotal || 0,
      hitRatio: shotsFired > 0 ? Math.round((shotsHit / shotsFired) * 100) : 0,
      dbnoTotal: groggies,
      mostDbnoInGame: mostGroggies,
    };
  }).sort((a: WeaponMastery, b: WeaponMastery) => b.kills - a.kills);
}

/* ═══════════ 历史最高 RP ═════════════════════════ */

/** 获取玩家历史最高竞技 RP（遍历最近 N 个赛季） */
export async function fetchBestRankPoints(playerId: string, maxSeasons = 5): Promise<number> {
  try {
    const seasons = await fetchSeasons();
    // 取最近的几个赛季（倒序，最新的在前）
    const recent = seasons.slice(-maxSeasons);
    const results = await Promise.allSettled(
      recent.map(s =>
        fetch(`${PUBG_BASE}/players/${playerId}/seasons/${s.id}/ranked`, {
          headers: getHeaders(),
          signal: AbortSignal.timeout(8000),
        }).then(r => r.ok ? r.json() : null)
      )
    );

    let best = 0;
    for (const r of results) {
      if (r.status !== "fulfilled" || !r.value) continue;
      const modes = r.value?.data?.attributes?.rankedGameModeStats || {};
      for (const stats of Object.values(modes) as any[]) {
        const rp = stats?.rankPoints || stats?.currentRankPoint || 0;
        if (rp > best) best = rp;
      }
    }
    return best;
  } catch {
    return 0;
  }
}

/* ═══════════ 竞技排行榜 ═════════════════════════ */

export type GameMode =
  | "solo" | "solo-fpp"
  | "duo" | "duo-fpp"
  | "squad" | "squad-fpp";

export type LeaderboardShard = "pc-eu" | "pc-na" | "pc-as" | "pc-krjp";

export const GAME_MODE_LABELS: Record<GameMode, string> = {
  "solo": "单排 TPP", "solo-fpp": "单排 FPP",
  "duo": "双排 TPP", "duo-fpp": "双排 FPP",
  "squad": "四排 TPP", "squad-fpp": "四排 FPP",
};

export const SHARD_LABELS: Record<LeaderboardShard, string> = {
  "pc-eu": "欧洲", "pc-na": "北美", "pc-as": "亚洲", "pc-krjp": "日韩",
};

export interface LeaderboardPlayer {
  accountId: string;
  name: string;
  rank: number;
  rankPoints: number;
  tier: string;
  subTier: string;
  wins: number;
  games: number;
  winRatio: number;
  kills: number;
  kda: number;
  averageDamage: number;
  averageRank: number;
  top10Ratio: number;
}

export interface LeaderboardData {
  shardId: string;
  gameMode: GameMode;
  seasonId: string;
  title: string;
  players: LeaderboardPlayer[];
}

/** 获取竞技排行榜 */
export async function fetchLeaderboard(
  shard: LeaderboardShard,
  gameMode: GameMode,
  seasonId?: string,
): Promise<LeaderboardData | null> {
  // 自动获取当前赛季
  const sid = seasonId || await getCurrentSeasonId();

  const res = await fetch(
    `https://api.pubg.com/shards/${shard}/leaderboards/${sid}/${gameMode}`,
    { headers: getHeaders(), signal: AbortSignal.timeout(15000) }
  );
  if (!res.ok) return null;
  const json = await res.json();
  const data = json.data;
  if (!data) return null;

  const included = json.included || [];
  const players: LeaderboardPlayer[] = included
    .filter((item: any) => item.type === "player")
    .map((item: any) => {
      const attrs = item.attributes || {};
      const stats = attrs.stats || {};
      const games = stats.games || 1;
      const kills = stats.kills || 0;
      const wins = stats.wins || 0;
      return {
        accountId: item.id || "",
        name: attrs.name || "?",
        rank: stats.rank || 0,  // PUBG API 返回的真实排名
        rankPoints: stats.rankPoints || 0,
        tier: stats.tier || "?",
        subTier: stats.subTier || "",
        wins,
        games,
        winRatio: games > 0 ? Math.round((wins / games) * 1000) / 10 : 0,
        kills,
        kda: games > 0 ? Math.round((kills / games) * 100) / 100 : 0,
        averageDamage: stats.averageDamage || 0,
        averageRank: stats.averageRank || 0,
        top10Ratio: games > 0 ? Math.round(((stats.top10s || 0) / games) * 1000) / 10 : 0,
      };
    })
    // 按排名升序（#1 在前）
    .sort((a, b) => a.rank - b.rank);

  return {
    shardId: data.attributes?.shardId || shard,
    gameMode,
    seasonId: sid,
    title: data.attributes?.title || "RANKED",
    players,
  };
}
