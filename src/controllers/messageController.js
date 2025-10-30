import dayjs from "dayjs";
import {
  createNewOrder,
  confirmOrderPickup,
  getPendingOrderByCustomer,
} from "./orderController.js";
import {
  calculatePickupWindow,
  isTimeWithinWindow,
} from "../services/timeService.js";
import { RESPONSE_TEMPLATES } from "../config/config.js";
import { notifyConfirmedOrder } from "../services/notifyService.js";

const GREETING_KEYWORDS = [
  "hola",
  "buenas",
  "buenos dias",
  "buenas tardes",
  "buenas noches",
];

const ORDER_REGEX = /(\d+[\.,]?\d*)\s*(kg|kilo|kilos|gr|gramos)/i;
const TIME_REGEX = /(\d{1,2})[:h.](\d{2})/i;

function getCustomerName(message) {
  return (
    message?.sender?.pushname ||
    message?.notifyName ||
    message?.contact?.name ||
    ""
  );
}

function normalizeText(text = "") {
  return text.trim().toLowerCase();
}

function isGreeting(text) {
  const normalized = normalizeText(text);
  return GREETING_KEYWORDS.some((keyword) => normalized.startsWith(keyword));
}

function isOrderMessage(text) {
  return ORDER_REGEX.test(text) || normalizeText(text).includes("pedido");
}

function extractTime(text) {
  const match = text.match(TIME_REGEX);
  if (!match) {
    return null;
  }
  const [_, hours, minutes] = match;
  return { hours: Number(hours), minutes: Number(minutes) };
}

function formatOrderForResponse(order) {
  if (!order) return null;
  const pickupWindow = order.pickupWindow || {};
  const start = pickupWindow.startISO || pickupWindow.start;
  const end = pickupWindow.endISO || pickupWindow.end;

  const startDate = start ? dayjs(start) : null;
  const endDate = end ? dayjs(end) : startDate;

  let dayLabel = pickupWindow.dayLabel;
  if (!dayLabel && startDate) {
    const today = dayjs().startOf("day");
    const tomorrow = today.add(1, "day");
    const startDay = startDate.startOf("day");

    if (startDay.isSame(today)) {
      dayLabel = "hoy";
    } else if (startDay.isSame(tomorrow)) {
      dayLabel = "mañana";
    } else {
      dayLabel = startDate.format("DD/MM");
    }
  }

  return {
    ...order,
    pickupWindow: {
      startISO: startDate ? startDate.toISOString() : pickupWindow.startISO,
      endISO: endDate ? endDate.toISOString() : pickupWindow.endISO,
      startLabel: startDate
        ? startDate.format("HH:mm")
        : pickupWindow.startLabel,
      endLabel: endDate ? endDate.format("HH:mm") : pickupWindow.endLabel,
      dayLabel,
    },
  };
}

export async function handleIncomingMessage(message, context) {
  const { sendText, sendDirectText } = context;
  const rawText = message.body || "";
  const text = rawText.trim();
  const customerNumber = message.from;
  const customerName = getCustomerName(message).split(" ")[0] || "";

  try {
    const existingOrder = await getPendingOrderByCustomer(customerNumber);

    const formattedExistingOrder = formatOrderForResponse(existingOrder);

    if (isGreeting(text)) {
      if (formattedExistingOrder) {
        await sendText(
          RESPONSE_TEMPLATES.pendingOrderReminder(formattedExistingOrder)
        );
      } else {
        await sendText(RESPONSE_TEMPLATES.greeting(customerName));
      }
      return;
    }

    const timeData = extractTime(text);
    if (timeData) {
      if (!formattedExistingOrder) {
        await sendText(
          "📦 Todavía no tengo un pedido registrado. Decime por ejemplo: *4 kg de caderita*."
        );
        return;
      }

      const confirmationDate = dayjs(
        formattedExistingOrder.pickupWindow.startISO
      ).hour(timeData.hours);
      const confirmed = confirmationDate.minute(timeData.minutes);

      if (!isTimeWithinWindow(confirmed, formattedExistingOrder.pickupWindow)) {
        await sendText(
          RESPONSE_TEMPLATES.timeOutOfRange(formattedExistingOrder)
        );
        return;
      }

      const updatedOrder = await confirmOrderPickup({
        customerNumber,
        confirmedTime: confirmed.toISOString(),
      });

      if (updatedOrder) {
        const formatted = formatOrderForResponse(updatedOrder);
        await sendText(RESPONSE_TEMPLATES.confirmTime(formatted));
        await notifyConfirmedOrder(updatedOrder, {
          sendWhatsAppMessage: sendDirectText,
        });
      } else {
        await sendText(RESPONSE_TEMPLATES.error());
      }
      return;
    }

    if (isOrderMessage(text)) {
      if (
        formattedExistingOrder &&
        formattedExistingOrder.status !== "enviado"
      ) {
        await sendText(
          RESPONSE_TEMPLATES.pendingOrderReminder(formattedExistingOrder)
        );
        return;
      }

      const pickupWindow = calculatePickupWindow(dayjs());
      const { created, order } = await createNewOrder({
        customerNumber,
        customerName,
        orderText: rawText,
        pickupWindow,
        requestedAt: dayjs().toISOString(),
      });

      if (!created) {
        await sendText(
          RESPONSE_TEMPLATES.pendingOrderReminder(formatOrderForResponse(order))
        );
        return;
      }

      await sendText(
        RESPONSE_TEMPLATES.orderCreated(formatOrderForResponse(order))
      );
      await sendText(RESPONSE_TEMPLATES.askForTime());
      return;
    }

    if (formattedExistingOrder) {
      await sendText(
        RESPONSE_TEMPLATES.pendingOrderReminder(formattedExistingOrder)
      );
      return;
    }

    await sendText(RESPONSE_TEMPLATES.defaultMessage());
  } catch (error) {
    console.error("Error al procesar el mensaje", error);
    await sendText(RESPONSE_TEMPLATES.error());
  }
}
