const User = require("../models/Users");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const normalizarTelefono = (tel) => {
  if (!tel) return tel;
  let limpio = tel.replace(/\D/g, "");
  if (limpio.length === 10) return `+52${limpio}`;
  if (limpio.length === 12 && limpio.startsWith("52")) return `+${limpio}`;
  return tel;
};

exports.login = async (req, res) => {
  try {
    let { telefono, password } = req.body;
    const telefonoFormateado = normalizarTelefono(telefono);
    const user = await User.findOne({ telefono: telefonoFormateado });

    if (!user)
      return res.status(404).json({ message: "Usuario no encontrado" });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch)
      return res.status(400).json({ message: "Contraseña incorrecta" });

    const token = jwt.sign(
      { id: user._id, rol: user.rol },
      process.env.JWT_SECRET || "TU_FIRMA_SECRETA_SUPER_SEGURA", // Firma unificada
      { expiresIn: "8h" },
    );

    res.json({
      token,
      user: {
        id: user._id,
        nombre: user.nombre,
        rol: user.rol,
        telefono: user.telefono,
      },
    });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error en el servidor", error: error.message });
  }
};

exports.createUser = async (req, res) => {
  try {
    let { nombre, telefono, password, rol, correo } = req.body;
    const telefonoFormateado = normalizarTelefono(telefono);

    const existe = await User.findOne({ telefono: telefonoFormateado });
    if (existe)
      return res
        .status(400)
        .json({ message: "Este número ya está registrado" });

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const nuevoUsuario = new User({
      nombre,
      telefono: telefonoFormateado,
      correo,
      password: hashedPassword,
      rol: rol || "cliente",
      activo: true,
    });

    await nuevoUsuario.save();

    // 🔥 Integración: Generamos el token para que el registro loguee automáticamente
    const token = jwt.sign(
      { id: nuevoUsuario._id, rol: nuevoUsuario.rol },
      process.env.JWT_SECRET || "TU_FIRMA_SECRETA_SUPER_SEGURA",
      { expiresIn: "8h" },
    );

    res.status(201).json({
      message: "Usuario creado con éxito",
      token, // Ahora el registro también devuelve el token
      user: {
        // Estructura unificada para que el Front no se pierda
        id: nuevoUsuario._id,
        nombre: nuevoUsuario.nombre,
        rol: nuevoUsuario.rol,
        telefono: nuevoUsuario.telefono,
      },
    });
  } catch (error) {
    res.status(500).json({ message: "Error al crear usuario" });
  }
};

exports.deleteUser = async (req, res) => {
  try {
    const { id } = req.params;
    const usuarioEliminado = await User.findByIdAndDelete(id);
    if (!usuarioEliminado)
      return res.status(404).json({ message: "Usuario no encontrado" });
    res.json({ message: `Usuario ${usuarioEliminado.nombre} eliminado.` });
  } catch (error) {
    res.status(500).json({ message: "Error al eliminar" });
  }
};

// Alias para register (usa createUser)
exports.register = exports.createUser;

exports.getPersonal = async (req, res) => {
  try {
    // Buscamos usuarios que sean admin O repartidor
    const personal = await User.find({
      rol: { $in: ["admin", "repartidor"] },
    }).select("-password"); // No enviamos la contraseña por seguridad

    res.json(personal);
  } catch (error) {
    res.status(500).json({ message: "Error al obtener el personal" });
  }
};
