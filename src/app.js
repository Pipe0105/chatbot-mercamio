import venom from "venom-bot";
import dayjs from "dayjs";
import dotenv from "dotenv";

dotenv.config();

venom
  .create({
    session: "mercamio-bot",
  })
  .then((client) => start(client))
  .catch((error) => console.log("Error al iniciar el bot:", error));

function start(client) {
  client.onMessage(async (message) => {
    if (!message.isGroupMsg) {
      const texto = message.body.toLowerCase();

      // Saludo
      if (texto.includes("hola")) {
        await client.sendText(
          message.from,
          "👋 ¡Hola! Soy el asistente virtual de *Mercamio Carnes* 🥩\n¿Qué deseas pedir hoy?"
        );
      }

      // Pedido con "kg"
      else if (texto.includes("kg")) {
        const hora = dayjs();
        const inicio = hora.add(2, "hour").format("HH:mm");
        const fin = hora.add(4, "hour").format("HH:mm");

        await client.sendText(
          message.from,
          `✅ Pedido recibido: *${texto}*\n🕐 Hora actual: ${hora.format(
            "HH:mm"
          )}\n📦 Puedes recogerlo entre *${inicio} y ${fin}*.\n\n¿A qué hora deseas venir por él?`
        );
      }

      // Confirmación de hora
      else if (texto.match(/\d{1,2}:\d{2}/)) {
        await client.sendText(
          message.from,
          "✅ Perfecto, tu pedido será preparado para esa hora.\nGracias por comprar en *Mercamio Carnes* 🥩"
        );
      }

      // Mensaje por defecto
      else {
        await client.sendText(
          message.from,
          "🤖 No entendí tu mensaje. Escribe algo como:\n➡️ '4 kg de caderita'\n➡️ 'Hola'"
        );
      }
    }
  });
}
