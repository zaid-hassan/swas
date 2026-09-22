import assert from "node:assert/strict";

import {
  normalizeProductRow,
  docToProduct,
  productHash,
  slugify,
  productDocId,
} from "../lib/product-rows";
import { buildSyncPlan } from "../lib/product-sync";
import { isAdminEmail, requireAdmin } from "../lib/admin-auth";
import { buildRefundReview } from "../lib/refunds";
import { buildFulfillmentPatch } from "../lib/orders";

let passed = 0;
let failed = 0;

function test(name: string, fn: () => void) {
  try {
    fn();
    passed++;
    console.log(`  PASS  ${name}`);
  } catch (err: any) {
    failed++;
    console.log(`  FAIL  ${name}\n        ${err?.message}`);
  }
}

const sheetRow = {
  "S No": 42,
  Category: "Necklace",
  "Product Name": "Gold Plated Necklace",
  Description: "Nice",
  Material: "Brass",
  Design: "Floral",
  Finish: "Gold",
  IdealFor: "Women",
  MRP: "1499",
  Image: "https://res.cloudinary.com/x/a.jpg",
  Image1: "https://res.cloudinary.com/x/a.jpg",
  Image2: "https://res.cloudinary.com/x/b.jpg",
  Image3: "",
  "DATE OF ADD": "2026-01-01",
};

console.log("\nproduct-rows");

test("slugify", () => {
  assert.equal(slugify("Gold Plated Necklace!"), "gold-plated-necklace");
});

test("productDocId", () => {
  assert.equal(productDocId(42), "p-42");
});

test("normalize valid row", () => {
  const { doc } = normalizeProductRow(sheetRow);
  assert.ok(doc);
  assert.equal(doc!.sNo, 42);
  assert.equal(doc!.docId, "p-42");
  assert.equal(doc!.mrp, 1499);
  assert.equal(doc!.slug, "gold-plated-necklace-42");
  assert.equal(doc!.isVisible, true);
  assert.ok(doc!.hash.length > 0);
});

test("invalid S No rejected", () => {
  const { doc, error } = normalizeProductRow({ ...sheetRow, "S No": "" });
  assert.equal(doc, null);
  assert.match(error!, /Invalid S No/);
});

test("missing name rejected", () => {
  const { doc, error } = normalizeProductRow({ ...sheetRow, "Product Name": "" });
  assert.equal(doc, null);
  assert.match(error!, /missing Product Name/);
});

test("mrp 0 + no image => hidden", () => {
  const { doc } = normalizeProductRow({
    ...sheetRow,
    MRP: 0,
    Image: "",
    Image1: "",
    Image2: "",
    Image3: "",
  });
  assert.equal(doc!.isVisible, false);
});

test("case-insensitive key fallback", () => {
  const { doc } = normalizeProductRow({ sno: 7, name: "Ring", category: "Rings", mrp: 500, image: "https://x/r.jpg" });
  assert.ok(doc);
  assert.equal(doc!.sNo, 7);
  assert.equal(doc!.mrp, 500);
});

test("hash stable / changes with content", () => {
  const a = normalizeProductRow(sheetRow).doc!;
  const b = normalizeProductRow(sheetRow).doc!;
  const c = normalizeProductRow({ ...sheetRow, MRP: "1999" }).doc!;
  assert.equal(a.hash, b.hash);
  assert.notEqual(a.hash, c.hash);
});

test("docToProduct dedupes images", () => {
  const { doc } = normalizeProductRow(sheetRow);
  const p = docToProduct(doc!);
  assert.equal(p.id, "42");
  assert.equal(p.price, 1499);
  assert.deepEqual(p.images, [
    "https://res.cloudinary.com/x/a.jpg",
    "https://res.cloudinary.com/x/b.jpg",
  ]);
});

test("productHash deterministic", () => {
  const base: any = {
    sNo: 1,
    docId: "p-1",
    category: "Rings",
    name: "Ring",
    description: "",
    material: "",
    design: "",
    finish: "",
    idealFor: "",
    mrp: 100,
    image: "https://x/1.jpg",
    image1: "",
    image2: "",
    image3: "",
    dateOfAdd: "",
    slug: "ring-1",
    isVisible: true,
  };
  assert.equal(productHash(base), productHash({ ...base }));
  assert.notEqual(productHash(base), productHash({ ...base, mrp: 200 }));
});

console.log("\nproduct-sync (full-replace, soft-hide)");

function row(sNo: number, name: string, mrp = 100, image = "https://x/i.jpg") {
  return { "S No": sNo, "Product Name": name, Category: "C", MRP: mrp, Image: image };
}

test("inserts new products", () => {
  const plan = buildSyncPlan([row(1, "A")], new Map());
  assert.equal(plan.safe, true);
  assert.equal(plan.writes.length, 1);
  assert.equal(plan.writes[0].action, "insert");
  assert.equal(plan.hides.length, 0);
});

test("skips unchanged products", () => {
  const doc = normalizeProductRow(row(1, "A")).doc!;
  const existing = new Map([[doc.docId, { hash: doc.hash, isVisible: doc.isVisible }]]);
  const plan = buildSyncPlan([row(1, "A")], existing);
  assert.equal(plan.writes.length, 0);
  assert.equal(plan.skipped, 1);
});

test("updates changed products", () => {
  const doc = normalizeProductRow(row(1, "A")).doc!;
  const existing = new Map([[doc.docId, { hash: doc.hash, isVisible: doc.isVisible }]]);
  const plan = buildSyncPlan([row(1, "A", 999)], existing);
  assert.equal(plan.writes.length, 1);
  assert.equal(plan.writes[0].action, "update");
});

test("soft-hides products missing from the file", () => {
  const existing = new Map([
    ["p-1", { hash: "x", isVisible: true }],
    ["p-2", { hash: "y", isVisible: false }],
  ]);
  const plan = buildSyncPlan([row(3, "New")], existing);
  assert.deepEqual(plan.hides, ["p-1"]);
});

test("unsafe when zero valid rows", () => {
  const plan = buildSyncPlan([{ "S No": "", "Product Name": "" }], new Map());
  assert.equal(plan.safe, false);
  assert.equal(plan.validCount, 0);
});

test("unsafe when invalid >= valid", () => {
  const rows = [row(1, "A"), { "S No": "", "Product Name": "" }, { "S No": "x", "Product Name": "" }];
  const plan = buildSyncPlan(rows, new Map());
  assert.equal(plan.safe, false);
  assert.equal(plan.errors.length, 2);
  assert.equal(plan.validCount, 1);
});

test("safe when valid > invalid", () => {
  const rows = [row(1, "A"), row(2, "B"), { "S No": "", "Product Name": "" }];
  const plan = buildSyncPlan(rows, new Map());
  assert.equal(plan.safe, true);
});

console.log("\nadmin-auth (fail-closed)");

test("denies when env unset", () => {
  const prev = process.env.NEXT_PUBLIC_ADMIN_EMAIL;
  delete process.env.NEXT_PUBLIC_ADMIN_EMAIL;
  assert.equal(isAdminEmail("a@b.com"), false);
  if (prev !== undefined) process.env.NEXT_PUBLIC_ADMIN_EMAIL = prev;
});

test("allows matching email only", () => {
  const prev = process.env.NEXT_PUBLIC_ADMIN_EMAIL;
  process.env.NEXT_PUBLIC_ADMIN_EMAIL = "admin@x.com";
  assert.equal(isAdminEmail("admin@x.com"), true);
  assert.equal(isAdminEmail("other@x.com"), false);
  assert.equal(isAdminEmail(null), false);
  if (prev !== undefined) process.env.NEXT_PUBLIC_ADMIN_EMAIL = prev;
  else delete process.env.NEXT_PUBLIC_ADMIN_EMAIL;
});

test("requireAdmin reads x-admin-email header", () => {
  const prev = process.env.NEXT_PUBLIC_ADMIN_EMAIL;
  process.env.NEXT_PUBLIC_ADMIN_EMAIL = "admin@x.com";
  assert.equal(requireAdmin(new Request("http://x", { headers: { "x-admin-email": "admin@x.com" } })), true);
  assert.equal(requireAdmin(new Request("http://x", { headers: { "x-admin-email": "no@x.com" } })), false);
  assert.equal(requireAdmin(new Request("http://x")), false);
  if (prev !== undefined) process.env.NEXT_PUBLIC_ADMIN_EMAIL = prev;
  else delete process.env.NEXT_PUBLIC_ADMIN_EMAIL;
});

console.log("\nrefunds (review + coin credit)");

test("approve with user credits once", () => {
  const plan = buildRefundReview({ status: "pending", amount: 100, userId: "u1" }, "approve", 1000);
  assert.equal(plan.status, "approved");
  assert.equal(plan.creditCoins, true);
  assert.equal(plan.coinAmount, 100);
  assert.equal(plan.coinsAdded, true);
  assert.equal(plan.coinsAddedAt, 1000);
});

test("approve without user does not credit", () => {
  const plan = buildRefundReview({ status: "pending", amount: 100, userId: null }, "approve");
  assert.equal(plan.status, "approved");
  assert.equal(plan.creditCoins, false);
  assert.equal(plan.coinsAdded, false);
});

test("approve already-credited does not double credit", () => {
  const plan = buildRefundReview({ status: "pending", amount: 100, userId: "u1", coinsAdded: true }, "approve");
  assert.equal(plan.creditCoins, false);
  assert.equal(plan.coinsAdded, true);
});

test("reject never credits", () => {
  const plan = buildRefundReview({ status: "pending", amount: 100, userId: "u1" }, "reject");
  assert.equal(plan.status, "rejected");
  assert.equal(plan.creditCoins, false);
});

console.log("\norders (fulfillment)");

test("sets courier + awb", () => {
  const patch = buildFulfillmentPatch({ status: "paid" }, { courier: "Delhivery", awb: " A1 " });
  assert.equal(patch.fulfillment.courier, "Delhivery");
  assert.equal(patch.fulfillment.awb, "A1");
});

test("shipped stamps shippedAt once", () => {
  const first = buildFulfillmentPatch({ status: "paid" }, { status: "shipped" }, 500);
  assert.equal(first.status, "shipped");
  assert.equal(first.fulfillment.shippedAt, 500);

  const second = buildFulfillmentPatch(
    { status: "shipped", fulfillment: first.fulfillment },
    { status: "shipped" },
    900
  );
  assert.equal(second.fulfillment.shippedAt, 500);
});

test("delivered stamps shippedAt + deliveredAt", () => {
  const patch = buildFulfillmentPatch({ status: "shipped" }, { status: "delivered" }, 700);
  assert.equal(patch.status, "delivered");
  assert.equal(patch.fulfillment.shippedAt, 700);
  assert.equal(patch.fulfillment.deliveredAt, 700);
});

test("invalid status ignored", () => {
  const patch = buildFulfillmentPatch({ status: "paid" }, { status: "banana" });
  assert.equal(patch.status, undefined);
});

console.log(`\n${passed} passed, ${failed} failed\n`);
if (failed > 0) process.exit(1);
