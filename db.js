const knex = require('knex');

let connection;

// Check if the DATABASE_URL environment variable is set (indicative of Heroku environment)
if (process.env.DATABASE_URL) {
    connection = process.env.DATABASE_URL + '?ssl=true&sslmode=require';
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
