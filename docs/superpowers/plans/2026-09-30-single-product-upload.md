# Single-Product Upload Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a dashboard form that creates one product with 3 images + 3 videos via Cloudinary into the existing Firestore `products` shape.

**Architecture:** Browser uploads media direct to Cloudinary (unsigned preset); `POST /api/admin/products` allocates S No in a `counters/products` transaction, builds the doc through the shared `normalizeProductRow` path with `source:'manual'`, and bulk sync skips manual docs when hiding.

**Tech Stack:** Next.js App Router, Cloudinary unsigned upload (`resource_type: auto`), Firestore Admin SDK, existing `sonner` toasts + shadcn `Input`/`Button`/`Card`.

**Spec:** `docs/superpowers/specs/2026-09-30-single-product-upload-design.md`

## Status (2026-10-05)

Tasks 1–5 are implemented and committed (`ec2b163` … `ccbf79a`), the emulator
coverage committed in `7bc5eed` now actually runs, and Task 6 verification
passes. Two defects found while verifying were fixed:

1. **`npm run build` failed** (pre-existing on `main`, not feature-specific):
   `lib/razorpay.ts` and `lib/email/send-order-email.ts` constructed their SDK
   clients at module scope, so page-data collection threw on missing
   credentials — same class as `b76f1d6` for firebase-admin. Both are now
   lazy (`getRazorpay()`, per-call `Resend`).
2. **Video-only manual products were created hidden.** `normalizeProductRow`
   derived `isVisible` from images only, while `validateManualInput` accepts
   video-only input (pinned by test), so such a product silently never reached
   the storefront. Visibility now counts any media slot.

Also: `interleaveMedia` moved from `ProductImageGallery.tsx` to
`lib/media-upload.ts` so the gallery order is unit-pinned; submit is now
disabled while a Cloudinary upload is in flight, when a slot errored, or when
the Cloudinary env is missing (spec §10); `scripts/emulator-test.ts` +
`test:emulator` / `test:emulator:integration` scripts make the emulator suites
runnable in one command.

**Verification record:**

| Check | Command | Result |
| --- | --- | --- |
| Unit | `npm run test:migration` | 42 passed, 0 failed |
| Emulator (manual create) | `npm run test:emulator` | 5 passed, 0 failed |
| Emulator (sync/orders/refunds) | `npm run test:emulator:integration` | 10 passed, 0 failed |
| Types | `npx tsc --noEmit` | clean |
| Build | `npm run build` | exit 0, 37 routes |
| Route matrix | POST `/api/admin/products` on the built server | 403 no header, 403 wrong email, 400 zero media, 400 bad extension, 200 create |
| Storefront readback | `GET /api/products` + `/shop/{slug}` | manual doc `source:'manual'`, video renders in gallery, page 200 |

Still open (needs the human, not code): Task 6 Step 1 — create the unsigned
Cloudinary preset (`resource_type: auto`, folder `swas/products`) and set
`NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME` / `NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET`
in `.env.local` and Vercel. Until then the form renders its inline
"Cloudinary cloud name is not configured" error and keeps submit disabled.


## Global Constraints

- Admin routes gate with `requireAdmin(req)` from `lib/admin-auth.ts` (fail-closed `x-admin-email` check) — every new route step asserts 403 first.
- No new npm dependencies.
- No `next.config.ts` change (`res.cloudinary.com` already allowed; videos use `<video>`, not `next/image`).
- `productHash` includes video fields, excludes `source`.
- Bulk-sync behavior for `excel` docs is unchanged.

## Review Focus

- Excel row reusing a manual S No → row wins and `source` flips to `'excel'` (test added in Task 2).
- Cloudinary preset missing/misconfigured → per-slot error, submit stays blocked (test added in Task 5 via `assertConfigured`).
- Zero-media submit → `400` (test added in Task 3 via `validateManualInput`).
- Two admins creating simultaneously → second gets bumped S No, no overwrite (manual checklist in Task 6; transaction serializes on the counter).
- Cloudinary URL with query params (`.../x.mp4?tx=...`) → extension check strips query strings (test added in Task 5).

---

### Task 1: Schema — video fields + source

**Files:**
- Modify: `lib/product-rows.ts`
- Modify: `types/products.ts`
- Modify: `lib/products.ts` (`toNormalized` only)
- Test: `tests/migration.test.ts` (append)

**Interfaces:**
- Consumes: nothing new.
- Produces: `NormalizedProductDoc` gains `video: string; video1: string; video2: string; source: 'excel' | 'manual'`; `Product` gains `videos: string[]`; `docToProduct(doc): Product` fills `videos` from the 3 slots filtered; `normalizeProductRow` picks `Video/Video1/Video2` keys and defaults `source: 'excel'`.

- [ ] **Step 1: Write the failing tests** — append to `tests/migration.test.ts`:

```ts
test("normalize picks video fields, defaults source excel", () => {
  const { doc } = normalizeProductRow({ ...sheetRow, Video: "https://res.cloudinary.com/x/v.mp4" });
  assert.equal(doc!.video, "https://res.cloudinary.com/x/v.mp4");
  assert.equal(doc!.source, "excel");
});
test("hash changes when video changes", () => {
  const a = normalizeProductRow(sheetRow).doc!;
  const b = normalizeProductRow({ ...sheetRow, Video: "https://res.cloudinary.com/x/v.mp4" }).doc!;
  assert.notEqual(a.hash, b.hash);
});
test("docToProduct exposes videos, images unchanged", () => {
  const p = docToProduct(normalizeProductRow({ ...sheetRow, Video: "https://res.cloudinary.com/x/v.mp4" }).doc!);
  assert.deepEqual(p.videos, ["https://res.cloudinary.com/x/v.mp4"]);
  assert.deepEqual(p.images, ["https://res.cloudinary.com/x/a.jpg", "https://res.cloudinary.com/x/b.jpg"]);
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx tsx tests/migration.test.ts`
Expected: FAIL — `video`/`source`/`videos` undefined.

- [ ] **Step 3: Implement in `lib/product-rows.ts`, `types/products.ts`, `lib/products.ts`**

Add the fields, extend the `productHash` join list with the three video fields only, pick the Video keys, map `videos` in `docToProduct`, pass the four fields through `toNormalized` with `?? ""` / `?? 'excel'` defaults.

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx tsx tests/migration.test.ts`
Expected: PASS, including all pre-existing tests.

- [ ] **Step 5: Commit**

```bash
git add lib/product-rows.ts types/products.ts lib/products.ts tests/migration.test.ts
git commit -m "feat: product video fields and source metadata"
```

### Task 2: Sync — never hide manual products

**Files:**
- Modify: `lib/product-sync.ts` (`buildSyncPlan` + `syncProducts` existing-map)
- Test: `tests/migration.test.ts` (append)

**Interfaces:**
- Consumes: `NormalizedProductDoc.source` from Task 1.
- Produces: `buildSyncPlan(rows, existing: Map<string, { hash?: string; isVisible?: boolean; source?: string }>)` — hides loop skips `prev.source === 'manual'`.

- [ ] **Step 1: Write the failing tests**

```ts
test("manual docs are never hidden", () => {
  const existing = new Map([["p-9", { hash: "x", isVisible: true, source: "manual" }]]);
  const plan = buildSyncPlan([{ "S No": 1, "Product Name": "A", Category: "C", MRP: 100, Image: "https://x/i.jpg" }], existing);
  assert.deepEqual(plan.hides, []);
});
test("excel row reusing a manual S No wins and flips source", () => {
  const existing = new Map([["p-9", { hash: "old", isVisible: true, source: "manual" }]]);
  const plan = buildSyncPlan([{ "S No": 9, "Product Name": "A", Category: "C", MRP: 100, Image: "https://x/i.jpg" }], existing);
  assert.equal(plan.writes.length, 1);
  assert.equal(plan.writes[0].action, "update");
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx tsx tests/migration.test.ts`
Expected: FAIL — `p-9` appears in `hides`.

- [ ] **Step 3: Implement in `lib/product-sync.ts`**

Add the `source` guard in the hides loop; thread `source: data.source` into the `existing` map inside `syncProducts`.

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx tsx tests/migration.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add lib/product-sync.ts tests/migration.test.ts
git commit -m "feat: bulk sync never hides manual products"
```

### Task 3: Create API — S No transaction + POST route

**Files:**
- Create: `lib/product-create.ts`
- Modify: `app/api/admin/products/route.ts` (add `POST`, keep `GET`)
- Test: `tests/migration.test.ts` (append; pure validators only)

**Interfaces:**
- Consumes: `normalizeProductRow`, `requireAdmin`, `clearProductsCache`, `docToProduct`.
- Produces: `ManualProductInput = { name: string; category?: string; description?: string; material?: string; design?: string; finish?: string; idealFor?: string; mrp: number; images: string[]; videos: string[] }`; `validateManualInput(input: ManualProductInput): { ok: true } | { ok: false; error: string }` (name, MRP > 0, ≥1 media URL with image/video extension after stripping query strings); `createManualProduct(db, input: ManualProductInput): Promise<NormalizedProductDoc>` (transaction on `counters/products`, seed from `max(sNo)+1`, bump ≤10, throw `Error("SNo allocation failed after 10 attempts")`, write `products/p-{sNo}` with `source:'manual'`, single atomic create); `POST` returns `{ success: true, product }`, `403` unauthenticated, `400` invalid.

- [ ] **Step 1: Write the failing tests**

```ts
test("validateManualInput rejects zero-media submit", () => {
  assert.equal(validateManualInput({ name: "A", mrp: 100, images: [], videos: [] }).ok, false);
});
test("validateManualInput accepts Cloudinary URL with query params", () => {
  assert.equal(validateManualInput({ name: "A", mrp: 100, images: [], videos: ["https://res.cloudinary.com/x/v.mp4?tx=crop"] }).ok, true);
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx tsx tests/migration.test.ts`
Expected: FAIL with "validateManualInput not defined".

- [ ] **Step 3: Implement `lib/product-create.ts` and the `POST` handler**

Build a synthetic Excel-style row from the input plus allocated S No, run it through `normalizeProductRow` (throw its error as the 400 message), set `source:'manual'`, write doc + counter in one transaction, clear caches.

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx tsx tests/migration.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add lib/product-create.ts app/api/admin/products/route.ts tests/migration.test.ts
git commit -m "feat: single-product create API with transactional S No"
```

### Task 4: Gallery — interleaved video playback

**Files:**
- Modify: `components/product/ProductImageGallery.tsx`
- Modify: `app/(shell)/(shop)/shop/[slug]/page.tsx` (pass `videos`)
- Test: manual checklist in Task 6 (component is visual; unit pin is the media-order helper below)

**Interfaces:**
- Consumes: `Product.videos` from Task 1.
- Produces: `ProductImageGallery({ images: string[]; videos?: string[]; name: string })` — builds interleave `[image, video, image1, video1, image2, video2, image3]`; video slots render `<video controls muted playsInline preload="metadata">` with a thumbnail fallback.

- [ ] **Step 1: Implement the gallery + page wiring**

Keep all existing classes/markup for image slots; Excel products (empty `videos`) render byte-identical output.

- [ ] **Step 2: Typecheck**

Run: `npx tsc --noEmit`
Expected: PASS.

- [ ] **Step 3: Commit**

```bash
git add components/product/ProductImageGallery.tsx "app/(shell)/(shop)/shop/[slug]/page.tsx"
git commit -m "feat: interleaved product videos in gallery"
```

### Task 5: Dashboard — single-product form

**Files:**
- Create: `lib/media-upload.ts`
- Create: `components/admin/SingleProductForm.tsx`
- Modify: `components/admin/AdminDashboardClient.tsx` (render panel in Products tab)
- Test: `tests/migration.test.ts` (append)

**Interfaces:**
- Consumes: `POST /api/admin/products` and `ManualProductInput` from Task 3; `adminHeaders()` pattern in `AdminDashboardClient.tsx`.
- Produces: `isMediaAllowed(file: { name: string; size: number }): boolean`; `assertConfigured(): string | null` (returns error text when `NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME` or `NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET` is missing); `cloudinaryUploadUrl(cloud: string): string` (`https://api.cloudinary.com/v1_1/${cloud}/auto/upload`); form POSTs a `ManualProductInput` with the `x-admin-email` header.

- [ ] **Step 1: Write the failing tests**

```ts
test("isMediaAllowed rejects wrong type and oversize video", () => {
  assert.equal(isMediaAllowed({ name: "a.exe", size: 10 }), false);
  assert.equal(isMediaAllowed({ name: "v.mp4", size: 200 * 1024 * 1024 }), false);
  assert.equal(isMediaAllowed({ name: "p.webp", size: 1000 }), true);
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx tsx tests/migration.test.ts`
Expected: FAIL with "isMediaAllowed not defined".

- [ ] **Step 3: Implement `lib/media-upload.ts` + `SingleProductForm.tsx` + tab wiring**

Direct unsigned uploads with per-slot progress; submit disabled while uploading or when `assertConfigured()` returns an error (shown inline); success toast + refresh of the product list via the existing `load()`.

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx tsx tests/migration.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add lib/media-upload.ts components/admin/SingleProductForm.tsx components/admin/AdminDashboardClient.tsx tests/migration.test.ts
git commit -m "feat: dashboard single-product form with Cloudinary uploads"
```

### Task 6: Env + full verification

**Files:**
- Modify: `.env.local`, Vercel env (values, not committed)
- Test: manual checklist below

**Interfaces:**
- Consumes: all tasks.
- Produces: working dashboard create flow end to end.

- [ ] **Step 1: Configure Cloudinary + env**

Create the unsigned preset (`resource_type: auto`, folder `swas/products`); set `NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME` and `NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET` in `.env.local` and Vercel; restart dev.

- [x] **Step 2: Run full verification**

Run: `npx tsx tests/migration.test.ts` — Expected: all PASS.
Run: `npx tsc --noEmit` — Expected: PASS.
Run: `npm run build` — Expected: PASS.

- [ ] **Step 3: Manual checklist**

Create a product via the form; confirm the Firestore doc `p-{sNo}` with `source:'manual'`; confirm storefront gallery plays the video; run an XLSX upload and confirm the manual product stays visible.

- [ ] **Step 4: Commit (docs only if anything changed)**

```bash
git add -A
git commit -m "chore: verify single-product upload end to end"  # only if files changed
```
