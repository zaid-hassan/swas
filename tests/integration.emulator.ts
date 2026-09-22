// Firestore-emulator integration test for the Sheets → Firestore migration.
//
// Prereqs: Firestore emulator running, and env:
//   FIRESTORE_EMULATOR_HOST=127.0.0.1:8085
//   FIREBASE_PROJECT_ID / FIREBASE_CLIENT_EMAIL / FIREBASE_PRIVATE_KEY
//   NEXT_PUBLIC_ADMIN_EMAIL=admin@x.com
//
// Run: npx tsx tests/integration.emulator.ts

import assert from "node:assert/strict";

process.env.NEXT_PUBLIC_ADMIN_EMAIL ||= "admin@x.com";

import { adminDb } from "../lib/firebase-admin";
import { syncProducts, UnsafeSyncError } from "../lib/product-sync";
import { getProducts, getAllProducts, clearProductsCache } from "../lib/products";
import { PATCH as patchOrder } from "../app/api/admin/orders/[id]/route";
import { PATCH as patchRefund } from "../app/api/admin/refunds/[id]/route";
import { GET as getTracking } from "../app/api/tracking/[orderId]/route";

const ADMIN = process.env.NEXT_PUBLIC_ADMIN_EMAIL!;
const H = { "x-admin-email": ADMIN, "Content-Type": "application/json" };

let passed = 0;
let failed = 0;

async function test(name: string, fn: () => Promise<void>) {
  try {
    await fn();
    passed++;
    console.log(`  PASS  ${name}`);
  } catch (err: any) {
    failed++;
    console.log(`  FAIL  ${name}\n        ${err?.message}`);
  }
}

function row(sNo: number, name: string, mrp = 100, image = "https://x/i.jpg") {
  return { "S No": sNo, "Product Name": name, Category: "Rings", MRP: mrp, Image: image };
}

async function clearAll() {
  for (const col of ["products", "orders", "refunds", "users"]) {
    const snap = await adminDb.collection(col).get();
    const batch = adminDb.batch();
    snap.forEach((d) => batch.delete(d.ref));
    await batch.commit();
  }
}

async function main() {
  console.log(`\nEmulator host: ${process.env.FIRESTORE_EMULATOR_HOST}`);
  await clearAll();

  console.log("\nproduct sync (full replace, soft hide)");

  await test("inserts products", async () => {
    const summary = await syncProducts([row(1, "A"), row(2, "B", 250)]);
    assert.equal(summary.inserted, 2);
    assert.equal(summary.hidden, 0);

    clearProductsCache();
    const storefront = await getProducts();
    assert.equal(storefront.length, 2);
    assert.equal(storefront[0].id, "1");
  });

  await test("re-sync is a no-op (hash skip)", async () => {
    const summary = await syncProducts([row(1, "A"), row(2, "B", 250)]);
    assert.equal(summary.inserted, 0);
    assert.equal(summary.updated, 0);
    assert.equal(summary.skipped, 2);
  });

  await test("removed product is soft-hidden, not deleted", async () => {
    const summary = await syncProducts([row(1, "A")]);
    assert.equal(summary.hidden, 1);

    clearProductsCache();
    const storefront = await getProducts();
    assert.equal(storefront.length, 1);

    const all = await getAllProducts();
    assert.equal(all.length, 2);
    assert.equal(all.find((p) => p.id === "2")!.isVisible, false);

    const raw = await adminDb.collection("products").doc("p-2").get();
    assert.equal(raw.exists, true);
  });

  await test("unsafe upload is rejected without changes", async () => {
    await assert.rejects(
      () => syncProducts([{ "S No": "", "Product Name": "" }]),
      UnsafeSyncError
    );
    const raw = await adminDb.collection("products").doc("p-1").get();
    assert.equal(raw.exists, true);
  });

  console.log("\norders (fulfillment)");

  await test("PATCH sets status/courier/awb", async () => {
    await adminDb.collection("orders").doc("o1").set({
      orderNumber: "SWAS-1",
      status: "paid",
      customer: { name: "Cust" },
      pricing: { total: 500 },
      fulfillment: {},
      createdAt: Date.now(),
    });

    const res = await patchOrder(
      new Request("http://x/api/admin/orders/o1", {
        method: "PATCH",
        headers: H,
        body: JSON.stringify({ status: "shipped", courier: "Delhivery", awb: "A1" }),
      }),
      { params: Promise.resolve({ id: "o1" }) }
    );
    assert.equal(res.status, 200);

    const doc = (await adminDb.collection("orders").doc("o1").get()).data()!;
    assert.equal(doc.status, "shipped");
    assert.equal(doc.fulfillment.courier, "Delhivery");
    assert.equal(doc.fulfillment.awb, "A1");
    assert.ok(doc.fulfillment.shippedAt);
  });

  await test("PATCH rejects bad status and unauthenticated", async () => {
    const bad = await patchOrder(
      new Request("http://x", {
        method: "PATCH",
        headers: H,
        body: JSON.stringify({ status: "banana" }),
      }),
      { params: Promise.resolve({ id: "o1" }) }
    );
    assert.equal(bad.status, 400);

    const unauth = await patchOrder(
      new Request("http://x", {
        method: "PATCH",
        headers: { "x-admin-email": "intruder@x.com", "Content-Type": "application/json" },
        body: JSON.stringify({ status: "shipped" }),
      }),
      { params: Promise.resolve({ id: "o1" }) }
    );
    assert.equal(unauth.status, 403);
  });

  console.log("\ntracking (reads fulfillment)");

  await test("returns fulfillment fields", async () => {
    const res = await getTracking(new Request("http://x"), {
      params: Promise.resolve({ orderId: "o1" }),
    });
    const data = await res.json();
    assert.equal(data.found, true);
    assert.equal(data.status, "shipped");
    assert.equal(data.courier, "Delhivery");
    assert.equal(data.awb, "A1");
  });

  console.log("\nrefunds (review + wallet credit)");

  await test("approve credits wallet exactly once", async () => {
    await adminDb.collection("users").doc("u1").set({ wallet: { coins: 0 } });
    await adminDb.collection("refunds").doc("r1").set({
      orderId: "o1",
      userId: "u1",
      customer: "Cust",
      email: "c@x.com",
      amount: 300,
      reason: "damaged",
      status: "pending",
      coinsAdded: false,
      createdAt: Date.now(),
    });

    const res = await patchRefund(
      new Request("http://x", {
        method: "PATCH",
        headers: H,
        body: JSON.stringify({ action: "approve" }),
      }),
      { params: Promise.resolve({ id: "r1" }) }
    );
    const data = await res.json();
    assert.equal(res.status, 200);
    assert.equal(data.credited, true);

    const wallet = (await adminDb.collection("users").doc("u1").get()).data()!;
    assert.equal(wallet.wallet.coins, 300);

    const refund = (await adminDb.collection("refunds").doc("r1").get()).data()!;
    assert.equal(refund.status, "approved");
    assert.equal(refund.coinsAdded, true);
  });

  await test("second review is rejected (no double credit)", async () => {
    const res = await patchRefund(
      new Request("http://x", {
        method: "PATCH",
        headers: H,
        body: JSON.stringify({ action: "approve" }),
      }),
      { params: Promise.resolve({ id: "r1" }) }
    );
    assert.equal(res.status, 409);

    const wallet = (await adminDb.collection("users").doc("u1").get()).data()!;
    assert.equal(wallet.wallet.coins, 300);
  });

  await test("reject does not credit", async () => {
    await adminDb.collection("refunds").doc("r2").set({
      orderId: "o1",
      userId: "u1",
      amount: 50,
      reason: "x",
      status: "pending",
      coinsAdded: false,
      createdAt: Date.now(),
    });

    const res = await patchRefund(
      new Request("http://x", {
        method: "PATCH",
        headers: H,
        body: JSON.stringify({ action: "reject" }),
      }),
      { params: Promise.resolve({ id: "r2" }) }
    );
    assert.equal(res.status, 200);

    const wallet = (await adminDb.collection("users").doc("u1").get()).data()!;
    assert.equal(wallet.wallet.coins, 300);
  });

  console.log(`\n${passed} passed, ${failed} failed\n`);
  if (failed > 0) process.exit(1);
  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
