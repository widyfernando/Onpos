const { Pool } = require('pg');

const useSsl = process.env.DATABASE_SSL === 'true';

const connection = process.env.DATABASE_URL
  ? { connectionString: process.env.DATABASE_URL }
  : {
      host: process.env.DB_HOST || 'localhost',
      port: Number(process.env.DB_PORT || 5433),
      database: process.env.DB_NAME || 'onpos',
      user: process.env.DB_USER || 'postgres',
      password: process.env.DB_PASSWORD || 'password',
    };

const pool = new Pool({
  ...connection,
  ssl: useSsl ? { rejectUnauthorized: true } : undefined,
  max: Number(process.env.DATABASE_POOL_MAX || 10),
  idleTimeoutMillis: Number(process.env.DATABASE_IDLE_TIMEOUT_MS || 30000),
  connectionTimeoutMillis: Number(process.env.DATABASE_CONNECTION_TIMEOUT_MS || 10000),
});

async function query(text, params) {
  return pool.query(text, params);
}

async function withTransaction(callback) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const result = await callback(client);
    await client.query('COMMIT');
    return result;
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

async function ensureSchema() {
  await query("ALTER TABLE inventory_items ADD COLUMN IF NOT EXISTS minimum_stock NUMERIC(14, 2) NOT NULL DEFAULT 5");
  await query("ALTER TABLE sales_orders ADD COLUMN IF NOT EXISTS bayar NUMERIC(14, 2)");
  await query("ALTER TABLE sales_orders ADD COLUMN IF NOT EXISTS kembalian NUMERIC(14, 2)");
  await query("UPDATE sales_orders SET bayar = total WHERE bayar IS NULL");
  await query("UPDATE sales_orders SET kembalian = 0 WHERE kembalian IS NULL");
  await query("ALTER TABLE sales_orders ALTER COLUMN bayar SET NOT NULL");
  await query("ALTER TABLE sales_orders ALTER COLUMN kembalian SET NOT NULL");
  await query("ALTER TABLE sales_orders ADD COLUMN IF NOT EXISTS status VARCHAR(20) NOT NULL DEFAULT 'SELESAI'");
  await query("ALTER TABLE sales_orders ADD COLUMN IF NOT EXISTS cancelled_at TIMESTAMPTZ");
  await query("ALTER TABLE sales_orders ADD COLUMN IF NOT EXISTS cancelled_by VARCHAR(100)");
  await query("ALTER TABLE sales_orders ADD COLUMN IF NOT EXISTS cancel_reason TEXT");
  const menus = [
    ['M00001', 'Administration', '', 'M00001'],
    ['M00002', 'Dashboard', 'dashboard', 'M00002'],
    ['M00028', 'Inventory', 'inventory', 'M00028'],
    ['M00010', 'Master Barang', 'master-barang', 'M00028'],
    ['M00027', 'Master Kategori Barang', 'master-kategori-barang', 'M00028'],
    ['M00016', 'Master Satuan Barang', 'master-satuan-barang', 'M00028'],
    ['M00029', 'Stock Opname', 'stock-opname', 'M00028'],
    ['M00030', 'Transaksi Penjualan', 'transaksi-penjualan', 'M00030'],
    ['M00031', 'Report', 'reports', 'M00031'],
    ['M00032', 'Settings', 'settings', 'M00032'],
    ['M00003', 'Otoritas Menu Pengguna', 'otoritas', 'M00032'],
    ['M00005', 'Master Group User', 'master-group', 'M00032'],
    ['M00004', 'Pengaturan Pengguna', 'pengaturan-pengguna', 'M00032'],
    ['M00033', 'Master Users', 'master-users', 'M00001'],
  ];
  const activeMenuIds = menus.map(([menuId]) => menuId);

  for (const [menuId, nama, path, parentId] of menus) {
    await query(
      `INSERT INTO menu (menu_id, nama, path, parent_id, is_aktif)
       VALUES ($1, $2, $3, $4, true)
       ON CONFLICT (menu_id) DO UPDATE SET nama = EXCLUDED.nama, path = EXCLUDED.path, parent_id = EXCLUDED.parent_id, is_aktif = true`,
      [menuId, nama, path, parentId]
    );
  }

  // Admin default diberi akses ke seluruh menu aktif supaya akun bootstrap tetap lengkap.
  for (const [menuId] of menus) {
    await query(
      `INSERT INTO hak_akses (grup_id, menu_item_id, granted)
       VALUES ('G00006', $1, true)
       ON CONFLICT (grup_id, menu_item_id)
       DO UPDATE SET granted = true`,
      [menuId]
    );
  }

  await query(
    `UPDATE menu
        SET is_aktif = false, updated_at = NOW()
      WHERE menu_id <> ALL($1::varchar[])`,
    [activeMenuIds]
  );
}

module.exports = { pool, query, withTransaction, ensureSchema };
