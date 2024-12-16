const express = require("express");
const pool = require("../pool");
const authenticateApiKey = require("../middleware/authApiKey");
const router = express.Router();

/***************************** For user *******************************/

//get initial page
router.get("/InitialQueueF", authenticateApiKey, async (req, res) => {
  try {
    res.status(200).json({
      name: "ผัดไทประตูผี สาขา บรรทัดทอง",
      qr: "https://www.youtube.com/watch?v=uVCYVC7siLo",
    });
  } catch (error) {
    console.error("Error fetching data:", error.message);
    res.status(500).send("Internal server error");
  }
});

//get queue
router.get("/RefreshQueue", authenticateApiKey, async (req, res) => {
  try {
    const result = await pool.query(`
                                      WITH group_counts AS (
                                      SELECT COUNT(DISTINCT group_table) AS group_count
                                      FROM table_frame
                                      WHERE group_table IN ('A', 'B', 'C', 'D', 'E')
                                      )
                                      SELECT group_table, group_table || '' || LPAD(number_table::text, 4, '0') AS group_number_table
                                      FROM (
                                        SELECT group_table, number_table,
                                              ROW_NUMBER() OVER (PARTITION BY group_table ORDER BY number_table DESC) AS row_num
                                        FROM table_frame
                                      ) AS ranked
                                      WHERE (
                                          -- ถ้ามีแค่ 'A' ให้เลือก 15 แถวจาก 'A'
                                          (group_table = 'A' AND row_num <= CASE 
                                              WHEN (SELECT group_count FROM group_counts) = 1 THEN 15
                                              WHEN (SELECT group_count FROM group_counts) = 2 THEN 9
                                              WHEN (SELECT group_count FROM group_counts) = 3 THEN 6
                                              WHEN (SELECT group_count FROM group_counts) = 4 THEN 6
                                              WHEN (SELECT group_count FROM group_counts) = 5 THEN 3
                                              ELSE 15
                                          END)
                                          -- ถ้ามี 'B' ให้เลือก 3 แถวจาก 'B'
                                          OR (group_table = 'B' AND row_num <= 6 AND (SELECT group_count FROM group_counts) = 2)
                                          -- ถ้ามี 'B' ให้เลือก 3 แถวจาก 'B'
                                          OR (group_table = 'B' AND row_num <= 6 AND (SELECT group_count FROM group_counts) = 3)
                                          -- ถ้ามี 'B' ให้เลือก 3 แถวจาก 'B'
                                          OR (group_table = 'B' AND row_num <= 3 AND (SELECT group_count FROM group_counts) >= 4)
                                          -- ถ้ามี 'C' ให้เลือก 3 แถวจาก 'C'
                                          OR (group_table = 'C' AND row_num <= 3 AND (SELECT group_count FROM group_counts) >= 1)
                                          -- ถ้ามี 'D' ให้เลือก 3 แถวจาก 'D'
                                          OR (group_table = 'D' AND row_num <= 3 AND (SELECT group_count FROM group_counts) >= 1)
                                          -- ถ้ามี 'E' ให้เลือก 3 แถวจาก 'E'
                                          OR (group_table = 'E' AND row_num <= 3 AND (SELECT group_count FROM group_counts) >= 1)
                                      )
                                      ORDER BY group_table, row_num
                                      LIMIT 15;
  
        `);
    res.status(200).json(result.rows);
  } catch (error) {
    console.error("Error fetching data:", error.message);
    res.status(500).send("Internal server error");
  }
});

//add queue
router.post("/RefreshQueue/:group", authenticateApiKey, async (req, res) => {
  try {
    const { group } = req.params;

    const query = `
                  WITH first_row AS (
                  SELECT "number_table"
                  FROM public.table_frame
                  WHERE "group_table" = $1
                  ORDER BY "number_table" DESC
                  LIMIT 1
                  )
                  INSERT INTO public.table_frame ("number_table", "group_table")
                  SELECT COALESCE(MAX("number_table"), 0) + 1, $1
                  FROM public.table_frame
                  WHERE "group_table" = $1;
                    `;
    const values = [group];
    await pool.query(query, values);

    res.status(200).send("Data inserted successfully");
  } catch (error) {
    console.error("Error inserting data:", error.message);
    res.status(500).send("Internal server error");
  }
});

//update queue

router.put('/CalledQueue/:group',authenticateApiKey, async (req, res) => {
  const { group } = req.params;

  try {
      // Update the record
      await pool.query(
          `UPDATE table_frame SET status_table = 1 
            WHERE number_table = (SELECT MIN(number_table) FROM table_frame WHERE group_table = $1 AND status_table = 0) AND group_table = $1`,
          [group]
      );

      // Fetch all records sorted by `updated_at` DESC
      const result = await pool.query(
          `SELECT status_table, group_table || '' || LPAD(number_table::text, 4, '0') AS group_number_table FROM table_frame 
          WHERE status_table = 1 AND group_table = $1
          ORDER BY number_table DESC
          LIMIT 1
          `,
          [group]
      );

      res.json({
          message: 'Data updated successfully.',
          data: result.rows,
      });
  } catch (error) {
      console.error('Error updating data:', error);
      res.status(500).json({ error: 'An error occurred.' });
  }
});


/***************************** For admin *******************************/

router.get("/RefreshQueue/:group", authenticateApiKey, async (req, res) => {
  const { group } = req.params;
  try {
    const result = await pool.query(
      "SELECT group_table,group_table || '' || LPAD(number_table::text, 4, '0') AS group_number_table FROM table_frame WHERE group_table = $1",
      [group]
    );
    res.status(200).json(result.rows);
  } catch (error) {
    console.error("Error fetching data:", error.message);
    res.status(500).send("Internal server error");
  }
});

router.get("/all", authenticateApiKey, async (req, res) => {
    try {
      const result = await pool.query("SELECT group_table,group_table || '' || LPAD(number_table::text, 4, '0') AS group_number_table FROM table_frame ");
      res.status(200).json(result.rows);
    } catch (error) {
    console.error("Error fetching data:", error.message);
    res.status(500).send("Internal server error");
  }
});



module.exports = router;
