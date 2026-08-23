import { describe, it, expect, vi } from "vitest";
import { render } from "@testing-library/react";
import React from "react";

const ESTETICA = "ff7d74f8-a61f-4cc8-b4f8-90f8ea8679f2";
const MEIRE = "4ab099a8-1f7e-44cc-9697-1ea3d3eb3f29";
const BRUNA = "dfb172b8-f8f2-4245-bcc2-9d0a7f226649";

const procedures = [
  { id: "p-consulta", name: "Consulta", type: "procedimento", specialty_id: ESTETICA, duration_minutes: 30, price: 100, is_active: true, show_in_agenda: true, uses_sessions: false },
  { id: "p-retorno", name: "Retorno", type: "procedimento", specialty_id: null, duration_minutes: 20, price: 0, is_active: true, show_in_agenda: true, uses_sessions: false },
  { id: "p-encaixe", name: "Encaixe", type: "procedimento", specialty_id: null, duration_minutes: 15, price: 0, is_active: true, show_in_agenda: true, uses_sessions: false },
];

vi.mock("@/hooks/useGlobalSpecialty", () => ({
  useGlobalSpecialty: () => ({
    enabledSpecialties: [{ id: ESTETICA, name: "Estética / Harmonização Facial" }],
    selectedSpecialtyId: ESTETICA,
  }),
}));
vi.mock("@/hooks/useProceduresCRUD", () => ({
  useProceduresList: () => ({ data: procedures, isLoading: false }),
}));
vi.mock("@/hooks/useAppointmentTypes", () => ({
  useAppointmentTypes: () => ({ types: [] }),
}));
vi.mock("@/hooks/usePermissions", () => ({
  usePermissions: () => ({ isOwner: true, isAdmin: false }),
}));
vi.mock("@/hooks/useClinicRooms", () => ({
  useClinicRooms: () => ({ data: [] }),
  useRoomAuthorizations: () => ({ data: [] }),
  buildRoomAuthorizationMap: () => new Map(),
}));
vi.mock("@/hooks/useProfessionalSpecialties", () => ({
  useProfessionalSpecialties: (id: string | null) => ({
    data: id ? [{ specialty: { id: ESTETICA, name: "Estética / Harmonização Facial", is_active: true } }] : [],
  }),
}));
vi.mock("@/hooks/finance/useTreatmentPackageIntegration", () => ({
  useActivePackagesByPatient: () => ({ data: [] }),
}));
vi.mock("@/components/agenda/ProcedureProductsPreview", () => ({
  ProcedureProductsPreview: () => null,
}));
vi.mock("@/components/agenda/PatientAutocomplete", () => ({
  PatientAutocomplete: () => null,
}));

const professionals = [
  { id: BRUNA, full_name: "Bruna Prieto", color: "#fff", is_active: true, specialty_id: null },
  { id: MEIRE, full_name: "Meire Garcia Prado", color: "#fff", is_active: true, specialty_id: ESTETICA },
] as any;

describe("AppointmentDialog render stability", () => {
  it.each([
    ["Bruna (no professionals.specialty_id)", BRUNA],
    ["Meire (with professionals.specialty_id)", MEIRE],
  ])("does not loop when opening for %s", async (_label, profId) => {
    const { AppointmentDialog } = await import("@/components/agenda/AppointmentDialog");
    const errors: string[] = [];
    const spy = vi.spyOn(console, "error").mockImplementation((...args) => {
      errors.push(String(args[0]));
    });

    expect(() =>
      render(
        <AppointmentDialog
          open
          onOpenChange={() => {}}
          mode="create"
          professionals={professionals}
          patients={[]}
          rooms={[]}
          specialties={[{ id: ESTETICA, name: "Estética / Harmonização Facial" }] as any}
          insurances={[]}
          defaultDate={new Date("2026-03-10T00:00:00")}
          defaultStartTime="09:00"
          defaultProfessionalId={profId}
          existingAppointments={[]}
          scheduleBlocks={[]}
          professionalSchedules={new Map()}
          onSubmit={() => {}}
        />
      )
    ).not.toThrow();

    expect(errors.filter((e) => e.includes("Maximum update depth"))).toHaveLength(0);
    spy.mockRestore();
  });
});
