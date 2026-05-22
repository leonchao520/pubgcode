/** 前端签名生成 — 浏览器端用 Web Crypto API */

const SECRET = process.env.NEXT_PUBLIC_API_SECRET || "pubgbar2026";

/** 生成 ts+sign 查询参数 */
export async function signParams(): Promise<string> {
  const ts = Date.now();
  const enc = new TextEncoder().encode(SECRET + ts);
  const hash = await crypto.subtle.digest("SHA-256", enc);
  const sign = Array.from(new Uint8Array(hash)).map(b => b.toString(16).padStart(2, "0")).join("");
  return `ts=${ts}&sign=${sign}`;
}
