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

// Global Middlewares
app.use(cors());
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
