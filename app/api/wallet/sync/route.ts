import { NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase-admin";
import { FieldValue } from "firebase-admin/firestore";

export async function POST(req: Request) {
  try {
    const { uid, email } = await req.json();

    const webhook = process.env.GOOGLE_SHEET_WEBHOOK!;

    const res = await fetch(`${webhook}?action=refunds`, {
      cache: "no-store",
      redirect: "follow",
    });

    const text = await res.text();
    const data = JSON.parse(text);

    const refunds = data.refunds || [];

    let addedCoins = 0;

    for (const refund of refunds) {
      if (
        refund.email === email &&
        refund.status === "Approved" &&
        refund.coinsAdded !== "Yes"
      ) {
        const coins = Number(refund.amount);

        await adminDb
          .collection("users")
          .doc(uid)
          .set(
            {
              wallet: {
                coins: FieldValue.increment(coins),
              },
            },
            { merge: true }
          );

        await fetch(webhook, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            type: "walletSync",
            row: refund.row,
          }),
        });

        addedCoins += coins;
      }
    }

    const userSnap = await adminDb.collection("users").doc(uid).get();

    return NextResponse.json({
      success: true,
      addedCoins,
      wallet: userSnap.data()?.wallet?.coins || 0,
    });
  } catch (err) {
    console.error(err);

    return NextResponse.json(
      { success: false },
      { status: 500 }
    );
  }
}
