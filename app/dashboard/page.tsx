// app/dashboard/page.tsx  (Server Component)
// This is the correct home for the PKU·CHAIN booking + leaderboard UI.
// app/page.tsx (WalletConnect landing) is left completely untouched.

import { prisma } from "@/lib/prisma";
import PickupScheduler from "@/components/PickupScheduler";
import Navbar from "@/components/Navbar";

export const dynamic = "force-dynamic"; // always fresh — no static caching

export default async function DashboardPage() {
  // Fetch leaderboard entries ranked by total pickups
  const entries = await prisma.leaderboardEntry.findMany({
    orderBy: { totalPickups: "desc" },
    take: 20,
    select: {
      id: true,
      walletDisplay: true,
      totalPickups: true,
      totalTokens: true,
      lastPickupAt: true, // @updatedAt — formatted DD/MM/YYYY · 12-hour on client
    },
  });

  // Aggregate stats for the stats bar
  const [totalPickups, tokenSum] = await Promise.all([
    prisma.pickup.count({ where: { status: "CONFIRMED" } }),
    prisma.pickupToken.aggregate({ _sum: { amount: true } }),
  ]);

  // Serialize Prisma Date objects → ISO strings before passing to Client Component
  const serializedEntries = entries.map(
    (e: typeof entries[0], i: number) => ({
      rank: i + 1,
      id: e.id,
      address: e.walletDisplay,
      pickups: e.totalPickups,
      tokens: e.totalTokens,
      lastPickupAt: e.lastPickupAt.toISOString(),
    })
  );

  return (
    <>
      <Navbar />
      <PickupScheduler
        initialLeaderboard={serializedEntries}
        stats={{
          totalPickups,
          totalTokensMinted: tokenSum._sum.amount ?? 0,
          maxSupply: 1_000_000,
        }}
      />
    </>
  );
}