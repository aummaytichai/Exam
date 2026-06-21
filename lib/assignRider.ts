export interface RiderInput {
  id: string
  name: string
  lat: number
  lon: number
  rating: number
  lastUpdatedAt: Date | string
  status: string
}

export interface RiderWithDistance extends RiderInput {
  distanceKm: number
  stale: boolean
}

export interface AssignResult {
  rider: RiderWithDistance | null
  fallback: boolean
  expandedRadius?: number
  action?: string
  allCandidates: RiderWithDistance[]
}

const EARTH_RADIUS_KM = 6371
const STALE_MS = 2 * 60 * 1000
const MAX_RADIUS_KM = 5
const TIE_MARGIN_KM = 0.5

export function haversine(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const toRad = (d: number) => (d * Math.PI) / 180
  const dLat = toRad(lat2 - lat1)
  const dLon = toRad(lon2 - lon1)
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2
  return EARTH_RADIUS_KM * 2 * Math.asin(Math.sqrt(a))
}

export function assignRider(
  restaurantLat: number,
  restaurantLon: number,
  riders: RiderInput[]
): AssignResult {
  const now = Date.now()

  const withDistance: RiderWithDistance[] = riders.map((r) => ({
    ...r,
    distanceKm: haversine(r.lat, r.lon, restaurantLat, restaurantLon),
    stale: now - new Date(r.lastUpdatedAt).getTime() > STALE_MS,
  }))

  const fresh = withDistance.filter((r) => !r.stale && r.status === 'active')
  const inRange = fresh.filter((r) => r.distanceKm <= MAX_RADIUS_KM)

  if (inRange.length === 0) {
    const expanded = fresh
      .filter((r) => r.distanceKm <= 10)
      .sort((a, b) => a.distanceKm - b.distanceKm)
    return {
      rider: expanded[0] ?? null,
      fallback: true,
      expandedRadius: 10,
      action: expanded.length === 0 ? 'QUEUE_AND_NOTIFY' : undefined,
      allCandidates: withDistance,
    }
  }

  inRange.sort((a, b) => a.distanceKm - b.distanceKm)
  const winner = inRange.reduce((best, cur) => {
    const withinMargin = cur.distanceKm - best.distanceKm <= TIE_MARGIN_KM
    return withinMargin && cur.rating > best.rating ? cur : best
  }, inRange[0])

  return { rider: winner, fallback: false, allCandidates: withDistance }
}
