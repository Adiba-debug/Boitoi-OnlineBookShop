const express = require('express');
const router = express.Router();
const pool = require('../config/db');

router.get('/categories', async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM categories');
        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

router.get('/authors', async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM authors');
        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

router.get('/publishers', async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM publishers');
        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;