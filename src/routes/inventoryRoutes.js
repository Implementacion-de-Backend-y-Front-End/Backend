const express = require("express");
const router = express.Router();
const Inventory = require("../models/Inventory");
const inventoryController = require("../controllers/inventoryController");

// Endpoint para actualizar stock manualmente (Panel Admin)
router.post("/update", async (req, res) => {
  const { productoId, cantidad } = req.body;
  try {
    const stock = await Inventory.findOneAndUpdate(
      { productoId },
      {
        $set: { cantidadActual: cantidad, cantidadInicial: cantidad },
        ultimaActualizacion: Date.now(),
      },
      { upsert: true, new: true },
    );
    res.json({ message: "Inventario actualizado", stock });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get("/low-stock", inventoryController.getLowStockAlerts);

module.exports = router;
