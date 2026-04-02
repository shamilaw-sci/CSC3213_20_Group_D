const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || 'care4u_db',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD,
});

pool.connect()
  .then(() => console.log('PostgreSQL connected successfully'))
  .catch((err) => console.error('Database connection error:', err.message));

module.exports = { pool };
