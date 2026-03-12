import { PrismaClient, Role } from "@prisma/client"

const prisma = new PrismaClient()

async function main() {

  // Create a test customer
  const customer = await prisma.user.create({
    data: {
      name: "Test Customer",
      email: "customer@test.com",
      role: Role.USER
    }
  })

  // Create delivery agents
  const agent1 = await prisma.user.create({
    data: {
      name: "Agent One",
      email: "agent1@test.com",
      role: Role.AGENT
    }
  })

  const agent2 = await prisma.user.create({
    data: {
      name: "Agent Two",
      email: "agent2@test.com",
      role: Role.AGENT
    }
  })

  console.log("Seed data created:")
  console.log({ customer, agent1, agent2 })
}

main()
  .then(async () => {
    await prisma.$disconnect()
  })
  .catch(async (e) => {
    console.error(e)
    await prisma.$disconnect()
    process.exit(1)
  })