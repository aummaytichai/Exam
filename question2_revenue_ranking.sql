-- ข้อ 2: ร้านอาหารที่มี AOV สูงสุด 3 อันดับแรกในแต่ละ Category
-- เดือนปัจจุบัน, เฉพาะ status = 'delivered', ใช้ Window Function

WITH monthly_orders AS (
  -- รวม revenue และนับออเดอร์ต่อร้าน เฉพาะ delivered + เดือนปัจจุบัน
  SELECT
    o.restaurant_id,
    SUM(o.total_amount)                          AS total_revenue,
    COUNT(o.id)                                  AS order_count,
    SUM(o.total_amount) / COUNT(o.id)::NUMERIC   AS aov
  FROM orders o
  WHERE o.status = 'delivered'
    AND DATE_TRUNC('month', o.created_at) = DATE_TRUNC('month', CURRENT_DATE)
  GROUP BY o.restaurant_id
),

restaurant_aov AS (
  -- LEFT JOIN เพื่อรวมร้านที่ไม่มีออเดอร์ไว้ใน dataset ก่อน
  SELECT
    r.id               AS restaurant_id,
    r.name             AS restaurant_name,
    r.category,
    COALESCE(mo.aov, 0)          AS aov,
    COALESCE(mo.order_count, 0)  AS order_count
  FROM restaurants r
  LEFT JOIN monthly_orders mo ON mo.restaurant_id = r.id
),

ranked AS (
  SELECT
    restaurant_id,
    restaurant_name,
    category,
    aov,
    order_count,
    RANK() OVER (
      PARTITION BY category
      ORDER BY aov DESC
    ) AS rank_in_category
  FROM restaurant_aov
  WHERE order_count > 0  -- ตัดร้านที่ไม่มีออเดอร์ออกจาก Ranking
)

SELECT
  category,
  rank_in_category        AS rank,
  restaurant_name,
  ROUND(aov, 2)           AS avg_order_value,
  order_count
FROM ranked
WHERE rank_in_category <= 3
ORDER BY category, rank_in_category;
