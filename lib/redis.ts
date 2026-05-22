/**
 * Redis 适配层
 *
 * 自动检测环境：
 * - 设置了 UPSTASH_REDIS_REST_URL → 使用 @upstash/redis（Vercel / Upstash）
 * - 未设置 → 使用 ioredis 连接自托管 Redis（Docker / 自建）
 */
import type { Redis as UpstashRedis } from "@upstash/redis";
import type { Ratelimit as UpstashRatelimit } from "@upstash/ratelimit";

type RedisClient = Awaited<ReturnType<typeof createRedisClient>>;
type RatelimitInstance = Awaited<ReturnType<typeof createRatelimit>>;

let redisClient: RedisClient | null = null;
let ratelimitInstance: RatelimitInstance | null = null;

async function createRedisClient() {
  const restUrl = process.env.UPSTASH_REDIS_REST_URL;
  const restToken = process.env.UPSTASH_REDIS_REST_TOKEN;

  if (restUrl) {
    // ─── Upstash REST API 模式 ───
    const { Redis } = await import("@upstash/redis");
    return new Redis({
      url: restUrl,
      token: restToken ?? "",
    });
  }

  // ─── 自托管 Redis（标准 Redis 协议） ───
  const IORedis = (await import("ioredis")).default;
  const host = process.env.REDIS_HOST || "redis";
  const port = Number(process.env.REDIS_PORT || 6379);
  const password = process.env.REDIS_PASSWORD || undefined;

  const client = new IORedis({
    host,
    port,
    password,
    maxRetriesPerRequest: 3,
    retryStrategy(times) {
      if (times > 5) return null; // 放弃重连
      return Math.min(times * 200, 3000);
    },
  });

  // 统一 get/set 接口
  return {
    get: async <T>(key: string): Promise<T | null> => {
      const val = await client.get(key);
      if (!val) return null;
      try {
        return JSON.parse(val) as T;
      } catch {
        return val as unknown as T;
      }
    },
    set: async (
      key: string,
      value: unknown,
      opts?: { ex?: number }
    ): Promise<void> => {
      const str = typeof value === "string" ? value : JSON.stringify(value);
      if (opts?.ex) {
        await client.set(key, str, "EX", opts.ex);
      } else {
        await client.set(key, str);
      }
    },
    del: async (key: string): Promise<void> => {
      await client.del(key);
    },
  };
}

async function createRatelimit() {
  const restUrl = process.env.UPSTASH_REDIS_REST_URL;

  if (restUrl) {
    // ─── Upstash 模式 ───
    const { Redis } = await import("@upstash/redis");
    const { Ratelimit } = await import("@upstash/ratelimit");
    const redis = new Redis({
      url: restUrl,
      token: process.env.UPSTASH_REDIS_REST_TOKEN ?? "",
    });
    return new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(20, "1 m"),
      analytics: true,
      prefix: "gq:rl",
    });
  }

  // ─── 自托管模式 ───
  const IORedis = (await import("ioredis")).default;
  const { Ratelimit } = await import("@upstash/ratelimit");

  const host = process.env.REDIS_HOST || "redis";
  const port = Number(process.env.REDIS_PORT || 6379);
  const password = process.env.REDIS_PASSWORD || undefined;

  const redis = new IORedis({ host, port, password });

  // @upstash/ratelimit 依赖 scriptLoad + evalsha 方法
  // ioredis 使用 script('LOAD', ...) + evalsha 替代
  const ratelimitRedis = new Proxy(redis, {
    get(target, prop) {
      // @upstash/ratelimit 调用 redis.scriptLoad(script)
      if (prop === "scriptLoad") {
        return async (script: string) => target.script("LOAD", script);
      }
      // @upstash/ratelimit 调用 redis.evalsha(sha, [keys...], [args...])
      // ioredis 需要 evalsha(sha, numKeys, key1, key2, ..., arg1, arg2, ...)
      if (prop === "evalsha") {
        return (sha: string, keys: string[], args: string[]) =>
          target.evalsha(sha, keys.length, ...keys, ...args);
      }
      const val = Reflect.get(target, prop);
      return typeof val === "function" ? val.bind(target) : val;
    },
  });

  return new Ratelimit({
    redis: ratelimitRedis as any,
    limiter: Ratelimit.slidingWindow(20, "1 m"),
    analytics: true,
    prefix: "gq:rl",
  });
}

/** 获取 Redis 客户端 */
async function getRedis(): Promise<RedisClient> {
  if (!redisClient) {
    redisClient = await createRedisClient();
  }
  return redisClient;
}

/** 获取限流器 */
async function getRatelimit(): Promise<RatelimitInstance> {
  if (!ratelimitInstance) {
    ratelimitInstance = await createRatelimit();
  }
  return ratelimitInstance;
}

// ─── 导出兼容旧接口 ─────────────────────────────────

export const CACHE_TTL = 300; // 5 分钟

export async function getCached<T>(key: string): Promise<T | null> {
  try {
    const redis = await getRedis();
    return await redis.get<T>(key);
  } catch {
    return null;
  }
}

export async function setCached<T>(
  key: string,
  value: T
): Promise<void> {
  try {
    const redis = await getRedis();
    await redis.set(key, value, { ex: CACHE_TTL });
  } catch {
    // 缓存写入失败不影响主流程
  }
}

// 兼容旧接口 — 保留 ratelimit 导出供 app/api/query/route.ts 用
// (该文件已改为使用 ratelimit.limit，需要重新导入)
// 新代码建议直接用 getRatelimit()
export { getRedis, getRatelimit };
