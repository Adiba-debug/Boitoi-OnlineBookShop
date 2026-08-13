const express = require("express");
const router = express.Router();

const pool = require("../config/db");



//Validate / Apply Coupon
router.post("/apply-coupon", async (req, res) => {
    try {
        const { coupon_code, subtotal, user_id } = req.body;

        if (!coupon_code) {
            return res.status(400).json({ message: "Coupon code is required" });
        }

        if (!user_id) {
            return res.status(400).json({ message: "User id is required" });
        }

        const couponResult = await pool.query(
            `SELECT * FROM coupons WHERE coupon_code = $1 AND status = 'active'`,
            [coupon_code]
        );

        if (couponResult.rows.length === 0) {
            return res.status(404).json({ message: "Invalid or inactive coupon" });
        }

        const coupon = couponResult.rows[0];

        if (coupon.expiry_date && new Date(coupon.expiry_date) < new Date()) {
            return res.status(400).json({ message: "This coupon has expired" });
        }

        // Block if this user already used this coupon before (any past order, cancelled or not)
        const usedResult = await pool.query(
            `SELECT 1 FROM orders WHERE user_id = $1 AND coupon_id = $2 LIMIT 1`,
            [user_id, coupon.coupon_id]
        );

        if (usedResult.rows.length > 0) {
            return res.status(400).json({ message: "You have already used this coupon" });
        }

        if (Number(subtotal) < Number(coupon.minimum_purchase)) {
            return res.status(400).json({
                message: `Minimum purchase ${coupon.minimum_purchase} Tk required for this coupon`
            });
        }

        res.json({
            message: "Coupon applied successfully",
            coupon_id: coupon.coupon_id,
            discount_value: Number(coupon.discount_value)
        });

    } catch (error) {
        console.log(error);
        res.status(500).json({ message: "Failed to apply coupon" });
    }
});



  
       router.post("/checkout", async (req, res) => {
    try {
        const { user_id, payment_method, coupon_id, shipping_address } = req.body;

        if (!shipping_address || shipping_address.trim() === "") {
            return res.status(400).json({ message: "Delivery address is required" });
        }

        const delivery_charge = 150;

        const cartResult = await pool.query(
            "SELECT cart_id FROM carts WHERE user_id = $1",
            [user_id]
        );

        if (cartResult.rows.length === 0) {
            return res.status(404).json({ message: "Cart not found" });
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
            return res.status(400).json({ message: "Your cart is empty" });
        }

        let subtotal = items.reduce(
            (sum, item) => sum + Number(item.price) * Number(item.quantity),
            0
        );

        let discount_amount = 0;

        if (coupon_id) {
            const couponResult = await pool.query(
                `SELECT * FROM coupons WHERE coupon_id = $1 AND status = 'active'`,
                [coupon_id]
            );

            if (couponResult.rows.length > 0) {
                const coupon = couponResult.rows[0];

                // Block if this user already used this coupon before (any past order, cancelled or not)
                const usedResult = await pool.query(
                    `SELECT 1 FROM orders WHERE user_id = $1 AND coupon_id = $2 LIMIT 1`,
                    [user_id, coupon_id]
                );

                if (usedResult.rows.length === 0 && subtotal >= Number(coupon.minimum_purchase)) {
                    discount_amount = Number(coupon.discount_value);
                }
            }
        }

        let total_amount = subtotal - discount_amount + delivery_charge;
        if (total_amount < 0) total_amount = 0;

        const orderResult = await pool.query(
            `INSERT INTO orders
                (user_id, coupon_id, total_amount, delivery_charge, discount_amount, shipping_address)
             VALUES ($1, $2, $3, $4, $5, $6)
             RETURNING order_id`,
            [user_id, coupon_id || null, total_amount, delivery_charge, discount_amount, shipping_address]
        );

        const order_id = orderResult.rows[0].order_id;

        for (const item of items) {
            await pool.query(
                `INSERT INTO order_items (order_id, book_id, quantity, unit_price)
                 VALUES ($1, $2, $3, $4)`,
                [order_id, item.book_id, item.quantity, item.price]
            );
        }

        await pool.query(
            `INSERT INTO payments (order_id, payment_method) VALUES ($1, $2)`,
            [order_id, payment_method || "COD"]
        );

        await pool.query("DELETE FROM cart_items WHERE cart_id = $1", [cart_id]);

        res.json({ message: "Order placed successfully", order_id });

    } catch (error) {
        console.log(error);
        res.status(500).json({ message: "Failed to place order" });
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

            `SELECT
                o.*,
                u.name AS customer_name,
                u.email AS customer_email,
                u.phone_number AS customer_phone

             FROM orders o

             JOIN users u
                ON o.user_id = u.user_id

             WHERE o.order_id = $1`,

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