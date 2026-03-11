// ./lib/scheduler.ts
import { PrismaClient, Role, PickupStatus } from '@prisma/client'

const prisma = new PrismaClient()

interface PickupRequest {
  userId: string
  pickupTime: string
}

export async function schedulePickup(data: PickupRequest) {
  const { userId, pickupTime } = data

  // Find an available agent
  const agent = await prisma.user.findFirst({
    where: {
      role: Role.AGENT
    }
  })

  if (!agent) {
    throw new Error("No available agent")
  }

  // Create pickup record
  const pickup = await prisma.pickup.create({
    data: {
      customerId: userId,
      agentId: agent.id,
      pickupTime: new Date(pickupTime),
      status: PickupStatus.PENDING
    }
  })

  return {
    message: "Pickup scheduled successfully",
    pickup
  }
}