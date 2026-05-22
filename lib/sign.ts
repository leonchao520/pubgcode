/** 简单的 API 防爬签名 — 前端传 ts+sign，服务端验证时间窗口 */

const SECRET = process.env.API_SECRET || "";

/** 服务端验证签名：SHA256(secret + ts + path)，ts 必须在 ±5 分钟内 */
export function verifySign(ts: string, sign: string): boolean {
  if (!SECRET) return true; // 未配置 secret 时不校验
  const tsNum = parseInt(ts, 10);
  if (isNaN(tsNum)) return false;
  if (Math.abs(Date.now() - tsNum) > 5 * 60 * 1000) return false;
  const { createHash } = require("crypto");
  const expected = createHash("sha256").update(SECRET + ts).digest("hex");
  return expected === sign;
}

/** 生成签名（仅服务端用） */
export function makeSign(ts: number): string {
  const { createHash } = require("crypto");
  return createHash("sha256").update(SECRET + ts).digest("hex");
}
