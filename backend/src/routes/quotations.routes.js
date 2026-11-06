const express = require('express');
const router = express.Router();
const { getQuotations, createQuotation } = require('../controllers/quotations.controller');

router.get('/', getQuotations);
router.post('/', createQuotation);

module.exports = router;
