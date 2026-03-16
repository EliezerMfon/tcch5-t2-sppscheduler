import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    const { userId, senderName, address, notes, scheduledAt } = body;

    if (!userId || !senderName || !address || !scheduledAt) {
      return NextResponse.json(
        { error: "Missing required fields: userId, senderName, address, scheduledAt" },
        { status: 400 }
      );
    }

    const pickup = await prisma.pickup.create({
      data: {
        customerId: userId,
        senderName,
        location: address,
        notes: notes ?? null,
        pickupTime: new Date(scheduledAt),
        status: "PENDING",
      },
    });

    return NextResponse.json({
      id: pickup.id,
      senderName: pickup.senderName,
      address: pickup.location,
      scheduledAt: pickup.pickupTime.toISOString(),
      createdAt: pickup.createdAt.toISOString(),
      updatedAt: pickup.updatedAt.toISOString(),
      status: pickup.status,
      txHash: pickup.txHash ?? null,
      tokensMinted: null,
    });

  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}