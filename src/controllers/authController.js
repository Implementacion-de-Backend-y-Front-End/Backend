const User = require("../models/Users"); // Asegúrate de tener tu modelo de Usuario
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

exports.login = async (req, res) => {
  try {
    const { telefono, password } = req.body;

    // 1. Buscar al usuario por teléfono (identificador único)
    const user = await User.findOne({ telefono });
    if (!user) {
      return res.status(404).json({ message: "Usuario no encontrado" });
    }

    // 2. Verificar contraseña encriptada (RNF-04)
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: "Contraseña incorrecta" });
    }

    // 3. Crear el Token de Seguridad (JWT)
    // Guardamos el ID y el ROL para saber qué puede hacer el usuario
    const token = jwt.sign(
      { id: user._id, rol: user.rol },
      process.env.JWT_SECRET || "TU_FIRMA_SECRETA_SUPER_SEGURA", // Usa una variable de entorno en producción
      { expiresIn: "8h" }, // La sesión dura 8 horas
    );

    res.json({
      token,
      user: {
        id: user._id,
        nombre: user.nombre,
        rol: user.rol,
      },
    });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error en el servidor", error: error.message });
  }
};
