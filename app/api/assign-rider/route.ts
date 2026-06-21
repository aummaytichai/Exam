import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { assignRider } from '@/lib/assignRider'

export async function POST(req: Request) {
  const { restaurantId } = await req.json()

  const restaurant = await prisma.restaurant.findUnique({ where: { id: restaurantId } })
  if (!restaurant) return NextResponse.json({ error: 'Restaurant not found' }, { status: 404 })

  const riders = await prisma.rider.findMany()
  const result = assignRider(restaurant.lat, restaurant.lon, riders)

  return NextResponse.json({ restaurant, result })
}

export async function GET() {
  const restaurants = await prisma.restaurant.findMany({ take: 10 })
  const riders = await prisma.rider.findMany()
  return NextResponse.json({ restaurants, riders })
}
