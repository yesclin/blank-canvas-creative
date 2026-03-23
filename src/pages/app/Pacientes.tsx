import { useState, useMemo } from 'react';
import { Plus, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { PatientFiltersComponent } from '@/components/pacientes/PatientFilters';
import { PatientTable } from '@/components/pacientes/PatientTable';
import { PatientFormDialog } from '@/components/pacientes/PatientFormDialog';
import { PatientProfile } from '@/components/pacientes/PatientProfile';
import { 
  usePatients, 
  useAllPatients,
  usePatient,
  useCreatePatient, 
  useUpdatePatient,
  useInsurances,
  useProfessionals,
  usePatientAppointments,
  type Patient,
  type PatientFormData,
} from '@/hooks/usePatients';
import type { PatientFilters, PatientSortField, PatientSortOrder } from '@/types/pacientes';
import { useNavigate } from 'react-router-dom';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { usePatientFilter, useClinicalFieldVisibility } from '@/hooks/useRoleBasedData';
import { usePermissions } from '@/hooks/usePermissions';
import { supabase } from '@/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';

export default function Pacientes() {
  const navigate = useNavigate();
  
  // Role-based data access
  const { filterByAttendedProfessional, professionalIdFilter, canViewClinicalData } = usePatientFilter();
  const clinicalAccess = useClinicalFieldVisibility();
  const { role, professionalId } = usePermissions();
  
  // Data hooks
  const { data: patients = [], isLoading, error } = useAllPatients();
  const { data: insurances = [] } = useInsurances();
  const { data: professionals = [] } = useProfessionals();
  const createPatient = useCreatePatient();
  const updatePatient = useUpdatePatient();

  // Fetch attended patient IDs for professional users
  const { data: attendedPatientIds = [] } = useQuery({
    queryKey: ['attended-patients', professionalIdFilter],
    queryFn: async () => {
      if (!professionalIdFilter) return [];
      
      const { data, error } = await supabase
        .from('appointments')
        .select('patient_id')
        .eq('professional_id', professionalIdFilter)
        .not('patient_id', 'is', null);
      
      if (error) throw error;
      
      // Get unique patient IDs
      const uniqueIds = [...new Set(data.map(d => d.patient_id))];
      return uniqueIds as string[];
    },
    enabled: filterByAttendedProfessional && !!professionalIdFilter,
  });

  // State
  const [filters, setFilters] = useState<PatientFilters>({
    search: '',
    status: 'all',
    insuranceType: 'all',
    insuranceId: null,
    professionalId: null,
  });
  const [sortField, setSortField] = useState<PatientSortField>('name');
  const [sortOrder, setSortOrder] = useState<PatientSortOrder>('asc');
  const [selectedPatientId, setSelectedPatientId] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editingPatientId, setEditingPatientId] = useState<string | null>(null);

  // Selected patient data — single source of truth from React Query
  const { data: selectedPatient } = usePatient(selectedPatientId);
  const { data: editingPatientData } = usePatient(editingPatientId);
  const { data: patientHistory = [] } = usePatientAppointments(selectedPatientId);

  // Filter patients based on role and then apply filters

  const accessiblePatients = useMemo(() => {
    if (!filterByAttendedProfessional) {
      return patients;
    }
    return patients.filter(p => attendedPatientIds.includes(p.id));
  }, [patients, filterByAttendedProfessional, attendedPatientIds]);

  // Filter and sort patients
  const filteredPatients = accessiblePatients.filter((patient) => {
    if (filters.search) {
      const search = filters.search.toLowerCase();
      const matchesSearch = 
        patient.full_name.toLowerCase().includes(search) ||
        patient.cpf?.includes(search) ||
        patient.phone?.includes(search) ||
        patient.email?.toLowerCase().includes(search);
      if (!matchesSearch) return false;
    }

    // Status filter
    if (filters.status !== 'all') {
      if (filters.status === 'active' && !patient.is_active) return false;
      if (filters.status === 'inactive' && patient.is_active) return false;
    }

    // Insurance type filter
    if (filters.insuranceType !== 'all') {
      const hasInsurance = patient.patient_insurances && patient.patient_insurances.length > 0;
      if (filters.insuranceType === 'insurance' && !hasInsurance) return false;
      if (filters.insuranceType === 'particular' && hasInsurance) return false;
    }

    // Specific insurance filter
    if (filters.insuranceId) {
      const hasThisInsurance = patient.patient_insurances?.some(
        pi => pi.insurance_id === filters.insuranceId
      );
      if (!hasThisInsurance) return false;
    }

    return true;
  }).sort((a, b) => {
    let comparison = 0;
    switch (sortField) {
      case 'name':
        comparison = a.full_name.localeCompare(b.full_name);
        break;
      case 'last_appointment':
        comparison = (a.updated_at || '').localeCompare(b.updated_at || '');
        break;
      case 'created_at':
        comparison = a.created_at.localeCompare(b.created_at);
        break;
    }
    return sortOrder === 'asc' ? comparison : -comparison;
  });

  // Stats
  const stats = {
    total: patients.length,
    active: patients.filter(p => p.is_active).length,
    inactive: patients.filter(p => !p.is_active).length,
    withInsurance: patients.filter(p => p.patient_insurances && p.patient_insurances.length > 0).length,
    withAlerts: patients.filter(p => p.has_clinical_alert).length,
  };

  // Handlers
  const handleSortChange = (field: PatientSortField, order: PatientSortOrder) => {
    setSortField(field);
    setSortOrder(order);
  };

  const handleViewPatient = (patient: Patient) => {
    setSelectedPatientId(patient.id);
  };

  const handleEditPatient = (patient: Patient) => {
    setEditingPatientId(patient.id);
    setShowForm(true);
  };

  const handleScheduleAppointment = (patient: Patient) => {
    navigate('/app/agenda', { state: { patientId: patient.id, patientName: patient.full_name } });
  };

  const handleOpenProntuario = (patient: Patient) => {
    navigate(`/app/prontuario/${patient.id}`);
  };

  const handleSavePatient = async (data: any) => {
    const formData: PatientFormData = {
      full_name: data.full_name,
      birth_date: data.birth_date || undefined,
      gender: data.gender || undefined,
      cpf: data.cpf || undefined,
      rg: data.rg || undefined,
      marital_status: data.marital_status || undefined,
      phone: data.phone || undefined,
      email: data.email || undefined,
      address_street: data.address_street || undefined,
      address_number: data.address_number || undefined,
      address_complement: data.address_complement || undefined,
      address_neighborhood: data.address_neighborhood || undefined,
      address_city: data.address_city || undefined,
      address_state: data.address_state || undefined,
      address_zip: data.address_zip || undefined,
      notes: data.notes || undefined,
      has_insurance: data.payment_type === 'insurance',
      insurance_id: data.insurance_id || undefined,
      card_number: data.card_number || undefined,
      valid_until: data.valid_until || undefined,
      has_guardian: data.has_guardian,
      guardian_name: data.guardian_name || undefined,
      guardian_relationship: data.guardian_relationship || undefined,
      guardian_cpf: data.guardian_cpf || undefined,
      guardian_rg: data.guardian_rg || undefined,
      guardian_phone: data.guardian_phone || undefined,
      guardian_email: data.guardian_email || undefined,
      allergies: data.allergies ?? '',
      chronic_diseases: data.chronic_diseases ?? '',
      current_medications: data.current_medications ?? '',
      clinical_restrictions: data.clinical_restrictions ?? '',
    };

    try {
      if (editingPatientId) {
        await updatePatient.mutateAsync({ id: editingPatientId, data: formData });
      } else {
        await createPatient.mutateAsync(formData);
      }
      setShowForm(false);
      setEditingPatientId(null);
    } catch {
      // Error toast handled by mutation's onError
    }
  };

  const handleCloseForm = () => {
    if (updatePatient.isPending || createPatient.isPending) return;
    setShowForm(false);
    setEditingPatientId(null);
  };

  // If viewing a patient profile
  if (selectedPatient) {
    // Transform patient data for PatientProfile component
    const patientForProfile = {
      ...selectedPatient,
      insurance: selectedPatient.patient_insurances?.[0] ? {
        id: selectedPatient.patient_insurances[0].id,
        patient_id: selectedPatient.id,
        insurance_id: selectedPatient.patient_insurances[0].insurance_id,
        insurance_name: selectedPatient.patient_insurances[0].insurance?.name || '',
        card_number: selectedPatient.patient_insurances[0].card_number,
        valid_until: selectedPatient.patient_insurances[0].valid_until,
        plan_name: '',
      } : undefined,
      guardian: selectedPatient.patient_guardians?.[0] ? {
        ...selectedPatient.patient_guardians[0],
        clinic_id: selectedPatient.clinic_id,
        created_at: '',
        updated_at: '',
      } : undefined,
      clinical_data: selectedPatient.patient_clinical_data?.[0] ? {
        ...selectedPatient.patient_clinical_data[0],
        clinic_id: selectedPatient.clinic_id,
        created_at: '',
        updated_at: '',
      } : undefined,
      total_appointments: patientHistory.length,
      last_appointment_date: patientHistory[0]?.scheduled_date || null,
    };

    const historyForProfile = patientHistory.map((apt: any) => ({
      id: apt.id,
      scheduled_date: apt.scheduled_date,
      start_time: apt.start_time,
      status: apt.status,
      appointment_type: apt.appointment_type,
      professional_name: apt.professionals?.full_name || '',
      specialty_name: apt.specialties?.name || '',
      procedure_name: apt.procedures?.name || null,
    }));

    return (
      <div className="p-6">
        <PatientProfile
          patient={patientForProfile as any}
          appointmentHistory={historyForProfile}
          attachments={[]}
          onBack={() => setSelectedPatientId(null)}
          onEdit={() => handleEditPatient(selectedPatient as any)}
          onScheduleAppointment={() => handleScheduleAppointment(selectedPatient as any)}
          onOpenProntuario={() => handleOpenProntuario(selectedPatient as any)}
        />
        <PatientFormDialog
          key={editingPatientId || 'new'}
          open={showForm}
          onOpenChange={handleCloseForm}
          patient={editingPatientData as any}
          insurances={insurances.map(i => ({ id: i.id, name: i.name }))}
          onSave={handleSavePatient}
          isSaving={updatePatient.isPending || createPatient.isPending}
        />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <Alert variant="destructive">
          <AlertDescription>
            Erro ao carregar pacientes: {error.message}
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Pacientes</h1>
          <p className="text-muted-foreground">
            Gerencie sua base de pacientes com histórico completo
          </p>
        </div>
        <Button onClick={() => setShowForm(true)} disabled={createPatient.isPending}>
          {createPatient.isPending ? (
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          ) : (
            <Plus className="h-4 w-4 mr-2" />
          )}
          Novo Paciente
        </Button>
      </div>

      {/* Filters */}
      <PatientFiltersComponent
        filters={filters}
        onFiltersChange={setFilters}
        sortField={sortField}
        sortOrder={sortOrder}
        onSortChange={handleSortChange}
        insurances={insurances.map(i => ({ id: i.id, name: i.name }))}
        professionals={professionals.map(p => ({ 
          id: p.id, 
          name: p.full_name, 
          specialty: (p as any).specialties?.name || '' 
        }))}
        stats={stats}
      />

      {/* Loading state */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : (
        /* Patient Table */
        <PatientTable
          patients={filteredPatients.map(p => ({
            ...p,
            insurance: p.patient_insurances?.[0] ? {
              id: p.patient_insurances[0].id,
              patient_id: p.id,
              insurance_id: p.patient_insurances[0].insurance_id,
              insurance_name: p.patient_insurances[0].insurance?.name || '',
              card_number: p.patient_insurances[0].card_number,
              valid_until: p.patient_insurances[0].valid_until,
              plan_name: '',
            } : undefined,
            total_appointments: 0,
            last_appointment_date: null,
          })) as any}
          onViewPatient={handleViewPatient as any}
          onEditPatient={handleEditPatient as any}
          onScheduleAppointment={handleScheduleAppointment as any}
          onOpenProntuario={handleOpenProntuario as any}
        />
      )}

      {/* Patient Form Dialog */}
      <PatientFormDialog
        key={editingPatientId || 'new'}
        open={showForm}
        onOpenChange={handleCloseForm}
        patient={editingPatientData as any}
        insurances={insurances.map(i => ({ id: i.id, name: i.name }))}
        onSave={handleSavePatient}
        isSaving={updatePatient.isPending || createPatient.isPending}
      />
    </div>
  );
}
