import mysql from 'mysql2/promise';
import 'dotenv/config';
import dotenv from "dotenv";
dotenv.config();
const pool = mysql.createPool({
  host: process.env.MYSQL_HOST ?? '127.0.0.1',
  port: Number(process.env.MYSQL_PORT ?? 3306),
  user: process.env.MYSQL_USER ?? 'root',
  password: process.env.MYSQL_PASSWORD ?? '',
  database: process.env.MYSQL_DATABASE ?? 'taskorbit',
  waitForConnections: true,
  connectionLimit: 10,
});

export async function pingDb() {
  const conn = await pool.getConnection();
  try {
    await conn.query('SELECT 1');
    return true;
  } finally {
    conn.release();
  }
}

export { pool };

