'use client'
import { useState, useEffect } from 'react'

interface MenuItem { id: string; name: string; price: number; stock: number }
interface Restaurant { id: string; name: string; category: string }
interface CartItem extends MenuItem { qty: number }

export default function PlaceOrderPage() {
  const [restaurants, setRestaurants] = useState<Restaurant[]>([])
  const [menuItems, setMenuItems] = useState<MenuItem[]>([])
  const [selectedRest, setSelectedRest] = useState<string>('')
  const [cart, setCart] = useState<CartItem[]>([])
  const [log, setLog] = useState<string[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    fetch('/api/menu').then((r) => r.json()).then(({ restaurants, menuItems }) => {
      setRestaurants(restaurants)
      setMenuItems(menuItems)
      setSelectedRest(restaurants[0]?.id ?? '')
    })
  }, [])

  const changeRestaurant = async (id: string) => {
    setSelectedRest(id)
    setCart([])
    const res = await fetch(`/api/menu?restaurantId=${id}`)
    const { menuItems } = await res.json()
    setMenuItems(menuItems)
  }

  const addToCart = (item: MenuItem) => {
    setCart((prev) => {
      const existing = prev.find((c) => c.id === item.id)
      if (existing) return prev.map((c) => c.id === item.id ? { ...c, qty: c.qty + 1 } : c)
      return [...prev, { ...item, qty: 1 }]
    })
  }

  const handleOrder = async (concurrent = false) => {
    if (cart.length === 0) return
    setLoading(true)
    const body = {
      restaurantId: selectedRest,
      items: cart.map((c) => ({ menuItemId: c.id, qty: c.qty })),
    }

    const doRequest = async (label: string) => {
      const res = await fetch('/api/place-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      const data = await res.json()
      if (data.success) {
        setLog((p) => [`✅ [${label}] Order #${data.order.id.slice(-6)} confirmed — ฿${data.order.totalAmount.toFixed(0)}`, ...p])
      } else {
        setLog((p) => [`❌ [${label}] ${data.error} — ${JSON.stringify(data.items ?? '')}`, ...p])
      }
    }

    if (concurrent) {
      setLog((p) => ['🔀 Firing 2 concurrent requests...', ...p])
      await Promise.all([doRequest('Request A'), doRequest('Request B')])
    } else {
      await doRequest('Single')
    }

    const res = await fetch(`/api/menu?restaurantId=${selectedRest}`)
    const { menuItems } = await res.json()
    setMenuItems(menuItems)
    setLoading(false)
  }

  return (
    <div>
      <h1 className="text-xl font-bold mb-1">🛒 Place Order</h1>
      <p className="text-gray-400 text-sm mb-6">ข้อ 3 — Atomic Stock Update + Race Condition Prevention</p>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
          <select
            className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm w-full"
            value={selectedRest}
            onChange={(e) => changeRestaurant(e.target.value)}
          >
            {restaurants.map((r) => <option key={r.id} value={r.id}>{r.name}</option>)}
          </select>

          <div className="grid grid-cols-2 gap-3">
            {menuItems.map((item) => (
              <div key={item.id} className="bg-gray-900 border border-gray-800 rounded-xl p-4">
                <div className="font-medium text-sm mb-1">{item.name}</div>
                <div className="flex justify-between items-center">
                  <div className="text-xs text-gray-400">฿{item.price.toFixed(0)}</div>
                  <div className={`text-xs ${item.stock < 3 ? 'text-red-400' : 'text-gray-400'}`}>
                    Stock: {item.stock}
                  </div>
                </div>
                <button
                  onClick={() => addToCart(item)}
                  disabled={item.stock === 0}
                  className="mt-3 w-full bg-gray-800 hover:bg-gray-700 disabled:opacity-40 text-xs py-1.5 rounded-lg transition-colors"
                >
                  {item.stock === 0 ? 'หมด' : '+ เพิ่มใส่ตะกร้า'}
                </button>
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-4">
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
            <h3 className="font-medium text-sm mb-3">🛒 ตะกร้า</h3>
            {cart.length === 0 ? (
              <p className="text-gray-500 text-xs">ยังไม่มีสินค้า</p>
            ) : (
              <div className="space-y-2 mb-4">
                {cart.map((item) => (
                  <div key={item.id} className="flex justify-between text-xs">
                    <span className="text-gray-300">{item.name} ×{item.qty}</span>
                    <span>฿{(item.price * item.qty).toFixed(0)}</span>
                  </div>
                ))}
                <div className="border-t border-gray-700 pt-2 flex justify-between text-sm font-medium">
                  <span>รวม</span>
                  <span>฿{cart.reduce((s, i) => s + i.price * i.qty, 0).toFixed(0)}</span>
                </div>
              </div>
            )}

            <div className="space-y-2">
              <button
                onClick={() => handleOrder(false)}
                disabled={loading || cart.length === 0}
                className="w-full bg-violet-600 hover:bg-violet-700 disabled:opacity-50 text-white text-sm py-2 rounded-lg transition-colors"
              >
                {loading ? 'กำลังสั่ง...' : '✅ สั่งอาหาร'}
              </button>
              <button
                onClick={() => handleOrder(true)}
                disabled={loading || cart.length === 0}
                className="w-full bg-orange-600/20 hover:bg-orange-600/30 border border-orange-500/30 text-orange-400 text-xs py-2 rounded-lg transition-colors"
              >
                🔀 จำลอง 2 requests พร้อมกัน
              </button>
            </div>
          </div>

          <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
            <h3 className="font-medium text-sm mb-3">📋 Transaction Log</h3>
            <div className="space-y-1.5 max-h-64 overflow-y-auto">
              {log.length === 0 ? (
                <p className="text-gray-600 text-xs">ยังไม่มี log</p>
              ) : (
                log.map((l, i) => (
                  <div key={i} className="text-xs font-mono text-gray-300 bg-gray-800 px-2 py-1 rounded">
                    {l}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
