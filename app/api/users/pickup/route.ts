import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    // Fields sent by PickupScheduler.tsx handleBook():
    // { userId, senderName, address, notes, scheduledAt }
    const { userId, senderName, address, notes, scheduledAt } = body;

    if (!userId || !senderName || !address || !scheduledAt) {
      return NextResponse.json(
        { error: "Missing required fields: userId, senderName, address, scheduledAt" },
        { status: 400 }
      );
    }

    const pickup = await prisma.pickup.create({
      data: {
        customerId: userId,          // frontend sends userId → maps to customerId
        senderName,
        location: address,           // frontend sends address → stored as location
        notes: notes ?? null,
        pickupTime: new Date(scheduledAt), // frontend sends UTC ISO → Prisma DateTime
        status: "PENDING",
      },
    });

    // Return field names the frontend expects on ConfirmedPickup interface:
    // { id, senderName, address, scheduledAt, createdAt, updatedAt, status, txHash }
    return NextResponse.json({
      id:          pickup.id,
      senderName:  pickup.senderName,
      address:     pickup.location,       // remap location → address for frontend
      scheduledAt: pickup.pickupTime.toISOString(),
      createdAt:   pickup.createdAt.toISOString(),
      updatedAt:   pickup.updatedAt.toISOString(),
      status:      pickup.status,
      txHash:      pickup.txHash ?? null,
      tokensMinted: null,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}