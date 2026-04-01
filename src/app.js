require("dotenv").config();
const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");
const connectDB = require("./config/db");

// Importar Rutas
const productRoutes = require("./routes/productRoutes");
const orderRoutes = require("./routes/orderRoutes");
const userRoutes = require("./routes/userRoutes");
const assignmentRoutes = require("./routes/assignmentRoutes");
const inventoryRoutes = require("./routes/inventoryRoutes");
const adminRoutes = require("./routes/adminRoutes");
const reportRoutes = require("./routes/reportRoutes");
const deliveryRoutes = require("./routes/deliveryRoutes");

const app = express();

// 1. Conectar a la Base de Datos
connectDB();

// 2. Middlewares Globales (ORDEN IMPORTANTE)
app.use(
  helmet({
    crossOriginResourcePolicy: false,
  }),
);
app.use(
  cors({
    origin: "https://front-end-production-a2e6.up.railway.app",
    credentials: true,
  }),
);
app.use(morgan("dev"));
app.use(express.json()); // <--- DEBE IR ANTES DE LAS RUTAS

// 3. Definición de Rutas
app.use("/api/assignments", assignmentRoutes);
app.use("/api/inventory", inventoryRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/reports", reportRoutes);
app.use("/api/delivery", deliveryRoutes);
app.use("/api/products", productRoutes);
app.use("/api/users", userRoutes);
app.use("/api/orders", orderRoutes);
app.use("/uploads", express.static("uploads"));

app.get("/", (req, res) => {
  res.json({ message: "🪵🔥 API de Leños Rellenos funcionando" });
});

// 4. Manejo de 404
app.use((req, res) => {
  res.status(404).json({ message: "Lo siento, esa ruta no existe." });
});

const PORT = process.env.PORT || 4000; // Railway usará process.env.PORT
app.listen(PORT, "0.0.0.0", () => {
  console.log(`Servidor corriendo en puerto ${PORT}`);
});
