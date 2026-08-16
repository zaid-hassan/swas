import { NextResponse } from "next/server";

export async function GET() {
  try {
    const webhook = process.env.GOOGLE_SHEET_WEBHOOK!;

    const res = await fetch(`${webhook}?action=orders`, {
      redirect: "follow",
      cache: "no-store",
    });

    const text = await res.text();

    const data = JSON.parse(text);

    return NextResponse.json(data);
  } catch (err) {
    console.error(err);

    return NextResponse.json(
      { success: false },
      { status: 500 }
    );
  }
}