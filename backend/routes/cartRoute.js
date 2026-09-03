const express = require("express");
const router = express.Router();

const pool = require("../config/db");
const authMiddleware = require("../middleware/authMiddleware");


// =========================
// Add to Cart
// =========================

router.post("/add", authMiddleware, async (req, res) => {

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

        const bookResult = await pool.query(
            `SELECT book_id, stock
     FROM books
     WHERE book_id = $1`,
            [book_id]
        );

        if (bookResult.rows.length === 0) {
            return res.status(404).json({
                message: "Book not found"
            });
        }

        // find User Cart
        const cartResult = await pool.query(
            "SELECT cart_id FROM carts WHERE user_id = $1",
            [user_id]
        );


        if (cartResult.rows.length === 0) {

            return res.status(404).json({
                message: "Cart not found"
            });

        }


        const cart_id = cartResult.rows[0].cart_id;


        // if Book in cart from earlier
        const existingItem = await pool.query(
            `SELECT * FROM cart_items
             WHERE cart_id = $1 AND book_id = $2`,
            [cart_id, book_id]
        );


        if (existingItem.rows.length > 0) {

            const currentQuantity = existingItem.rows[0].quantity;
            const stock = bookResult.rows[0].stock;

            if (currentQuantity >= stock) {
                return res.status(400).json({
                    message: "Not enough stock available"
                });
            }

            await pool.query(
                `UPDATE cart_items
         SET quantity = quantity + 1
         WHERE cart_id = $1 AND book_id = $2`,
                [cart_id, book_id]
            );

        } else {
            const stock = bookResult.rows[0].stock;

            if (stock <= 0) {
                return res.status(400).json({
                    message: "Book is out of stock"
                });
            }

            await pool.query(
                `INSERT INTO cart_items
         (cart_id, book_id, quantity)
         VALUES ($1, $2, 1)`,
                [cart_id, book_id]
            );
        }


        res.json({
            message: "Book added to cart"
        });


    } catch (error) {

        console.log(error);

        res.status(500).json({
            message: "Failed to add book to cart"
        });

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

        const cartResult = await pool.query(
            "SELECT cart_id FROM carts WHERE user_id = $1",
            [user_id]
        );

        if (cartResult.rows.length === 0) {
            return res.status(404).json({
                message: "Cart not found"
            });
        }

        const cart_id = cartResult.rows[0].cart_id;

        const itemResult = await pool.query(
            `SELECT quantity
             FROM cart_items
             WHERE cart_id = $1 AND book_id = $2`,
            [cart_id, book_id]
        );

        if (itemResult.rows.length === 0) {
            return res.status(404).json({
                message: "Cart item not found"
            });
        }

        const bookResult = await pool.query(
            `SELECT stock
             FROM books
             WHERE book_id = $1`,
            [book_id]
        );

        if (bookResult.rows.length === 0) {
            return res.status(404).json({
                message: "Book not found"
            });
        }

        const quantity = itemResult.rows[0].quantity;
        const stock = bookResult.rows[0].stock;

        if (quantity >= stock) {
            return res.status(400).json({
                message: "Not enough stock available"
            });
        }

        await pool.query(
            `UPDATE cart_items
             SET quantity = quantity + 1
             WHERE cart_id = $1 AND book_id = $2`,
            [cart_id, book_id]
        );

        res.json({
            message: "Quantity increased"
        });

    } catch (error) {
        console.log(error);
        res.status(500).json({
            message: "Failed to increase quantity"
        });
    }
});


// =========================
// Decrease Quantity
// =========================

router.put("/decrease", authMiddleware, async (req, res) => {

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

        const cartResult = await pool.query(
            "SELECT cart_id FROM carts WHERE user_id = $1",
            [user_id]
        );

        if (cartResult.rows.length === 0) {

            return res.status(404).json({
                message: "Cart not found"
            });

        }

        const cart_id = cartResult.rows[0].cart_id;

        const itemResult = await pool.query(
            `SELECT quantity
             FROM cart_items
             WHERE cart_id = $1 AND book_id = $2`,
            [cart_id, book_id]
        );

        if (itemResult.rows.length === 0) {

            return res.status(404).json({
                message: "Cart item not found"
            });

        }

        const quantity = itemResult.rows[0].quantity;

        if (quantity > 1) {

            await pool.query(
                `UPDATE cart_items
                 SET quantity = quantity - 1
                 WHERE cart_id = $1 AND book_id = $2`,
                [cart_id, book_id]
            );

        } else {

            await pool.query(
                `DELETE FROM cart_items
                 WHERE cart_id = $1 AND book_id = $2`,
                [cart_id, book_id]
            );

        }

        res.json({
            message: "Quantity decreased"
        });

    } catch (error) {

        console.log(error);

        res.status(500).json({
            message: "Failed to decrease quantity"
        });

    }

});


// =========================
// Remove Item
// =========================
router.delete("/remove", authMiddleware, async (req, res) => {
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

        const cartResult = await pool.query(
            "SELECT cart_id FROM carts WHERE user_id = $1",
            [user_id]
        );

        if (cartResult.rows.length === 0) {
            return res.status(404).json({
                message: "Cart not found"
            });
        }

        const cart_id = cartResult.rows[0].cart_id;

        const itemResult = await pool.query(
            `SELECT *
             FROM cart_items
             WHERE cart_id = $1 AND book_id = $2`,
            [cart_id, book_id]
        );

        if (itemResult.rows.length === 0) {
            return res.status(404).json({
                message: "Cart item not found"
            });
        }

        await pool.query(
            `DELETE FROM cart_items
             WHERE cart_id = $1 AND book_id = $2`,
            [cart_id, book_id]
        );

        res.json({
            message: "Item removed from cart"
        });

    } catch (error) {
        console.log(error);
        res.status(500).json({
            message: "Failed to remove item"
        });
    }
});


module.exports = router;