const express = require("express");
const router = express.Router();
const orderController = require("../controllers/orderController");
const { verificarToken } = require("../middlewares/auth");

// GET: /api/orders/historial (Usamos el token para saber de quién son los pedidos)
router.get("/historial", verificarToken, orderController.getCustomerOrders);

// POST: /api/orders (SOLO UNA VEZ y con el middleware verificarToken)
router.post("/", verificarToken, orderController.createOrder);

module.exports = router;
