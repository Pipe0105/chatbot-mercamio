import venom from "venom-bot";
import dotenv from "dotenv";
import { handleIncomingMessage } from "../controllers/messageController.js";

dotenv.config();

let clientInstance = null;

async function createClient() {
  if (clientInstance) {
    return clientInstance;
  }

  clientInstance = await venom.create({
    session: process.env.WHATSAPP_SESSION || "mercamio-bot",
    logQR: true,
  });

  clientInstance.onMessage(async (message) => {
    if (message.isGroupMsg) {
      return;
    }

    const conversationId = message.from;

    const sendText = async (text) => {
      if (!text) return;
      await clientInstance.sendText(conversationId, text);
    };

    const sendDirectText = async (to, text) => {
      if (!to || !text) return;
      await clientInstance.sendText(to, text);
    };

    try {
      await handleIncomingMessage(message, {
        sendText,
        sendDirectText,
      });
    } catch (error) {
      console.error("Error general del bot", error);
      await sendText(
        "😓 Estamos experimentando un problema momentáneo. Intentá nuevamente en un instante, por favor."
      );
    }
  });

  console.log("Mercamio Bot listo para recibir mensajes ✨");

  return clientInstance;
}

export async function initializeWhatsAppClient() {
  return createClient();
}

export async function sendText(to, text) {
  const client = await createClient();
  return client.sendText(to, text);
}
