const Product = require("../models/Products");

// 1. Obtener todos los productos activos
exports.getProducts = async (req, res) => {
  try {
    const products = await Product.find({ activo: true });
    res.json(products);
  } catch (error) {
    res.status(500).json({ message: "Error al obtener productos" });
  }
};

// 2. Crear un nuevo producto con imagen
exports.createProduct = async (req, res) => {
  try {
    const { nombre, precio, stock, descripcion, categoria } = req.body;

    const nuevoProducto = new Product({
      nombre,
      precio,
      stock,
      descripcion,
      categoria,
      imagenUrl: req.file ? `/uploads/${req.file.filename}` : "", // Guardamos la ruta del archivo
    });

    await nuevoProducto.save();
    res.status(201).json(nuevoProducto);
  } catch (error) {
    res
      .status(400)
      .json({ message: "Error al crear producto", error: error.message });
  }
};

// 3. Obtener producto por ID
exports.getProductById = async (req, res) => {
  try {
    const { id } = req.params;
    const producto = await Product.findById(id);

    if (!producto) {
      return res.status(404).json({ message: "Producto no encontrado" });
    }

    res.json(producto);
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error al buscar el producto", error: error.message });
  }
};

// 4. Actualizar Stock e Imagen (El que pidió Doña María)
exports.updateStockAndImage = async (req, res) => {
  try {
    const { id } = req.params;
    const { stock } = req.body;

    let updateData = {};
    if (stock) updateData.stock = parseInt(stock);

    // Si viene un archivo nuevo, actualizamos la imagenUrl
    if (req.file) {
      updateData.imagenUrl = `/uploads/${req.file.filename}`;
    }

    const productoActualizado = await Product.findByIdAndUpdate(
      id,
      { $set: updateData },
      { new: true },
    );

    if (!productoActualizado) {
      return res.status(404).json({ message: "Producto no encontrado" });
    }

    res.json({
      message: "✅ Producto actualizado con éxito",
      producto: productoActualizado,
    });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error al actualizar", error: error.message });
  }
};

// 5. Eliminar producto
exports.deleteProduct = async (req, res) => {
  try {
    const { id } = req.params;
    const producto = await Product.findByIdAndDelete(id);

    if (!producto) {
      return res.status(404).json({ message: "Ese leño ya no existe" });
    }

    res.json({ message: "Producto eliminado correctamente" });
  } catch (error) {
    res.status(500).json({ message: "Error al borrar", error: error.message });
  }
};
