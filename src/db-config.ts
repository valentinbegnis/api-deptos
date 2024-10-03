import pg from 'pg'
const { Client } = pg

export const db = new Client({ 
  user: process.env.DB_USER!,
  host: process.env.DB_HOSTNAME!,
  database: process.env.DB_NAME!,
  password: process.env.DB_PASSWORD!, 
  port: Number(process.env.DB_PORT!),
  ssl: { rejectUnauthorized: false }
});