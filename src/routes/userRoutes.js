const express = require("express");
const router = express.Router();
const userController = require("../controllers/userController");
const { verificarToken, verificarAdmin } = require("../middlewares/auth");
const nodemailer = require("nodemailer");
const User = require("../models/Users");
const bcrypt = require("bcryptjs");

// Almacenamiento temporal de códigos
const codigosRecuperacion = new Map();

// ========================================
// 📌 RUTAS PÚBLICAS
// ========================================

router.post("/login", userController.login);
router.post("/register", userController.register);

// Obtener solo repartidores (para el selector de asignación)
router.get("/repartidores", verificarToken, async (req, res) => {
  try {
    const repartidores = await User.find({
      rol: "repartidor",
      activo: true,
    }).select("-password");
    res.json(repartidores);
  } catch (error) {
    res.status(500).json({ message: "Error al obtener repartidores" });
  }
});

/**
 * 1. ENVIAR CÓDIGO POR CORREO
 */
router.post("/olvide-password", async (req, res) => {
  const { correo } = req.body;

  try {
    const usuario = await User.findOne({ correo });
    if (!usuario) {
      return res.status(404).json({
        success: false,
        message: "No existe una cuenta con este correo",
      });
    }

    const codigo = Math.floor(100000 + Math.random() * 900000).toString();

    codigosRecuperacion.set(correo, {
      codigo,
      expira: Date.now() + 10 * 60 * 1000,
      verificado: false,
    });

    console.log(`🔐 Código generado para ${correo}: ${codigo}`);

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
        </div>
      `,
    });

    res.json({
      success: true,
      message: "Código enviado correctamente al correo",
    });
  } catch (error) {
    console.error("Error Nodemailer:", error);
    res.status(500).json({
      success: false,
      message: "Error al enviar el correo",
    });
  }
});

/**
 * 2. VERIFICAR CÓDIGO
 */
router.post("/verificar-codigo", async (req, res) => {
  const { correo, codigo } = req.body;

  try {
    const registro = codigosRecuperacion.get(correo);

    if (!registro) {
      return res.status(400).json({
        success: false,
        message: "No hay código pendiente. Solicita uno nuevo.",
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

    codigosRecuperacion.set(correo, {
      ...registro,
      verificado: true,
    });

    res.json({
      success: true,
      message: "Código verificado correctamente",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error al verificar el código",
    });
  }
});

/**
 * 3. ACTUALIZAR CONTRASEÑA
 */
router.post("/reset-password", async (req, res) => {
  const { correo, nuevaPassword } = req.body;

  try {
    const registro = codigosRecuperacion.get(correo);

    if (!registro || !registro.verificado) {
      return res.status(400).json({
        success: false,
        message: "Debes verificar el código primero",
      });
    }

    const usuario = await User.findOne({ correo });

    if (!usuario) {
      return res.status(404).json({
        success: false,
        message: "Usuario no encontrado",
      });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(nuevaPassword, salt);

    usuario.password = hashedPassword;
    await usuario.save();

    codigosRecuperacion.delete(correo);

    res.json({
      success: true,
      message: "Contraseña actualizada con éxito",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "No se pudo actualizar la contraseña",
    });
  }
});

// ========================================
// 🔒 RUTAS PROTEGIDAS (SOLO ADMIN)
// ========================================

router.post(
  "/registrar-staff",
  verificarToken,
  verificarAdmin,
  async (req, res) => {
    try {
      let { nombre, telefono, password, rol, correo } = req.body;

      if (!["admin", "repartidor"].includes(rol)) {
        return res.status(400).json({
          message: "Rol inválido. Solo se permite: admin o repartidor",
        });
      }

      const normalizarTelefono = (tel) => {
        if (!tel) return tel;
        let limpio = tel.replace(/\D/g, "");
        if (limpio.length === 10) return `+52${limpio}`;
        if (limpio.length === 12 && limpio.startsWith("52"))
          return `+${limpio}`;
        return tel;
      };

      const telefonoFormateado = normalizarTelefono(telefono);

      const existe = await User.findOne({ telefono: telefonoFormateado });
      if (existe) {
        return res.status(400).json({
          message: "Este número ya está registrado",
        });
      }

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
      res.status(500).json({
        message: "Error al crear usuario",
        error: error.message,
      });
    }
  },
);

router.get(
  "/personal",
  verificarToken,
  verificarAdmin,
  userController.getPersonal,
);

router.delete(
  "/:id",
  verificarToken,
  verificarAdmin,
  userController.deleteUser,
);

module.exports = router;
