'use client'
import { useState, useEffect, useCallback } from 'react'
import { RiderMap } from '@/components/RiderMap'
import type { RiderWithDistance } from '@/lib/assignRider'

interface Restaurant { id: string; name: string; category: string; lat: number; lon: number }
interface AssignResult {
  rider: RiderWithDistance | null
  fallback: boolean
  expandedRadius?: number
  allCandidates: RiderWithDistance[]
  action?: string
}

export default function RiderAssignmentPage() {
  const [restaurants, setRestaurants] = useState<Restaurant[]>([])
  const [riders, setRiders] = useState<RiderWithDistance[]>([])
  const [selectedRestaurant, setSelectedRestaurant] = useState<Restaurant | null>(null)
  const [result, setResult] = useState<AssignResult | null>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    fetch('/api/assign-rider')
      .then((r) => r.json())
      .then(({ restaurants, riders }) => {
        setRestaurants(restaurants)
        if (restaurants[0]) setSelectedRestaurant(restaurants[0])
        setRiders(riders.map((r: any) => ({ ...r, distanceKm: 0, stale: false })))
      })
  }, [])

  const handleAssign = useCallback(async () => {
    if (!selectedRestaurant) return
    setLoading(true)
    const res = await fetch('/api/assign-rider', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ restaurantId: selectedRestaurant.id }),
    })
    const data = await res.json()
    setResult(data.result)
    setRiders(data.result.allCandidates)
    setLoading(false)
  }, [selectedRestaurant])

  return (
    <div>
      <h1 className="text-xl font-bold mb-1">🛵 Rider Assignment</h1>
      <p className="text-gray-400 text-sm mb-6">ข้อ 1 — Haversine + Stale Protection + Tie-breaker</p>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="space-y-4">
          <div>
            <label className="text-xs text-gray-400 uppercase tracking-wider block mb-2">เลือกร้านอาหาร</label>
            <select
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm"
              onChange={(e) => {
                const r = restaurants.find((r) => r.id === e.target.value)
                setSelectedRestaurant(r ?? null)
                setResult(null)
              }}
            >
              {restaurants.map((r) => (
                <option key={r.id} value={r.id}>{r.name} ({r.category})</option>
              ))}
            </select>
          </div>

          <button
            onClick={handleAssign}
            disabled={loading || !selectedRestaurant}
            className="w-full bg-violet-600 hover:bg-violet-700 disabled:opacity-50 text-white rounded-lg px-4 py-2.5 text-sm font-medium transition-colors"
          >
            {loading ? 'กำลังค้นหา...' : '🔍 Assign Rider'}
          </button>

          {result && (
            <div className="bg-gray-900 border border-gray-700 rounded-xl p-4 space-y-3">
              {result.rider ? (
                <>
                  <div className="flex items-center gap-2">
                    <span className="text-green-400 text-lg">✅</span>
                    <span className="font-semibold">{result.rider.name}</span>
                    {result.fallback && (
                      <span className="text-xs bg-yellow-500/20 text-yellow-400 px-2 py-0.5 rounded-full">
                        Fallback {result.expandedRadius}km
                      </span>
                    )}
                  </div>
                  <div className="text-sm text-gray-400 space-y-1">
                    <div>📏 Distance: <span className="text-white">{result.rider.distanceKm.toFixed(2)} km</span></div>
                    <div>⭐ Rating: <span className="text-white">{result.rider.rating}</span></div>
                    <div>🕐 Stale: <span className={result.rider.stale ? 'text-red-400' : 'text-green-400'}>{result.rider.stale ? 'Yes' : 'No'}</span></div>
                  </div>
                </>
              ) : (
                <div className="text-yellow-400 text-sm">⚠️ ไม่มี Rider ในรัศมี 10km — {result.action}</div>
              )}

              <div className="border-t border-gray-700 pt-3">
                <div className="text-xs text-gray-500 mb-2">Candidates ({result.allCandidates.length})</div>
                <div className="space-y-1 max-h-48 overflow-y-auto">
                  {result.allCandidates.map((r) => (
                    <div
                      key={r.id}
                      className={`text-xs flex justify-between px-2 py-1 rounded ${r.id === result.rider?.id ? 'bg-green-500/10 text-green-400' : 'text-gray-500'}`}
                    >
                      <span>{r.name} {r.stale ? '(stale)' : ''}</span>
                      <span>{r.distanceKm.toFixed(2)}km ★{r.rating}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="lg:col-span-2">
          {selectedRestaurant && (
            <RiderMap
              restaurantLat={selectedRestaurant.lat}
              restaurantLon={selectedRestaurant.lon}
              riders={riders}
              winnerId={result?.rider?.id}
            />
          )}
          <p className="text-xs text-gray-600 mt-2">🟡 ร้านอาหาร  🔵 Rider ปกติ  ⚫ Stale (&gt;2min)  🟢 Winner</p>
        </div>
      </div>
    </div>
  )
}
