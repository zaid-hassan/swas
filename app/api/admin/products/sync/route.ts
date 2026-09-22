import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-auth";
import { syncProducts, UnsafeSyncError } from "@/lib/product-sync";

// POST /api/admin/products/sync
// Body: { rows: RawProductRow[] } parsed from an XLSX upload.
// Full-replace semantics: rows in the file are upserted (hash-diff), rows
// absent from the file are soft-hidden (isVisible=false), never deleted.
export async function POST(req: Request) {
  if (!requireAdmin(req)) {
    return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
  }

  try {
    const body = await req.json();
    const rows: any[] = body.rows ?? [];

    if (!rows.length) {
      return NextResponse.json(
        { success: false, error: "No rows provided. Upload an XLSX file." },
        { status: 400 }
      );
    }

    const summary = await syncProducts(rows);

    return NextResponse.json({ success: true, ...summary });
  } catch (err) {
    if (err instanceof UnsafeSyncError) {
      return NextResponse.json(
        { success: false, error: err.message, errors: err.errors.slice(0, 20) },
        { status: 400 }
      );
    }
    console.error("products/sync failed:", err);
    return NextResponse.json({ success: false, error: "Sync failed" }, { status: 500 });
  }
}
