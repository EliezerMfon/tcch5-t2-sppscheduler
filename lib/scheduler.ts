import { prisma } from "@/lib/prisma"

export async function schedulePickup(data: {
  customerId: string
  pickupTime: string
  location: string
  senderName: string
  notes?: string | null
}) {
  const { customerId, pickupTime, location, senderName, notes } = data

  const time = new Date(pickupTime)

  if (isNaN(time.getTime())) {
    throw new Error("Invalid pickup time provided.")
  }

  // Find any available agent (simplified — just get first AGENT user)
  const availableAgents = await prisma.user.findMany({
    where: {
      role: "AGENT",
    },
  })

  if (availableAgents.length === 0) {
    throw new Error("No agents available at this time")
  }

  const assignedAgent = availableAgents[0]

  const pickup = await prisma.pickup.create({
    data: {
      customerId,
      agentId:    assignedAgent.id,
      senderName,
      location,
      notes:      notes ?? null,
      pickupTime: time,
      status:     "PENDING",
    },
  })

  return pickup
}