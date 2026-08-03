const express = require("express");
const cors = require("cors");
const pool = require("./config/db");
const authRoutes = require("./routes/auth");


const app = express();

const PORT = 5000;

app.use(cors());

app.use(express.json());

app.use("/api/auth", authRoutes);

app.get("/", (req, res) => {
    res.send("Boitoi BookShop Backend Running!");
});

// Database test route
app.get("/test-db", async (req, res) => {
    try {
        const result = await pool.query("SELECT NOW()");
        res.json(result.rows);
    } catch (error) {
        console.log(error);
        res.status(500).send("Database connection failed");
    }
});

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});