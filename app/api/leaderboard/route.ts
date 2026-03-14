import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  try {
    const entries = await prisma.leaderboardEntry.findMany({
      orderBy: { totalPickups: "desc" },
      take: 100,
    });

    const [totalPickups, tokenSum] = await Promise.all([
      prisma.pickup.count({ where: { status: "CONFIRMED" } }),
      prisma.pickupToken.aggregate({ _sum: { amount: true } }),
    ]);

    return NextResponse.json({
      entries,
      stats: {
        totalPickups,
        totalTokensMinted: tokenSum._sum.amount ?? 0,
        maxSupply: 1_000_000,
      },
    });
  } catch (error) {
    console.error("GET /api/leaderboard error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
