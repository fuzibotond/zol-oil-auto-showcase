// Responsive delivery for R2 car photos served from /img/<key>.
//
// Existing uploads are full-size originals (some 3–6 MB). When the owner enables
// Cloudflare Image Transformations on the zone and sets the BUILD-time variable
// VITE_IMAGE_RESIZING=cloudflare, these helpers emit /cdn-cgi/image/... URLs so
// every card/thumbnail gets a right-sized WebP/AVIF. With the flag unset they
// return the original URL and no srcset — i.e. exactly the previous behaviour.

const ENABLED = (import.meta.env.VITE_IMAGE_RESIZING ?? "").trim() === "cloudflare";

function resizable(url: string): boolean {
  return ENABLED && url.startsWith("/img/");
}

/** URL of `url` scaled down to `width` CSS px (original URL when disabled). */
export function imgUrl(url: string, width: number, quality = 75): string {
  if (!resizable(url)) return url;
  return `/cdn-cgi/image/width=${width},quality=${quality},format=auto,fit=scale-down${url}`;
}

/** `srcset` for the given widths, or undefined when resizing is disabled. */
export function imgSrcSet(url: string, widths: number[]): string | undefined {
  if (!resizable(url)) return undefined;
  return widths.map((w) => `${imgUrl(url, w)} ${w}w`).join(", ");
}

/** Widths used for car photos (cards ≈ 400px, gallery up to ≈ 900px CSS). */
export const CAR_IMAGE_WIDTHS = [400, 640, 960, 1280, 1600];
