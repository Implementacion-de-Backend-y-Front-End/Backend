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

// Aceptar pedido
router.put(
  "/accept/:id",
  verificarToken,
  verificarAdmin,
  adminController.acceptOrder,
);

// Rechazar pedido
router.put(
  "/reject/:id",
  verificarToken,
  verificarAdmin,
  adminController.rejectOrder,
);

// Asignar repartidor al pedido
router.put(
  "/assign/:id",
  verificarToken,
  verificarAdmin,
  adminController.assignDelivery,
);

router.get(
  "/completed",
  verificarToken,
  verificarAdmin,
  adminController.getCompletedOrders,
);

module.exports = router;
