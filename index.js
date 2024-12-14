// server.js
const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");
const jwt = require("jsonwebtoken");
const cookieParser = require("cookie-parser");


const authenticateApiKey = require("./middleware/authApiKey");
const queueRoutes = require("./routes/runQueue");
const userRoutes = require("./routes/users");

const app = express();
const port = 3000;

// Middleware
app.use(express.json());
app.use(bodyParser.json());
app.use(cors({
  credentials:true
}));
app.use(cookieParser());

// Routes
app.get("/", (req, res) => {
  res.json({ message: "poy hruang wang sa gang" });
});

app.get("/auth", authenticateApiKey, (req, res) => {
  try {
    res.json({ message: "poy hruang wang sa gang is happy to see you" });
  } catch (error) {
    console.error("Error fetching data:", error.message);
    res.status(500).send("Internal server error");
  }
});

app.use("/QAPI", queueRoutes);
app.use("/user", userRoutes);
// Start server
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
