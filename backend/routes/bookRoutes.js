const express = require("express");
const router = express.Router();

const pool = require("../config/db");


router.get("/", async(req,res)=>{

    try{

        const result = await pool.query(
            "SELECT * FROM books"
        );

        res.json(result.rows);

    }
    catch(error){

        console.log(error);

        res.status(500).json({
            message:"Cannot fetch books"
        });

    }

});

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

        res.json(result.rows[0]);

    }
    catch (error) {

        console.log(error);

        res.status(500).json({
            message: "Cannot fetch book details"
        });

    }

});


module.exports = router;