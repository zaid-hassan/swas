import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  if (!requireAdmin(req)) {
    return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
  }

  try {
    const [{ adminDb }, { listCollections }] = await Promise.all([
      import("@/lib/firebase-admin"),
      import("@/lib/collections"),
    ]);
    const collections = await listCollections(adminDb);
    return NextResponse.json({ success: true, collections }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    console.error("admin/collections list failed:", error);
    return NextResponse.json({ success: false, error: "Failed to load collections" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  if (!requireAdmin(req)) {
    return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
  }

  try {
    const body = await req.json();
    const [{ adminDb }, { createCollection, validateCollectionInput }] = await Promise.all([
      import("@/lib/firebase-admin"),
      import("@/lib/collections"),
    ]);
    const validation = validateCollectionInput({ name: body?.name, bannerUrl: body?.bannerUrl });
    if (!validation.ok) {
      return NextResponse.json({ success: false, error: validation.error }, { status: 400 });
    }

    const collection = await createCollection(adminDb, validation);
    return NextResponse.json({ success: true, collection: { ...collection, productCount: 0 } }, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Collection creation failed";
    if (message === "A collection with this name already exists") {
      return NextResponse.json({ success: false, error: message }, { status: 409 });
    }
    console.error("admin/collections create failed:", error);
    return NextResponse.json({ success: false, error: "Collection creation failed" }, { status: 500 });
  }
}
