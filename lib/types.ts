// lib/types.ts

export interface PubgSquadStats {
  currentTier: { tier: string; subTier: string };
  currentRankPoint: number;
  roundsPlayed: number;
  avgRank: number;
  top10Ratio: number;
  winRatio: number;
  assists: number;
  wins: number;
  kda: number; 
  kills: number;
  deaths: number;
  damageDealt: number;
}

// 这是我们将返回给前端的最终、纯净的数据结构
export interface ProcessedPlayerStats {
  squad: PubgSquadStats;
}

// 标准化 API 响应规范
export interface ApiResponse<T> {
  success: boolean;
  data: T | null;
  error?: string;
  sessionId: string;
  _source?: 'cache' | 'api'; // 用于调试：判断数据来源
}
