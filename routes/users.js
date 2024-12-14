const express = require("express");
const pool = require("../pool");
const jwt = require("jsonwebtoken");
const router = express.Router();

/***************************** For user *******************************/
const secretKey = "poy hruang wang sa gang";

//login
router.post("/login", async (req, res) => {
  const { username, password } = req.body;
  try {
      const result = await pool.query(
      `SELECT * FROM users WHERE username = $1 AND password = $2`,
      [username, password]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({ message: "Invalid username or password" });
    }

    const token = jwt.sign({ username }, secretKey, {
      expiresIn: "1m",
    });

    res.cookie("token", token, {
      httpOnly: true,
      secure: true,
      maxAge: 1 * 60 * 1000,
    });

    console.log({ token: token, username: username, password: password });
    res.json({ message: "Login successful", token });
  } catch (error) {
    console.error("Error fetching data:", error.message);
    res.status(500).send("Authentication failed");
  }
});

router.get("/login", async (req, res) => {
  try {
    const token = req.cookies.token;
    const decoded = jwt.verify(token, secretKey);
    console.log(decoded);
    const result = await pool.query(`SELECT * FROM users WHERE username = $1`, [
      decoded.username,
    ]);
    res.json(result.rows);
  } catch (error) {
    console.error("Error fetching data:", error.message);
    res.status(500).send("Authentication failed");
  }
});

router.post("/", async (req, res) => {
  try {

    const payload = { userId: req.body.userId || "defaultUserId" };

    // Create a JWT token
    const token = jwt.sign(payload, secretKey, {
      expiresIn: "1m",
    });

    res.cookie("token", token, {
      httpOnly: true,
      secure: true,
      maxAge: 1 * 60 * 1000,
    });

    console.log({ token: token});
    res.json({ message: "Login successful", token });
  } catch (error) {
    console.error("Error fetching data:", error.message);
    res.status(500).send("Authentication failed");
  }
});

//get users
router.get("/", async (req, res,next) => {
  try {
    const token = req.cookies.token;
    const decoded = jwt.verify(token, secretKey);
    next()
    console.log(decoded);
    const result = await pool.query(`SELECT * FROM users`);
    res.json(result.rows);
  } catch (error) {
    console.error("Error fetching data:", error.message);
    res.status(500).send("Authentication failed");
  }
});

module.exports = router;
