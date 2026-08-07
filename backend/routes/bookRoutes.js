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


module.exports = router;