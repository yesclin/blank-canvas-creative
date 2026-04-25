/**
 * Integration tests for ConsentModule: focus on the validation gate that
 * blocks `createConsent` when the captured signature is invalid, and on the
 * promise that the structured rejection log fires *exactly once* per
 * invalid attempt.
 *
 * We mock:
 *   - `useAestheticConsent` so we don't touch Supabase.
 *   - `sonner` so toasts don't noise the console.
 *   - `SignatureCanvas` with a controllable test double. jsdom doesn't render
 *     pixels and SignatureCanvas's `hasSignature` flag depends on async React
 *     state set during real pointer events — neither of which is reliable in
 *     jsdom. The double exposes deterministic seams that mirror the real
 *     SignatureCanvasHandle contract used by ConsentModule.
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { forwardRef, useImperativeHandle } from 'react';
import { toast } from 'sonner';
import { ConsentModule } from './ConsentModule';
import { MIN_SIGNATURE_LENGTH, legacyReason } from './signatureValidation';

// ─── Test double for SignatureCanvas ──────────────────────────────────────
//
// State lives at module scope so each test can configure what the next render
// of SignatureCanvas should report. This mirrors the exact surface of the
// real component that ConsentModule consumes (onSave prop + the imperative
// handle methods getSignature / hasSignature / getDebugThumbnail).

const canvasState: {
  signature: string | null;
  hasSig: boolean;
  /** When set, calling getSignature on the handle invokes onSave with this value. */
  emitOnGet: boolean;
} = {
  signature: null,
  hasSig: false,
  emitOnGet: false,
};

function resetCanvasState() {
  canvasState.signature = null;
  canvasState.hasSig = false;
  canvasState.emitOnGet = false;
}

vi.mock('./SignatureCanvas', () => {
  const SignatureCanvas = forwardRef<any, any>((props, ref) => {
    useImperativeHandle(
      ref,
      () => ({
        getSignature: () => {
          if (canvasState.emitOnGet && canvasState.signature) {
            // Mirror real behaviour where getSignature returns the dataURL
            // computed from the canvas at call time — independent from state.
          }
          return canvasState.signature;
        },
        hasSignature: () => canvasState.hasSig,
        clear: () => {
          canvasState.signature = null;
          canvasState.hasSig = false;
        },
        getDebugThumbnail: () => ({
          dataUrl: 'data:image/svg+xml;utf8,<svg/>',
          length: 26,
          mode: 'placeholder',
          width: 80,
          height: 30,
        }),
      }),
      []
    );
    // Expose a hook so tests can push a value through onSave just like the
    // real canvas does on stopDrawing — this populates ConsentModule's
    // signatureData state and exercises the `state` capture path.
    return (
      <div data-testid="signature-canvas-mock">
        <button
          type="button"
          data-testid="emit-onsave"
          onClick={() => props.onSave(canvasState.signature)}
        >
          emit
        </button>
      </div>
    );
  });
  SignatureCanvas.displayName = 'SignatureCanvas';
  return { SignatureCanvas };
});

// ─── Mocks for hook + toast ───────────────────────────────────────────────

const createConsentMock = vi.fn();

vi.mock('@/hooks/aesthetics', async () => {
  const actual = await vi.importActual<typeof import('@/hooks/aesthetics')>(
    '@/hooks/aesthetics'
  );
  return {
    ...actual,
    useAestheticConsent: () => ({
      consents: [],
      procedures: [],
      isLoading: false,
      hasConsentForType: () => false,
      getLatestConsentForType: () => null,
      getVersionHistory: () => [],
      createConsent: createConsentMock,
      isCreating: false,
      templates: actual.DEFAULT_CONSENT_TEMPLATES,
    }),
  };
});

vi.mock('sonner', () => ({
  toast: {
    error: vi.fn(),
    success: vi.fn(),
    info: vi.fn(),
  },
}));

// ─── Helpers ──────────────────────────────────────────────────────────────

/** Opens the consent dialog for the first consent card and advances to the signing step. */
async function openSignStep() {
  const collectButtons = screen.getAllByRole('button', { name: /coletar/i });
  fireEvent.click(collectButtons[0]); // first card → "toxin"

  const checkbox = await screen.findByRole('checkbox');
  fireEvent.click(checkbox);

  const continueBtn = await screen.findByRole('button', { name: /prosseguir/i });
  fireEvent.click(continueBtn);

  await screen.findByTestId('signature-canvas-mock');
}

function getConfirmButton() {
  return screen.getByRole('button', { name: /confirmar e salvar/i });
}

/** Pushes `dataUrl` through the SignatureCanvas onSave prop into ConsentModule state. */
function emitOnSave(dataUrl: string | null, hasSig = dataUrl !== null) {
  canvasState.signature = dataUrl;
  canvasState.hasSig = hasSig;
  fireEvent.click(screen.getByTestId('emit-onsave'));
}

// ─── Tests ────────────────────────────────────────────────────────────────

describe('ConsentModule — signature validation gate', () => {
  let warnSpy: ReturnType<typeof vi.spyOn>;
  let infoSpy: ReturnType<typeof vi.spyOn>;
  let errorSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    createConsentMock.mockReset();
    resetCanvasState();
    warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    infoSpy = vi.spyOn(console, 'info').mockImplementation(() => {});
    errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    warnSpy.mockRestore();
    infoSpy.mockRestore();
    errorSpy.mockRestore();
  });

  /** All structured rejection logs emitted so far. */
  function getRejectionLogs() {
    return warnSpy.mock.calls.filter(
      (args) => args[0] === '[ConsentModule] signature rejected'
    );
  }

  it('blocks createConsent when nothing was drawn (canvas_not_drawn) and logs exactly once', async () => {
    render(<ConsentModule patientId="patient-123" appointmentId="appt-456" canEdit />);
    await openSignStep();

    // No state, no canvas signature → captured null, hasSig false.
    fireEvent.click(getConfirmButton());

    await waitFor(() => {
      expect(getRejectionLogs().length).toBe(1);
    });

    expect(createConsentMock).not.toHaveBeenCalled();

    const [, payload] = getRejectionLogs()[0] as [string, Record<string, unknown>];
    expect(payload).toMatchObject({
      reason: 'canvas_not_drawn',
      signature_length: 0,
      min_required: MIN_SIGNATURE_LENGTH,
      patient_id: 'patient-123',
      appointment_id: 'appt-456',
      consent_type: 'toxin',
      had_state: false,
      had_canvas_data: false,
      signature_source: 'none',
    });
    expect(typeof payload.trace_id).toBe('string');
    expect(String(payload.trace_id).length).toBeGreaterThan(0);
  });

  it('does not double-log on a single click; produces distinct trace_ids on separate clicks', async () => {
    render(<ConsentModule patientId="patient-123" canEdit />);
    await openSignStep();

    fireEvent.click(getConfirmButton());
    await waitFor(() => expect(getRejectionLogs().length).toBe(1));

    fireEvent.click(getConfirmButton());
    await waitFor(() => expect(getRejectionLogs().length).toBe(2));

    // Each rejected attempt must yield a distinct trace_id — no log is reused.
    const traceIds = getRejectionLogs().map(
      (c) => (c[1] as Record<string, unknown>).trace_id
    );
    expect(new Set(traceIds).size).toBe(2);
    expect(createConsentMock).not.toHaveBeenCalled();
  });

  it('blocks createConsent with reason="too_small" when capture is below MIN_SIGNATURE_LENGTH', async () => {
    render(<ConsentModule patientId="patient-123" canEdit />);
    await openSignStep();

    // Push a too-short capture through onSave (the `state` path).
    const tooShort = 'data:image/png;base64,' + 'A'.repeat(100);
    emitOnSave(tooShort);

    fireEvent.click(getConfirmButton());

    await waitFor(() => expect(getRejectionLogs().length).toBe(1));
    expect(createConsentMock).not.toHaveBeenCalled();

    const [, payload] = getRejectionLogs()[0] as [string, Record<string, unknown>];
    expect(payload).toMatchObject({
      reason: 'too_small',
      min_required: MIN_SIGNATURE_LENGTH,
      signature_source: 'state',
      had_state: true,
      canvas_has_signature: true,
    });
    expect(payload.signature_length).toBe(tooShort.length);
    expect(Number(payload.signature_length)).toBeLessThan(MIN_SIGNATURE_LENGTH);
  });

  it('allows createConsent when capture is at or above MIN_SIGNATURE_LENGTH (no rejection log)', async () => {
    createConsentMock.mockResolvedValue(undefined);
    render(<ConsentModule patientId="patient-123" canEdit />);
    await openSignStep();

    const validUrl = 'data:image/png;base64,' + 'A'.repeat(MIN_SIGNATURE_LENGTH);
    emitOnSave(validUrl);

    fireEvent.click(getConfirmButton());

    await waitFor(() => {
      expect(createConsentMock).toHaveBeenCalledTimes(1);
    });

    expect(getRejectionLogs().length).toBe(0);

    const callArg = createConsentMock.mock.calls[0][0];
    expect(callArg).toMatchObject({
      consent_type: 'toxin',
      signature_data: validUrl,
    });
    expect(typeof callArg.trace_id).toBe('string');
  });

  it('uses canvas_fallback when state is empty but the canvas ref returns a valid value', async () => {
    createConsentMock.mockResolvedValue(undefined);
    render(<ConsentModule patientId="patient-123" canEdit />);
    await openSignStep();

    // No emit → state stays null. Configure the canvas handle to return a value.
    const validUrl = 'data:image/png;base64,' + 'A'.repeat(MIN_SIGNATURE_LENGTH);
    canvasState.signature = validUrl;
    canvasState.hasSig = true;

    fireEvent.click(getConfirmButton());

    await waitFor(() => {
      expect(createConsentMock).toHaveBeenCalledTimes(1);
    });
    expect(getRejectionLogs().length).toBe(0);

    // The info log shape is also worth pinning for observability — it's the
    // attempt log that downstream tools key off of.
    const attemptLogs = infoSpy.mock.calls.filter(
      (a) => a[0] === '[ConsentModule] handleCreateConsent'
    );
    expect(attemptLogs.length).toBe(1);
    expect(attemptLogs[0][1]).toMatchObject({
      signature_source: 'canvas_fallback',
      signature_length: validUrl.length,
    });
  });
});
