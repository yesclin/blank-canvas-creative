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

/**
 * Edge cases for the `signature_length` rule:
 *  - Very large dataURLs (multi-MB) must still be accepted; the validator has
 *    no upper bound and `length` reported in logs must match `captured.length`
 *    exactly (no truncation, no summarisation).
 *  - Whitespace-only / partially-whitespace strings are NOT trimmed by the
 *    validator — `length` is the raw `.length` of the string, mirroring how
 *    the rejection log will read in production. This pins down that we
 *    classify by raw string size, not by visual content.
 *  - Multibyte / unicode payloads count by JS string length (UTF-16 code
 *    units), which is also what gets serialised into the log payload.
 */
describe('signature_length edge cases', () => {
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
        trace_id: 'consent_test_edge',
        reason: result.reason,
        signature_length: result.length,
        min_required: MIN_SIGNATURE_LENGTH,
      });
    }
    return result;
  }

  describe('very large dataURLs', () => {
    it('accepts a ~1MB dataURL and reports the exact length', () => {
      const big = fakeDataUrl(1_000_000);
      const result = validateSignature({ captured: big, canvasHasSignature: true });
      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.length).toBe(big.length);
        expect(result.length).toBe(1_000_000);
        expect(result.signature).toBe(big);
      }
    });

    it('accepts a ~10MB dataURL without truncating signature or length', () => {
      const huge = fakeDataUrl(10_000_000);
      const result = validateSignature({ captured: huge, canvasHasSignature: true });
      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.length).toBe(10_000_000);
        // Signature is returned by reference — no copy/truncation.
        expect(result.signature).toBe(huge);
        expect(result.signature.length).toBe(huge.length);
      }
    });

    it('logs no rejection for an oversized but valid dataURL', () => {
      const big = fakeDataUrl(2_000_000);
      const result = emitRejectionLog({ captured: big, canvasHasSignature: true });
      expect(result.ok).toBe(true);
      expect(warnSpy).not.toHaveBeenCalled();
    });

    it('exactly MIN_SIGNATURE_LENGTH chars is accepted (boundary)', () => {
      const boundary = fakeDataUrl(MIN_SIGNATURE_LENGTH);
      const result = validateSignature({ captured: boundary, canvasHasSignature: true });
      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.length).toBe(MIN_SIGNATURE_LENGTH);
      }
    });

    it('exactly MIN_SIGNATURE_LENGTH - 1 chars is rejected as too_small', () => {
      const justBelow = fakeDataUrl(MIN_SIGNATURE_LENGTH - 1);
      const result = emitRejectionLog({ captured: justBelow, canvasHasSignature: true });
      expect(result.ok).toBe(false);
      if (result.ok === false) {
        expect(result.reason).toBe('too_small');
        expect(result.length).toBe(MIN_SIGNATURE_LENGTH - 1);
      }
      expect(warnSpy).toHaveBeenCalledWith(
        '[ConsentModule] signature rejected',
        expect.objectContaining({
          reason: 'too_small',
          signature_length: MIN_SIGNATURE_LENGTH - 1,
          min_required: MIN_SIGNATURE_LENGTH,
        })
      );
    });
  });

  describe('whitespace and weird strings', () => {
    it('rejects whitespace-only string of 100 chars as too_small (raw length, no trim)', () => {
      const spaces = ' '.repeat(100);
      const result = emitRejectionLog({ captured: spaces, canvasHasSignature: true });
      expect(result.ok).toBe(false);
      if (result.ok === false) {
        expect(result.reason).toBe('too_small');
        // Critical: length is the RAW string length, not after trim().
        expect(result.length).toBe(100);
      }
    });

    it('accepts a whitespace-only string at the boundary length (length rule is purely numeric)', () => {
      // Documents the current contract: validateSignature has no semantic
      // check on dataURL shape. If a future iteration adds shape validation,
      // this test will fail and force an intentional update.
      const longSpaces = ' '.repeat(MIN_SIGNATURE_LENGTH);
      const result = validateSignature({ captured: longSpaces, canvasHasSignature: true });
      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.length).toBe(MIN_SIGNATURE_LENGTH);
      }
    });

    it('counts leading/trailing whitespace toward signature_length', () => {
      const padded = '   ' + fakeDataUrl(MIN_SIGNATURE_LENGTH - 6) + '   ';
      // Total length: 3 + (MIN_SIGNATURE_LENGTH - 6) + 3 = MIN_SIGNATURE_LENGTH.
      const result = validateSignature({ captured: padded, canvasHasSignature: true });
      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.length).toBe(MIN_SIGNATURE_LENGTH);
        expect(result.length).toBe(padded.length);
      }
    });

    it('rejects newline-padded short string as too_small with raw length in log', () => {
      const captured = '\n\n\n' + fakeDataUrl(50) + '\n\n\n';
      const result = emitRejectionLog({ captured, canvasHasSignature: true });
      expect(result.ok).toBe(false);
      if (result.ok === false) {
        expect(result.reason).toBe('too_small');
        expect(result.length).toBe(captured.length);
      }
      expect(warnSpy).toHaveBeenCalledWith(
        '[ConsentModule] signature rejected',
        expect.objectContaining({
          reason: 'too_small',
          signature_length: captured.length,
        })
      );
    });
  });

  describe('multibyte / unicode payloads', () => {
    it('counts unicode chars by JS string length (UTF-16 code units)', () => {
      // Each 😀 emoji is 2 UTF-16 code units in JS string length.
      const emojiCount = MIN_SIGNATURE_LENGTH; // → 2 * MIN_SIGNATURE_LENGTH code units
      const captured = '😀'.repeat(emojiCount);
      expect(captured.length).toBe(2 * MIN_SIGNATURE_LENGTH);

      const result = validateSignature({ captured, canvasHasSignature: true });
      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.length).toBe(captured.length);
      }
    });

    it('rejects a small unicode payload as too_small using string length', () => {
      const captured = '✏️'.repeat(10); // tiny string regardless of unicode width
      const result = emitRejectionLog({ captured, canvasHasSignature: true });
      expect(result.ok).toBe(false);
      if (result.ok === false) {
        expect(result.reason).toBe('too_small');
        expect(result.length).toBe(captured.length);
      }
    });
  });

  describe('log/length consistency invariant', () => {
    // Property-style sanity: across a spread of sizes and whitespace mixes,
    // the `signature_length` field in the log payload MUST equal the
    // captured.length, and the reason MUST be derivable from that length.
    const sizes = [
      0,
      1,
      100,
      MIN_SIGNATURE_LENGTH - 1,
      MIN_SIGNATURE_LENGTH,
      MIN_SIGNATURE_LENGTH + 1,
      50_000,
      500_000,
    ];

    for (const size of sizes) {
      it(`size=${size}: log signature_length === captured.length and reason matches threshold`, () => {
        const captured = size === 0 ? '' : fakeDataUrl(size);
        const result = emitRejectionLog({ captured, canvasHasSignature: true });

        if (size >= MIN_SIGNATURE_LENGTH) {
          expect(result.ok).toBe(true);
          expect(warnSpy).not.toHaveBeenCalled();
        } else {
          expect(result.ok).toBe(false);
          if (result.ok === false) {
            expect(result.length).toBe(captured.length);
            expect(result.reason).toBe(size === 0 ? 'empty_data_url' : 'too_small');
          }
          expect(warnSpy).toHaveBeenCalledTimes(1);
          const [, payload] = warnSpy.mock.calls[0] as [string, Record<string, unknown>];
          expect(payload.signature_length).toBe(captured.length);
          expect(payload.min_required).toBe(MIN_SIGNATURE_LENGTH);
        }
      });
    }
  });
});
