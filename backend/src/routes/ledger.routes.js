const router = require('express').Router();
const { getParties, getLedger, createReceipt } = require('../controllers/ledger.controller');

router.get('/parties', getParties);
router.get('/', getLedger);
router.get('/:customerId', getLedger);
router.post('/:customerId/receipts', createReceipt);

module.exports = router;
