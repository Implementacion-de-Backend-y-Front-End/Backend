const express = require("express");
const router = express.Router();
const { verificarToken } = require("../middlewares/auth");
const Order = require("../models/Order");
const User = require("../models/Users");

// Middleware para verificar repartidor
const verificarRepartidor = (req, res, next) => {
  if (req.user && (req.user.rol === "repartidor" || req.user.rol === "admin")) {
    next();
  } else {
    res.status(403).json({ message: "Requiere rol de Repartidor" });
  }
};

// 1. Obtener mis rutas
router.get(
  "/mis-rutas",
  verificarToken,
  verificarRepartidor,
  async (req, res) => {
    try {
      const misPedidos = await Order.find({
        repartidorId: req.user.id,
        estado: { $in: ["enCamino", "confirmado"] },
      })
        .populate("clienteId", "nombre telefono")
        .sort({ fechaPedido: 1 })
        .limit(5);
      res.json(misPedidos);
    } catch (error) {
      res.status(500).json({ message: "Error al obtener rutas" });
    }
  },
);

// 2. Marcar "en camino"
router.put(
  "/en-camino/:id",
  verificarToken,
  verificarRepartidor,
  async (req, res) => {
    try {
      const { id } = req.params;
      const pedido = await Order.findById(id).populate(
        "clienteId",
        "nombre telefono",
      );

      if (!pedido) {
        return res.status(404).json({ message: "Pedido no encontrado" });
      }

      pedido.estado = "enCamino";
      await pedido.save();

      const telCliente = pedido.clienteId.telefono.replace(/\D/g, "");
      const mensaje = `🚴 ¡Hola ${pedido.clienteId.nombre}! Tu pedido ${pedido.folio} ya va en camino.`;
      const whatsappUrl = `https://wa.me/${telCliente}?text=${encodeURIComponent(mensaje)}`;

      res.json({ message: "¡En camino!", pedido, whatsappUrl });
    } catch (error) {
      res.status(500).json({ message: "Error al iniciar entrega" });
    }
  },
);

// 3. Confirmar entrega
router.put(
  "/entregar/:id",
  verificarToken,
  verificarRepartidor,
  async (req, res) => {
    try {
      const { id } = req.params;
      const pedido = await Order.findById(id).populate(
        "clienteId",
        "nombre telefono",
      );

      if (!pedido) {
        return res.status(404).json({ message: "Pedido no encontrado" });
      }

      pedido.estado = "entregado";
      pedido.fechaEntrega = new Date();
      await pedido.save();

      const telCliente = pedido.clienteId.telefono.replace(/\D/g, "");
      const mensaje = `✅ ¡Hola ${pedido.clienteId.nombre}! Tu pedido ${pedido.folio} fue entregado. ¡Gracias! 🪵🔥`;
      const whatsappCliente = `https://wa.me/${telCliente}?text=${encodeURIComponent(mensaje)}`;

      res.json({
        message: `¡Pedido ${pedido.folio} entregado!`,
        pedido,
        whatsappCliente,
      });
    } catch (error) {
      res.status(500).json({ message: "Error al confirmar entrega" });
    }
  },
);

// 4. Historial del día
router.get(
  "/historial",
  verificarToken,
  verificarRepartidor,
  async (req, res) => {
    try {
      const hoy = new Date();
      hoy.setHours(0, 0, 0, 0);
      const manana = new Date(hoy);
      manana.setDate(manana.getDate() + 1);

      const entregados = await Order.find({
        repartidorId: req.user.id,
        estado: "entregado",
        fechaEntrega: { $gte: hoy, $lt: manana },
      }).populate("clienteId", "nombre");

      res.json(entregados);
    } catch (error) {
      res.status(500).json({ message: "Error al obtener historial" });
    }
  },
);

// Rutas antiguas (compatibilidad)
router.get("/my-tasks", verificarToken, async (req, res) => {
  try {
    const misPedidos = await Order.find({
      repartidorId: req.user.id,
      estado: "enCamino",
    }).populate("clienteId", "nombre telefono");
    res.json(misPedidos);
  } catch (error) {
    res.status(500).json({ message: "Error" });
  }
});

router.put("/complete/:id", verificarToken, async (req, res) => {
  try {
    const pedido = await Order.findById(req.params.id);
    if (!pedido) return res.status(404).json({ message: "No encontrado" });
    pedido.estado = "entregado";
    await pedido.save();
    res.json({ message: "Entregado", pedido });
  } catch (error) {
    res.status(500).json({ message: "Error" });
  }
});

module.exports = router;
