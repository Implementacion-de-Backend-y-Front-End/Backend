const Order = require("../models/Order");

// 1. OBTENER PEDIDOS PENDIENTES (Estado: recibido)
// 1. OBTENER PEDIDOS PENDIENTES (Estado: recibido)
exports.getPendingOrders = async (req, res) => {
  try {
    const pedidosPendientes = await Order.find({ estado: "recibido" })
      // NO necesitamos 'direccion' dentro del populate de clienteId
      // porque la dirección YA está en el modelo Order directamente.
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

// 2. ACEPTAR PEDIDO (Doña María lo confirma)
exports.acceptOrder = async (req, res) => {
  try {
    const { id } = req.params;
    const pedido = await Order.findByIdAndUpdate(
      id,
      { estado: "confirmado" },
      { new: true },
    );

    if (!pedido) {
      return res.status(404).json({ message: "No se encontró el pedido." });
    }

    res.json({
      message: "¡Pedido confirmado con éxito! Ya puede ser asignado.",
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

// 4. OBTENER PEDIDOS ENTREGADOS (El que te faltaba)
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
