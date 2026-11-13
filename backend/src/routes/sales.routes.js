const express = require('express');
const router = express.Router();
const {
  getSales,
  getSaleById,
  createSale,
  updateSale,
  toggleSaleLock
} = require('../controllers/sales.controller');

router.get('/', getSales);
router.get('/:id', getSaleById);
router.post('/', createSale);
router.put('/:id', updateSale);
router.patch('/:id/lock', toggleSaleLock);

module.exports = router;
