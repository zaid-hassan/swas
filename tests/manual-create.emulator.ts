// Emulator integration test for single-product manual create.
//
// Prereqs: Firestore emulator running, and env:
//   FIRESTORE_EMULATOR_HOST=127.0.0.1:8085
//   FIREBASE_PROJECT_ID / FIREBASE_CLIENT_EMAIL / FIREBASE_PRIVATE_KEY
//
// Run: npx tsx tests/manual-create.emulator.ts

import assert from "node:assert/strict";

import { adminDb } from "../lib/firebase-admin";
import { syncProducts } from "../lib/product-sync";
import { createManualProduct } from "../lib/product-create";
import { getProducts, getAllProducts, clearProductsCache } from "../lib/products";

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
  for (const col of ["products", "orders", "refunds", "users", "counters"]) {
    const snap = await adminDb.collection(col).get();
    const batch = adminDb.batch();
    snap.forEach((d) => batch.delete(d.ref));
    await batch.commit();
  }
  clearProductsCache();
}

const manual = {
  name: "Manual Ring",
  category: "Rings",
  description: "Handmade",
  material: "Silver",
  design: "Band",
  finish: "Polished",
  idealFor: "Daily",
  mrp: 450,
  images: ["https://res.cloudinary.com/x/m1.jpg"],
  videos: ["https://res.cloudinary.com/x/mv1.mp4"],
};

async function main() {
  console.log(`\nEmulator host: ${process.env.FIRESTORE_EMULATOR_HOST}`);
  await clearAll();

  console.log("\nmanual create (transactional S No)");

  await test("first create seeds counter from max S No", async () => {
    await syncProducts([row(4, "D"), row(7, "G")]);
    const doc = await createManualProduct(adminDb, manual);
    assert.equal(doc.sNo, 8);
    assert.equal(doc.docId, "p-8");
    assert.equal(doc.source, "manual");
    assert.equal(doc.slug, "manual-ring-8");
    assert.equal(doc.isVisible, true);
    assert.deepEqual([doc.video, doc.video1, doc.video2].filter(Boolean), [
      "https://res.cloudinary.com/x/mv1.mp4",
    ]);

    const counter = (await adminDb.collection("counters").doc("products").get()).data()!;
    assert.equal(counter.lastSNo, 8);
  });

  await test("second create bumps the counter", async () => {
    const doc = await createManualProduct(adminDb, { ...manual, name: "Manual Two" });
    assert.equal(doc.sNo, 9);
  });

  await test("created product appears on the storefront", async () => {
    clearProductsCache();
    const storefront = await getProducts();
    const found = storefront.find((p) => p.id === "8");
    assert.ok(found);
    assert.deepEqual(found!.videos, ["https://res.cloudinary.com/x/mv1.mp4"]);
  });

  console.log("\nmanual vs bulk sync");

  await test("bulk upload hides excel absentees but keeps manual docs", async () => {
    await syncProducts([row(4, "D"), row(7, "G"), row(5, "E")]);
    const summary = await syncProducts([row(4, "D"), row(7, "G")]);
    assert.equal(summary.hidden, 1);
    clearProductsCache();
    const all = await getAllProducts();
    assert.equal(all.find((p) => p.id === "8")!.isVisible, true);
    assert.equal(all.find((p) => p.id === "9")!.isVisible, true);
  });

  await test("excel row reusing a manual S No flips source to excel", async () => {
    await syncProducts([row(4, "D"), row(7, "G"), row(8, "Manual Ring", 450, "https://x/i.jpg")]);
    const raw = (await adminDb.collection("products").doc("p-8").get()).data()!;
    assert.equal(raw.source, "excel");
  });

  console.log(`\n${passed} passed, ${failed} failed\n`);
  if (failed > 0) process.exit(1);
  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
