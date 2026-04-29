// app/api/stats/[playerName]/route.ts
import { NextResponse } from 'next/server';
import { Redis } from '@upstash/redis';
import crypto from 'crypto';
import { ApiResponse, ProcessedPlayerStats } from '@/lib/types';
import { fetchRawPubgData, cleanAndFixPlayerStats } from '@/lib/services/pubg.service';

// 初始化 Redis 客户端 (自动读取环境变量)
const redis = Redis.fromEnv();
const CACHE_TTL = 600; // 缓存 10 分钟 (600秒)

/** 校验玩家名称：只允许字母、数字、下划线和短横线 */
function isValidPlayerName(name: string): boolean {
  return /^[a-zA-Z0-9_-]{2,50}$/.test(name);
}

export async function GET(
  request: Request,
  /** Next.js 15+ params 为 Promise 类型 */
  context: { params: Promise<{ playerName: string }> }
) {
  const { playerName } = await context.params;
  const sessionId = crypto.randomUUID();

  // 输入校验
  if (!isValidPlayerName(playerName)) {
    return NextResponse.json<ApiResponse<null>>(
      {
        success: false,
        data: null,
        error: '玩家名称格式不正确（仅支持字母、数字、下划线、短横线，2-50 个字符）',
        sessionId,
      },
      { status: 400 }
    );
  }

  try {
    // 步骤 1: 尝试从 Redis 缓存中读取数据
    const cacheKey = `pubg:stats:${playerName.toLowerCase()}`;
    const cachedData = await redis.get<ProcessedPlayerStats>(cacheKey);

    if (cachedData) {
      console.log(`[Cache Hit] Player: ${playerName}`);
      return NextResponse.json<ApiResponse<ProcessedPlayerStats>>({
        success: true,
        data: cachedData,
        sessionId,
        _source: 'cache',
      });
    }

    console.log(`[Cache Miss] Player: ${playerName}. Fetching from API...`);

    // 步骤 2: 请求 PUBG 官方 API
    const rawData = await fetchRawPubgData(playerName);

    // 步骤 3: 数据清洗
    const cleanedData = cleanAndFixPlayerStats(rawData);

    // 步骤 4: 写入缓存
    await redis.setex(cacheKey, CACHE_TTL, cleanedData);

    // 步骤 5: 返回数据
    return NextResponse.json<ApiResponse<ProcessedPlayerStats>>({
      success: true,
      data: cleanedData,
      sessionId,
      _source: 'api',
    });
  } catch (error: unknown) {
    console.error(`[Error] Failed to fetch stats for ${playerName}:`, error);

    // 识别已知错误类型并返回对应 HTTP 状态码
    let statusCode = 500;
    let errorMessage = '获取玩家数据失败';

    if (error && typeof error === 'object') {
      const err = error as Record<string, unknown>;
      if (typeof err.status === 'number') {
        statusCode = err.status;
      }
      if (typeof err.message === 'string') {
        errorMessage = err.message;
      }
    }

    return NextResponse.json<ApiResponse<null>>(
      {
        success: false,
        data: null,
        error: errorMessage,
        sessionId,
      },
      { status: statusCode }
    );
  }
}
