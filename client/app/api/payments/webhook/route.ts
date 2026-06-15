import { NextResponse } from "next/server";
import { markPaymentPaid } from "@/lib/paymentSystem";

function webhookSecret() {
  return process.env.PAYMENT_WEBHOOK_SECRET || "dev-secret";
}

export async function POST(request: Request) {
  const signature = request.headers.get("x-lounge-webhook-secret");
  if (signature !== webhookSecret()) {
    return NextResponse.json({ error: "Yetkisiz odeme bildirimi." }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  if (!body) {
    return NextResponse.json({ error: "Gecersiz odeme bildirimi." }, { status: 400 });
  }

  const order = markPaymentPaid({
    orderId: String(body.orderId || ""),
    providerTransactionId: String(body.providerTransactionId || ""),
    eventId: String(body.eventId || ""),
    amount: Number(body.amount || 0),
  });

  if (!order) {
    return NextResponse.json({ error: "Siparis bulunamadi." }, { status: 404 });
  }

  return NextResponse.json({
    ok: true,
    orderId: order.id,
    status: order.status,
  });
}

