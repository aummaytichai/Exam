-- ข้อ 5: Rush Hour Cancellation Crisis
-- Schema: Dynamic Incentive + Cancellation Log for Fraud Detection

-- ── Incentive Zone ──────────────────────────────────────────────────────────
CREATE TABLE zone_incentives (
  id                UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  zone_id           VARCHAR(50) NOT NULL,
  bonus_multiplier  NUMERIC(4,2) NOT NULL CHECK (bonus_multiplier BETWEEN 1.0 AND 3.0),
  trigger_reason    TEXT,
  started_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at        TIMESTAMPTZ NOT NULL,
  created_by        VARCHAR(50) DEFAULT 'system'  -- 'system' | 'ops_manual'
);

-- ── Cancellation Log (หัวใจของ Fraud Detection) ────────────────────────────
CREATE TABLE cancellation_logs (
  id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  rider_id        UUID        NOT NULL REFERENCES riders(id),
  order_id        UUID        NOT NULL REFERENCES orders(id),
  cancelled_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Context ณ เวลายกเลิก
  cancel_reason   VARCHAR(100),           -- 'rider_cancel' | 'timeout' | 'system'
  distance_to_restaurant_km  NUMERIC(6,2),
  had_active_incentive       BOOLEAN DEFAULT FALSE,
  incentive_multiplier       NUMERIC(4,2),

  -- Fraud Signals
  time_since_accepted_sec    INT,         -- รับงานแล้วยกเลิกเร็วมากผิดปกติ?
  consecutive_cancels_today  INT,         -- ยกเลิกซ้ำๆ วันนี้กี่ครั้ง?
  zone_id         VARCHAR(50),

  -- Computed fraud score (อัปเดตโดย Fraud Engine)
  fraud_score     NUMERIC(5,2) DEFAULT 0.0,
  flagged_for_review BOOLEAN   DEFAULT FALSE
);

-- Index สำหรับ Fraud Analysis
CREATE INDEX idx_cancel_rider_date  ON cancellation_logs (rider_id, cancelled_at);
CREATE INDEX idx_cancel_zone_hour   ON cancellation_logs (zone_id, DATE_TRUNC('hour', cancelled_at));
CREATE INDEX idx_cancel_fraud_flag  ON cancellation_logs (flagged_for_review) WHERE flagged_for_review = TRUE;

-- ── Fraud Detection Query ───────────────────────────────────────────────────
-- หา Rider ที่ยกเลิกงานเกิน 3 ครั้งในช่วงที่มี Incentive สูง (ทุจริตรับ bonus แล้วยกเลิก)
SELECT
  rider_id,
  COUNT(*)                          AS cancel_count,
  AVG(time_since_accepted_sec)      AS avg_accept_to_cancel_sec,
  AVG(incentive_multiplier)         AS avg_incentive_at_cancel,
  SUM(CASE WHEN had_active_incentive THEN 1 ELSE 0 END) AS cancels_during_incentive
FROM cancellation_logs
WHERE cancelled_at >= NOW() - INTERVAL '24 hours'
GROUP BY rider_id
HAVING COUNT(*) >= 3
   AND SUM(CASE WHEN had_active_incentive THEN 1 ELSE 0 END) >= 2
ORDER BY cancels_during_incentive DESC;
