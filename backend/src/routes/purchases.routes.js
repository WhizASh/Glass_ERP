const router = require('express').Router();
const { getPurchases, createPurchase } = require('../controllers/purchases.controller');

router.get('/', getPurchases);
router.post('/', createPurchase);

module.exports = router;
