const express = require('express');
const router = express.Router();

router.get('/', (req, res) => {
  res.json({
    status: 'ok',
    service: 'Glass ERP Backend API',
    timestamp: new Date().toISOString()
  });
});

module.exports = router;
