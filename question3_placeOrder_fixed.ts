/**
 * ปัญหาในโค้ดเดิม:
 *  1. SQL Injection  — ใช้ template literal ${item.id} ตรงๆ ใน query
 *  2. N+1 Query      — SELECT + UPDATE ทีละ row ใน loop
 *  3. Race Condition — gap ระหว่าง SELECT และ UPDATE ทำให้ stock ติดลบ
 *  4. ไม่มี Transaction — ถ้า Order.create fail หลัง UPDATE stock ไปแล้ว → ข้อมูลเสีย
 */

// ── Types ─────────────────────────────────────────────────────────────────────

interface OrderItem {
  id: number;
  qty: number;
}

interface ProductRow {
  id: number;
  stock: number;
}

interface QueryResult<T> {
  rows: T[];
  rowCount: number;
}

interface Transaction {
  query<T = unknown>(sql: string, params?: unknown[]): Promise<QueryResult<T>>;
  commit(): Promise<void>;
  rollback(): Promise<void>;
}

// ── Error Class ───────────────────────────────────────────────────────────────

class InsufficientStockError extends Error {
  public readonly items: OrderItem[];

  constructor(items: OrderItem[]) {
    super('Insufficient stock');
    this.name = 'InsufficientStockError';
    this.items = items;
  }
}

// ── Declarations (injected externals) ────────────────────────────────────────

declare const db: { transaction(): Promise<Transaction> };
declare const Order: {
  create(data: { id: string; status: string }, opts: { transaction: Transaction }): Promise<void>;
};

// ── Main Function ─────────────────────────────────────────────────────────────

async function placeOrder(orderId: string, items: OrderItem[]): Promise<void> {
  const trx = await db.transaction();

  try {
    // ── Batch SELECT FOR UPDATE (Pessimistic Lock) ──────────────────────
    // ล็อคทุก row ที่เกี่ยวข้องในคราวเดียว → ไม่มี N+1
    const itemIds = items.map((i) => i.id);

    const products = await trx.query<ProductRow>(
      `SELECT id, stock
       FROM menu
       WHERE id = ANY($1::int[])
       FOR UPDATE`,          // ← ล็อคป้องกัน Race Condition
      [itemIds]
    );

    // สร้าง Map id → stock เพื่อ lookup O(1)
    const stockMap = new Map<number, number>(
      products.rows.map((p) => [p.id, p.stock])
    );

    // ── Validate Stock ──────────────────────────────────────────────────
    const insufficientItems = items.filter((item) => {
      const available = stockMap.get(item.id) ?? 0;
      return available < item.qty;
    });

    if (insufficientItems.length > 0) {
      await trx.rollback();
      throw new InsufficientStockError(insufficientItems);
    }

    // ── Atomic Batch UPDATE ─────────────────────────────────────────────
    // UPDATE ทุก row ในคำสั่งเดียว + WHERE stock >= qty เป็น guard ชั้นสุดท้าย
    const valueList = items
      .map((_, i) => `($${i * 2 + 1}::int, $${i * 2 + 2}::int)`)
      .join(', ');

    const flatValues = items.flatMap((item) => [item.id, item.qty]);

    const updateResult = await trx.query(
      `UPDATE menu AS m
       SET stock = m.stock - v.qty
       FROM (VALUES ${valueList}) AS v(id, qty)
       WHERE m.id = v.id
         AND m.stock >= v.qty`,   // ← Atomic guard: ป้องกันติดลบแม้ race
      flatValues
    );

    if (updateResult.rowCount !== items.length) {
      await trx.rollback();
      throw new Error('Stock update failed for one or more items (concurrent modification)');
    }

    // ── Create Order ────────────────────────────────────────────────────
    await Order.create({ id: orderId, status: 'confirmed' }, { transaction: trx });

    await trx.commit();
  } catch (err) {
    await trx.rollback();
    throw err;
  }
}

export { placeOrder, InsufficientStockError };
export type { OrderItem, ProductRow };
