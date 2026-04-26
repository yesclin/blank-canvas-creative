/**
 * Tests for the signature-context validation helpers exported by
 * `useUnifiedDocumentSigning`.
 *
 * These helpers gate the heavy `UnifiedSignatureWizard` modal: if any of
 * `document_id`, `clinic_id` or `patient_id` are missing we must NOT open the
 * wizard and we must surface an actionable error indicating WHERE each
 * missing field should have come from (documento / atendimento / metadados).
 *
 * Coverage goals:
 *  - getMissingSignatureContextFields detects each missing field individually
 *    and in combinations (including null/undefined inputs).
 *  - getSignatureContextFieldInfo returns the correct origin metadata.
 *  - getMissingSignatureContextFieldDetails composes the two above.
 *  - assertSignatureContextReady:
 *      • returns true when context is complete (no toast).
 *      • returns false when incomplete, fires a toast.error with a
 *        description that includes EVERY missing field's label and origin.
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { toast } from "sonner";
import {
  getMissingSignatureContextFields,
  getMissingSignatureContextFieldDetails,
  getSignatureContextFieldInfo,
  assertSignatureContextReady,
  type SignableDocumentContext,
} from "@/hooks/useUnifiedDocumentSigning";

vi.mock("sonner", () => ({
  toast: {
    error: vi.fn(),
    success: vi.fn(),
    info: vi.fn(),
    warning: vi.fn(),
  },
}));

const fullContext: SignableDocumentContext = {
  document_type: "consolidated_document",
  document_id: "doc-1",
  patient_id: "pat-1",
  clinic_id: "clin-1",
  snapshot: { foo: "bar" },
};

beforeEach(() => {
  vi.clearAllMocks();
});

describe("getMissingSignatureContextFields", () => {
  it("returns empty array when all required fields are present", () => {
    expect(getMissingSignatureContextFields(fullContext)).toEqual([]);
  });

  it("returns all three fields when context is null", () => {
    expect(getMissingSignatureContextFields(null)).toEqual([
      "document_id",
      "clinic_id",
      "patient_id",
    ]);
  });

  it("returns all three fields when context is undefined", () => {
    expect(getMissingSignatureContextFields(undefined)).toEqual([
      "document_id",
      "clinic_id",
      "patient_id",
    ]);
  });

  it("returns all three fields when context is an empty object", () => {
    expect(getMissingSignatureContextFields({})).toEqual([
      "document_id",
      "clinic_id",
      "patient_id",
    ]);
  });

  it("flags only document_id when document_id is missing", () => {
    const ctx = { ...fullContext, document_id: "" };
    expect(getMissingSignatureContextFields(ctx)).toEqual(["document_id"]);
  });

  it("flags only clinic_id when clinic.id is missing (clinic_id empty string)", () => {
    const ctx = { ...fullContext, clinic_id: "" };
    expect(getMissingSignatureContextFields(ctx)).toEqual(["clinic_id"]);
  });

  it("flags only patient_id when patient_id is missing", () => {
    const ctx = { ...fullContext, patient_id: "" };
    expect(getMissingSignatureContextFields(ctx)).toEqual(["patient_id"]);
  });

  it("flags multiple missing fields preserving canonical order (document, clinic, patient)", () => {
    const ctx = {
      document_type: "evolution",
      snapshot: null,
    } as Partial<SignableDocumentContext>;
    expect(getMissingSignatureContextFields(ctx)).toEqual([
      "document_id",
      "clinic_id",
      "patient_id",
    ]);
  });

  it("treats explicit undefined values the same as missing keys", () => {
    const ctx: Partial<SignableDocumentContext> = {
      document_id: undefined,
      clinic_id: "clin-1",
      patient_id: undefined,
    };
    expect(getMissingSignatureContextFields(ctx)).toEqual([
      "document_id",
      "patient_id",
    ]);
  });
});

describe("getSignatureContextFieldInfo", () => {
  it("returns 'documento' as origin for document_id", () => {
    const info = getSignatureContextFieldInfo("document_id");
    expect(info.field).toBe("document_id");
    expect(info.label).toBe("Documento");
    expect(info.source).toBe("documento");
    expect(info.hint).toMatch(/clinical_attendance_documents/);
  });

  it("returns 'atendimento' as origin for patient_id", () => {
    const info = getSignatureContextFieldInfo("patient_id");
    expect(info.field).toBe("patient_id");
    expect(info.label).toBe("Paciente");
    expect(info.source).toBe("atendimento");
    expect(info.hint).toMatch(/appointments\.patient_id/);
  });

  it("returns 'metadados' as origin for clinic_id", () => {
    const info = getSignatureContextFieldInfo("clinic_id");
    expect(info.field).toBe("clinic_id");
    expect(info.label).toBe("Clínica");
    expect(info.source).toBe("metadados");
    expect(info.hint).toMatch(/useClinicData/);
  });
});

describe("getMissingSignatureContextFieldDetails", () => {
  it("returns empty array when context is complete", () => {
    expect(getMissingSignatureContextFieldDetails(fullContext)).toEqual([]);
  });

  it("returns full metadata objects (label + source + hint) for each missing field", () => {
    const details = getMissingSignatureContextFieldDetails({
      document_type: "consolidated_document",
      patient_id: "pat-1",
      snapshot: null,
    });
    expect(details).toHaveLength(2);
    const fields = details.map((d) => d.field);
    expect(fields).toEqual(["document_id", "clinic_id"]);
    // Sanity-check that origin metadata is forwarded, not stripped.
    expect(details[0].source).toBe("documento");
    expect(details[1].source).toBe("metadados");
    expect(details[0].hint.length).toBeGreaterThan(10);
    expect(details[1].hint.length).toBeGreaterThan(10);
  });
});

describe("assertSignatureContextReady", () => {
  it("returns true and does NOT show a toast when context is complete", () => {
    const ok = assertSignatureContextReady(fullContext);
    expect(ok).toBe(true);
    expect(toast.error).not.toHaveBeenCalled();
  });

  it("returns false and shows a toast when document_id is missing", () => {
    const ok = assertSignatureContextReady({ ...fullContext, document_id: "" });
    expect(ok).toBe(false);
    expect(toast.error).toHaveBeenCalledTimes(1);
    const [title, opts] = (toast.error as unknown as ReturnType<typeof vi.fn>).mock.calls[0];
    expect(title).toBe("Não é possível abrir a assinatura");
    expect(opts.description).toMatch(/Documento/);
    expect(opts.description).toMatch(/documento/); // origem
  });

  it("returns false and shows a toast when clinic_id is missing", () => {
    const ok = assertSignatureContextReady({ ...fullContext, clinic_id: "" });
    expect(ok).toBe(false);
    expect(toast.error).toHaveBeenCalledTimes(1);
    const [, opts] = (toast.error as unknown as ReturnType<typeof vi.fn>).mock.calls[0];
    expect(opts.description).toMatch(/Clínica/);
    expect(opts.description).toMatch(/metadados/);
  });

  it("returns false and shows a toast when patient_id is missing", () => {
    const ok = assertSignatureContextReady({ ...fullContext, patient_id: "" });
    expect(ok).toBe(false);
    expect(toast.error).toHaveBeenCalledTimes(1);
    const [, opts] = (toast.error as unknown as ReturnType<typeof vi.fn>).mock.calls[0];
    expect(opts.description).toMatch(/Paciente/);
    expect(opts.description).toMatch(/atendimento/);
  });

  it("lists every missing field in the toast description when multiple are missing", () => {
    const ok = assertSignatureContextReady(null);
    expect(ok).toBe(false);
    expect(toast.error).toHaveBeenCalledTimes(1);
    const [, opts] = (toast.error as unknown as ReturnType<typeof vi.fn>).mock.calls[0];
    expect(opts.description).toMatch(/Documento/);
    expect(opts.description).toMatch(/Clínica/);
    expect(opts.description).toMatch(/Paciente/);
    // Each line includes its origin label.
    expect(opts.description).toMatch(/esperado em: documento/);
    expect(opts.description).toMatch(/esperado em: metadados/);
    expect(opts.description).toMatch(/esperado em: atendimento/);
  });

  it("returns false for undefined context without throwing", () => {
    expect(() => assertSignatureContextReady(undefined)).not.toThrow();
    expect(assertSignatureContextReady(undefined)).toBe(false);
  });
});
