import { prisma } from "@/lib/prisma";
import { schedulePickup } from "@/lib/scheduler";
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

    // Call scheduler with field names it expects
    const pickup = await schedulePickup({
      customerId: userId,       // frontend userId → customerId
      pickupTime: scheduledAt,  // frontend scheduledAt → pickupTime
      location:   address,      // frontend address → location
      senderName,
      notes,
    });

    // Return field names the frontend ConfirmedPickup interface expects
    return NextResponse.json({
      id:           pickup.id,
      senderName:   pickup.senderName,
      address:      pickup.location,              // remap back
      scheduledAt:  pickup.pickupTime.toISOString(), // remap back
      createdAt:    pickup.createdAt.toISOString(),
      updatedAt:    pickup.updatedAt.toISOString(),
      status:       pickup.status,
      txHash:       pickup.txHash ?? null,
      tokensMinted: null,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}