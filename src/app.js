import { initializeWhatsAppClient } from "./services/whatsappService.js";
import dotenv from "dotenv";

dotenv.config();

async function bootstrap() {
  try {
    await initializeWhatsAppClient();
    console.log("Mercamio Bot iniciado correctamente 🥩");
  } catch (error) {
    console.error("Error al iniciar el bot:", error);
    process.exit(1);
  }
}

bootstrap();
