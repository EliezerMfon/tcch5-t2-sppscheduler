import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, senderName, address, notes, scheduledAt } = body;

    if (!userId || !senderName || !address || !scheduledAt) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    const pickup = await prisma.pickup.create({
      data: {
        userId,
        senderName,
        address,
        notes: notes || null,
        scheduledAt: new Date(scheduledAt),
        status: "PENDING_AGENT",
        txHash: "0x" + Math.random().toString(16).slice(2, 66), // Random tx hash for demo
      },
    });

    return NextResponse.json(pickup, { status: 201 });
  } catch (error) {
    console.error("POST /api/pickups error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const pickups = await prisma.pickup.findMany({
      orderBy: { createdAt: "desc" },
      take: 50,
    });

    return NextResponse.json(pickups);
  } catch (error) {
    console.error("GET /api/pickups error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
