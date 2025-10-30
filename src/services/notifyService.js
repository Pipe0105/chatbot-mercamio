import nodemailer from "nodemailer";
import { BOT_CONFIG } from "../config/config.js";

function buildSummary(order) {
  return `📬 Pedido confirmado\nCliente: ${
    order.customerName || order.customerNumber
  }\nNúmero: ${order.customerNumber}\nPedido: ${order.orderText}\nRetiro: ${
    order.pickupWindow.dayLabel
  } ${order.confirmedPickupLabel}`;
}

async function sendEmailNotification(order) {
  const { serviceEmail } = BOT_CONFIG.notifications;
  const smtpUser = process.env.SMTP_USER;
  const smtpPass = process.env.SMTP_PASS;
  const smtpHost = process.env.SMTP_HOST;

  if (!serviceEmail || !smtpUser || !smtpPass || !smtpHost) {
    return false;
  }

  const transporter = nodemailer.createTransport({
    host: smtpHost,
    port: Number(process.env.SMTP_PORT || 587),
    secure: false,
    auth: {
      user: smtpUser,
      pass: smtpPass,
    },
  });

  await transporter.sendMail({
    from: `Mercamio Bot <${smtpUser}>`,
    to: serviceEmail,
    subject: "Nuevo pedido confirmado",
    text: buildSummary(order),
  });

  return true;
}

export async function notifyConfirmedOrder(order, options = {}) {
  const { sendWhatsAppMessage } = options;
  const { serviceNumber } = BOT_CONFIG.notifications;
  const summary = buildSummary(order);

  let delivered = false;

  if (sendWhatsAppMessage && serviceNumber) {
    try {
      await sendWhatsAppMessage(`${serviceNumber}`, summary);
      delivered = true;
    } catch (error) {
      console.error("No se pudo enviar la notificación por WhatsApp", error);
    }
  }

  if (!delivered) {
    try {
      delivered = await sendEmailNotification(order);
    } catch (error) {
      console.error("No se pudo enviar la notificación por correo", error);
    }
  }

  if (!delivered) {
    console.log("Notificación pendiente de envío. Resumen:", summary);
  }
}
