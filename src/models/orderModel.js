import dayjs from "dayjs";

/**
 * Construye la estructura base de un pedido.
 */
export function buildOrder({
  customerNumber,
  customerName = "",
  orderText,
  requestedAt,
  pickupWindow,
}) {
  const requestTime = requestedAt ? dayjs(requestedAt) : dayjs();

  return {
    id: `ord-${requestTime.valueOf()}-${Math.floor(Math.random() * 1_000)}`,
    customerNumber,
    customerName,
    orderText,
    requestedAt: requestTime.toISOString(),
    requestedAtLabel: requestTime.format("HH:mm"),
    pickupWindow: {
      ...pickupWindow,
    },
    confirmedPickupAt: null,
    confirmedPickupLabel: null,
    status: "pendiente",
    createdAt: requestTime.toISOString(),
    updatedAt: requestTime.toISOString(),
  };
}

/**
 * Actualiza la marca temporal de actualización del pedido.
 */
export function touchOrder(order) {
  order.updatedAt = dayjs().toISOString();
  return order;
}
