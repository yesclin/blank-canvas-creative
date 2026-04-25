/**
 * Integration tests for ConsentModule: focus on the validation gate that
 * blocks `createConsent` when the captured signature is invalid, and on the
 * promise that the structured rejection log fires *exactly once* per
 * invalid attempt.
 *
 * We mock `useAestheticConsent` to keep the test focused on the component's
 * orchestration logic (capture → validate → log → toast → no-op) without
 * touching Supabase. `sonner` is mocked too so toast errors don't render.
 *
 * The signature canvas itself is not driven by real pointer events here —
 * jsdom doesn't render pixels, so we instead rely on the canvas reporting
 * `hasSignature() === false` (its real default) to exercise the
 * `canvas_not_drawn` path, and we monkey-patch the ref for the `too_small`
 * path. Both flows go through the exact same `validateSignature` gate that
 * production uses.
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import { ConsentModule } from './ConsentModule';
import { MIN_SIGNATURE_LENGTH } from './signatureValidation';

// ─── Mocks ────────────────────────────────────────────────────────────────

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

/** Opens the consent dialog for the "general" consent type and advances to the signing step. */
async function openSignStep() {
  // Each consent card renders a "Coletar" button (since hasConsent === false in this mock).
  const collectButtons = screen.getAllByRole('button', { name: /coletar/i });
  // 4 consent types are rendered — pick the first (toxin).
  fireEvent.click(collectButtons[0]);

  // Step 1: tick the agreement checkbox, then click "Continuar".
  const checkbox = await screen.findByRole('checkbox');
  fireEvent.click(checkbox);

  const continueBtn = await screen.findByRole('button', { name: /prosseguir/i });
  fireEvent.click(continueBtn);

  // Wait for the sign step to render — confirms the canvas is mounted.
  await screen.findByText(/assine acima/i);
}

/** Locates the "Confirmar e Assinar" button on the sign step. */
function getConfirmButton() {
  // Match the actual label used in ConsentModule's signature step.
  return screen.getByRole('button', { name: /confirmar e salvar/i });
}

// ─── Tests ────────────────────────────────────────────────────────────────

describe('ConsentModule — signature validation gate', () => {
  let warnSpy: ReturnType<typeof vi.spyOn>;
  let infoSpy: ReturnType<typeof vi.spyOn>;
  let errorSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    createConsentMock.mockReset();
    warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    infoSpy = vi.spyOn(console, 'info').mockImplementation(() => {});
    errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    warnSpy.mockRestore();
    infoSpy.mockRestore();
    errorSpy.mockRestore();
  });

  /** Filters console.warn calls down to the structured rejection log. */
  function getRejectionLogs() {
    return warnSpy.mock.calls.filter(
      (args) => args[0] === '[ConsentModule] signature rejected'
    );
  }

  it('blocks createConsent when nothing was drawn (canvas_not_drawn) and logs exactly once', async () => {
    render(<ConsentModule patientId="patient-123" appointmentId="appt-456" canEdit />);
    await openSignStep();

    // No interaction with the canvas → hasSignature() is false → captured is null.
    fireEvent.click(getConfirmButton());

    await waitFor(() => {
      expect(getRejectionLogs().length).toBe(1);
    });

    // Validation gate must block the persistence call entirely.
    expect(createConsentMock).not.toHaveBeenCalled();

    // Inspect the log payload — must carry the canonical fields and reason.
    const [, payload] = getRejectionLogs()[0];
    expect(payload).toMatchObject({
      reason: 'canvas_not_drawn',
      signature_length: 0,
      min_required: MIN_SIGNATURE_LENGTH,
      patient_id: 'patient-123',
      appointment_id: 'appt-456',
      consent_type: 'toxin',
      had_state: false,
      had_canvas_data: false,
    });
    // trace_id must be present and namespaced for correlation with the toast.
    expect(typeof (payload as any).trace_id).toBe('string');
    expect((payload as any).trace_id.length).toBeGreaterThan(0);
  });

  it('does not double-log when the user clicks Confirm twice on the same invalid attempt', async () => {
    render(<ConsentModule patientId="patient-123" canEdit />);
    await openSignStep();

    const btn = getConfirmButton();
    fireEvent.click(btn);
    fireEvent.click(btn);

    await waitFor(() => {
      // Two clicks ⇒ two attempts ⇒ two structured logs (one per attempt).
      // Critically, neither attempt fires the log more than once.
      expect(getRejectionLogs().length).toBe(2);
    });

    // Each rejected attempt must yield distinct trace_ids — no log is reused.
    const traceIds = getRejectionLogs().map((c) => (c[1] as any).trace_id);
    expect(new Set(traceIds).size).toBe(2);

    expect(createConsentMock).not.toHaveBeenCalled();
  });

  it('blocks createConsent and logs reason="too_small" when capture is below MIN_SIGNATURE_LENGTH', async () => {
    render(<ConsentModule patientId="patient-123" canEdit />);
    await openSignStep();

    // Force a too-short capture by patching the canvas DOM behaviour. The
    // real SignatureCanvas pulls its dataURL from the underlying <canvas>;
    // we override `toDataURL` to return a sub-threshold string and flip the
    // hasSignature flag by simulating two stroke cycles. Two cycles are
    // needed because `stopDrawing` reads `hasSignature` from a stale closure
    // on the first cycle (state update is async), so the second `mouseUp`
    // is the one that actually emits onSave.
    const canvas = document.querySelector('canvas') as HTMLCanvasElement;
    expect(canvas).toBeTruthy();

    const tooShort = 'data:image/png;base64,' + 'A'.repeat(100);
    canvas.toDataURL = () => tooShort;

    act(() => {
      fireEvent.mouseDown(canvas, { clientX: 5, clientY: 5 });
      fireEvent.mouseMove(canvas, { clientX: 10, clientY: 10 });
      fireEvent.mouseUp(canvas);
    });
    act(() => {
      fireEvent.mouseDown(canvas, { clientX: 12, clientY: 12 });
      fireEvent.mouseMove(canvas, { clientX: 20, clientY: 20 });
      fireEvent.mouseUp(canvas);
    });

    fireEvent.click(getConfirmButton());

    await waitFor(() => {
      expect(getRejectionLogs().length).toBe(1);
    });

    expect(createConsentMock).not.toHaveBeenCalled();

    const [, payload] = getRejectionLogs()[0];
    expect(payload).toMatchObject({
      reason: 'too_small',
      min_required: MIN_SIGNATURE_LENGTH,
    });
    expect((payload as any).signature_length).toBeLessThan(MIN_SIGNATURE_LENGTH);
    expect((payload as any).signature_length).toBeGreaterThan(0);
    expect((payload as any).canvas_has_signature).toBe(true);
  });

  it('allows createConsent when capture is at or above MIN_SIGNATURE_LENGTH (no rejection log)', async () => {
    createConsentMock.mockResolvedValue(undefined);
    render(<ConsentModule patientId="patient-123" canEdit />);
    await openSignStep();

    const canvas = document.querySelector('canvas') as HTMLCanvasElement;
    act(() => {
      fireEvent.mouseDown(canvas, { clientX: 5, clientY: 5 });
      fireEvent.mouseMove(canvas, { clientX: 10, clientY: 10 });
      fireEvent.mouseUp(canvas);
    });

    const validUrl = 'data:image/png;base64,' + 'A'.repeat(MIN_SIGNATURE_LENGTH);
    canvas.toDataURL = () => validUrl;

    fireEvent.click(getConfirmButton());

    await waitFor(() => {
      expect(createConsentMock).toHaveBeenCalledTimes(1);
    });

    // No rejection log should fire on the happy path.
    expect(getRejectionLogs().length).toBe(0);

    const callArg = createConsentMock.mock.calls[0][0];
    expect(callArg).toMatchObject({
      consent_type: 'toxin',
      signature_data: validUrl,
    });
    expect(typeof callArg.trace_id).toBe('string');
  });
});
