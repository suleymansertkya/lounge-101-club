import { NextResponse } from "next/server";
import { getPaymentOrder, markPaymentPaid } from "@/lib/paymentSystem";

export async function POST(request: Request) {
  if (process.env.NODE_ENV === "production") {
    return NextResponse.json({ error: "Test onayi canli ortamda kapali." }, { status: 403 });
  }

  const body = await request.json().catch(() => null);
  const orderId = String(body?.orderId || "");
  const order = getPaymentOrder(orderId);

  if (!order) {
    return NextResponse.json({ error: "Siparis bulunamadi." }, { status: 404 });
  }

  const paidOrder = markPaymentPaid({
    orderId,
    amount: order.amount,
    providerTransactionId: `mock_${crypto.randomUUID()}`,
    eventId: `mock_evt_${crypto.randomUUID()}`,
  });

  return NextResponse.json({
    ok: true,
    orderId,
    status: paidOrder?.status || "failed",
  });
}

