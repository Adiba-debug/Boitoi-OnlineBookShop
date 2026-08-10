const express = require("express");
const router = express.Router();

const pool = require("../config/db");


// =========================
// Add to Cart
// =========================

router.post("/add", async (req, res) => {

    try {

        const { user_id, book_id } = req.body;


        // User-এর cart খুঁজে বের করা
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


        // Book আগে থেকেই cart-এ আছে কিনা
        const existingItem = await pool.query(
            `SELECT * FROM cart_items
             WHERE cart_id = $1 AND book_id = $2`,
            [cart_id, book_id]
        );


        if (existingItem.rows.length > 0) {

            // থাকলে quantity + 1
            await pool.query(
                `UPDATE cart_items
                 SET quantity = quantity + 1
                 WHERE cart_id = $1 AND book_id = $2`,
                [cart_id, book_id]
            );

        } else {

            // না থাকলে নতুন item
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

router.get("/:userId", async (req, res) => {

    try {

        const userId = req.params.userId;


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

router.put("/increase", async (req, res) => {

    try {

        const { user_id, book_id } = req.body;

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

router.put("/decrease", async (req, res) => {

    try {

        const { user_id, book_id } = req.body;

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

router.delete("/remove", async (req, res) => {

    try {

        const { user_id, book_id } = req.body;

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