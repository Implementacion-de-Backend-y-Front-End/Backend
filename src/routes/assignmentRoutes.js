const express = require("express");
const router = express.Router();
const deliveryController = require("../controllers/deliveryController");
const { verificarToken, verificarAdmin } = require("../middlewares/auth");

// Ruta para asignar (POST)
router.post(
  "/assign",
  verificarToken,
  verificarAdmin,
  deliveryController.assignOrder,
);

// LÍNEA 15: Aquí estaba el error. Asegúrate de que deliveryController tenga getMyOrders
router.get("/my-orders", verificarToken, deliveryController.getMyOrders);

// Ruta para confirmar entrega
router.put("/confirm/:id", verificarToken, deliveryController.confirmDelivery);

module.exports = router;
