// Browser-side downscale before upload. Phone/camera originals (4000px+, 3–6 MB)
// were being stored and served as-is, making listing pages 13–15 MB on mobile.
// Images are scaled so the long edge is at most MAX_EDGE and re-encoded as JPEG;
// small images, GIFs, and anything the browser can't decode are sent unchanged.

const MAX_EDGE = 1920;
const QUALITY = 0.82;
const SMALL_ENOUGH_BYTES = 450 * 1024;

export async function downscaleForUpload(file: File): Promise<File> {
  if (typeof window === "undefined" || typeof createImageBitmap !== "function") return file;
  if (file.type === "image/gif") return file;

  let bitmap: ImageBitmap;
  try {
    bitmap = await createImageBitmap(file, { imageOrientation: "from-image" });
  } catch {
    return file; // unknown/unsupported format — let the server validate it
  }

  const { width, height } = bitmap;
  const scale = Math.min(1, MAX_EDGE / Math.max(width, height));
  if (scale === 1 && file.size <= SMALL_ENOUGH_BYTES) {
    bitmap.close();
    return file;
  }

  const canvas = document.createElement("canvas");
  canvas.width = Math.round(width * scale);
  canvas.height = Math.round(height * scale);
  const ctx = canvas.getContext("2d");
  if (!ctx) {
    bitmap.close();
    return file;
  }
  // JPEG has no alpha: paint white under transparent PNGs instead of black.
  ctx.fillStyle = "#fff";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  bitmap.close();

  const blob = await new Promise<Blob | null>((resolve) =>
    canvas.toBlob(resolve, "image/jpeg", QUALITY),
  );
  if (!blob || blob.size >= file.size) return file;
  const name = file.name.replace(/\.[^.]+$/, "") + ".jpg";
  return new File([blob], name, { type: "image/jpeg", lastModified: Date.now() });
}
