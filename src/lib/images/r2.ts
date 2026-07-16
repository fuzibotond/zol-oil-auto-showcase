// Server-only Cloudflare R2 image service: validation, upload, delivery URLs,
// and deletion. Used by the upload API route and the car/image admin flows.

import { getEnvVar, getR2, newId } from "@/lib/db/env";

export const MAX_IMAGE_BYTES = 10 * 1024 * 1024; // 10 MB

export interface DetectedImage {
  mime: string;
  ext: string;
}

/**
 * Validate a file by its real signature (magic bytes), not its extension.
 * Only jpeg/png/webp/gif are allowed. SVG is rejected (script-injection risk).
 * Returns the detected type or throws with a Romanian message.
 */
export function detectImage(bytes: Uint8Array): DetectedImage {
  if (bytes.length < 12) throw new Error("Fișier imagine invalid sau prea mic.");

  // JPEG: FF D8 FF
  if (bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) {
    return { mime: "image/jpeg", ext: "jpg" };
  }
  // PNG: 89 50 4E 47 0D 0A 1A 0A
  if (
    bytes[0] === 0x89 &&
    bytes[1] === 0x50 &&
    bytes[2] === 0x4e &&
    bytes[3] === 0x47 &&
    bytes[4] === 0x0d &&
    bytes[5] === 0x0a &&
    bytes[6] === 0x1a &&
    bytes[7] === 0x0a
  ) {
    return { mime: "image/png", ext: "png" };
  }
  // GIF: "GIF8"
  if (bytes[0] === 0x47 && bytes[1] === 0x49 && bytes[2] === 0x46 && bytes[3] === 0x38) {
    return { mime: "image/gif", ext: "gif" };
  }
  // WEBP: "RIFF"...."WEBP"
  if (
    bytes[0] === 0x52 &&
    bytes[1] === 0x49 &&
    bytes[2] === 0x46 &&
    bytes[3] === 0x46 &&
    bytes[8] === 0x57 &&
    bytes[9] === 0x45 &&
    bytes[10] === 0x42 &&
    bytes[11] === 0x50
  ) {
    return { mime: "image/webp", ext: "webp" };
  }
  throw new Error("Format de imagine neacceptat. Folosește JPG, PNG, WEBP sau GIF.");
}

/** Public delivery URL for an R2 object key. */
export function deliveryUrl(key: string): string {
  const base = getEnvVar("R2_PUBLIC_BASE_URL");
  if (base) return `${base.replace(/\/$/, "")}/${key}`;
  // No custom image domain configured yet — serve via the same-origin route.
  return `/img/${key}`;
}

export interface UploadedImage {
  r2_key: string;
  url: string;
  mime: string;
  size: number;
}

/**
 * Validate and store an image in R2 under a non-guessable key. Throws (without
 * writing) on validation failure or oversize input.
 */
export async function uploadImage(bytes: Uint8Array, prefix = "cars"): Promise<UploadedImage> {
  if (bytes.length === 0) throw new Error("Fișier gol.");
  if (bytes.length > MAX_IMAGE_BYTES) throw new Error("Imaginea depășește limita de 10 MB.");

  const { mime, ext } = detectImage(bytes);
  const key = `${prefix}/${newId()}.${ext}`;

  await getR2().put(key, bytes as unknown as ArrayBufferView, {
    httpMetadata: { contentType: mime, cacheControl: "public, max-age=31536000, immutable" },
  });

  return { r2_key: key, url: deliveryUrl(key), mime, size: bytes.length };
}

/** Delete one or more R2 objects. Ignores keys that are absent. */
export async function deleteR2Objects(keys: string[]): Promise<void> {
  const clean = keys.filter(Boolean);
  if (clean.length === 0) return;
  await getR2().delete(clean);
}
