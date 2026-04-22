// lib/services/pubg.service.ts
import { ProcessedPlayerStats } from '../types';

/**
 * 模拟调用 PUBG 官方 API
 * (真实情况中，你需要先根据 PlayerName 查 AccountId，再用 AccountId 查 Stats。
 * 这里为了展示核心逻辑，抽象为一个获取原始数据的过程)
 */
export async function fetchRawPubgData(playerName: string): Promise<any> {
  const PLATFORM = 'steam';
  // 伪代码：这里应该是真实的 fetch 请求
  // const res = await fetch(`https://api.pubg.com/shards/${PLATFORM}/players?filter[playerNames]=${playerName}`, { ... })
  
  // 我们模拟 PUBG 官方返回了带有 KDA Bug 的原始数据
  return {
    squad: {
      currentTier: { tier: "Gold", subTier: "2" },
      currentRankPoint: 2035,
      roundsPlayed: 154,
      avgRank: 9.383117,
      top10Ratio: 0.59090906,
      winRatio: 0.064935066,
      assists: 67,
      wins: 10,
      kda: 0, // <--- 官方数据异常
      kills: 124,
      deaths: 149,
      damageDealt: 21925.498,
    }
  };
}

/**
 * 数据清洗与 Bug 修复管道
 */
export function cleanAndFixPlayerStats(rawData: any): ProcessedPlayerStats {
  const squadInfo = rawData.squad;

  // 1. 修复核心 Bug：重新计算 KDA
  const calculatedKda = squadInfo.deaths === 0 
    ? (squadInfo.kills + squadInfo.assists) 
    : (squadInfo.kills + squadInfo.assists) / squadInfo.deaths;

  // 2. 截断过多的小数位，减轻前端渲染负担 (可选，这里保留原始供前端灵活处理也可)
  // const formatTop10 = Number(squadInfo.top10Ratio.toFixed(4));

  return {
    squad: {
      ...squadInfo,
      kda: Number(calculatedKda.toFixed(2)), // 修复并保留两位小数
    }
  };
}
