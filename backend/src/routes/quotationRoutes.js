// Quotation Routes
const express = require("express");
const router = express.Router();
const quotationController = require("../controllers/quotationController");

router.get("/", quotationController.getQuotations);
router.post("/", quotationController.createQuotation);
router.post("/calculate", quotationController.previewCalculation);
router.get("/:id", quotationController.getQuotationById);
router.patch("/:id/status", quotationController.updateQuotationStatus);
router.delete("/:id", quotationController.deleteQuotation);

module.exports = router;
