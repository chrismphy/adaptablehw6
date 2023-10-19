const { Pool } = require('pg');

// Check if the DATABASE_URL environment variable is set.
if (!process.env.DATABASE_URL) {
    throw new Error('DATABASE_URL environment variable is not set.');
}

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  }
});

module.exports = {
    // This will allow you to use the pool elsewhere to run queries
    query: (text, params, callback) => {
        return pool.query(text, params, callback);
    },
    
    // If you ever need direct access to the pool
    pool: pool
};
