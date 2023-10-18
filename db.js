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
    connection = {
        host: 'localhost',
        user: 'chrismphy',
        password: 'Rubedo1989',
        database: 'postgres',
        port: 5432
    };
}

const db = knex({
    client: 'pg',
    connection: connection,
    searchPath: ['knex', 'public']
});

module.exports = db;
