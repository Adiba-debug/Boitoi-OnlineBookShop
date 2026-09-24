const express = require("express");
const router = express.Router();

const pool = require("../config/db");
const authMiddleware = require("../middleware/authMiddleware");


// =========================
// Add to Cart
// =========================

router.post("/add", authMiddleware, async (req, res) => {

    const client = await pool.connect();

    try {

        const { book_id } = req.body;
        const user_id = req.user.user_id;

        if (!book_id) {
            return res.status(400).json({ message: "book_id is required" });
        }
        if (!Number.isInteger(book_id) || book_id <= 0) {
            return res.status(400).json({ message: "Invalid book_id" });
        }

        await client.query("BEGIN");

        // Lock the book row to prevent concurrent stock reads
        const bookResult = await client.query(
            `SELECT book_id, stock FROM books WHERE book_id = $1 FOR UPDATE`,
            [book_id]
        );

        if (bookResult.rows.length === 0) {
            await client.query("ROLLBACK");
            return res.status(404).json({ message: "Book not found" });
        }

        const cartResult = await client.query(
            "SELECT cart_id FROM carts WHERE user_id = $1",
            [user_id]
        );

        if (cartResult.rows.length === 0) {
            await client.query("ROLLBACK");
            return res.status(404).json({ message: "Cart not found" });
        }

        const cart_id = cartResult.rows[0].cart_id;

        const existingItem = await client.query(
            `SELECT quantity FROM cart_items WHERE cart_id = $1 AND book_id = $2`,
            [cart_id, book_id]
        );

        if (existingItem.rows.length > 0) {

            const currentQuantity = existingItem.rows[0].quantity;
            const stock = bookResult.rows[0].stock;

            if (currentQuantity >= stock) {
                await client.query("ROLLBACK");
                return res.status(400).json({ message: "Not enough stock available" });
            }

            await client.query(
                `UPDATE cart_items SET quantity = quantity + 1 WHERE cart_id = $1 AND book_id = $2`,
                [cart_id, book_id]
            );

        } else {

            const stock = bookResult.rows[0].stock;

            if (stock <= 0) {
                await client.query("ROLLBACK");
                return res.status(400).json({ message: "Book is out of stock" });
            }

            await client.query(
                `INSERT INTO cart_items (cart_id, book_id, quantity) VALUES ($1, $2, 1)`,
                [cart_id, book_id]
            );
        }

        await client.query("COMMIT");

        res.json({ message: "Book added to cart" });

    } catch (error) {

        await client.query("ROLLBACK");
        console.log(error);
        res.status(500).json({ message: "Failed to add book to cart" });

    } finally {

        client.release();

    }

});



// =========================
// Get Cart
// =========================

router.get("/", authMiddleware, async (req, res) => {

    try {

        const userId = req.user.user_id;


        const result = await pool.query(

            `SELECT
                ci.book_id,
                ci.quantity,
                b.title,
                b.price,
                b.image_url

             FROM carts c

             JOIN cart_items ci
                ON c.cart_id = ci.cart_id

             JOIN books b
                ON ci.book_id = b.book_id

             WHERE c.user_id = $1

             ORDER BY b.title`,

            [userId]

        );


        res.json(result.rows);


    } catch (error) {

        console.log(error);

        res.status(500).json({
            message: "Failed to load cart"
        });

    }

});

// =========================
// Increase Quantity
// =========================
router.put("/increase", authMiddleware, async (req, res) => {

    const client = await pool.connect();

    try {
        const { book_id } = req.body;
        const user_id = req.user.user_id;

        if (!book_id) {
            return res.status(400).json({ message: "book_id is required" });
        }
        if (!Number.isInteger(book_id) || book_id <= 0) {
            return res.status(400).json({ message: "Invalid book_id" });
        }

        await client.query("BEGIN");

        const cartResult = await client.query(
            "SELECT cart_id FROM carts WHERE user_id = $1",
            [user_id]
        );

        if (cartResult.rows.length === 0) {
            await client.query("ROLLBACK");
            return res.status(404).json({ message: "Cart not found" });
        }

        const cart_id = cartResult.rows[0].cart_id;

        const itemResult = await client.query(
            `SELECT quantity FROM cart_items WHERE cart_id = $1 AND book_id = $2 FOR UPDATE`,
            [cart_id, book_id]
        );

        if (itemResult.rows.length === 0) {
            await client.query("ROLLBACK");
            return res.status(404).json({ message: "Cart item not found" });
        }

        const bookResult = await client.query(
            `SELECT stock FROM books WHERE book_id = $1 FOR UPDATE`,
            [book_id]
        );

        if (bookResult.rows.length === 0) {
            await client.query("ROLLBACK");
            return res.status(404).json({ message: "Book not found" });
        }

        const quantity = itemResult.rows[0].quantity;
        const stock = bookResult.rows[0].stock;

        if (quantity >= stock) {
            await client.query("ROLLBACK");
            return res.status(400).json({ message: "Not enough stock available" });
        }

        await client.query(
            `UPDATE cart_items SET quantity = quantity + 1 WHERE cart_id = $1 AND book_id = $2`,
            [cart_id, book_id]
        );

        await client.query("COMMIT");

        res.json({ message: "Quantity increased" });

    } catch (error) {

        await client.query("ROLLBACK");
        console.log(error);
        res.status(500).json({ message: "Failed to increase quantity" });

    } finally {

        client.release();

    }

});


// =========================
// Decrease Quantity
// =========================

router.put("/decrease", authMiddleware, async (req, res) => {

    const client = await pool.connect();

    try {

        const { book_id } = req.body;
        const user_id = req.user.user_id;

        if (!book_id) {
            return res.status(400).json({ message: "book_id is required" });
        }
        if (!Number.isInteger(book_id) || book_id <= 0) {
            return res.status(400).json({ message: "Invalid book_id" });
        }

        await client.query("BEGIN");

        const cartResult = await client.query(
            "SELECT cart_id FROM carts WHERE user_id = $1",
            [user_id]
        );

        if (cartResult.rows.length === 0) {
            await client.query("ROLLBACK");
            return res.status(404).json({ message: "Cart not found" });
        }

        const cart_id = cartResult.rows[0].cart_id;

        const itemResult = await client.query(
            `SELECT quantity FROM cart_items WHERE cart_id = $1 AND book_id = $2 FOR UPDATE`,
            [cart_id, book_id]
        );

        if (itemResult.rows.length === 0) {
            await client.query("ROLLBACK");
            return res.status(404).json({ message: "Cart item not found" });
        }

        const quantity = itemResult.rows[0].quantity;

        if (quantity > 1) {
            await client.query(
                `UPDATE cart_items SET quantity = quantity - 1 WHERE cart_id = $1 AND book_id = $2`,
                [cart_id, book_id]
            );
        } else {
            await client.query(
                `DELETE FROM cart_items WHERE cart_id = $1 AND book_id = $2`,
                [cart_id, book_id]
            );
        }

        await client.query("COMMIT");

        res.json({ message: "Quantity decreased" });

    } catch (error) {

        await client.query("ROLLBACK");
        console.log(error);
        res.status(500).json({ message: "Failed to decrease quantity" });

    } finally {

        client.release();

    }

});


// =========================
// Remove Item
// =========================
router.delete("/remove", authMiddleware, async (req, res) => {

    const client = await pool.connect();

    try {
        const { book_id } = req.body;
        const user_id = req.user.user_id;

        if (!book_id) {
            return res.status(400).json({
                message: "book_id is required"
            });
        }
        if (!Number.isInteger(book_id) || book_id <= 0) {
            return res.status(400).json({
                message: "Invalid book_id"
            });
        }

        await client.query("BEGIN");

        const cartResult = await client.query(
            "SELECT cart_id FROM carts WHERE user_id = $1",
            [user_id]
        );

        if (cartResult.rows.length === 0) {
            await client.query("ROLLBACK");
            return res.status(404).json({
                message: "Cart not found"
            });
        }

        const cart_id = cartResult.rows[0].cart_id;

        const itemResult = await client.query(
            `SELECT cart_id FROM cart_items
             WHERE cart_id = $1 AND book_id = $2 FOR UPDATE`,
            [cart_id, book_id]
        );

        if (itemResult.rows.length === 0) {
            await client.query("ROLLBACK");
            return res.status(404).json({
                message: "Cart item not found"
            });
        }

        await client.query(
            `DELETE FROM cart_items
             WHERE cart_id = $1 AND book_id = $2`,
            [cart_id, book_id]
        );

        await client.query("COMMIT");

        res.json({
            message: "Item removed from cart"
        });

    } catch (error) {

        await client.query("ROLLBACK");
        console.log(error);
        res.status(500).json({
            message: "Failed to remove item"
        });

    } finally {

        client.release();

    }
});


module.exports = router;