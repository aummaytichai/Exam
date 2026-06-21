'use client'
import { useEffect, useRef } from 'react'
import type { RiderWithDistance } from '@/lib/assignRider'

interface Props {
  restaurantLat: number
  restaurantLon: number
  riders: RiderWithDistance[]
  winnerId?: string | null
}

const SCALE = 8000

export function RiderMap({ restaurantLat, restaurantLon, riders, winnerId }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')!
    const W = canvas.width
    const H = canvas.height
    ctx.clearRect(0, 0, W, H)

    ctx.fillStyle = '#111827'
    ctx.fillRect(0, 0, W, H)

    function toXY(lat: number, lon: number) {
      return {
        x: W / 2 + (lon - restaurantLon) * SCALE,
        y: H / 2 - (lat - restaurantLat) * SCALE,
      }
    }

    riders.forEach((r) => {
      const { x, y } = toXY(r.lat, r.lon)
      const isWinner = r.id === winnerId
      const isStale = r.stale

      ctx.beginPath()
      ctx.arc(x, y, isWinner ? 12 : 7, 0, Math.PI * 2)
      ctx.fillStyle = isWinner ? '#22c55e' : isStale ? '#6b7280' : '#3b82f6'
      ctx.fill()

      ctx.fillStyle = '#fff'
      ctx.font = `${isWinner ? '11px' : '9px'} sans-serif`
      ctx.fillText(r.name, x + 10, y + 4)

      if (!isStale) {
        ctx.fillStyle = '#94a3b8'
        ctx.font = '8px sans-serif'
        ctx.fillText(`${r.distanceKm.toFixed(2)}km ★${r.rating}`, x + 10, y + 14)
      }
    })

    const { x: rx, y: ry } = toXY(restaurantLat, restaurantLon)
    ctx.beginPath()
    ctx.arc(rx, ry, 10, 0, Math.PI * 2)
    ctx.fillStyle = '#f59e0b'
    ctx.fill()
    ctx.fillStyle = '#fff'
    ctx.font = 'bold 10px sans-serif'
    ctx.fillText('🍴', rx - 6, ry + 4)
  }, [restaurantLat, restaurantLon, riders, winnerId])

  return (
    <canvas
      ref={canvasRef}
      width={600}
      height={400}
      className="rounded-xl border border-gray-700 w-full"
    />
  )
}
