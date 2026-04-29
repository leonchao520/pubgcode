// lib/services/pubg.service.ts
import { ProcessedPlayerStats } from '../types';

const PUBG_API_BASE = 'https://api.pubg.com';
const PLATFORM = process.env.NEXT_PUBLIC_PUBG_PLATFORM || 'steam';

interface PubgApiError {
  status: number;
  message: string;
}

function getApiKey(): string {
  const key = process.env.PUBG_API_KEY;
  if (!key) {
    throw Object.assign(new Error('PUBG_API_KEY 未设置'), { status: 500 }) as PubgApiError;
  }
  return key;
}

async function pubgFetch<T>(path: string): Promise<T> {
  const apiKey = getApiKey();
  const url = `${PUBG_API_BASE}${path}`;

  const res = await fetch(url, {
    headers: {
      Authorization: `Bearer ${apiKey}`,
      Accept: 'application/vnd.api+json',
    },
  });

  if (res.status === 429) {
    throw Object.assign(new Error('PUBG API 请求过于频繁，请稍后再试'), {
      status: 429,
    }) as PubgApiError;
  }

  if (res.status === 404) {
    throw Object.assign(new Error('未找到该玩家'), { status: 404 }) as PubgApiError;
  }

  if (!res.ok) {
    throw Object.assign(
      new Error(`PUBG API 返回错误: ${res.status}`),
      { status: res.status }
    ) as PubgApiError;
  }

  return res.json();
}

interface PubgPlayerData {
  data: Array<{
    id: string;
    attributes: {
      name: string;
    };
  }>;
}

interface PubgSeasonStats {
  data: {
    attributes: {
      gameModeStats: Record<string, {
        assists: number;
        wins: number;
        kills: number;
        deaths: number;
        damageDealt: number;
        roundMostKills: number;
        roundsPlayed: number;
        top10s: number;
        rankPoints: number;
        winPoints: number;
        currentTier: {
          tier: string;
          subTier: string;
        };
      }>;
    };
  };
}

const PUBG_SEASONS: Record<string, string> = {
  '2025-01': 'division.bro.official.pc-2018-01',
  '2025-02': 'division.bro.official.pc-2018-02',
  // 当赛季 ID 变化时，从 https://api.pubg.com/shards/steam/seasons 获取
};

// 获取玩家赛季战绩
async function getLatestSeasonId(): Promise<string> {
  // 优先使用当前赛季；如果未定义则从 API 获取最新的可用赛季
  const latestKey = Object.keys(PUBG_SEASONS).sort().pop();
  return latestKey ? PUBG_SEASONS[latestKey] : 'division.bro.official.pc-2018-01';
}

/**
 * 根据玩家名称查询 PUBG 官方 API，获取 SQUAD-FPP 赛季数据
 */
export async function fetchRawPubgData(playerName: string): Promise<any> {
  try {
    // 步骤 1: 按玩家名查 accountId
    const playerData = await pubgFetch<PubgPlayerData>(
      `/shards/${PLATFORM}/players?filter[playerNames]=${encodeURIComponent(playerName)}`
    );

    const accountId = playerData.data[0]?.id;
    if (!accountId) {
      throw Object.assign(new Error('未找到该玩家'), { status: 404 }) as PubgApiError;
    }

    // 步骤 2: 用 accountId + 赛季 ID 查赛季战绩
    const seasonId = await getLatestSeasonId();
    const seasonStats = await pubgFetch<PubgSeasonStats>(
      `/shards/${PLATFORM}/players/${accountId}/seasons/${seasonId}`
    );

    const stats = seasonStats.data.attributes.gameModeStats['squad-fpp'] || 
                  seasonStats.data.attributes.gameModeStats['squad'];

    if (!stats) {
      throw Object.assign(
        new Error('该玩家暂无 SQUAD 模式赛季数据'),
        { status: 404 }
      ) as PubgApiError;
    }

    return {
      squad: {
        currentTier: stats.currentTier,
        currentRankPoint: stats.rankPoints + stats.winPoints,
        roundsPlayed: stats.roundsPlayed,
        avgRank: stats.roundsPlayed > 0 ? (stats as any).avgRank || 0 : 0,
        top10Ratio: stats.roundsPlayed > 0 ? stats.top10s / stats.roundsPlayed : 0,
        winRatio: stats.roundsPlayed > 0 ? stats.wins / stats.roundsPlayed : 0,
        assists: stats.assists,
        wins: stats.wins,
        kda: 0, // 后续由 cleanAndFixPlayerStats 重新计算
        kills: stats.kills,
        deaths: stats.deaths,
        damageDealt: stats.damageDealt,
      },
    };
  } catch (error: unknown) {
    // 透传已知错误类型
    if (error && typeof error === 'object' && 'status' in error) {
      throw error;
    }
    // 未知错误统一包装
    throw Object.assign(
      new Error(`获取 PUBG 数据失败: ${error instanceof Error ? error.message : '未知错误'}`),
      { status: 500 }
    ) as PubgApiError;
  }
}

/**
 * 数据清洗与 Bug 修复管道
 */
export function cleanAndFixPlayerStats(rawData: any): ProcessedPlayerStats {
  const squadInfo = rawData.squad;

  // 修复核心 Bug：重新计算 KDA
  const calculatedKda = squadInfo.deaths === 0
    ? (squadInfo.kills + squadInfo.assists)
    : (squadInfo.kills + squadInfo.assists) / squadInfo.deaths;

  // 裁剪 avgRank 到合理精度
  const avgRank = squadInfo.roundsPlayed > 0
    ? squadInfo.avgRank
    : 0;

  return {
    squad: {
      ...squadInfo,
      kda: Number(calculatedKda.toFixed(2)),
      avgRank: Number(Number(avgRank).toFixed(2)),
    },
  };
}
