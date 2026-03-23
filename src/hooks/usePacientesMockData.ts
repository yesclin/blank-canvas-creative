import { useState, useMemo } from 'react';
import type { 
  Patient, 
  PatientClinicalData, 
  PatientGuardian, 
  PatientAppointmentHistory,
  PatientAttachment,
  PatientFilters,
  PatientSortField,
  PatientSortOrder,
} from '@/types/pacientes';

// Generate mock patients
const generateMockPatients = (): Patient[] => {
  const patients: Patient[] = [
    {
      id: '1',
      clinic_id: 'clinic-1',
      full_name: 'Maria Silva Santos',
      birth_date: '1985-03-15',
      gender: 'F',
      cpf: '123.456.789-00',
      phone: '(11) 99999-1111',
      email: 'maria.silva@email.com',
      address_street: 'Rua das Flores',
      address_number: '123',
      address_complement: 'Apto 45',
      address_neighborhood: 'Centro',
      address_city: 'São Paulo',
      address_state: 'SP',
      address_zip: '01234-567',
      notes: 'Paciente pontual e assídua',
      has_clinical_alert: true,
      clinical_alert_text: 'Alergia a dipirona',
      is_active: true,
      created_at: '2024-01-15T10:00:00Z',
      updated_at: '2024-06-20T15:30:00Z',
      last_appointment_date: '2024-06-18',
      total_appointments: 12,
      insurance: {
        id: 'ins-1',
        patient_id: '1',
        insurance_id: 'insurance-1',
        insurance_name: 'Unimed',
        card_number: '0123456789',
        valid_until: '2025-12-31',
        plan_name: 'Plano Ouro',
      },
      clinical_data: {
        id: 'cd-1',
        patient_id: '1',
        clinic_id: 'clinic-1',
        allergies: ['Dipirona', 'Penicilina'],
        chronic_diseases: ['Hipertensão'],
        current_medications: ['Losartana 50mg'],
        blood_type: 'O+',
        family_history: 'Diabetes na família',
        clinical_restrictions: null,
        created_at: '2024-01-15T10:00:00Z',
        updated_at: '2024-06-20T15:30:00Z',
      },
    },
    {
      id: '2',
      clinic_id: 'clinic-1',
      full_name: 'João Pedro Oliveira',
      birth_date: '2018-07-22',
      gender: 'M',
      cpf: '987.654.321-00',
      phone: '(11) 98888-2222',
      email: null,
      address_street: 'Av. Brasil',
      address_number: '456',
      address_complement: null,
      address_neighborhood: 'Jardim América',
      address_city: 'São Paulo',
      address_state: 'SP',
      address_zip: '04567-890',
      notes: 'Paciente pediátrico',
      has_clinical_alert: false,
      clinical_alert_text: null,
      is_active: true,
      created_at: '2024-02-10T14:00:00Z',
      updated_at: '2024-06-15T09:00:00Z',
      last_appointment_date: '2024-06-10',
      total_appointments: 5,
      guardian: {
        id: 'g-1',
        patient_id: '2',
        clinic_id: 'clinic-1',
        full_name: 'Ana Paula Oliveira',
        relationship: 'Mãe',
        cpf: '111.222.333-44',
        phone: '(11) 98888-2222',
        email: 'ana.oliveira@email.com',
        is_primary: true,
        created_at: '2024-02-10T14:00:00Z',
        updated_at: '2024-02-10T14:00:00Z',
      },
    },
    {
      id: '3',
      clinic_id: 'clinic-1',
      full_name: 'Carlos Alberto Ferreira',
      birth_date: '1960-11-05',
      gender: 'M',
      cpf: '456.789.123-00',
      phone: '(11) 97777-3333',
      email: 'carlos.ferreira@email.com',
      address_street: 'Rua Augusta',
      address_number: '789',
      address_complement: 'Casa 2',
      address_neighborhood: 'Consolação',
      address_city: 'São Paulo',
      address_state: 'SP',
      address_zip: '01305-100',
      notes: null,
      has_clinical_alert: true,
      clinical_alert_text: 'Diabético tipo 2, usa insulina',
      is_active: true,
      created_at: '2023-06-20T11:00:00Z',
      updated_at: '2024-06-22T16:00:00Z',
      last_appointment_date: '2024-06-22',
      total_appointments: 24,
      insurance: {
        id: 'ins-2',
        patient_id: '3',
        insurance_id: 'insurance-2',
        insurance_name: 'Bradesco Saúde',
        card_number: '9876543210',
        valid_until: '2025-06-30',
        plan_name: 'Top Nacional',
      },
      clinical_data: {
        id: 'cd-2',
        patient_id: '3',
        clinic_id: 'clinic-1',
        allergies: [],
        chronic_diseases: ['Diabetes tipo 2', 'Hipertensão', 'Artrose'],
        current_medications: ['Insulina NPH', 'Metformina 850mg', 'Enalapril 20mg'],
        blood_type: 'A+',
        family_history: 'Pai faleceu de IAM',
        clinical_restrictions: 'Evitar procedimentos invasivos sem controle glicêmico',
        created_at: '2023-06-20T11:00:00Z',
        updated_at: '2024-06-22T16:00:00Z',
      },
    },
    {
      id: '4',
      clinic_id: 'clinic-1',
      full_name: 'Fernanda Costa Lima',
      birth_date: '1992-09-18',
      gender: 'F',
      cpf: '321.654.987-00',
      phone: '(11) 96666-4444',
      email: 'fernanda.lima@email.com',
      address_street: 'Rua Oscar Freire',
      address_number: '1000',
      address_complement: 'Apto 1201',
      address_neighborhood: 'Pinheiros',
      address_city: 'São Paulo',
      address_state: 'SP',
      address_zip: '05409-010',
      notes: 'Interessada em estética',
      has_clinical_alert: false,
      clinical_alert_text: null,
      is_active: true,
      created_at: '2024-03-05T09:00:00Z',
      updated_at: '2024-06-10T14:00:00Z',
      last_appointment_date: '2024-06-05',
      total_appointments: 3,
    },
    {
      id: '5',
      clinic_id: 'clinic-1',
      full_name: 'Roberto Mendes Souza',
      birth_date: '1978-04-30',
      gender: 'M',
      cpf: '654.321.987-00',
      phone: '(11) 95555-5555',
      email: 'roberto.souza@email.com',
      address_street: 'Av. Paulista',
      address_number: '1500',
      address_complement: 'Sala 1001',
      address_neighborhood: 'Bela Vista',
      address_city: 'São Paulo',
      address_state: 'SP',
      address_zip: '01310-100',
      notes: null,
      has_clinical_alert: false,
      clinical_alert_text: null,
      is_active: false,
      created_at: '2023-01-10T08:00:00Z',
      updated_at: '2024-01-15T10:00:00Z',
      last_appointment_date: '2023-12-15',
      total_appointments: 8,
    },
    {
      id: '6',
      clinic_id: 'clinic-1',
      full_name: 'Luciana Pereira Santos',
      birth_date: '1988-12-03',
      gender: 'F',
      cpf: '789.456.123-00',
      phone: '(11) 94444-6666',
      email: 'luciana.santos@email.com',
      address_street: 'Rua Haddock Lobo',
      address_number: '500',
      address_complement: null,
      address_neighborhood: 'Cerqueira César',
      address_city: 'São Paulo',
      address_state: 'SP',
      address_zip: '01414-001',
      notes: 'Gestante - 28 semanas',
      has_clinical_alert: true,
      clinical_alert_text: 'Gestante - contraindicado procedimentos estéticos',
      is_active: true,
      created_at: '2024-04-12T13:00:00Z',
      updated_at: '2024-06-21T11:00:00Z',
      last_appointment_date: '2024-06-21',
      total_appointments: 6,
      insurance: {
        id: 'ins-3',
        patient_id: '6',
        insurance_id: 'insurance-3',
        insurance_name: 'SulAmérica',
        card_number: '5432109876',
        valid_until: '2025-04-30',
        plan_name: 'Executivo',
      },
    },
  ];

  return patients;
};

// Generate appointment history for a patient
const generateMockAppointmentHistory = (patientId: string): PatientAppointmentHistory[] => {
  const histories: Record<string, PatientAppointmentHistory[]> = {
    '1': [
      { id: 'a1', scheduled_date: '2024-06-18', start_time: '09:00', status: 'finalizado', appointment_type: 'consulta', professional_name: 'Dra. Ana Beatriz', specialty_name: 'Dermatologia', procedure_name: 'Consulta de retorno' },
      { id: 'a2', scheduled_date: '2024-05-20', start_time: '14:00', status: 'finalizado', appointment_type: 'procedimento', professional_name: 'Dra. Ana Beatriz', specialty_name: 'Dermatologia', procedure_name: 'Peeling químico' },
      { id: 'a3', scheduled_date: '2024-04-15', start_time: '10:00', status: 'finalizado', appointment_type: 'consulta', professional_name: 'Dra. Ana Beatriz', specialty_name: 'Dermatologia', procedure_name: 'Primeira consulta' },
    ],
    '2': [
      { id: 'a4', scheduled_date: '2024-06-10', start_time: '08:30', status: 'finalizado', appointment_type: 'consulta', professional_name: 'Dr. Pedro Henrique', specialty_name: 'Pediatria', procedure_name: 'Consulta de rotina' },
      { id: 'a5', scheduled_date: '2024-03-15', start_time: '09:00', status: 'faltou', appointment_type: 'consulta', professional_name: 'Dr. Pedro Henrique', specialty_name: 'Pediatria', procedure_name: null },
    ],
    '3': [
      { id: 'a6', scheduled_date: '2024-06-22', start_time: '11:00', status: 'finalizado', appointment_type: 'consulta', professional_name: 'Dr. Ricardo Lima', specialty_name: 'Clínica Geral', procedure_name: 'Acompanhamento' },
      { id: 'a7', scheduled_date: '2024-05-22', start_time: '11:00', status: 'finalizado', appointment_type: 'consulta', professional_name: 'Dr. Ricardo Lima', specialty_name: 'Clínica Geral', procedure_name: 'Acompanhamento' },
      { id: 'a8', scheduled_date: '2024-04-22', start_time: '11:00', status: 'finalizado', appointment_type: 'consulta', professional_name: 'Dr. Ricardo Lima', specialty_name: 'Clínica Geral', procedure_name: 'Acompanhamento' },
    ],
  };
  return histories[patientId] || [];
};

// Generate attachments for a patient
const generateMockAttachments = (patientId: string): PatientAttachment[] => {
  const attachments: Record<string, PatientAttachment[]> = {
    '1': [
      { id: 'att1', patient_id: '1', file_name: 'exame_sangue_2024.pdf', file_type: 'application/pdf', file_url: '/files/exame.pdf', file_size: 256000, category: 'exam', description: 'Hemograma completo', created_at: '2024-06-15T10:00:00Z', uploaded_by: 'Dr. Ricardo Lima' },
      { id: 'att2', patient_id: '1', file_name: 'rg_frente.jpg', file_type: 'image/jpeg', file_url: '/files/rg.jpg', file_size: 128000, category: 'document', description: 'Documento de identidade', created_at: '2024-01-15T10:00:00Z', uploaded_by: 'Recepção' },
    ],
    '3': [
      { id: 'att3', patient_id: '3', file_name: 'glicemia_junho.pdf', file_type: 'application/pdf', file_url: '/files/glicemia.pdf', file_size: 180000, category: 'exam', description: 'Exame de glicemia', created_at: '2024-06-20T14:00:00Z', uploaded_by: 'Dr. Ricardo Lima' },
      { id: 'att4', patient_id: '3', file_name: 'ecg_2024.pdf', file_type: 'application/pdf', file_url: '/files/ecg.pdf', file_size: 320000, category: 'exam', description: 'Eletrocardiograma', created_at: '2024-05-10T09:00:00Z', uploaded_by: 'Dr. Carlos Santos' },
    ],
  };
  return attachments[patientId] || [];
};

// Mock insurances
const mockInsurances = [
  { id: 'insurance-1', name: 'Unimed' },
  { id: 'insurance-2', name: 'Bradesco Saúde' },
  { id: 'insurance-3', name: 'SulAmérica' },
  { id: 'insurance-4', name: 'Amil' },
  { id: 'insurance-5', name: 'NotreDame Intermédica' },
];

// Mock professionals
const mockProfessionals = [
  { id: 'prof-1', name: 'Dra. Ana Beatriz', specialty: 'Dermatologia' },
  { id: 'prof-2', name: 'Dr. Pedro Henrique', specialty: 'Pediatria' },
  { id: 'prof-3', name: 'Dr. Ricardo Lima', specialty: 'Clínica Geral' },
  { id: 'prof-4', name: 'Dra. Marina Costa', specialty: 'Psicologia' },
];

export const usePacientesMockData = () => {
  const [patients] = useState<Patient[]>(generateMockPatients);
  
  const insurances = mockInsurances;
  const professionals = mockProfessionals;

  const getPatientById = (id: string): Patient | undefined => {
    return patients.find(p => p.id === id);
  };

  const getPatientHistory = (patientId: string): PatientAppointmentHistory[] => {
    return generateMockAppointmentHistory(patientId);
  };

  const getPatientAttachments = (patientId: string): PatientAttachment[] => {
    return generateMockAttachments(patientId);
  };

  const filterPatients = (
    filters: PatientFilters,
    sortField: PatientSortField = 'name',
    sortOrder: PatientSortOrder = 'asc'
  ): Patient[] => {
    let filtered = [...patients];

    // Search filter
    if (filters.search) {
      const search = filters.search.toLowerCase();
      filtered = filtered.filter(p =>
        p.full_name.toLowerCase().includes(search) ||
        p.cpf?.includes(search) ||
        p.phone?.includes(search) ||
        p.email?.toLowerCase().includes(search)
      );
    }

    // Status filter
    if (filters.status !== 'all') {
      filtered = filtered.filter(p =>
        filters.status === 'active' ? p.is_active : !p.is_active
      );
    }

    // Insurance type filter
    if (filters.insuranceType !== 'all') {
      filtered = filtered.filter(p =>
        filters.insuranceType === 'insurance' ? !!p.insurance : !p.insurance
      );
    }

    // Specific insurance filter
    if (filters.insuranceId) {
      filtered = filtered.filter(p =>
        p.insurance?.insurance_id === filters.insuranceId
      );
    }

    // Sort
    filtered.sort((a, b) => {
      let comparison = 0;
      switch (sortField) {
        case 'name':
          comparison = a.full_name.localeCompare(b.full_name);
          break;
        case 'last_appointment':
          comparison = (a.last_appointment_date || '').localeCompare(b.last_appointment_date || '');
          break;
        case 'created_at':
          comparison = a.created_at.localeCompare(b.created_at);
          break;
      }
      return sortOrder === 'asc' ? comparison : -comparison;
    });

    return filtered;
  };

  // Stats
  const stats = useMemo(() => ({
    total: patients.length,
    active: patients.filter(p => p.is_active).length,
    inactive: patients.filter(p => !p.is_active).length,
    withInsurance: patients.filter(p => !!p.insurance).length,
    withAlerts: patients.filter(p => p.has_clinical_alert).length,
  }), [patients]);

  return {
    patients,
    insurances,
    professionals,
    stats,
    getPatientById,
    getPatientHistory,
    getPatientAttachments,
    filterPatients,
  };
};
