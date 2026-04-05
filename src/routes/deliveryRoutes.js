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

// 3. Confirmar entrega - ENVÍA WhatsApp AL CLIENTE Y AL ADMIN
router.put(
  "/entregar/:id",
  verificarToken,
  verificarRepartidor,
  async (req, res) => {
    try {
      const { id } = req.params;
      const pedido = await Order.findById(id)
        .populate("clienteId", "nombre telefono")
        .populate("repartidorId", "nombre");

      if (!pedido) {
        return res.status(404).json({ message: "Pedido no encontrado" });
      }

      // Guardar estado y fecha de entrega
      pedido.estado = "entregado";
      pedido.fechaEntrega = new Date();
      await pedido.save();

      // WhatsApp al cliente
      const telCliente = pedido.clienteId.telefono.replace(/\D/g, "");
      const mensajeCliente = `✅ ¡Hola ${pedido.clienteId.nombre}! Tu pedido ${pedido.folio} fue entregado. ¡Gracias! 🪵🔥`;
      const whatsappCliente = `https://wa.me/${telCliente}?text=${encodeURIComponent(mensajeCliente)}`;

      // Buscar admins para notificar
      const admins = await User.find({ rol: "admin", activo: true });
      const repartidorNombre = pedido.repartidorId?.nombre || "Repartidor";

      // Crear URLs de WhatsApp para cada admin
      const whatsappAdmins = admins.map((admin) => {
        const telAdmin = admin.telefono.replace(/\D/g, "");
        const mensajeAdmin = `📦 ¡Pedido Entregado!\n\n🧾 Folio: ${pedido.folio}\n👤 Cliente: ${pedido.clienteId.nombre}\n🚴 Repartidor: ${repartidorNombre}\n💰 Total: $${pedido.total}\n⏰ Hora: ${new Date().toLocaleTimeString("es-MX")}`;
        return {
          nombre: admin.nombre,
          url: `https://wa.me/${telAdmin}?text=${encodeURIComponent(mensajeAdmin)}`,
        };
      });

      res.json({
        message: `¡Pedido ${pedido.folio} entregado!`,
        pedido,
        whatsappCliente,
        whatsappAdmins,
      });
    } catch (error) {
      console.error("Error al confirmar entrega:", error);
      res.status(500).json({ message: "Error al confirmar entrega" });
    }
  },
);

// 4. Historial del día - CORREGIDO
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

      // Buscar entregados de hoy (por fechaEntrega o updatedAt)
      const entregados = await Order.find({
        repartidorId: req.user.id,
        estado: "entregado",
        $or: [
          { fechaEntrega: { $gte: hoy, $lt: manana } },
          {
            fechaEntrega: null,
            updatedAt: { $gte: hoy, $lt: manana },
          },
        ],
      })
        .populate("clienteId", "nombre")
        .sort({ fechaEntrega: -1, updatedAt: -1 });

      res.json(entregados);
    } catch (error) {
      console.error("Error historial:", error);
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
    pedido.fechaEntrega = new Date();
    await pedido.save();
    res.json({ message: "Entregado", pedido });
  } catch (error) {
    res.status(500).json({ message: "Error" });
  }
});

module.exports = router;
