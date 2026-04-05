const Order = require("../models/Order");
const User = require("../models/Users");

// 1. OBTENER MIS RUTAS DEL DÍA (máximo 5 pedidos)
exports.getMyRoutes = async (req, res) => {
  try {
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);

    const misPedidos = await Order.find({
      repartidorId: req.user.id,
      estado: { $in: ["enCamino", "confirmado"] },
    })
      .populate("clienteId", "nombre telefono")
      .sort({ fechaPedido: 1 })
      .limit(5);

    res.json(misPedidos);
  } catch (error) {
    console.error("Error al obtener rutas:", error);
    res.status(500).json({ message: "Error al obtener tus rutas" });
  }
};

// 2. MARCAR "EN CAMINO" - Notifica al cliente por WhatsApp
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

    // Generar link de WhatsApp para el cliente
    const telCliente = pedido.clienteId.telefono.replace(/\D/g, "");
    const mensaje = `🚴 ¡Hola ${pedido.clienteId.nombre}! Tu pedido ${pedido.folio} de Leños Rellenos ya va en camino. ¡Prepárate para recibirlo!`;
    const whatsappUrl = `https://wa.me/${telCliente}?text=${encodeURIComponent(mensaje)}`;

    res.json({
      message: "¡En camino!",
      pedido,
      whatsappUrl,
    });
  } catch (error) {
    console.error("Error al iniciar entrega:", error);
    res.status(500).json({ message: "Error al iniciar la entrega" });
  }
};

// 3. CONFIRMAR ENTREGA - Notifica al cliente y admin
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

    if (pedido.repartidorId.toString() !== req.user.id) {
      return res.status(403).json({ message: "Este pedido no te pertenece" });
    }

    pedido.estado = "entregado";
    pedido.fechaEntrega = new Date();
    await pedido.save();

    // WhatsApp para el cliente
    const telCliente = pedido.clienteId.telefono.replace(/\D/g, "");
    const mensajeCliente = `✅ ¡Hola ${pedido.clienteId.nombre}! Tu pedido ${pedido.folio} ha sido entregado. ¡Gracias por tu preferencia! 🪵🔥`;
    const whatsappCliente = `https://wa.me/${telCliente}?text=${encodeURIComponent(mensajeCliente)}`;

    res.json({
      message: `¡Pedido ${pedido.folio} entregado con éxito!`,
      pedido,
      whatsappCliente,
    });
  } catch (error) {
    console.error("Error al confirmar entrega:", error);
    res.status(500).json({ message: "Error al confirmar la entrega" });
  }
};

// 4. VER DETALLE DE UN PEDIDO
exports.getOrderDetail = async (req, res) => {
  try {
    const { id } = req.params;

    const pedido = await Order.findById(id).populate(
      "clienteId",
      "nombre telefono direcciones",
    );

    if (!pedido) {
      return res.status(404).json({ message: "Pedido no encontrado" });
    }

    if (pedido.repartidorId.toString() !== req.user.id) {
      return res.status(403).json({ message: "Este pedido no te pertenece" });
    }

    res.json(pedido);
  } catch (error) {
    console.error("Error al obtener detalle:", error);
    res.status(500).json({ message: "Error al obtener el detalle" });
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
    console.error("Error al obtener historial:", error);
    res.status(500).json({ message: "Error al obtener historial" });
  }
};
