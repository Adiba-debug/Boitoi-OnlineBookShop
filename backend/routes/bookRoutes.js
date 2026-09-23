const express = require("express");
const router = express.Router();

const pool = require("../config/db");
const authMiddleware = require("../middleware/authMiddleware");
const roleMiddleware = require("../middleware/roleMiddleware");


// =========================
// Search Books
// Public API
// GET /api/books/search?q=...
// =========================

router.get("/search", async (req, res) => {

    try {

        const { q } = req.query;

        if (!q || !q.trim()) {
            return res.status(400).json({ message: "Search query is required" });
        }

        const searchTerm = `%${q.trim()}%`;

        const result = await pool.query(
            `SELECT DISTINCT
                b.book_id,
                b.title,
                b.price,
                b.stock,
                b.image_url
             FROM books b
             LEFT JOIN book_authors ba ON b.book_id = ba.book_id
             LEFT JOIN authors a ON ba.author_id = a.author_id
             WHERE
                b.title ILIKE $1
                OR a.author_name ILIKE $1
             ORDER BY b.title`,
            [searchTerm]
        );

        res.status(200).json(result.rows);

    } catch (error) {

        console.log(error);
        res.status(500).json({ message: "Search failed" });

    }

});


// =========================
// Books by Category
// Public API
// GET /api/books/category/:categoryId
// =========================

router.get("/category/:categoryId", async (req, res) => {

    try {

        const { categoryId } = req.params;

        // Check category exists
        const catCheck = await pool.query(
            "SELECT category_id, category_name FROM categories WHERE category_id = $1",
            [categoryId]
        );

        if (catCheck.rows.length === 0) {
            return res.status(404).json({ message: "Category not found" });
        }

        const result = await pool.query(
            `SELECT DISTINCT
                b.book_id,
                b.title,
                b.price,
                b.stock,
                b.image_url
             FROM books b
             JOIN book_categories bc ON b.book_id = bc.book_id
             WHERE bc.category_id = $1
             ORDER BY b.title`,
            [categoryId]
        );

        res.status(200).json({
            label: catCheck.rows[0].category_name,
            books: result.rows
        });

    } catch (error) {

        console.log(error);
        res.status(500).json({ message: "Cannot fetch books by category" });

    }

});


// =========================
// Books by Author
// Public API
// GET /api/books/author/:authorId
// =========================

router.get("/author/:authorId", async (req, res) => {

    try {

        const { authorId } = req.params;

        // Check author exists
        const authorCheck = await pool.query(
            "SELECT author_id, author_name FROM authors WHERE author_id = $1",
            [authorId]
        );

        if (authorCheck.rows.length === 0) {
            return res.status(404).json({ message: "Author not found" });
        }

        const result = await pool.query(
            `SELECT DISTINCT
                b.book_id,
                b.title,
                b.price,
                b.stock,
                b.image_url
             FROM books b
             JOIN book_authors ba ON b.book_id = ba.book_id
             WHERE ba.author_id = $1
             ORDER BY b.title`,
            [authorId]
        );

        res.status(200).json({
            label: authorCheck.rows[0].author_name,
            books: result.rows
        });

    } catch (error) {

        console.log(error);
        res.status(500).json({ message: "Cannot fetch books by author" });

    }

});


// =========================
// Books by Publisher
// Public API
// GET /api/books/publisher/:publisherId
// =========================

router.get("/publisher/:publisherId", async (req, res) => {

    try {

        const { publisherId } = req.params;

        // Check publisher exists
        const pubCheck = await pool.query(
            "SELECT publisher_id, publisher_name FROM publishers WHERE publisher_id = $1",
            [publisherId]
        );

        if (pubCheck.rows.length === 0) {
            return res.status(404).json({ message: "Publisher not found" });
        }

        const result = await pool.query(
            `SELECT
                b.book_id,
                b.title,
                b.price,
                b.stock,
                b.image_url
             FROM books b
             WHERE b.publisher_id = $1
             ORDER BY b.title`,
            [publisherId]
        );

        res.status(200).json({
            label: pubCheck.rows[0].publisher_name,
            books: result.rows
        });

    } catch (error) {

        console.log(error);
        res.status(500).json({ message: "Cannot fetch books by publisher" });

    }

});


// =========================
// Get All Books
// Public API
// =========================

router.get("/", async (req, res) => {

    try {

        const result = await pool.query(
            `SELECT
        b.*,
        p.publisher_name,

        COALESCE(
            ARRAY_AGG(DISTINCT ba.author_id)
            FILTER (WHERE ba.author_id IS NOT NULL),
            '{}'
        ) AS author_ids,

        COALESCE(
            ARRAY_AGG(DISTINCT a.author_name)
            FILTER (WHERE a.author_name IS NOT NULL),
            '{}'
        ) AS author_names,

        COALESCE(
            ARRAY_AGG(DISTINCT bc.category_id)
            FILTER (WHERE bc.category_id IS NOT NULL),
            '{}'
        ) AS category_ids,

        COALESCE(
            ARRAY_AGG(DISTINCT c.category_name)
            FILTER (WHERE c.category_name IS NOT NULL),
            '{}'
        ) AS category_names

    FROM books b

    LEFT JOIN publishers p
        ON b.publisher_id = p.publisher_id

    LEFT JOIN book_authors ba
        ON b.book_id = ba.book_id

    LEFT JOIN authors a
        ON ba.author_id = a.author_id

    LEFT JOIN book_categories bc
        ON b.book_id = bc.book_id

    LEFT JOIN categories c
        ON bc.category_id = c.category_id

    GROUP BY
        b.book_id,
        p.publisher_name`
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
                b.publisher_id,

                p.publisher_name AS publisher,

                COALESCE(
                    ARRAY_AGG(DISTINCT ba.author_id)
                    FILTER (WHERE ba.author_id IS NOT NULL),
                    '{}'
                ) AS author_ids,
                COALESCE(
    ARRAY_AGG(DISTINCT bc.category_id)
    FILTER (WHERE bc.category_id IS NOT NULL),
    '{}'
) AS category_ids,

                STRING_AGG(DISTINCT a.author_name, ', ') AS authors,

                STRING_AGG(DISTINCT c.category_name, ', ') AS categories

            FROM books b

            LEFT JOIN publishers p
                ON b.publisher_id = p.publisher_id

            LEFT JOIN book_authors ba
                ON b.book_id = ba.book_id

            LEFT JOIN authors a
                ON ba.author_id = a.author_id

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
                b.publisher_id,
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