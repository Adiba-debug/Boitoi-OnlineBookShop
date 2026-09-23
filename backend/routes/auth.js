const express = require("express");
const router = express.Router();

const pool = require("../config/db");
const bcrypt = require("bcrypt");

const jwt = require("jsonwebtoken");
const authMiddleware = require("../middleware/authMiddleware");
const roleMiddleware = require("../middleware/roleMiddleware");

// =========================
// Register API
// =========================

router.post("/register", async (req, res) => {

    const { name, email, phone_number, password } = req.body;


    // =========================
    // Basic Input Validation
    // =========================

    if (!name || !email || !password) {

        return res.status(400).json({
            message: "Name, email and password are required"
        });
    }
    // =========================
    // Password Strength Validation
    // =========================

    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/;

    if (!passwordRegex.test(password)) {

        return res.status(400).json({
            message: "Password must be at least 8 characters long and contain at least one uppercase letter, one lowercase letter, and one number"
        });
    }

    // =========================
    // Email Format Validation
    // =========================

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!emailRegex.test(email)) {

        return res.status(400).json({
            message: "Invalid email format"
        });
    }


    const client = await pool.connect();

    try {

        // Start transaction
        await client.query("BEGIN");


        // =========================
        // Check Duplicate Email
        // =========================

        const emailCheck = await client.query(
            `SELECT user_id
             FROM users
             WHERE email = $1`,
            [email]
        );

        if (emailCheck.rows.length > 0) {

            await client.query("ROLLBACK");

            return res.status(409).json({
                message: "Email already exists"
            });
        }


        // =========================
        // Check Duplicate Phone
        // =========================

        if (phone_number) {

            const phoneCheck = await client.query(
                `SELECT user_id
                 FROM users
                 WHERE phone_number = $1`,
                [phone_number]
            );

            if (phoneCheck.rows.length > 0) {

                await client.query("ROLLBACK");

                return res.status(409).json({
                    message: "Phone number already exists"
                });
            }
        }


        // =========================
        // Create User
        // =========================

        const hashedPassword = await bcrypt.hash(password, 10); // Password Hashed

        const result = await client.query(
            `INSERT INTO users
            (name, email, phone_number, password)
            VALUES ($1, $2, $3, $4)
            RETURNING user_id, name, email, phone_number, address, role, created_at`,
            [name, email, phone_number || null, hashedPassword]
        );

        const user = result.rows[0];


        // =========================
        // Create Empty Cart
        // =========================

        await client.query(
            `INSERT INTO carts (user_id)
             VALUES ($1)`,
            [user.user_id]
        );


        // Everything successful
        await client.query("COMMIT");


        res.status(201).json({
            message: "User registered successfully",
            user: user
        });


    } catch (error) {

        await client.query("ROLLBACK");

        console.log(error);

        res.status(500).json({
            message: "Registration failed"
        });

    } finally {

        client.release();

    }

});


// =========================
// Login API
// =========================

router.post("/login", async (req, res) => {

    try {

        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({
                message: "Email and password are required"
            });
        }
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

        if (!emailRegex.test(email)) {
            return res.status(400).json({
                message: "Invalid email format"
            });
        }

        const result = await pool.query(
            "SELECT * FROM users WHERE email = $1",
            [email]
        );

        if (result.rows.length === 0) {

            return res.status(404).json({
                message: "User not found"
            });
        }

        const user = result.rows[0];

        const isPasswordCorrect = await bcrypt.compare(password, user.password);
        if (user.is_blocked) {
            return res.status(403).json({
                message: "Your account has been blocked"
            });
        }

        if (!isPasswordCorrect) {
            return res.status(401).json({
                message: "Incorrect password"
            });
        }
        const token = jwt.sign(
            {
                user_id: user.user_id,
                role: user.role,
                token_version: user.token_version

            },
            process.env.JWT_SECRET,
            {
                expiresIn: "1h"
            }
        );

        res.json({
            message: "Login successful",
            token: token,
            user: {
                user_id: user.user_id,
                name: user.name,
                email: user.email,
                phone_number: user.phone_number,
                address: user.address,
                role: user.role,
                created_at: user.created_at
            }
        });

    } catch (error) {

        console.log(error);

        res.status(500).json({
            message: "Login failed"
        });

    }

});


// =========================
// Get User Details API
// =========================

router.get("/user/:id", authMiddleware, async (req, res) => {
    try {
        const id = parseInt(req.params.id);

        if (req.user.user_id !== id) {
            return res.status(403).json({
                message: "You are not authorized to access this user's data"
            });
        }

        const result = await pool.query(
            `SELECT 
                user_id,
                name,
                email,
                phone_number,
                address,
                role,
                created_at
             FROM users
             WHERE user_id = $1`,
            [id]
        );

        if (result.rows.length === 0) {

            return res.status(404).json({
                message: "User not found"
            });
        }

        res.json(result.rows[0]);

    } catch (error) {

        console.log(error);

        res.status(500).json({
            message: "Cannot fetch user details"
        });

    }

});


// =========================
// Get all Authors
// =========================

router.get("/authors", async (req, res) => {

    try {

        const result = await pool.query(
            "SELECT * FROM authors"
        );

        res.json(result.rows);

    } catch (err) {

        res.status(500).json({
            error: err.message
        });

    }

});


// =========================
// Get all Publishers
// =========================

router.get("/publishers", async (req, res) => {

    try {

        const result = await pool.query(
            "SELECT * FROM publishers"
        );

        res.json(result.rows);

    } catch (err) {

        res.status(500).json({
            error: err.message
        });

    }

});


// =========================
// Get all Categories
// =========================

router.get("/categories", async (req, res) => {

    try {

        const result = await pool.query(
            "SELECT * FROM categories"
        );

        res.json(result.rows);

    } catch (err) {

        res.status(500).json({
            error: err.message
        });

    }

});

// =========================
// Logout API
// =========================

router.post("/logout", authMiddleware, async (req, res) => {

    try {

        await pool.query(
            `UPDATE users
             SET token_version = token_version + 1
             WHERE user_id = $1`,
            [req.user.user_id]
        );

        res.json({
            message: "Logout successful"
        });

    } catch (error) {

        console.log(error);

        res.status(500).json({
            message: "Logout failed"
        });

    }

});

// =========================
// Admin Test API
// =========================

router.get(
    "/admin-test",
    authMiddleware,
    roleMiddleware("admin"),
    (req, res) => {

        res.json({
            message: "Admin access granted"
        });

    }
);
router.get(
    "/admins",
    authMiddleware,
    roleMiddleware("superadmin"),
    async (req, res) => {

        try {

            const result = await pool.query(`
                SELECT user_id, name, email,  phone_number,role
                FROM users
                WHERE role IN ('admin', 'superadmin')
                ORDER BY user_id
            `);

            res.json(result.rows);

        } catch (error) {

            console.error(error);

            res.status(500).json({
                message: "Failed to load admins"
            });

        }

    }
);

// =========================
// Add Admin
// Superadmin Only
// =========================

router.post(
    "/admins",
    authMiddleware,
    roleMiddleware("superadmin"),
    async (req, res) => {

        try {

            const { name, email, phone_number, password } = req.body;

            if (!name || !email || !password) {
                return res.status(400).json({
                    message: "Name, email and password are required"
                });
            }
            // =========================
            // Password Strength Validation
            // =========================

            const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/;

            if (!passwordRegex.test(password)) {
                return res.status(400).json({
                    message: "Password must be at least 8 characters long and contain at least one uppercase letter, one lowercase letter, and one number"
                });
            }

            // Check existing email
            const existingUser = await pool.query(
                `SELECT user_id
                 FROM users
                 WHERE email = $1`,
                [email]
            );

            if (existingUser.rows.length > 0) {
                return res.status(400).json({
                    message: "Email already exists"
                });
            }

            // Hash password
            const hashedPassword = await bcrypt.hash(password, 10);

            // Create admin
            const result = await pool.query(
                `INSERT INTO users
                 (name, email, phone_number, password, role)
                 VALUES ($1, $2, $3, $4, 'admin')
                 RETURNING user_id, name, email, phone_number, role`,
                [
                    name,
                    email,
                    phone_number || null,
                    hashedPassword
                ]
            );

            res.status(201).json({
                message: "Admin added successfully",
                admin: result.rows[0]
            });

        } catch (error) {

            console.error(error);

            res.status(500).json({
                message: "Failed to add admin"
            });

        }

    }
);

// =========================
// Remove Admin
// Superadmin Only
// =========================

router.delete(
    "/admins/:id",
    authMiddleware,
    roleMiddleware("superadmin"),
    async (req, res) => {

        try {

            const adminId = parseInt(req.params.id);

            const result = await pool.query(
                `DELETE FROM users
                 WHERE user_id = $1
                 AND role = 'admin'
                 RETURNING user_id, name, email`,
                [adminId]
            );

            if (result.rows.length === 0) {
                return res.status(404).json({
                    message: "Admin not found"
                });
            }

            res.json({
                message: "Admin removed successfully",
                admin: result.rows[0]
            });

        } catch (error) {

            console.error(error);

            res.status(500).json({
                message: "Failed to remove admin"
            });

        }

    }
);

// =========================
// Get All Customers
// Superadmin Only
// =========================

router.get(
    "/users",
    authMiddleware,
    roleMiddleware("superadmin"),
    async (req, res) => {

        try {

            const result = await pool.query(`
                SELECT
                    user_id,
                    name,
                    email,
                    phone_number,
                    is_blocked
                FROM users
                WHERE role = 'customer'
                ORDER BY user_id
            `);

            res.json(result.rows);

        } catch (error) {

            console.error(error);

            res.status(500).json({
                message: "Failed to load users"
            });

        }

    }
);

// =========================
// Block Customer
// Superadmin Only
// =========================

router.patch(
    "/users/:id/block",
    authMiddleware,
    roleMiddleware("superadmin"),
    async (req, res) => {

        try {

            const userId = parseInt(req.params.id);

            const result = await pool.query(
                `UPDATE users
                 SET is_blocked = TRUE
                 WHERE user_id = $1
                 AND role = 'customer'
                 RETURNING user_id, name, email, is_blocked`,
                [userId]
            );

            if (result.rows.length === 0) {
                return res.status(404).json({
                    message: "Customer not found"
                });
            }

            res.json({
                message: "User blocked successfully",
                user: result.rows[0]
            });

        } catch (error) {

            console.error(error);

            res.status(500).json({
                message: "Failed to block user"
            });

        }

    }
);


// =========================
// Unblock Customer
// Superadmin Only
// =========================

router.patch(
    "/users/:id/unblock",
    authMiddleware,
    roleMiddleware("superadmin"),
    async (req, res) => {

        try {

            const userId = parseInt(req.params.id);

            const result = await pool.query(
                `UPDATE users
                 SET is_blocked = FALSE
                 WHERE user_id = $1
                 AND role = 'customer'
                 RETURNING user_id, name, email, is_blocked`,
                [userId]
            );

            if (result.rows.length === 0) {
                return res.status(404).json({
                    message: "Customer not found"
                });
            }

            res.json({
                message: "User unblocked successfully",
                user: result.rows[0]
            });

        } catch (error) {

            console.error(error);

            res.status(500).json({
                message: "Failed to unblock user"
            });

        }

    }
);

module.exports = router;