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
        host: 'ec2-3-210-173-88.compute-1.amazonaws.com',
        user: 'odpqlzkorxdpwk',
        password: 'fe9325aca7fe0e1f31839d39ed995695e37bfadc99f1605a80563d2396553420',
        database: 'ddafaqvbr2tklh',
        port: 5432
    };
}

const db = knex({
    client: 'pg',
    connection: connection,
    searchPath: ['knex', 'public']
});

module.exports = db;
