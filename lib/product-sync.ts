import { normalizeProductRow, productHash, productLinkageFromRow } from "./product-rows";
import type { NormalizedProductDoc, RawProductRow } from "./product-rows";
import { catalogRecordLabel, collectionHasCategory, resolveCatalogRecord } from "./catalog-schema";

export type SyncError = { row: number; error: string };

/**
 * Saved records the planner resolves sheet labels against. Both sides are the
 * owning records only: collections carry `categoryIds`, categories carry no
 * membership of their own.
 */
export type SyncCollectionRef = {
  id: string;
  name?: unknown;
  slug?: unknown;
  categoryIds?: unknown;
  expiresAt?: unknown;
  deletedAt?: unknown;
};

export type SyncCategoryRef = {
  id: string;
  name?: unknown;
  slug?: unknown;
  expiresAt?: unknown;
  deletedAt?: unknown;
};

export type SyncCatalog = {
  collections: SyncCollectionRef[];
  categories: SyncCategoryRef[];
};

export const EMPTY_SYNC_CATALOG: SyncCatalog = { collections: [], categories: [] };

function isExpired(record: { expiresAt?: unknown; deletedAt?: unknown }, now: number): boolean {
  if (record.deletedAt) return true;
  return typeof record.expiresAt === "number" && record.expiresAt <= now;
}

export type SyncPlanWrite = {
  docId: string;
  doc: NormalizedProductDoc;
  action: "insert" | "update";
};

export type SyncPlan = {
  /** False when the upload is too malformed to apply safely. */
  safe: boolean;
  writes: SyncPlanWrite[];
  /** docIds of visible products absent from the upload (to soft-hide). */
  hides: string[];
  skipped: number;
  errors: SyncError[];
  total: number;
  validCount: number;
};

export type SyncSummary = {
  inserted: number;
  updated: number;
  hidden: number;
  skipped: number;
  total: number;
  errors: SyncError[];
};

export class UnsafeSyncError extends Error {
  errors: SyncError[];
  validCount: number;
  total: number;

  constructor(plan: SyncPlan) {
    super(
      `Refusing to sync: ${plan.errors.length} invalid of ${plan.total} rows, ${plan.validCount} valid.`
    );
    this.name = "UnsafeSyncError";
    this.errors = plan.errors;
    this.validCount = plan.validCount;
    this.total = plan.total;
  }
}

/**
 * Pure planner for the XLSX full-replace sync.
 *
 * - Products in the upload are written only when their hash OR visibility
 *   changed (hash already includes isVisible, but we also compare isVisible so
 *   a soft-hidden product reappearing is restored).
 * - Products absent from the upload that are currently visible are soft-hidden.
 * - Already-hidden, still-absent products cost zero writes.
 * - The upload is "unsafe" when there are zero valid rows, or invalid rows
 *   outnumber valid rows.
 */
export function buildSyncPlan(
  rows: RawProductRow[],
  existing: Map<string, {
    hash?: string;
    isVisible?: boolean;
    source?: string;
    collectionId?: string;
    categoryId?: string;
    categorySlug?: string;
    stockStatus?: "in_stock" | "out_of_stock";
  }>,
  catalog: SyncCatalog = EMPTY_SYNC_CATALOG,
  now: number = Date.now()
): SyncPlan {
  const valid = new Map<string, NormalizedProductDoc>();
  const errors: SyncError[] = [];

  rows.forEach((r, i) => {
    const { doc, error } = normalizeProductRow(r);
    if (!doc) {
      errors.push({ row: i + 1, error: error || "Invalid row" });
      return;
    }

    const { collectionValue, categoryValue } = productLinkageFromRow(r);
    if (!collectionValue) {
      errors.push({ row: i + 1, error: `S No ${doc.sNo}: add a Collection column (collection name, slug, or ID)` });
      return;
    }
    if (!categoryValue) {
      errors.push({ row: i + 1, error: `S No ${doc.sNo}: add a Category column (category name, slug, or ID)` });
      return;
    }

    const collection = resolveCatalogRecord(catalog.collections, collectionValue);
    if (!collection) {
      errors.push({ row: i + 1, error: `S No ${doc.sNo}: collection ${JSON.stringify(collectionValue)} not found` });
      return;
    }
    const category = resolveCatalogRecord(catalog.categories, categoryValue);
    if (!category) {
      errors.push({ row: i + 1, error: `S No ${doc.sNo}: category ${JSON.stringify(categoryValue)} not found` });
      return;
    }
    if (!collectionHasCategory({ id: collection.id, categoryIds: collection.categoryIds }, category.id)) {
      errors.push({
        row: i + 1,
        error: `S No ${doc.sNo}: collection ${JSON.stringify(catalogRecordLabel(collection))} does not include category ${JSON.stringify(catalogRecordLabel(category))}`,
      });
      return;
    }
    if (isExpired(category, now)) {
      errors.push({ row: i + 1, error: `S No ${doc.sNo}: category ${JSON.stringify(catalogRecordLabel(category))} is expired or deleted` });
      return;
    }
    if (isExpired(collection, now)) {
      errors.push({ row: i + 1, error: `S No ${doc.sNo}: collection ${JSON.stringify(catalogRecordLabel(collection))} is expired or deleted` });
      return;
    }

    // Canonical assignment: IDs come from the saved records, and the stored
    // display label is the category's own name (never the sheet's text).
    const linked: NormalizedProductDoc = {
      ...doc,
      category: catalogRecordLabel(category),
      categoryId: category.id,
      categorySlug: typeof category.slug === "string" && category.slug.trim()
        ? category.slug.trim()
        : doc.categorySlug,
      collectionId: collection.id,
    };
    linked.hash = productHash(linked);
    valid.set(linked.docId, linked);
  });

  const validCount = valid.size;
  const safe = validCount > 0 && errors.length < validCount;

  const writes: SyncPlanWrite[] = [];
  const hides: string[] = [];
  let skipped = 0;

  if (safe) {
    const incomingIds = new Set<string>();

    for (const doc of valid.values()) {
      incomingIds.add(doc.docId);
      const prev = existing.get(doc.docId);
      const unchanged =
        !!prev && prev.hash === doc.hash && prev.isVisible === doc.isVisible;

      if (unchanged) {
        skipped++;
        continue;
      }

      const writeDoc = {
        ...doc,
        ...(prev?.stockStatus ? { stockStatus: prev.stockStatus } : {}),
      };
      writes.push({ docId: doc.docId, doc: writeDoc, action: prev ? "update" : "insert" });
    }

    for (const [docId, prev] of existing) {
      if (incomingIds.has(docId)) continue;
      if (prev.isVisible === false) continue;
      if (prev.source === 'manual') continue;
      hides.push(docId);
    }
  }

  return { safe, writes, hides, skipped, errors, total: rows.length, validCount };
}

/**
 * Applies an XLSX/CSV row set to Firestore with full-replace / soft-hide
 * semantics. Throws {@link UnsafeSyncError} without writing when unsafe.
 */
export async function syncProducts(rows: RawProductRow[]): Promise<SyncSummary> {
  const { adminDb } = await import("./firebase-admin");

  const [snap, collectionSnap, categorySnap] = await Promise.all([
    adminDb.collection("products").get(),
    adminDb.collection("collections").get(),
    adminDb.collection("categories").get(),
  ]);

  const catalog: SyncCatalog = {
    collections: collectionSnap.docs.map((doc) => ({ id: doc.id, ...doc.data() })),
    categories: categorySnap.docs.map((doc) => ({ id: doc.id, ...doc.data() })),
  };

  const existing = new Map<string, {
    hash?: string;
    isVisible?: boolean;
    source?: string;
    collectionId?: string;
    categoryId?: string;
    categorySlug?: string;
    stockStatus?: "in_stock" | "out_of_stock";
  }>();
  snap.forEach((d) => {
    const data = d.data();
    existing.set(d.id, {
      hash: data.hash,
      isVisible: data.isVisible,
      source: data.source,
      ...(typeof data.collectionId === "string" ? { collectionId: data.collectionId } : {}),
      ...(typeof data.categoryId === "string" ? { categoryId: data.categoryId } : {}),
      ...(typeof data.categorySlug === "string" ? { categorySlug: data.categorySlug } : {}),
      ...(data.stockStatus === "in_stock" || data.stockStatus === "out_of_stock" ? { stockStatus: data.stockStatus } : {}),
    });
  });

  const plan = buildSyncPlan(rows, existing, catalog);
  if (!plan.safe) throw new UnsafeSyncError(plan);

  let batch = adminDb.batch();
  let count = 0;
  const commits: Promise<unknown>[] = [];
  const flush = () => {
    if (count > 0) {
      commits.push(batch.commit());
      batch = adminDb.batch();
      count = 0;
    }
  };

  const now = Date.now();
  let inserted = 0;
  let updated = 0;

  for (const write of plan.writes) {
    batch.set(
      adminDb.collection("products").doc(write.docId),
      { ...write.doc, updatedAt: now },
      { merge: true }
    );
    if (write.action === "insert") inserted++;
    else updated++;
    count++;
    if (count >= 450) flush();
  }

  for (const docId of plan.hides) {
    batch.set(
      adminDb.collection("products").doc(docId),
      { isVisible: false, updatedAt: now },
      { merge: true }
    );
    count++;
    if (count >= 450) flush();
  }

  flush();
  await Promise.all(commits);

  // Keep each touched collection's cached productCount honest — the admin
  // delete guard reads it, and a sheet upload can move products between
  // collections in one shot.
  const touchedCollectionIds = [...new Set(plan.writes.map((write) => write.doc.collectionId).filter((id): id is string => !!id))];
  await Promise.all(touchedCollectionIds.map(async (collectionId) => {
    const assigned = await adminDb.collection("products").where("collectionId", "==", collectionId).get();
    await adminDb.collection("collections").doc(collectionId).set(
      { productCount: assigned.size, updatedAt: now },
      { merge: true }
    );
  }));

  const { clearProductsCache } = await import("./products");
  clearProductsCache();

  return {
    inserted,
    updated,
    hidden: plan.hides.length,
    skipped: plan.skipped,
    total: plan.total,
    errors: plan.errors,
  };
}
