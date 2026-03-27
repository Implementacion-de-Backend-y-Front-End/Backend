const Order = require("../models/Order");

exports.getDailyReport = async (req, res) => {
  try {
    // 1. Definir el inicio y fin del día de hoy
    const inicioDia = new Date();
    inicioDia.setHours(0, 0, 0, 0);

    const finDia = new Date();
    finDia.setHours(23, 59, 59, 999);

    // 2. Agregación: Sumar totales y contar productos
    const reporte = await Order.aggregate([
      {
        $match: {
          estado: "entregado", // Solo contamos lo que ya se cobró
          fechaPedido: { $gte: inicioDia, $lte: finDia },
        },
      },
      {
        $unwind: "$productos", // Desglosamos el array de productos para contarlos uno por uno
      },
      {
        $group: {
          _id: null,
          totalIngresos: { $sum: "$total" },
          totalPedidos: { $sum: 1 },
          saboresVendidos: {
            $push: {
              nombre: "$productos.nombre",
              cantidad: "$productos.cantidad",
            },
          },
        },
      },
    ]);

    if (reporte.length === 0) {
      return res.json({
        message: "Aún no hay ventas entregadas el día de hoy.",
        totalIngresos: 0,
      });
    }

    // 3. Formatear el ranking de sabores (AS-52)
    const ranking = reporte[0].saboresVendidos.reduce((acc, curr) => {
      acc[curr.nombre] = (acc[curr.nombre] || 0) + curr.cantidad;
      return acc;
    }, {});

    res.json({
      fecha: new Date().toLocaleDateString(),
      resumen: {
        ingresos: reporte[0].totalIngresos,
        pedidosCompletados: reporte[0].totalPedidos,
      },
      rankingSabores: ranking, // Ejemplo: { "Jamón y Queso": 15, "Chicharrón": 8 }
    });
  } catch (error) {
    res
      .status(500)
      .json({
        message: "Error al generar el reporte diario",
        error: error.message,
      });
  }
};
