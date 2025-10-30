import { promises as fs } from "fs";
import path from "path";
import { fileURLToPath } from "url";
import dayjs from "dayjs";
import { buildOrder, touchOrder } from "../models/orderModel.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ORDERS_FILE = path.resolve(__dirname, "../data/pedidos.json");

async function ensureStorage() {
  await fs.mkdir(path.dirname(ORDERS_FILE), { recursive: true });
  try {
    await fs.access(ORDERS_FILE);
  } catch (error) {
    await fs.writeFile(ORDERS_FILE, "[]", "utf8");
  }
}

async function readOrders() {
  await ensureStorage();
  const content = await fs.readFile(ORDERS_FILE, "utf8");
  if (!content) {
    return [];
  }
  try {
    return JSON.parse(content);
  } catch (error) {
    console.error(
      "No se pudo interpretar pedidos.json. Se inicializa en blanco.",
      error
    );
    return [];
  }
}

async function writeOrders(orders) {
  await ensureStorage();
  await fs.writeFile(ORDERS_FILE, JSON.stringify(orders, null, 2), "utf8");
}

function isPending(order) {
  return order.status === "pendiente";
}

function isPendingOrConfirmed(order) {
  return order.status === "pendiente" || order.status === "confirmado";
}

function mapPickupWindow(window) {
  const start = dayjs(window.startISO || window.start);
  const end = dayjs(window.endISO || window.end);
  const today = dayjs().startOf("day");
  const tomorrow = dayjs().add(1, "day").startOf("day");
  const startDay = start.startOf("day");

  let dayLabel;
  if (window.dayLabel) {
    dayLabel = window.dayLabel;
  } else if (startDay.isSame(today)) {
    dayLabel = "hoy";
  } else if (startDay.isSame(tomorrow)) {
    dayLabel = "mañana";
  } else {
    dayLabel = start.format("DD/MM");
  }

  return {
    startISO: start.toISOString(),
    endISO: end.toISOString(),
    startLabel: start.format("HH:mm"),
    endLabel: end.format("HH:mm"),
    dayLabel,
  };
}

export async function getOrders() {
  return readOrders();
}

export async function getPendingOrderByCustomer(customerNumber) {
  const orders = await readOrders();
  return orders.find(
    (order) =>
      order.customerNumber === customerNumber &&
      (isPending(order) || order.status === "confirmado")
  );
}

export async function createNewOrder({
  customerNumber,
  customerName,
  orderText,
  pickupWindow,
  requestedAt = dayjs().toISOString(),
}) {
  const orders = await readOrders();
  const existing = orders.find(
    (order) => order.customerNumber === customerNumber && isPending(order)
  );

  if (existing) {
    return { created: false, order: existing };
  }

  const order = buildOrder({
    customerNumber,
    customerName,
    orderText,
    requestedAt,
    pickupWindow: mapPickupWindow(pickupWindow),
  });

  orders.push(order);
  await writeOrders(orders);

  return { created: true, order };
}

export async function confirmOrderPickup({ customerNumber, confirmedTime }) {
  const orders = await readOrders();
  const order = orders
    .filter((item) => item.customerNumber === customerNumber)
    .sort((a, b) => dayjs(b.createdAt).valueOf() - dayjs(a.createdAt).valueOf())
    .find(isPendingOrConfirmed);

  if (!order) {
    return null;
  }

  const pickupWindow = mapPickupWindow(order.pickupWindow);
  const confirmation = dayjs(confirmedTime);

  order.pickupWindow = pickupWindow;
  order.confirmedPickupAt = confirmation.toISOString();
  order.confirmedPickupLabel = confirmation.format("HH:mm");
  order.status = "confirmado";
  touchOrder(order);

  await writeOrders(orders);
  return order;
}

export async function updateOrderStatus(orderId, status) {
  const orders = await readOrders();
  const target = orders.find((order) => order.id === orderId);
  if (!target) {
    return null;
  }

  target.status = status;
  touchOrder(target);
  await writeOrders(orders);
  return target;
}

export async function markOrderAsSent(orderId) {
  return updateOrderStatus(orderId, "enviado");
}
