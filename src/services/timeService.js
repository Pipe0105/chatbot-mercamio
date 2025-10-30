import dayjs from "dayjs";
import { BOT_CONFIG } from "../config/config.js";

function getBusinessBoundary(base, hour, minute) {
  return base.hour(hour).minute(minute).second(0).millisecond(0);
}

/**
 * Calcula la franja sugerida para retirar el pedido a partir del horario actual.
 * Si el pedido llega fuera del horario de atención se traslada automáticamente
 * al próximo día hábil a la hora de apertura.
 */
export function calculatePickupWindow(reference = dayjs()) {
  const now = reference.clone();
  const {
    businessHours: { startHour, startMinute, endHour, endMinute },
    preparationMinutes,
    pickupWindowMinutes,
  } = BOT_CONFIG;

  const openingToday = getBusinessBoundary(now.clone(), startHour, startMinute);
  const closingToday = getBusinessBoundary(now.clone(), endHour, endMinute);

  let start = now.add(preparationMinutes, "minute");

  const requestIsAfterClosing =
    now.isAfter(closingToday) || now.isSame(closingToday);
  const preparationGoesBeyondClosing = start.isAfter(closingToday);

  if (requestIsAfterClosing || preparationGoesBeyondClosing) {
    // Pasamos al día siguiente a primera hora de apertura.
    start = openingToday.add(1, "day");
  }

  // Si el pedido llega antes de la apertura, mover la franja a la apertura.
  if (now.isBefore(openingToday) && start.isBefore(openingToday)) {
    start = openingToday;
  }

  const end = start.add(pickupWindowMinutes, "minute");

  const today = dayjs().startOf("day");
  const tomorrow = today.add(1, "day");
  const startDay = start.startOf("day");

  let dayLabel = "hoy";
  if (startDay.isSame(tomorrow)) {
    dayLabel = "mañana";
  } else if (!startDay.isSame(today)) {
    dayLabel = start.format("DD/MM");
  }

  return {
    start: start.toISOString(),
    end: end.toISOString(),
    startLabel: start.format("HH:mm"),
    endLabel: end.format("HH:mm"),
    dayLabel,
  };
}

export function isTimeWithinWindow(time, window) {
  const start = dayjs(window.startISO || window.start);
  const end = dayjs(window.endISO || window.end);
  const target = dayjs(time);
  return (
    target.isAfter(start.subtract(1, "minute")) &&
    target.isBefore(end.add(1, "minute"))
  );
}
