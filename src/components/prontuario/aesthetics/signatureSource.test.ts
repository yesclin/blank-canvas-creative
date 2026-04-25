import { describe, it, expect } from 'vitest';
import { resolveSignatureSource } from './signatureSource';

/** Builds a representative-shaped dataURL string of arbitrary length. */
function fakeDataUrl(length: number): string {
  const prefix = 'data:image/png;base64,';
  if (length <= prefix.length) return prefix.slice(0, length);
  return prefix + 'A'.repeat(length - prefix.length);
}

describe('resolveSignatureSource', () => {
  describe('source = "state"', () => {
    it('picks state when only state has a value', () => {
      const url = fakeDataUrl(8000);
      const r = resolveSignatureSource({ fromState: url, fromCanvas: null });
      expect(r.source).toBe('state');
      expect(r.captured).toBe(url);
    });

    it('prefers state over canvas when both are present', () => {
      const stateUrl = fakeDataUrl(8000);
      const canvasUrl = fakeDataUrl(7500);
      const r = resolveSignatureSource({ fromState: stateUrl, fromCanvas: canvasUrl });
      expect(r.source).toBe('state');
      expect(r.captured).toBe(stateUrl);
      // Sanity: must NOT silently swap to canvas.
      expect(r.captured).not.toBe(canvasUrl);
    });

    it('keeps state path even when state value is shorter than canvas', () => {
      // Source classification is independent from validation/length thresholds.
      const stateUrl = fakeDataUrl(100);
      const canvasUrl = fakeDataUrl(9000);
      const r = resolveSignatureSource({ fromState: stateUrl, fromCanvas: canvasUrl });
      expect(r.source).toBe('state');
      expect(r.captured).toBe(stateUrl);
    });
  });

  describe('source = "canvas_fallback"', () => {
    it('falls back to canvas when state is null', () => {
      const url = fakeDataUrl(8000);
      const r = resolveSignatureSource({ fromState: null, fromCanvas: url });
      expect(r.source).toBe('canvas_fallback');
      expect(r.captured).toBe(url);
    });

    it('falls back to canvas when state is undefined', () => {
      const url = fakeDataUrl(8000);
      const r = resolveSignatureSource({ fromState: undefined, fromCanvas: url });
      expect(r.source).toBe('canvas_fallback');
      expect(r.captured).toBe(url);
    });

    it('falls back to canvas when state is an empty string (treated as no value)', () => {
      const url = fakeDataUrl(8000);
      const r = resolveSignatureSource({ fromState: '', fromCanvas: url });
      expect(r.source).toBe('canvas_fallback');
      expect(r.captured).toBe(url);
    });
  });

  describe('source = "none"', () => {
    it('returns none when both values are null', () => {
      const r = resolveSignatureSource({ fromState: null, fromCanvas: null });
      expect(r.source).toBe('none');
      expect(r.captured).toBeNull();
    });

    it('returns none when both values are undefined', () => {
      const r = resolveSignatureSource({ fromState: undefined, fromCanvas: undefined });
      expect(r.source).toBe('none');
      expect(r.captured).toBeNull();
    });

    it('returns none when both values are empty strings', () => {
      const r = resolveSignatureSource({ fromState: '', fromCanvas: '' });
      expect(r.source).toBe('none');
      expect(r.captured).toBeNull();
    });

    it('returns none when state is empty string and canvas is null', () => {
      const r = resolveSignatureSource({ fromState: '', fromCanvas: null });
      expect(r.source).toBe('none');
      expect(r.captured).toBeNull();
    });
  });

  describe('captured matches the chosen source', () => {
    // Property-style sanity check: whatever source label is emitted, the
    // captured value MUST originate from that exact path. This is the core
    // invariant the log field relies on.
    const cases: Array<{
      name: string;
      input: { fromState: string | null; fromCanvas: string | null };
      expectedSource: 'state' | 'canvas_fallback' | 'none';
    }> = [
      {
        name: 'state populated, canvas populated',
        input: { fromState: fakeDataUrl(7000), fromCanvas: fakeDataUrl(8000) },
        expectedSource: 'state',
      },
      {
        name: 'state populated, canvas empty',
        input: { fromState: fakeDataUrl(7000), fromCanvas: null },
        expectedSource: 'state',
      },
      {
        name: 'state empty, canvas populated',
        input: { fromState: null, fromCanvas: fakeDataUrl(8000) },
        expectedSource: 'canvas_fallback',
      },
      {
        name: 'both empty',
        input: { fromState: null, fromCanvas: null },
        expectedSource: 'none',
      },
    ];

    for (const c of cases) {
      it(`(${c.name}) signature_source label matches captured origin`, () => {
        const r = resolveSignatureSource(c.input);
        expect(r.source).toBe(c.expectedSource);
        if (c.expectedSource === 'state') {
          expect(r.captured).toBe(c.input.fromState);
        } else if (c.expectedSource === 'canvas_fallback') {
          expect(r.captured).toBe(c.input.fromCanvas);
        } else {
          expect(r.captured).toBeNull();
        }
      });
    }
  });

  describe('log payload shape (contract with ConsentModule logs)', () => {
    // These tests pin down the exact field used by the structured log so a
    // future refactor can't silently rename it or change its values.
    it('"state" is emitted verbatim for log field signature_source', () => {
      const r = resolveSignatureSource({ fromState: fakeDataUrl(8000), fromCanvas: null });
      const logPayload = { signature_source: r.source };
      expect(logPayload).toEqual({ signature_source: 'state' });
    });

    it('"canvas_fallback" is emitted verbatim for log field signature_source', () => {
      const r = resolveSignatureSource({ fromState: null, fromCanvas: fakeDataUrl(8000) });
      const logPayload = { signature_source: r.source };
      expect(logPayload).toEqual({ signature_source: 'canvas_fallback' });
    });

    it('"none" is emitted verbatim for log field signature_source', () => {
      const r = resolveSignatureSource({ fromState: null, fromCanvas: null });
      const logPayload = { signature_source: r.source };
      expect(logPayload).toEqual({ signature_source: 'none' });
    });
  });
});
