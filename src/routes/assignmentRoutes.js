const express = require("express");
const router = express.Router();
const { verificarToken, verificarAdmin } = require("../middlewares/auth");
const Order = require("../models/Order");
const User = require("../models/Users");

// 1. ASIGNAR PEDIDO A REPARTIDOR
router.post("/assign", verificarToken, verificarAdmin, async (req, res) => {
  try {
    const { pedidoId, repartidorId } = req.body;

    if (!pedidoId || !repartidorId) {
      return res
        .status(400)
        .json({ message: "Debes enviar pedidoId y repartidorId" });
    }

    const pedido = await Order.findById(pedidoId).populate(
      "clienteId",
      "nombre telefono",
    );

    if (!pedido) {
      return res.status(404).json({ message: "Pedido no encontrado" });
    }

    const repartidor = await User.findOne({
      _id: repartidorId,
      rol: "repartidor",
    });
    if (!repartidor) {
      return res.status(404).json({ message: "Repartidor no válido" });
    }

    pedido.estado = "enCamino";
    pedido.repartidorId = repartidorId;
    await pedido.save();

    const telRepartidor = repartidor.telefono.replace(/\D/g, "");
    const mensaje = `🚴 ¡Hola ${repartidor.nombre}! Se te asignó el pedido ${pedido.folio}. Dirección: ${pedido.direccion?.calle || "Ver en orden"}.`;
    const whatsappUrl = `https://wa.me/${telRepartidor}?text=${encodeURIComponent(mensaje)}`;

    res.json({
      message: `Pedido asignado a ${repartidor.nombre}`,
      pedido,
      whatsappUrl,
    });
  } catch (error) {
    console.error("Error al asignar:", error);
    res.status(500).json({ message: "Error al asignar", error: error.message });
  }
});

// 2. OBTENER MIS PEDIDOS (Repartidor)
router.get("/my-orders", verificarToken, async (req, res) => {
  try {
    const misPedidos = await Order.find({
      repartidorId: req.user.id,
      estado: { $in: ["enCamino", "confirmado"] },
    }).populate("clienteId", "nombre telefono");
    res.json(misPedidos);
  } catch (error) {
    res.status(500).json({ message: "Error al obtener pedidos" });
  }
});

// 3. CONFIRMAR ENTREGA
router.put("/confirm/:id", verificarToken, async (req, res) => {
  try {
    const { id } = req.params;
    const pedido = await Order.findById(id);

    if (!pedido) {
      return res.status(404).json({ message: "Pedido no encontrado" });
    }

    pedido.estado = "entregado";
    pedido.fechaEntrega = new Date();
    await pedido.save();

    res.json({ message: `¡Pedido ${pedido.folio} entregado!`, pedido });
  } catch (error) {
    res.status(500).json({ message: "Error al confirmar entrega" });
  }
});

module.exports = router;
