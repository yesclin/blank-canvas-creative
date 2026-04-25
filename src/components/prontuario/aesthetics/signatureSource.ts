/**
 * Pure helper that classifies WHICH path produced the captured signature
 * dataURL, for the structured `signature_source` log field.
 *
 * Mirrors the resolution rule used in ConsentModule and other signing
 * surfaces: prefer the React state value (kept fresh by the canvas `onSave`
 * callback) and fall back to a synchronous read from the canvas ref. The
 * source label is what we emit to logs/observability so the field MUST stay
 * in sync with the actual `captured` value chosen.
 */
export type SignatureSource = 'state' | 'canvas_fallback' | 'none';

export interface SignatureSourceInput {
  /** Value from React state (refreshed on each stroke via SignatureCanvas onSave). */
  fromState: string | null | undefined;
  /** Value read synchronously from the canvas ref as a fallback. */
  fromCanvas: string | null | undefined;
}

export interface SignatureSourceResult {
  /** Final dataURL chosen — null when neither path produced a value. */
  captured: string | null;
  /** Label that MUST be emitted to `signature_source` in logs. */
  source: SignatureSource;
}

/**
 * Resolves the captured signature and the matching `signature_source` label.
 * - `state`: state had a value (used regardless of canvas fallback).
 * - `canvas_fallback`: state was empty but the canvas ref produced a value.
 * - `none`: neither path produced a value.
 *
 * Empty strings are treated as "no value" so a stale empty string in state
 * doesn't mask a real canvas capture.
 */
export function resolveSignatureSource(input: SignatureSourceInput): SignatureSourceResult {
  const stateValue = input.fromState && input.fromState.length > 0 ? input.fromState : null;
  const canvasValue = input.fromCanvas && input.fromCanvas.length > 0 ? input.fromCanvas : null;

  if (stateValue !== null) {
    return { captured: stateValue, source: 'state' };
  }
  if (canvasValue !== null) {
    return { captured: canvasValue, source: 'canvas_fallback' };
  }
  return { captured: null, source: 'none' };
}
