const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const connectDB = require("./config/db");

dotenv.config();
connectDB();

const app = express();

const allowedOrigins = [
  process.env.CLIENT_URL,
  "https://pos.rockyitservices.com",
  "http://localhost:5173",
].filter(Boolean);

app.use(cors({ origin: allowedOrigins, credentials: true }));
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

app.use("/api/auth", require("./routes/authRoutes"));
app.use("/api/admin", require("./routes/superAdminRoutes"));
app.use("/api/business", require("./routes/businessRoutes"));
app.use("/api/categories", require("./routes/categoryRoutes"));
app.use("/api/menu-items", require("./routes/menuItemRoutes"));
app.use("/api/bills", require("./routes/billRoutes"));
app.use("/api/expenses", require("./routes/expenseRoutes"));
app.use("/api/revenue", require("./routes/revenueRoutes"));

app.get("/api/health", (req, res) => {
  res.json({ status: "OK", message: "POS Backend is running" });
});

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: err.message || "Internal Server Error" });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
