import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const restaurantId = searchParams.get('restaurantId')

  const restaurants = await prisma.restaurant.findMany({ take: 5 })
  const menuItems = restaurantId
    ? await prisma.menuItem.findMany({ where: { restaurantId } })
    : await prisma.menuItem.findMany({ where: { restaurantId: restaurants[0]?.id } })

  return NextResponse.json({ restaurants, menuItems })
}
