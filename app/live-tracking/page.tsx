'use client'
import { useEffect, useRef, useState } from 'react'
import { io, type Socket } from 'socket.io-client'

interface Rider {
  id: string
  name: string
  lat: number
  lon: number
}

const BKK_CENTER = { lat: 13.7563, lon: 100.5018 }
const SCALE = 6000

export default function LiveTrackingPage() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const ridersRef = useRef<Map<string, Rider>>(new Map())
  const [connected, setConnected] = useState(false)
  const [updateCount, setUpdateCount] = useState(0)
  const [riderCount, setRiderCount] = useState(0)

  useEffect(() => {
    const socket: Socket = io({ path: '/socket.io' })

    socket.on('connect', () => setConnected(true))
    socket.on('disconnect', () => setConnected(false))

    socket.on('riders:init', (riders: Rider[]) => {
      riders.forEach((r) => ridersRef.current.set(r.id, r))
      setRiderCount(riders.length)
      draw()
    })

    socket.on('rider:move', (rider: Rider) => {
      ridersRef.current.set(rider.id, rider)
      setUpdateCount((n) => n + 1)
      draw()
    })

    function draw() {
      const canvas = canvasRef.current
      if (!canvas) return
      const ctx = canvas.getContext('2d')!
      const W = canvas.width
      const H = canvas.height

      ctx.fillStyle = '#0f172a'
      ctx.fillRect(0, 0, W, H)

      ctx.strokeStyle = '#1e3a5f'
      ctx.lineWidth = 1
      for (let i = 0; i <= 10; i++) {
        ctx.beginPath()
        ctx.moveTo((W / 10) * i, 0)
        ctx.lineTo((W / 10) * i, H)
        ctx.stroke()
        ctx.beginPath()
        ctx.moveTo(0, (H / 10) * i)
        ctx.lineTo(W, (H / 10) * i)
        ctx.stroke()
      }

      ctx.beginPath()
      ctx.arc(W / 2, H / 2, 8, 0, Math.PI * 2)
      ctx.fillStyle = '#f59e0b'
      ctx.fill()
      ctx.fillStyle = '#fff'
      ctx.font = '9px sans-serif'
      ctx.fillText('BKK', W / 2 + 10, H / 2 + 4)

      ridersRef.current.forEach((rider) => {
        const x = W / 2 + (rider.lon - BKK_CENTER.lon) * SCALE
        const y = H / 2 - (rider.lat - BKK_CENTER.lat) * SCALE

        ctx.beginPath()
        ctx.arc(x, y, 6, 0, Math.PI * 2)
        ctx.fillStyle = '#22c55e'
        ctx.fill()
        ctx.strokeStyle = '#16a34a'
        ctx.lineWidth = 1.5
        ctx.stroke()

        ctx.fillStyle = '#e2e8f0'
        ctx.font = '9px sans-serif'
        ctx.fillText(rider.name, x + 8, y + 3)
      })
    }

    return () => {
      socket.disconnect()
    }
  }, [])

  return (
    <div>
      <h1 className="text-xl font-bold mb-1">📍 Live Tracking</h1>
      <p className="text-gray-400 text-sm mb-6">ข้อ 4 — Real-time GPS via WebSocket (Socket.io + Redis)</p>

      <div className="flex items-center gap-4 mb-4">
        <div className={`flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full ${connected ? 'bg-green-500/10 text-green-400' : 'bg-red-500/10 text-red-400'}`}>
          <span className={`w-2 h-2 rounded-full ${connected ? 'bg-green-400' : 'bg-red-400'}`} />
          {connected ? 'Connected' : 'Disconnected'}
        </div>
        <div className="text-xs text-gray-500">Riders: {riderCount}</div>
        <div className="text-xs text-gray-500">Updates: {updateCount}</div>
        <div className="text-xs text-gray-600">ทุก 2 วินาที</div>
      </div>

      <canvas
        ref={canvasRef}
        width={700}
        height={450}
        className="rounded-xl border border-gray-700 w-full"
      />

      <div className="mt-4 bg-gray-900 border border-gray-800 rounded-xl p-4">
        <h3 className="text-sm font-medium mb-3">Architecture</h3>
        <div className="grid grid-cols-3 gap-4 text-xs text-gray-400">
          <div className="bg-gray-800 rounded-lg p-3">
            <div className="text-white font-medium mb-1">🖥️ server.ts</div>
            <div>setupSocket() จำลอง GPS ทุก 2 วินาที</div>
          </div>
          <div className="bg-gray-800 rounded-lg p-3">
            <div className="text-white font-medium mb-1">🔴 Redis</div>
            <div>เก็บ lat/lon ล่าสุดของแต่ละ rider</div>
          </div>
          <div className="bg-gray-800 rounded-lg p-3">
            <div className="text-white font-medium mb-1">📡 Socket.io</div>
            <div>emit rider:move ถึง client ทุกคน</div>
          </div>
        </div>
      </div>
    </div>
  )
}
