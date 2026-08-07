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

// Login API
router.post("/login", async (req, res) => {
    try {
        const { email, password } = req.body;

        const result = await pool.query(
            "SELECT * FROM users WHERE email = $1",
            [email]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({
                message: "User not found"
            });
        }

        const user = result.rows[0];

        if (user.password !== password) {
            return res.status(401).json({
                message: "Incorrect password"
            });
        }

        res.json({
            message: "Login successful",
            user: user
        });

    } catch (error) {
        console.log(error);
        res.status(500).json({
            message: "Login failed"
        });
    }
});


// Get all Authors
router.get('/authors', async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM authors');
        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Get all Publishers
router.get('/publishers', async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM publishers');
        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Get all Categories (Genres)
router.get('/categories', async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM categories');
        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});
module.exports = router;
