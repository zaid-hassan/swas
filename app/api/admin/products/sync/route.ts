import { NextResponse } from "next/server";
import Papa from "papaparse";
import { normalizeProductRow } from "@/lib/product-rows";

const DEFAULT_CSV_URL =
  "https://docs.google.com/spreadsheets/d/e/2PACX-1vRBzej5M0bDv8NnJ8xgCxfaEn_FYpdiNZiZMyhed_AMx9BTND-2f90pIk5CWAUiR0MlW4jJHg5ZaHGe/pub?gid=127253953&single=true&output=csv";

function isAdmin(req: Request) {
  const required = process.env.NEXT_PUBLIC_ADMIN_EMAIL;
  // Keep consistent with the existing client-side admin gate.
  // Writes (unlike the read-only admin GETs) require the header.
  if (!required) return true;
  return req.headers.get("x-admin-email") === required;
}

export async function POST(req: Request) {
  if (!isAdmin(req)) {
    return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
  }

  try {
    const body = await req.json();
    let rows: any[] = body.rows ?? [];

    // Sheets CSV URL path (one-click resync of the current published sheet)
    if (!rows.length && (body.source === "sheets" || body.csvUrl)) {
      const url = body.csvUrl || DEFAULT_CSV_URL;
      const res = await fetch(url, { cache: "no-store" });
      const csvText = await res.text();
      const { data } = Papa.parse(csvText, { header: true, skipEmptyLines: true });
      rows = data as any[];
    }

    if (!rows.length) {
      return NextResponse.json(
        { success: false, error: "No rows provided. Upload XLSX or sync Sheets." },
        { status: 400 }
      );
    }

    // Normalize + validate (shared logic with the storefront reader)
    const valid = new Map<string, any>();
    const errors: { row: number; error: string }[] = [];
    rows.forEach((r, i) => {
      const { doc, error } = normalizeProductRow(r);
      if (!doc) errors.push({ row: i + 1, error: error || "Invalid row" });
      else valid.set(doc.docId, { ...doc, updatedAt: Date.now() });
    });

    // Diff-only: skip writes where the content hash is unchanged.
    // This is what keeps Firestore write costs minimal on re-syncs.
    // Lazy-load firebase-admin so `next build` doesn't evaluate service
    // account credentials at build time (runtime has real env).
    const [{ adminDb }, { clearProductsCache }] = await Promise.all([
      import("@/lib/firebase-admin"),
      import("@/lib/products"),
    ]);
    const existing = await adminDb.collection("products").get();
    const existingHashes = new Map<string, string>();
    existing.forEach((d) => existingHashes.set(d.id, (d.data() as any).hash));

    let inserted = 0;
    let updated = 0;
    let skipped = 0;
    let batch = adminDb.batch();
    let batchCount = 0;
    const commits: Promise<any>[] = [];
    const flush = () => {
      if (batchCount > 0) {
        commits.push(batch.commit());
        batch = adminDb.batch();
        batchCount = 0;
      }
    };

    for (const [docId, doc] of valid) {
      const prev = existingHashes.get(docId);
      if (prev === doc.hash) {
        skipped++;
        continue;
      }
      const ref = adminDb.collection("products").doc(docId);
      batch.set(ref, doc, { merge: true });
      batchCount++;
      if (prev) updated++;
      else inserted++;
      // Firestore batch limit is 500 writes
      if (batchCount >= 450) flush();
    }
    flush();
    await Promise.all(commits);

    clearProductsCache();

    return NextResponse.json({
      success: true,
      total: rows.length,
      inserted,
      updated,
      skipped,
      errors,
    });
  } catch (err) {
    console.error("products/sync failed:", err);
    return NextResponse.json({ success: false, error: "Sync failed" }, { status: 500 });
  }
}
