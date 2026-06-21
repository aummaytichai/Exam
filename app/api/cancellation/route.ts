import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export async function GET() {
  const logs = await prisma.cancellationLog.findMany({
    include: { rider: true },
    orderBy: { cancelledAt: 'desc' },
    take: 20,
  })

  const incentive = await prisma.zoneIncentive.findFirst({
    where: { expiresAt: { gt: new Date() } },
    orderBy: { createdAt: 'desc' },
  })

  const stats = await prisma.$queryRaw<Array<{ zone_id: string; count: bigint; flagged: bigint }>>`
    SELECT
      "zoneId" AS zone_id,
      COUNT(*) AS count,
      SUM(CASE WHEN "flaggedForReview" = true THEN 1 ELSE 0 END) AS flagged
    FROM "CancellationLog"
    GROUP BY "zoneId"
    ORDER BY count DESC
    LIMIT 5
  `

  return NextResponse.json({
    logs,
    incentive,
    stats: stats.map((s) => ({
      zoneId: s.zone_id,
      count: Number(s.count),
      flagged: Number(s.flagged),
    })),
  })
}

export async function POST(req: Request) {
  const { zoneId, bonusMultiplier } = await req.json()

  const incentive = await prisma.zoneIncentive.create({
    data: {
      zoneId,
      bonusMultiplier,
      triggerReason: `Manual trigger — ${new Date().toLocaleTimeString('th-TH')}`,
      expiresAt: new Date(Date.now() + 30 * 60 * 1000),
    },
  })

  return NextResponse.json({ success: true, incentive })
}
