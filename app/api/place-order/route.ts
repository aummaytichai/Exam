import { NextResponse } from 'next/server'
import { placeOrder, InsufficientStockError } from '@/lib/placeOrder'

export async function POST(req: Request) {
  const { restaurantId, items } = await req.json()

  try {
    const order = await placeOrder(restaurantId, items)
    return NextResponse.json({ success: true, order })
  } catch (err) {
    if (err instanceof InsufficientStockError) {
      return NextResponse.json({ success: false, error: 'INSUFFICIENT_STOCK', items: err.items }, { status: 409 })
    }
    return NextResponse.json({ success: false, error: String(err) }, { status: 500 })
  }
}
