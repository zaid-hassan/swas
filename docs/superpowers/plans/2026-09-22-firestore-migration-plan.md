# Firestore Migration — Implementation Plan

Spec: `docs/superpowers/specs/2026-09-22-firestore-migration-design.md`

## Phases

1. **Data layer foundations**
   - `lib/products.ts` → Firestore-only; add `getAllProducts()`; keep cache.
   - `lib/product-sync.ts` (new) → pure `planProductSync()` for full-replace soft-hide.
   - `lib/order-status.ts` (new) → pure `applyFulfillment()` transition helper.
   - Delete `lib/fetchsheet.ts`.
2. **Products API + seed**
   - Rewrite `GET /api/admin/products` → Firestore all products.
   - Rewrite `POST /api/admin/products/sync` → Firestore-only full replace.
   - `PATCH /api/admin/products/[id]` → allow `isVisible`.
   - `scripts/seed-products.ts` (one-time, deleted after use).
3. **Orders + tracking**
   - Edit `POST /api/payments/verify` → drop Sheet; init `fulfillment`.
   - Rewrite `GET /api/admin/orders`; add `PATCH /api/admin/orders/[id]`.
   - Rewrite `GET /api/tracking/[orderId]` → order `fulfillment`.
4. **Refunds + wallet**
   - Rewrite `POST /api/refunds/create` → Firestore.
   - Add `GET /api/admin/refunds`, `PATCH /api/admin/refunds/[id]`.
   - Delete `POST /api/wallet/sync`; account page reads `users/{uid}`.
5. **UI**
   - Rebuild `AdminDashboardClient` (products/orders/refunds).
   - `OrdersClient`/`OrdersDetailsClient` → one-time fetch + refresh.
   - `RefundDialog` sends `userId`.
6. **Security + cleanup**
   - `isAdmin` fail-closed.
   - Remove all `GOOGLE_SHEET_WEBHOOK` usage.
7. **Test**
   - Unit tests for `planProductSync`, `applyFulfillment`.
   - Route auth/validation smoke tests.
   - `next build` + typecheck.

## Verification

- `node` unit test file passes.
- `npx next build` succeeds.
- Dev-server smoke tests: admin gate 403, empty-file sync 400.
- Manual E2E requires real Firebase Admin creds (currently missing).
