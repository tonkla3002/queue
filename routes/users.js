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

router.post("/:group", async (req, res, next) => {
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
    const result = await pool.query(
      `WITH first_row AS (
                                    SELECT "number_table"
                                    FROM public.table_frame
                                    WHERE "group_table" = $1
                                    ORDER BY "number_table" DESC
                                    LIMIT 1
                                    )
                                    INSERT INTO public.table_frame ("number_table", "group_table",token)
                                    SELECT COALESCE(MAX("number_table"), 0) + 1, $1, $2
                                    FROM public.table_frame
                                    WHERE "group_table" = $1;`,
      [group, token]
    );
    res.json({ message: "success", group: group });
  } catch (error) {
    console.error("Error fetching data:", error.message);
    res.status(500).send("Authentication failed");
  }
});

router.get("/lastestQueueCall", async (req, res) => {
  const result = await pool.query(`WITH group_counts AS (
                                  SELECT COUNT(DISTINCT group_table) AS group_count
                                  FROM table_frame
                                  WHERE group_table IN ('A', 'B', 'C', 'D', 'E')
                                  )
                                  SELECT group_table, status_table, 
                                        group_table || LPAD(number_table::text, 4, '0') AS group_number_table
                                  FROM (
                                      SELECT group_table, number_table, status_table,
                                            ROW_NUMBER() OVER (PARTITION BY group_table ORDER BY number_table DESC) AS row_num
                                      FROM table_frame
                                      WHERE status_table = 1  -- Add the condition for status
                                  ) AS ranked
                                  WHERE (
                                  -- ถ้ามีแค่ 'A' ให้เลือก 15 แถวจาก 'A'
                                  (group_table = 'A' AND row_num <= CASE 
                                      WHEN (SELECT group_count FROM group_counts) >= 1 THEN 1
                                  END)
                                  -- ถ้ามี 'B' ให้เลือก 3 แถวจาก 'B'
                                  OR (group_table = 'B' AND row_num = 1 AND (SELECT group_count FROM group_counts) >= 1)
                                  -- ถ้ามี 'C' ให้เลือก 3 แถวจาก 'C'
                                  OR (group_table = 'C' AND row_num = 1 AND (SELECT group_count FROM group_counts) >= 1)
                                  -- ถ้ามี 'D' ให้เลือก 3 แถวจาก 'D'
                                  OR (group_table = 'D' AND row_num = 1 AND (SELECT group_count FROM group_counts) >= 1)
                                  -- ถ้ามี 'E' ให้เลือก 3 แถวจาก 'E'
                                  OR (group_table = 'E' AND row_num = 1 AND (SELECT group_count FROM group_counts) >= 1)
                                  )
                                  ORDER BY group_table ASC, row_num DESC; -- Ensure descending order
    `);
  res.json(result.rows);
});

router.get("/lastestQueue", async (req, res) => {
  const result = await pool.query(`
                                    WITH group_counts AS (
                                    SELECT COUNT(DISTINCT group_table) AS group_count
                                    FROM table_frame
                                    WHERE group_table IN ('A', 'B', 'C', 'D', 'E')
                                  )
                                  SELECT group_table, status_table, 
                                        group_table || LPAD(number_table::text, 4, '0') AS group_number_table
                                  FROM (
                                      SELECT group_table, number_table, status_table,
                                            ROW_NUMBER() OVER (PARTITION BY group_table ORDER BY number_table DESC) AS row_num
                                      FROM table_frame
                                      WHERE status_table = 0  -- Add the condition for status
                                  ) AS ranked
                                  WHERE (
                                  -- ถ้ามีแค่ 'A' ให้เลือก 15 แถวจาก 'A'
                                  (group_table = 'A' AND row_num <= CASE 
                                      WHEN (SELECT group_count FROM group_counts) >= 1 THEN 1
                                  END)
                                  -- ถ้ามี 'B' ให้เลือก 3 แถวจาก 'B'
                                  OR (group_table = 'B' AND row_num = 1 AND (SELECT group_count FROM group_counts) >= 1)
                                  -- ถ้ามี 'C' ให้เลือก 3 แถวจาก 'C'
                                  OR (group_table = 'C' AND row_num = 1 AND (SELECT group_count FROM group_counts) >= 1)
                                  -- ถ้ามี 'D' ให้เลือก 3 แถวจาก 'D'
                                  OR (group_table = 'D' AND row_num = 1 AND (SELECT group_count FROM group_counts) >= 1)
                                  -- ถ้ามี 'E' ให้เลือก 3 แถวจาก 'E'
                                  OR (group_table = 'E' AND row_num = 1 AND (SELECT group_count FROM group_counts) >= 1)
                                  )
                                  ORDER BY group_table ASC, row_num DESC; -- Ensure descending order
    `);
  res.json(result.rows);
});

module.exports = router;
