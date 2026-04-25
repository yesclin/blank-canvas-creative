/**
 * Generates a tiny, privacy-safe thumbnail of a signature canvas for inclusion
 * in rejection logs. Two modes:
 *
 * 1. `downscale`: produces a heavily downscaled monochrome PNG dataURL of the
 *    actual canvas content. Useful to confirm whether anything was drawn at all
 *    (a stroke pattern is visible) without exposing a full-resolution signature.
 *    Output is capped at ~80x30 px and ~2KB to stay small in logs.
 *
 * 2. `placeholder`: produces a synthetic SVG dataURL that only encodes the
 *    canvas dimensions and whether strokes were detected — no pixel data at
 *    all. Use this when even a downscaled raster is considered too sensitive.
 *
 * Both modes are opt-in (see `attachThumbnail` flag in callers) and never
 * raise — failures return `null` so logging keeps working.
 */

export type ThumbnailMode = 'downscale' | 'placeholder' | 'off';

export interface SignatureThumbnailInput {
  canvas: HTMLCanvasElement | null;
  hasSignature: boolean;
  /** Defaults to 'placeholder' which is the safest. */
  mode?: ThumbnailMode;
  /** Max width in pixels for the downscale mode (default 80). */
  maxWidth?: number;
  /** Max height in pixels for the downscale mode (default 30). */
  maxHeight?: number;
}

export interface SignatureThumbnail {
  /** Data URL (image/png or image/svg+xml) safe to attach to logs. */
  dataUrl: string;
  /** Length of the dataURL in chars — handy for budgeting log payload size. */
  length: number;
  /** Mode actually used to generate the thumbnail. */
  mode: Exclude<ThumbnailMode, 'off'>;
  /** Final width of the thumbnail in pixels. */
  width: number;
  /** Final height of the thumbnail in pixels. */
  height: number;
}

/** Hard cap so a thumbnail never bloats a log entry (~2KB). */
const MAX_THUMBNAIL_LENGTH = 2048;

function buildPlaceholder(
  width: number,
  height: number,
  hasSignature: boolean
): SignatureThumbnail {
  // Pure SVG, no pixel data. Encodes only dimensions + a hint of whether
  // strokes were detected (a diagonal line if hasSignature, blank otherwise).
  const stroke = hasSignature
    ? `<line x1="4" y1="${height - 4}" x2="${width - 4}" y2="4" stroke="currentColor" stroke-width="2"/>`
    : '';
  const label = hasSignature ? 'drawn' : 'blank';
  const svg =
    `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">` +
    `<rect width="100%" height="100%" fill="#f5f5f5" stroke="#999" stroke-dasharray="2 2"/>` +
    stroke +
    `<text x="4" y="${height - 4}" font-family="monospace" font-size="8" fill="#666">${label}</text>` +
    `</svg>`;
  const dataUrl = `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
  return { dataUrl, length: dataUrl.length, mode: 'placeholder', width, height };
}

/**
 * Generates a thumbnail for the given canvas. Always returns `null` on failure
 * — never throws — so it's safe to call inside catch blocks and log builders.
 */
export function buildSignatureThumbnail(
  input: SignatureThumbnailInput
): SignatureThumbnail | null {
  const {
    canvas,
    hasSignature,
    mode = 'placeholder',
    maxWidth = 80,
    maxHeight = 30,
  } = input;

  if (mode === 'off') return null;

  // Placeholder mode never touches pixel data. Safe even if canvas is null —
  // we use sensible defaults so the log still gets something useful.
  if (mode === 'placeholder' || !canvas) {
    const w = canvas?.width ?? maxWidth;
    const h = canvas?.height ?? maxHeight;
    return buildPlaceholder(
      Math.min(w, maxWidth),
      Math.min(h, maxHeight),
      hasSignature
    );
  }

  // Downscale mode: render the source canvas into a tiny offscreen canvas.
  try {
    const ratio = Math.min(maxWidth / canvas.width, maxHeight / canvas.height, 1);
    const targetW = Math.max(1, Math.round(canvas.width * ratio));
    const targetH = Math.max(1, Math.round(canvas.height * ratio));

    const off = document.createElement('canvas');
    off.width = targetW;
    off.height = targetH;
    const ctx = off.getContext('2d');
    if (!ctx) return buildPlaceholder(targetW, targetH, hasSignature);

    ctx.fillStyle = '#fff';
    ctx.fillRect(0, 0, targetW, targetH);
    ctx.drawImage(canvas, 0, 0, targetW, targetH);

    const dataUrl = off.toDataURL('image/png');
    if (!dataUrl || dataUrl.length === 0) {
      return buildPlaceholder(targetW, targetH, hasSignature);
    }

    // If the downscaled raster ended up bigger than our budget, fall back to
    // the placeholder to keep log payloads bounded.
    if (dataUrl.length > MAX_THUMBNAIL_LENGTH) {
      return buildPlaceholder(targetW, targetH, hasSignature);
    }

    return {
      dataUrl,
      length: dataUrl.length,
      mode: 'downscale',
      width: targetW,
      height: targetH,
    };
  } catch {
    // Any DOM/canvas failure (tainted canvas, missing 2d ctx, etc.) falls back
    // to the safe placeholder.
    return buildPlaceholder(
      Math.min(canvas.width, maxWidth),
      Math.min(canvas.height, maxHeight),
      hasSignature
    );
  }
}
