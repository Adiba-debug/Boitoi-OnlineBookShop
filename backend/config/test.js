const pool = require("./db");

pool.connect()
    .then(() => {
        console.log("PostgreSQL Connected Successfully!");
    })
    .catch((err) => {
        console.log("Connection Failed:", err.message);
    });
    