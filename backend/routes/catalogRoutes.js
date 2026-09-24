const express = require('express');
const router = express.Router();

const pool = require('../config/db');
const authMiddleware = require('../middleware/authMiddleware');
const roleMiddleware = require('../middleware/roleMiddleware');


// =====================================================
// GET ALL CATEGORIES
// Public API
// =====================================================

router.get('/categories', async (req, res) => {

    try {

        const result = await pool.query(
            'SELECT * FROM categories'
        );

        res.status(200).json(result.rows);

    }
    catch (err) {

        console.log(err);

        res.status(500).json({
            message: 'Cannot fetch categories'
        });

    }

});
// =====================================================
// GET SINGLE CATEGORY
// Public API
// =====================================================

router.get('/categories/:id', async (req, res) => {

    try {

        const { id } = req.params;

        const result = await pool.query(
            `SELECT *
             FROM categories
             WHERE category_id = $1`,
            [id]
        );

        if (result.rows.length === 0) {

            return res.status(404).json({
                message: 'Category not found'
            });

        }

        res.status(200).json(result.rows[0]);

    }
    catch (err) {

        console.log(err);

        res.status(500).json({
            message: 'Cannot fetch category'
        });

    }

});


// =====================================================
// GET ALL AUTHORS
// Public API
// =====================================================

router.get('/authors', async (req, res) => {

    try {

        const result = await pool.query(
            `SELECT
                a.*,
                COUNT(ba.book_id) AS book_count
             FROM authors a
             LEFT JOIN book_authors ba
                ON a.author_id = ba.author_id
             GROUP BY a.author_id
             ORDER BY a.author_id`
        );

        res.status(200).json(result.rows);

    }
    catch (err) {

        console.log(err);

        res.status(500).json({
            message: 'Cannot fetch authors'
        });

    }

});


// =====================================================
// GET ALL PUBLISHERS
// Public API
// =====================================================

router.get('/publishers', async (req, res) => {

    try {

        const result = await pool.query(
            'SELECT * FROM publishers'
        );

        res.status(200).json(result.rows);

    }
    catch (err) {

        console.log(err);

        res.status(500).json({
            message: 'Cannot fetch publishers'
        });

    }

});

// =====================================================
// GET SINGLE PUBLISHER
// Public API
// =====================================================

router.get('/publishers/:id', async (req, res) => {

    try {

        const { id } = req.params;

        const result = await pool.query(
            `SELECT *
             FROM publishers
             WHERE publisher_id = $1`,
            [id]
        );

        if (result.rows.length === 0) {

            return res.status(404).json({
                message: 'Publisher not found'
            });

        }

        res.status(200).json(result.rows[0]);

    }
    catch (err) {

        console.log(err);

        res.status(500).json({
            message: 'Cannot fetch publisher'
        });

    }

});


// =====================================================
// ADD AUTHOR
// Admin Only
// =====================================================

router.post(
    '/authors',
    authMiddleware,
    roleMiddleware('admin'),
    async (req, res) => {

        const client = await pool.connect();

        try {

            const { author_name, bio, image_url } = req.body;

            if (!author_name || !author_name.trim()) {
                return res.status(400).json({ message: 'Author name is required' });
            }

            await client.query("BEGIN");

            const result = await client.query(
                `INSERT INTO authors (author_name, bio, image_url)
                 VALUES ($1, $2, $3)
                 RETURNING *`,
                [author_name.trim(), bio || null, image_url || null]
            );

            await client.query("COMMIT");

            res.status(201).json({
                message: 'Author added successfully',
                author: result.rows[0]
            });

        } catch (err) {

            await client.query("ROLLBACK");
            console.log(err);
            res.status(500).json({ message: 'Cannot add author' });

        } finally {

            client.release();

        }

    }
);


// =====================================================
// UPDATE AUTHOR
// Admin Only
// =====================================================

router.put(
    '/authors/:id',
    authMiddleware,
    roleMiddleware('admin'),
    async (req, res) => {

        const client = await pool.connect();

        try {

            const { id } = req.params;
            const { author_name, bio, image_url } = req.body;

            if (!author_name || !author_name.trim()) {
                return res.status(400).json({ message: 'Author name is required' });
            }

            await client.query("BEGIN");

            const authorCheck = await client.query(
                `SELECT author_id FROM authors WHERE author_id = $1`,
                [id]
            );

            if (authorCheck.rows.length === 0) {
                await client.query("ROLLBACK");
                return res.status(404).json({ message: 'Author not found' });
            }

            const result = await client.query(
                `UPDATE authors
                 SET author_name = $1, bio = $2, image_url = $3
                 WHERE author_id = $4
                 RETURNING *`,
                [author_name.trim(), bio || null, image_url || null, id]
            );

            await client.query("COMMIT");

            res.status(200).json({
                message: 'Author updated successfully',
                author: result.rows[0]
            });

        } catch (err) {

            await client.query("ROLLBACK");
            console.log(err);
            res.status(500).json({ message: 'Cannot update author' });

        } finally {

            client.release();

        }

    }
);


// =====================================================
// DELETE AUTHOR
// Admin Only
// =====================================================

router.delete(
    '/authors/:id',
    authMiddleware,
    roleMiddleware('admin'),
    async (req, res) => {

        const client = await pool.connect();

        try {

            const { id } = req.params;

            await client.query("BEGIN");

            const authorCheck = await client.query(
                `SELECT author_id FROM authors WHERE author_id = $1`,
                [id]
            );

            if (authorCheck.rows.length === 0) {
                await client.query("ROLLBACK");
                return res.status(404).json({ message: 'Author not found' });
            }

            await client.query(
                `DELETE FROM authors WHERE author_id = $1`,
                [id]
            );

            await client.query("COMMIT");

            res.status(204).send();

        } catch (err) {

            await client.query("ROLLBACK");
            console.log(err);
            res.status(500).json({ message: 'Cannot delete author' });

        } finally {

            client.release();

        }

    }
);

router.post(
    '/publishers',
    authMiddleware,
    roleMiddleware('admin'),
    async (req, res) => {

        const client = await pool.connect();

        try {
            const { publisher_name, description, logo_url } = req.body;

            if (!publisher_name || !publisher_name.trim()) {
                return res.status(400).json({ message: 'Publisher name is required' });
            }

            await client.query("BEGIN");

            const result = await client.query(
                `INSERT INTO publishers (publisher_name, description, logo_url)
                 VALUES ($1, $2, $3)
                 RETURNING *`,
                [publisher_name.trim(), description || null, logo_url || null]
            );

            await client.query("COMMIT");

            res.status(201).json({
                message: 'Publisher added successfully',
                publisher: result.rows[0]
            });

        } catch (err) {

            await client.query("ROLLBACK");
            console.log(err);
            res.status(500).json({ message: 'Cannot add publisher' });

        } finally {

            client.release();

        }
    }
);


// UPDATE PUBLISHER
router.put(
    '/publishers/:id',
    authMiddleware,
    roleMiddleware('admin'),
    async (req, res) => {

        const client = await pool.connect();

        try {
            const { id } = req.params;
            const { publisher_name, description, logo_url } = req.body;

            if (!publisher_name || !publisher_name.trim()) {
                return res.status(400).json({ message: 'Publisher name is required' });
            }

            await client.query("BEGIN");

            const publisherCheck = await client.query(
                `SELECT publisher_id FROM publishers WHERE publisher_id = $1`,
                [id]
            );

            if (publisherCheck.rows.length === 0) {
                await client.query("ROLLBACK");
                return res.status(404).json({ message: 'Publisher not found' });
            }

            const result = await client.query(
                `UPDATE publishers
                 SET publisher_name = $1, description = $2, logo_url = $3
                 WHERE publisher_id = $4
                 RETURNING *`,
                [publisher_name.trim(), description || null, logo_url || null, id]
            );

            await client.query("COMMIT");

            res.status(200).json({
                message: 'Publisher updated successfully',
                publisher: result.rows[0]
            });

        } catch (err) {

            await client.query("ROLLBACK");
            console.log(err);
            res.status(500).json({ message: 'Cannot update publisher' });

        } finally {

            client.release();

        }
    }
);


// DELETE PUBLISHER
router.delete(
    '/publishers/:id',
    authMiddleware,
    roleMiddleware('admin'),
    async (req, res) => {

        const client = await pool.connect();

        try {
            const { id } = req.params;

            await client.query("BEGIN");

            const publisherCheck = await client.query(
                `SELECT publisher_id FROM publishers WHERE publisher_id = $1`,
                [id]
            );

            if (publisherCheck.rows.length === 0) {
                await client.query("ROLLBACK");
                return res.status(404).json({ message: 'Publisher not found' });
            }

            await client.query(
                `DELETE FROM publishers WHERE publisher_id = $1`,
                [id]
            );

            await client.query("COMMIT");

            res.status(204).send();

        } catch (err) {

            await client.query("ROLLBACK");
            console.log(err);
            res.status(500).json({ message: 'Cannot delete publisher' });

        } finally {

            client.release();

        }
    }
);

router.post(
    '/categories',
    authMiddleware,
    roleMiddleware('admin'),
    async (req, res) => {

        const client = await pool.connect();

        try {
            const { category_name } = req.body;

            if (!category_name || !category_name.trim()) {
                return res.status(400).json({
                    message: 'Category name is required'
                });
            }

            await client.query("BEGIN");

            const result = await client.query(
                `INSERT INTO categories (category_name) VALUES ($1) RETURNING *`,
                [category_name.trim()]
            );

            await client.query("COMMIT");

            res.status(201).json({
                message: 'Category added successfully',
                category: result.rows[0]
            });

        } catch (err) {

            await client.query("ROLLBACK");
            console.log(err);

            if (err.code === '23505') {
                return res.status(409).json({ message: 'Category already exists' });
            }

            res.status(500).json({ message: 'Cannot add category' });

        } finally {

            client.release();

        }
    }
);


// UPDATE CATEGORY
router.put(
    '/categories/:id',
    authMiddleware,
    roleMiddleware('admin'),
    async (req, res) => {

        const client = await pool.connect();

        try {
            const { id } = req.params;
            const { category_name } = req.body;

            if (!category_name || !category_name.trim()) {
                return res.status(400).json({
                    message: 'Category name is required'
                });
            }

            await client.query("BEGIN");

            const categoryCheck = await client.query(
                `SELECT category_id FROM categories WHERE category_id = $1`,
                [id]
            );

            if (categoryCheck.rows.length === 0) {
                await client.query("ROLLBACK");
                return res.status(404).json({ message: 'Category not found' });
            }

            let result;
            try {
                result = await client.query(
                    `UPDATE categories SET category_name = $1 WHERE category_id = $2 RETURNING *`,
                    [category_name.trim(), id]
                );
            } catch (innerErr) {
                await client.query("ROLLBACK");
                if (innerErr.code === '23505') {
                    return res.status(409).json({ message: 'Category already exists' });
                }
                throw innerErr;
            }

            await client.query("COMMIT");

            res.status(200).json({
                message: 'Category updated successfully',
                category: result.rows[0]
            });

        } catch (err) {

            await client.query("ROLLBACK");
            console.log(err);
            res.status(500).json({ message: 'Cannot update category' });

        } finally {

            client.release();

        }
    }
);


// DELETE CATEGORY
router.delete(
    '/categories/:id',
    authMiddleware,
    roleMiddleware('admin'),
    async (req, res) => {

        const client = await pool.connect();

        try {
            const { id } = req.params;

            await client.query("BEGIN");

            const categoryCheck = await client.query(
                `SELECT category_id FROM categories WHERE category_id = $1`,
                [id]
            );

            if (categoryCheck.rows.length === 0) {
                await client.query("ROLLBACK");
                return res.status(404).json({ message: 'Category not found' });
            }

            await client.query(
                `DELETE FROM categories WHERE category_id = $1`,
                [id]
            );

            await client.query("COMMIT");

            res.status(204).send();

        } catch (err) {

            await client.query("ROLLBACK");
            console.log(err);

            if (err.code === '23503') {
                return res.status(409).json({
                    message: 'Cannot delete category because it is assigned to a book'
                });
            }

            res.status(500).json({ message: 'Cannot delete category' });

        } finally {

            client.release();

        }
    }
);

// =====================================================
// GET SINGLE AUTHOR
// Public API
// =====================================================

router.get('/authors/:id', async (req, res) => {

    try {

        const { id } = req.params;

        const result = await pool.query(
            `SELECT *
             FROM authors
             WHERE author_id = $1`,
            [id]
        );

        if (result.rows.length === 0) {

            return res.status(404).json({
                message: 'Author not found'
            });

        }

        res.status(200).json(result.rows[0]);

    }
    catch (err) {

        console.log(err);

        res.status(500).json({
            message: 'Cannot fetch author'
        });

    }

});

module.exports = router;