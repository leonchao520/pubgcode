import { NextRequest, NextResponse } from "next/server";
import { getRatelimit } from "@/lib/redis";
import { queryPlayer } from "@/lib/query";
import { prisma } from "@/lib/db";
import { verifySign } from "@/lib/sign";

export const runtime = "nodejs";

/** 从请求中提取客户端真实 IP */
function getClientIp(req: NextRequest): string {
  // 优先 x-real-ip（nginx/Caddy 直传）
  const realIp = req.headers.get("x-real-ip");
  if (realIp && realIp !== "::1" && realIp !== "127.0.0.1") return realIp;
  // x-forwarded-for（多级代理链的第一个）
  const forwarded = req.headers.get("x-forwarded-for");
  if (forwarded) {
    const first = forwarded.split(",")[0]?.trim();
    if (first && first !== "::1" && first !== "127.0.0.1") return first;
  }
  // Fly.io 等 CDN
  const flyIp = req.headers.get("fly-client-ip");
  if (flyIp) return flyIp;
  // Cloudflare
  const cfIp = req.headers.get("cf-connecting-ip");
  if (cfIp) return cfIp;
  return "127.0.0.1";
}

export async function GET(req: NextRequest) {
  const input = req.nextUrl.searchParams.get("q")?.trim();
  const season = req.nextUrl.searchParams.get("season")?.trim() || undefined;

  if (!input || input.length < 2 || input.length > 50) {
    return NextResponse.json(
      { error: "请输入有效的玩家昵称（2-50 个字符）或 Steam ID" },
      { status: 400 }
    );
  }

  // 签名校验 — 防爬
  const ts = req.nextUrl.searchParams.get("ts") || "";
  const sign = req.nextUrl.searchParams.get("sign") || "";
  if (!verifySign(ts, sign)) {
    return NextResponse.json({ error: "签名校验失败" }, { status: 403 });
  }

  // Referer / Origin 校验 — 只允许本站和本地请求
  const referer = req.headers.get("referer") || "";
  const origin = req.headers.get("origin") || "";
  const host = req.headers.get("host") || "";
  const isSelfRequest = !origin && !referer; // 本地/同源无头请求
  const isOurDomain = referer.includes(host) || origin.includes(host);
  if (!isSelfRequest && !isOurDomain) {
    return NextResponse.json({ error: "不允许的跨域请求" }, { status: 403 });
  }

  // Rate limiting — 基于真实 IP
  const ip = getClientIp(req);
  const ratelimit = await getRatelimit();
  const { success, remaining } = await ratelimit.limit(ip);
  if (!success) {
    return NextResponse.json(
      { error: "请求过于频繁，请稍后再试" },
      { status: 429 }
    );
  }

  const result = await queryPlayer(input, season);

  // 记录查询日志（失败不影响主流程）
  prisma.queryLog
    .create({
      data: {
        input,
        type: result.type,
        ip,
        success: !result.error,
      },
    })
    .catch((err: unknown) => {
      console.error("[QueryLog] 写入日志失败:", err);
    });

  // 1% 概率触发清理 30 天前的旧日志
  if (Math.random() < 0.01) {
    const cutoff = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    prisma.queryLog.deleteMany({ where: { createdAt: { lt: cutoff } } }).catch(() => {});
  }

  return NextResponse.json(result, {
    headers: {
      "X-RateLimit-Remaining": String(remaining),
      "Cache-Control": result.fromCache
        ? "public, max-age=300"
        : "no-store",
    },
  });
}
