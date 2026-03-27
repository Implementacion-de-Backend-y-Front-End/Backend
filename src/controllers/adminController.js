const Order = require("../models/Order");

// 1. OBTENER PEDIDOS PENDIENTES (Estado: recibido)
exports.getPendingOrders = async (req, res) => {
  try {
    const pedidosPendientes = await Order.find({ estado: "recibido" })
      .populate("clienteId", "nombre telefono direcciones")
      .sort({ createdAt: -1 });

    console.log(JSON.stringify(pedidosPendientes, null, 2));
    res.json(pedidosPendientes);
  } catch (error) {
    console.error("Error al obtener pedidos pendientes:", error);
    res.status(500).json({
      message: "Error al obtener pedidos pendientes",
      error: error.message,
    });
  }
};

// 2. ACEPTAR PEDIDO (Agregada la URL de WhatsApp para Postman)
exports.acceptOrder = async (req, res) => {
  try {
    const { id } = req.params;

    const pedido = await Order.findByIdAndUpdate(
      id,
      { estado: "confirmado" },
      { new: true },
    ).populate("clienteId", "nombre telefono");

    if (!pedido) {
      return res.status(404).json({ message: "No se encontró el pedido." });
    }

    // NORMALIZACIÓN: Quitamos el + del teléfono para la URL
    const telefono = pedido.clienteId.telefono.replace("+", "");

    // USAMOS pedido.folio EN LUGAR DE pedido._id
    const mensaje = `Hola ${pedido.clienteId.nombre}, tu pedido de Leños con folio ${pedido.folio} ha sido confirmado y está en preparación. 🔥`;

    const whatsappUrl = `https://api.whatsapp.com/send?phone=${telefono}&text=${encodeURIComponent(mensaje)}`;

    res.json({
      message: "¡Pedido confirmado con éxito! Ya puede ser asignado.",
      whatsappUrl,
      pedido,
    });
  } catch (error) {
    res.status(500).json({ message: "Error al aceptar", error: error.message });
  }
};
// 3. RECHAZAR/CANCELAR PEDIDO
exports.rejectOrder = async (req, res) => {
  try {
    const { id } = req.params;
    const pedido = await Order.findByIdAndUpdate(
      id,
      { estado: "cancelado" },
      { new: true },
    );

    if (!pedido) {
      return res.status(404).json({ message: "Pedido no encontrado." });
    }

    res.json({ message: "El pedido ha sido cancelado.", pedido });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error al cancelar", error: error.message });
  }
};

// 4. OBTENER PEDIDOS ENTREGADOS
exports.getCompletedOrders = async (req, res) => {
  try {
    const entregados = await Order.find({ estado: "entregado" })
      .populate("clienteId", "nombre")
      .populate("repartidorId", "nombre")
      .sort({ updatedAt: -1 });

    res.json(entregados);
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error al obtener historial de entregados" });
  }
};
