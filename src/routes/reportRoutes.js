const express = require("express");
const router = express.Router();
const reportController = require("../controllers/reportController");

// GET: /api/reports/daily
router.get("/daily", reportController.getDailyReport);

module.exports = router;
