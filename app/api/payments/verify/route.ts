import { NextResponse } from "next/server";
import crypto from "crypto";

import { adminDb } from "@/lib/firebase-admin";
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

      googleSheet: {
        synced: false,
      },

      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    await orderRef.set(orderData);

    console.log("✅ Firestore order created:", orderRef.id);

    // --------------------------------------------------------------------------
    // Google Sheet Sync
    // --------------------------------------------------------------------------

    const webhook = process.env.GOOGLE_SHEET_WEBHOOK;

    if (!webhook) {
      throw new Error("GOOGLE_SHEET_WEBHOOK missing from .env");
    }

    const payload = {
      orderId: orderRef.id,
      orderNumber,
      invoiceNumber,

      date: new Date().toLocaleString("en-IN"),

      customer: customer.name,
      email: customer.email,
      phone: customer.phone,

      address:
        `${address.addressLine1 || ""}, ${address.addressLine2 || ""}, ` +
        `${address.city || ""}, ${address.state || ""} - ${address.pincode || ""}`,

      productIds: cart.map((i: any) => i.id).join(", "),

      items: cart.map((i: any) => `${i.name} × ${i.quantity}`).join(" | "),

      amount: totals.total,

      status: "Paid",
    };

    console.log("📤 Sending to Google Sheet...");

    try {
      const controller = new AbortController();

      const timeout = setTimeout(() => controller.abort(), 10000);

      const sheetRes = await fetch(webhook, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
        signal: controller.signal,
      });

      clearTimeout(timeout);

      const responseText = await sheetRes.text();

      console.log("📥 Google Sheet:", sheetRes.status);

      await orderRef.update({
        googleSheet: {
          synced: sheetRes.ok,
          status: sheetRes.status,
          response: responseText,
          syncedAt: Date.now(),
        },
      });
    } catch (sheetError) {
      console.error("❌ Google Sheet failed:", sheetError);

      await orderRef.update({
        googleSheet: {
          synced: false,
          error: String(sheetError),
          syncedAt: Date.now(),
        },
      });
    }

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