import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;

    // First, get the pickup to find the userId
    const pickupData = await prisma.pickup.findUnique({
      where: { id },
      select: { userId: true },
    });

    if (!pickupData) {
      return NextResponse.json(
        { error: "Pickup not found" },
        { status: 404 }
      );
    }

    const userId = pickupData.userId;
    const mockWallet = "0x" + Math.random().toString(16).slice(2, 40); // Mock wallet for demo

    // Start transaction: confirm pickup, create token, upsert leaderboard
    const [pickup, token, leaderboardEntry] = await prisma.$transaction([
      // 1. Update pickup status to CONFIRMED
      prisma.pickup.update({
        where: { id },
        data: {
          status: "CONFIRMED",
          updatedAt: new Date(),
        },
      }),
      // 2. Create PickupToken with wallet address
      prisma.pickupToken.create({
        data: {
          pickupId: id,
          toWallet: mockWallet,
          amount: 100,
          txHash: "0x" + Math.random().toString(16).slice(2, 66),
        },
      }),
      // 3. Upsert LeaderboardEntry with actual userId and wallet
      prisma.leaderboardEntry.upsert({
        where: { userId },
        update: {
          totalPickups: { increment: 1 },
          totalTokens: { increment: 100 },
          lastPickupAt: new Date(),
        },
        create: {
          userId,
          walletDisplay: mockWallet.slice(0, 6) + "..." + mockWallet.slice(-4),
          totalPickups: 1,
          totalTokens: 100,
        },
      }),
    ]);

    return NextResponse.json(
      {
        pickup,
        token,
        leaderboardEntry,
        message: "Pickup confirmed and token minted",
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("PATCH /api/pickups/[id]/confirm error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
