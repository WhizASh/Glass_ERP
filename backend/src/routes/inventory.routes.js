const router = require('express').Router();
const { getInventory, saveInventory, deleteInventory } = require('../controllers/inventory.controller');

router.get('/', getInventory);
router.post('/', saveInventory);
router.put('/:id', saveInventory);
router.delete('/:id', deleteInventory);

module.exports = router;
