const knex = require('knex');

let connection;

if (process.env.DATABASE_URL) {
    connection = {
        connectionString: process.env.DATABASE_URL,
        ssl: {
            rejectUnauthorized: false
        }
    };
} else {
    // Use the AWS RDS connection details here
    connection = {
        host: 'user-prod-us-east-2-1.cluster-cfi5vnucvv3w.us-east-2.rds.amazonaws.com',
        user: 'chrismphy-main-db-07b32ef7ec26607cb',
        password: 'WvpBU7g2RSX58xvRf628YteuBW5rnE', // Replace with your actual AWS RDS password
        database: 'chrismphy-main-db-07b32ef7ec26607cb',
        port: 5432
    };
}

const db = knex({
    client: 'pg',
    connection: connection,
    searchPath: ['knex', 'public']
});

module.exports = db;
