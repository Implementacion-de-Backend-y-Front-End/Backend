const Order = require("../models/Order");
const User = require("../models/Users");

// 1. ASIGNAR PEDIDO (Doña María / Admin)
exports.assignOrder = async (req, res) => {
  try {
    const { pedidoId, repartidorId } = req.body;

    if (!pedidoId || !repartidorId) {
      return res
        .status(400)
        .json({ message: "Debes enviar pedidoId y repartidorId" });
    }

    // Buscamos el pedido. IMPORTANTE: Usamos 'clienteId' que es como está en tu modelo
    const pedido = await Order.findById(pedidoId).populate({
      path: "clienteId",
      model: "User", // Forzamos a Mongoose a buscar en el modelo 'User'
    });

    // LOG DE DEPURACIÓN: Revisa tu terminal de VS Code al ejecutar esto
    console.log("Pedido encontrado:", pedido ? "SÍ" : "NO");
    if (pedido) console.log("Cliente poblado:", pedido.clienteId ? "SÍ" : "NO");

    if (!pedido) {
      return res.status(404).json({ message: "Pedido no encontrado" });
    }

    // Esta es la validación que te está fallando
    if (!pedido.clienteId) {
      return res.status(400).json({
        message:
          "El pedido no tiene un cliente válido en la base de datos. Asegúrate de que el ID del cliente en el pedido coincida con un usuario real.",
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

    // Actualizamos el pedido
    pedido.estado = "enCamino";
    pedido.repartidorId = repartidorId;
    await pedido.save();

    // Notificaciones WhatsApp
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

// 2. OBTENER MIS PEDIDOS (Repartidor)
exports.getMyOrders = async (req, res) => {
  try {
    const misPedidos = await Order.find({
      repartidorId: req.user.id,
      estado: "enCamino",
    }).populate("clienteId", "nombre telefono");
    res.json(misPedidos);
  } catch (error) {
    res.status(500).json({ message: "Error al obtener pedidos" });
  }
};

// 3. CONFIRMAR ENTREGA
exports.confirmDelivery = async (req, res) => {
  try {
    const { id } = req.params;
    const pedido = await Order.findById(id);
    if (!pedido)
      return res.status(404).json({ message: "Pedido no encontrado" });

    pedido.estado = "entregado";
    await pedido.save();

    res.json({ message: `¡Pedido ${pedido.folio} entregado!`, pedido });
  } catch (error) {
    res.status(500).json({ message: "Error al confirmar entrega" });
  }
};
