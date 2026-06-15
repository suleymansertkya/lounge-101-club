import { NextResponse } from "next/server";
import { getPaymentOrder } from "@/lib/paymentSystem";

export async function GET(_request: Request, context: { params: Promise<{ orderId: string }> }) {
  const { orderId } = await context.params;
  const order = getPaymentOrder(orderId);

  if (!order) {
    return NextResponse.json({ error: "Siparis bulunamadi." }, { status: 404 });
  }

  return NextResponse.json({
    orderId: order.id,
    status: order.status,
    productId: order.productId,
    productName: order.productName,
    amount: order.amount,
    currency: order.currency,
    entitlement: order.status === "paid" ? order.entitlement : null,
  });
}

