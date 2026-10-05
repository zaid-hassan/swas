import { isVideoUrl } from "./media-upload";

/**
 * Home-page marketing videos. They used to be literals inside the section
 * components; they now live in the Firestore doc `settings/home` so an admin
 * can replace them from the dashboard.
 *
 * This module is deliberately pure (no firebase import) so both the server
 * pages and the client panel can use the same defaults and validators.
 * The Firestore read/write lives in `lib/site-settings.ts`.
 */
export type HomeVideos = {
  /** Hero section background loop. */
  hero: string;
  /** "Taruni Collection" film between the hero and the catalogue. */
  collectionFilm: string;
  /** One clip per carousel card, in display order. */
  carousel: string[];
};

export type HomeVideoKey = keyof HomeVideos;
export type HomeVideoSingleKey = "hero" | "collectionFilm";

/** The single clip the carousel used to play on every card. */
const SHIPPED_CAROUSEL_CLIP =
  "https://res.cloudinary.com/dndppvnjl/video/upload/v1787232893/0820_vhpjoo.mp4";

/** Matches the number of cards the carousel renders today. */
export const CAROUSEL_DEFAULT_COUNT = 5;
/** Guard rail: the stack shows ~3 cards at a time, so keep the list sane. */
export const CAROUSEL_MAX = 8;

/** What the home page shipped with before the videos were editable. */
export const DEFAULT_HOME_VIDEOS: HomeVideos = {
  hero:
    "https://res.cloudinary.com/dndppvnjl/video/upload/f_mp4,vc_h264,q_auto,w_1200/0820_vhpjoo.mp4",
  collectionFilm:
    "https://res.cloudinary.com/dndppvnjl/video/upload/f_mp4,vc_h264,q_auto,w_1200/0825_zphufl.mp4",
  carousel: Array.from(
    { length: CAROUSEL_DEFAULT_COUNT },
    () => SHIPPED_CAROUSEL_CLIP
  ),
};

export const HOME_VIDEO_KEYS: HomeVideoKey[] = [
  "hero",
  "collectionFilm",
  "carousel",
];

/** Slot metadata shared by the admin panel (labels stay next to the data). */
export const SINGLE_HOME_VIDEO_SLOTS: Array<{
  key: HomeVideoSingleKey;
  label: string;
  hint: string;
}> = [
  {
    key: "hero",
    label: "Hero background video",
    hint: "Silent loop behind the “Heritage / Timeless / Elegance” headline.",
  },
  {
    key: "collectionFilm",
    label: "Taruni Collection film",
    hint: "Full-width film between the hero and the catalogue.",
  },
];

export const CAROUSEL_LABEL = "Featured video carousel";
export const CAROUSEL_HINT = `One clip per card, in this order — up to ${CAROUSEL_MAX}.`;

function cleanVideoList(raw: unknown): string[] {
  const list = Array.isArray(raw) ? raw : typeof raw === "string" ? [raw] : [];
  return list
    .map((entry) => (typeof entry === "string" ? entry.trim() : ""))
    .filter((entry) => isVideoUrl(entry));
}

/**
 * Merge a stored doc over the defaults. Missing, blank or non-video values fall
 * back to the built-in default, so the home page can never render an empty or
 * broken video slot.
 */
export function normalizeHomeVideos(raw: unknown): HomeVideos {
  const data = (raw ?? {}) as Record<string, unknown>;

  const pickSingle = (key: HomeVideoSingleKey): string => {
    const value = typeof data[key] === "string" ? (data[key] as string).trim() : "";
    return isVideoUrl(value) ? value : DEFAULT_HOME_VIDEOS[key];
  };

  // A bare string is accepted as a one-clip carousel, so a hand-written or
  // pre-existing doc still reads.
  const carousel = cleanVideoList(data.carousel).slice(0, CAROUSEL_MAX);

  return {
    hero: pickSingle("hero"),
    collectionFilm: pickSingle("collectionFilm"),
    carousel: carousel.length ? carousel : [...DEFAULT_HOME_VIDEOS.carousel],
  };
}

/**
 * Pair each carousel clip with a card caption by position. More clips than
 * captions cycles the captions; a clip with no caption renders video-only.
 */
export function carouselSlides<T>(
  videos: string[],
  captions: readonly T[]
): Array<{ video: string; caption?: T }> {
  return videos.map((video, index) => ({
    video,
    caption: captions.length ? captions[index % captions.length] : undefined,
  }));
}

/**
 * Validate a partial update from the dashboard. Only known keys are accepted.
 * The single slots take one https video URL each; the carousel takes
 * 1..CAROUSEL_MAX of them. Omitted keys are left untouched, so one slot can be
 * updated on its own.
 */
export function validateHomeVideoInput(
  input: unknown
): { ok: true; patch: Partial<HomeVideos> } | { ok: false; error: string } {
  if (!input || typeof input !== "object" || Array.isArray(input)) {
    return { ok: false, error: "Expected an object of video urls" };
  }

  const data = input as Record<string, unknown>;
  const patch: Partial<HomeVideos> = {};

  const urlError = (value: string, label: string): string | null => {
    if (!value) return `Missing video url for ${label}`;
    if (!/^https:\/\//i.test(value)) return `Video url must be https for ${label}`;
    if (!isVideoUrl(value)) {
      return `Not a video url (mp4/webm) for ${label}: ${value}`;
    }
    return null;
  };

  for (const key of Object.keys(data)) {
    if (!HOME_VIDEO_KEYS.includes(key as HomeVideoKey)) {
      return { ok: false, error: `Unknown video slot: ${key}` };
    }

    if (key === "carousel") {
      const raw = data.carousel;
      if (!Array.isArray(raw)) {
        return { ok: false, error: "Carousel videos must be an array" };
      }
      if (raw.length === 0) {
        return { ok: false, error: "Carousel needs at least one video" };
      }
      if (raw.length > CAROUSEL_MAX) {
        return {
          ok: false,
          error: `Carousel supports at most ${CAROUSEL_MAX} videos`,
        };
      }

      const videos: string[] = [];
      for (const entry of raw) {
        const value = typeof entry === "string" ? entry.trim() : "";
        const error = urlError(value, "carousel");
        if (error) return { ok: false, error };
        videos.push(value);
      }
      patch.carousel = videos;
      continue;
    }

    const value = typeof data[key] === "string" ? (data[key] as string).trim() : "";
    const error = urlError(value, key);
    if (error) return { ok: false, error };
    patch[key as HomeVideoSingleKey] = value;
  }

  if (Object.keys(patch).length === 0) {
    return { ok: false, error: "Nothing to update" };
  }

  return { ok: true, patch };
}
