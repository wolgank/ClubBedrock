import mysql from 'mysql2/promise';
import { drizzle } from 'drizzle-orm/mysql2';
const {
  DB_USER,
  DB_PASSWORD,
  DB_HOST,
  DB_PORT,
  DB_NAME,
} = process.env;

if (!DB_USER || !DB_PASSWORD || !DB_HOST || !DB_PORT || !DB_NAME) {
  throw new Error("❌ Faltan variables de entorno para construir DATABASE_URL");
}

const DATABASE_URL = `mysql://${DB_USER}:${DB_PASSWORD}@${DB_HOST}:${DB_PORT}/${DB_NAME}`;

export const db = drizzle(DATABASE_URL);
