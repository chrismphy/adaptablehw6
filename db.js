const knex = require('knex');

const db = knex({
  client: 'pg',
  connection: process.env.DATABASE_URL,
  searchPath: ['knex', 'public'],
});

module.exports = db;
