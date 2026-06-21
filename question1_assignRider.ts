const EARTH_RADIUS_KM = 6371;
const STALE_THRESHOLD_MS = 2 * 60 * 1000;  // 2 minutes
const MAX_RADIUS_KM = 5;
const TIE_BREAK_MARGIN_KM = 0.5;           // 500 metres

// ── Types ────────────────────────────────────────────────────────────────────

interface Location {
  lat: number;
  lon: number;
}

interface Rider {
  id: string;
  lat: number;
  lon: number;
  rating: number;
  lastUpdatedAt: string | Date;
}

interface RiderWithDistance extends Rider {
  distanceKm: number;
}

interface Order {
  restaurant: Location;
}

type AssignResult =
  | { rider: RiderWithDistance; fallback: false }
  | { rider: RiderWithDistance; fallback: true; expandedRadius: number }
  | { rider: null; fallback: true; action: 'QUEUE_AND_NOTIFY' };

// ── Haversine ────────────────────────────────────────────────────────────────

function haversine(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const toRad = (deg: number): number => (deg * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);

  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;

  return EARTH_RADIUS_KM * 2 * Math.asin(Math.sqrt(a));
}

// ── Main Function ─────────────────────────────────────────────────────────────

function assignRider(order: Order, riders: Rider[]): AssignResult {
  const now = Date.now();
  const { lat: rLat, lon: rLon } = order.restaurant;

  // 1. กรอง Stale riders (ไม่อัปเดตเกิน 2 นาที)
  const freshRiders = riders.filter((r) => {
    const age = now - new Date(r.lastUpdatedAt).getTime();
    return age <= STALE_THRESHOLD_MS;
  });

  // 2. คำนวณระยะทางแต่ละคน
  const withDistance: RiderWithDistance[] = freshRiders.map((r) => ({
    ...r,
    distanceKm: haversine(r.lat, r.lon, rLat, rLon),
  }));

  // 3. กรองเฉพาะคนที่อยู่ใน 5 กม.
  const candidates = withDistance.filter((r) => r.distanceKm <= MAX_RADIUS_KM);

  // 4. Edge-case: ไม่มี Rider ใน 5 กม. → Fallback
  if (candidates.length === 0) {
    return handleNoRiderFallback(withDistance);
  }

  // 5. เรียงระยะทางจากน้อยไปมาก
  candidates.sort((a, b) => a.distanceKm - b.distanceKm);

  const nearest = candidates[0];

  // 6. Tie-breaker: ถ้าคนถัดไปอยู่ห่างไม่เกิน 500 ม. และ Rating สูงกว่า → เลือกเขา
  const winner = candidates.reduce<RiderWithDistance>((best, cur) => {
    const withinMargin = cur.distanceKm - best.distanceKm <= TIE_BREAK_MARGIN_KM;
    if (withinMargin && cur.rating > best.rating) return cur;
    return best;
  }, nearest);

  return { rider: winner, fallback: false };
}

// ── Fallback Logic ────────────────────────────────────────────────────────────

function handleNoRiderFallback(allFreshRiders: RiderWithDistance[]): AssignResult {
  const EXPANDED_RADIUS_KM = 10;

  const expandedCandidates = allFreshRiders
    .filter((r) => r.distanceKm <= EXPANDED_RADIUS_KM)
    .sort((a, b) => a.distanceKm - b.distanceKm);

  if (expandedCandidates.length > 0) {
    return { rider: expandedCandidates[0], fallback: true, expandedRadius: EXPANDED_RADIUS_KM };
  }

  return { rider: null, fallback: true, action: 'QUEUE_AND_NOTIFY' };
}

export { assignRider, haversine, handleNoRiderFallback };
export type { Rider, RiderWithDistance, Order, AssignResult };
