import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

export async function GET() {
  const result: { pubgStatus: string; steamOnline: number | null; error?: string } = {
    pubgStatus: "未知",
    steamOnline: null,
  };

  try {
    // PUBG API 状态
    const pubgRes = await fetch("https://api.pubg.com/status", {
      signal: AbortSignal.timeout(5000),
    });
    result.pubgStatus = pubgRes.ok ? "正常运行" : "异常";
  } catch {
    result.pubgStatus = "未知";
  }

  try {
    // Steam 在线人数 (PUBG appid=578080)
    // 用 bracket 访问绕过 Next.js webpack 构建时内联
    const steamKey = process.env.STEAM_API_KEY;
    if (steamKey) {
      const url = `https://api.steampowered.com/ISteamUserStats/GetNumberOfCurrentPlayers/v1/?appid=578080&key=${steamKey}`;
      const steamRes = await fetch(url, { signal: AbortSignal.timeout(5000) });
      const json = await steamRes.json();
      result.steamOnline = json?.response?.player_count ?? null;
    }
  } catch {
    result.steamOnline = null;
  }

  return NextResponse.json(result, {
    headers: { "Cache-Control": "public, max-age=60" },
  });
}
