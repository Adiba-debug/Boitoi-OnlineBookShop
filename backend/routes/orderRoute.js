const express = require("express");
const router = express.Router();

const pool = require("../config/db");



// Checkout (Place Order)


router.post("/checkout", async (req, res) => {

    try {

        const { user_id, payment_method, coupon_id } = req.body;


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


        
        const itemsResult = await pool.query(

            `SELECT ci.book_id, ci.quantity, b.price
             FROM cart_items ci
             JOIN books b ON ci.book_id = b.book_id
             WHERE ci.cart_id = $1`,

            [cart_id]

        );

        const items = itemsResult.rows;

        if (items.length === 0) {

            return res.status(400).json({
                message: "Your cart is empty"
            });

        }


      
        let total_amount = items.reduce(
            (sum, item) => sum + Number(item.price) * Number(item.quantity),
            0
        );


     
        if (coupon_id) {

            const couponResult = await pool.query(
                `SELECT * FROM coupons
                 WHERE coupon_id = $1 AND status = 'active'`,
                [coupon_id]
            );

            if (couponResult.rows.length > 0) {

                const coupon = couponResult.rows[0];

                if (total_amount >= Number(coupon.minimum_purchase)) {

                    total_amount -= Number(coupon.discount_value);

                    if (total_amount < 0) {
                        total_amount = 0;
                    }

                }

            }

        }


        const orderResult = await pool.query(

            `INSERT INTO orders (user_id, coupon_id, total_amount)
             VALUES ($1, $2, $3)
             RETURNING order_id`,

            [user_id, coupon_id || null, total_amount]

        );

        const order_id = orderResult.rows[0].order_id;


        for (const item of items) {

            await pool.query(

                `INSERT INTO order_items
                 (order_id, book_id, quantity, unit_price)
                 VALUES ($1, $2, $3, $4)`,

                [order_id, item.book_id, item.quantity, item.price]

            );

        }


  
        await pool.query(

            `INSERT INTO payments (order_id, payment_method)
             VALUES ($1, $2)`,

            [order_id, payment_method || "COD"]

        );


   
        await pool.query(
            "DELETE FROM cart_items WHERE cart_id = $1",
            [cart_id]
        );


        res.json({
            message: "Order placed successfully",
            order_id
        });


    } catch (error) {

        console.log(error);

        res.status(500).json({
            message: "Failed to place order"
        });

    }

});


// =========================
// Get All Orders of a User (UPDATED BY ADIBA)
// =========================

router.get("/user/:userId", async (req, res) => {

    try {

        const userId = req.params.userId;

        const result = await pool.query(

            `SELECT
                o.order_id,
                o.user_id,
                o.coupon_id,
                o.order_date,
                o.total_amount,
                o.status,

                p.payment_method,

                oi.book_id,
                oi.quantity,
                oi.unit_price,

                b.title,
                b.image_url

             FROM orders o

             JOIN order_items oi
                ON o.order_id = oi.order_id

             JOIN books b
                ON oi.book_id = b.book_id

             LEFT JOIN payments p
                ON o.order_id = p.order_id

             WHERE o.user_id = $1

             ORDER BY o.order_date DESC`,

            [userId]

        );

        res.json(result.rows);

    } catch (error) {

        console.log(error);

        res.status(500).json({
            message: "Failed to load user orders"
        });

    }

});




// Get Order Details


router.get("/:orderId", async (req, res) => {

    try {

        const orderId = req.params.orderId;


        
        const orderResult = await pool.query(
            "SELECT * FROM orders WHERE order_id = $1",
            [orderId]
        );

        if (orderResult.rows.length === 0) {

            return res.status(404).json({
                message: "Order not found"
            });

        }

        const order = orderResult.rows[0];


        const itemsResult = await pool.query(

            `SELECT
                oi.book_id,
                oi.quantity,
                oi.unit_price,
                b.title,
                b.image_url

             FROM order_items oi

             JOIN books b
                ON oi.book_id = b.book_id

             WHERE oi.order_id = $1`,

            [orderId]

        );


        res.json({
            ...order,
            items: itemsResult.rows
        });


    } catch (error) {

        console.log(error);

        res.status(500).json({
            message: "Failed to load order"
        });

    }

});


module.exports = router;