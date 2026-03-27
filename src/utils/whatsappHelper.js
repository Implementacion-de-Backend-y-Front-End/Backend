// src/utils/whatsappHelper.js

const generarLinkWhatsApp = (telefono, nombreCliente, folio, tipoMensaje) => {
  // Limpiamos el teléfono (debe tener código de país, ej: 52 para México)
  const telLimpio = telefono.replace(/\D/g, "");

  let mensaje = "";

  if (tipoMensaje === "confirmado") {
    mensaje = `¡Hola ${nombreCliente}! ✨ Soy Doña María de Leños Rellenos. Te confirmo que recibimos tu pedido ${folio}. ¡Ya estamos manos a la obra! 👩‍🍳`;
  } else if (tipoMensaje === "en_camino") {
    mensaje = `¡Buenas noticias ${nombreCliente}! 🚀 Tu pedido ${folio} ya va en camino con nuestro repartidor. ¡Que los disfrutes!`;
  }

  // Codificamos el mensaje para que sea válido en una URL
  const mensajeURL = encodeURIComponent(mensaje);

  return `https://wa.me/${telLimpio}?text=${mensajeURL}`;
};

module.exports = { generarLinkWhatsApp };
