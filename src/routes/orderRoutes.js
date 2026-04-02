const express = require("express");
const router = express.Router();
const orderController = require("../controllers/orderController");
// Importamos ambos middlewares
const { verificarToken, verificarAdmin } = require("../middlewares/auth");

// --- RUTAS PARA CLIENTES ---
// Ver su propio historial
router.get("/historial", verificarToken, orderController.getCustomerOrders);
// Crear un pedido nuevo
router.post("/", verificarToken, orderController.createOrder);

// --- RUTAS PARA EL ADMIN (Doña María) ---
// Obtener pedidos con estado "recibido"
// Primero verifica que esté logueado, luego que sea Admin
router.get(
  "/pending",
  [verificarToken, verificarAdmin],
  orderController.getPendingOrders,
);

// (Opcional) Si luego haces la de rechazar o asignar:
// router.put("/reject/:id", [verificarToken, verificarAdmin], orderController.rejectOrder);
// router.put("/assign/:id", [verificarToken, verificarAdmin], orderController.assignOrder);

module.exports = router;
