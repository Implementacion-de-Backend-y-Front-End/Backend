const Order = require("../models/Order");
const User = require("../models/Users");

// 1. ASIGNAR PEDIDO (Admin)
exports.assignOrder = async (req, res) => {
  try {
    const { pedidoId, repartidorId } = req.body;

    if (!pedidoId || !repartidorId) {
      return res
        .status(400)
        .json({ message: "Debes enviar pedidoId y repartidorId" });
    }

    const pedido = await Order.findById(pedidoId).populate({
      path: "clienteId",
      model: "User",
    });

    if (!pedido) {
      return res.status(404).json({ message: "Pedido no encontrado" });
    }

    if (!pedido.clienteId) {
      return res.status(400).json({
        message: "El pedido no tiene un cliente válido en la base de datos.",
      });
    }

    const repartidor = await User.findOne({
      _id: repartidorId,
      rol: "repartidor",
    });
    if (!repartidor) {
      return res
        .status(404)
        .json({ message: "Repartidor no válido o no encontrado" });
    }

    pedido.estado = "enCamino";
    pedido.repartidorId = repartidorId;
    await pedido.save();

    const telCliente = pedido.clienteId.telefono.replace(/\D/g, "");
    const telRepartidor = repartidor.telefono.replace(/\D/g, "");

    const msjCliente = `Hola ${pedido.clienteId.nombre}, tu pedido ${pedido.folio} ya va en camino con ${repartidor.nombre}.`;
    const msjRepartidor = `¡Hola ${repartidor.nombre}! Tienes el pedido ${pedido.folio}. Dirección: ${pedido.direccion?.calle || "Ver en orden"}.`;

    res.json({
      message: `Pedido ${pedido.folio} asignado a ${repartidor.nombre}`,
      pedido,
      notificaciones: {
        whatsappCliente: `https://wa.me/${telCliente}?text=${encodeURIComponent(msjCliente)}`,
        whatsappRepartidor: `https://wa.me/${telRepartidor}?text=${encodeURIComponent(msjRepartidor)}`,
      },
    });
  } catch (error) {
    console.error("ERROR CRÍTICO:", error);
    res.status(500).json({ message: "Error al asignar", error: error.message });
  }
};

// 2. OBTENER MIS RUTAS (Repartidor) - máximo 5
exports.getMyOrders = async (req, res) => {
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
    res.status(500).json({ message: "Error al obtener pedidos" });
  }
};

// 3. MARCAR "EN CAMINO" - Notifica al cliente
exports.startDelivery = async (req, res) => {
  try {
    const { id } = req.params;

    const pedido = await Order.findById(id).populate(
      "clienteId",
      "nombre telefono",
    );

    if (!pedido) {
      return res.status(404).json({ message: "Pedido no encontrado" });
    }

    if (pedido.repartidorId.toString() !== req.user.id) {
      return res.status(403).json({ message: "Este pedido no te pertenece" });
    }

    pedido.estado = "enCamino";
    await pedido.save();

    const telCliente = pedido.clienteId.telefono.replace(/\D/g, "");
    const mensaje = `🚴 ¡Hola ${pedido.clienteId.nombre}! Tu pedido ${pedido.folio} de Leños Rellenos ya va en camino. ¡Prepárate!`;
    const whatsappUrl = `https://wa.me/${telCliente}?text=${encodeURIComponent(mensaje)}`;

    res.json({
      message: "¡En camino!",
      pedido,
      whatsappUrl,
    });
  } catch (error) {
    res.status(500).json({ message: "Error al iniciar la entrega" });
  }
};

// 4. CONFIRMAR ENTREGA
exports.confirmDelivery = async (req, res) => {
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
    const mensajeCliente = `✅ ¡Hola ${pedido.clienteId.nombre}! Tu pedido ${pedido.folio} ha sido entregado. ¡Gracias por tu preferencia! 🪵🔥`;
    const whatsappCliente = `https://wa.me/${telCliente}?text=${encodeURIComponent(mensajeCliente)}`;

    res.json({
      message: `¡Pedido ${pedido.folio} entregado!`,
      pedido,
      whatsappCliente,
    });
  } catch (error) {
    res.status(500).json({ message: "Error al confirmar entrega" });
  }
};

// 5. HISTORIAL DE ENTREGAS DEL DÍA
exports.getMyDeliveredToday = async (req, res) => {
  try {
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);

    const manana = new Date(hoy);
    manana.setDate(manana.getDate() + 1);

    const entregados = await Order.find({
      repartidorId: req.user.id,
      estado: "entregado",
      fechaEntrega: { $gte: hoy, $lt: manana },
    })
      .populate("clienteId", "nombre")
      .sort({ fechaEntrega: -1 });

    res.json(entregados);
  } catch (error) {
    res.status(500).json({ message: "Error al obtener historial" });
  }
};
