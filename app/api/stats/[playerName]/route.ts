// app/api/stats/[playerName]/route.ts
import { NextResponse } from 'next/server';
import { Redis } from '@upstash/redis';
import crypto from 'crypto';
import { ApiResponse, ProcessedPlayerStats } from '@/lib/types';
import { fetchRawPubgData, cleanAndFixPlayerStats } from '@/lib/services/pubg.service';

// 初始化 Redis 客户端 (自动读取环境变量)
const redis = Redis.fromEnv();
const CACHE_TTL = 600; // 缓存 10 分钟 (600秒)

export async function GET(
  request: Request,
  { params }: { params: { playerName: string } }
) {
  const { playerName } = params;
  const sessionId = crypto.randomUUID(); // 生成可追溯的日志 ID

  try {
    // 【步骤 1】: 尝试从 Redis 缓存中读取数据
    const cacheKey = `pubg:stats:${playerName.toLowerCase()}`;
    const cachedData = await redis.get<ProcessedPlayerStats>(cacheKey);

    if (cachedData) {
      console.log(`[Cache Hit] Player: ${playerName}`);
      // 命中缓存，直接极速返回
      return NextResponse.json<ApiResponse<ProcessedPlayerStats>>({
        success: true,
        data: cachedData,
        sessionId,
        _source: 'cache'
      });
    }

    console.log(`[Cache Miss] Player: ${playerName}. Fetching from API...`);

    // 【步骤 2】: 未命中缓存，向 PUBG 官方服务器请求数据
    const rawData = await fetchRawPubgData(playerName);

    // 【步骤 3】: 将官方原始数据通过管道进行清洗和修复
    const cleanedData = cleanAndFixPlayerStats(rawData);

    // 【步骤 4】: 将清洗后完美的 JSON 存入 Redis，并设置过期时间
    // 注意：用 ex 限制时间极其重要，否则你的服务器内存迟早会爆
    await redis.setex(cacheKey, CACHE_TTL, cleanedData);

    // 【步骤 5】: 返回数据给前端
    return NextResponse.json<ApiResponse<ProcessedPlayerStats>>({
      success: true,
      data: cleanedData,
      sessionId,
      _source: 'api'
    });

  } catch (error: any) {
    // 【兜底处理】: 无论是网络超时、解析错误，保证系统不崩溃
    console.error(`[Error] Failed to fetch stats for ${playerName}`, error);
    
    return NextResponse.json<ApiResponse<null>>(
      {
        success: false,
        data: null,
        error: error.message || "Failed to fetch player stats.",
        sessionId
      },
      { status: 500 } // 可以根据具体错误类型返回 404 (没找到人) 或 429 (官方限流)
    );
  }
}
