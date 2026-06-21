import { prisma } from './db'

export interface OrderItemInput {
  menuItemId: string
  qty: number
}

export class InsufficientStockError extends Error {
  constructor(public items: Array<{ menuItemId: string; available: number; requested: number }>) {
    super('Insufficient stock')
    this.name = 'InsufficientStockError'
  }
}

export async function placeOrder(restaurantId: string, items: OrderItemInput[]) {
  return prisma.$transaction(async (trx) => {
    const ids = items.map((i) => i.menuItemId)
    const products = await trx.$queryRaw<Array<{ id: string; stock: number; price: number; name: string }>>`
      SELECT id, stock, price, name FROM "MenuItem"
      WHERE id = ANY(${ids}::text[])
      FOR UPDATE
    `

    const stockMap = new Map(products.map((p) => [p.id, p]))

    const insufficient = items
      .filter((item) => (stockMap.get(item.menuItemId)?.stock ?? 0) < item.qty)
      .map((item) => ({
        menuItemId: item.menuItemId,
        available: stockMap.get(item.menuItemId)?.stock ?? 0,
        requested: item.qty,
      }))

    if (insufficient.length > 0) throw new InsufficientStockError(insufficient)

    for (const item of items) {
      await trx.$executeRaw`
        UPDATE "MenuItem"
        SET stock = stock - ${item.qty}
        WHERE id = ${item.menuItemId} AND stock >= ${item.qty}
      `
    }

    const totalAmount = items.reduce((sum, item) => {
      const product = stockMap.get(item.menuItemId)!
      return sum + product.price * item.qty
    }, 0)

    const order = await trx.order.create({
      data: {
        restaurantId,
        status: 'confirmed',
        totalAmount,
        items: {
          create: items.map((item) => ({
            menuItemId: item.menuItemId,
            qty: item.qty,
            price: stockMap.get(item.menuItemId)!.price,
          })),
        },
      },
      include: { items: { include: { menuItem: true } } },
    })

    return order
  })
}
