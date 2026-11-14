
/**
 * @file    db.js
 * @module  Config
 * @desc    Connects the backend to PostgreSQL using a reusable connection pool.
 * @author  Wasana Karunanayaka (S/21/081)
 */

const { Pool } = require('pg');
require('dotenv').config();

const isProduction = process.env.NODE_ENV === 'production';

// FEATURE: Secure database connection in production.
// LOGIC: Ignore SSL settings inside the URL and require a verified connection.
// A trusted certificate can be supplied through DB_SSL_CA.
let connectionString = process.env.DATABASE_URL;
if (connectionString && isProduction) {
  const { URL } = require('node:url');
  const parsed = new URL(connectionString);
  for (const key of ['ssl', 'sslmode', 'sslcert', 'sslkey', 'sslrootcert']) parsed.searchParams.delete(key);
  connectionString = parsed.toString();
}
const ssl = isProduction
  ? { rejectUnauthorized: true, ...(process.env.DB_SSL_CA ? { ca: process.env.DB_SSL_CA.replace(/\\n/g, '\n') } : {}) }
  : false;

// FEATURE: Reuse database connections.
// LOGIC: Use DATABASE_URL when present; otherwise use the separate DB settings.
const pool = new Pool(connectionString
  ? { connectionString, ssl }
  : { host: process.env.DB_HOST, port: process.env.DB_PORT, database: process.env.DB_NAME,
      user: process.env.DB_USER, password: process.env.DB_PASSWORD, ssl });

// Check connectivity when the backend starts, then return the connection to the pool.
pool.connect()
  .then(client => { client.release(); console.log('PostgreSQL connected successfully'); })
  .catch(() => console.error('Database connection failed. Check server configuration.'));

module.exports = { pool };
