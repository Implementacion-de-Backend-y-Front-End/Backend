const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  nombre: { type: String, required: true },
  telefono: { type: String, required: true, unique: true },
  correo: { type: String, unique: true, sparse: true },
  password: { type: String, required: true },
  rol: {
    type: String,
    enum: ["cliente", "admin", "repartidor"],
    default: "cliente",
  },
  direcciones: [
    {
      calle: String,
      colonia: String,
      referencia: String,
      principal: { type: Boolean, default: false },
    },
  ],
  activo: { type: Boolean, default: true },
  fechaRegistro: { type: Date, default: Date.now },
});

module.exports = mongoose.model("User", userSchema, "users");
