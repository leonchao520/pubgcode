import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export const runtime = "nodejs";

// GET /api/favorites — list favorites
export async function GET() {
  const favorites = await prisma.player.findMany({
    where: { favorite: true },
    orderBy: { queriedAt: "desc" },
    select: { name: true, steamId: true, queriedAt: true },
    take: 50,
  });
  return NextResponse.json(favorites.map(p => ({
    ...p, queriedAt: p.queriedAt.toISOString(),
  })));
}

// POST /api/favorites — toggle favorite
export async function POST(req: NextRequest) {
  const { name } = await req.json().catch(() => ({}));
  if (!name || typeof name !== "string") {
    return NextResponse.json({ error: "invalid name" }, { status: 400 });
  }

  const nameLower = name.toLowerCase();
  const player = await prisma.player.findUnique({ where: { nameLower } });

  if (!player) {
    // create player record if not exists
    await prisma.player.create({
      data: { name, nameLower, favorite: true },
    });
    return NextResponse.json({ favorited: true });
  }

  const updated = await prisma.player.update({
    where: { nameLower },
    data: { favorite: !player.favorite },
  });

  return NextResponse.json({ favorited: updated.favorite });
}
