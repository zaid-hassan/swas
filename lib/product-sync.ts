import { normalizeProductRow } from "./product-rows";
import type { NormalizedProductDoc } from "./product-rows";

export type SyncError = { row: number; error: string };

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
  rows: any[],
  existing: Map<string, { hash?: string; isVisible?: boolean }>
): SyncPlan {
  const valid = new Map<string, NormalizedProductDoc>();
  const errors: SyncError[] = [];

  rows.forEach((r, i) => {
    const { doc, error } = normalizeProductRow(r);
    if (!doc) errors.push({ row: i + 1, error: error || "Invalid row" });
    else valid.set(doc.docId, doc);
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

      writes.push({ docId: doc.docId, doc, action: prev ? "update" : "insert" });
    }

    for (const [docId, prev] of existing) {
      if (incomingIds.has(docId)) continue;
      if (prev.isVisible === false) continue;
      hides.push(docId);
    }
  }

  return { safe, writes, hides, skipped, errors, total: rows.length, validCount };
}

/**
 * Applies an XLSX/CSV row set to Firestore with full-replace / soft-hide
 * semantics. Throws {@link UnsafeSyncError} without writing when unsafe.
 */
export async function syncProducts(rows: any[]): Promise<SyncSummary> {
  const { adminDb } = await import("./firebase-admin");

  const snap = await adminDb.collection("products").get();
  const existing = new Map<string, { hash?: string; isVisible?: boolean }>();
  snap.forEach((d) => {
    const data = d.data() as any;
    existing.set(d.id, { hash: data.hash, isVisible: data.isVisible });
  });

  const plan = buildSyncPlan(rows, existing);
  if (!plan.safe) throw new UnsafeSyncError(plan);

  let batch = adminDb.batch();
  let count = 0;
  const commits: Promise<any>[] = [];
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
