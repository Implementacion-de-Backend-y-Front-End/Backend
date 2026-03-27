const mongoose = require("mongoose");

const inventorySchema = new mongoose.Schema({
  productoId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Product",
    required: true,
  },
  fecha: { type: Date, default: Date.now }, // Para control diario
  cantidadInicial: { type: Number, default: 0 },
  cantidadActual: { type: Number, default: 0 },
  cantidadApartada: { type: Number, default: 0 },
  stockMinimo: { type: Number, default: 5 },
  ultimaActualizacion: { type: Date, default: Date.now },
});

// Índice compuesto para que no haya dos registros del mismo producto el mismo día
inventorySchema.index({ productoId: 1, fecha: 1 }, { unique: true });

module.exports = mongoose.model("Inventory", inventorySchema);
