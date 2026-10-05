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
import { POST as postSync } from "../app/api/admin/products/sync/route";
import {
  GET as getHomeVideosRoute,
  PUT as putHomeVideos,
} from "../app/api/admin/home-videos/route";
import { getHomeVideos } from "../lib/site-settings";
import { CAROUSEL_MAX } from "../lib/home-videos";
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
  for (const col of ["products", "orders", "refunds", "users", "settings"]) {
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

  console.log("\nbulk upload (super admin only)");

  await test("bulk sync route rejects admins without the super role", async () => {
    const saved = {
      legacy: process.env.NEXT_PUBLIC_ADMIN_EMAIL,
      admins: process.env.NEXT_PUBLIC_ADMIN_EMAILS,
      supers: process.env.NEXT_PUBLIC_SUPER_ADMIN_EMAILS,
    };

    // ADMIN (the legacy single admin) is the super admin; plain-admin@x.com is
    // an admin without the bulk upload.
    process.env.NEXT_PUBLIC_ADMIN_EMAILS = "plain-admin@x.com";
    delete process.env.NEXT_PUBLIC_SUPER_ADMIN_EMAILS;

    try {
      const call = async (email?: string) => {
        const res = await postSync(
          new Request("http://x/api/admin/products/sync", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              ...(email ? { "x-admin-email": email } : {}),
            },
            // Empty rows on purpose: the role gate must reject before the
            // route's own 400 "No rows provided" (and nothing gets written).
            body: JSON.stringify({ rows: [] }),
          })
        );
        return res.status;
      };

      assert.equal(await call(), 403, "anonymous request");
      assert.equal(await call("plain-admin@x.com"), 403, "plain admin");
      assert.equal(await call(ADMIN), 400, "super admin passes the gate");
    } finally {
      if (saved.legacy === undefined) delete process.env.NEXT_PUBLIC_ADMIN_EMAIL;
      else process.env.NEXT_PUBLIC_ADMIN_EMAIL = saved.legacy;
      if (saved.admins === undefined) delete process.env.NEXT_PUBLIC_ADMIN_EMAILS;
      else process.env.NEXT_PUBLIC_ADMIN_EMAILS = saved.admins;
      if (saved.supers === undefined) delete process.env.NEXT_PUBLIC_SUPER_ADMIN_EMAILS;
      else process.env.NEXT_PUBLIC_SUPER_ADMIN_EMAILS = saved.supers;
    }
  });

  console.log("\nhome page videos (admin editable)");

  await test("home videos default, save, and reach the public read path", async () => {
    const anonymous = await getHomeVideosRoute(
      new Request("http://x/api/admin/home-videos")
    );
    assert.equal(anonymous.status, 403);

    const before = await getHomeVideosRoute(
      new Request("http://x/api/admin/home-videos", { headers: H })
    );
    assert.equal(before.status, 200);
    const beforeBody = await before.json();
    assert.deepEqual(beforeBody.videos, beforeBody.defaults, "nothing stored yet");

    const newHero = "https://res.cloudinary.com/demo/video/upload/v1/hero-v2.mp4";
    const saved = await putHomeVideos(
      new Request("http://x/api/admin/home-videos", {
        method: "PUT",
        headers: H,
        body: JSON.stringify({ hero: newHero }),
      })
    );
    assert.equal(saved.status, 200);
    const savedBody = await saved.json();
    assert.equal(savedBody.videos.hero, newHero);
    assert.deepEqual(
      savedBody.videos.carousel,
      beforeBody.defaults.carousel,
      "untouched slot keeps its default"
    );

    // Public read path used by the home page component.
    assert.equal((await getHomeVideos()).hero, newHero);

    // A plain admin (no super role) can edit the home videos.
    const savedAdmins = process.env.NEXT_PUBLIC_ADMIN_EMAILS;
    process.env.NEXT_PUBLIC_ADMIN_EMAILS = "plain-admin@x.com";
    try {
      const asPlainAdmin = await getHomeVideosRoute(
        new Request("http://x/api/admin/home-videos", {
          headers: { "x-admin-email": "plain-admin@x.com" },
        })
      );
      assert.equal(asPlainAdmin.status, 200, "plain admins may edit home videos");
    } finally {
      if (savedAdmins === undefined) delete process.env.NEXT_PUBLIC_ADMIN_EMAILS;
      else process.env.NEXT_PUBLIC_ADMIN_EMAILS = savedAdmins;
    }

    // Non-video urls are rejected.
    const bad = await putHomeVideos(
      new Request("http://x/api/admin/home-videos", {
        method: "PUT",
        headers: H,
        body: JSON.stringify({ hero: "https://x/poster.jpg" }),
      })
    );
    assert.equal(bad.status, 400);
    assert.equal((await getHomeVideos()).hero, newHero, "rejected write changed nothing");
  });

  await test("carousel holds several clips, rejects bad lists", async () => {
    const a = "https://res.cloudinary.com/demo/video/upload/v1/card-a.mp4";
    const b = "https://res.cloudinary.com/demo/video/upload/v1/card-b.mp4";

    const saved = await putHomeVideos(
      new Request("http://x/api/admin/home-videos", {
        method: "PUT",
        headers: H,
        body: JSON.stringify({ carousel: [a, b] }),
      })
    );
    assert.equal(saved.status, 200);
    assert.deepEqual((await saved.json()).videos.carousel, [a, b]);

    // Public read path used by the home page component.
    assert.deepEqual((await getHomeVideos()).carousel, [a, b]);

    // Single slots are untouched by a carousel-only patch.
    assert.match((await getHomeVideos()).hero, /^https:\/\//);

    const rejected: unknown[] = [
      { carousel: [] },
      { carousel: a },
      { carousel: [a, "https://x/pic.png"] },
      { carousel: [a, "http://x/a.mp4"] },
      {
        carousel: Array.from(
          { length: CAROUSEL_MAX + 1 },
          (_, i) => `https://res.cloudinary.com/demo/video/upload/v1/c${i}.mp4`
        ),
      },
    ];

    for (const body of rejected) {
      const res = await putHomeVideos(
        new Request("http://x/api/admin/home-videos", {
          method: "PUT",
          headers: H,
          body: JSON.stringify(body),
        })
      );
      assert.equal(res.status, 400, JSON.stringify(body));
    }

    assert.deepEqual(
      (await getHomeVideos()).carousel,
      [a, b],
      "rejected writes changed nothing"
    );
  });

  console.log(`\n${passed} passed, ${failed} failed\n`);
  if (failed > 0) process.exit(1);
  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
