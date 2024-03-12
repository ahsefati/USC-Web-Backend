const pgp = require('pg-promise')();
const db = pgp('postgres://postgres:159@localhost:5432/USC-GIS');

module.exports = { db, pgp };