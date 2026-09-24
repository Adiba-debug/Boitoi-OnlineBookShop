const express = require("express");
const router = express.Router();

const pool = require("../config/db");
const authMiddleware = require("../middleware/authMiddleware");


// =========================
// GET reviews for a book
// Public
// GET /api/reviews/book/:bookId
// =========================

router.get("/book/:bookId", async (req, res) => {
    try {
        const { bookId } = req.params;

        const result = await pool.query(
            `SELECT
                r.review_id,
                r.rating,
                r.review_comment,
                r.review_date,
                u.name AS customer_name
             FROM reviews r
             JOIN users u ON r.user_id = u.user_id
             WHERE r.book_id = $1
             ORDER BY r.review_date DESC`,
            [bookId]
        );

        res.status(200).json(result.rows);

    } catch (err) {
        console.log(err);
        res.status(500).json({ message: "Failed to load reviews" });
    }
});


// =========================
// GET summary (avg rating + count) for a book
// Public
// GET /api/reviews/book/:bookId/summary
// =========================

router.get("/book/:bookId/summary", async (req, res) => {
    try {
        const { bookId } = req.params;

        const result = await pool.query(
            `SELECT
                COUNT(*)::int AS review_count,
                ROUND(AVG(rating)::numeric, 1) AS average_rating
             FROM reviews
             WHERE book_id = $1`,
            [bookId]
        );

        res.status(200).json(result.rows[0]);

    } catch (err) {
        console.log(err);
        res.status(500).json({ message: "Failed to load summary" });
    }
});


// =========================
// GET eligibility for logged-in user to review a book
// Protected
// GET /api/reviews/eligibility/:bookId
// =========================

router.get("/eligibility/:bookId", authMiddleware, async (req, res) => {
    try {
        const { bookId } = req.params;
        const userId = req.user.user_id;

        // Check: user has a delivered order containing this book
        const purchaseCheck = await pool.query(
            `SELECT o.order_id
             FROM orders o
             JOIN order_items oi ON o.order_id = oi.order_id
             WHERE o.user_id = $1
               AND oi.book_id = $2
               AND o.status = 'delivered'
             LIMIT 1`,
            [userId, bookId]
        );

        if (purchaseCheck.rows.length === 0) {
            return res.status(200).json({ eligible: false, hasReviewed: false });
        }

        // Check: has user already reviewed this book?
        const reviewCheck = await pool.query(
            `SELECT review_id FROM reviews
             WHERE user_id = $1 AND book_id = $2
             LIMIT 1`,
            [userId, bookId]
        );

        res.status(200).json({
            eligible: true,
            hasReviewed: reviewCheck.rows.length > 0,
            review_id: reviewCheck.rows[0]?.review_id || null
        });

    } catch (err) {
        console.log(err);
        res.status(500).json({ message: "Failed to check eligibility" });
    }
});


// =========================
// POST a new review
// Protected (customer only)
// POST /api/reviews
// =========================

router.post("/", authMiddleware, async (req, res) => {

    const client = await pool.connect();

    try {
        const userId = req.user.user_id;
        const { book_id, rating, review_comment } = req.body;

        if (!book_id) {
            return res.status(400).json({ message: "book_id is required" });
        }

        const ratingNum = parseInt(rating, 10);
        if (!rating || isNaN(ratingNum) || ratingNum < 1 || ratingNum > 5) {
            return res.status(400).json({ message: "Rating must be an integer between 1 and 5" });
        }

        if (!review_comment || review_comment.trim().length === 0) {
            return res.status(400).json({ message: "Review comment is required" });
        }

        if (review_comment.trim().length > 2000) {
            return res.status(400).json({ message: "Review comment must not exceed 2000 characters" });
        }

        await client.query("BEGIN");

        // Book existence check
        const bookCheck = await client.query(
            "SELECT book_id FROM books WHERE book_id = $1",
            [book_id]
        );
        if (bookCheck.rows.length === 0) {
            await client.query("ROLLBACK");
            return res.status(404).json({ message: "Book not found" });
        }

        // Delivered purchase check
        const purchaseCheck = await client.query(
            `SELECT o.order_id
             FROM orders o
             JOIN order_items oi ON o.order_id = oi.order_id
             WHERE o.user_id = $1
               AND oi.book_id = $2
               AND o.status = 'delivered'
             LIMIT 1`,
            [userId, book_id]
        );

        if (purchaseCheck.rows.length === 0) {
            await client.query("ROLLBACK");
            return res.status(403).json({
                message: "You can only review a book after your order has been delivered"
            });
        }

        // Duplicate check — lock to prevent race condition
        const dupCheck = await client.query(
            "SELECT review_id FROM reviews WHERE user_id = $1 AND book_id = $2 FOR UPDATE",
            [userId, book_id]
        );

        if (dupCheck.rows.length > 0) {
            await client.query("ROLLBACK");
            return res.status(409).json({ message: "You have already reviewed this book" });
        }

        // Insert review
        const result = await client.query(
            `INSERT INTO reviews (user_id, book_id, rating, review_comment)
             VALUES ($1, $2, $3, $4)
             RETURNING review_id, rating, review_comment, review_date`,
            [userId, book_id, ratingNum, review_comment.trim()]
        );

        await client.query("COMMIT");

        res.status(201).json({
            message: "Review submitted successfully",
            review: result.rows[0]
        });

    } catch (err) {

        await client.query("ROLLBACK");
        console.log(err);
        res.status(500).json({ message: "Failed to submit review" });

    } finally {

        client.release();

    }

});


// =========================
// PUT edit own review
// Protected
// PUT /api/reviews/:reviewId
// =========================

router.put("/:reviewId", authMiddleware, async (req, res) => {

    const client = await pool.connect();

    try {
        const userId = req.user.user_id;
        const { reviewId } = req.params;
        const { rating, review_comment } = req.body;

        const ratingNum = parseInt(rating, 10);
        if (!rating || isNaN(ratingNum) || ratingNum < 1 || ratingNum > 5) {
            return res.status(400).json({ message: "Rating must be an integer between 1 and 5" });
        }

        if (!review_comment || review_comment.trim().length === 0) {
            return res.status(400).json({ message: "Review comment is required" });
        }

        await client.query("BEGIN");

        // Lock the review row — ownership check + update must be atomic
        const ownerCheck = await client.query(
            "SELECT review_id FROM reviews WHERE review_id = $1 AND user_id = $2 FOR UPDATE",
            [reviewId, userId]
        );

        if (ownerCheck.rows.length === 0) {
            await client.query("ROLLBACK");
            return res.status(403).json({ message: "Review not found or not yours" });
        }

        const result = await client.query(
            `UPDATE reviews
             SET rating = $1, review_comment = $2, review_date = CURRENT_TIMESTAMP
             WHERE review_id = $3
             RETURNING review_id, rating, review_comment, review_date`,
            [ratingNum, review_comment.trim(), reviewId]
        );

        await client.query("COMMIT");

        res.status(200).json({
            message: "Review updated successfully",
            review: result.rows[0]
        });

    } catch (err) {

        await client.query("ROLLBACK");
        console.log(err);
        res.status(500).json({ message: "Failed to update review" });

    } finally {

        client.release();

    }

});


module.exports = router;
