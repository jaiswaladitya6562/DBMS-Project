import mysql from "mysql2/promise";

// Reuse one pool across hot reloads in dev
const globalForDb = globalThis;

const pool =
  globalForDb.mysqlPool ??
  mysql.createPool({
    host: process.env.MYSQL_HOST,
    user: process.env.MYSQL_USER,
    password: process.env.MYSQL_PASSWORD,
    database: process.env.MYSQL_DATABASE,
    waitForConnections: true,
    connectionLimit: 10,
    dateStrings: true,
  });

if (process.env.NODE_ENV !== "production") globalForDb.mysqlPool = pool;

// Parameterized query: query("SELECT * FROM Vehicle WHERE Vehicle_ID = ?", [id])
export async function query(sql, params = []) {
  const [rows] = await pool.execute(sql, params);
  return rows;
}

// Transaction helper: await withTransaction(async (conn) => { ... })
export async function withTransaction(fn) {
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    const result = await fn(conn);
    await conn.commit();
    return result;
  } catch (err) {
    await conn.rollback();
    throw err;
  } finally {
    conn.release();
  }
}

export default pool;
