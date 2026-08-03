const express = require("express");
const router = express.Router();

const pool = require("../config/db");

// Register API
router.post("/register", async (req, res) => {
    try {
        const { name, email, password } = req.body;

        const result = await pool.query(
            "INSERT INTO users (name, email, password) VALUES ($1, $2, $3) RETURNING *",
            [name, email, password]
        );

        res.status(201).json({
            message: "User registered successfully",
            user: result.rows[0]
        });

    } catch (error) {
        console.log(error);
        res.status(500).json({
            message: "Registration failed"
        });
    }
});

module.exports = router;
