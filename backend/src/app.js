// Express Application Setup
const express = require("express");
const cors = require("cors");
const { isUsingMock } = require("./config/db");

// Route imports
const dashboardRoutes = require("./routes/dashboardRoutes");
const purchaseRoutes = require("./routes/purchaseRoutes");
const quotationRoutes = require("./routes/quotationRoutes");
const inventoryRoutes = require("./routes/inventoryRoutes");
const customerRoutes = require("./routes/customerRoutes");
const supplierRoutes = require("./routes/supplierRoutes");

// Middleware imports
const errorHandler = require("./middlewares/errorHandler");

const app = express();

// Configurable CORS Configuration
const allowedOrigins = process.env.CORS_ORIGIN
  ? process.env.CORS_ORIGIN.split(",").map((o) => o.trim())
  : ["http://localhost:3000", "http://127.0.0.1:3000", "http://localhost:5173"];

const corsOptions = {
  origin: (origin, callback) => {
    // Allow non-browser requests (mobile, server-to-server, curl) or if wildcard is configured
    if (!origin || allowedOrigins.includes("*") || allowedOrigins.includes(origin)) {
      return callback(null, true);
    }
    // Allow any localhost / 127.0.0.1 port in non-production environments
    if (process.env.NODE_ENV !== "production" && /^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin)) {
      return callback(null, true);
    }
    return callback(new Error(`CORS policy blocked request from origin: ${origin}`));
  },
  credentials: true,
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With"],
};

// Global Middlewares
app.use(cors(corsOptions));
app.options("*", cors(corsOptions));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health Check Endpoint
app.get("/api/health", (req, res) => {
  res.json({
    status: "ok",
    service: "Glass Production Facility ERP Backend",
    timestamp: new Date().toISOString(),
    database: isUsingMock() ? "In-Memory Mock Database" : "PostgreSQL (Prisma)"
  });
});

// Mount Functional Sub-modules
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/purchases", purchaseRoutes);
app.use("/api/quotations", quotationRoutes);
app.use("/api/inventory", inventoryRoutes);
app.use("/api/customers", customerRoutes);
app.use("/api/suppliers", supplierRoutes);

// 404 Not Found Handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: `Route not found: ${req.method} ${req.originalUrl}`
  });
});

// Centralized Error Handler
app.use(errorHandler);

module.exports = app;
