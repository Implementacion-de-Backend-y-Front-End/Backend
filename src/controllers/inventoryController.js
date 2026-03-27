const Inventory = require("../models/Inventory");

// Aquí pegas tu función:
exports.getLowStockAlerts = async (req, res) => {
  try {
    const alertas = await Inventory.find({
      $expr: { $lte: ["$cantidadActual", "$stockMinimo"] },
    }).populate("productoId", "nombre");

    if (alertas.length === 0) {
      return res.json({ message: "✅ Todo en orden. Stock suficiente." });
    }

    res.json({
      message: "⚠️ ¡Atención! Los siguientes productos se están agotando:",
      alertas: alertas.map((a) => ({
        producto: a.productoId ? a.productoId.nombre : "Producto no encontrado",
        actual: a.cantidadActual,
        minimo: a.stockMinimo,
      })),
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
