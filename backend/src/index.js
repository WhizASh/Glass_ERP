const express = require('express');
const cors = require('cors');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;
const CLIENT_URL = process.env.CLIENT_URL || 'http://localhost:5173';

// Configure CORS with CLIENT_URL from .env
app.use(cors({
  origin: CLIENT_URL,
  credentials: true
}));

app.use(express.json());

// Register API Routes
const healthRoutes = require('./routes/health.routes');
const dashboardRoutes = require('./routes/dashboard.routes');
const customersRoutes = require('./routes/customers.routes');
const productsRoutes = require('./routes/products.routes');
const quotationsRoutes = require('./routes/quotations.routes');
const salesRoutes = require('./routes/sales.routes');

app.use('/api/health', healthRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/customers', customersRoutes);
app.use('/api/products', productsRoutes);
app.use('/api/quotations', quotationsRoutes);
app.use('/api/sales', salesRoutes);

// Global error handler
app.use((err, req, res, next) => {
  console.error('Unhandled server error:', err);
  res.status(500).json({ error: 'Internal Server Error' });
});

if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`Glass ERP Backend running on port ${PORT}`);
    console.log(`CORS allowed origin: ${CLIENT_URL}`);
  });
}

module.exports = app;
