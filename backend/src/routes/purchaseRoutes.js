// Purchase Routes
const express = require("express");
const router = express.Router();
const purchaseController = require("../controllers/purchaseController");

router.get("/", purchaseController.getPurchases);
router.post("/", purchaseController.createPurchase);
router.get("/:id", purchaseController.getPurchaseById);
router.patch("/:id/status", purchaseController.updatePurchaseStatus);

module.exports = router;
