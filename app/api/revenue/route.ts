import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export async function GET() {
  const rows = await prisma.$queryRaw<
    Array<{ category: string; rank: bigint; restaurant_name: string; aov: number; order_count: bigint }>
  >`
    WITH monthly AS (
      SELECT
        o."restaurantId",
        SUM(o."totalAmount")::numeric                       AS total_revenue,
        COUNT(o.id)                                          AS order_count,
        SUM(o."totalAmount") / COUNT(o.id)::numeric         AS aov
      FROM "Order" o
      WHERE o.status = 'delivered'
        AND DATE_TRUNC('month', o."createdAt") = DATE_TRUNC('month', CURRENT_DATE)
      GROUP BY o."restaurantId"
    ),
    ranked AS (
      SELECT
        r.id,
        r.name                              AS restaurant_name,
        r.category,
        COALESCE(m.aov, 0)                  AS aov,
        COALESCE(m.order_count, 0)          AS order_count,
        RANK() OVER (
          PARTITION BY r.category
          ORDER BY COALESCE(m.aov, 0) DESC
        )                                   AS rank
      FROM "Restaurant" r
      LEFT JOIN monthly m ON m."restaurantId" = r.id
      WHERE COALESCE(m.order_count, 0) > 0
    )
    SELECT category, rank, restaurant_name, aov, order_count
    FROM ranked
    WHERE rank <= 3
    ORDER BY category, rank
  `

  const data = rows.map((r) => ({
    ...r,
    rank: Number(r.rank),
    order_count: Number(r.order_count),
    aov: Number(r.aov),
  }))

  return NextResponse.json(data)
}
