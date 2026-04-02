const Order = require("../models/Order");
const Product = require("../models/Products");
const { generarLinkWhatsApp } = require("../utils/whatsappHelper");

// Función de ayuda para validar el horario
const esHorarioOperativo = (fechaEntrega) => {
  const fecha = new Date(fechaEntrega);

  const horaMexico = parseInt(
    fecha.toLocaleString("en-US", {
      hour: "numeric",
      hour12: false,
      timeZone: "America/Mexico_City",
    }),
  );

  const HORA_APERTURA = 7;
  const HORA_CIERRE = 14;

  return horaMexico >= HORA_APERTURA && horaMexico < HORA_CIERRE;
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

    // Tomamos el ID del token (inyectado por el middleware verificarToken)
    const clienteIdReal = req.user.id;

    // 1. VALIDACIÓN DE HORARIO (DENTRO DE LA FUNCIÓN)
    if (!esHorarioOperativo(fechaEntrega)) {
      return res.status(400).json({
        message:
          "🕒 Horario no disponible. Entregamos leños de 7:00 AM a 2:00 PM (Hora CDMX).",
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
      direccion,
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

exports.getCustomerOrders = async (req, res) => {
  try {
    const pedidos = await Order.find({ clienteId: req.user.id }).sort({
      fechaPedido: -1,
    });
    res.json(pedidos);
  } catch (error) {
    res.status(500).json({ message: "Error al obtener historial" });
  }
};
