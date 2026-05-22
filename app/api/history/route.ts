import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  const page = Number(req.nextUrl.searchParams.get("page") ?? "1");
  const q = req.nextUrl.searchParams.get("q")?.trim() ?? "";
  const type = req.nextUrl.searchParams.get("type") ?? "all";
  const pageSize = 20;

  const where = {
    ...(q ? { input: { contains: q, mode: "insensitive" as const } } : {}),
    ...(type !== "all" ? { type } : {}),
  };

  const [total, logs, recentPlayers, stats] = await Promise.all([
    prisma.queryLog.count({ where }),
    prisma.queryLog.findMany({
      where, orderBy: { createdAt: "desc" },
      skip: (page - 1) * pageSize, take: pageSize,
      select: { id: true, input: true, type: true, success: true, createdAt: true },
    }),
    prisma.player.findMany({
      orderBy: { queriedAt: "desc" }, take: 50,
      select: { name: true, steamId: true, favorite: true, queriedAt: true },
    }),
    Promise.all([
      prisma.queryLog.count(),
      prisma.queryLog.count({ where: { success: true } }),
      prisma.queryLog.count({ where: { type: "name" } }),
      prisma.queryLog.count({ where: { type: "steamid" } }),
    ]),
  ]);

  const [totalAll, totalSuccess, totalName, totalSteam] = stats;

  return NextResponse.json({
    logs: logs.map(l => ({ ...l, createdAt: l.createdAt.toISOString() })),
    recentPlayers: recentPlayers.map(p => ({ ...p, queriedAt: p.queriedAt.toISOString() })),
    pagination: { page, pageSize, total, totalPages: Math.ceil(total / pageSize) },
    stats: { totalAll, totalSuccess, totalName, totalSteam },
  });
}
