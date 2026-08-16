import { NextResponse } from "next/server";

export async function GET() {
  try {
    const webhook = process.env.GOOGLE_SHEET_WEBHOOK!;

    const url = `${webhook}?action=products`;

    const res = await fetch(url, {
      method: "GET",
      redirect: "follow",
      cache: "no-store",
      headers: {
        Accept: "application/json",
      },
    });

    const text = await res.text();

    try {
      const json = JSON.parse(text);
      return NextResponse.json(json);
    } catch {
      console.error("Products API returned HTML:", text.slice(0, 300));

      return NextResponse.json(
        {
          success: false,
          error: "Invalid response from Google Apps Script",
        },
        { status: 500 }
      );
    }
  } catch (err) {
    console.error(err);

    return NextResponse.json(
      {
        success: false,
        error: "Failed to load products",
      },
      { status: 500 }
    );
  }
}