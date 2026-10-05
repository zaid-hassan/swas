# Single-Product Upload with Cloudinary Media — Design Spec

- **Date:** 2026-09-30
- **Branch:** `dashboard`
- **Status:** Awaiting user review (no implementation yet)
- **Author:** opencode

## 1. Background

The admin dashboard Products tab (`components/admin/AdminDashboardClient.tsx`)
supports only bulk XLSX upload (`POST /api/admin/products/sync`), which
full-replaces the catalog: rows present are upserted by content hash, rows
absent are soft-hidden (`isVisible=false`), never deleted. Product media today
are Cloudinary URLs typed into Excel columns (`Image`, `Image1`–`Image3`); there
is no upload pipeline, no per-product video field, and `next.config.ts` allows
`res.cloudinary.com` for `next/image`. Marketing surfaces use hardcoded
Cloudinary video URLs — no product carries its own video.

## 2. Goal

Let the admin create **one product at a time** from the dashboard: fill the same
fields as an Excel row, upload **3 images + 3 videos** to **Cloudinary**
(existing CDN), and store everything in the **same Firestore `products` doc
shape** (`p-{S No}`) the Excel upload creates, so the storefront picks it up
with no Excel round-trip.

## 3. Decisions (from brainstorming)

1. **CDN** — Cloudinary (existing), not new Cloudflare storage.
2. **Scope** — create-only form; existing name/price/visibility editing stays.
3. **Media** — 3 images + 3 videos in fixed alternating gallery order
   (image, video, image1, video1, image2, video2).
4. **S No** — auto-assigned max+1 via a transactional counter.
5. **Approach** — A: server-created doc + browser-direct Cloudinary uploads.

## 4. Non-Goals

- Editing existing products via the new form (current inline edit stays).
- New Cloudflare/CDN accounts, buckets, or tokens.
- Customer ship/refund emails; Firebase ID-token admin auth; inventory counts.
- Historical migration (no backfill of videos onto Excel products).

## 5. Data Model

`NormalizedProductDoc` (`lib/product-rows.ts`) gains optional
`video`, `video1`, `video2: string`, plus `source: 'excel' | 'manual'`
metadata (existing docs default to `'excel'`).

- `productHash` **includes** the video fields (media edits change the hash like
  image edits do) and **excludes** `source` (marking origin never churns).
- Gallery order is fixed interleave:
  `image, video, image1, video1, image2, video2, image3`. Excel docs have empty
  videos and render exactly as today; manual docs leave `image3` empty.
- `Product` (`types/products.ts`) gains `videos: string[]`.
- If an Excel row later reuses a manual product's S No, the row wins and
  `source` flips to `'excel'`.

## 6. S No Allocation

New `POST /api/admin/products` runs a Firestore transaction on a
`counters/products` doc (`lastSNo`). First use seeds from
`max(sNo)+1` via `orderBy('sNo','desc').limit(1)`; concurrent creates serialize
on the counter; the write verifies `p-{sNo}` is absent with a bounded bump on
collision, aborting `409` after 10 attempts. The server constructs a synthetic
Excel-style row from the form fields plus the allocated S No and runs it
through `normalizeProductRow`, so single-create validation is literally the
same code path as bulk rows.

## 7. Upload Flow & API

- New public env: `NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME` +
  `NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET` (one unsigned preset,
  `resource_type: auto`, folder `swas/products`; created once in the
  Cloudinary dashboard — no new npm deps).
- Browser uploads each file straight to Cloudinary with per-file progress and
  collects `secure_url`s. Guards: images jpg/png/webp ≤ 8 MB; videos mp4/webm
  ≤ 100 MB, ≤ 60 s. Rejected client-side pre-upload; URL extensions
  re-validated server-side.
- `POST /api/admin/products` (same `requireAdmin` gate) accepts form fields +
  6 media URLs, builds the doc through the **same normalize/hash helpers** as
  Excel rows (identical slug, visibility, and validation rules: name required,
  MRP > 0, ≥ 1 media), writes with `source:'manual'` in the S No transaction,
  clears product caches, and returns the created product.
- Dashboard: new "Add single product" panel in the Products tab; bulk XLSX
  flow unchanged.

## 8. Excel Interplay (conflict resolved)

Bulk sync's hide computation **skips docs with `source:'manual'`**, so a manual
product absent from the next Excel file stays visible. All sync behavior for
`excel` docs (hash-diff, upsert, hide, unsafe-upload guards, summary shape) is
unchanged. Manual show/hide toggle keeps working; the next Excel upload does
not touch manual docs at all.

## 9. Read Path

- `toNormalized` passes through `video/video1/video2` + `source`;
  `docToProduct` adds `videos[]`; `getProducts`/`getAllProducts` unchanged
  otherwise.
- `ProductImageGallery` renders the interleaved media (images via
  `next/image`, videos via `<video controls muted playsInline
  preload="metadata">`). No `next.config.ts` change needed.
- `next/image` continues to serve Cloudinary images from the allowed host.

## 10. Error Handling

- Cloudinary per-slot failures block submit until resolved or the slot is
  cleared; submit disabled while any upload is in flight.
- Server returns `400` with field errors on invalid input; the doc write is a
  single atomic create (no partial product).
- `401/403` via existing admin gate; `409` on unresolvable S No collision.

## 11. Testing

- Unit: hash with videos, interleave order, manual-exclusion from hides,
  S No bump logic.
- Route: `403` unauthenticated, `400` invalid payload, `200` create shape.
- Manual: dashboard upload → Cloudinary URLs → Firestore doc → storefront
  gallery plays video → Excel re-upload leaves the manual product visible.

## 12. Environment / Rollout

- New (public): `NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME`,
  `NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET` — set locally and on Vercel.
- New (dashboard setup): unsigned Cloudinary upload preset.
- New Firestore doc: `counters/products` (auto-created on first use).
- No new dependencies, no new env secrets, no migration/backfill.
