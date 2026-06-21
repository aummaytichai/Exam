import type { Server } from 'socket.io'
import { redis } from './redis'

interface SimRider {
  id: string
  name: string
  lat: number
  lon: number
}

const SIM_RIDERS: SimRider[] = Array.from({ length: 10 }, (_, i) => ({
  id: `sim-rider-${i + 1}`,
  name: `Rider ${i + 1}`,
  lat: 13.7563 + (Math.random() - 0.5) * 0.04,
  lon: 100.5018 + (Math.random() - 0.5) * 0.04,
}))

export function setupSocket(io: Server) {
  setInterval(async () => {
    for (const rider of SIM_RIDERS) {
      rider.lat += (Math.random() - 0.5) * 0.0008
      rider.lon += (Math.random() - 0.5) * 0.0008

      await redis.hset(`rider:${rider.id}`, {
        lat: rider.lat.toString(),
        lon: rider.lon.toString(),
        ts: Date.now().toString(),
      })

      io.emit('rider:move', { id: rider.id, lat: rider.lat, lon: rider.lon })
    }
  }, 2000)

  io.on('connection', (socket) => {
    socket.emit('riders:init', SIM_RIDERS)
  })
}
