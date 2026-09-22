import { NextResponse } from "next/server";

// GET /api/tracking/:orderId — reads fulfillment straight off the order doc.
export async function GET(
  req: Request,
  { params }: { params: Promise<{ orderId: string }> }
) {
  try {
    const { orderId } = await params;

    if (!orderId) {
      return NextResponse.json({ found: false, error: "Missing order id" }, { status: 400 });
    }

    const { adminDb } = await import("@/lib/firebase-admin");
    const snap = await adminDb.collection("orders").doc(orderId).get();

    if (!snap.exists) {
      return NextResponse.json({ found: false }, { status: 404 });
    }

    const data = snap.data() as any;
    const fulfillment = data.fulfillment ?? {};

    return NextResponse.json({
      found: true,
      orderNumber: data.orderNumber ?? "",
      status: data.status ?? "confirmed",
      courier: fulfillment.courier ?? "",
      awb: fulfillment.awb ?? "",
      trackingUrl: fulfillment.trackingUrl ?? "",
    });
  } catch (err) {
    console.error("tracking lookup failed:", err);
    return NextResponse.json(
      { found: false, error: "Tracking lookup failed." },
      { status: 500 }
    );
  }
}
