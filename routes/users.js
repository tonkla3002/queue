const express = require("express");
const pool = require("../pool");
const jwt = require("jsonwebtoken");
const router = express.Router();

/***************************** For user *******************************/
const secretKey = "poy hruang wang sa gang";


router.get("/", async (req, res) => {
  try {
    const token = req.cookies.token;
    const decoded = jwt.verify(token, secretKey);
    const result = await pool.query(
      "SELECT group_table,group_table || '' || LPAD(number_table::text, 4, '0') AS group_number_table FROM table_frame WHERE token = $1",
      [token]
    );
    res.status(200).json(result.rows);
  } catch (error) {
    console.error("Error fetching data:", error.message);
    res.status(500).send("Internal server error");
  }
});


router.post("/:group", async (req, res,next) => {
  const group = req.params.group;
  try {
    const payload = { userId: req.body.userId || "defaultUserId" };

    const token = jwt.sign(payload, secretKey, {
      expiresIn: "1m",
    });

    res.cookie("token", token, {
      httpOnly: true,
      secure: true,
      maxAge: 1 * 60 * 1000,
    });
    const result = await pool.query(`WITH first_row AS (
                                    SELECT "number_table"
                                    FROM public.table_frame
                                    WHERE "group_table" = $1
                                    ORDER BY "number_table" DESC
                                    LIMIT 1
                                    )
                                    INSERT INTO public.table_frame ("number_table", "group_table",token)
                                    SELECT COALESCE(MAX("number_table"), 0) + 1, $1, $2
                                    FROM public.table_frame
                                    WHERE "group_table" = $1;`, [group,token]);
    res.json({message:"success",group:group});
  } catch (error) {
    console.error("Error fetching data:", error.message);
    res.status(500).send("Authentication failed");
  }
});

module.exports = router;
