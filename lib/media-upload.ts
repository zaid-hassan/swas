export const IMAGE_EXTENSIONS = ["jpg", "jpeg", "png", "webp"];
export const VIDEO_EXTENSIONS = ["mp4", "webm"];
export const MAX_IMAGE_BYTES = 8 * 1024 * 1024;
export const MAX_VIDEO_BYTES = 100 * 1024 * 1024;

function ext(name: string): string {
  const base = name.split("?")[0].split("#")[0];
  const dot = base.lastIndexOf(".");
  return dot === -1 ? "" : base.slice(dot + 1).toLowerCase();
}

export function isMediaAllowed(file: { name: string; size: number }): boolean {
  const e = ext(file.name);
  if (IMAGE_EXTENSIONS.includes(e)) {
    return file.size > 0 && file.size <= MAX_IMAGE_BYTES;
  }
  if (VIDEO_EXTENSIONS.includes(e)) {
    return file.size > 0 && file.size <= MAX_VIDEO_BYTES;
  }
  return false;
}

export function cloudinaryUploadUrl(cloud: string): string {
  return `https://api.cloudinary.com/v1_1/${cloud}/auto/upload`;
}

export function assertConfigured(): string | null {
  if (!process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME) {
    return "Cloudinary cloud name is not configured";
  }
  if (!process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET) {
    return "Cloudinary upload preset is not configured";
  }
  return null;
}

export type MediaItem = { kind: "image" | "video"; src: string };

/**
 * Fixed gallery order: image, video, image1, video1, image2, video2, image3.
 * Slots without a URL drop out, so Excel products (no videos) keep exactly
 * today's image order and manual products leave image3 empty.
 */
export function interleaveMedia(
  images: string[],
  videos: string[] = []
): MediaItem[] {
  const [image, image1, image2, image3] = images;
  const [video, video1, video2] = videos;
  const slots: Array<[string | undefined, "image" | "video"]> = [
    [image, "image"],
    [video, "video"],
    [image1, "image"],
    [video1, "video"],
    [image2, "image"],
    [video2, "video"],
    [image3, "image"],
  ];
  return slots.flatMap(([src, kind]): MediaItem[] =>
    src?.trim() ? [{ kind, src }] : []
  );
}
