import { NextResponse } from "next/server";
import crypto from "crypto";

import { generateInvoice } from "@/lib/invoice/generate-invoice";
import { sendOrderEmails } from "@/lib/email/send-order-email";

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      cart,
      customer,
      address,
      totals,
      userId,
    } = body;

    // --------------------------------------------------------------------------
    // Verify Razorpay Signature
    // --------------------------------------------------------------------------

    const expectedSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET!)
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest("hex");

    if (expectedSignature !== razorpay_signature) {
      console.error("❌ Invalid Razorpay signature");

      return NextResponse.json(
        { success: false, message: "Invalid signature" },
        { status: 400 }
      );
    }

    // --------------------------------------------------------------------------
    // Create Firestore Order
    // --------------------------------------------------------------------------

    // Lazy-load firebase-admin so `next build` doesn't evaluate service
    // account credentials at build time (runtime has real env).
    const { adminDb } = await import("@/lib/firebase-admin");

    const orderRef = adminDb.collection("orders").doc();

    const orderNumber = `SWAS-${Date.now()}`;
    const invoiceNumber = `INV-${Date.now()}`;

    const orderData = {
      userId,
      orderNumber,

      items: cart,

      customer,

      shippingAddress: address,

      pricing: totals,

      payment: {
        provider: "razorpay",
        razorpayOrderId: razorpay_order_id,
        razorpayPaymentId: razorpay_payment_id,
      },

      status: "paid",

      invoice: {
        invoiceNumber,
        generated: false,
      },

      notifications: {
        customerEmail: "pending",
        ownerEmail: "pending",
      },

      fulfillment: {},

      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    await orderRef.set(orderData);

    console.log("✅ Firestore order created:", orderRef.id);

    // --------------------------------------------------------------------------
    // Generate Invoice + Send Emails
    // --------------------------------------------------------------------------

    try {
      const fullOrder = {
        ...orderData,
        id: orderRef.id,
      };

      const invoicePdf = await generateInvoice(fullOrder);

      await sendOrderEmails({
        order: fullOrder,
        invoicePdf,
      });

      await orderRef.update({
        "invoice.generated": true,
        "notifications.customerEmail": "sent",
        "notifications.ownerEmail": "sent",
        updatedAt: Date.now(),
      });

      console.log("📧 Customer & Owner emails sent");
    } catch (emailError) {
      console.error("❌ Email sending failed:", emailError);

      await orderRef.update({
        "notifications.customerEmail": "failed",
        "notifications.ownerEmail": "failed",
        updatedAt: Date.now(),
      });
    }

    return NextResponse.json({
      success: true,
      orderId: orderRef.id,
      orderNumber,
      invoiceNumber,
    });

  } catch (err) {
    console.error("❌ VERIFY PAYMENT ERROR:", err);

    return NextResponse.json(
      { success: false, message: "Server error" },
      { status: 500 }
    );
  }
}