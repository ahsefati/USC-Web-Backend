const pgp = require('pg-promise')();
// const db = pgp('postgres://postgres:159@localhost:5432/USC-GIS');
const db = pgp('postgres://postgres:159@localhost:5432/uscdb');

module.exports = { db, pgp };