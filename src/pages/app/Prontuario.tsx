import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useSearchParams, useNavigate, useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ProntuarioTabNav, type TabNavItem } from "@/components/prontuario/ProntuarioTabNav";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { ClinicalAccessGuard } from "@/components/permissions/ClinicalAccessGuard";
import { ErrorBoundary } from "@/components/app/ErrorBoundary";
import {
  FileText, 
  ArrowLeft,
  Printer,
  Download,
  Settings,
  LayoutDashboard,
  Stethoscope,
  Clock,
  Calendar,
  Paperclip,
  Image,
  AlertTriangle,
  History,
  Plus,
  Lock,
  Shield,
  ShieldX,
  GitBranch,
  Heart,
  ClipboardList,
  Target,
  Activity,
  Pill,
  Smile,
  Crosshair,
  Camera,
  // Psychology icons
  NotebookPen,
  MapPin,
  Goal,
  Route,
  // Psychiatry icons
  BrainCircuit,
  PillIcon,
  TrendingUp,
  ClipboardCheck,
  // Nutrition icons
  Apple,
  Scale,
  Utensils,
  LineChart,
  // Aesthetics icons
  Sparkles,
  Syringe,
  Package,
  ImageIcon,
  FileCheck,
  // Physiotherapy icons
  PersonStanding,
  MessageSquare,
  Gauge,
  Move,
  Dumbbell,
  BarChart3,
  ScrollText,
  // Pediatrics icons
  Baby,
  Ruler,
  TrendingUp as GrowthChart,
  BrainCircuit as BrainDevelopment,
  ShieldCheck,
  // Gynecology icons
  CircleUser,
  CalendarDays,
  HeartPulse,
  Search,
  // Ophthalmology icons
  Eye,
  Focus,
  Microscope,
  type LucideIcon
} from "lucide-react";
import { 
  useProntuarioData, 
  useMedicalRecordSignatures, 
  useCurrentUserMedicalRecordPermissions,
  useCanEditMedicalRecord,
  type ActiveAppointment as ActiveAppointmentData,
  type TabConfig, 
  type MedicalRecordEntry,
  type TabKey,
  type ActionKey,
} from "@/hooks/prontuario";
import { useActiveSpecialty } from "@/hooks/prontuario/useActiveSpecialty";
import { useAutoPatientRedirect } from "@/hooks/prontuario/useAutoPatientRedirect";
import { getClinicalBlockLabel, YESCLIN_CLINICAL_BLOCKS, type ClinicalBlockKey } from "@/hooks/prontuario/specialtyTabsConfig";
import { isBlockEnabled } from "@/hooks/prontuario/specialtyCapabilities";
import { getVisibleTabsForSpecialty } from "@/hooks/prontuario/specialtyTabsConfig";
import { useLgpdEnforcement } from "@/hooks/lgpd";
import { useProntuarioPrint } from "@/hooks/prontuario/useProntuarioPrint";
import { useConsolidatedFillerPdf } from "@/hooks/aesthetics/useConsolidatedFillerPdf";
import { useClinicData } from "@/hooks/useClinicData";
import { PatientHeader } from "@/components/prontuario/PatientHeader";
import { ProntuarioHeader } from "@/components/prontuario/ProntuarioHeader";
import { ProntuarioSearchBar, type SearchResult } from "@/components/prontuario/ProntuarioSearchBar";
import { SearchFocusContext, type SearchFocusTarget } from "@/contexts/SearchFocusContext";
import { SearchFocusBanner } from "@/components/prontuario/SearchFocusBanner";
import { LgpdBlockingOverlay } from "@/components/prontuario/LgpdBlockingOverlay";
import { TeleconsultaContextBar } from "@/components/prontuario/TeleconsultaContextBar";
import { RemoteAttendanceBlock } from "@/components/prontuario/RemoteAttendanceBlock";
import { ActiveSessionBar } from "@/components/prontuario/ActiveSessionBar";
import { useFinalizeSession } from "@/hooks/useAppointmentSession";
import { useGlobalActiveAppointment } from "@/contexts/GlobalActiveAppointmentContext";
import type { Appointment } from "@/types/agenda";
import { ConsentCollectionDialog } from "@/components/prontuario/ConsentCollectionDialog";
import { UnifiedSignatureWizard } from "@/components/signature/UnifiedSignatureWizard";
import type { SignableDocumentContext } from "@/hooks/useUnifiedDocumentSigning";
import { SignedRecordBadge } from "@/components/prontuario/SignedRecordBadge";
import { PatientSelector } from "@/components/prontuario/PatientSelector";
import { ClinicalTimeline } from "@/components/prontuario/ClinicalTimeline";
import { SpecialtySelector } from "@/components/prontuario/SpecialtySelector";
import { OdontogramModule } from "@/components/prontuario/odontogram/OdontogramModule";
import { 
  FacialMapModule, 
  BeforeAfterModule, 
  ConsentModule, 
  VisaoGeralEsteticaBlock,
  AnamneseEsteticaBlock,
  AvaliacaoEsteticaBlock,
  EvolucoesEsteticaBlock,
  ProdutosUtilizadosBlock,
  AlertasEsteticaBlock,
  TimelineEsteticaBlock,
  EsteticaProntuarioLayout,
} from "@/components/prontuario/aesthetics";
import { VisaoGeralBlock, AnamneseBlock, EvolucoesBlock, ExameFisicoBlock, CondutaBlock, DocumentosBlock, AlertasBlock, AlertasBanner, LinhaTempoBlock, DiagnosticosBlock, PrescricoesBlock, DocumentosClinicosBlock } from "@/components/prontuario/clinica-geral";
import { VisaoGeralPsicologiaBlock, AnamnesePsicologiaBlock, SessoesPsicologiaBlock, EvolucaoCasalBlock, PlanoTerapeuticoBlock, MetasTerapeuticasBlock, InstrumentosPsicologicosBlock, TermosConsentimentosPsicologiaBlock, AlertasPsicologiaBlock, AlertasBannerPsicologia, HistoricoPsicologiaBlock, RelatorioPsicologicoBlock, RelatorioEscolarBlock, RelatorioJudicialBlock, GraficosEvolucaoPsicologia, AnaliseTendenciaPsicologia, LaudoPsicologicoBlock } from "@/components/prontuario/psicologia";
import { HipotesesDiagnosticasPsicologiaBlock } from "@/components/prontuario/psicologia/HipotesesDiagnosticasPsicologiaBlock";
import { useVisaoGeralData, useAnamneseData, useEvolucoesData, useExameFisicoData, useCondutaData, useDocumentosData, useAlertasData, useLinhaTempoData, useDiagnosticosData, usePrescricoesData } from "@/hooks/prontuario/clinica-geral";
import { useDocumentosClinicosData } from "@/hooks/prontuario/clinica-geral/useDocumentosClinicosData";
import { useVisaoGeralPsicologiaData, useAnamnesePsicologiaData, useSessoesPsicologiaData, usePlanoTerapeuticoData, useMetasTerapeuticasData, useInstrumentosPsicologicosData, useAlertasPsicologiaData } from "@/hooks/prontuario/psicologia";
import { 
  EvolucoesNutricaoBlock, 
  EvolucaoRetornoBlock,
  AvaliacaoNutricionalBlock, 
  AvaliacaoNutricionalInicialBlock,
  AvaliacaoClinicaBlock, 
  DiagnosticoNutricionalBlock, 
  PlanoAlimentarBlock,
  VisaoGeralNutricaoBlock,
  AnamneseNutricionalBlock,
  AlertasNutricaoBlock,
  AlertasBannerNutricao,
  LinhaTempoNutricaoBlock,
} from "@/components/prontuario/nutricao";
import {
  VisaoGeralFisioterapiaBlock,
  AnamneseFisioterapiaBlock,
  AvaliacaoFuncionalBlock,
  AvaliacaoDorBlock,
  DiagnosticoFuncionalBlock,
  PlanoTerapeuticoBlock as PlanoTerapeuticoFisioBlock,
  SessoesFisioterapiaBlock,
  ExerciciosPrescritosBlock,
  ExamesDocumentosBlock as ExamesDocumentosFisioBlock,
  AlertasFuncionaisBlock,
  AlertasFuncionaisBanner,
  HistoricoFisioterapiaBlock,
} from "@/components/prontuario/fisioterapia";
import {
  VisaoGeralPilatesBlock,
  AnamneseFuncionalPilatesBlock,
  AvaliacaoFuncionalPilatesBlock,
  AvaliacaoPosturalPilatesBlock,
  AvaliacaoDorPilatesBlock,
  PlanoExerciciosPilatesBlock,
  SessoesPilatesBlock,
  ExamesDocumentosPilatesBlock,
  AlertasFuncionaisPilatesBlock,
  AlertasFuncionaisBanner as AlertasFuncionaisBannerPilates,
  HistoricoPilatesBlock,
} from "@/components/prontuario/pilates";
import {
  VisaoGeralPediatriaBlock,
  AnamnesePediatriaBlock,
  CrescimentoDesenvolvimentoBlock,
  AvaliacaoClinicaPediatriaBlock,
  DiagnosticoPediatriaBlock,
  PrescricoesPediatriaBlock,
  VacinacaoPediatriaBlock,
  EvolucoesPediatriaBlock,
  AlertasPediatriaBlock,
  AlertasPediatriaBanner,
  LinhaDoTempoPediatriaBlock,
} from "@/components/prontuario/pediatria";
import { AnamneseDermatologiaBlock } from "@/components/prontuario/dermatologia/AnamneseDermatologiaBlock";
import {
  VisaoGeralDermatoBlock,
  ExameDermatoBlock,
  PrescricoesDermatoBlock,
  EvolucoesDermatoBlock,
  ImagensDermatoBlock,
  AlertasDermatoBlock,
  LinhaDoTempoDermatoBlock,
} from "@/components/prontuario/dermatologia";
import { AnamnesePediatriaWrapper } from "@/components/prontuario/pediatria/AnamnesePediatriaWrapper";
import { CrescimentoDesenvolvimentoWrapper } from "@/components/prontuario/pediatria/CrescimentoDesenvolvimentoWrapper";
import { PlanoCondutaDermatoBlock } from "@/components/prontuario/dermatologia/PlanoCondutaDermatoBlock";
import { DiagnosticoDermatoWrapper } from "@/components/prontuario/dermatologia/DiagnosticoDermatoWrapper";
import { DiagnosticoOdontologicoWrapper } from "@/components/prontuario/odontology/DiagnosticoOdontologicoWrapper";
import {
  OdontologiaVisaoGeralBlock,
  AnamneseOdontologicaBlock,
  AvaliacaoClinicaOdontologicaBlock,
  PlanoTratamentoOdontologicoBlock,
  EvolucoesOdontologicasBlock,
  ProcedimentosRealizadosBlock as ProcedimentosOdontoBlock,
  MateriaisUtilizadosBlock,
  ExamesDocumentosBlock as ExamesDocumentosOdontoBlock,
  HistoricoTimelineBlock as HistoricoTimelineOdontoBlock,
} from "@/components/prontuario/odontology";
import {
  useEvolucoesNutricaoData, 
  useAvaliacaoNutricionalData, 
  usePlanoAlimentarData,
  useVisaoGeralNutricaoData,
  useAnamneseNutricionalData,
  useAlertasNutricaoData,
  useLinhaTempoNutricaoData,
} from "@/hooks/prontuario/nutricao";
import {
  useVisaoGeralFisioterapiaData,
} from "@/hooks/prontuario/fisioterapia";
// Pilates hooks are NOT imported here - components use hooks internally
import { useConsentTerms, usePatientConsents } from "@/hooks/lgpd";
import { Link } from "react-router-dom";
import { cn } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { removeGlobalActiveAppointment } from "@/lib/globalActiveAppointments";

// Icon mapping for dynamic tabs
const ICON_MAP: Record<string, LucideIcon> = {
  LayoutDashboard,
  FileText,
  Stethoscope,
  Clock,
  Calendar,
  Paperclip,
  Image,
  AlertTriangle,
  History,
  Activity,
  Pill,
  FolderOpen: Paperclip,
  Shield: AlertTriangle,
  GitBranch,
  Heart,
  ClipboardList,
  Target,
  Smile,
  Crosshair,
  Camera,
  // Psychology icons
  NotebookPen,
  Goal,
  Route,
  // Psychiatry icons
  BrainCircuit,
  PillIcon,
  TrendingUp,
  ClipboardCheck,
  // Nutrition icons
  Apple,
  Scale,
  Utensils,
  LineChart,
  // Aesthetics icons
  Sparkles,
  Syringe,
  Package,
  ImageIcon,
  FileCheck,
  // Physiotherapy icons
  PersonStanding,
  MessageSquare,
  Gauge,
  Move,
  Dumbbell,
  BarChart3,
  ScrollText,
  // Pediatrics icons
  Baby,
  Ruler,
  GrowthChart,
  BrainDevelopment,
  ShieldCheck,
  // Gynecology icons
  CircleUser,
  CalendarDays,
  HeartPulse,
  Search,
  // Ophthalmology icons
  Eye,
  Focus,
  Microscope,
};

// Tab key mapping to standard keys
const TAB_KEY_MAP: Record<string, TabKey> = {
  resumo: 'resumo',
  anamnese: 'anamnese',
  sinais_vitais: 'anamnese', // Map vital signs to anamnese for permissions
  odontograma: 'anamnese', // Map odontogram to anamnese for permissions
  tooth_procedures: 'procedimentos', // Map tooth procedures to procedimentos
  fotos_intraorais: 'documentos', // Map intraoral photos to documentos
  evolucao: 'evolucao',
  diagnostico: 'diagnostico',
  exames_solicitacao: 'exames', // Map exam requests to exames
  conduta: 'evolucao', // Map conduct to evolucao for permissions
  procedimentos: 'procedimentos',
  documentos_clinicos: 'prescricoes', // Map documentos clínicos to prescricoes for permissions
  prescricoes: 'prescricoes',
  exames: 'exames',
  documentos: 'documentos',
  consentimentos: 'consentimentos',
  auditoria: 'auditoria',
  alertas: 'resumo', // Map alertas to resumo for permission check
  historico: 'auditoria', // Map historico to auditoria
  imagens: 'documentos', // Map imagens to documentos
  timeline: 'auditoria', // Map timeline to auditoria for permission check
  // Psychology tabs - map to evolucao for permissions
  session_record: 'evolucao',
  therapeutic_goals: 'evolucao',
  therapeutic_plan: 'evolucao',
  // Psychiatry tabs - map to appropriate permissions
  diagnosis_dsm: 'diagnostico',
  psychiatric_prescription: 'prescricoes',
  symptom_evolution: 'evolucao',
  medication_history: 'prescricoes',
  // Nutrition tabs - map to appropriate permissions
  nutritional_assessment: 'anamnese',
  body_measurements: 'anamnese',
  meal_plan: 'evolucao',
  nutritional_evolution: 'evolucao',
  // Aesthetics tabs - map to appropriate permissions
  aesthetic_assessment: 'anamnese',
  aesthetic_procedure: 'procedimentos',
  products_used: 'procedimentos',
  before_after_photos: 'documentos',
  consent_form: 'consentimentos',
  facial_map: 'procedimentos', // Map facial map to procedimentos
  aesthetic_consent: 'consentimentos', // Map aesthetic consent to consentimentos
  // Physiotherapy tabs - map to appropriate permissions
  functional_assessment: 'anamnese',
  avaliacao_funcional: 'anamnese',
  avaliacao_dor: 'anamnese',
  exercicios_prescritos: 'procedimentos',
  chief_complaint: 'anamnese',
  pain_scale: 'anamnese',
  range_of_motion: 'anamnese',
  physio_therapeutic_plan: 'evolucao',
  applied_exercises: 'procedimentos',
  session_evolution: 'evolucao',
  // Pediatrics tabs - map to appropriate permissions
  anamnese_pediatrica: 'anamnese',
  crescimento_desenvolvimento: 'anamnese',
  avaliacao_clinica_pediatrica: 'anamnese',
  diagnostico_pediatrico: 'diagnostico',
  prescricoes_pediatricas: 'prescricoes',
  vacinacao: 'anamnese',
  pediatric_anamnesis: 'anamnese',
  gestational_history: 'anamnese',
  growth_data: 'anamnese',
  growth_curve: 'anamnese',
  neuropsychomotor_development: 'anamnese',
  vaccines: 'anamnese',
  pediatric_diagnosis: 'diagnostico',
  pediatric_conduct: 'evolucao',
  pediatric_evolution: 'evolucao',
  // Gynecology tabs - map to appropriate permissions
  gyneco_anamnesis: 'anamnese',
  gyneco_data: 'anamnese',
  obstetric_history: 'anamnese',
  gyneco_exam: 'anamnese',
  gyneco_exams_results: 'exames',
  gyneco_diagnosis: 'diagnostico',
  gyneco_conduct: 'evolucao',
  gyneco_evolution: 'evolucao',
  // Ophthalmology tabs - map to appropriate permissions
  ophthalmo_anamnesis: 'anamnese',
  visual_acuity: 'anamnese',
  ophthalmo_exam: 'anamnese',
  intraocular_pressure: 'anamnese',
  ophthalmo_diagnosis: 'diagnostico',
  ophthalmo_complementary_exams: 'exames',
  ophthalmo_conduct: 'evolucao',
  ophthalmo_evolution: 'evolucao',
};

// Fallback nav items when no config exists
const DEFAULT_NAV_ITEMS = [
  { id: 'resumo', label: 'Visão Geral', icon: LayoutDashboard },
  { id: 'anamnese', label: 'Anamnese', icon: FileText },
  { id: 'sinais_vitais', label: 'Sinais Vitais', icon: Heart },
  { id: 'odontograma', label: 'Odontograma', icon: Smile },
  { id: 'tooth_procedures', label: 'Procedimentos por Dente', icon: Crosshair },
  { id: 'evolucao', label: 'Evoluções', icon: Activity },
  { id: 'diagnostico', label: 'Diagnóstico (CID)', icon: Stethoscope },
  { id: 'exames_solicitacao', label: 'Solicitar Exames', icon: ClipboardList },
  { id: 'conduta', label: 'Plano/Conduta', icon: Target },
  { id: 'documentos_clinicos', label: 'Documentos Clínicos', icon: ScrollText },
  
  { id: 'fotos_intraorais', label: 'Fotos Intraorais', icon: Camera },
  { id: 'exames', label: 'Exames / Documentos', icon: Paperclip },
  { id: 'timeline', label: 'Linha do Tempo', icon: GitBranch },
  { id: 'alertas', label: 'Alertas', icon: AlertTriangle },
  { id: 'historico', label: 'Histórico', icon: History },
  // Psychology tabs
  { id: 'session_record', label: 'Registro de Sessão', icon: NotebookPen },
  { id: 'therapeutic_goals', label: 'Objetivos Terapêuticos', icon: Goal },
  { id: 'therapeutic_plan', label: 'Plano Terapêutico', icon: Route },
  // Psychiatry tabs
  { id: 'diagnosis_dsm', label: 'Diagnóstico (CID/DSM)', icon: BrainCircuit },
  { id: 'psychiatric_prescription', label: 'Prescrição Medicamentosa', icon: PillIcon },
  { id: 'symptom_evolution', label: 'Evolução de Sintomas', icon: TrendingUp },
  { id: 'medication_history', label: 'Histórico de Medicamentos', icon: ClipboardCheck },
// Nutrition tabs (usando os IDs corretos do sistema)
  { id: 'avaliacao_nutricional', label: 'Avaliação Nutricional Inicial', icon: Apple },
  { id: 'avaliacao_clinica', label: 'Avaliação Antropométrica', icon: Scale },
  { id: 'diagnostico_nutricional', label: 'Diagnóstico Nutricional', icon: ClipboardCheck },
  { id: 'plano_alimentar', label: 'Plano Alimentar', icon: Utensils },
  // Aesthetics tabs (using correct system IDs from yesclinSpecialties)
  { id: 'exame_fisico', label: 'Avaliação Estética', icon: Sparkles },
  { id: 'procedimentos_realizados', label: 'Procedimentos Realizados', icon: Syringe },
  
  { id: 'before_after_photos', label: 'Fotos Antes/Depois', icon: ImageIcon },
  { id: 'termos_consentimentos', label: 'Termos de Consentimento', icon: FileCheck },
  { id: 'facial_map', label: 'Mapa Facial', icon: MapPin },
  // Physiotherapy tabs (using correct system IDs)
  { id: 'avaliacao_funcional', label: 'Avaliação Funcional', icon: PersonStanding },
  { id: 'avaliacao_dor', label: 'Avaliação de Dor', icon: Gauge },
  { id: 'exercicios_prescritos', label: 'Exercícios Prescritos', icon: Dumbbell },
  { id: 'functional_assessment', label: 'Avaliação Funcional', icon: PersonStanding },
  { id: 'chief_complaint', label: 'Queixa Principal', icon: MessageSquare },
  { id: 'pain_scale', label: 'Escala de Dor', icon: Gauge },
  { id: 'range_of_motion', label: 'Amplitude de Movimento', icon: Move },
  { id: 'physio_therapeutic_plan', label: 'Plano Terapêutico', icon: ClipboardList },
  { id: 'applied_exercises', label: 'Exercícios Aplicados', icon: Dumbbell },
  { id: 'session_evolution', label: 'Evolução por Sessão', icon: BarChart3 },
  // Pediatrics tabs (correct system IDs from yesclinSpecialties)
  { id: 'anamnese_pediatrica', label: 'Anamnese Pediátrica', icon: Baby },
  { id: 'crescimento_desenvolvimento', label: 'Crescimento e Desenvolvimento', icon: Ruler },
  { id: 'avaliacao_clinica_pediatrica', label: 'Avaliação Clínica', icon: Stethoscope },
  { id: 'diagnostico_pediatrico', label: 'Diagnóstico Pediátrico', icon: ClipboardCheck },
  { id: 'prescricoes_pediatricas', label: 'Prescrições', icon: Pill },
  { id: 'vacinacao', label: 'Vacinação', icon: ShieldCheck },
  // Gynecology tabs
  { id: 'gyneco_anamnesis', label: 'Anamnese Ginecológica', icon: CircleUser },
  { id: 'gyneco_data', label: 'Dados Ginecológicos', icon: CalendarDays },
  { id: 'obstetric_history', label: 'Histórico Obstétrico (G/P/A)', icon: HeartPulse },
  { id: 'gyneco_exam', label: 'Exame Ginecológico', icon: Search },
  { id: 'gyneco_exams_results', label: 'Exames/Resultados', icon: ClipboardList },
  { id: 'gyneco_diagnosis', label: 'Diagnóstico', icon: Stethoscope },
  { id: 'gyneco_conduct', label: 'Conduta/Prescrição', icon: Target },
  { id: 'gyneco_evolution', label: 'Evolução Clínica', icon: Activity },
  // Ophthalmology tabs
  { id: 'ophthalmo_anamnesis', label: 'Anamnese Oftalmológica', icon: Eye },
  { id: 'visual_acuity', label: 'Acuidade Visual (OD/OE)', icon: Focus },
  { id: 'ophthalmo_exam', label: 'Exame Oftalmológico', icon: Microscope },
  { id: 'intraocular_pressure', label: 'Pressão Intraocular (OD/OE)', icon: Gauge },
  { id: 'ophthalmo_diagnosis', label: 'Diagnóstico (OD/OE)', icon: Stethoscope },
  { id: 'ophthalmo_complementary_exams', label: 'Exames Complementares', icon: ClipboardList },
  { id: 'ophthalmo_conduct', label: 'Conduta/Prescrição', icon: Target },
  { id: 'ophthalmo_evolution', label: 'Evolução Clínica', icon: Activity },
];

export default function Prontuario() {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const params = useParams<{ patientId: string }>();
  // Support both /app/prontuario/:patientId (path) and ?paciente=ID (legacy query param)
  const patientId = params.patientId || searchParams.get('paciente');

  // Auto-redirect: when no patientId, check for active appointment and redirect
  const { isCheckingAutoRedirect } = useAutoPatientRedirect(!patientId ? false : true);

  
  const {
    patient,
    patientLoading,
    clinicalData: prontuarioClinicalData,
    clinicalDataLoading,
    config,
    getActiveTabs,
    entries,
    entriesLoading,
    files,
    filesLoading,
    activeAlerts,
    criticalAlerts,
    loading,
    getEntriesForTab,
    getFilesForTab,
  } = useProntuarioData(patientId);

  // Print & Export
  const { handlePrint, handleExport, printing, exporting } = useProntuarioPrint();
  const { generateConsolidatedPdf, exporting: exportingFiller } = useConsolidatedFillerPdf();
  const { clinic, getFormattedAddress } = useClinicData();

  // LGPD Enforcement and Feature Flags
  const {
    hasValidConsent,
    isEnforcementEnabled,
    shouldBlockEditing,
    shouldHideContent,
    isDigitalSignatureEnabled,
    isAuditLogsEnabled,
    isTabPermissionsEnabled,
    activeTermId,
    activeTermVersion,
    activeTermTitle,
    activeTermContent,
    loading: lgpdLoading,
    granting: lgpdGranting,
    grantConsent,
  } = useLgpdEnforcement(patientId);

  // Digital Signatures — read-only helpers (signing handled by UnifiedSignatureWizard)
  const {
    signatures,
    fetchSignaturesForPatient,
    getSignatureForRecord,
    isRecordSigned,
  } = useMedicalRecordSignatures();

  // Granular Permissions (only used if tab permissions are enabled)
  const {
    loading: permLoading,
    canViewTab: rawCanViewTab,
    canEditTab: rawCanEditTab,
    canExportTab: rawCanExportTab,
    canSignTab: rawCanSignTab,
    canPerformAction: rawCanPerformAction,
    getVisibleTabs,
    logDeniedAction,
    isAdmin,
  } = useCurrentUserMedicalRecordPermissions();

  // Active appointment check for edit control
  const preferredAppointmentId = searchParams.get('appointmentId');
  const preferredStartedAt = searchParams.get('started_at');
  const {
    canEdit: hasActiveAppointment,
    activeAppointment,
    reason: appointmentReason,
    isLoading: appointmentLoading,
  } = useCanEditMedicalRecord(patientId, preferredAppointmentId);
  const resolvedActiveStartedAt = activeAppointment?.started_at ?? preferredStartedAt ?? null;

  // Use global active appointments as primary source for session bar visibility
  const {
    appointments: globalActiveAppointments,
    setSelectedAppointment: setGlobalSelectedAppointment,
    closeDrawer: closeGlobalActiveDrawer,
  } = useGlobalActiveAppointment();

  // Find the global active appointment matching this patient/appointment
  const globalActiveForCurrent = useMemo(() => {
    if (!patientId) return null;
    // First try by preferredAppointmentId
    if (preferredAppointmentId) {
      const found = globalActiveAppointments.find(a => a.id === preferredAppointmentId);
      if (found) return found;
    }
    // Then try by local activeAppointment id
    if (activeAppointment?.id) {
      const found = globalActiveAppointments.find(a => a.id === activeAppointment.id);
      if (found) return found;
    }
    // Then try by patient_id
    return globalActiveAppointments.find(a => a.patient_id === patientId) ?? null;
  }, [globalActiveAppointments, patientId, preferredAppointmentId, activeAppointment?.id]);

  const fallbackActiveSessionBarAppointmentId = preferredAppointmentId ?? activeAppointment?.id ?? null;
  const fallbackActiveSessionBarStartedAt = preferredStartedAt ?? activeAppointment?.started_at ?? null;
  const activeSessionBarAppointmentId = globalActiveForCurrent?.id ?? fallbackActiveSessionBarAppointmentId;
  const activeSessionBarStartedAt = globalActiveForCurrent?.started_at ?? fallbackActiveSessionBarStartedAt;
  const shouldShowActiveSessionBar = Boolean(activeSessionBarAppointmentId && activeSessionBarStartedAt);

  // Session finalization
  const finalizeSession = useFinalizeSession();

  const handleFinalizeFromProntuario = useCallback(async () => {
    const appointmentIdToFinalize = activeSessionBarAppointmentId ?? activeAppointment?.id;
    if (!appointmentIdToFinalize) return;
    try {
      await finalizeSession.mutateAsync({ appointmentId: appointmentIdToFinalize });
      const { supabase } = await import("@/integrations/supabase/client");
      await supabase
        .from("appointments")
        .update({ status: "finalizado", finished_at: new Date().toISOString() })
        .eq("id", appointmentIdToFinalize);

      // Clear local active-appointment cache
      queryClient
        .getQueriesData<ActiveAppointmentData | null>({ queryKey: ["active-appointment"] })
        .forEach(([queryKey, cachedAppointment]) => {
          if (cachedAppointment?.id === appointmentIdToFinalize) {
            queryClient.setQueryData(queryKey, null);
          }
        });

      [
        ["active-appointment", patientId, preferredAppointmentId],
        ["active-appointment", patientId, appointmentIdToFinalize],
        ["active-appointment", patientId, undefined],
        ["active-appointment", patientId, null],
        ["active-appointment", null, preferredAppointmentId],
        ["active-appointment", undefined, preferredAppointmentId],
      ].forEach((queryKey) => {
        queryClient.setQueryData(queryKey, null);
      });

      removeGlobalActiveAppointment(queryClient, appointmentIdToFinalize);

      const nextGlobalAppointment = globalActiveAppointments.find((appointment) => appointment.id !== appointmentIdToFinalize) ?? null;
      if (nextGlobalAppointment) {
        setGlobalSelectedAppointment(nextGlobalAppointment);
      } else {
        setGlobalSelectedAppointment(null);
        closeGlobalActiveDrawer();
      }

      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["active-appointment"] }),
        queryClient.invalidateQueries({ queryKey: ["appointments"] }),
        queryClient.invalidateQueries({ queryKey: ["appointment-session", appointmentIdToFinalize] }),
        queryClient.invalidateQueries({ queryKey: ["global-active-appointments"] }),
      ]);
      const { toast } = await import("sonner");
      toast.success("Atendimento finalizado com sucesso");
    } catch (e) {
      console.error("Error finalizing:", e);
      const { toast } = await import("sonner");
      toast.error("Erro ao finalizar atendimento");
    }
  }, [activeSessionBarAppointmentId, activeAppointment?.id, closeGlobalActiveDrawer, finalizeSession, globalActiveAppointments, patientId, preferredAppointmentId, queryClient, setGlobalSelectedAppointment]);

  const {
    activeSpecialtyId,
    activeSpecialty,
    activeSpecialtyName,
    activeSpecialtyKey,
    activeSpecialtySlug,
    specialties,
    isFromAppointment: isSpecialtyFromAppointment,
    setActiveSpecialty,
    loading: specialtyLoading,
    isResolved: isSpecialtyResolved,
    noSpecialtyConfigured,
  } = useActiveSpecialty(patientId, preferredAppointmentId);

  const [activeTab, setActiveTab] = useState("resumo");
  const [loadedTabs, setLoadedTabs] = useState<Set<string>>(() => new Set());
  const [highlightedId, setHighlightedId] = useState<string | null>(null);
  const [searchFocus, setSearchFocus] = useState<SearchFocusTarget | null>(null);
  const [consentDialogOpen, setConsentDialogOpen] = useState(false);
  const [signatureDialogOpen, setSignatureDialogOpen] = useState(false);
  const [selectedEntryForSignature, setSelectedEntryForSignature] = useState<MedicalRecordEntry | null>(null);
  const highlightTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const shouldLoadTab = useCallback((...tabKeys: string[]) => {
    return tabKeys.some((tabKey) => loadedTabs.has(tabKey));
  }, [loadedTabs]);

  useEffect(() => {
    setLoadedTabs((prev) => {
      if (prev.has(activeTab)) return prev;
      const next = new Set(prev);
      next.add(activeTab);
      return next;
    });
  }, [activeTab]);

  // Visão Geral Data - specific for Clínica Geral specialty
  const {
    patient: visaoGeralPatient,
    clinicalData: visaoGeralClinicalData,
    alerts: visaoGeralAlerts,
    lastAppointment: visaoGeralLastAppointment,
    loading: visaoGeralLoading,
  } = useVisaoGeralData(shouldLoadTab('resumo') ? patientId : null);

  // Visão Geral Data - specific for Psicologia specialty
  const {
    patient: psicologiaPatient,
    summary: psicologiaSummary,
    loading: psicologiaVisaoGeralLoading,
  } = useVisaoGeralPsicologiaData(shouldLoadTab('resumo') ? patientId : null);

  // Anamnese Data - specific for Clínica Geral specialty
  const {
    currentAnamnese,
    anamneseHistory,
    loading: anamneseLoading,
    saving: anamneseSaving,
    saveAnamnese,
    updateAnamnese,
  } = useAnamneseData(shouldLoadTab('anamnese') ? patientId : null);

  // Anamnese Psicológica Data - specific for Psicologia specialty
  const {
    currentAnamnese: currentAnamnesePsico,
    anamneseHistory: anamneseHistoryPsico,
    loading: anamnesePsicoLoading,
    saving: anamnesePsicoSaving,
    saveAnamnese: saveAnamnesePsico,
    updateAnamnese: updateAnamnesePsico,
  } = useAnamnesePsicologiaData(shouldLoadTab('anamnese', 'historico', 'timeline') ? patientId : null);

  // Evoluções Data - specific for Clínica Geral specialty
  const {
    evolucoes,
    loading: evolucoesLoading,
    saving: evolucoesSaving,
    currentProfessionalId,
    currentProfessionalName,
    saveEvolucao,
    signEvolucao,
  } = useEvolucoesData(shouldLoadTab('evolucao', 'exame_fisico', 'conduta') ? patientId : null);

  // Sessões Psicológicas Data - specific for Psicologia specialty
  const {
    sessoes: sessoesPsico,
    loading: sessoesPsicoLoading,
    saving: sessoesPsicoSaving,
    saveSessao: saveSessaoPsico,
    signSessao: signSessaoPsico,
  } = useSessoesPsicologiaData(shouldLoadTab('evolucao', 'historico', 'timeline') ? patientId : null, currentProfessionalId || undefined);

  // Evoluções Nutricionais Data - specific for Nutrição specialty
  const {
    evolucoes: evolucoesNutricao,
    loading: evolucoesNutricaoLoading,
    saving: evolucoesNutricaoSaving,
    saveEvolucao: saveEvolucaoNutricao,
    signEvolucao: signEvolucaoNutricao,
  } = useEvolucoesNutricaoData(shouldLoadTab('evolucao') ? patientId : null, currentProfessionalId || undefined);

  // Avaliação Antropométrica Data - specific for Nutrição specialty
  const {
    avaliacoes: avaliacoesNutricao,
    currentAvaliacao: currentAvaliacaoNutricao,
    loading: avaliacoesNutricaoLoading,
    saving: avaliacoesNutricaoSaving,
    saveAvaliacao: saveAvaliacaoNutricao,
  } = useAvaliacaoNutricionalData(shouldLoadTab('avaliacao_clinica') ? patientId : null, currentProfessionalId || undefined);

  // Plano Alimentar Data - specific for Nutrição specialty
  const {
    planos: planosAlimentares,
    planoAtivo: planoAlimentarAtivo,
    loading: planosAlimentaresLoading,
    saving: planosAlimentaresSaving,
    savePlano: savePlanoAlimentar,
    deactivatePlano: deactivatePlanoAlimentar,
  } = usePlanoAlimentarData(shouldLoadTab('plano_alimentar') ? patientId : null, currentProfessionalId || undefined);

  // Visão Geral Nutricional Data - specific for Nutrição specialty
  const {
    patient: nutricaoPatient,
    summary: nutricaoSummary,
    alerts: nutricaoAlerts,
    loading: nutricaoVisaoGeralLoading,
  } = useVisaoGeralNutricaoData(shouldLoadTab('resumo') ? patientId : null);

  // Anamnese Nutricional Data - specific for Nutrição specialty
  const {
    currentAnamnese: currentAnamneseNutricao,
    anamneseHistory: anamneseHistoryNutricao,
    loading: anamneseNutricaoLoading,
    saving: anamneseNutricaoSaving,
    saveAnamnese: saveAnamneseNutricao,
  } = useAnamneseNutricionalData(shouldLoadTab('anamnese') ? patientId : null);

  // Alertas Nutrição Data - specific for Nutrição specialty
  const {
    alertas: alertasNutricao,
    activeAlertas: activeAlertasNutricao,
    loading: alertasNutricaoLoading,
    saving: alertasNutricaoSaving,
    saveAlerta: saveAlertaNutricao,
    deactivateAlerta: deactivateAlertaNutricao,
    reactivateAlerta: reactivateAlertaNutricao,
  } = useAlertasNutricaoData(shouldLoadTab('alertas') ? patientId : null);

  // Linha do Tempo Nutricional Data - specific for Nutrição specialty
  const {
    eventos: timelineEventosNutricao,
    loading: timelineNutricaoLoading,
  } = useLinhaTempoNutricaoData(shouldLoadTab('historico', 'timeline') ? patientId : null);

  // Plano Terapêutico Data - specific for Psicologia specialty
  const {
    currentPlano: currentPlanoTerapeutico,
    planoHistory: planoTerapeuticoHistory,
    loading: planoTerapeuticoLoading,
    saving: planoTerapeuticoSaving,
    savePlano: savePlanoTerapeutico,
  } = usePlanoTerapeuticoData(shouldLoadTab('conduta', 'historico', 'timeline') ? patientId : null);

  // Metas Terapêuticas Data - goal-based tracking for Psicologia
  const {
    goals: metasTerapeuticas,
    loading: metasLoading,
    saving: metasSaving,
    createGoal: createMeta,
    updateProgress: updateMetaProgress,
    updateStatus: updateMetaStatus,
    updateScaleScore: updateMetaScaleScore,
    fetchGoalUpdates: fetchMetaUpdates,
  } = useMetasTerapeuticasData(shouldLoadTab('conduta') ? patientId : null);

  // Compute latest PHQ-9 and GAD-7 scores from sessions
  const latestPHQ9Score = sessoesPsico.find(s => s.phq9_total != null)?.phq9_total ?? null;
  const latestGAD7Score = sessoesPsico.find(s => s.gad7_total != null)?.gad7_total ?? null;

  // Instrumentos Psicológicos Data - specific for Psicologia specialty
  const {
    instrumentos: instrumentosPsico,
    loading: instrumentosPsicoLoading,
    saving: instrumentosPsicoSaving,
    saveInstrumento: saveInstrumentoPsico,
    deleteInstrumento: deleteInstrumentoPsico,
  } = useInstrumentosPsicologicosData(shouldLoadTab('instrumentos', 'historico', 'timeline') ? patientId : null, currentProfessionalId || undefined);

  // Consent Terms Data - for Psicologia specialty
  const {
    terms: consentTerms,
    loading: consentTermsLoading,
  } = useConsentTerms();

  // Patient Consents Data - for Psicologia specialty
  const {
    consents: patientConsents,
    loading: patientConsentsLoading,
    saving: patientConsentsSaving,
    grantConsent: grantPatientConsent,
    revokeConsent: revokePatientConsent,
  } = usePatientConsents(shouldLoadTab('termos_consentimentos', 'historico', 'timeline') ? patientId || undefined : undefined);

  // Alertas Psicologia Data - specific for Psicologia specialty
  const {
    alertas: alertasPsico,
    activeAlertas: activeAlertasPsico,
    loading: alertasPsicoLoading,
    saving: alertasPsicoSaving,
    currentProfessionalId: alertaPsicoProfId,
    currentProfessionalName: alertaPsicoProfName,
    saveAlerta: saveAlertaPsico,
    deactivateAlerta: deactivateAlertaPsico,
    reactivateAlerta: reactivateAlertaPsico,
  } = useAlertasPsicologiaData(shouldLoadTab('alertas') ? patientId : null);

  // Exame Físico Data - specific for Clínica Geral specialty
  const {
    exames: examesFisicos,
    loading: examesFisicosLoading,
    saving: examesFisicosSaving,
    currentProfessionalId: exameProfId,
    currentProfessionalName: exameProfName,
    saveExame: saveExameFisico,
  } = useExameFisicoData(shouldLoadTab('exame_fisico') ? patientId : null);

  // Conduta Data - specific for Clínica Geral specialty
  const {
    condutas,
    loading: condutasLoading,
    saving: condutasSaving,
    currentProfessionalId: condutaProfId,
    currentProfessionalName: condutaProfName,
    saveConduta,
  } = useCondutaData(shouldLoadTab('conduta') ? patientId : null);

  // Documentos Data - specific for Clínica Geral specialty
  const {
    documentos,
    loading: documentosLoading,
    uploading: documentosUploading,
    currentProfessionalId: docProfId,
    currentProfessionalName: docProfName,
    uploadDocumento,
    deleteDocumento,
    downloadDocumento,
  } = useDocumentosData(shouldLoadTab('exames', 'fotos_intraorais') ? patientId : null);

  // Alertas Data - specific for Clínica Geral specialty
  const {
    alertas,
    activeAlertas,
    loading: alertasLoading,
    saving: alertasSaving,
    currentProfessionalId: alertaProfId,
    currentProfessionalName: alertaProfName,
    saveAlerta,
    deactivateAlerta,
    reactivateAlerta,
  } = useAlertasData(patientId);

  // Linha do Tempo Data - specific for Clínica Geral specialty
  const {
    eventos: timelineEventos,
    loading: timelineLoading,
  } = useLinhaTempoData(patientId);

  // Diagnósticos Data - specific for Clínica Geral specialty
  const {
    diagnosticos,
    loading: diagnosticosLoading,
    saving: diagnosticosSaving,
    currentProfessionalId: diagProfId,
    saveDiagnostico,
    updateDiagnostico,
  } = useDiagnosticosData(patientId);

  // Prescrições Data - specific for Clínica Geral specialty
  const {
    prescricoes,
    loading: prescricoesLoading,
    saving: prescricoesSaving,
    savePrescricao,
    signPrescricao,
  } = usePrescricoesData(patientId);

  // ===== FISIOTERAPIA HOOKS =====
  // Obter clinic_id do hook useClinicData
  const clinicIdForFisio = patient ? config?.tabs?.[0]?.clinic_id : null;
  
  // Visão Geral Fisioterapia Data
  const fisioVisaoGeral = useVisaoGeralFisioterapiaData({ 
    patientId, 
    clinicId: clinicIdForFisio || null 
  });

  // Pilates hooks are NOT needed here - components use hooks internally

  // Documentos Clínicos (Receituário / Atestado)
  const {
    documentos: documentosClinicos,
    loading: documentosClinicosLoading,
    saving: documentosClinicosSaving,
    currentProfessionalId: docClinicoProfId,
    currentProfessionalName: docClinicoProfName,
    currentProfessionalRegistration: docClinicoProfReg,
    currentProfessionalSignatureUrl: docClinicoProfSig,
    modelosPessoais: docModelosPessoais,
    modelosDocumento: docModelosDocumento,
    medicamentoSuggestions: docMedSuggestions,
    saveDocumento: saveDocumentoClinico,
    cancelDocumento: cancelDocumentoClinico,
    saveModeloPessoal: saveModeloPessoalClinico,
    deleteModeloPessoal: deleteModeloPessoalClinico,
  } = useDocumentosClinicosData(patientId);


  // Wrap permission checks to respect the enable_tab_permissions setting
  const canViewTab = (tabKey: TabKey): boolean => {
    if (!isTabPermissionsEnabled) return true;
    return rawCanViewTab(tabKey);
  };
  const canEditTab = (tabKey: TabKey): boolean => {
    if (!isTabPermissionsEnabled) return true;
    return rawCanEditTab(tabKey);
  };
  const canExportTab = (tabKey: TabKey): boolean => {
    if (!isTabPermissionsEnabled) return true;
    return rawCanExportTab(tabKey);
  };
  const canSignTab = (tabKey: TabKey): boolean => {
    if (!isTabPermissionsEnabled) return true;
    return rawCanSignTab(tabKey);
  };
  const canPerformAction = (actionKey: ActionKey): boolean => {
    if (!isTabPermissionsEnabled) return true;
    return rawCanPerformAction(actionKey);
  };

  // Track previous specialty to detect changes
  const previousSpecialtyKeyRef = useRef<string | null>(null);

  // Load signatures when patient changes
  useEffect(() => {
    if (patientId) {
      fetchSignaturesForPatient(patientId);
    }
  }, [patientId, fetchSignaturesForPatient]);

  // Get standard tab key for permission check
  const getStandardTabKey = (tabId: string): TabKey => {
    return TAB_KEY_MAP[tabId] || 'resumo';
  };

  // Check if current tab allows editing (respects LGPD blocking + permissions + active appointment)
  // ADMIN_OWNER can always edit (even without active appointment) as per security requirements
  const canEditCurrentTab = canEditTab(getStandardTabKey(activeTab)) && !shouldBlockEditing && (hasActiveAppointment || isAdmin);
  const canExportCurrentTab = canExportTab(getStandardTabKey(activeTab)) && !shouldBlockEditing;
  const canSignCurrentTab = canSignTab(getStandardTabKey(activeTab)) && !shouldBlockEditing && isDigitalSignatureEnabled && (hasActiveAppointment || isAdmin);

  // Build nav items from configuration or use defaults, filtered by permissions
  // Build nav items from specialty's enabledBlocks (source of truth),
  // using DEFAULT_NAV_ITEMS as icon lookup, filtered by permissions.
  const defaultNavLookup = useMemo(() => {
    const map: Record<string, { icon: LucideIcon }> = {};
    for (const item of DEFAULT_NAV_ITEMS) {
      map[item.id] = { icon: item.icon };
    }
    return map;
  }, []);

  const navItems = useMemo(() => {
    const enabledBlocks = getVisibleTabsForSpecialty(activeSpecialtyKey);
    
    return enabledBlocks
      .filter(blockKey => {
        const standardKey = getStandardTabKey(blockKey);
        return canViewTab(standardKey);
      })
      .map(blockKey => ({
        id: blockKey,
        label: getClinicalBlockLabel(blockKey, activeSpecialtyKey),
        icon: defaultNavLookup[blockKey]?.icon || FileText,
      }));
  }, [activeSpecialtyKey, defaultNavLookup]);

  // CRITICAL: Reset state completely when specialty changes
  // This ensures no visual artifacts from previous specialty remain
  useEffect(() => {
    const specialtyChanged = previousSpecialtyKeyRef.current !== null && 
                              previousSpecialtyKeyRef.current !== activeSpecialtyKey;
    
    if (specialtyChanged) {
      // Clear any highlighted items from previous specialty
      setHighlightedId(null);
      if (highlightTimeoutRef.current) {
        clearTimeout(highlightTimeoutRef.current);
        highlightTimeoutRef.current = null;
      }
      
      // Force reset to first valid tab for new specialty
      if (navItems.length > 0) {
        setActiveTab(navItems[0].id);
      }
    }
    
    // Update reference for next comparison
    previousSpecialtyKeyRef.current = activeSpecialtyKey;
  }, [activeSpecialtyKey, navItems]);

  // Fallback: Ensure active tab is always valid for current specialty
  useEffect(() => {
    if (navItems.length > 0 && !navItems.find(n => n.id === activeTab)) {
      setActiveTab(navItems[0].id);
    }
  }, [navItems, activeTab]);

  // Hydrate active tab from URL ?tab=... when navItems become available
  const urlTab = searchParams.get("tab");
  useEffect(() => {
    if (urlTab && navItems.find((n) => n.id === urlTab) && urlTab !== activeTab) {
      setActiveTab(urlTab);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [urlTab, navItems]);

  const shouldHoldProntuarioRendering = specialtyLoading || !isSpecialtyResolved;
  const resolvedSpecialtyName = activeSpecialty?.name ?? activeSpecialtyName ?? undefined;
  const resolvedSpecialtyId = activeSpecialty?.id ?? activeSpecialtyId;

  // Handle search result click — focus on the specific record + navigate to its tab
  const handleSearchResultClick = useCallback((result: SearchResult) => {
    const target: SearchFocusTarget = {
      type: result.type,
      tabKey: result.navigationTarget,
      sourceTable: result.sourceTable,
      sourceRecordId: result.sourceRecordId,
      appointmentId: result.appointmentId ?? null,
      highlightId: result.sourceRecordId,
      openMode: result.type === "anamnesis" ? "detail" : "focus",
    };
    setSearchFocus(target);
    setHighlightedId(result.sourceRecordId);

    // Reflect record selection in the URL for deep-linking
    setSearchParams(
      (prev) => {
        const next = new URLSearchParams(prev);
        next.set("tab", result.navigationTarget);
        next.set("recordId", result.sourceRecordId);
        return next;
      },
      { replace: true }
    );

    if (highlightTimeoutRef.current) clearTimeout(highlightTimeoutRef.current);
    highlightTimeoutRef.current = setTimeout(() => setHighlightedId(null), 4000);
  }, [setSearchParams]);

  // Navigate to tab from search
  const handleNavigateToTab = useCallback((tabKey: string) => {
    setActiveTab(tabKey);
  }, []);

  // Clear search focus + clean up URL params
  const clearSearchFocus = useCallback(() => {
    setSearchFocus(null);
    setSearchParams(
      (prev) => {
        const next = new URLSearchParams(prev);
        next.delete("recordId");
        return next;
      },
      { replace: true }
    );
  }, [setSearchParams]);

  // When user manually changes tabs, clear the focus (user wants the full list)
  const handleTabChange = useCallback((tabKey: string) => {
    setActiveTab(tabKey);
    if (searchFocus && searchFocus.tabKey !== tabKey) {
      setSearchFocus(null);
      setSearchParams(
        (prev) => {
          const next = new URLSearchParams(prev);
          next.delete("recordId");
          return next;
        },
        { replace: true }
      );
    }
  }, [searchFocus, setSearchParams]);

  // Build the SearchFocus context value
  const searchFocusContextValue = useMemo(
    () => ({
      focus: searchFocus,
      setFocus: setSearchFocus,
      clearFocus: clearSearchFocus,
      isFocused: (sourceTable: string, recordId: string) =>
        !!searchFocus && searchFocus.sourceTable === sourceTable && searchFocus.sourceRecordId === recordId,
    }),
    [searchFocus, clearSearchFocus]
  );

  // Render tab content dynamically (wrapped in clinical access guard)
  const renderTabContent = () => {
    // Clinical access is already guarded at component level
    if (loading) {
      return (
        <div className="space-y-4">
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-48 w-full" />
        </div>
      );
    }

    const tabEntries = getEntriesForTab(activeTab);
    const tabFiles = getFilesForTab(activeTab);

    // ─── Estética: delegate ALL tabs to its own layout ──────────────
    if (activeSpecialtyKey === 'estetica') {
      return (
        <EsteticaProntuarioLayout
          activeTab={activeTab}
          patientId={patientId!}
          clinicId={clinicIdForFisio || null}
          appointmentId={activeAppointment?.id}
          canEdit={canEditCurrentTab}
          specialtyId={resolvedSpecialtyId}
          professionalId={currentProfessionalId}
          professionalName={currentProfessionalName}
          professionalRegistration={docClinicoProfReg}
          patientName={patient?.full_name}
          patientBirthDate={patient?.birth_date}
          patientPhone={patient?.phone}
          patientCpf={patient?.cpf}
          onNavigateToModule={(moduleKey) => setActiveTab(moduleKey)}
        />
      );
    }

    switch (activeTab) {
      case 'resumo':
        // Render specialty-specific Visão Geral
        if (activeSpecialtyKey === 'psicologia') {
          return (
            <VisaoGeralPsicologiaBlock
              patient={psicologiaPatient}
              summary={psicologiaSummary}
              loading={psicologiaVisaoGeralLoading}
            />
          );
        }
        if (activeSpecialtyKey === 'nutricao') {
          return (
            <VisaoGeralNutricaoBlock
              patient={nutricaoPatient}
              summary={nutricaoSummary}
              alerts={nutricaoAlerts}
              loading={nutricaoVisaoGeralLoading}
              canEdit={canEditCurrentTab}
              onNavigateToModule={(moduleKey) => {
                // Navigate to the specified module tab
                setActiveTab(moduleKey);
              }}
            />
          );
        }
        if (activeSpecialtyKey === 'fisioterapia') {
          return (
            <VisaoGeralFisioterapiaBlock
              patient={fisioVisaoGeral.patient}
              summary={fisioVisaoGeral.summary}
              alerts={fisioVisaoGeral.alerts}
              loading={fisioVisaoGeral.loading}
              onNavigateToModule={(moduleKey) => setActiveTab(moduleKey)}
            />
          );
        }
        if (activeSpecialtyKey === 'pilates') {
          return (
            <VisaoGeralPilatesBlock
              patientId={patientId}
              clinicId={clinicIdForFisio || null}
              canEdit={canEditCurrentTab}
              onNavigateToModule={(moduleKey) => setActiveTab(moduleKey)}
            />
          );
        }
        // (estética handled by EsteticaProntuarioLayout above)
        if (activeSpecialtyKey === 'pediatria') {
          return (
            <VisaoGeralPediatriaBlock
              patientId={patientId}
              clinicId={clinicIdForFisio || null}
              canEdit={canEditCurrentTab}
              onNavigateToModule={(moduleKey) => setActiveTab(moduleKey)}
            />
          );
        }
        if (activeSpecialtyKey === 'dermatologia') {
          return (
            <VisaoGeralDermatoBlock
              patient={patient ? {
                id: patient.id,
                full_name: patient.full_name,
                birth_date: patient.birth_date,
                gender: patient.gender,
                phone: patient.phone,
                email: patient.email,
              } : null}
              clinicalData={{
                allergies: prontuarioClinicalData?.allergies || [],
                current_medications: prontuarioClinicalData?.current_medications || [],
              }}
              alerts={[]}
              lastAppointment={null}
              loading={loading}
              onNavigateToModule={(moduleKey) => setActiveTab(moduleKey)}
            />
          );
        }
        if (activeSpecialtyKey === 'odontologia') {
          return (
            <OdontologiaVisaoGeralBlock
              patient={patient ? {
                id: patient.id,
                full_name: patient.full_name,
                birth_date: patient.birth_date,
                gender: patient.gender,
                phone: patient.phone,
                email: patient.email,
              } : null}
              clinicalData={{
                allergies: prontuarioClinicalData?.allergies || [],
                chronic_diseases: prontuarioClinicalData?.chronic_diseases || [],
              }}
              alerts={[]}
              loading={loading}
              onNavigateToModule={(moduleKey) => setActiveTab(moduleKey)}
            />
          );
        }
        // Default: Clínica Geral - Visão Geral
        return (
          <VisaoGeralBlock
            patient={visaoGeralPatient}
            clinicalData={visaoGeralClinicalData}
            alerts={visaoGeralAlerts}
            lastAppointment={visaoGeralLastAppointment}
            loading={visaoGeralLoading}
            activeSpecialtyKey={activeSpecialtyKey}
            activeSpecialtyName={resolvedSpecialtyName}
            onNavigateToModule={(moduleKey) => {
              setActiveTab(moduleKey);
            }}
          />
        );

      case 'anamnese':
        // Estética has its own dedicated anamnese module — fully decoupled
        // (estética handled by EsteticaProntuarioLayout above)
        // All other specialties — uses generic V2 templates
        return (
          <AnamneseBlock
            currentAnamnese={activeSpecialtyKey === 'geral' ? currentAnamnese : null}
            anamneseHistory={activeSpecialtyKey === 'geral' ? anamneseHistory : []}
            loading={activeSpecialtyKey === 'geral' ? anamneseLoading : false}
            saving={activeSpecialtyKey === 'geral' ? anamneseSaving : false}
            canEdit={canEditCurrentTab}
            onSave={saveAnamnese}
            onUpdate={updateAnamnese}
            patientName={patient?.full_name}
            patientCpf={patient?.cpf}
            patientData={{
              id: patientId,
              full_name: patient?.full_name,
              birth_date: patient?.birth_date,
              gender: patient?.gender as 'M' | 'F' | 'O' | null | undefined,
              cpf: patient?.cpf,
              phone: patient?.phone,
              email: patient?.email,
              insurance_name: (patient as any)?.insurance?.insurance_name || null,
            }}
            specialtyId={resolvedSpecialtyId}
            specialtyName={resolvedSpecialtyName}
            specialtyKey={activeSpecialtyKey}
            appointmentId={activeAppointment?.id || null}
            appointmentDate={activeAppointment?.started_at || activeAppointment?.scheduled_date || null}
            professionalName={currentProfessionalName}
            professionalRegistration={docClinicoProfReg}
          />
        );

      case 'exame_fisico':
        // Estética - Avaliação Estética
        // (estética handled by EsteticaProntuarioLayout above)
        // Default: Clínica Geral / Dermatologia / Odontologia - Exame Físico
        return (
          <ExameFisicoBlock
            exames={examesFisicos}
            evolucoes={evolucoes}
            loading={examesFisicosLoading}
            saving={examesFisicosSaving}
            canEdit={canEditCurrentTab}
            currentProfessionalId={exameProfId || undefined}
            currentProfessionalName={exameProfName || undefined}
            onSave={saveExameFisico}
          />
        );

      case 'avaliacao_funcional':
        // Fisioterapia / Pilates - Avaliação Funcional
        if (activeSpecialtyKey === 'pilates') {
          return (
            <AvaliacaoFuncionalPilatesBlock
              patientId={patientId}
              clinicId={clinicIdForFisio || null}
              professionalId={currentProfessionalId || null}
              canEdit={canEditCurrentTab}
            />
          );
        }
        // Fisioterapia - Avaliação Funcional (força, ADM, postura)
        return (
          <AvaliacaoFuncionalBlock
            patientId={patientId}
            clinicId={clinicIdForFisio || null}
            professionalId={currentProfessionalId || null}
            canEdit={canEditCurrentTab}
          />
        );

      case 'avaliacao_dor':
        // Pilates - Avaliação de Dor
        if (activeSpecialtyKey === 'pilates') {
          return (
            <AvaliacaoDorPilatesBlock
              patientId={patientId}
              clinicId={clinicIdForFisio || null}
              professionalId={currentProfessionalId || null}
              canEdit={canEditCurrentTab}
            />
          );
        }
        // Fisioterapia - Avaliação de Dor (EVA, localização)
        return (
          <AvaliacaoDorBlock
            patientId={patientId}
            clinicId={clinicIdForFisio || null}
            professionalId={currentProfessionalId || null}
            canEdit={canEditCurrentTab}
          />
        );

      case 'exercicios_prescritos':
        // Fisioterapia - Exercícios Prescritos (programa domiciliar)
        return (
          <ExerciciosPrescritosBlock
            patientId={patientId}
            clinicId={clinicIdForFisio || null}
            professionalId={currentProfessionalId || null}
            canEdit={canEditCurrentTab}
          />
        );

      case 'avaliacao_nutricional':
        // Nutrição - Avaliação Nutricional Inicial
        if (!patientId) return null;
        return (
          <AvaliacaoNutricionalInicialBlock
            patientId={patientId}
            appointmentId={activeAppointment?.id}
            appointmentDate={activeAppointment?.started_at || activeAppointment?.scheduled_date || null}
            canEdit={canEditCurrentTab}
            professionalId={currentProfessionalId || undefined}
          />
        );

      case 'avaliacao_clinica':
        // Nutrição - Avaliação Antropométrica (medidas corporais)
        return (
          <AvaliacaoNutricionalBlock
            avaliacoes={avaliacoesNutricao}
            currentAvaliacao={currentAvaliacaoNutricao}
            loading={avaliacoesNutricaoLoading}
            saving={avaliacoesNutricaoSaving}
            canEdit={canEditCurrentTab}
            onSave={saveAvaliacaoNutricao}
          />
        );

      case 'diagnostico_nutricional':
        // Nutrição - Diagnóstico Nutricional
        if (!patientId) return null;
        return (
          <DiagnosticoNutricionalBlock
            patientId={patientId}
            canEdit={canEditCurrentTab}
          />
        );

      // ===== PEDIATRIA - SPECIFIC BLOCKS =====
      case 'anamnese_pediatrica':
        // Pediatria - Anamnese Pediátrica (dynamic templates)
        if (!patientId) return null;
        return (
          <AnamnesePediatriaWrapper
            patientId={patientId}
            clinicId={clinicIdForFisio || null}
            appointmentId={activeAppointment?.id}
            professionalId={currentProfessionalId || null}
            canEdit={canEditCurrentTab}
            specialtyId={activeSpecialtyId}
            procedureId={activeAppointment?.procedure_id || null}
            appointmentDate={activeAppointment?.started_at || activeAppointment?.scheduled_date || null}
          />
        );

      case 'crescimento_desenvolvimento':
        // Pediatria - Crescimento e Desenvolvimento
        if (!patientId) return null;
        return (
          <CrescimentoDesenvolvimentoWrapper
            patientId={patientId}
            clinicId={clinicIdForFisio || null}
            professionalId={currentProfessionalId || null}
            appointmentId={activeAppointment?.id}
            birthDate={patient?.birth_date}
            gender={(patient?.gender as 'M' | 'F') || undefined}
            canEdit={canEditCurrentTab}
          />
        );

      case 'avaliacao_clinica_pediatrica':
        // Pediatria - Avaliação Clínica
        if (!patientId) return null;
        return (
          <AvaliacaoClinicaPediatriaBlock
            patientId={patientId}
            isEditable={canEditCurrentTab}
          />
        );

      case 'diagnostico_pediatrico':
        // Pediatria - Diagnóstico Pediátrico
        if (!patientId) return null;
        return (
          <DiagnosticoPediatriaBlock
            patientId={patientId}
            isEditable={canEditCurrentTab}
          />
        );

      case 'prescricoes_pediatricas':
        // Pediatria - Prescrições Pediátricas
        if (!patientId) return null;
        return (
          <PrescricoesPediatriaBlock
            patientId={patientId}
            isEditable={canEditCurrentTab}
          />
        );

      case 'vacinacao':
        // Pediatria - Vacinação
        if (!patientId) return null;
        // Calculate age in months from birth_date
        const patientAgeMonths = patient?.birth_date 
          ? Math.floor((Date.now() - new Date(patient.birth_date).getTime()) / (1000 * 60 * 60 * 24 * 30.44))
          : 0;
        return (
          <VacinacaoPediatriaBlock
            patientId={patientId}
            patientAgeMonths={patientAgeMonths}
            isEditable={canEditCurrentTab}
          />
        );

      case 'evolucao':
        // Render specialty-specific Evolutions/Sessions
        if (activeSpecialtyKey === 'psicologia') {
          return (
            <div className="space-y-6">
              <AnaliseTendenciaPsicologia sessoes={sessoesPsico} />
              <GraficosEvolucaoPsicologia sessoes={sessoesPsico} />
              <SessoesPsicologiaBlock
                sessoes={sessoesPsico}
                loading={sessoesPsicoLoading}
                saving={sessoesPsicoSaving}
                canEdit={canEditCurrentTab}
                currentProfessionalId={currentProfessionalId || undefined}
                currentProfessionalName={currentProfessionalName || undefined}
                onSave={saveSessaoPsico}
                onSign={signSessaoPsico}
              />
              <EvolucaoCasalBlock
                patientId={patientId}
                patientName={patient?.full_name}
                canEdit={canEditCurrentTab}
              />
            </div>
          );
        }
        if (activeSpecialtyKey === 'nutricao') {
          if (!patientId) return null;
          return (
            <EvolucaoRetornoBlock
              patientId={patientId}
              appointmentId={activeAppointment?.id}
              canEdit={canEditCurrentTab}
              professionalId={currentProfessionalId || undefined}
            />
          );
        }
        if (activeSpecialtyKey === 'fisioterapia') {
          return (
            <SessoesFisioterapiaBlock
              patientId={patientId}
              clinicId={clinicIdForFisio || null}
              professionalId={currentProfessionalId || null}
              canEdit={canEditCurrentTab}
            />
          );
        }
        if (activeSpecialtyKey === 'pilates') {
          return (
            <SessoesPilatesBlock
              patientId={patientId}
              clinicId={clinicIdForFisio || null}
              professionalId={currentProfessionalId || null}
              canEdit={canEditCurrentTab}
            />
          );
        }
        // (estética handled by EsteticaProntuarioLayout above)
        // Default: Clínica Geral - Evoluções Clínicas
        return (
          <EvolucoesBlock
            evolucoes={evolucoes}
            loading={evolucoesLoading}
            saving={evolucoesSaving}
            canEdit={canEditCurrentTab}
            currentProfessionalId={currentProfessionalId || undefined}
            currentProfessionalName={currentProfessionalName || undefined}
            onSave={saveEvolucao}
            onSign={signEvolucao}
          />
        );

      case 'diagnostico':
        // Psicologia - Hipóteses Diagnósticas
        if (activeSpecialtyKey === 'psicologia') {
          return (
            <HipotesesDiagnosticasPsicologiaBlock
              patientId={patientId!}
              canEdit={canEditCurrentTab}
              professionalId={currentProfessionalId}
              professionalName={currentProfessionalName}
            />
          );
        }
        // Fisioterapia - Diagnóstico Funcional
        if (activeSpecialtyKey === 'fisioterapia') {
          return (
            <DiagnosticoFuncionalBlock
              patientId={patientId}
              clinicId={clinicIdForFisio || null}
              professionalId={currentProfessionalId || null}
              canEdit={canEditCurrentTab}
            />
          );
        }
        // Dermatologia - Diagnóstico Dermatológico
        if (activeSpecialtyKey === 'dermatologia') {
          return (
            <DiagnosticoDermatoWrapper
              patientId={patientId}
              appointmentId={activeAppointment?.id}
              canEdit={canEditCurrentTab}
              professionalId={currentProfessionalId}
              professionalName={currentProfessionalName}
            />
          );
        }
        // Odontologia - Diagnóstico Odontológico
        if (activeSpecialtyKey === 'odontologia') {
          return (
            <DiagnosticoOdontologicoWrapper
              patientId={patientId}
              appointmentId={activeAppointment?.id}
              canEdit={canEditCurrentTab}
              professionalId={currentProfessionalId}
              professionalName={currentProfessionalName}
            />
          );
        }
        // Clínica Geral - Hipóteses Diagnósticas (CID-10)
        return (
          <DiagnosticosBlock
            diagnosticos={diagnosticos}
            loading={diagnosticosLoading}
            saving={diagnosticosSaving}
            canEdit={canEditCurrentTab}
            onSave={saveDiagnostico}
            onUpdate={updateDiagnostico}
          />
        );
      case 'conduta':
        // Render specialty-specific Conduta/Plano
        if (activeSpecialtyKey === 'psicologia') {
          return (
            <div className="space-y-8">
              <MetasTerapeuticasBlock
                goals={metasTerapeuticas}
                loading={metasLoading}
                saving={metasSaving}
                canEdit={canEditCurrentTab}
                onCreateGoal={createMeta}
                onUpdateProgress={updateMetaProgress}
                onUpdateStatus={updateMetaStatus}
                onUpdateScaleScore={updateMetaScaleScore}
                fetchGoalUpdates={fetchMetaUpdates}
                latestPHQ9={latestPHQ9Score}
                latestGAD7={latestGAD7Score}
              />
              <Separator />
              <PlanoTerapeuticoBlock
                currentPlano={currentPlanoTerapeutico}
                planoHistory={planoTerapeuticoHistory}
                loading={planoTerapeuticoLoading}
                saving={planoTerapeuticoSaving}
                canEdit={canEditCurrentTab}
                onSave={savePlanoTerapeutico}
              />
              <Separator />
              <RelatorioPsicologicoBlock
                patientId={patientId}
                patientName={patient?.full_name}
                canEdit={canEditCurrentTab}
              />
              <Separator />
              <RelatorioEscolarBlock
                patientId={patientId}
                patientName={patient?.full_name}
                canEdit={canEditCurrentTab}
              />
              <Separator />
              <RelatorioJudicialBlock
                patientId={patientId}
                patientName={patient?.full_name}
                canEdit={canEditCurrentTab}
              />
              <Separator />
              <LaudoPsicologicoBlock
                patientId={patientId}
                patientName={patient?.full_name}
                canEdit={canEditCurrentTab}
              />
            </div>
          );
        }
        if (activeSpecialtyKey === 'fisioterapia') {
          return (
            <PlanoTerapeuticoFisioBlock
              patientId={patientId}
              clinicId={clinicIdForFisio || null}
              professionalId={currentProfessionalId || null}
              canEdit={canEditCurrentTab}
            />
          );
        }
        if (activeSpecialtyKey === 'pilates') {
          return (
            <PlanoExerciciosPilatesBlock
              patientId={patientId}
              clinicId={clinicIdForFisio || null}
              professionalId={currentProfessionalId || null}
              canEdit={canEditCurrentTab}
            />
          );
        }
        if (activeSpecialtyKey === 'dermatologia') {
          return (
            <PlanoCondutaDermatoBlock
              patientId={patientId}
              clinicId={clinicIdForFisio || null}
              professionalId={currentProfessionalId || null}
              canEdit={canEditCurrentTab}
              specialtyId={activeSpecialtyId}
            />
          );
        }
        // Default: Clínica Geral - Plano / Conduta
        return (
          <CondutaBlock
            condutas={condutas}
            evolucoes={evolucoes}
            loading={condutasLoading}
            saving={condutasSaving}
            canEdit={canEditCurrentTab}
            currentProfessionalId={condutaProfId || undefined}
            currentProfessionalName={condutaProfName || undefined}
            onSave={saveConduta}
          />
        );

      case 'documentos_clinicos':
        // Psicologia - Relatórios / Documentos específicos
        if (activeSpecialtyKey === 'psicologia') {
          return (
            <div className="space-y-6">
              <RelatorioPsicologicoBlock
                patientId={patientId}
                patientName={patient?.full_name}
                canEdit={canEditCurrentTab}
              />
              <Separator />
              <RelatorioEscolarBlock
                patientId={patientId}
                patientName={patient?.full_name}
                canEdit={canEditCurrentTab}
              />
              <Separator />
              <RelatorioJudicialBlock
                patientId={patientId}
                patientName={patient?.full_name}
                canEdit={canEditCurrentTab}
              />
              <Separator />
              <LaudoPsicologicoBlock
                patientId={patientId}
                patientName={patient?.full_name}
                canEdit={canEditCurrentTab}
              />
              <Separator />
              <DocumentosClinicosBlock
                documentos={documentosClinicos}
                loading={documentosClinicosLoading}
                saving={documentosClinicosSaving}
                canEdit={canEditCurrentTab}
                currentProfessionalName={docClinicoProfName || undefined}
                currentProfessionalRegistration={docClinicoProfReg || undefined}
                currentProfessionalSignatureUrl={docClinicoProfSig || undefined}
                modelosPessoais={docModelosPessoais}
                modelosDocumento={docModelosDocumento}
                medicamentoSuggestions={docMedSuggestions}
                activeSpecialtyId={activeSpecialtyId || undefined}
                patientName={patient?.full_name}
                onSave={(tipo, conteudo, options) => saveDocumentoClinico(tipo, conteudo, activeSpecialtyId || undefined, options)}
                onCancel={cancelDocumentoClinico}
                onSaveModeloPessoal={saveModeloPessoalClinico}
                onDeleteModeloPessoal={deleteModeloPessoalClinico}
              />
            </div>
          );
        }
        // Default: Documentos Clínicos (Receituário / Atestado / Declaração / Relatório)
        return (
          <DocumentosClinicosBlock
            documentos={documentosClinicos}
            loading={documentosClinicosLoading}
            saving={documentosClinicosSaving}
            canEdit={canEditCurrentTab}
            currentProfessionalName={docClinicoProfName || undefined}
            currentProfessionalRegistration={docClinicoProfReg || undefined}
            currentProfessionalSignatureUrl={docClinicoProfSig || undefined}
            modelosPessoais={docModelosPessoais}
            modelosDocumento={docModelosDocumento}
            medicamentoSuggestions={docMedSuggestions}
            activeSpecialtyId={activeSpecialtyId || undefined}
            patientName={patient?.full_name}
            onSave={(tipo, conteudo, options) => saveDocumentoClinico(tipo, conteudo, activeSpecialtyId || undefined, options)}
            onCancel={cancelDocumentoClinico}
            onSaveModeloPessoal={saveModeloPessoalClinico}
            onDeleteModeloPessoal={deleteModeloPessoalClinico}
          />
        );

      case 'plano_alimentar':
        // Nutrição - Plano Alimentar
        return (
          <PlanoAlimentarBlock
            planos={planosAlimentares}
            planoAtivo={planoAlimentarAtivo}
            loading={planosAlimentaresLoading}
            saving={planosAlimentaresSaving}
            canEdit={canEditCurrentTab}
            onSave={savePlanoAlimentar}
            onDeactivate={deactivatePlanoAlimentar}
          />
        );

      case 'exames':
        // Specialty-specific documents block
        if (activeSpecialtyKey === 'pilates') {
          return (
            <ExamesDocumentosPilatesBlock
              patientId={patientId}
              clinicId={clinicIdForFisio || null}
              professionalId={currentProfessionalId || null}
              canEdit={canEditCurrentTab}
            />
          );
        }
        // Clínica Geral - Exames / Documentos
        return (
          <DocumentosBlock
            documentos={documentos}
            loading={documentosLoading}
            uploading={documentosUploading}
            canEdit={canEditCurrentTab}
            currentProfessionalId={docProfId || undefined}
            currentProfessionalName={docProfName || undefined}
            onUpload={uploadDocumento}
            onDelete={deleteDocumento}
            onDownload={downloadDocumento}
          />
        );

      case 'instrumentos':
        // Psicologia - Instrumentos / Testes Psicológicos
        return (
          <InstrumentosPsicologicosBlock
            instrumentos={instrumentosPsico}
            loading={instrumentosPsicoLoading}
            saving={instrumentosPsicoSaving}
            canEdit={canEditCurrentTab}
            currentProfessionalName={currentProfessionalName || undefined}
            onSave={saveInstrumentoPsico}
            onDelete={deleteInstrumentoPsico}
          />
        );

      case 'termos_consentimentos':
        // Estética - Termos de Consentimento Estético
        // (estética handled by EsteticaProntuarioLayout above)
        // Psicologia - Termos de Consentimento Terapêutico
        return (
          <TermosConsentimentosPsicologiaBlock
            availableTerms={consentTerms}
            patientConsents={patientConsents}
            loading={consentTermsLoading || patientConsentsLoading}
            saving={patientConsentsSaving}
            patientId={patientId || ''}
            patientName={patient?.full_name || 'Paciente'}
            onGrantConsent={async (termId, termVersion) => {
              if (!patientId) return false;
              return grantPatientConsent(patientId, termId, termVersion);
            }}
            onRevokeConsent={revokePatientConsent}
            canEdit={canEditCurrentTab}
          />
        );

      case 'alertas':
        // Specialty-specific alerts block
        if (activeSpecialtyKey === 'psicologia') {
          return (
            <AlertasPsicologiaBlock
              alertas={alertasPsico}
              loading={alertasPsicoLoading}
              saving={alertasPsicoSaving}
              canEdit={canEditCurrentTab}
              currentProfessionalId={alertaPsicoProfId || undefined}
              currentProfessionalName={alertaPsicoProfName || undefined}
              onSave={saveAlertaPsico}
              onDeactivate={deactivateAlertaPsico}
              onReactivate={reactivateAlertaPsico}
            />
          );
        }
        if (activeSpecialtyKey === 'nutricao') {
          return (
            <AlertasNutricaoBlock
              alertas={alertasNutricao}
              activeAlertas={activeAlertasNutricao}
              loading={alertasNutricaoLoading}
              saving={alertasNutricaoSaving}
              canEdit={canEditCurrentTab}
              onSave={saveAlertaNutricao}
              onDeactivate={deactivateAlertaNutricao}
              onReactivate={reactivateAlertaNutricao}
            />
          );
        }
        if (activeSpecialtyKey === 'fisioterapia') {
          return (
            <AlertasFuncionaisBlock
              patientId={patientId}
              clinicId={clinicIdForFisio || null}
              professionalId={currentProfessionalId || null}
              canEdit={canEditCurrentTab}
            />
          );
        }
        if (activeSpecialtyKey === 'pilates') {
          return (
            <AlertasFuncionaisPilatesBlock
              patientId={patientId}
              clinicId={clinicIdForFisio || null}
              professionalId={currentProfessionalId || null}
              canEdit={canEditCurrentTab}
            />
          );
        }
        // (estética handled by EsteticaProntuarioLayout above)
        if (activeSpecialtyKey === 'pediatria') {
          return (
            <AlertasPediatriaBlock
              patientId={patientId}
              isEditable={canEditCurrentTab}
              currentProfessionalId={currentProfessionalId || undefined}
            />
          );
        }
        // Clínica Geral - Alertas Clínicos
        return (
          <AlertasBlock
            alertas={alertas}
            loading={alertasLoading}
            saving={alertasSaving}
            canEdit={canEditCurrentTab}
            currentProfessionalId={alertaProfId || undefined}
            currentProfessionalName={alertaProfName || undefined}
            onSave={saveAlerta}
            onDeactivate={deactivateAlerta}
            onReactivate={reactivateAlerta}
          />
        );

      case 'historico':
      case 'timeline':
        // Specialty-specific history/timeline block
        if (activeSpecialtyKey === 'psicologia') {
          // Map patient consents to the expected format
          const mappedConsents = patientConsents.map(c => ({
            id: c.id,
            term_title: c.term_title || 'Termo',
            consent_type: c.status,
            accepted_at: c.granted_at,
            term_version: c.term_version,
          }));
          
          return (
            <HistoricoPsicologiaBlock
              anamneses={anamneseHistoryPsico}
              sessoes={sessoesPsico}
              planos={planoTerapeuticoHistory}
              instrumentos={instrumentosPsico}
              consents={mappedConsents}
              loading={anamnesePsicoLoading || sessoesPsicoLoading || planoTerapeuticoLoading || instrumentosPsicoLoading}
            />
          );
        }
        if (activeSpecialtyKey === 'nutricao') {
          return (
            <LinhaTempoNutricaoBlock
              eventos={timelineEventosNutricao}
              loading={timelineNutricaoLoading}
            />
          );
        }
        if (activeSpecialtyKey === 'fisioterapia') {
          return (
            <HistoricoFisioterapiaBlock
              patientId={patientId}
              clinicId={clinicIdForFisio || null}
            />
          );
        }
        if (activeSpecialtyKey === 'pilates') {
          return (
            <HistoricoPilatesBlock
              patientId={patientId}
              clinicId={clinicIdForFisio || null}
            />
          );
        }
        // (estética handled by EsteticaProntuarioLayout above)
        if (activeSpecialtyKey === 'pediatria') {
          return (
            <LinhaDoTempoPediatriaBlock
              patientId={patientId}
              events={[]}
            />
          );
        }
        // Clínica Geral - Linha do Tempo / Histórico
        return (
          <LinhaTempoBlock
            eventos={timelineEventos}
            loading={timelineLoading}
          />
        );


      case 'prescricoes':
        // Clínica Geral - Prescrições estruturadas
        return (
          <PrescricoesBlock
            prescricoes={prescricoes}
            loading={prescricoesLoading}
            saving={prescricoesSaving}
            canEdit={canEditCurrentTab}
            patientName={patient?.full_name}
            onSave={savePrescricao}
            onSign={signPrescricao}
          />
        );


      case 'odontograma':
        return (
          <OdontogramModule
            patientId={patientId!}
            appointmentId={activeAppointment?.id}
            professionalId={activeAppointment?.professional_id || ''}
            readOnly={!canEditCurrentTab}
          />
        );

      case 'tooth_procedures':
        return (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Crosshair className="h-5 w-5 text-indigo-600" />
                Procedimentos por Dente
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground text-center py-8">
                Lista de procedimentos associados a cada dente será exibida aqui.
              </p>
              <p className="text-xs text-center text-muted-foreground">
                {!hasActiveAppointment && "Inicie um atendimento para registrar procedimentos."}
              </p>
            </CardContent>
          </Card>
        );

      case 'fotos_intraorais':
        return (
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <Camera className="h-5 w-5 text-emerald-600" />
                  Fotos Intraorais
                </CardTitle>
                {canEditCurrentTab && (
                  <Button size="sm">
                    <Plus className="h-4 w-4 mr-2" />
                    Adicionar Foto
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent>
              {tabFiles.length === 0 ? (
                <div className="text-center py-12">
                  <Camera className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">Nenhuma foto intraoral anexada.</p>
                  {canEditCurrentTab && (
                    <Button className="mt-4" size="sm">
                      <Plus className="h-4 w-4 mr-2" />
                      Anexar Primeira Foto
                    </Button>
                  )}
                </div>
              ) : (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {tabFiles.map((file) => (
                    <Card key={file.id} className="overflow-hidden">
                      <div className="aspect-square bg-muted flex items-center justify-center">
                        <Image className="h-8 w-8 text-muted-foreground" />
                      </div>
                      <CardContent className="p-2">
                        <p className="text-xs truncate">{file.file_name}</p>
                        <p className="text-xs text-muted-foreground">
                          {format(new Date(file.created_at), "dd/MM/yyyy", { locale: ptBR })}
                        </p>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        );

      // ===== AESTHETICS MODULES =====
      case 'facial_map':
        return (
          <FacialMapModule
            patientId={patientId!}
            appointmentId={activeAppointment?.id}
            canEdit={canEditCurrentTab}
            professionalId={currentProfessionalId}
            specialtyKey={activeSpecialtyKey || 'estetica'}
          />
        );

      case 'before_after_photos':
        return (
          <BeforeAfterModule
            patientId={patientId!}
            appointmentId={activeAppointment?.id}
            canEdit={canEditCurrentTab}
          />
        );

      case 'aesthetic_consent':
        return (
          <ConsentModule
            patientId={patientId!}
            appointmentId={activeAppointment?.id}
            canEdit={canEditCurrentTab}
          />
        );

      case 'procedimentos_realizados':
        // Procedimentos Realizados - delegated to Estética layout when active
        return null;

      default:
        return (
          <Card>
            <CardContent className="py-12 text-center">
              <p className="text-muted-foreground">Conteúdo da aba "{activeTab}" será exibido aqui.</p>
            </CardContent>
          </Card>
        );
    }
  };

  const isEsteticaSpecialty = activeSpecialtyKey === 'estetica';
  // Print handler - consolidated for Estética, default for others
  const onPrintClick = useCallback(() => {
    if (!patientId || !patient) {
      handlePrint();
      return;
    }
    if (isEsteticaSpecialty) {
      generateConsolidatedPdf({
        patientId,
        appointmentId: activeAppointment?.id,
        patient: {
          full_name: patient.full_name,
          birth_date: patient.birth_date,
          phone: patient.phone,
          cpf: patient.cpf,
        },
        professionalName: currentProfessionalName,
        professionalRegistration: docClinicoProfReg,
      });
    } else {
      handlePrint();
    }
  }, [handlePrint, patientId, patient, activeAppointment, isEsteticaSpecialty, generateConsolidatedPdf, currentProfessionalName, docClinicoProfReg]);

  // Export handler - consolidated PDF for Estética/filler, default for others
  // Export handler - consolidated PDF for Estética/filler, default for others
  const onExportClick = useCallback(() => {
    if (!patientId || !patient) return;
    if (isEsteticaSpecialty) {
      generateConsolidatedPdf({
        patientId,
        appointmentId: activeAppointment?.id,
        patient: {
          full_name: patient.full_name,
          birth_date: patient.birth_date,
          phone: patient.phone,
          cpf: patient.cpf,
        },
        professionalName: currentProfessionalName,
        professionalRegistration: docClinicoProfReg,
      });
    } else {
      handleExport(patientId, activeAppointment?.id, patient.full_name);
    }
  }, [patientId, patient, activeAppointment, handleExport, isEsteticaSpecialty, generateConsolidatedPdf, currentProfessionalName, docClinicoProfReg]);

  // No patient selected - show patient selector (only after auto-redirect check completes)
  if (!patientId) {
    if (isCheckingAutoRedirect) {
      return (
        <div className="flex items-center justify-center min-h-[80vh]">
          <div className="space-y-4 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto" />
            <p className="text-sm text-muted-foreground">Verificando atendimento ativo...</p>
          </div>
        </div>
      );
    }

    const handleSelectPatient = (selectedPatientId: string) => {
      navigate(`/app/prontuario/${selectedPatientId}`);
    };

    return <PatientSelector onSelectPatient={handleSelectPatient} />;
  }

  // Logs temporários para diagnóstico do fluxo do prontuário
  if (typeof window !== 'undefined') {
    console.log("[PRONTUARIO] route patientId:", patientId);
    console.log("[PRONTUARIO] loaded patient:", patient);
    console.log("[PRONTUARIO] patientLoading:", patientLoading);
    console.log("[PRONTUARIO] activeAppointment:", activeAppointment);
    console.log("[PRONTUARIO] clinic loaded:", !!clinic?.id);
  }

  // Patient ID provided in URL but not found.
  // Só mostramos a mensagem de erro quando temos certeza:
  //  - clínica resolvida
  //  - busca finalizada (patientLoading=false)
  //  - paciente confirmadamente ausente
  // Enquanto qualquer dependência ainda carrega, exibimos um loading suave
  // em vez de "Paciente não encontrado".
  if (patientId && !patient) {
    if (!clinic?.id || patientLoading) {
      return (
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="space-y-4 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto" />
            <p className="text-sm text-muted-foreground">Carregando prontuário...</p>
          </div>
        </div>
      );
    }

    return (
      <div className="flex items-center justify-center min-h-[60vh] p-6">
        <div className="max-w-md w-full text-center space-y-4">
          <div className="mx-auto h-14 w-14 rounded-full bg-muted flex items-center justify-center">
            <FileText className="h-7 w-7 text-muted-foreground" />
          </div>
          <div className="space-y-1">
            <h2 className="text-xl font-semibold">Paciente não encontrado</h2>
            <p className="text-sm text-muted-foreground">
              O paciente solicitado não existe nesta clínica ou você não tem permissão para acessá-lo.
            </p>
          </div>
          <div className="flex gap-2 justify-center">
            <Button variant="outline" onClick={() => navigate("/app/prontuario")}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Selecionar paciente
            </Button>
            <Button onClick={() => navigate("/app")}>
              Ir para o Dashboard
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Handler for consent collection
  const handleCollectConsent = () => {
    setConsentDialogOpen(true);
  };

  const handleConfirmConsent = async (): Promise<boolean> => {
    return await grantConsent();
  };

  // Handler for digital signature
  const handleOpenSignature = (entry: MedicalRecordEntry) => {
    setSelectedEntryForSignature(entry);
    setSignatureDialogOpen(true);
  };

  // Build SignableDocumentContext for the unified wizard from the selected entry
  const signatureContext: SignableDocumentContext | null = (() => {
    if (!selectedEntryForSignature || !patientId || !clinic?.id) return null;
    return {
      document_type: selectedEntryForSignature.entry_type as 'evolution' | 'anamnesis',
      document_id: selectedEntryForSignature.id,
      patient_id: patientId,
      clinic_id: clinic.id,
      snapshot: (selectedEntryForSignature.content || {}) as Record<string, unknown>,
      professional_name: currentProfessionalName || 'Profissional',
    };
  })();

  const handleSignatureCompleted = () => {
    setSelectedEntryForSignature(null);
    if (patientId) fetchSignaturesForPatient(patientId);
  };


  return (
    <ClinicalAccessGuard>
    <SearchFocusContext.Provider value={searchFocusContextValue}>
    <div className="flex flex-col h-full min-h-0 relative">
      {/* LGPD Blocking Overlay - shown when consent is required but not granted */}
      {!lgpdLoading && isEnforcementEnabled && !hasValidConsent && patient && (
        <LgpdBlockingOverlay
          patientName={patient.full_name}
          isFullyLocked={shouldHideContent}
          onCollectConsent={handleCollectConsent}
        />
      )}

      {/* Consent Collection Dialog */}
      {activeTermTitle && activeTermContent && activeTermVersion && patient && (
        <ConsentCollectionDialog
          open={consentDialogOpen}
          onOpenChange={setConsentDialogOpen}
          patientName={patient.full_name}
          termTitle={activeTermTitle}
          termVersion={activeTermVersion}
          termContent={activeTermContent}
          onConfirm={handleConfirmConsent}
          isLoading={lgpdGranting}
        />
      )}

      {/* Unified Advanced Digital Signature Wizard */}
      {patient && (
        <UnifiedSignatureWizard
          open={signatureDialogOpen}
          onOpenChange={(o) => {
            setSignatureDialogOpen(o);
            if (!o) setSelectedEntryForSignature(null);
          }}
          context={signatureContext}
          patientName={patient.full_name}
          generatedAt={selectedEntryForSignature?.created_at}
          onSigned={handleSignatureCompleted}
        />
      )}

      {shouldHoldProntuarioRendering && (
        <div className="flex-1 space-y-4 p-4 md:p-6">
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-64 w-full" />
        </div>
      )}

      {!shouldHoldProntuarioRendering && noSpecialtyConfigured && (
        <div className="flex-1 p-4 md:p-6">
          <div className="rounded-lg border border-dashed bg-card p-6 text-center">
            <p className="text-base font-medium text-foreground">Especialidade não definida</p>
            <p className="mt-2 text-sm text-muted-foreground">
              Ative pelo menos uma especialidade oficial em Configurações &gt; Clínica para abrir o prontuário.
            </p>
          </div>
        </div>
      )}

      {!shouldHoldProntuarioRendering && !noSpecialtyConfigured && (
        <>

      {/* Header Unificado */}
      <ProntuarioHeader
        patient={patient}
        patientLoading={patientLoading}
        activeSpecialtyKey={activeSpecialtyKey}
        activeSpecialtyName={resolvedSpecialtyName}
        professionalName={currentProfessionalName}
        isSpecialtyFromAppointment={isSpecialtyFromAppointment}
        specialtyLoading={specialtyLoading}
        criticalAlertsCount={criticalAlerts.length}
        isLgpdPending={isEnforcementEnabled && !hasValidConsent}
        hasActiveAppointment={hasActiveAppointment}
        activeAppointment={activeAppointment}
        appointmentLoading={appointmentLoading}
        appointmentReason={appointmentReason}
        isAdmin={isAdmin}
        canPrint={canPerformAction('print_record')}
        canExport={canPerformAction('export_pdf')}
        onPrint={onPrintClick}
        onExport={onExportClick}
        exporting={exporting || exportingFiller}
        insuranceName={(patient as any)?.insurance?.insurance_name || null}
        clinicalSummary={clinicalDataLoading ? undefined : (prontuarioClinicalData ? {
          allergies: (prontuarioClinicalData.allergies || []).map(a => a.split('\n')[0].substring(0, 40)),
          chronic_diseases: (prontuarioClinicalData.chronic_diseases || []).map(d => d.split('\n')[0].substring(0, 40)),
          current_medications: (prontuarioClinicalData.current_medications || []).map(m => m.split('\n')[0].substring(0, 40)),
          blood_type: prontuarioClinicalData.blood_type,
          restrictions: prontuarioClinicalData.clinical_restrictions 
            ? [prontuarioClinicalData.clinical_restrictions.split('\n')[0].substring(0, 40)] 
            : undefined,
        } : null)}
        clinicalDataLoading={clinicalDataLoading}
      />


      {/* Teleconsulta Context Bar */}
      {activeAppointment && (activeAppointment as any).care_mode === 'teleconsulta' && (
        <div className="px-4 py-2 border-b">
          <TeleconsultaContextBar
            appointmentId={activeAppointment.id}
            meetingLink={(activeAppointment as any).meeting_link}
            meetingStatus={(activeAppointment as any).meeting_status || 'nao_gerada'}
          />
        </div>
      )}
      {/* Barra de Pesquisa Global */}
      {patientId && (
        <div className="px-4 py-2 border-b bg-background">
          <ProntuarioSearchBar
            patientId={patientId}
            onResultClick={handleSearchResultClick}
            onNavigateToTab={handleNavigateToTab}
            className="max-w-2xl"
          />
        </div>
      )}

      {/* Main Content with Responsive Tab Navigation */}
      <div id="print-area" className="flex flex-col flex-1 min-h-0 overflow-hidden">
        {/* Responsive Tab Navigation - Adapts to mobile/tablet/desktop */}
        <ProntuarioTabNav
          items={navItems.map((item) => {
            // Primary tabs (always visible): Visão Geral, Anamnese, Evoluções/Sessões, Plano
            const primaryTabIds = [
              'resumo',           // Visão Geral
              'anamnese',         // Anamnese
              'evolucao',         // Evoluções / Sessões
              'conduta',          // Plano / Conduta
              'plano_alimentar',  // Plano Alimentar (Nutrição)
              'plano_terapeutico', // Plano Terapêutico (Psicologia/Fisioterapia)
            ];
            
            const isPrimaryTab = primaryTabIds.includes(item.id);
            
            return {
              id: item.id,
              label: item.label,
              icon: item.icon,
              badge: item.id === 'alertas' ? activeAlerts.length : undefined,
              badgeVariant: item.id === 'alertas' && criticalAlerts.length > 0 ? "destructive" : "secondary",
              // Secondary tabs go to "More" menu on mobile
              secondary: !isPrimaryTab,
            } as TabNavItem;
          })}
          activeTab={activeTab}
          onTabChange={handleTabChange}
          criticalAlerts={criticalAlerts.length}
        />

        {/* Content Area */}
        <main className="flex-1 min-h-0 overflow-auto">
          <div className="p-4 md:p-6 space-y-3">
            {/* Search Focus Banner — shown when a record was opened from global search */}
            <SearchFocusBanner />
            {/* Alerts Banner - shown at top when there are active alerts */}
            {/* Psychology specialty uses specialized banner with risk indicators */}
            {activeSpecialtyKey === 'psicologia' && activeAlertasPsico.length > 0 && activeTab !== 'alertas' && (
              <AlertasBannerPsicologia 
                alertas={alertasPsico} 
                onViewAlerts={() => setActiveTab('alertas')}
              />
            )}
            {/* Nutrition specialty uses specialized banner with dietary alerts */}
            {activeSpecialtyKey === 'nutricao' && activeAlertasNutricao.length > 0 && activeTab !== 'alertas' && (
              <AlertasBannerNutricao 
                alertas={activeAlertasNutricao} 
                onViewAlerts={() => setActiveTab('alertas')}
              />
            )}
            {/* Standard alert banner removed - clinical summary in header is sufficient */}
            <ErrorBoundary key={`tab-${activeTab}`} compact scope={`Prontuário · ${activeTab}`}>
              {renderTabContent()}
            </ErrorBoundary>
          </div>
        </main>
      </div>
      </>
      )}

      {/* Active session bar removed — global floating widget handles timer */}
    </div>
    </SearchFocusContext.Provider>
    </ClinicalAccessGuard>
  );
}
