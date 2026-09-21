const express = require("express"); 
const cors = require("cors");
const pool = require("./config/db");
const path = require("path");

const authRoutes = require("./routes/auth");
const bookRoutes = require("./routes/bookRoutes");
const catalogRoutes = require("./routes/catalogRoutes"); // file wise name fixing
const cartRoutes = require("./routes/cartRoute");
const reviewRoutes = require("./routes/reviewRoutes");

const app = express();

const PORT = 5000;

app.use(cors());

app.use(express.json());
app.use(express.static(path.join(__dirname, "../frontend")));
app.use("/api/auth", authRoutes);
app.use("/api/books", bookRoutes);
app.use("/api", catalogRoutes); // router already has /categories, /authors, /publishers
app.use("/api/cart", cartRoutes);
app.use("/api/reviews", reviewRoutes);
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
