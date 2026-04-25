import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  validateSignature,
  legacyReason,
  MIN_SIGNATURE_LENGTH,
  type SignatureValidationInput,
} from './signatureValidation';

/**
 * Helper to fabricate a fake dataURL of an arbitrary length without spending
 * memory on a real PNG. The shape (`data:image/png;base64,…`) is preserved so
 * tests stay representative of the real input.
 */
function fakeDataUrl(length: number): string {
  const prefix = 'data:image/png;base64,';
  if (length <= prefix.length) return prefix.slice(0, length);
  return prefix + 'A'.repeat(length - prefix.length);
}

describe('validateSignature', () => {
  describe('rejection — no capture at all', () => {
    it('returns { ok:false, reason:"canvas_not_drawn" } when captured is null and canvas has no strokes', () => {
      const result = validateSignature({ captured: null, canvasHasSignature: false });
      expect(result.ok).toBe(false);
      if (result.ok === false) {
        expect(result.reason).toBe('canvas_not_drawn');
        expect(result.length).toBe(0);
      }
    });

    it('returns { ok:false, reason:"canvas_not_drawn" } when captured is undefined and canvas has no strokes', () => {
      const result = validateSignature({
        captured: undefined,
        canvasHasSignature: false,
      });
      expect(result.ok).toBe(false);
      if (result.ok === false) {
        expect(result.reason).toBe('canvas_not_drawn');
      }
    });

    it('returns { ok:false, reason:"empty_data_url" } when captured is null but canvas reports strokes (broken toDataURL)', () => {
      const result = validateSignature({ captured: null, canvasHasSignature: true });
      expect(result.ok).toBe(false);
      if (result.ok === false) {
        expect(result.reason).toBe('empty_data_url');
        expect(result.length).toBe(0);
      }
    });
  });

  describe('rejection — empty string', () => {
    it('returns { ok:false, reason:"empty_data_url" } regardless of canvas state', () => {
      const a = validateSignature({ captured: '', canvasHasSignature: true });
      const b = validateSignature({ captured: '', canvasHasSignature: false });
      expect(a.ok).toBe(false);
      expect(b.ok).toBe(false);
      if (a.ok === false) expect(a.reason).toBe('empty_data_url');
      if (b.ok === false) expect(b.reason).toBe('empty_data_url');
    });
  });

  describe('rejection — too small', () => {
    it('returns { ok:false, reason:"too_small" } when length is just below the threshold', () => {
      const result = validateSignature({
        captured: fakeDataUrl(MIN_SIGNATURE_LENGTH - 1),
        canvasHasSignature: true,
      });
      expect(result.ok).toBe(false);
      if (result.ok === false) {
        expect(result.reason).toBe('too_small');
        expect(result.length).toBe(MIN_SIGNATURE_LENGTH - 1);
      }
    });

    it('returns { ok:false, reason:"too_small" } for a typical blank-canvas dataURL (~3KB)', () => {
      const result = validateSignature({
        captured: fakeDataUrl(3000),
        canvasHasSignature: true,
      });
      expect(result.ok).toBe(false);
      if (result.ok === false) {
        expect(result.reason).toBe('too_small');
        expect(result.length).toBe(3000);
      }
    });
  });

  describe('acceptance', () => {
    it('returns { ok:true } exactly at the threshold', () => {
      const captured = fakeDataUrl(MIN_SIGNATURE_LENGTH);
      const result = validateSignature({ captured, canvasHasSignature: true });
      expect(result.ok).toBe(true);
      if (result.ok === true) {
        expect(result.signature).toBe(captured);
        expect(result.length).toBe(MIN_SIGNATURE_LENGTH);
      }
    });

    it('returns { ok:true } for a comfortably-sized real-world signature (~10KB)', () => {
      const captured = fakeDataUrl(10_000);
      const result = validateSignature({ captured, canvasHasSignature: true });
      expect(result.ok).toBe(true);
      if (result.ok === true) {
        expect(result.signature).toBe(captured);
        expect(result.length).toBe(10_000);
      }
    });

    it('does not require canvasHasSignature=true when captured comes from state', () => {
      // Real scenario: signature was captured into React state earlier and the
      // canvas was cleared/reset; `canvasHasSignature` may legitimately be false.
      const captured = fakeDataUrl(8_000);
      const result = validateSignature({ captured, canvasHasSignature: false });
      expect(result.ok).toBe(true);
    });
  });

  describe('rejection reason taxonomy is exhaustive', () => {
    const cases: Array<[SignatureValidationInput, string]> = [
      [{ captured: null, canvasHasSignature: false }, 'canvas_not_drawn'],
      [{ captured: null, canvasHasSignature: true }, 'empty_data_url'],
      [{ captured: '', canvasHasSignature: true }, 'empty_data_url'],
      [{ captured: fakeDataUrl(100), canvasHasSignature: true }, 'too_small'],
    ];

    it.each(cases)('input %j yields reason %s', (input, expectedReason) => {
      const result = validateSignature(input);
      expect(result.ok).toBe(false);
      if (result.ok === false) {
        expect(result.reason).toBe(expectedReason);
      }
    });
  });
});

describe('legacyReason', () => {
  it('returns "missing" when captured is null/undefined', () => {
    expect(legacyReason(null)).toBe('missing');
    expect(legacyReason(undefined)).toBe('missing');
  });

  it('returns "empty_data_url" for empty string', () => {
    expect(legacyReason('')).toBe('empty_data_url');
  });

  it('returns "too_small" when below threshold', () => {
    expect(legacyReason(fakeDataUrl(MIN_SIGNATURE_LENGTH - 1))).toBe('too_small');
  });
});

/**
 * Integration-shaped check: simulate the exact log payload the ConsentModule
 * emits on rejection, ensuring the reason and signature_length wired through
 * the validator match what we'd see in Sentry/console for each scenario.
 */
describe('rejection log shape (integration-style)', () => {
  let warnSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
  });
  afterEach(() => {
    warnSpy.mockRestore();
  });

  function emitRejectionLog(input: SignatureValidationInput) {
    const result = validateSignature(input);
    if (result.ok === false) {
      console.warn('[ConsentModule] signature rejected', {
        trace_id: 'consent_test_abcd1234',
        reason: result.reason,
        signature_length: result.length,
        min_required: MIN_SIGNATURE_LENGTH,
      });
    }
    return result;
  }

  it('logs reason="canvas_not_drawn" and blocks save when nothing was captured', () => {
    const result = emitRejectionLog({ captured: null, canvasHasSignature: false });
    expect(result.ok).toBe(false);
    expect(warnSpy).toHaveBeenCalledTimes(1);
    expect(warnSpy).toHaveBeenCalledWith(
      '[ConsentModule] signature rejected',
      expect.objectContaining({
        reason: 'canvas_not_drawn',
        signature_length: 0,
        min_required: MIN_SIGNATURE_LENGTH,
      })
    );
  });

  it('logs reason="too_small" with the actual length and blocks save', () => {
    const result = emitRejectionLog({
      captured: fakeDataUrl(2_500),
      canvasHasSignature: true,
    });
    expect(result.ok).toBe(false);
    expect(warnSpy).toHaveBeenCalledWith(
      '[ConsentModule] signature rejected',
      expect.objectContaining({
        reason: 'too_small',
        signature_length: 2_500,
        min_required: MIN_SIGNATURE_LENGTH,
      })
    );
  });

  it('does NOT log when the signature is valid', () => {
    const result = emitRejectionLog({
      captured: fakeDataUrl(7_500),
      canvasHasSignature: true,
    });
    expect(result.ok).toBe(true);
    expect(warnSpy).not.toHaveBeenCalled();
  });
});
