import { createContext, useContext, type ReactNode } from "react";

export interface MedicalRecordPatientContext {
  id: string;
  full_name: string;
  birth_date: string | null;
  gender: string | null;
  phone?: string | null;
  email?: string | null;
  cpf?: string | null;
}

export interface MedicalRecordContextValue {
  clinicId: string | null;
  patientId: string | null;
  appointmentId: string | null;
  specialtyId: string | null;
  specialtySlug: string | null;
  specialtyKey: string | null;
  specialtyName: string | null;
  medicalRecordId: string | null;
  patient: MedicalRecordPatientContext | null;
  isLoading: boolean;
  isReady: boolean;
}

const emptyContext: MedicalRecordContextValue = {
  clinicId: null,
  patientId: null,
  appointmentId: null,
  specialtyId: null,
  specialtySlug: null,
  specialtyKey: null,
  specialtyName: null,
  medicalRecordId: null,
  patient: null,
  isLoading: true,
  isReady: false,
};

const MedicalRecordContext = createContext<MedicalRecordContextValue>(emptyContext);

export function MedicalRecordProvider({
  value,
  children,
}: {
  value: MedicalRecordContextValue;
  children: ReactNode;
}) {
  return <MedicalRecordContext.Provider value={value}>{children}</MedicalRecordContext.Provider>;
}

export function useMedicalRecordContext() {
  return useContext(MedicalRecordContext);
}
