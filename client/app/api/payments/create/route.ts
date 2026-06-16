import { NextResponse } from "next/server";
import { amountTextToKurus, createPaymentOrder, type PaymentEntitlement, type PaymentProductKind } from "@/lib/paymentSystem";

const validKinds: PaymentProductKind[] = ["chips", "diamonds", "vip", "cue", "cueGift"];

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  if (!body) {
    return NextResponse.json({ error: "Gecersiz istek." }, { status: 400 });
  }

  const kind = body.kind as PaymentProductKind;
  if (!validKinds.includes(kind)) {
    return NextResponse.json({ error: "Gecersiz urun turu." }, { status: 400 });
  }

  const userId = String(body.userId || "").trim();
  const productId = String(body.productId || "").trim();
  const productName = String(body.productName || "").trim();
  const price = String(body.price || "").trim();
  const amount = amountTextToKurus(price);

  if (!userId || !productId || !productName || amount <= 0) {
    return NextResponse.json({ error: "Siparis bilgileri eksik." }, { status: 400 });
  }

  const entitlement: PaymentEntitlement = {
    kind,
    chips: Number(body.chips || 0) || undefined,
    diamonds: Number(body.diamonds || 0) || undefined,
    vipLevel: Number(body.vipLevel || 0) || undefined,
    cueId: Number(body.cueId || 0) || undefined,
    giftTargetId: body.giftTargetId ? String(body.giftTargetId) : undefined,
  };

  const order = createPaymentOrder({
    userId,
    productId,
    productName,
    amount,
    entitlement,
    provider: body.provider || "mock",
  });

  return NextResponse.json({
    orderId: order.id,
    status: order.status,
    amount: order.amount,
    currency: order.currency,
  });
}
