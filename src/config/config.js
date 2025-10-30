export const BOT_CONFIG = {
  /**
   * Horario de atención del local. Se utiliza para calcular
   * los posibles horarios de retiro.
   */
  businessHours: {
    startHour: 8,
    startMinute: 0,
    endHour: 18,
    endMinute: 0,
  },
  /**
   * Minutos mínimos que necesitamos para preparar un pedido
   * antes de ofrecer una franja de retiro.
   */
  preparationMinutes: 120,
  /**
   * Duración de la franja propuesta para el retiro (en minutos).
   */
  pickupWindowMinutes: 120,
  /**
   * Configuración para notificaciones internas.
   */
  notifications: {
    /**
     * Número de WhatsApp del área de servicio al cliente.
     * Puede establecerse vía variable de entorno SERVICE_NUMBER.
     */
    serviceNumber: process.env.SERVICE_NUMBER || "",
    /**
     * Correo electrónico opcional del área de servicio al cliente.
     */
    serviceEmail: process.env.SERVICE_EMAIL || "",
  },
};

export const RESPONSE_TEMPLATES = {
  greeting: (name) =>
    `👋 ¡Hola${
      name ? ` ${name}` : ""
    }! Soy *Mercamio Bot* 🥩\nEstoy listo para tomar tu pedido. Escríbeme por ejemplo: \"4 kg de caderita\".`,
  pendingOrderReminder: (order) =>
    `📌 Ya tenemos un pedido pendiente con nosotros:\n• ${order.orderText}\n⏰ Franja sugerida: ${order.pickupWindow.startLabel} - ${order.pickupWindow.endLabel}.\nSi necesitás modificarlo avisame y te ayudo.`,
  orderCreated: (order) =>
    `🥩 ¡Genial! Registré tu pedido de *${order.orderText}*.\n🕒 Lo recibimos a las ${order.requestedAtLabel}.\n📍 Podés retirarlo ${order.pickupWindow.dayLabel} entre *${order.pickupWindow.startLabel} y ${order.pickupWindow.endLabel}*.\n¿A qué hora dentro de esa franja te gustaría venir?`,
  askForTime: () =>
    "⏰ Contame la hora a la que querés pasar, por ejemplo *13:30*.",
  confirmTime: (order) =>
    `✅ Perfecto, agendamos tu retiro para las *${order.confirmedPickupLabel}*.\n¡Gracias por elegir *Mercamio Carnes*! 🥩`,
  timeOutOfRange: (order) =>
    `⚠️ Ese horario está fuera de la franja propuesta (${order.pickupWindow.startLabel} - ${order.pickupWindow.endLabel}).\nPor favor elegí un horario dentro de ese rango.`,
  defaultMessage: () =>
    "🤖 No pude entender tu mensaje. Podés decirme algo como: \n• *4 kg de caderita*\n• *Hola Mercamio*\n• *13:30* (para confirmar la hora de retiro).",
  error: () =>
    "😓 Tuvimos un inconveniente interno. Intentá nuevamente en unos minutos, por favor.",
};
