# SWAS — Project Context (idea.md)

> Complete context for the **SWAS** codebase. Read this before making any change.

---

## 1. What SWAS Is

**SWAS by Swastik** — a **D2C e-commerce store for handcrafted silver jewellery**, deployed on **Vercel** at the domain configured via `NEXT_PUBLIC_SITE_URL`.

- **Customers** browse a catalogue, add to cart, pay with **Razorpay** (UPI/cards/netbanking), get an **invoice PDF by email**, track shipments, and request refunds credited as **wallet coins**.
- **Admins** manage products, fulfill orders (courier + AWB + tracking), and approve/reject refunds from a dashboard at `/admin`.
- The brand is **luxury/editorial**: maroon + gold palette, serif display fonts, gold hairline borders, uppercase micro-labels with wide letter-spacing.

**Origin story:** The store originally ran on **Google Sheets + Apps Script webhooks** as its backend. In Sept 2026 the project migrated to **Firestore as the single source of truth**, removing all Sheets/ Apps Script dependencies. Old orders/refunds stay in the Sheet (not imported).

---

## 2. Tech Stack

| Layer | Choice |
|---|---|
| Framework | **Next.js 16** (App Router, React 19) |
| Language | **TypeScript** |
| Styling | **Tailwind CSS v4** (via `@tailwindcss/postcss`), `tw-animate-css` |
| UI primitives | **Radix UI** + **shadcn-style** components in `components/ui/` (hand-written, not the CLI) |
| Icons | `lucide-react` |
| Animation | `framer-motion` / `motion` |
| Client state | **Zustand** (`lib/store/cart-store.ts`) |
| Database | **Firestore** (client SDK + Admin SDK) |
| Auth | **Firebase Auth** (client-side only; email/password + Google) |
| Payments | **Razorpay** |
| Email | **Resend** |
| PDF invoices | **pdf-lib** |
| Media CDN | **Cloudinary** (unsigned browser uploads) |
| Toasts | `sonner` |
| Deployment | **Vercel** |
| Tests | `tsx` scripts (no Jest/Vitest framework) |
| Package manager | **pnpm** (a `package-lock.json` also exists — lockfile drift has bitten before) |

---

## 3. Architecture at a Glance

```
Browser ──► Next.js App Router pages (RSC + client components)
   │              │
   │              ├──► Firestore (Admin SDK, server-only, lazy-imported)
   │              │        products / orders / refunds / users / counters / settings
   │              │
   │              ├──► Razorpay (order create + signature verify)
   │              ├──► Resend (order + owner emails w/ PDF invoice)
   │              └──► Cloudinary (admin uploads media from browser)
   │
   └──► Firestore (client SDK: auth, live cart sync to users' carts)
```

**Critical rule:** `firebase-admin` is **always dynamically imported** inside server code (`await import("./firebase-admin")`) so `next build` never evaluates service-account credentials. **Never** add a top-level `import { adminDb } from "@/lib/firebase-admin"` in a module reachable from client code — it breaks the build.

---

## 4. Directory Structure

```
app/
├─ layout.tsx                 # Root layout: Google fonts, AuthProvider, Toaster, WhatsApp button
├─ globals.css                # Tailwind + brand theme (maroon/gold)
├─ (shell)/                   # Everything shares the navbar/footer shell
│  ├─ layout.tsx
│  ├─ (public)/               # Marketing & legal
│  │  ├─ page.tsx             # HOME — hero + collection film + showcase + catalogue + video carousel + features
│  │  ├─ about/ contact/ search/ privacy/ returns/ shipping/ terms/
│  ├─ (shop)/                 # Shopping flow
│  │  ├─ shop/page.tsx        # All products, paginated (12/page), ?category= filter
│  │  ├─ shop/[slug]/page.tsx # Product detail + related products
│  │  ├─ category/[slug]/  bestseller/  newarrivals/  collection/taruni/
│  │  ├─ cart/  checkout/  checkout/success/
│  ├─ (user)/                 # Account area
│  │  ├─ login/  signup/
│  │  ├─ account/page.tsx           # Profile + wallet coins
│  │  └─ account/orders/  orders/[id]/
│  └─ (admin)/admin/page.tsx  # Admin dashboard (client component)
└─ api/                       # Route handlers
   ├─ products/                       # GET public product list
   ├─ checkout/                       # POST validate cart + compute totals
   ├─ orders/create/                  # POST create pending order / Razorpay order
   ├─ payments/verify/                # POST verify signature → write order → invoice → emails
   ├─ refunds/create/                 # POST customer refund request
   ├─ tracking/[orderId]/             # GET fulfillment tracking info
   ├─ admin/
   │  ├─ products/                    # GET all (incl. hidden)
   │  ├─ products/[id]/               # PATCH inline edit / visibility toggle
   │  ├─ products/sync/               # POST bulk XLSX full-replace (SUPER ADMIN only)
   │  ├─ orders/  orders/[id]/        # GET list / PATCH fulfillment
   │  ├─ refunds/  refunds/[id]/      # GET list / PATCH approve+credit-coins | reject
   │  └─ home-videos/                 # GET/PUT editable homepage videos

components/
├─ admin/     AdminDashboardClient (Products/Orders/Refunds/Home tabs), SingleProductForm, HomeVideosPanel
├─ cart/      CartControls (AddToCartButton), CartDrawer, CheckoutSummary
├─ checkout/  AddressDialogue, CheckoutAddressSection
├─ global/    navbar/Navbar, footer/Footer, commingsoon/
├─ orders/    OrdersClient, OrdersDetailsClient, RefundDialog
├─ product/   ProductCard, ProductImageGallery (image+video interleave)
├─ providers/ AuthProvider (Firebase onAuthStateChanged context)
├─ search/    SearchBar
├─ sections/  hero/Hero, showcase/Showcase, catalogue/, features/, collection/, trustbar/
├─ ui/        shadcn-style primitives (button, card, dialog, sheet, tabs, …)
├─ WalletCard, WhatsappButton

lib/
├─ firebase.ts            # Client Firebase (auth + firestore)
├─ firebase-admin.ts      # Admin SDK (server-only, lazy)
├─ admin-auth.ts          # Fail-closed admin/super-admin gate (x-admin-email header)
├─ admin-cache.ts         # Short TTL cache for admin reads
├─ products.ts            # getProducts()/getAllProducts() with 5-min in-memory cache
├─ product-rows.ts        # normalize/hash/slugify — THE product data contract
├─ product-create.ts      # Transactional S-No allocation for single create
├─ product-sync.ts        # Bulk XLSX diff/upsert/soft-hide engine
├─ media-upload.ts        # Cloudinary unsigned upload helpers
├─ home-videos.ts         # Normalize editable homepage videos
├─ site-settings.ts       # Firestore settings/home doc read/write
├─ orders.ts              # buildFulfillmentPatch (pure)
├─ refunds.ts             # Refund state transitions
├─ cart/                  # validate-cart, cart-total, firestore-sync, cart-sync
├─ store/cart-store.ts    # Zustand cart (localStorage + Firestore debounced sync)
├─ email/send-order-email.ts
├─ invoice/generate-invoice.ts
├─ tracking/tracking-url.ts   # BlueDart / Delhivery / DTDC link builders
├─ razorpay.ts            # Lazy Razorpay client
├─ create-user-document.ts
├─ hooks/use-mounted.ts
└─ utils.ts               # cn() = clsx + tailwind-merge

types/     products.ts, orders.ts, address.ts, refunds.ts, razorpay.d.ts
scripts/   seed-products.ts (one-time CSV→Firestore), emulator-test.ts
tests/     migration.test.ts, manual-create.emulator.ts, integration.emulator.ts
docs/superpowers/  specs/ + plans/ (dated design docs — read these for history)
```

---

## 5. Data Model (Firestore)

### `products/p-{sNo}`  ← the core catalogue doc
Canonical type: `NormalizedProductDoc` in `lib/product-rows.ts`.

```
sNo (number), category, name, description, material, design, finish, idealFor,
mrp (number), image, image1..image3, video, video1, video2,
source: 'excel' | 'manual',
dateOfAdd, slug (`{slugified-name}-{sNo}`), isVisible (bool),
hash (content hash for diff), updatedAt (ms)
```

- **Doc ID = `p-{S No}`** (from the Excel "S No" column, or auto-allocated max+1 for manual creates).
- **Visibility rule** (`normalizeProductRow`): visible only when `mrp > 0` AND at least one media slot filled (images **or** videos count). Dashboard can override afterwards.
- **`hash`** (djb2-ish, base36) covers every field **except** `source`/`updatedAt` — used by bulk sync to skip unchanged rows (0 writes). Video fields **are** hashed.
- **`source`**: bulk Excel upload sets `'excel'`; the single-product form sets `'manual'`. Manual docs are **never hidden** by a subsequent Excel sync (absent rows don't soft-hide them).
- **Soft-hide, never delete**: absent-from-Excel rows get `isVisible:false` + `updatedAt`.
- If an Excel row later reuses a manual product's S No, **the row wins** and `source` flips to `'excel'`.

### `orders/{autoId}`
```
userId, orderNumber (`SWAS-{timestamp}`), items[] (cart snapshot), customer {name,email,phone},
shippingAddress {…}, pricing {subtotal, shipping, total},
payment {provider:'razorpay', razorpayOrderId, razorpayPaymentId},
status: 'paid' | 'shipped' | 'delivered' | 'cancelled' | 'pending' | 'failed',
fulfillment { courier, awb, trackingUrl, shippedAt, deliveredAt },
invoice { invoiceNumber (`INV-{ts}`), generated },
notifications { customerEmail, ownerEmail: 'pending'|'sent'|'failed' },
createdAt, updatedAt (ms)
```
- **Items and address are snapshots** at purchase time — never reference the live catalogue or the user's saved address.
- Status transitions handled by `buildFulfillmentPatch` (`lib/orders.ts`): `shippedAt` set once on first `shipped`; `deliveredAt` set on `delivered` (backfills `shippedAt` if missing).

### `refunds/{autoId}`
```
orderId, userId, customer, email, amount, reason,
status: 'pending'|'approved'|'rejected',
coinsAdded (bool, idempotency guard), coinsAddedAt, reviewedAt, createdAt, updatedAt
```
- **Approve = Firestore transaction**: update refund + `increment(amount)` on `users/{uid}.wallet.coins`, guarded by `coinsAdded` so it can't double-credit. A missing user doc/uid **flags** the refund instead of silently crediting.

### `users/{uid}`
```
uid, name, email, createdAt, addresses: Address[], wallet: { coins: number }
```
- Coins are credited **only** on refund approval.
- Cart mirrors in `carts/{uid}` (debounced client sync).

### `settings/home` — editable homepage videos (`lib/site-settings.ts`)
Read fresh each request (home page is `force-dynamic`); a read failure falls back to shipped defaults so the storefront never blanks. `normalizeHomeVideos` validates shape.

### `counters/products` — S-No counter
Firestore transaction doc holding `lastSNo`. First use seeds from `max(sNo)+1`. Concurrent creates serialize on the counter; collision on an existing `p-{sNo}` bumps up to 10 times, then `409`.

### Indexes
- `orders`: composite `userId asc, createdAt desc`
- `refunds`: composite `status asc, createdAt desc`; single `email asc`

---

## 6. Key Flows

### Checkout → Payment → Order
1. Client cart (Zustand, persisted to `localStorage`, debounced-synced to `carts/{uid}` when logged in).
2. `POST /api/checkout` → `validateCart()` re-prices every line against **server** products (client prices are untrusted) → `calculateCartTotal()` (free shipping over ₹999, else ₹99).
3. Client opens Razorpay checkout; on success → `POST /api/payments/verify`.
4. Server **verifies the HMAC-SHA256 signature** (`order_id|payment_id` vs `RAZORPAY_KEY_SECRET`), then writes the Firestore order with `status:'paid'`, `fulfillment:{}`.
5. Generates a **pdf-lib A4 invoice**, sends two Resend emails (customer + `OWNER_EMAIL`) with the PDF attached, updates `invoice.generated` + `notifications` to `sent`/`failed`. Email failure never fails the order — it's caught and flagged.
6. `checkout/success` page confirms.

### Admin fulfillment
Dashboard Orders tab → stats (total sales, orders, pending dispatch, shipped) + per-order form (status, courier, AWB, tracking URL) → `PATCH /api/admin/orders/[id]` via `buildFulfillmentPatch`. Customers see tracking via `GET /api/tracking/[orderId]`; courier links built by `lib/tracking/tracking-url.ts` (BlueDart, Delhivery, DTDC).

### Refunds & wallet
Customer `POST /api/refunds/create` (with `userId`) → admin Refunds tab → **Approve** (transactional coin credit) or **Reject** → `PATCH /api/admin/refunds/[id]`. Wallet balance shows on `/account` (`WalletCard`), read once via `getDoc` (no realtime listeners).

### Product catalog — three write paths, one contract
All three funnel through the **same** `normalizeProductRow` + `productHash` + `slugify` helpers in `lib/product-rows.ts`:
1. **Bulk XLSX** (`POST /api/admin/products/sync`, super-admin only): parse → hash-diff → batched upsert (≤450/commit) → soft-hide absent `excel` docs → clear cache → return summary (inserted/updated/hidden/skipped/errors). Aborts with **no writes** if zero valid rows, or `invalidCount >= validCount`.
2. **Single-product form** (`POST /api/admin/products`): server allocates S No in a transaction, builds a synthetic Excel-style row from form fields, runs it through the same normalizer, writes with `source:'manual'`, clears cache.
3. **Inline edit / toggle** (`PATCH /api/admin/products/[id]`): name/price edit, show/hide toggle.

### Product read path
**Everything** storefront (shop, category, search, catalogue, product detail, `/api/products`, `validate-cart`) funnels through `getProducts()` — a **5-minute in-memory server cache** capping Firestore reads. `getAllProducts()` (includes hidden) has a separate short cache for the admin dashboard. `clearProductsCache()` is called on every write.

### Media
- Product galleries render images (`next/image`, Cloudinary host allowed in `next.config.ts`) **interleaved with videos** in fixed order: `image, video, image1, video1, image2, video2, image3`.
- `ProductImageGallery`: images via `next/image`, videos via `<video controls muted playsInline preload="metadata">`.
- Single-product form uploads **3 images + 3 videos** browser-direct to Cloudinary via an **unsigned preset** (`NEXT_PUBLIC_CLOUDINARY_*`), collecting `secure_url`s. Guards: images jpg/png/webp ≤ 8 MB; videos mp4/webm ≤ 100 MB, ≤ 60 s (client-side pre-check + server-side URL-extension re-validation).
- Identical Cloudinary URLs are deduped (the source sheet repeats the cover image 4×).

---

## 7. Admin Auth (`lib/admin-auth.ts`)

Identity arrives in the **`x-admin-email`** header — an **assertion by the browser, not a verified token**. The gate decides *which signed-in UI* gets *which capability*; it is **not** a defence against hand-crafted curl requests. Moving to verified Firebase ID tokens is a known, deliberate non-goal for now.

| Env | Meaning |
|---|---|
| `NEXT_PUBLIC_ADMIN_EMAILS` | comma-separated admins |
| `NEXT_PUBLIC_SUPER_ADMIN_EMAILS` | comma-separated super admins (can also manage admins) |
| `NEXT_PUBLIC_ADMIN_EMAIL` | legacy single admin; counts as admin and, **while no explicit super list is set**, as super admin (keeps bulk upload working on upgrade) |

- **admin** = dashboard, products, orders, refunds.
- **super admin** = everything + **bulk XLSX catalog upload** (`/api/admin/products/sync`).
- **Fail-closed:** nothing configured ⇒ **nobody** is an admin.
- The dashboard hides capabilities the role can't use (`isSuperAdminEmail(userEmail)` gates the bulk-upload button).

---

## 8. Environment Variables

See `.env.example` (copy to `.env.local`, gitignored). Full list:

```
# Firebase client
NEXT_PUBLIC_FIREBASE_API_KEY / _AUTH_DOMAIN / _PROJECT_ID / _APP_ID
# Firebase Admin (server-only; private key on ONE line with literal \n)
FIREBASE_PROJECT_ID / FIREBASE_CLIENT_EMAIL / FIREBASE_PRIVATE_KEY
# Access control
NEXT_PUBLIC_ADMIN_EMAIL / NEXT_PUBLIC_ADMIN_EMAILS / NEXT_PUBLIC_SUPER_ADMIN_EMAILS
# Razorpay
NEXT_PUBLIC_RAZORPAY_KEY_ID / RAZORPAY_KEY_SECRET
# Resend
RESEND_API_KEY / FROM_EMAIL / OWNER_EMAIL
# Cloudinary (public, unsigned preset)
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME / NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET
# Site
NEXT_PUBLIC_SITE_URL
# Local dev only (Firestore emulator) — blank in production
FIRESTORE_EMULATOR_HOST
```

**Never** put secrets in `NEXT_PUBLIC_*` vars (they're inlined into the client bundle). `RAZORPAY_KEY` and Firebase Admin creds are **lazily initialized** so the build succeeds **without credentials** — keep it that way.

---

## 9. Design System (Brand)

- **Palette:** maroon/burgundy (`maroon`, `maroon-deep`, `burgundy`), gold (`gold`), ink, warm, `swas-grey`, white surfaces.
- **Fonts** (loaded in `app/layout.tsx`): Bodoni Moda, Playfair Display, GFS Didot, Instrument Sans (body), Montserrat. Classes like `font-cg` (Cormorant-style headings), `font-heading`, `font-body`.
- **Motifs:** zero/low border-radius, gold hairline borders (`border-gold/20`), uppercase micro-labels with `tracking-[0.25em]`-style spacing, `clamp()` responsive display sizes, slide-up "Add to Bag" on desktop hover (static button on mobile), thin shadows.
- **ProductCard** supports `badge` (maroon/gold variants), `oldPrice` strikethrough, wishlist heart (hover-reveal on desktop, always visible on mobile).
- Mobile-first: 2-column grids on mobile scaling to 4–5 on desktop.

---

## 10. Testing & Scripts

```bash
pnpm dev            # next dev
pnpm build          # next build (no credentials needed — lazy admin init)
pnpm lint           # eslint
pnpm seed           # tsx scripts/seed-products.ts — one-time CSV → Firestore import
pnpm test           # tsx tests/migration.test.ts
pnpm test:migration # same as test
pnpm test:emulator            # emulator suite: manual product create
pnpm test:emulator:integration# emulator suite: integration
```

- **Firestore emulator** tests run via `scripts/emulator-test.ts` (sets `FIRESTORE_EMULATOR_HOST`, default localhost:8080).
- No Jest/Vitest — tests are plain `tsx` scripts.
- `next build` + typecheck is the baseline verification; manual end-to-end needs real Firebase Admin creds.

---

## 11. Conventions & Hard-Won Rules

1. **Firestore is the single source of truth.** No Google Sheets, no Apps Script, no `USE_FIRESTORE_PRODUCTS` flags. Do not reintroduce a Sheets fallback.
2. **Lazy-import `firebase-admin`** inside functions — never at module top level in client-reachable code.
3. **All product reads** go through `getProducts()` (cached). All product **writes** call `clearProductsCache()`.
4. **Soft-hide, never hard-delete** products.
5. **No realtime `onSnapshot` / polling** — one-time reads on mount + manual Refresh. Keeps Firestore reads cheap.
6. **Server re-validates everything** the client sends (cart prices, media URL extensions, admin headers).
7. **Idempotency guards** on money paths (`coinsAdded` on refunds; signature verify on payments).
8. **Fail-closed** admin gate; **fail-safe** storefront (serves last cache on transient Firestore errors; cold failure → 500, not a silent fallback).
9. The **admin gate is header-based and not a security boundary** — verified ID tokens are out of scope for now.
10. Keep `lib/product-rows.ts` as the **single product contract**; bulk and manual creates share the exact same validation/slug/hash code path.
11. Keep both lockfiles in sync (`pnpm-lock.yaml` + `package.json`); don't let `package-lock.json` drift.
12. Design docs live in `docs/superpowers/specs/` and plans in `docs/superpowers/plans/` (dated `YYYY-MM-DD-*.md`) — follow that pattern for new features.

---

## 12. Known Gaps / Non-Goals (deliberate)

- **No verified-ID-token admin auth** (header gate stays).
- **No customer ship/refund notification emails** (only order-confirmation emails exist).
- **No inventory counts**, multi-currency, or other new commerce features.
- **No historical migration** of old Sheet orders/refunds; no video backfill onto Excel products.
- Firestore **security rules are not in this repo** — they must allow authenticated users to read their own `orders` and `users/{uid}` docs; all order/refund writes go through the Admin SDK (bypasses rules).
- `README.md` is **stale** — it still describes an older Medusa-based planning layout that doesn't match this codebase. Trust this file and the actual source over the README.

---

## 13. Recent History (git log)

```
8ff0ec7 feat: super-admin bulk upload gate + admin-editable home page videos
5f9f82f docs: single-product upload design, plan, and verification record
36bb382 fix: count videos when deriving product visibility
3587ff6 chore: emulator test runner, shared interleave helper, stricter manual submit
0b0f7c5 fix: lazy-init Razorpay and Resend clients so the build needs no credentials
7bc5eed test: emulator coverage for manual product create
ccbf79a feat: dashboard single-product form with Cloudinary uploads
ca0e218 feat: interleaved product videos in gallery
35ce8b9 feat: single-product create API with transactional S No
169657d feat: bulk sync never hides manual products
ec2b163 feat: product video fields and source metadata
…        (Firestore migration + earlier Sheets-based work)
```

**Branches:** `main` (primary), `dashboard` (feature branch where the Firestore migration and dashboard work landed).

**Design docs worth reading:**
- `docs/superpowers/specs/2026-09-22-firestore-migration-design.md` — the Sheets→Firestore migration (why, decisions, data model, removals).
- `docs/superpowers/specs/2026-09-30-single-product-upload-design.md` + matching plan — the manual single-product create with Cloudinary.

---

## 14. Repo

- **Remote:** `git@github.com:zaid-hassan/swas.git` (`origin`)
- **Owner/contact:** Zaid Hassan (`zaid@brmh.in`)
- **Live domain:** set via `NEXT_PUBLIC_SITE_URL`
- **Deploy target:** Vercel (env vars configured there; `FIRESTORE_EMULATOR_HOST` blank in prod)
