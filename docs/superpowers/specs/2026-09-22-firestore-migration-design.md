# Firestore Migration — Design Spec

- **Date:** 2026-09-22
- **Branch:** `dashboard`
- **Status:** Approved (pending implementation plan)
- **Author:** Zaid / opencode

## 1. Background

SWAS currently uses Google Sheets + a Google Apps Script webhook as its de-facto
backend. This creates multiple sources of truth and fragile external calls:

| Data | Written to | Read from |
|---|---|---|
| Products | Sheet; optionally Firestore `products/p-<sNo>` (gated by `USE_FIRESTORE_PRODUCTS`) | Sheet CSV via `lib/fetchsheet.ts` → `getProducts()` |
| Orders | Firestore `orders` **and** Sheet webhook | customer pages: Firestore; admin dashboard: Sheet |
| Refunds | Sheet webhook only | admin tab never loads (bug); wallet sync: Sheet `?action=refunds` |
| Tracking (courier/AWB/status) | Sheet (manual) | `?action=tracking` → Sheet |
| Wallet coins | Firestore `users/{uid}.wallet.coins` | funded by Sheet refund `status=Approved` + `coinsAdded` |

The storefront defaults to Sheets. The admin dashboard reads orders from the
Sheet while orders are written to Firestore — a split-brain bug.

## 2. Goal

Make Firestore the single source of truth for **all** data, remove every
Google Sheets / Apps Script dependency, add an XLSX upload that full-replaces
the product catalog, and keep Firestore reads/writes minimal.

## 3. Decisions (from brainstorming)

1. **Admin actions** — fulfillment (status/courier/AWB) and refund approval
   move into the admin dashboard. No Sheet console remains.
2. **History** — no import of existing orders/refunds; only new data going
   forward. Old records stay in the Sheet (outside the app).
3. **XLSX semantics** — full replace, soft-hide. Products absent from the file
   are set `isVisible=false` (kept, reversible). Never hard-delete.
4. **Read/write priority** — optimize aggressively: remove real-time
   `onSnapshot` listeners and polling in favour of cached server reads plus
   manual refresh.

## 4. Non-Goals

- Migrating historical orders/refunds from the Sheet.
- Customer notification emails on ship/refund approval.
- Firebase ID-token admin authentication (existing header gate stays).
- Inventory counts, multi-currency, or other new commerce features.

## 5. Data Model

### `products/{p-<sNo>}`
Unchanged shape (storefront compatibility preserved):
`sNo, category, name, description, material, design, finish, idealFor, mrp,
image, image1, image2, image3, dateOfAdd, slug, isVisible, hash, updatedAt`.

- Soft-hide = `isVisible: false` + `updatedAt`.
- Contract functions `normalizeProductRow`, `docToProduct`, `productHash`,
  `slugify` in `lib/product-rows.ts` are retained.

### `orders/{autoId}`
Existing doc, extended:
- Keep: `userId, orderNumber, items[], customer, shippingAddress, pricing,
  payment, status, invoice, notifications, createdAt, updatedAt`.
- Add: `fulfillment: { courier, awb, trackingUrl, shippedAt, deliveredAt }`.
- Status values: `paid → shipped → delivered` (+ `cancelled`).
- Remove: `googleSheet`.

### `refunds/{autoId}`
New:
`orderId, userId, customer, email, amount, reason, status:
pending|approved|rejected, coinsAdded: bool, coinsAddedAt, reviewedAt,
createdAt, updatedAt`.

### `users/{uid}`
Unchanged (`wallet.coins`). Credited only at refund approval.

### Indexes
- `orders`: composite `userId asc, createdAt desc`.
- `refunds`: composite `status asc, createdAt desc` and single `email asc`.

## 6. Read / Write Strategy

### Products
- `lib/products.ts` is Firestore-only, retaining the 5-minute in-memory server
  cache and `clearProductsCache()`. All storefront paths
  (`shop`, `category/[slug]`, `search`, `catalogue`, `shop/[slug]`,
  `validate-cart`, `/api/products`) continue to funnel through `getProducts()`.
- Add `getAllProducts()` (no visibility filter) with its own short cache for
  the admin dashboard, invalidated on write.

### Orders
- Customer list/detail: `onSnapshot` → one-time `getDocs`/`getDoc` on mount plus
  a manual Refresh control.
- Admin: `GET /api/admin/orders` reads `orders` (`orderBy createdAt desc`,
  `limit 200`) with a short in-memory cache; dashboard has manual refresh.

### Tracking
- `GET /api/tracking/[orderId]` reads the order's `fulfillment` field (1 read).

### Refunds / Wallet
- Create: 1 write.
- Approve: transaction → update refund + `increment(amount)` on
  `users/{uid}.wallet.coins` (2 writes), idempotent via `coinsAdded` guard.
- Reject: 1 write.
- Delete `/api/wallet/sync`; account page reads `users/{uid}` once via `getDoc`.

### XLSX sync writes
- Hash-diff: unchanged rows cost 0 writes; changed/new rows batched at 450 per
  commit; soft-hide writes only the missing docs. Cache cleared once at the end.

## 7. API Changes

| Route | Change |
|---|---|
| `GET /api/admin/products` | rewrite → list all products from Firestore (incl. hidden) |
| `POST /api/admin/products/sync` | rewrite → Firestore-only, full-replace soft-hide |
| `PATCH /api/admin/products/[id]` | keep (already Firestore) |
| `GET /api/admin/orders` | rewrite → Firestore list |
| `PATCH /api/admin/orders/[id]` | new → set status + fulfillment |
| `GET /api/admin/refunds` | new → Firestore list |
| `PATCH /api/admin/refunds/[id]` | new → approve/reject + credit coins |
| `POST /api/refunds/create` | rewrite → Firestore write (+ `userId`) |
| `GET /api/tracking/[orderId]` | rewrite → read order `fulfillment` |
| `POST /api/payments/verify` | edit → drop Sheet block; init `fulfillment`, status `paid` |
| `POST /api/wallet/sync` | delete |

`isAdmin` (both existing routes) changes from fail-open to fail-closed:
return `false` when `NEXT_PUBLIC_ADMIN_EMAIL` is unset.

## 8. Admin Dashboard

`components/admin/AdminDashboardClient.tsx` rebuilt on Firestore:
- **Products**: XLSX upload (full-replace soft-hide), sync summary
  (inserted/updated/hidden/skipped/errors), inline name/price edit, per-product
  show/hide toggle, pagination.
- **Orders**: list + stats (total sales, orders, pending dispatch, shipped),
  per-order fulfillment form (status, courier, AWB, tracking URL).
- **Refunds**: list, Approve / Reject, coin-credit state.

## 9. Customer-Facing Changes

- `OrdersClient`: `onSnapshot` → one-time fetch + refresh.
- `OrdersDetailsClient`: `onSnapshot` → one-time fetch + refresh; tracking from
  Firestore; `RefundDialog` receives and sends `userId`.
- Account page: remove the `POST /api/wallet/sync` call; read `users/{uid}` once.

## 10. Removals

- Delete `lib/fetchsheet.ts`.
- Remove `USE_FIRESTORE_PRODUCTS` / `NEXT_PUBLIC_USE_FIRESTORE_PRODUCTS`.
- Remove the Sheets branch from `lib/products.ts`.
- Remove all `GOOGLE_SHEET_WEBHOOK` usage from code and Vercel env.

## 11. One-Time Seed

Add `scripts/seed-products.ts` (firebase-admin) that imports the currently
published CSV into `products`. Idempotent, run once against the target project
before deploying the Firestore-only build, then deleted. Prevents an empty
storefront during cutover.

## 12. Safety & Error Handling

- Sync aborts with **no writes** when zero valid rows are parsed, or when
  invalid rows outnumber valid rows (`invalidCount >= validCount`).
- Per-row sync errors are returned and surfaced in the admin UI.
- Storefront keeps serving the last cached products on transient Firestore
  errors; a cold failure surfaces a 500 (no silent Sheet fallback).
- Refund approval is transactional and guarded by `coinsAdded`; a missing user
  doc/uid flags the refund instead of double-crediting.

## 13. Testing

- Unit: existing 11 `product-rows` tests plus new pure-function tests for sync
  diff (skip/hide), fulfillment transitions, refund transitions.
- Route: admin auth gate returns 403; empty-file sync is rejected.
- `next build` + typecheck.
- Manual end-to-end (requires real Firebase Admin creds): seed → XLSX upload →
  storefront → test order → admin fulfillment → customer tracking → refund →
  approve → wallet coins.

## 14. Environment / Rollout

- Remove `GOOGLE_SHEET_WEBHOOK`. No new env vars.
- Required: `FIREBASE_PROJECT_ID`, `FIREBASE_CLIENT_EMAIL`,
  `FIREBASE_PRIVATE_KEY` (currently missing locally), `NEXT_PUBLIC_ADMIN_EMAIL`,
  Razorpay keys, Resend keys.
- Deploy order: add Firebase Admin creds to Vercel → run seed against the
  production project → deploy the Firestore-only build.

## 15. Open Risks

- Firebase Admin credentials are currently absent locally, so full integration
  testing cannot run until they are supplied.
- Firestore security rules (not stored in this repo) must allow authenticated
  users to read their own `orders` and `users/{uid}` documents. Refund/order
  writes go through the Admin SDK and bypass rules.
