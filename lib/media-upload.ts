export const IMAGE_EXTENSIONS = ["jpg", "jpeg", "png", "webp"];
export const VIDEO_EXTENSIONS = ["mp4", "webm"];
export const MAX_IMAGE_BYTES = 8 * 1024 * 1024;
export const MAX_VIDEO_BYTES = 100 * 1024 * 1024;

function ext(name: string): string {
  const path = name.split("?")[0].split("#")[0];
  const base = path.split("/").pop() ?? path;
  const dot = base.lastIndexOf(".");
  return dot === -1 ? "" : base.slice(dot + 1).toLowerCase();
}

export function isImageUrl(url: unknown): boolean {
  return typeof url === "string" && IMAGE_EXTENSIONS.includes(ext(url.trim()));
}

export function isVideoUrl(url: unknown): boolean {
  return typeof url === "string" && VIDEO_EXTENSIONS.includes(ext(url.trim()));
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

/**
 * Upload one file straight to Cloudinary with the unsigned preset and resolve
 * its secure_url. Shared by the single-product form and the home-video panel.
 */
export function uploadToCloudinary(
  file: File,
  onProgress: (percent: number) => void
): Promise<string> {
  const cloud = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME!;
  const preset = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET!;

  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("POST", cloudinaryUploadUrl(cloud));

    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable) onProgress(Math.round((e.loaded / e.total) * 100));
    };

    xhr.onload = () => {
      try {
        const data = JSON.parse(xhr.responseText);
        if (xhr.status >= 200 && xhr.status < 300 && data.secure_url) {
          resolve(data.secure_url as string);
        } else {
          reject(new Error(data?.error?.message || "Upload failed"));
        }
      } catch {
        reject(new Error("Upload failed"));
      }
    };

    xhr.onerror = () => reject(new Error("Upload failed"));

    const fd = new FormData();
    fd.append("file", file);
    fd.append("upload_preset", preset);
    xhr.send(fd);
  });
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
