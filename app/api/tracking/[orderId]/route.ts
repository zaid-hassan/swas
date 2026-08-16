import { NextResponse } from "next/server";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ orderId: string }> }
) {
  try {
    const { orderId } = await params;

    const webhook = process.env.GOOGLE_SHEET_WEBHOOK!;

    const url = `${webhook}?action=tracking&orderId=${orderId}`;

    const res = await fetch(url, {
      method: "GET",
      redirect: "follow",
      headers: {
        Accept: "application/json",
      },
    });

    const text = await res.text();

    try {
      const json = JSON.parse(text);
      return NextResponse.json(json);
    } catch {
      console.error("Tracking API returned HTML:", text.slice(0, 300));

      return NextResponse.json(
        { found: false, error: "Invalid response from tracking service." },
        { status: 500 }
      );
    }
  } catch (err) {
    console.error(err);

    return NextResponse.json(
      { found: false, error: "Tracking lookup failed." },
      { status: 500 }
    );
  }
}