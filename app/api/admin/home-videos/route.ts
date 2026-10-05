import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-auth";
import {
  DEFAULT_HOME_VIDEOS,
  HOME_VIDEO_KEYS,
  validateHomeVideoInput,
} from "@/lib/home-videos";

// GET /api/admin/home-videos
// Current effective home-page videos plus the shipped defaults, so the panel
// can label a slot "live" or "overridden".
export async function GET(req: Request) {
  if (!requireAdmin(req)) {
    return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
  }

  try {
    const { getHomeVideos } = await import("@/lib/site-settings");
    const videos = await getHomeVideos();
    return NextResponse.json({
      success: true,
      videos,
      defaults: DEFAULT_HOME_VIDEOS,
      slots: HOME_VIDEO_KEYS,
    });
  } catch (err) {
    console.error("admin/home-videos GET failed:", err);
    return NextResponse.json(
      { success: false, error: "Failed to load home videos" },
      { status: 500 }
    );
  }
}

// PUT /api/admin/home-videos
// Body: partial { hero?, collectionFilm?, carousel? } of https video URLs.
export async function PUT(req: Request) {
  if (!requireAdmin(req)) {
    return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
  }

  try {
    const body = await req.json();
    const check = validateHomeVideoInput(body);
    if (!check.ok) {
      return NextResponse.json({ success: false, error: check.error }, { status: 400 });
    }

    const { saveHomeVideos } = await import("@/lib/site-settings");
    const videos = await saveHomeVideos(check.patch, req.headers.get("x-admin-email"));

    return NextResponse.json({ success: true, videos });
  } catch (err) {
    console.error("admin/home-videos PUT failed:", err);
    return NextResponse.json(
      { success: false, error: "Failed to save home videos" },
      { status: 500 }
    );
  }
}
