const express = require("express");
const router = express.Router();
const userController = require("../controllers/userController");
const { verificarToken, verificarAdmin } = require("../middlewares/auth");
const nodemailer = require("nodemailer");
const User = require("../models/Users");
const bcrypt = require("bcryptjs"); // 🔥 Importante: Usar bcryptjs para que coincida con tu Login

// --- RUTAS PÚBLICAS ---

router.post("/login", userController.login);
router.post("/register", userController.register);

/**
 * 1. ENVIAR CÓDIGO POR CORREO
 * Genera un código aleatorio y lo manda al correo del cliente (Alexis).
 */
router.post("/olvide-password", async (req, res) => {
  const { correo } = req.body;

  try {
    const codigo = Math.floor(100000 + Math.random() * 900000).toString();
    console.log(`Código generado para ${correo}: ${codigo}`);

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
          <p style="color: #666;">Introduce este código en la página para continuar con el cambio.</p>
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
      message: "Error al enviar el correo. Revisa tus credenciales en .env",
    });
  }
});

/**
 * 2. ACTUALIZAR CONTRASEÑA EN LA BASE DE DATOS
 * Recibe el correo y la nueva clave, la encripta y la guarda.
 */
router.post("/reset-password", async (req, res) => {
  const { correo, nuevaPassword } = req.body;

  try {
    // Buscar al usuario
    const usuario = await User.findOne({ correo });

    if (!usuario) {
      return res.status(404).json({
        success: false,
        message: "Usuario no encontrado",
      });
    }

    // 🔥 ENCRIPTAR LA CONTRASEÑA ANTES DE GUARDAR
    // Esto es lo que permite que el Login funcione después
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(nuevaPassword, salt);

    usuario.password = hashedPassword;
    await usuario.save();

    res.json({
      success: true,
      message: "Contraseña actualizada con éxito y encriptada",
    });
  } catch (error) {
    console.error("Error al resetear password:", error);
    res.status(500).json({
      success: false,
      message: "No se pudo actualizar la contraseña",
    });
  }
});

// --- RUTAS PROTEGIDAS ---

router.delete(
  "/:id",
  verificarToken,
  verificarAdmin,
  userController.deleteUser,
);

router.post(
  "/registrar-repartidor",
  verificarToken,
  verificarAdmin,
  userController.createUser, // Reutilizamos la lógica, pero protegida
);

router.get(
  "/personal",
  verificarToken,
  verificarAdmin,
  userController.getPersonal,
);

module.exports = router;
