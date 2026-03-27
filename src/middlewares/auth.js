const jwt = require("jsonwebtoken");

/**
 * Middleware para validar el Token de acceso
 */
const verificarToken = (req, res, next) => {
  // 1. Obtener el token del header
  const token = req.header("x-auth-token");

  // 2. Revisar si no hay token
  if (!token) {
    return res.status(401).json({
      message: "No hay token, permiso denegado. Por favor inicia sesión.",
    });
  }

  try {
    // 3. Verificar el token
    // IMPORTANTE: Usamos process.env.JWT_SECRET o la frase fija si no tienes .env
    const cifrado = jwt.verify(
      token,
      process.env.JWT_SECRET || "TU_FIRMA_SECRETA_SUPER_SEGURA",
    );

    // 4. Guardamos los datos del usuario en el objeto 'req'
    // Esto es lo que permite que en el controlador uses 'req.user.id'
    req.user = cifrado;

    // LOG DE DEPURACIÓN: Revisa tu terminal de VS Code al mandar la petición
    console.log("-----------------------------------------");
    console.log("🔐 Token verificado con éxito");
    console.log("👤 Usuario logueado:", req.user);
    console.log("-----------------------------------------");

    next();
  } catch (error) {
    console.error("Error al verificar token:", error.message);
    res.status(401).json({ message: "Token no válido o expirado" });
  }
};

/**
 * Middleware para validar si el usuario es Administrador (Doña María)
 */
const verificarAdmin = (req, res, next) => {
  if (req.user && req.user.rol === "admin") {
    next();
  } else {
    res.status(403).json({
      message: "Acceso denegado. Esta acción requiere rol de Administrador.",
    });
  }
};

module.exports = { verificarToken, verificarAdmin };
