import { useState } from 'react';
import {
  PatientSummary,
  PatientClinicalData,
  PatientGuardian,
  ClinicalEvolution,
  ClinicalAlert,
  MedicalAttachment,
  SpecialtyFieldTemplate,
  Anamnesis,
  AnamnesisVersion,
} from '@/types/prontuario';

// Mock patient data
const mockPatient: PatientSummary = {
  id: '1',
  full_name: 'Maria Silva Santos',
  birth_date: '1985-03-15',
  gender: 'Feminino',
  phone: '(11) 99999-8888',
  email: 'maria.silva@email.com',
  cpf: '123.456.789-00',
  has_clinical_alert: true,
  clinical_alert_text: 'Alérgica a Dipirona',
};

// Nova estrutura de Anamnese
const mockAnamnesis: Anamnesis = {
  id: '1',
  patient_id: '1',
  version: 3,
  is_active: true,
  
  chief_complaint: 'Paciente procura atendimento para acompanhamento de hipertensão e diabetes, além de queixas recorrentes de cefaleia.',
  current_disease_history: 'Paciente com diagnóstico de HAS há 10 anos e DM2 há 5 anos. Faz uso regular de medicações. Refere episódios frequentes de cefaleia holocraniana, geralmente relacionados a picos tensionais. Última crise há 3 dias, com melhora após uso de Paracetamol.',
  
  pre_existing_conditions: ['Hipertensão Arterial Sistêmica', 'Diabetes Mellitus Tipo 2', 'Obesidade Grau I'],
  allergies: ['Dipirona', 'Penicilina'],
  current_medications: ['Losartana 50mg 1x/dia', 'Metformina 850mg 2x/dia', 'AAS 100mg 1x/dia'],
  
  family_history: 'Pai: IAM aos 65 anos (falecido)\nMãe: DM2, HAS, viva aos 78 anos\nIrmão: HAS, 58 anos\nAvó materna: CA mama aos 70 anos',
  
  habits: {
    smoking: 'former',
    smoking_details: 'Parou há 5 anos. Fumou por 15 anos, 1 maço/dia.',
    alcohol: 'social',
    alcohol_details: 'Consumo ocasional em eventos sociais',
    physical_activity: 'light',
    physical_activity_details: 'Caminhada 2x por semana, 30 minutos',
    diet_notes: 'Dieta com restrição de sal e açúcar',
    sleep_notes: 'Sono regular, 7h por noite'
  },
  
  blood_type: 'O+',
  clinical_restrictions: 'Evitar anti-inflamatórios não esteroides (AINEs) pelo risco cardiovascular. Evitar medicamentos que contenham Dipirona.',
  general_observations: 'Paciente colaborativa, comparece regularmente às consultas. Boa adesão ao tratamento medicamentoso. Necessita melhorar adesão à dieta.',
  
  created_by: 'user-1',
  created_by_name: 'Dr. Carlos Mendes',
  created_at: '2024-01-01T10:00:00Z',
  updated_by: 'user-2',
  updated_by_name: 'Dra. Ana Paula Ferreira',
  updated_at: '2024-01-20T14:30:00Z',
};

const mockAnamnesisVersions: AnamnesisVersion[] = [
  {
    id: 'v3',
    anamnesis_id: '1',
    version: 3,
    data: mockAnamnesis,
    changed_by: 'user-2',
    changed_by_name: 'Dra. Ana Paula Ferreira',
    changed_at: '2024-01-20T14:30:00Z',
    change_summary: 'Atualização de medicamentos e observações'
  },
  {
    id: 'v2',
    anamnesis_id: '1',
    version: 2,
    data: mockAnamnesis,
    changed_by: 'user-1',
    changed_by_name: 'Dr. Carlos Mendes',
    changed_at: '2024-01-15T10:00:00Z',
    change_summary: 'Adição de histórico familiar'
  },
  {
    id: 'v1',
    anamnesis_id: '1',
    version: 1,
    data: mockAnamnesis,
    changed_by: 'user-1',
    changed_by_name: 'Dr. Carlos Mendes',
    changed_at: '2024-01-01T10:00:00Z',
    change_summary: 'Criação inicial'
  },
];

// Manter compatibilidade com PatientClinicalData
const mockClinicalData: PatientClinicalData = {
  id: '1',
  patient_id: '1',
  allergies: mockAnamnesis.allergies,
  chronic_diseases: mockAnamnesis.pre_existing_conditions,
  current_medications: mockAnamnesis.current_medications,
  family_history: mockAnamnesis.family_history,
  clinical_restrictions: mockAnamnesis.clinical_restrictions,
  blood_type: mockAnamnesis.blood_type,
};

const mockGuardians: PatientGuardian[] = [
  {
    id: '1',
    patient_id: '1',
    full_name: 'João Silva Santos',
    relationship: 'Cônjuge',
    phone: '(11) 98888-7777',
    email: 'joao.silva@email.com',
    is_primary: true,
  },
];

const mockAlerts: ClinicalAlert[] = [
  {
    id: '1',
    patient_id: '1',
    alert_type: 'allergy',
    severity: 'critical',
    title: 'Alergia a Dipirona',
    description: 'Paciente apresentou reação anafilática em 2020. NUNCA prescrever dipirona ou derivados.',
    is_active: true,
    created_at: '2024-01-15T10:00:00Z',
  },
  {
    id: '2',
    patient_id: '1',
    alert_type: 'allergy',
    severity: 'critical',
    title: 'Alergia a Penicilina',
    description: 'Urticária e edema facial. Evitar betalactâmicos.',
    is_active: true,
    created_at: '2024-01-15T10:00:00Z',
  },
  {
    id: '3',
    patient_id: '1',
    alert_type: 'contraindication',
    severity: 'warning',
    title: 'Evitar AINEs',
    description: 'Risco cardiovascular aumentado. Preferir Paracetamol para analgesia.',
    is_active: true,
    created_at: '2024-01-15T10:00:00Z',
  },
  {
    id: '4',
    patient_id: '1',
    alert_type: 'medication',
    severity: 'warning',
    title: 'Uso contínuo de Losartana',
    description: 'Paciente em uso de anti-hipertensivo. Monitorar função renal.',
    is_active: true,
    created_at: '2024-01-15T10:00:00Z',
  },
  {
    id: '5',
    patient_id: '1',
    alert_type: 'exam',
    severity: 'info',
    title: 'Hemograma pendente',
    description: 'Solicitado em 10/01/2024',
    is_active: true,
    created_at: '2024-01-10T10:00:00Z',
  },
];

const mockEvolutions: ClinicalEvolution[] = [
  {
    id: '1',
    patient_id: '1',
    professional_id: '1',
    professional_name: 'Dr. Carlos Mendes',
    specialty: 'medical_general',
    evolution_type: 'consultation',
    content: {
      chief_complaint: 'Dor de cabeça persistente há 3 dias',
      hda: 'Paciente refere cefaleia holocraniana, de intensidade moderada, sem náuseas ou vômitos. Associa ao estresse do trabalho. Nega fotofobia ou fonofobia. PA no dia: 150/95mmHg.',
      physical_exam: 'Bom estado geral, afebril, PA 130/85mmHg após repouso. Ausculta cardíaca e pulmonar sem alterações.',
      diagnostic_hypothesis: 'Cefaleia tensional / Pico hipertensivo',
      prescription: 'Paracetamol 750mg de 6/6h se dor (máximo 5 dias)',
      conduct: 'Orientado sobre controle pressórico. Retorno em 7 dias se não houver melhora. Procurar emergência se cefaleia súbita intensa.',
    },
    notes: 'Paciente orientada sobre sinais de alerta. Reforçada importância da adesão ao tratamento anti-hipertensivo.',
    status: 'signed',
    next_steps: 'Retorno em 7 dias para reavaliação',
    signed_at: '2024-01-20T15:30:00Z',
    created_at: '2024-01-20T14:00:00Z',
    updated_at: '2024-01-20T15:30:00Z',
  },
  {
    id: '2',
    patient_id: '1',
    professional_id: '2',
    professional_name: 'Dra. Ana Paula Ferreira',
    specialty: 'nutrition',
    evolution_type: 'consultation',
    content: {
      food_anamnesis: 'Paciente refere alimentação irregular, com consumo excessivo de carboidratos refinados. Pula o café da manhã frequentemente. Jantar tardio.',
      weight: '78',
      height: '165',
      imc: '28.6',
      nutritional_plan: 'Dieta hipocalórica com 1500kcal/dia. Restrição de sódio (máximo 2g/dia). Baixo índice glicêmico.',
    },
    status: 'signed',
    next_steps: 'Retorno em 30 dias para acompanhamento. Trazer diário alimentar.',
    signed_at: '2024-01-15T11:00:00Z',
    created_at: '2024-01-15T10:00:00Z',
    updated_at: '2024-01-15T11:00:00Z',
  },
  {
    id: '3',
    patient_id: '1',
    professional_id: '1',
    professional_name: 'Dr. Carlos Mendes',
    specialty: 'medical_general',
    evolution_type: 'return',
    content: {
      chief_complaint: 'Retorno para avaliação de cefaleia',
      hda: 'Paciente refere melhora significativa da cefaleia após uso regular de Paracetamol e melhor controle pressórico. PA em casa variando de 120-130/80-85mmHg.',
      physical_exam: 'Bom estado geral, corada, hidratada. PA 125/80mmHg. FC 72bpm.',
      conduct: 'Alta do quadro de cefaleia. Manter medicações em uso. Retorno conforme rotina.',
    },
    status: 'draft',
    created_at: '2024-01-27T09:00:00Z',
    updated_at: '2024-01-27T09:30:00Z',
  },
];

const mockAttachments: MedicalAttachment[] = [
  {
    id: '1',
    patient_id: '1',
    file_name: 'hemograma_20240110.pdf',
    file_type: 'application/pdf',
    file_size: 256000,
    file_url: '/placeholder.svg',
    category: 'exam',
    description: 'Hemograma completo - Laboratório XYZ',
    is_before_after: false,
    created_at: '2024-01-10T10:00:00Z',
  },
  {
    id: '2',
    patient_id: '1',
    file_name: 'glicemia_hemoglobina_glicada.pdf',
    file_type: 'application/pdf',
    file_size: 180000,
    file_url: '/placeholder.svg',
    category: 'exam',
    description: 'Glicemia de jejum e HbA1c',
    is_before_after: false,
    created_at: '2024-01-08T14:00:00Z',
  },
  {
    id: '3',
    patient_id: '1',
    file_name: 'raio_x_torax.jpg',
    file_type: 'image/jpeg',
    file_size: 1500000,
    file_url: '/placeholder.svg',
    category: 'image',
    description: 'Raio-X de tórax PA e Perfil',
    is_before_after: false,
    created_at: '2024-01-05T14:00:00Z',
  },
  {
    id: '4',
    patient_id: '1',
    evolution_id: '1',
    file_name: 'receituario_20240120.pdf',
    file_type: 'application/pdf',
    file_size: 128000,
    file_url: '/placeholder.svg',
    category: 'prescription',
    description: 'Receituário - Paracetamol 750mg',
    is_before_after: false,
    created_at: '2024-01-20T15:30:00Z',
  },
  {
    id: '5',
    patient_id: '1',
    file_name: 'laudo_ecocardiograma.pdf',
    file_type: 'application/pdf',
    file_size: 320000,
    file_url: '/placeholder.svg',
    category: 'report',
    description: 'Ecocardiograma transtorácico - Normal',
    is_before_after: false,
    created_at: '2023-12-15T10:00:00Z',
  },
];

const mockSpecialtyFields: SpecialtyFieldTemplate[] = [
  // Clínica Médica Geral
  { id: '1', specialty: 'medical_general', field_name: 'chief_complaint', field_label: 'Queixa Principal', field_type: 'textarea', field_order: 1, is_required: true },
  { id: '2', specialty: 'medical_general', field_name: 'hda', field_label: 'História da Doença Atual (HDA)', field_type: 'textarea', field_order: 2, is_required: true },
  { id: '3', specialty: 'medical_general', field_name: 'medical_history', field_label: 'Histórico Médico', field_type: 'textarea', field_order: 3, is_required: false },
  { id: '4', specialty: 'medical_general', field_name: 'physical_exam', field_label: 'Exame Físico', field_type: 'textarea', field_order: 4, is_required: true },
  { id: '5', specialty: 'medical_general', field_name: 'diagnostic_hypothesis', field_label: 'Hipóteses Diagnósticas', field_type: 'textarea', field_order: 5, is_required: false },
  { id: '6', specialty: 'medical_general', field_name: 'cid10', field_label: 'CID-10', field_type: 'text', field_order: 6, is_required: false },
  { id: '7', specialty: 'medical_general', field_name: 'exams_requested', field_label: 'Solicitação de Exames', field_type: 'textarea', field_order: 7, is_required: false },
  { id: '8', specialty: 'medical_general', field_name: 'prescription', field_label: 'Prescrição', field_type: 'textarea', field_order: 8, is_required: false },
  { id: '9', specialty: 'medical_general', field_name: 'conduct', field_label: 'Conduta', field_type: 'textarea', field_order: 9, is_required: false },
  { id: '10', specialty: 'medical_general', field_name: 'guidelines', field_label: 'Orientações', field_type: 'textarea', field_order: 10, is_required: false },

  // Nutrição
  { id: '20', specialty: 'nutrition', field_name: 'food_anamnesis', field_label: 'Anamnese Alimentar', field_type: 'textarea', field_order: 1, is_required: true },
  { id: '21', specialty: 'nutrition', field_name: 'anthropometric_assessment', field_label: 'Avaliação Antropométrica', field_type: 'textarea', field_order: 2, is_required: false },
  { id: '22', specialty: 'nutrition', field_name: 'weight', field_label: 'Peso (kg)', field_type: 'number', field_order: 3, is_required: true },
  { id: '23', specialty: 'nutrition', field_name: 'height', field_label: 'Altura (cm)', field_type: 'number', field_order: 4, is_required: true },
  { id: '24', specialty: 'nutrition', field_name: 'imc', field_label: 'IMC', field_type: 'number', field_order: 5, is_required: false },
  { id: '25', specialty: 'nutrition', field_name: 'nutritional_plan', field_label: 'Plano Nutricional', field_type: 'textarea', field_order: 6, is_required: false },
];

export function useProntuarioMockData() {
  const [patient] = useState<PatientSummary>(mockPatient);
  const [anamnesis] = useState<Anamnesis>(mockAnamnesis);
  const [anamnesisVersions] = useState<AnamnesisVersion[]>(mockAnamnesisVersions);
  const [clinicalData] = useState<PatientClinicalData>(mockClinicalData);
  const [guardians] = useState<PatientGuardian[]>(mockGuardians);
  const [alerts] = useState<ClinicalAlert[]>(mockAlerts);
  const [evolutions] = useState<ClinicalEvolution[]>(mockEvolutions);
  const [attachments] = useState<MedicalAttachment[]>(mockAttachments);
  const [specialtyFields] = useState<SpecialtyFieldTemplate[]>(mockSpecialtyFields);

  const getFieldsForSpecialty = (specialty: string) => {
    return specialtyFields.filter(f => f.specialty === specialty).sort((a, b) => a.field_order - b.field_order);
  };

  return {
    patient,
    anamnesis,
    anamnesisVersions,
    clinicalData,
    guardians,
    alerts,
    evolutions,
    attachments,
    specialtyFields,
    getFieldsForSpecialty,
  };
}
