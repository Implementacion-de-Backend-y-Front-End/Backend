// src/routes/adminRoutes.js
const express = require("express");
const router = express.Router();
const adminController = require("../controllers/adminController");
const { verificarToken, verificarAdmin } = require("../middlewares/auth");

// Ver pedidos pendientes
router.get(
  "/pending",
  verificarToken,
  verificarAdmin,
  adminController.getPendingOrders,
);

// Confirmar pedido (envía WhatsApp al cliente)
router.put(
  "/accept/:id",
  verificarToken,
  verificarAdmin,
  adminController.acceptOrder,
);

// Asignar repartidor (envía WhatsApp al repartidor)
router.put(
  "/assign/:id",
  verificarToken,
  verificarAdmin,
  adminController.assignDelivery,
);

// Rechazar pedido
router.put(
  "/reject/:id",
  verificarToken,
  verificarAdmin,
  adminController.rejectOrder,
);

// Pedidos completados
router.get(
  "/completed",
  verificarToken,
  verificarAdmin,
  adminController.getCompletedOrders,
);

module.exports = router;
