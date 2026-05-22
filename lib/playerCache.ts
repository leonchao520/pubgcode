/* ─── 玩家数据持久化缓存（绕过 PUBG API 限流） ─── */

import { prisma } from "./db";
import { getCached, setCached } from "./redis";

/** 缓存 survivalMastery */
export async function getCachedSurvivalMastery(playerId: string) {
  const key = `m:survival:${playerId}`;
  const cached = await getCached<string>(key);
  if (cached) return JSON.parse(cached);
  return null;
}

export async function setCachedSurvivalMastery(playerId: string, data: any) {
  const key = `m:survival:${playerId}`;
  await setCached(key, JSON.stringify(data));
}

/** 缓存 weaponMastery */
export async function getCachedWeaponMastery(playerId: string) {
  const key = `m:weapon:${playerId}`;
  const cached = await getCached<string>(key);
  if (cached) return JSON.parse(cached);
  return null;
}

export async function setCachedWeaponMastery(playerId: string, data: any) {
  const key = `m:weapon:${playerId}`;
  await setCached(key, JSON.stringify(data));
}

/** 从 DB 读取玩家扩展缓存（mastery 等 JSON 数据） */
export async function getPlayerCache(playerId: string): Promise<Record<string, any> | null> {
  try {
    // 尝试从 Redis 读取
    const key = `pcache:${playerId}`;
    const raw = await getCached(key);
    if (raw) return JSON.parse(raw as string);
    
    // 如果 Redis 没有，从 DB 读取
    const record = await prisma.playerCache.findUnique({ where: { playerId } });
    if (record?.data) {
      const data = JSON.parse(record.data);
      // 写回 Redis
      await setCached(key, record.data);
      return data;
    }
    return null;
  } catch {
    return null;
  }
}

/** 存入 DB + Redis */
export async function setPlayerCache(playerId: string, data: Record<string, any>) {
  try {
    const json = JSON.stringify(data);
    // Redis
    await setCached(`pcache:${playerId}`, json);
    // DB (upsert)
    await prisma.playerCache.upsert({
      where: { playerId },
      create: { playerId, data: json },
      update: { data: json, updatedAt: new Date() },
    }).catch(() => {});
  } catch {}
}
