import { normalizeHomeVideos } from "./home-videos";
import type { HomeVideos } from "./home-videos";

/** Firestore doc holding the editable home-page videos. */
export const HOME_VIDEOS_DOC = "settings/home";

/**
 * Read the editable home-page videos.
 *
 * No cache on purpose: this is a single document, the home page already reads
 * Firestore per request (`force-dynamic`), and an update saved from the
 * dashboard should be live immediately rather than up to a TTL later. A read
 * failure falls back to the shipped defaults so the storefront never blanks out.
 */
export async function getHomeVideos(): Promise<HomeVideos> {
  try {
    const { adminDb } = await import("./firebase-admin");
    const snap = await adminDb.doc(HOME_VIDEOS_DOC).get();
    return normalizeHomeVideos(snap.data());
  } catch (err) {
    console.error("getHomeVideos failed, using defaults:", err);
    return normalizeHomeVideos(null);
  }
}

/** Merge a validated patch into the settings doc. */
export async function saveHomeVideos(
  patch: Partial<HomeVideos>,
  updatedBy?: string | null
): Promise<HomeVideos> {
  const { adminDb } = await import("./firebase-admin");

  await adminDb.doc(HOME_VIDEOS_DOC).set(
    {
      ...patch,
      updatedAt: Date.now(),
      updatedBy: updatedBy || "",
    },
    { merge: true }
  );

  const snap = await adminDb.doc(HOME_VIDEOS_DOC).get();
  return normalizeHomeVideos(snap.data());
}
