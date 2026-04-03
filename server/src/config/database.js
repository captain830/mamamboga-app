const { Pool } = require('pg');
const dotenv = require('dotenv');

dotenv.config();

const pool = new Pool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  max: 10,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 10000,
  ssl: { rejectUnauthorized: false },
  // Add these for better connection handling
  keepAlive: true,
  keepAliveInitialDelayMillis: 10000
});

// Handle pool errors gracefully
pool.on('error', (err) => {
  console.error('Unexpected database error:', err.message);
  // Don't exit the process, just log the error
});

// Test connection with retry
const testConnection = async (retries = 3) => {
  for (let i = 0; i < retries; i++) {
    try {
      const client = await pool.connect();
      console.log('✅ PostgreSQL database connected successfully');
      client.release();
      return true;
    } catch (err) {
      console.error(`❌ PostgreSQL connection attempt ${i + 1} failed:`, err.message);
      if (i === retries - 1) {
        console.error('All connection attempts failed. Continuing without DB...');
        return false;
      }
      // Wait 2 seconds before retrying
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
  }
};

module.exports = {
  pool,
  testConnection,
  query: async (text, params) => {
    try {
      return await pool.query(text, params);
    } catch (err) {
      console.error('Query error:', err.message);
      throw err;
    }
  },
};