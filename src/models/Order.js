const mongoose = require("mongoose");

const orderSchema = new mongoose.Schema(
  {
    folio: { type: String, required: true, unique: true },
    clienteId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    productos: [
      {
        productoId: { type: mongoose.Schema.Types.ObjectId, ref: "Product" },
        nombre: String,
        cantidad: Number,
        precioUnitario: Number,
        subtotal: Number,
      },
    ],
    total: { type: Number, required: true },
    estado: {
      type: String,
      enum: ["recibido", "confirmado", "enCamino", "entregado", "cancelado"],
      default: "recibido",
    },
    direccion: {
      calle: String,
      colonia: String,
      referencia: String,
    },
    nota: String,
    fechaPedido: { type: Date, default: Date.now },
    fechaEntrega: { type: Date, default: null },

    repartidorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
  },
  { timestamps: true },
);

module.exports = mongoose.model("Order", orderSchema);
