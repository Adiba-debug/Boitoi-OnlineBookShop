const express = require("express");
const router = express.Router();

const pool = require("../config/db");
const authMiddleware = require("../middleware/authMiddleware");
const roleMiddleware = require("../middleware/roleMiddleware");


// =========================
// Get All Books
// Public API
// =========================

router.get("/", async (req, res) => {

    try {

        const result = await pool.query(
            "SELECT * FROM books"
        );

        res.status(200).json(result.rows);

    }
    catch (error) {

        console.log(error);

        res.status(500).json({
            message: "Cannot fetch books"
        });

    }

});


// =========================
// Get Single Book
// Public API
// =========================

router.get("/:id", async (req, res) => {

    try {

        const { id } = req.params;

        const result = await pool.query(
            `
            SELECT
                b.book_id,
                b.title,
                b.price,
                b.stock,
                b.total_sold,
                b.description,
                b.image_url,

                STRING_AGG(DISTINCT a.author_name, ', ') AS authors,

                p.publisher_name AS publisher,

                STRING_AGG(DISTINCT c.category_name, ', ') AS categories

            FROM books b

            LEFT JOIN book_authors ba
                ON b.book_id = ba.book_id

            LEFT JOIN authors a
                ON ba.author_id = a.author_id

            LEFT JOIN publishers p
                ON b.publisher_id = p.publisher_id

            LEFT JOIN book_categories bc
                ON b.book_id = bc.book_id

            LEFT JOIN categories c
                ON bc.category_id = c.category_id

            WHERE b.book_id = $1

            GROUP BY
                b.book_id,
                b.title,
                b.price,
                b.stock,
                b.total_sold,
                b.description,
                b.image_url,
                p.publisher_name;
            `,
            [id]
        );

        if (result.rows.length === 0) {

            return res.status(404).json({
                message: "Book not found"
            });

        }

        res.status(200).json(result.rows[0]);

    }
    catch (error) {

        console.log(error);

        res.status(500).json({
            message: "Cannot fetch book details"
        });

    }

});


// =========================
// Add New Book
// Admin Only
// =========================

router.post(
    "/",
    authMiddleware,
    roleMiddleware("admin"),
    async (req, res) => {

        const {
            title,
            price,
            stock,
            description,
            publisher_id,
            image_url,
            author_ids,
            category_ids
        } = req.body;


        // =========================
        // Basic Validation
        // =========================

        if (
            !title ||
            price === undefined ||
            stock === undefined ||
            !publisher_id
        ) {

            return res.status(400).json({
                message: "Title, price, stock and publisher_id are required"
            });

        }


        if (price < 0 || stock < 0) {

            return res.status(400).json({
                message: "Price and stock cannot be negative"
            });

        }


        if (
            author_ids !== undefined &&
            !Array.isArray(author_ids)
        ) {

            return res.status(400).json({
                message: "author_ids must be an array"
            });

        }


        if (
            category_ids !== undefined &&
            !Array.isArray(category_ids)
        ) {

            return res.status(400).json({
                message: "category_ids must be an array"
            });

        }


        const client = await pool.connect();

        try {

            await client.query("BEGIN");


            // =========================
            // Check Publisher
            // =========================

            const publisherCheck = await client.query(
                `SELECT publisher_id
                 FROM publishers
                 WHERE publisher_id = $1`,
                [publisher_id]
            );

            if (publisherCheck.rows.length === 0) {

                await client.query("ROLLBACK");

                return res.status(400).json({
                    message: "Publisher not found"
                });

            }


            // =========================
            // Insert Book
            // =========================

            const bookResult = await client.query(
                `INSERT INTO books
                (
                    title,
                    price,
                    stock,
                    total_sold,
                    description,
                    admin_id,
                    publisher_id,
                    image_url
                )
                VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
                RETURNING *`,
                [
                    title,
                    price,
                    stock,
                    0,
                    description || null,
                    req.user.user_id,
                    publisher_id,
                    image_url || null
                ]
            );

            const book = bookResult.rows[0];


            // =========================
            // Insert Authors
            // =========================

            if (author_ids && author_ids.length > 0) {

                for (const author_id of author_ids) {

                    await client.query(
                        `INSERT INTO book_authors
                        (book_id, author_id)
                        VALUES ($1, $2)`,
                        [book.book_id, author_id]
                    );

                }

            }


            // =========================
            // Insert Categories
            // =========================

            if (category_ids && category_ids.length > 0) {

                for (const category_id of category_ids) {

                    await client.query(
                        `INSERT INTO book_categories
                        (book_id, category_id)
                        VALUES ($1, $2)`,
                        [book.book_id, category_id]
                    );

                }

            }


            await client.query("COMMIT");


            res.status(201).json({
                message: "Book added successfully",
                book: book
            });

        }
        catch (error) {

            await client.query("ROLLBACK");

            console.log(error);

            res.status(500).json({
                message: "Cannot add book"
            });

        }
        finally {

            client.release();

        }

    }
);


// =========================
// Update Book
// Admin Only
// =========================

router.put(
    "/:id",
    authMiddleware,
    roleMiddleware("admin"),
    async (req, res) => {

        const { id } = req.params;

        const {
            title,
            price,
            stock,
            description,
            publisher_id,
            image_url,
            author_ids,
            category_ids
        } = req.body;


        // =========================
        // Basic Validation
        // =========================

        if (
            !title ||
            price === undefined ||
            stock === undefined ||
            !publisher_id
        ) {

            return res.status(400).json({
                message: "Title, price, stock and publisher_id are required"
            });

        }


        if (price < 0 || stock < 0) {

            return res.status(400).json({
                message: "Price and stock cannot be negative"
            });

        }


        if (
            author_ids !== undefined &&
            !Array.isArray(author_ids)
        ) {

            return res.status(400).json({
                message: "author_ids must be an array"
            });

        }


        if (
            category_ids !== undefined &&
            !Array.isArray(category_ids)
        ) {

            return res.status(400).json({
                message: "category_ids must be an array"
            });

        }


        const client = await pool.connect();

        try {

            await client.query("BEGIN");


            // =========================
            // Check Book
            // =========================

            const bookCheck = await client.query(
                `SELECT book_id
                 FROM books
                 WHERE book_id = $1`,
                [id]
            );

            if (bookCheck.rows.length === 0) {

                await client.query("ROLLBACK");

                return res.status(404).json({
                    message: "Book not found"
                });

            }


            // =========================
            // Check Publisher
            // =========================

            const publisherCheck = await client.query(
                `SELECT publisher_id
                 FROM publishers
                 WHERE publisher_id = $1`,
                [publisher_id]
            );

            if (publisherCheck.rows.length === 0) {

                await client.query("ROLLBACK");

                return res.status(400).json({
                    message: "Publisher not found"
                });

            }


            // =========================
            // Update Book
            // =========================

            const updateResult = await client.query(
                `UPDATE books
                 SET
                    title = $1,
                    price = $2,
                    stock = $3,
                    description = $4,
                    publisher_id = $5,
                    image_url = $6
                 WHERE book_id = $7
                 RETURNING *`,
                [
                    title,
                    price,
                    stock,
                    description || null,
                    publisher_id,
                    image_url || null,
                    id
                ]
            );


            // =========================
            // Update Authors
            // =========================

            await client.query(
                `DELETE FROM book_authors
                 WHERE book_id = $1`,
                [id]
            );


            if (author_ids && author_ids.length > 0) {

                for (const author_id of author_ids) {

                    await client.query(
                        `INSERT INTO book_authors
                        (book_id, author_id)
                        VALUES ($1, $2)`,
                        [id, author_id]
                    );

                }

            }


            // =========================
            // Update Categories
            // =========================

            await client.query(
                `DELETE FROM book_categories
                 WHERE book_id = $1`,
                [id]
            );


            if (category_ids && category_ids.length > 0) {

                for (const category_id of category_ids) {

                    await client.query(
                        `INSERT INTO book_categories
                        (book_id, category_id)
                        VALUES ($1, $2)`,
                        [id, category_id]
                    );

                }

            }


            await client.query("COMMIT");


            res.status(200).json({
                message: "Book updated successfully",
                book: updateResult.rows[0]
            });

        }
        catch (error) {

            await client.query("ROLLBACK");

            console.log(error);

            res.status(500).json({
                message: "Cannot update book"
            });

        }
        finally {

            client.release();

        }

    }
);


// =========================
// Delete Book
// Admin Only
// =========================

router.delete(
    "/:id",
    authMiddleware,
    roleMiddleware("admin"),
    async (req, res) => {

        try {

            const { id } = req.params;


            // =========================
            // Check Book
            // =========================

            const bookCheck = await pool.query(
                `SELECT book_id
                 FROM books
                 WHERE book_id = $1`,
                [id]
            );

            if (bookCheck.rows.length === 0) {

                return res.status(404).json({
                    message: "Book not found"
                });

            }


            // =========================
            // Delete Book
            // =========================

            await pool.query(
                `DELETE FROM books
                 WHERE book_id = $1`,
                [id]
            );


            res.status(204).send();

        }
        catch (error) {

            console.log(error);

            res.status(500).json({
                message: "Cannot delete book"
            });

        }

    }
);


module.exports = router;

// {
//   "title": "The Alchemist",
//   "price": 450,
//   "stock": 20,
//   "description": "A novel",
//   "publisher_id": 1,
//   "image_url": "abc.jpg",
//   "author_ids": [1],
//   "category_ids": [2, 3]
// }