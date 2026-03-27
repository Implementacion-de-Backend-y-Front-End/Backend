const mongoose = require("mongoose");

const productSchema = new mongoose.Schema(
  {
    nombre: { type: String, required: true, unique: true },
    descripcion: String,
    precio: { type: Number, required: true },
    imagenUrl: String,
    categoria: { type: String, default: "clasico" },
    activo: { type: Boolean, default: true },
    destacado: { type: Boolean, default: false },
    stock: { type: Number, default: 0 },
  },
  { timestamps: true },
);

module.exports = mongoose.model("Product", productSchema);
