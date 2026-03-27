const Order = require("../models/Order");
const Product = require("../models/Products");
const { generarLinkWhatsApp } = require("../utils/whatsappHelper");

/**
 * Validación de Horario Operativo (8 AM a 6 PM)
 */
const esHorarioOperativo = (fechaEntrega) => {
  const fecha = new Date(fechaEntrega);
  const hora = fecha.getHours();
  const HORA_APERTURA = 8;
  const HORA_CIERRE = 18;
  return hora >= HORA_APERTURA && hora < HORA_CIERRE;
};

exports.createOrder = async (req, res) => {
  try {
    const {
      nombre,
      telefono,
      productos,
      total,
      fechaEntrega,
      tipoEntrega,
      direccion,
      nota,
    } = req.body;

    // --- CAMBIO CLAVE AQUÍ ---
    // Ya no tomamos clienteId del body. Lo tomamos del TOKEN (req.user.id)
    // Esto asegura que el ID siempre sea el del usuario que inició sesión.
    const clienteIdReal = req.user.id;

    // 1. VALIDACIÓN DE HORARIO DE ENTREGA
    if (!esHorarioOperativo(fechaEntrega)) {
      return res.status(400).json({
        message:
          "🕒 Horario no disponible. Entregamos leños de 8:00 AM a 6:00 PM.",
      });
    }

    // 2. VERIFICACIÓN DE STOCK
    for (const item of productos) {
      const productoBD = await Product.findById(item.productoId);

      if (!productoBD || productoBD.stock < item.cantidad) {
        return res.status(400).json({
          message: `🚫 ¡Ups! No hay suficiente stock de '${item.nombre}'. Disponibles: ${productoBD ? productoBD.stock : 0}.`,
        });
      }
    }

    // 3. GENERACIÓN DE FOLIO ÚNICO
    const nuevoFolio = "#" + Math.floor(1000 + Math.random() * 9000);

    // 4. CREACIÓN DEL PEDIDO
    const nuevoPedido = new Order({
      folio: nuevoFolio,
      clienteId: clienteIdReal,
      productos,
      total,
      fechaEntrega,
      tipoEntrega,
      direccion, // <--- Esto guarda el objeto {calle, colonia, referencia} en la base de datos
      nota,
      estado: "recibido",
    });

    await nuevoPedido.save();

    // 5. RESTA AUTOMÁTICA DE STOCK
    for (const item of productos) {
      await Product.findByIdAndUpdate(item.productoId, {
        $inc: { stock: -item.cantidad },
      });
    }

    // 6. GENERAR LINK DE WHATSAPP
    const whatsappLink = generarLinkWhatsApp(
      telefono,
      nombre,
      nuevoFolio,
      "confirmado",
    );

    // 7. RESPUESTA EXITOSA
    res.status(201).json({
      message: `¡Recibimos tu pedido ${nuevoFolio}! En breve confirmamos.`,
      pedido: nuevoPedido,
      whatsappLink: whatsappLink,
    });
  } catch (error) {
    console.error("Error en createOrder:", error);
    res.status(500).json({
      message: "Error crítico al procesar la venta",
      error: error.message,
    });
  }
};

/**
 * Historial de pedidos del cliente (Usa el ID del token para más seguridad)
 */
exports.getCustomerOrders = async (req, res) => {
  try {
    // También aquí usamos req.user.id para que un cliente solo vea SUS pedidos
    const pedidos = await Order.find({ clienteId: req.user.id }).sort({
      fechaPedido: -1,
    });
    res.json(pedidos);
  } catch (error) {
    res.status(500).json({ message: "Error al obtener historial" });
  }
};
