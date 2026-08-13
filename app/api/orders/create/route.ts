import { NextResponse } from "next/server";
import { razorpay } from "@/lib/razorpay";

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const amount = body.total;

    if (!amount || amount <= 0) {
      return NextResponse.json(
        { error: "Invalid amount" },
        { status: 400 }
      );
    }

    const order = await razorpay.orders.create({
      amount: amount * 100,
      currency: "INR",
      receipt: `SWAS-${Date.now()}`,
    });

    return NextResponse.json(order);
  } catch (err) {
    console.error(err);

    return NextResponse.json(
      { error: "Unable to create order" },
      { status: 500 }
    );
  }
}