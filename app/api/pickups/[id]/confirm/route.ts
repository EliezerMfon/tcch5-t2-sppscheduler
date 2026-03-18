import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

export async function PATCH(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;

  try {
    const pickup = await prisma.pickup.findUnique({
      where: { id },
      include: { customer: true },
    });

    if (!pickup) {
      return NextResponse.json({ error: `Pickup ${id} not found` }, { status: 404 });
    }

    const walletDisplay = pickup.customer.wallet
      ? `${pickup.customer.wallet.slice(0, 6)}...${pickup.customer.wallet.slice(-4)}`
      : "0x????...????";

    const [confirmedPickup] = await prisma.$transaction([
      prisma.pickup.update({
        where: { id },
        data: { status: "CONFIRMED" },
      }),

      prisma.pickupToken.create({
        data: {
          pickupId: id,
          toWallet: pickup.customer.wallet ?? "",
          amount:   100,
        },
      }),

      prisma.leaderboardEntry.upsert({
        where:  { userId: pickup.customerId },
        create: {
          userId:        pickup.customerId,
          walletDisplay,
          totalPickups:  1,
          totalTokens:   100,
        },
        update: {
          totalPickups: { increment: 1 },
          totalTokens:  { increment: 100 },
        },
      }),
    ]);

    return NextResponse.json({
      pickup: {
        id:           confirmedPickup.id,
        senderName:   confirmedPickup.senderName,
        address:      confirmedPickup.location,
        scheduledAt:  confirmedPickup.pickupTime.toISOString(),
        createdAt:    confirmedPickup.createdAt.toISOString(),
        updatedAt:    confirmedPickup.updatedAt.toISOString(),
        status:       confirmedPickup.status,
        txHash:       confirmedPickup.txHash ?? null,
        tokensMinted: 100,
      },
    });
  } catch (error: any) {
    console.error("[PATCH confirm error]", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}