const express = require("express");
const router = express.Router();

const pool = require("../config/db");
const authMiddleware = require("../middleware/authMiddleware");
const roleMiddleware = require("../middleware/roleMiddleware");



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

    const client = await pool.connect();

    try {

        const {
            user_id,
            payment_method,
            coupon_id,
            shipping_address
        } = req.body;


        // =========================
        // Basic Validation
        // =========================

        if (!user_id) {
            return res.status(400).json({
                message: "User id is required"
            });
        }

        if (!shipping_address || shipping_address.trim() === "") {
            return res.status(400).json({
                message: "Delivery address is required"
            });
        }


        // =========================
        // Start Transaction
        // =========================

        await client.query("BEGIN");


        const delivery_charge = 150;


        // =========================
        // Find Cart
        // =========================

        const cartResult = await client.query(
            `SELECT cart_id
             FROM carts
             WHERE user_id = $1`,
            [user_id]
        );


        if (cartResult.rows.length === 0) {

            await client.query("ROLLBACK");

            return res.status(404).json({
                message: "Cart not found"
            });
        }


        const cart_id = cartResult.rows[0].cart_id;


        // =========================
        // Get Cart Items + Stock
        // =========================

        const itemsResult = await client.query(
            `SELECT
                ci.book_id,
                ci.quantity,
                b.price,
                b.title,
                b.stock
             FROM cart_items ci
             JOIN books b
                ON ci.book_id = b.book_id
             WHERE ci.cart_id = $1
             FOR UPDATE OF b`,
            [cart_id]
        );


        const items = itemsResult.rows;


        // =========================
        // Empty Cart Check
        // =========================

        if (items.length === 0) {

            await client.query("ROLLBACK");

            return res.status(400).json({
                message: "Your cart is empty"
            });
        }


        // =========================
        // Check Stock
        // =========================

        for (const item of items) {

            if (Number(item.stock) < Number(item.quantity)) {

                await client.query("ROLLBACK");

                return res.status(400).json({
                    message: `Insufficient stock for "${item.title}". Available: ${item.stock}, Requested: ${item.quantity}`
                });
            }
        }
    

        // =========================
        // Calculate Subtotal
        // =========================

        let subtotal = items.reduce(
            (sum, item) =>
                sum + Number(item.price) * Number(item.quantity),
            0
        );


        // =========================
        // Calculate Discount
        // =========================

        let discount_amount = 0;


        if (coupon_id) {

            const couponResult = await client.query(
                `SELECT *
                 FROM coupons
                 WHERE coupon_id = $1
                 AND status = 'active'`,
                [coupon_id]
            );


            if (couponResult.rows.length > 0) {

                const coupon = couponResult.rows[0];


                // Check if user already used coupon

                const usedResult = await client.query(
                    `SELECT 1
                     FROM orders
                     WHERE user_id = $1
                     AND coupon_id = $2
                     LIMIT 1`,
                    [user_id, coupon_id]
                );


                if (
                    usedResult.rows.length === 0 &&
                    subtotal >= Number(coupon.minimum_purchase)
                ) {

                    discount_amount =
                        Number(coupon.discount_value);
                }
            }
        }


        // =========================
        // Calculate Total
        // =========================

        let total_amount =
            subtotal -
            discount_amount +
            delivery_charge;


        if (total_amount < 0) {
            total_amount = 0;
        }


        // =========================
        // Create Order
        // =========================

        const orderResult = await client.query(
            `INSERT INTO orders
                (
                    user_id,
                    coupon_id,
                    total_amount,
                    delivery_charge,
                    discount_amount,
                    shipping_address
                )
             VALUES ($1, $2, $3, $4, $5, $6)
             RETURNING order_id`,
            [
                user_id,
                coupon_id || null,
                total_amount,
                delivery_charge,
                discount_amount,
                shipping_address
            ]
        );


        const order_id = orderResult.rows[0].order_id;


        // =========================
        // Create Order Items + Decrease Stock
        // =========================

        for (const item of items) {

            await client.query(
                `INSERT INTO order_items
                    (
                        order_id,
                        book_id,
                        quantity,
                        unit_price
                    )
                 VALUES ($1, $2, $3, $4)`,
                [
                    order_id,
                    item.book_id,
                    item.quantity,
                    item.price
                ]
            );


            await client.query(
                `UPDATE books
                 SET stock = stock - $1,
                     total_sold = total_sold + $1
                 WHERE book_id = $2`,
                [
                    item.quantity,
                    item.book_id
                ]
            );
        }


        // =========================
        // Create Payment
        // =========================

        await client.query(
            `INSERT INTO payments
                (order_id, payment_method)
             VALUES ($1, $2)`,
            [
                order_id,
                payment_method || "COD"
            ]
        );


        // =========================
        // Clear Cart
        // =========================

        await client.query(
            `DELETE FROM cart_items
             WHERE cart_id = $1`,
            [cart_id]
        );


        // =========================
        // Commit Transaction
        // =========================

        await client.query("COMMIT");


        res.status(201).json({
            message: "Order placed successfully",
            order_id: order_id
        });


    } catch (error) {

        await client.query("ROLLBACK");

        console.log(error);

        res.status(500).json({
            message: "Failed to place order"
        });


    } finally {

        client.release();

    }

});



// =========================
// Get All Orders (Admin only)
// =========================

router.get(
    "/",
    authMiddleware,
    roleMiddleware("admin", "superadmin"),
    async (req, res) => {

        try {

            const result = await pool.query(
                `SELECT
                    o.order_id,
                    o.user_id,
                    o.order_date,
                    o.total_amount,
                    o.status,
                    u.name AS customer_name,
                    p.payment_method
                 FROM orders o
                 JOIN users u
                    ON o.user_id = u.user_id
                 LEFT JOIN payments p
                    ON o.order_id = p.order_id
                 ORDER BY o.order_date DESC`
            );

            res.json(result.rows);

        } catch (error) {
            console.log(error);
            res.status(500).json({ message: "Failed to load orders" });
        }
    }
);


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

                p.payment_method

             FROM orders o

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


// =========================
// Update Order Status (Admin only)
// =========================

const VALID_STATUSES = [
    "pending",
    "processing",
    "shipped",
    "delivered",
    "cancelled"
];

router.patch(
    "/:orderId/status",
    authMiddleware,
    roleMiddleware("admin"),
    async (req, res) => {

        try {

            const { orderId } = req.params;
            const { status } = req.body;

            if (!status || !VALID_STATUSES.includes(status.toLowerCase())) {
                return res.status(400).json({
                    message: `Invalid status. Must be one of: ${VALID_STATUSES.join(", ")}`
                });
            }

            const orderCheck = await pool.query(
                `SELECT status FROM orders WHERE order_id = $1`,
                [orderId]
            );

            if (orderCheck.rows.length === 0) {
                return res.status(404).json({ message: "Order not found" });
            }

            const currentStatus = orderCheck.rows[0].status;

            if (currentStatus === "cancelled" || currentStatus === "delivered") {
                return res.status(400).json({
                    message: `Cannot change status of an order that is already "${currentStatus}"`
                });
            }

            const result = await pool.query(
                `UPDATE orders                                                                                                                                                                                                                                                                     
                 SET status = $1
                 WHERE order_id = $2
                 RETURNING order_id, status`,
                [status.toLowerCase(), orderId]
            );

            res.json({
                message: "Order status updated successfully",
                order: result.rows[0]
            });

        } catch (error) {
            console.log(error);
            res.status(500).json({ message: "Failed to update order status" });
        }
    }
);


module.exports = router;