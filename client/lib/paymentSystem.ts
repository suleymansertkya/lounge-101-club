export type PaymentProductKind = "chips" | "vip" | "cue" | "cueGift";
export type PaymentStatus = "pending" | "paid" | "failed" | "refunded";

export interface PaymentEntitlement {
  kind: PaymentProductKind;
  chips?: number;
  vipLevel?: number;
  cueId?: number;
  giftTargetId?: string;
}

export interface PaymentOrder {
  id: string;
  userId: string;
  productId: string;
  productName: string;
  amount: number;
  currency: "TRY";
  status: PaymentStatus;
  provider: "mock" | "stripe" | "appStore" | "playStore" | "facebook";
  providerTransactionId?: string;
  entitlement: PaymentEntitlement;
  createdAt: string;
  updatedAt: string;
}

interface PaymentStore {
  orders: Map<string, PaymentOrder>;
  processedProviderEvents: Set<string>;
}

const globalPaymentStore = globalThis as typeof globalThis & {
  loungePaymentStore?: PaymentStore;
};

export const paymentStore: PaymentStore = globalPaymentStore.loungePaymentStore || {
  orders: new Map<string, PaymentOrder>(),
  processedProviderEvents: new Set<string>(),
};

globalPaymentStore.loungePaymentStore = paymentStore;

export function amountTextToKurus(price: string) {
  const normalized = price
    .replace(/\s/g, "")
    .replace("TL", "")
    .replace(/\./g, "")
    .replace(",", ".");
  const amount = Number(normalized);
  if (!Number.isFinite(amount) || amount <= 0) return 0;
  return Math.round(amount * 100);
}

export function createPaymentOrder(input: {
  userId: string;
  productId: string;
  productName: string;
  amount: number;
  entitlement: PaymentEntitlement;
  provider?: PaymentOrder["provider"];
}) {
  const now = new Date().toISOString();
  const order: PaymentOrder = {
    id: crypto.randomUUID(),
    userId: input.userId,
    productId: input.productId,
    productName: input.productName,
    amount: input.amount,
    currency: "TRY",
    status: "pending",
    provider: input.provider || "mock",
    entitlement: input.entitlement,
    createdAt: now,
    updatedAt: now,
  };

  paymentStore.orders.set(order.id, order);
  return order;
}

export function getPaymentOrder(orderId: string) {
  return paymentStore.orders.get(orderId) || null;
}

export function markPaymentPaid(input: {
  orderId: string;
  providerTransactionId: string;
  eventId: string;
  amount: number;
}) {
  if (paymentStore.processedProviderEvents.has(input.eventId)) {
    return getPaymentOrder(input.orderId);
  }

  const order = getPaymentOrder(input.orderId);
  if (!order) return null;
  if (order.amount !== input.amount) {
    order.status = "failed";
    order.updatedAt = new Date().toISOString();
    paymentStore.processedProviderEvents.add(input.eventId);
    return order;
  }

  if (order.status !== "paid") {
    order.status = "paid";
    order.providerTransactionId = input.providerTransactionId;
    order.updatedAt = new Date().toISOString();
  }

  paymentStore.processedProviderEvents.add(input.eventId);
  return order;
}

