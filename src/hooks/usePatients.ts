import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface PatientInsurance {
  id: string;
  patient_id: string;
  insurance_id: string;
  card_number: string;
  valid_until: string | null;
  is_primary: boolean;
  holder_type: string;
  holder_name: string | null;
  insurance?: {
    id: string;
    name: string;
  };
}

export interface PatientClinicalData {
  id: string;
  patient_id: string;
  allergies: string[];
  chronic_diseases: string[];
  current_medications: string[];
  blood_type: string | null;
  family_history: string | null;
  clinical_restrictions: string | null;
}

export interface PatientGuardian {
  id: string;
  patient_id: string;
  full_name: string;
  relationship: string;
  cpf: string | null;
  phone: string | null;
  email: string | null;
  is_primary: boolean;
}

export interface Patient {
  id: string;
  clinic_id: string;
  full_name: string;
  birth_date: string | null;
  gender: string | null;
  cpf: string | null;
  phone: string | null;
  email: string | null;
  address_street: string | null;
  address_number: string | null;
  address_complement: string | null;
  address_neighborhood: string | null;
  address_city: string | null;
  address_state: string | null;
  address_zip: string | null;
  notes: string | null;
  has_clinical_alert: boolean;
  clinical_alert_text: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  // Relations
  patient_insurances?: PatientInsurance[];
  patient_clinical_data?: PatientClinicalData[];
  patient_guardians?: PatientGuardian[];
}

export interface PatientFormData {
  full_name: string;
  birth_date?: string;
  gender?: string;
  cpf?: string;
  rg?: string;
  marital_status?: string;
  phone?: string;
  email?: string;
  address_street?: string;
  address_number?: string;
  address_complement?: string;
  address_neighborhood?: string;
  address_city?: string;
  address_state?: string;
  address_zip?: string;
  notes?: string;
  // Insurance data
  has_insurance?: boolean;
  insurance_id?: string;
  card_number?: string;
  valid_until?: string;
  // Guardian data
  has_guardian?: boolean;
  guardian_name?: string;
  guardian_relationship?: string;
  guardian_cpf?: string;
  guardian_rg?: string;
  guardian_phone?: string;
  guardian_email?: string;
  // Clinical data
  allergies?: string;
  chronic_diseases?: string;
  current_medications?: string;
  clinical_restrictions?: string;
}

async function getClinicId(): Promise<string> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Usuário não autenticado");
  
  const { data: profile } = await supabase
    .from("profiles")
    .select("clinic_id")
    .eq("user_id", user.id)
    .single();
    
  if (!profile?.clinic_id) throw new Error("Clínica não encontrada");
  return profile.clinic_id;
}

// Fetch all patients
export function usePatients() {
  return useQuery({
    queryKey: ["patients"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("patients")
        .select(`
          *,
          patient_insurances(*, insurances(id, name)),
          patient_clinical_data(*),
          patient_guardians(*)
        `)
        .eq("is_active", true)
        .order("full_name");
      
      if (error) throw error;
      return data as Patient[];
    },
  });
}

// Fetch all patients including inactive
export function useAllPatients() {
  return useQuery({
    queryKey: ["patients", "all"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("patients")
        .select(`
          *,
          patient_insurances(*, insurances(id, name)),
          patient_clinical_data(*),
          patient_guardians(*)
        `)
        .order("full_name");
      
      if (error) throw error;
      return data as Patient[];
    },
  });
}

// Fetch single patient
export function usePatient(id: string | null) {
  return useQuery({
    queryKey: ["patients", id],
    queryFn: async () => {
      if (!id) return null;
      
      const { data, error } = await supabase
        .from("patients")
        .select(`
          *,
          patient_insurances(*, insurances(id, name)),
          patient_clinical_data(*),
          patient_guardians(*)
        `)
        .eq("id", id)
        .single();
      
      if (error) throw error;
      return data as Patient;
    },
    enabled: !!id,
  });
}

// Create patient
export function useCreatePatient() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (data: PatientFormData) => {
      const clinicId = await getClinicId();
      
      // Insert patient
      const { data: patient, error: patientError } = await supabase
        .from("patients")
        .insert({
          clinic_id: clinicId,
          full_name: data.full_name,
          birth_date: data.birth_date || null,
          gender: data.gender || null,
          cpf: data.cpf || null,
          rg: data.rg || null,
          marital_status: data.marital_status || null,
          phone: data.phone || null,
          email: data.email || null,
          address_street: data.address_street || null,
          address_number: data.address_number || null,
          address_complement: data.address_complement || null,
          address_neighborhood: data.address_neighborhood || null,
          address_city: data.address_city || null,
          address_state: data.address_state || null,
          address_zip: data.address_zip || null,
          notes: data.notes || null,
        })
        .select()
        .single();
      
      if (patientError) throw patientError;
      
      // Insert insurance if provided
      if (data.has_insurance && data.insurance_id && data.card_number) {
        const { error: insuranceError } = await supabase
          .from("patient_insurances")
          .insert({
            clinic_id: clinicId,
            patient_id: patient.id,
            insurance_id: data.insurance_id,
            card_number: data.card_number,
            valid_until: data.valid_until || null,
          });
        
        if (insuranceError) console.error("Error inserting insurance:", insuranceError);
      }
      
      // Insert guardian if provided
      if (data.has_guardian && data.guardian_name && data.guardian_relationship) {
        const { error: guardianError } = await supabase
          .from("patient_guardians")
          .insert({
            clinic_id: clinicId,
            patient_id: patient.id,
            full_name: data.guardian_name,
            relationship: data.guardian_relationship,
            cpf: data.guardian_cpf || null,
            rg: data.guardian_rg || null,
            phone: data.guardian_phone || null,
            email: data.guardian_email || null,
          });
        
        if (guardianError) console.error("Error inserting guardian:", guardianError);
      }
      
      // Insert clinical data if provided
      const allergiesArr = data.allergies ? data.allergies.split(",").map(s => s.trim()).filter(Boolean) : [];
      const chronicArr = data.chronic_diseases ? data.chronic_diseases.split(",").map(s => s.trim()).filter(Boolean) : [];
      const medsArr = data.current_medications ? data.current_medications.split(",").map(s => s.trim()).filter(Boolean) : [];
      const restrictions = data.clinical_restrictions || null;
      const hasClinicData = allergiesArr.length > 0 || chronicArr.length > 0 || medsArr.length > 0 || !!restrictions;
      if (hasClinicData) {
        const { error: clinicalError } = await supabase
          .from("patient_clinical_data")
          .insert({
            clinic_id: clinicId,
            patient_id: patient.id,
            allergies: allergiesArr,
            chronic_diseases: chronicArr,
            current_medications: medsArr,
            clinical_restrictions: restrictions,
          });
        
        if (clinicalError) console.error("Error inserting clinical data:", clinicalError);
      }
      
      return patient;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["patients"] });
      toast.success("Paciente cadastrado com sucesso!");
    },
    onError: (error: Error) => {
      console.error("Error creating patient:", error);
      toast.error("Erro ao cadastrar paciente: " + error.message);
    },
  });
}

// Update patient
export function useUpdatePatient() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: PatientFormData }) => {
      const clinicId = await getClinicId();

      const { data: updated, error } = await supabase
        .from("patients")
        .update({
          full_name: data.full_name,
          birth_date: data.birth_date || null,
          gender: data.gender || null,
          cpf: data.cpf || null,
          rg: data.rg || null,
          marital_status: data.marital_status || null,
          phone: data.phone || null,
          email: data.email || null,
          address_street: data.address_street || null,
          address_number: data.address_number || null,
          address_complement: data.address_complement || null,
          address_neighborhood: data.address_neighborhood || null,
          address_city: data.address_city || null,
          address_state: data.address_state || null,
          address_zip: data.address_zip || null,
          notes: data.notes || null,
          updated_at: new Date().toISOString(),
        })
        .eq("id", id)
        .eq("clinic_id", clinicId)
        .select()
        .single();
      
      if (error) throw error;

      // Update insurance: delete existing, then insert if provided
      await supabase.from("patient_insurances").delete().eq("patient_id", id);
      const hasInsurance = (data as any).payment_type === 'insurance' || data.has_insurance;
      if (hasInsurance && data.insurance_id && data.card_number) {
        const { error: insErr } = await supabase.from("patient_insurances").insert({
          clinic_id: clinicId, patient_id: id, insurance_id: data.insurance_id,
          card_number: data.card_number, valid_until: data.valid_until || null,
        });
        if (insErr) console.error("Error updating insurance:", insErr);
      }

      // Update guardian: delete existing, then insert if provided
      await supabase.from("patient_guardians").delete().eq("patient_id", id);
      if (data.has_guardian && data.guardian_name && data.guardian_relationship) {
        const { error: guardErr } = await supabase.from("patient_guardians").insert({
          clinic_id: clinicId, patient_id: id, full_name: data.guardian_name,
          relationship: data.guardian_relationship, cpf: data.guardian_cpf || null,
          rg: data.guardian_rg || null, phone: data.guardian_phone || null, 
          email: data.guardian_email || null,
        });
        if (guardErr) console.error("Error updating guardian:", guardErr);
      }

      // Update clinical data: delete existing, then always re-insert to avoid data loss
      await supabase.from("patient_clinical_data").delete().eq("patient_id", id);
      const allergiesArr = data.allergies ? data.allergies.split(",").map(s => s.trim()).filter(Boolean) : [];
      const chronicArr = data.chronic_diseases ? data.chronic_diseases.split(",").map(s => s.trim()).filter(Boolean) : [];
      const medsArr = data.current_medications ? data.current_medications.split(",").map(s => s.trim()).filter(Boolean) : [];
      const restrictions = data.clinical_restrictions || null;
      const hasAnyClinicData = allergiesArr.length > 0 || chronicArr.length > 0 || medsArr.length > 0 || !!restrictions;
      if (hasAnyClinicData) {
        const { error: clinErr } = await supabase.from("patient_clinical_data").insert({
          clinic_id: clinicId, patient_id: id,
          allergies: allergiesArr,
          chronic_diseases: chronicArr,
          current_medications: medsArr,
          clinical_restrictions: restrictions,
        });
        if (clinErr) console.error("Error updating clinical data:", clinErr);
      }

      return { id };
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ["patients"] });
      queryClient.invalidateQueries({ queryKey: ["patients", result.id] });
      queryClient.invalidateQueries({ queryKey: ["patients-list"] });
      queryClient.invalidateQueries({ queryKey: ["patient-clinical-data"] });
      queryClient.invalidateQueries({ queryKey: ["attended-patients"] });
      toast.success("Paciente atualizado com sucesso!");
    },
    onError: (error: Error) => {
      console.error("Error updating patient:", error);
      toast.error("Erro ao atualizar paciente: " + error.message);
    },
  });
}

// Deactivate patient (soft delete)
export function useDeactivatePatient() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("patients")
        .update({ is_active: false, updated_at: new Date().toISOString() })
        .eq("id", id);
      
      if (error) throw error;
      return { id };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["patients"] });
      toast.success("Paciente inativado com sucesso!");
    },
    onError: (error: Error) => {
      toast.error("Erro ao inativar paciente: " + error.message);
    },
  });
}

// Reactivate patient
export function useReactivatePatient() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("patients")
        .update({ is_active: true, updated_at: new Date().toISOString() })
        .eq("id", id);
      
      if (error) throw error;
      return { id };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["patients"] });
      toast.success("Paciente reativado com sucesso!");
    },
    onError: (error: Error) => {
      toast.error("Erro ao reativar paciente: " + error.message);
    },
  });
}

// Get patient appointment history
export function usePatientAppointments(patientId: string | null) {
  return useQuery({
    queryKey: ["patient-appointments", patientId],
    queryFn: async () => {
      if (!patientId) return [];
      
      const { data, error } = await supabase
        .from("appointments")
        .select(`
          id,
          scheduled_date,
          start_time,
          status,
          appointment_type,
          professionals(full_name),
          specialties(name),
          procedures(name)
        `)
        .eq("patient_id", patientId)
        .order("scheduled_date", { ascending: false })
        .limit(20);
      
      if (error) throw error;
      return data;
    },
    enabled: !!patientId,
  });
}

// Fetch insurances for dropdown
export function useInsurances() {
  return useQuery({
    queryKey: ["insurances"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("insurances")
        .select("id, name")
        .eq("is_active", true)
        .order("name");
      
      if (error) throw error;
      return data;
    },
  });
}

// Fetch professionals for dropdown
export function useProfessionals() {
  return useQuery({
    queryKey: ["professionals"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("professionals")
        .select("id, full_name, specialties(name)")
        .eq("is_active", true)
        .order("full_name");
      
      if (error) throw error;
      return data;
    },
  });
}
