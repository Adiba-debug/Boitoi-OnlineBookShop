const jwt = require("jsonwebtoken");
const pool = require("../config/db");

const authMiddleware = async (req, res, next) => {

    try {

        const authHeader = req.headers.authorization;

        if (!authHeader || !authHeader.startsWith("Bearer ")) {

            return res.status(401).json({
                message: "Authentication token required"
            });
        }

        const token = authHeader.split(" ")[1];

        const decoded = jwt.verify(
            token,
            process.env.JWT_SECRET
        );


        // =========================
        // Check Token Version
        // =========================

        const result = await pool.query(
            `SELECT token_version
             FROM users
             WHERE user_id = $1`,
            [decoded.user_id]
        );

        if (result.rows.length === 0) {

            return res.status(401).json({
                message: "User not found"
            });
        }

        const currentTokenVersion = result.rows[0].token_version;

        if (decoded.token_version !== currentTokenVersion) {

            return res.status(401).json({
                message: "Token is no longer valid"
            });
        }


        // Token valid
        req.user = decoded;

        next();

    } catch (error) {

        return res.status(401).json({
            message: "Invalid or expired token"
        });

    }

};

module.exports = authMiddleware;