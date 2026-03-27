const express = require("express");
const router = express.Router();
const productController = require("../controllers/productController");
const { verificarToken, verificarAdmin } = require("../middlewares/auth");
const multer = require("multer");
const path = require("path");

// Configuración de Multer para guardar imágenes
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/"); // Asegúrate de crear esta carpeta en la raíz
  },
  filename: (req, file, cb) => {
    // Nombre: timestamp + extensión original (ej: 1711234567.jpg)
    cb(null, Date.now() + path.extname(file.originalname));
  },
});

const upload = multer({ storage });

// PÚBLICO: Ver productos
router.get("/", productController.getProducts);
router.get("/:id", productController.getProductById);

// ADMIN: Crear producto con imagen
router.post(
  "/",
  verificarToken,
  verificarAdmin,
  upload.single("imagen"),
  productController.createProduct,
);

// ADMIN: Actualizar stock e imagen de un producto existente
router.put(
  "/update-stock/:id",
  verificarToken,
  verificarAdmin,
  upload.single("imagen"),
  productController.updateStockAndImage,
);

router.delete(
  "/:id",
  verificarToken,
  verificarAdmin,
  productController.deleteProduct,
);

module.exports = router;
