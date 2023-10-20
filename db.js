const { Pool } = require('pg');

// Database connection parameters
const connection = {
    host: 'user-prod-us-east-2-1.cluster-cfi5vnucvv3w.us-east-2.rds.amazonaws.com',
    user: 'chrismphy-main-db-07b32ef7ec26607cb',
    password: 'WvpBU7g2RSX58xvRf628YteuBW5rnE', // Replace with your actual AWS RDS password
    database: 'chrismphy-main-db-07b32ef7ec26607cb',
    port: 5432,
    ssl:{
        rejectUnauthorized: false
    }
};


// Create a new Pool instance
const pool = new Pool(connection);

// SQL command to create a table
const createTableQuery = `
CREATE TABLE students (
    record_id bigint PRIMARY KEY,
    first_name character varying,
    last_name character varying,
    gpa numeric,
    enrolled boolean,
    uploaded_at timestamp without time zone
);`;

// Connect to the database and execute the query
pool.query(createTableQuery)
  .then(() => {
    console.log('Table created successfully');
  })
  .catch((err) => {
    console.error('Error creating table:', err);
  });

// Note: You don't need to call pool.end() here; the pool can be reused for other database operations in your application.

// Export the pool for use in other parts of your application if needed
module.exports = pool;
