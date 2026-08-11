const express = require("express");
const cors = require("cors");
const pool = require("./config/db");
const path = require("path");

const authRoutes = require("./routes/auth");
const bookRoutes = require("./routes/bookRoutes");
const catalogRoutes = require("./routes/catalogRoutes"); // তোমার ফাইলের নাম অনুযায়ী path ঠিক করো
const cartRoutes = require("./routes/cartRoute");

const app = express();

const PORT = 5000;

app.use(cors());

app.use(express.json());
app.use(express.static(path.join(__dirname, "../frontend")));
app.use("/api/auth", authRoutes);
app.use("/api/books", bookRoutes);
app.use("/api", catalogRoutes); // ✅ কারণ router ভেতরে already /categories, /authors, /publishers আছে
app.use("/api/cart", cartRoutes);
app.use("/api/orders", require("./routes/orderRoute"));
app.get("/", (req, res) => {
  res.send("Boitoi BookShop Backend Running!");
});

// Database test route
app.get("/test-db", async (req, res) => {
  try {
    const result = await pool.query("SELECT NOW()");
    res.json(result.rows);
  } catch (error) {
    console.log(error);
    res.status(500).send("Database connection failed");
  }
});

app.get("/api/books-test", (req, res) => {
  res.send("Book route working");
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
