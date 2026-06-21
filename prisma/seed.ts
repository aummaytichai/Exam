import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

const BKK = { lat: 13.7563, lon: 100.5018 }

function randomNear(base: number, range: number) {
  return base + (Math.random() - 0.5) * range
}

async function main() {
  // Clear all tables
  await prisma.cancellationLog.deleteMany()
  await prisma.orderItem.deleteMany()
  await prisma.order.deleteMany()
  await prisma.menuItem.deleteMany()
  await prisma.zoneIncentive.deleteMany()
  await prisma.rider.deleteMany()
  await prisma.restaurant.deleteMany()

  // Restaurants: 5 categories × 4 = 20
  const categories = ['Thai', 'Japanese', 'Pizza', 'Burger', 'Dessert']
  const restaurants = []
  for (const category of categories) {
    for (let i = 1; i <= 4; i++) {
      const r = await prisma.restaurant.create({
        data: {
          name: `${category} Place ${i}`,
          category,
          lat: randomNear(BKK.lat, 0.05),
          lon: randomNear(BKK.lon, 0.05),
        },
      })
      restaurants.push(r)
    }
  }

  // Menu items: 4 per restaurant = 80 items
  const allMenuItems = []
  for (const r of restaurants) {
    for (let i = 1; i <= 4; i++) {
      const item = await prisma.menuItem.create({
        data: {
          restaurantId: r.id,
          name: `${r.category} Dish ${i}`,
          price: Math.round((Math.random() * 200 + 50) * 10) / 10,
          stock: Math.floor(Math.random() * 20) + 5,
        },
      })
      allMenuItems.push(item)
    }
  }

  // Riders: 10
  const riderNames = ['Somchai', 'Niran', 'Pattana', 'Wichai', 'Krit',
                      'Anan', 'Thana', 'Sak', 'Pong', 'Dang']
  for (const name of riderNames) {
    await prisma.rider.create({
      data: {
        name,
        lat: randomNear(BKK.lat, 0.04),
        lon: randomNear(BKK.lon, 0.04),
        rating: Math.round((Math.random() * 1.5 + 3.5) * 10) / 10,
        status: Math.random() > 0.2 ? 'active' : 'busy',
        lastUpdatedAt: new Date(Date.now() - Math.floor(Math.random() * 90_000)),
      },
    })
  }

  // 50 delivered orders in current month
  const now = new Date()
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)

  for (let i = 0; i < 50; i++) {
    const restaurant = restaurants[Math.floor(Math.random() * restaurants.length)]
    const items = allMenuItems
      .filter((m) => m.restaurantId === restaurant.id)
      .slice(0, Math.floor(Math.random() * 3) + 1)

    const createdAt = new Date(
      monthStart.getTime() + Math.random() * (now.getTime() - monthStart.getTime())
    )

    const totalAmount = items.reduce((sum, item) => sum + item.price, 0)

    await prisma.order.create({
      data: {
        restaurantId: restaurant.id,
        status: 'delivered',
        totalAmount,
        createdAt,
        items: {
          create: items.map((item) => ({
            menuItemId: item.id,
            qty: 1,
            price: item.price,
          })),
        },
      },
    })
  }

  // Riders list for cancellation logs
  const riders = await prisma.rider.findMany()

  // 10 cancellation logs
  const firstOrder = await prisma.order.findFirst()
  for (let i = 0; i < 10; i++) {
    const rider = riders[Math.floor(Math.random() * riders.length)]
    const fraudy = i < 3
    await prisma.cancellationLog.create({
      data: {
        riderId: rider.id,
        orderId: firstOrder!.id,
        cancelReason: 'rider_cancel',
        distanceToRestaurantKm: Math.random() * 3,
        hadActiveIncentive: fraudy,
        incentiveMultiplier: fraudy ? 1.8 : null,
        timeSinceAcceptedSec: fraudy ? Math.floor(Math.random() * 30) : Math.floor(Math.random() * 300),
        consecutiveCancelsToday: fraudy ? Math.floor(Math.random() * 4) + 3 : 1,
        zoneId: `zone_${Math.floor(Math.random() * 5) + 1}`,
        fraudScore: fraudy ? Math.random() * 40 + 60 : Math.random() * 30,
        flaggedForReview: fraudy,
      },
    })
  }

  // 1 active zone incentive
  await prisma.zoneIncentive.create({
    data: {
      zoneId: 'zone_1',
      bonusMultiplier: 1.5,
      triggerReason: 'Cancellation rate 28% in last 30min',
      expiresAt: new Date(Date.now() + 30 * 60 * 1000),
    },
  })

  console.log('✅ Seed complete')
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
