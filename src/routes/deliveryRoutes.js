const express = require("express");
const router = express.Router();
const deliveryController = require("../controllers/deliveryController");
const auth = require("../middlewares/auth");

// 1. Ver mis tareas (El ID se saca del token automáticamente)
// URL en Postman: GET /api/delivery/my-tasks
router.get("/my-tasks", auth.verificarToken, deliveryController.getMyOrders);

// 2. Marcar como entregado (Pasamos el ID del pedido en la URL)
// URL en Postman: PUT /api/delivery/complete/ID_DEL_PEDIDO
router.put(
  "/complete/:id",
  auth.verificarToken,
  deliveryController.confirmDelivery,
);

module.exports = router;
