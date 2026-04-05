const express = require("express");
const router = express.Router();
const reportController = require("../controllers/reportController");
const { verificarToken, verificarAdmin } = require("../middlewares/auth");

// GET: /api/reports/daily
router.get(
  "/daily",
  verificarToken,
  verificarAdmin,
  reportController.getDailyReport,
);

// Stock crítico
router.get(
  "/stock-alerts",
  verificarToken,
  verificarAdmin,
  reportController.getStockAlerts,
);

module.exports = router;
