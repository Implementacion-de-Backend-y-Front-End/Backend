const express = require("express");
const router = express.Router();
const deliveryController = require("../controllers/deliveryController");
const { verificarToken } = require("../middlewares/auth");

// Middleware para verificar que es repartidor
const verificarRepartidor = (req, res, next) => {
  if (req.user && (req.user.rol === "repartidor" || req.user.rol === "admin")) {
    next();
  } else {
    res.status(403).json({
      message: "Acceso denegado. Esta acción requiere rol de Repartidor.",
    });
  }
};

// 1. Obtener mis rutas del día (máximo 5)
router.get(
  "/mis-rutas",
  verificarToken,
  verificarRepartidor,
  deliveryController.getMyRoutes,
);

// 2. Marcar pedido como "en camino" (notifica al cliente)
router.put(
  "/en-camino/:id",
  verificarToken,
  verificarRepartidor,
  deliveryController.startDelivery,
);

// 3. Confirmar entrega (notifica a cliente y admin)
router.put(
  "/entregar/:id",
  verificarToken,
  verificarRepartidor,
  deliveryController.confirmDelivery,
);

// 4. Ver detalle de un pedido
router.get(
  "/pedido/:id",
  verificarToken,
  verificarRepartidor,
  deliveryController.getOrderDetail,
);

// 5. Historial de entregas del día
router.get(
  "/historial",
  verificarToken,
  verificarRepartidor,
  deliveryController.getMyDeliveredToday,
);

module.exports = router;
