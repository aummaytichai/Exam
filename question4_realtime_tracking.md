# ข้อ 4: Real-time Live Tracking Architecture

## Protocol Selection

| ทิศทาง | Protocol | เหตุผล |
|---|---|---|
| Rider App → Server | MQTT (QoS 1) | Binary, lightweight, ประหยัด battery มือถือ, รองรับ unreliable network |
| Server → Customer App | WebSocket | Browser-native, full-duplex, reconnect ง่าย |
| Server ↔ Server | Redis Pub/Sub | Fan-out ภายใน cluster ได้เร็ว |

## Storage Strategy

```
┌─────────────┐   GPS every 2s   ┌──────────────────┐
│  Rider App  │ ──── MQTT ──────▶ │  Location Service │
└─────────────┘                   └────────┬─────────┘
                                           │
                    ┌──────────────────────┼─────────────────────┐
                    ▼                      ▼                     ▼
             ┌────────────┐      ┌──────────────────┐   ┌──────────────┐
             │   Redis    │      │  Redis Pub/Sub   │   │ TimescaleDB  │
             │ (Hash Map) │      │  (fan-out to WS) │   │ (batch write │
             │ rider:pos  │      └──────────────────┘   │  every 10s)  │
             └────────────┘                             └──────────────┘
                    │                                          ▲
                    └──────────── Async Worker ───────────────┘
```

### เหตุผลแต่ละ Layer

1. **Redis (In-memory Hash)** — เก็บ `rider:{id}:pos = {lat, lon, ts}` เฉพาะตำแหน่งล่าสุด
   - Read จาก Customer ดึงจาก Redis ทันที (< 1ms) ไม่แตะ Disk เลย

2. **Redis Pub/Sub** — เมื่อรับ GPS ใหม่ → `PUBLISH channel:rider:{id}`
   → WebSocket Gateway push ไปหา Customer ทันที

3. **TimescaleDB** — Async worker batch เขียนทุก 10 วิ (5 data points รวมกัน)
   - ลด write IOPS 80%, เหมาะกับ historical analytics + route replay

## Load Estimation

- 2,000 riders × 0.5 update/s = **1,000 writes/s** → Redis รับไหวสบาย (100k ops/s)
- 10,000 customers fan-out → ใช้ Redis Cluster แบ่ง Pub/Sub channel ตาม order_id
