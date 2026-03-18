import { prisma } from "@/lib/prisma"

export async function schedulePickup(data: {
  customerId: string
  pickupTime: string
  location: string
}) {
  const { customerId, pickupTime, location } = data

  const time = new Date(pickupTime)

  // Find agents available at that time
  const availableAgents = await prisma.user.findMany({
    where: {
      role: "AGENT",
      agentPickups: {
        none: {
          pickupTime: time
        }
      }
    }
  })

  if (availableAgents.length === 0) {
    throw new Error("No agents available at this time")
  }

  const assignedAgent = availableAgents[0]

  const pickup = await prisma.pickup.create({
    data: {
      customerId,
      agentId: assignedAgent.id,
      pickupTime: time,
      location,
      status: "CONFIRMED"
    }
  })

  return pickup
}