// One-time product catalog seed.
//
// Reads the published Google Sheet CSV (or a local file passed as argv[2]),
// and writes it into the Firestore `products` collection using the same
// full-replace / soft-hide diff as the dashboard XLSX upload.
//
// Run once against the target project before deploying the Firestore-only
// build, then this file can be deleted:
//
//   npx tsx scripts/seed-products.ts
//   npx tsx scripts/seed-products.ts ./catalog.xlsx   # csv/xlsx export
//
// Requires FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, FIREBASE_PRIVATE_KEY.

import fs from "node:fs";
import Papa from "papaparse";
import { adminDb } from "../lib/firebase-admin";
import { buildSyncPlan } from "../lib/product-sync";

const DEFAULT_CSV_URL =
  "https://docs.google.com/spreadsheets/d/e/2PACX-1vRBzej5M0bDv8NnJ8xgCxfaEn_FYpdiNZiZMyhed_AMx9BTND-2f90pIk5CWAUiR0MlW4jJHg5ZaHGe/pub?gid=127253953&single=true&output=csv";

async function loadRows(path?: string): Promise<any[]> {
  let csvText: string;

  if (path) {
    csvText = fs.readFileSync(path, "utf8");
  } else {
    const res = await fetch(DEFAULT_CSV_URL, { cache: "no-store" });
    if (!res.ok) throw new Error(`Failed to fetch CSV: ${res.status}`);
    csvText = await res.text();
  }

  const { data } = Papa.parse(csvText, { header: true, skipEmptyLines: true });
  return data as any[];
}

async function main() {
  const rows = await loadRows(process.argv[2]);
  console.log(`Loaded ${rows.length} rows.`);

  const snap = await adminDb.collection("products").get();
  const existing = new Map<string, { hash?: string; isVisible?: boolean }>();
  snap.forEach((d) => {
    const data = d.data() as any;
    existing.set(d.id, { hash: data.hash, isVisible: data.isVisible });
  });
  console.log(`Found ${existing.size} existing products.`);

  const plan = buildSyncPlan(rows, existing);
  if (!plan.safe) {
    throw new Error(
      `Refusing to seed: ${plan.errors.length} invalid of ${plan.total} rows, ${plan.validCount} valid.`
    );
  }

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

  let inserted = 0;
  let updated = 0;

  for (const w of plan.writes) {
    batch.set(adminDb.collection("products").doc(w.docId), w.doc, { merge: true });
    count++;
    if (w.action === "insert") inserted++;
    else updated++;
    if (count >= 450) flush();
  }

  for (const docId of plan.hides) {
    batch.update(adminDb.collection("products").doc(docId), {
      isVisible: false,
      updatedAt: Date.now(),
    });
    count++;
    if (count >= 450) flush();
  }

  flush();
  await Promise.all(commits);

  console.log(
    `Seed complete: ${inserted} inserted, ${updated} updated, ${plan.hides.length} hidden, ${plan.skipped} unchanged, ${plan.errors.length} invalid.`
  );
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
