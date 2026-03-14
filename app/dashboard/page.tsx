import { prisma } from "@/lib/prisma";
import PickupScheduler from "@/components/PickupScheduler";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const entries = await prisma.leaderboardEntry.findMany({
    orderBy: { totalPickups: "desc" },
    take: 20,
    select: {
      id: true,
      walletDisplay: true,
      totalPickups: true,
      totalTokens: true,
      lastPickupAt: true,
    },
  });

  const [totalPickups, tokenSum] = await Promise.all([
    prisma.pickup.count({ where: { status: "CONFIRMED" } }),
    prisma.pickupToken.aggregate({ _sum: { amount: true } }),
  ]);

  const serializedEntries = entries.map((e, i) => ({
    rank:        i + 1,
    id:          e.id,
    address:     e.walletDisplay,
    pickups:     e.totalPickups,
    tokens:      e.totalTokens,
    lastPickupAt: e.lastPickupAt.toISOString(),
  }));

  return (
    <PickupScheduler
      initialLeaderboard={serializedEntries}
      stats={{
        totalPickups,
        totalTokensMinted: tokenSum._sum.amount ?? 0,
        maxSupply: 1_000_000,
      }}
    />
  );
}