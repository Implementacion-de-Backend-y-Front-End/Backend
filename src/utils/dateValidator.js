// src/utils/dateValidator.js
const isHoraValida = (fechaSolicitada) => {
  const fecha = new Date(fechaSolicitada);
  const hora = fecha.getHours();

  // Definimos el horario de Doña María (8 AM a 6 PM / 18 hrs)
  const HORA_APERTURA = 8;
  const HORA_CIERRE = 18;

  if (hora >= HORA_APERTURA && hora < HORA_CIERRE) {
    return true;
  }
  return false;
};

module.exports = { isHoraValida };
