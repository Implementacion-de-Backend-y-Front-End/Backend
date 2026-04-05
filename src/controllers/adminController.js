const Order = require("../models/Order");
const User = require("../models/Users");

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

// 2. CONFIRMAR PEDIDO (Envía WhatsApp al cliente)
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

    const telefono = pedido.clienteId.telefono.replace(/\D/g, "");
    const mensaje = `🔥 ¡Hola ${pedido.clienteId.nombre}! Tu pedido ${pedido.folio} de Leños Rellenos ha sido CONFIRMADO y está en preparación. ¡Gracias por tu preferencia!`;
    const whatsappUrl = `https://wa.me/${telefono}?text=${encodeURIComponent(mensaje)}`;

    res.json({
      message: "¡Pedido confirmado con éxito!",
      whatsappUrl,
      pedido,
    });
  } catch (error) {
    res.status(500).json({ message: "Error al aceptar", error: error.message });
  }
};

// 3. ASIGNAR REPARTIDOR (Envía WhatsApp al repartidor)
exports.assignDelivery = async (req, res) => {
  try {
    const { id } = req.params;
    const { repartidorId } = req.body;

    const pedido = await Order.findById(id).populate(
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

    // WhatsApp para el repartidor
    const telRepartidor = repartidor.telefono.replace(/\D/g, "");
    const direccion = pedido.direccion
      ? `${pedido.direccion.calle}, ${pedido.direccion.colonia}`
      : "Ver en la orden";
    const referencia = pedido.direccion?.referencia || "Sin referencia";
    const mensaje = `🚴 ¡Hola ${repartidor.nombre}! Se te asignó el pedido ${pedido.folio}.\n\n📍 Dirección: ${direccion}\n📝 Referencia: ${referencia}\n👤 Cliente: ${pedido.clienteId.nombre}\n📞 Tel: ${pedido.clienteId.telefono}\n💰 Total: $${pedido.total}`;
    const whatsappUrl = `https://wa.me/${telRepartidor}?text=${encodeURIComponent(mensaje)}`;

    res.json({
      message: `Pedido asignado a ${repartidor.nombre}`,
      whatsappUrl,
      pedido,
    });
  } catch (error) {
    console.error("Error al asignar:", error);
    res.status(500).json({ message: "Error al asignar", error: error.message });
  }
};

// 4. RECHAZAR/CANCELAR PEDIDO
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

// 5. OBTENER PEDIDOS ENTREGADOS
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
