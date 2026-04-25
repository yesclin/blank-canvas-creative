/**
 * Pure helpers for validating a captured signature dataURL before persisting.
 *
 * Extracted from `ConsentModule` so the rules can be unit-tested in isolation
 * and reused by other signing surfaces. Keeps a single source of truth for the
 * minimum length threshold and the rejection reason taxonomy used in logs.
 */

/**
 * Minimum dataURL length (in characters) for a signature to be considered valid.
 * A blank canvas at typical sizes encodes to ~3-5KB; a real signature is
 * comfortably above 6KB.
 */
export const MIN_SIGNATURE_LENGTH = 6000;

/** All possible rejection reasons reported in structured logs. */
export type SignatureRejectionReason =
  | 'missing'
  | 'empty_data_url'
  | 'too_small'
  | 'canvas_not_drawn';

export interface SignatureValidationInput {
  /** dataURL captured (from state or fallback to canvas.toDataURL). */
  captured: string | null | undefined;
  /** Whether the canvas component reports it has any strokes. */
  canvasHasSignature: boolean;
}

export type SignatureValidationResult =
  | { ok: true; signature: string; length: number }
  | { ok: false; reason: SignatureRejectionReason; length: number };

/**
 * Validates a captured signature dataURL.
 * - `missing` is reserved for the case where no canvas was ever interacted with
 *   AND nothing was captured (legacy callers that don't pass canvas state).
 * - `canvas_not_drawn`: nothing captured and the canvas has no strokes.
 * - `empty_data_url`: capture happened but produced an empty string (broken canvas).
 * - `too_small`: capture produced a dataURL shorter than MIN_SIGNATURE_LENGTH.
 */
export function validateSignature(
  input: SignatureValidationInput
): SignatureValidationResult {
  const { captured, canvasHasSignature } = input;
  const length = captured?.length ?? 0;

  if (captured == null) {
    return {
      ok: false,
      reason: canvasHasSignature ? 'empty_data_url' : 'canvas_not_drawn',
      length: 0,
    };
  }

  if (length === 0) {
    return { ok: false, reason: 'empty_data_url', length: 0 };
  }

  if (length < MIN_SIGNATURE_LENGTH) {
    return { ok: false, reason: 'too_small', length };
  }

  return { ok: true, signature: captured, length };
}

/**
 * Convenience for the legacy `missing` reason kept for backwards-compatible
 * log shapes (when the caller cannot distinguish canvas state).
 */
export function legacyReason(captured: string | null | undefined): SignatureRejectionReason {
  if (captured == null) return 'missing';
  if (captured.length === 0) return 'empty_data_url';
  if (captured.length < MIN_SIGNATURE_LENGTH) return 'too_small';
  return 'missing'; // unreachable when valid; caller should not invoke in that case
}
