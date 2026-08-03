const { Pool } = require("pg");

const pool = new Pool({
    user: "postgres",
    host: "localhost",
    database: "Boitoi",
    password: "PostGress@2026",
    port: 5432,
});

module.exports = pool;