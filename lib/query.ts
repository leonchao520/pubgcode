import { prisma } from "./db";
import { getCached, setCached } from "./redis";
import {
  fetchPubgPlayerByName, fetchNormalSeason, fetchRankedSeason, fetchLifetimeStats,
  fetchSeasons, getCurrentSeasonId, fetchRecentMatches, sortAndNumberSeasons, fetchSurvivalMastery,
  fetchWeaponMastery, fetchClan, fetchBestRankPoints,
  type SeasonInfo, type SeasonStats, type RankedStats, type LifetimeStats, type MatchSummary, type SurvivalMastery,
  type WeaponMastery, type ClanInfo,
} from "./pubg";
import { fetchSteamPlayer, resolveSteamVanityUrl } from "./steam";

export type QueryType = "name" | "steamid";

export interface QueryResult {
  type: QueryType;
  input: string;
  pubg?: {
    id: string; name: string; banType: string;
  };
  steam?: Awaited<ReturnType<typeof fetchSteamPlayer>>;
  seasons?: SeasonInfo[];
  normalStats?: SeasonStats;
  rankedStats?: RankedStats;
  lifetimeStats?: LifetimeStats;
  survivalMastery?: SurvivalMastery;
  weaponMastery?: WeaponMastery[];
  recentMatches?: MatchSummary[];
  clan?: ClanInfo;
  bestRankPoints?: number;
  error?: string;
  fromCache: boolean;
}

export function detectQueryType(input: string): QueryType {
  return /^\d{17}$/.test(input.trim()) ? "steamid" : "name";
}

export async function queryPlayer(
  rawInput: string,
  seasonId?: string,
  bypassCache?: boolean,
): Promise<QueryResult> {
  const input = rawInput.trim();
  const type = detectQueryType(input);
  const cacheKey = `gq:player:${type}:${input.toLowerCase()}:${seasonId || 'auto'}`;

  if (!bypassCache) {
    const cached = await getCached<QueryResult>(cacheKey);
    if (cached) return { ...cached, fromCache: true };
  }

  const result: QueryResult = { type, input, fromCache: false };

  try {
    if (type === "name") {
      const known = await prisma.player.findUnique({ where: { nameLower: input.toLowerCase() } });
      const correctName = known?.name ?? input;
      const pubgData = await fetchPubgPlayerByName(correctName);

      if (!pubgData) {
        result.error = "未找到该玩家";
      } else {
        result.pubg = pubgData;
        const sid = seasonId || await getCurrentSeasonId();

        // 并行获取所有数据
        const clanPromise = pubgData.clanId ? fetchClan(pubgData.clanId).catch(() => null) : Promise.resolve(null);
        const bestRPPromise = fetchBestRankPoints(pubgData.id).catch(() => 0);
        const [seasons, normalStats, rankedStats, lifetimeStats, recentMatches, survivalMastery, weaponMastery, clan, bestRP] = await Promise.all([
          fetchSeasons().catch(() => [] as SeasonInfo[]),
          fetchNormalSeason(pubgData.id, sid),
          fetchRankedSeason(pubgData.id, sid).catch(() => null),
          fetchLifetimeStats(pubgData.id).catch(() => null),
          fetchRecentMatches(pubgData.id, 10).catch(() => [] as MatchSummary[]),
          fetchSurvivalMastery(pubgData.id).catch(() => null),
          fetchWeaponMastery(pubgData.id).catch(() => [] as WeaponMastery[]),
          clanPromise,
          bestRPPromise,
        ]);

        result.seasons = seasons;
        result.normalStats = normalStats || undefined;
        result.rankedStats = rankedStats || undefined;
        result.lifetimeStats = lifetimeStats || undefined;
        result.recentMatches = recentMatches;
        result.survivalMastery = survivalMastery || undefined;
        result.weaponMastery = weaponMastery || undefined;
        result.clan = clan || undefined;
        result.bestRankPoints = bestRP || undefined;

        // 尝试获取 Steam 数据
        // 1) 优先 DB 中存储的 steamId
        const steamId = known?.steamId;
        // 2) 尝试用 PUBG 昵称作为 Steam vanity URL 反查
        let resolvedSteamId = steamId || await resolveSteamVanityUrl(pubgData.name).catch(() => null);
        if (resolvedSteamId && !result.steam) {
          const steamData = await fetchSteamPlayer(resolvedSteamId).catch(() => undefined);
          if (steamData) {
            result.steam = steamData;
            // 存入 DB 关联
            if (!steamId) {
              await prisma.player.upsert({
                where: { nameLower: pubgData.name.toLowerCase() },
                create: { name: pubgData.name, nameLower: pubgData.name.toLowerCase(), steamId: resolvedSteamId },
                update: { steamId: resolvedSteamId, queriedAt: new Date() },
              }).catch(() => {});
            }
          }
        }

        await prisma.player.upsert({
          where: { nameLower: pubgData.name.toLowerCase() },
          create: { name: pubgData.name, nameLower: pubgData.name.toLowerCase() },
          update: { name: pubgData.name, queriedAt: new Date() },
        });
      }
    } else {
      const steamData = await fetchSteamPlayer(input);
      if (!steamData) {
        result.error = "未找到该 Steam 账户";
      } else {
        result.steam = steamData;
        
        // 尝试用 Steam 昵称查 PUBG
        const pubgData = await fetchPubgPlayerByName(steamData.personaName).catch(() => null);
        if (pubgData) {
          result.pubg = pubgData;
          const sid = seasonId || await getCurrentSeasonId();
          const clanPromise2 = pubgData.clanId ? fetchClan(pubgData.clanId).catch(() => null) : Promise.resolve(null);
          const bestRPPromise2 = fetchBestRankPoints(pubgData.id).catch(() => 0);
          const [seasons, normalStats, rankedStats, lifetimeStats, recentMatches, survivalMastery, weaponMastery, clan2, bestRP2] = await Promise.all([
            fetchSeasons().catch(() => [] as SeasonInfo[]),
            fetchNormalSeason(pubgData.id, sid),
            fetchRankedSeason(pubgData.id, sid).catch(() => null),
            fetchLifetimeStats(pubgData.id).catch(() => null),
            fetchRecentMatches(pubgData.id, 10).catch(() => [] as MatchSummary[]),
            fetchSurvivalMastery(pubgData.id).catch(() => null),
            fetchWeaponMastery(pubgData.id).catch(() => [] as WeaponMastery[]),
            clanPromise2,
            bestRPPromise2,
          ]);
          result.seasons = seasons;
          result.normalStats = normalStats || undefined;
          result.rankedStats = rankedStats || undefined;
          result.lifetimeStats = lifetimeStats || undefined;
          result.recentMatches = recentMatches;
          result.survivalMastery = survivalMastery || undefined;
          result.weaponMastery = weaponMastery || undefined;
          result.clan = clan2 || undefined;
          result.bestRankPoints = bestRP2 || undefined;
          
          // 存 Steam ID 关联
          await prisma.player.upsert({
            where: { nameLower: pubgData.name.toLowerCase() },
            create: { name: pubgData.name, nameLower: pubgData.name.toLowerCase(), steamId: input },
            update: { steamId: input, queriedAt: new Date() },
          }).catch(() => {});
        } else {
          // 数据库查找作为兜底
          const known = await prisma.player.findFirst({ where: { steamId: input } });
          if (known) {
            const pData = await fetchPubgPlayerByName(known.name).catch(() => null);
            if (pData) {
              result.pubg = pData;
              const sid = seasonId || await getCurrentSeasonId();
              const clanPromise3 = pData.clanId ? fetchClan(pData.clanId).catch(() => null) : Promise.resolve(null);
              const [seasons, normalStats, lifetimeStats, clan3] = await Promise.all([
                fetchSeasons().catch(() => [] as SeasonInfo[]),
                fetchNormalSeason(pData.id, sid),
                fetchLifetimeStats(pData.id).catch(() => null),
                clanPromise3,
              ]);
              result.seasons = seasons;
              result.normalStats = normalStats || undefined;
              result.lifetimeStats = lifetimeStats || undefined;
              result.clan = clan3 || undefined;
            }
          }
        }
      }
    }
  } catch (err) {
    result.error = err instanceof Error ? err.message : "查询失败";
  }

  if (!result.error) await setCached(cacheKey, result);
  return result;
}
