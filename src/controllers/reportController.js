const Order = require("../models/Order");
const Product = require("../models/Products");

// REPORTE DIARIO
exports.getDailyReport = async (req, res) => {
  try {
    // Fecha de hoy (inicio y fin del día)
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    // 1. Total de ventas del día (solo pedidos confirmados, enCamino o entregados)
    const ventasHoy = await Order.find({
      fechaPedido: { $gte: today, $lt: tomorrow },
      estado: { $in: ["confirmado", "enCamino", "entregado"] },
    });

    const totalVentas = ventasHoy.reduce((sum, order) => sum + order.total, 0);

    // 2. Pedidos completados (entregados hoy - por fechaEntrega O updatedAt)
    const pedidosCompletados = await Order.countDocuments({
      estado: "entregado",
      $or: [
        { fechaEntrega: { $gte: today, $lt: tomorrow } },
        {
          fechaEntrega: { $exists: false },
          updatedAt: { $gte: today, $lt: tomorrow },
        },
      ],
    });

    // 3. Pedidos pendientes (recibidos o confirmados)
    const pedidosPendientes = await Order.countDocuments({
      estado: { $in: ["recibido", "confirmado"] },
    });

    // 4. Pedidos en camino
    const pedidosEnCamino = await Order.countDocuments({
      estado: "enCamino",
    });

    // 5. Producto estrella del día
    const productosVendidos = {};
    ventasHoy.forEach((order) => {
      order.productos.forEach((prod) => {
        if (productosVendidos[prod.nombre]) {
          productosVendidos[prod.nombre] += prod.cantidad;
        } else {
          productosVendidos[prod.nombre] = prod.cantidad;
        }
      });
    });

    let productoEstrella = { nombre: "Sin ventas", cantidad: 0 };
    for (const [nombre, cantidad] of Object.entries(productosVendidos)) {
      if (cantidad > productoEstrella.cantidad) {
        productoEstrella = { nombre, cantidad };
      }
    }

    // 6. Total de pedidos del día
    const totalPedidosHoy = await Order.countDocuments({
      fechaPedido: { $gte: today, $lt: tomorrow },
    });

    res.json({
      fecha: today.toISOString().split("T")[0],
      kpis: {
        totalVentas,
        totalPedidosHoy,
        pedidosCompletados,
        pedidosPendientes,
        pedidosEnCamino,
        productoEstrella,
      },
    });
  } catch (error) {
    console.error("Error en reporte diario:", error);
    res
      .status(500)
      .json({ message: "Error al generar reporte", error: error.message });
  }
};

// ALERTAS DE STOCK
exports.getStockAlerts = async (req, res) => {
  try {
    const umbralCritico = 10; // Menos de 10 unidades = crítico

    // Productos con stock crítico
    const productosCriticos = await Product.find({
      stock: { $lt: umbralCritico },
    }).sort({ stock: 1 });

    // Productos agotados
    const productosAgotados = await Product.find({
      stock: { $lte: 0 },
    });

    // Todos los productos con su stock
    const todosLosProductos = await Product.find().sort({ stock: 1 });

    res.json({
      umbralCritico,
      productosCriticos,
      productosAgotados: productosAgotados.length,
      inventarioCompleto: todosLosProductos,
    });
  } catch (error) {
    console.error("Error en alertas de stock:", error);
    res
      .status(500)
      .json({ message: "Error al obtener alertas", error: error.message });
  }
};
