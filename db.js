const { Pool } = require('pg');
require('dotenv').config();

// Determine SSL requirement safely:
// - Explicitly disabled if DATABASE_SSL === 'false'
// - Enabled if DATABASE_SSL === 'true', NODE_ENV === 'production',
//   or connection string specifies sslmode=require
const isSslDisabled = process.env.DATABASE_SSL === 'false';
const isSslRequired = process.env.DATABASE_SSL === 'true' ||
  (process.env.DATABASE_URL && process.env.DATABASE_URL.includes('sslmode=require')) ||
  (process.env.NODE_ENV === 'production' && !isSslDisabled);

const sslConfig = isSslDisabled ? false : (isSslRequired ? { rejectUnauthorized: false } : false);

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 10000,
  keepAlive: true,
  ssl: sslConfig
});

// Prevent idle client errors from crashing the Node.js process
pool.on('error', (err) => {
  console.error('Unexpected error on idle PostgreSQL client:', err.message);
});

module.exports = {
  query: (text, params) => pool.query(text, params),
  pool
};
