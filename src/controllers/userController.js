const User = require("../models/Users");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

// Almacenamiento temporal de códigos (en producción usar Redis)
const codigosRecuperacion = new Map();

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
      process.env.JWT_SECRET || "TU_FIRMA_SECRETA_SUPER_SEGURA",
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

// Registro público (solo clientes)
exports.register = async (req, res) => {
  try {
    let { nombre, telefono, password, correo } = req.body;
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
      rol: "cliente", // Siempre cliente en registro público
      activo: true,
    });

    await nuevoUsuario.save();

    const token = jwt.sign(
      { id: nuevoUsuario._id, rol: nuevoUsuario.rol },
      process.env.JWT_SECRET || "TU_FIRMA_SECRETA_SUPER_SEGURA",
      { expiresIn: "8h" },
    );

    res.status(201).json({
      message: "Usuario creado con éxito",
      token,
      user: {
        id: nuevoUsuario._id,
        nombre: nuevoUsuario.nombre,
        rol: nuevoUsuario.rol,
        telefono: nuevoUsuario.telefono,
      },
    });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error al crear usuario", error: error.message });
  }
};

// Registro de personal (admin/repartidor) - SOLO ADMINS
exports.createStaff = async (req, res) => {
  try {
    let { nombre, telefono, password, rol, correo } = req.body;
    const telefonoFormateado = normalizarTelefono(telefono);

    // Validar que el rol sea válido para personal
    if (!["admin", "repartidor"].includes(rol)) {
      return res.status(400).json({
        message: "Rol inválido. Solo se permite: admin o repartidor",
      });
    }

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
      rol,
      activo: true,
    });

    await nuevoUsuario.save();

    res.status(201).json({
      message: `${rol.toUpperCase()} registrado con éxito`,
      user: {
        id: nuevoUsuario._id,
        nombre: nuevoUsuario.nombre,
        rol: nuevoUsuario.rol,
        telefono: nuevoUsuario.telefono,
      },
    });
  } catch (error) {
    console.error("Error al crear staff:", error);
    res
      .status(500)
      .json({ message: "Error al crear usuario", error: error.message });
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

exports.getPersonal = async (req, res) => {
  try {
    const personal = await User.find({
      rol: { $in: ["admin", "repartidor"] },
    }).select("-password");

    res.json(personal);
  } catch (error) {
    res.status(500).json({ message: "Error al obtener el personal" });
  }
};

// ========== RECUPERACIÓN DE CONTRASEÑA ==========

// Generar y enviar código
exports.enviarCodigo = async (req, res) => {
  const { correo } = req.body;

  try {
    // Verificar que el usuario existe
    const usuario = await User.findOne({ correo });
    if (!usuario) {
      return res.status(404).json({
        success: false,
        message: "No existe una cuenta con este correo",
      });
    }

    // Generar código de 6 dígitos
    const codigo = Math.floor(100000 + Math.random() * 900000).toString();

    // Guardar código con expiración de 10 minutos
    codigosRecuperacion.set(correo, {
      codigo,
      expira: Date.now() + 10 * 60 * 1000, // 10 minutos
    });

    console.log(`🔐 Código generado para ${correo}: ${codigo}`);

    // Enviar por correo
    const nodemailer = require("nodemailer");
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    await transporter.sendMail({
      from: `"Leños Rellenos 🪵" <${process.env.EMAIL_USER}>`,
      to: correo,
      subject: "Código de recuperación - Leños Rellenos",
      html: `
        <div style="font-family: sans-serif; border-top: 5px solid #f97316; padding: 20px; text-align: center;">
          <h2 style="color: #333;">Hola 🔥</h2>
          <p>Tu código de seguridad para restablecer tu contraseña en <b>Leños Rellenos</b> es:</p>
          <h1 style="color: #f97316; letter-spacing: 8px; font-size: 40px;">${codigo}</h1>
          <p style="color: #666;">Este código expira en 10 minutos.</p>
          <p style="color: #999; font-size: 12px;">Si no solicitaste este código, ignora este mensaje.</p>
        </div>
      `,
    });

    res.json({
      success: true,
      message: "Código enviado correctamente al correo",
    });
  } catch (error) {
    console.error("Error al enviar código:", error);
    res.status(500).json({
      success: false,
      message: "Error al enviar el correo. Revisa tus credenciales en .env",
    });
  }
};

// Verificar código
exports.verificarCodigo = async (req, res) => {
  const { correo, codigo } = req.body;

  try {
    const registro = codigosRecuperacion.get(correo);

    if (!registro) {
      return res.status(400).json({
        success: false,
        message:
          "No hay código pendiente para este correo. Solicita uno nuevo.",
      });
    }

    if (Date.now() > registro.expira) {
      codigosRecuperacion.delete(correo);
      return res.status(400).json({
        success: false,
        message: "El código ha expirado. Solicita uno nuevo.",
      });
    }

    if (registro.codigo !== codigo) {
      return res.status(400).json({
        success: false,
        message: "Código incorrecto",
      });
    }

    // Código válido - marcar como verificado
    codigosRecuperacion.set(correo, {
      ...registro,
      verificado: true,
    });

    res.json({
      success: true,
      message: "Código verificado correctamente",
    });
  } catch (error) {
    console.error("Error al verificar código:", error);
    res.status(500).json({
      success: false,
      message: "Error al verificar el código",
    });
  }
};

// Resetear contraseña
exports.resetPassword = async (req, res) => {
  const { correo, nuevaPassword } = req.body;

  try {
    // Verificar que el código fue validado
    const registro = codigosRecuperacion.get(correo);

    if (!registro || !registro.verificado) {
      return res.status(400).json({
        success: false,
        message: "Debes verificar el código primero",
      });
    }

    // Buscar usuario
    const usuario = await User.findOne({ correo });
    if (!usuario) {
      return res.status(404).json({
        success: false,
        message: "Usuario no encontrado",
      });
    }

    // Encriptar nueva contraseña
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(nuevaPassword, salt);

    usuario.password = hashedPassword;
    await usuario.save();

    // Limpiar código usado
    codigosRecuperacion.delete(correo);

    res.json({
      success: true,
      message: "Contraseña actualizada con éxito",
    });
  } catch (error) {
    console.error("Error al resetear password:", error);
    res.status(500).json({
      success: false,
      message: "No se pudo actualizar la contraseña",
    });
  }
};
