import { useState, useMemo, useRef, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  Search, 
  X, 
  FileText, 
  Stethoscope, 
  AlertTriangle, 
  Paperclip,
  Calendar,
  ChevronRight,
  Loader2,
  Filter
} from "lucide-react";
import { format, parseISO, isWithinInterval, subDays, subMonths, subYears } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";

// Types for search
export type SearchResultType = 'entry' | 'file' | 'alert';

export interface SearchResult {
  id: string;
  type: SearchResultType;
  category: string;
  title: string;
  snippet: string;
  date: string;
  tabKey: string;
  highlight: string[];
  sourceTable?: string;
  sourceRecordId?: string | null;
}

interface MedicalRecordEntry {
  id: string;
  entry_type: string;
  template_id: string | null;
  content: Record<string, unknown>;
  notes: string | null;
  status: string;
  created_at: string;
}

interface MedicalRecordFile {
  id: string;
  file_name: string;
  file_type: string;
  category: string;
  description: string | null;
  created_at: string;
}

interface ClinicalAlert {
  id: string;
  alert_type: string;
  severity: string;
  title: string;
  description: string | null;
  created_at: string;
}

interface ProntuarioSearchBarProps {
  entries: MedicalRecordEntry[];
  files: MedicalRecordFile[];
  alerts: ClinicalAlert[];
  patientId?: string | null;
  clinicId?: string | null;
  specialtyId?: string | null;
  specialtyKey?: string | null;
  appointmentId?: string | null;
  professionalId?: string | null;
  procedureId?: string | null;
  onResultClick: (result: SearchResult) => void;
  onNavigateToTab: (tabKey: string) => void;
  className?: string;
}

interface RemoteHit {
  id: string;
  type: SearchResultType;
  category: string;
  title: string;
  snippet: string;
  date: string;
  tabKey: string;
  sourceTable: string;
  sourceRecordId?: string | null;
}

const filterOptions: { id: SearchResultType | 'all'; label: string; icon: React.ReactNode }[] = [
  { id: 'all', label: 'Todos', icon: <Search className="h-3 w-3" /> },
  { id: 'entry', label: 'Evoluções', icon: <FileText className="h-3 w-3" /> },
  { id: 'file', label: 'Arquivos', icon: <Paperclip className="h-3 w-3" /> },
  { id: 'alert', label: 'Alertas', icon: <AlertTriangle className="h-3 w-3" /> },
];

const dateRangeOptions = [
  { id: 'all', label: 'Todo período' },
  { id: '7d', label: 'Últimos 7 dias' },
  { id: '30d', label: 'Últimos 30 dias' },
  { id: '90d', label: 'Últimos 3 meses' },
  { id: '1y', label: 'Último ano' },
];

// Map entry_type to tab key
const entryTypeToTab: Record<string, string> = {
  'anamnese': 'anamnese',
  'anamnesis': 'anamnese',
  'evolucao': 'evolucao',
  'evolution': 'evolucao',
  'diagnostico': 'diagnostico',
  'prescricao': 'prescricoes',
  'procedimento': 'procedimentos',
  'exame': 'exames',
  'default': 'evolucao',
};

const categoryLabels: Record<string, string> = {
  'entry': 'Evolução',
  'file': 'Arquivo',
  'alert': 'Alerta',
  'anamnese': 'Anamnese',
  'anamnesis': 'Anamnese',
  'evolucao': 'Evolução',
  'evolution': 'Evolução',
  'diagnostico': 'Diagnóstico',
  'prescricao': 'Prescrição',
  'procedimento': 'Procedimento',
  'exam': 'Exame',
  'document': 'Documento',
  'image': 'Imagem',
  'report': 'Laudo',
  'clinical_document': 'Documento Clínico',
  'addendum': 'Adendo',
  'facial_map': 'Mapa Facial',
  'produto': 'Produto',
  'procedimento_realizado': 'Procedimento',
  'before_after': 'Antes e Depois',
};

const normalizeText = (value: string) =>
  value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();

const includesSearchTerm = (value: string, term: string) => {
  if (!value.trim() || !term.trim()) return false;
  return normalizeText(value).includes(normalizeText(term));
};

const extractSearchText = (value: unknown): string => {
  const chunks: string[] = [];

  const visit = (current: unknown) => {
    if (current === null || current === undefined) return;

    if (typeof current === 'string' || typeof current === 'number' || typeof current === 'boolean') {
      chunks.push(String(current));
      return;
    }

    if (Array.isArray(current)) {
      current.forEach(visit);
      return;
    }

    if (typeof current === 'object') {
      Object.entries(current as Record<string, unknown>).forEach(([key, nestedValue]) => {
        chunks.push(key.replace(/[_-]/g, ' '));
        visit(nestedValue);
      });
    }
  };

  visit(value);

  return chunks.join(' ').replace(/\s+/g, ' ').trim();
};

const buildSnippet = (text: string, term: string, fallback: string) => {
  const cleanText = text.replace(/\s+/g, ' ').trim();
  if (!cleanText) return fallback;

  const plainText = cleanText.toLowerCase();
  const plainTerm = term.toLowerCase();
  const termIndex = plainText.indexOf(plainTerm);

  if (termIndex === -1) {
    return cleanText.length > 180 ? `${cleanText.slice(0, 177)}...` : cleanText;
  }

  const start = Math.max(0, termIndex - 60);
  const end = Math.min(cleanText.length, termIndex + term.length + 100);

  return `${start > 0 ? '...' : ''}${cleanText.slice(start, end)}${end < cleanText.length ? '...' : ''}`;
};

const resolveEvolutionTab = (evolutionType?: string | null) => {
  const normalizedType = (evolutionType || '').toLowerCase();

  const exactMatchMap: Record<string, string> = {
    documento_fisioterapia: 'exames',
    documento_pilates: 'exames',
    alerta_funcional_fisio: 'alertas',
    alerta_funcional_pilates: 'alertas',
    anamnese_fisioterapia: 'anamnese',
    anamnese_funcional_pilates: 'anamnese',
    anamnese_nutricional: 'anamnese',
    avaliacao_nutricional_inicial: 'avaliacao_nutricional',
    avaliacao_funcional_fisio: 'avaliacao_funcional',
    avaliacao_funcional_pilates: 'avaliacao_funcional',
    avaliacao_dor_fisio: 'avaliacao_dor',
    avaliacao_dor_pilates: 'avaliacao_dor',
    avaliacao_postural_pilates: 'avaliacao_funcional',
    diagnostico_funcional_fisio: 'diagnostico',
    plano_terapeutico_fisio: 'conduta',
    exercicios_prescritos_fisio: 'exercicios_prescritos',
    sessao_fisioterapia: 'evolucao',
    sessao_pilates: 'evolucao',
    plano_exercicios_pilates: 'evolucao',
    evolucao_retorno: 'evolucao',
    plano_alimentar: 'plano_alimentar',
    meta_nutricional: 'evolucao',
    recordatorio_alimentar: 'evolucao',
    conduct_dermato: 'conduta',
  };

  if (exactMatchMap[normalizedType]) return exactMatchMap[normalizedType];

  if (normalizedType.includes('diagnost')) return 'diagnostico';
  if (normalizedType.includes('conduta') || normalizedType.includes('plano')) return 'conduta';
  if (normalizedType.includes('exam')) return 'exame_fisico';

  return 'evolucao';
};

const matchesSpecialtyContext = ({
  activeSpecialtyId,
  activeSpecialtyKey,
  rowSpecialtyId,
  dedicatedSpecialtyKey,
}: {
  activeSpecialtyId?: string | null;
  activeSpecialtyKey?: string | null;
  rowSpecialtyId?: string | null;
  dedicatedSpecialtyKey?: string | null;
}) => {
  if (dedicatedSpecialtyKey) {
    return !activeSpecialtyKey || activeSpecialtyKey === dedicatedSpecialtyKey;
  }

  if (!activeSpecialtyId) return true;
  if (!rowSpecialtyId) return true;

  return rowSpecialtyId === activeSpecialtyId;
};

const activateSearchTarget = (element: HTMLElement) => {
  element.scrollIntoView({ behavior: 'smooth', block: 'center' });
  element.classList.add('ring-2', 'ring-primary', 'ring-offset-2');
  window.setTimeout(() => {
    element.classList.remove('ring-2', 'ring-primary', 'ring-offset-2');
  }, 2200);

  const isInteractive =
    element instanceof HTMLButtonElement ||
    element.tagName === 'BUTTON' ||
    element.dataset.searchActivate === 'true' ||
    typeof (element as HTMLButtonElement).click === 'function';

  if (isInteractive) {
    (element as HTMLButtonElement).click();
  }
};

const findSearchTarget = (result: SearchResult) => {
  const candidateIds = [result.sourceRecordId, result.id].filter(Boolean) as string[];

  for (const candidateId of candidateIds) {
    const exactMatch = document.querySelector<HTMLElement>(`[data-search-record-id="${candidateId}"]`);
    if (exactMatch) return exactMatch;
  }

  const searchNeedles = [result.title, ...result.highlight, result.snippet]
    .filter(Boolean)
    .map(value => normalizeText(value))
    .filter(value => value.length >= 4);

  if (searchNeedles.length === 0) return null;

  const clickableCandidates = Array.from(
    document.querySelectorAll<HTMLElement>('button, [role="button"], [data-search-record-id], .cursor-pointer')
  );

  return clickableCandidates.find((element) => {
    const text = normalizeText(element.innerText || element.textContent || '');
    return searchNeedles.some((needle) => text.includes(needle));
  }) || null;
};

export function ProntuarioSearchBar({ 
  entries, 
  files, 
  alerts,
  patientId,
  clinicId,
  specialtyId,
  specialtyKey,
  appointmentId,
  professionalId,
  procedureId,
  onResultClick,
  onNavigateToTab,
  className
}: ProntuarioSearchBarProps) {
  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [remoteHits, setRemoteHits] = useState<RemoteHit[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [activeFilter, setActiveFilter] = useState<SearchResultType | 'all'>('all');
  const [dateRange, setDateRange] = useState<string>('all');
  const [showFilters, setShowFilters] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const scheduleResultNavigation = useCallback((result: SearchResult) => {
    [140, 420, 900].forEach((delay) => {
      window.setTimeout(() => {
        const target = findSearchTarget(result);
        const found = Boolean(target);

        console.log('[ProntuarioSearch] navigation attempt', {
          delay,
          resultId: result.id,
          sourceTable: result.sourceTable || null,
          sourceRecordId: result.sourceRecordId || null,
          tabKey: result.tabKey,
          found,
        });

        if (target) {
          activateSearchTarget(target);
        }
      }, delay);
    });
  }, []);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Debounced search (300ms)
  useEffect(() => {
    if (query.length >= 2) {
      setIsSearching(true);
      const timer = setTimeout(() => {
        setDebouncedQuery(query);
        setIsSearching(false);
      }, 300);
      return () => clearTimeout(timer);
    } else {
      setDebouncedQuery("");
      setIsSearching(false);
    }
  }, [query]);

  // Remote DB search: clinical record tables + specialty-specific sources
  useEffect(() => {
    if (!debouncedQuery || debouncedQuery.length < 2 || !patientId || !clinicId) {
      setRemoteHits([]);
      return;
    }
    let cancelled = false;
    const term = debouncedQuery.trim();

    (async () => {
      try {
        console.log('[ProntuarioSearch] query context', {
          term,
          patientId,
          clinicId,
          specialtyId: specialtyId || null,
          specialtyKey: specialtyKey || null,
          appointmentId: appointmentId || null,
          professionalId: professionalId || null,
          procedureId: procedureId || null,
        });

        const searchDefinitions = [
          {
            sourceTable: 'clinical_evolutions',
            type: 'entry' as const,
            category: 'evolution',
            tabKey: 'evolucao',
            dateField: 'created_at',
            buildQuery: () => {
              let query = supabase
                .from('clinical_evolutions')
                .select('id, evolution_type, content, notes, created_at, appointment_id, specialty_id, professional_id')
                .eq('clinic_id', clinicId)
                .eq('patient_id', patientId)
                .order('created_at', { ascending: false })
                .limit(1000);

              if (appointmentId) query = query.eq('appointment_id', appointmentId);
              if (professionalId) query = query.eq('professional_id', professionalId);

              return query;
            },
            toHit: (row: any): RemoteHit | null => {
              if (!matchesSpecialtyContext({
                activeSpecialtyId: specialtyId,
                activeSpecialtyKey: specialtyKey,
                rowSpecialtyId: row.specialty_id,
              })) {
                return null;
              }

              const searchableText = extractSearchText({
                evolution_type: row.evolution_type,
                notes: row.notes,
                content: row.content,
              });

              if (!includesSearchTerm(searchableText, term)) return null;

              return {
                id: row.id,
                type: 'entry',
                category: row.evolution_type || 'evolution',
                title: categoryLabels[row.evolution_type] || 'Evolução Clínica',
                snippet: buildSnippet(searchableText, term, 'Evolução clínica'),
                date: row.created_at,
                tabKey: resolveEvolutionTab(row.evolution_type),
                sourceTable: 'clinical_evolutions',
                sourceRecordId: row.id,
              };
            },
          },
          {
            sourceTable: 'anamnesis_records',
            type: 'entry' as const,
            category: 'anamnesis',
            tabKey: 'anamnese',
            dateField: 'created_at',
            buildQuery: () => {
              let query = supabase
                .from('anamnesis_records')
                .select('id, data, responses, created_at, appointment_id, specialty_id, professional_id, status')
                .eq('clinic_id', clinicId)
                .eq('patient_id', patientId)
                .order('created_at', { ascending: false })
                .limit(1000);

              if (appointmentId) query = query.eq('appointment_id', appointmentId);
              if (professionalId) query = query.eq('professional_id', professionalId);

              return query;
            },
            toHit: (row: any): RemoteHit | null => {
              if (!matchesSpecialtyContext({
                activeSpecialtyId: specialtyId,
                activeSpecialtyKey: specialtyKey,
                rowSpecialtyId: row.specialty_id,
              })) {
                return null;
              }

              const searchableText = extractSearchText({ data: row.data, responses: row.responses, status: row.status });
              if (!includesSearchTerm(searchableText, term)) return null;

              return {
                id: row.id,
                type: 'entry',
                category: 'anamnesis',
                title: 'Anamnese',
                snippet: buildSnippet(searchableText, term, 'Registro de anamnese'),
                date: row.created_at,
                tabKey: 'anamnese',
                sourceTable: 'anamnesis_records',
                sourceRecordId: row.id,
              };
            },
          },
          {
            sourceTable: 'patient_documentos',
            type: 'file' as const,
            category: 'document',
            tabKey: 'exames',
            dateField: 'created_at',
            buildQuery: () => {
              let query = supabase
                .from('patient_documentos')
                .select('id, titulo, tipo, conteudo, file_url, created_at, appointment_id, professional_id, status')
                .eq('clinic_id', clinicId)
                .eq('patient_id', patientId)
                .order('created_at', { ascending: false })
                .limit(1000);

              if (appointmentId) query = query.eq('appointment_id', appointmentId);
              if (professionalId) query = query.eq('professional_id', professionalId);

              return query;
            },
            toHit: (row: any): RemoteHit | null => {
              const searchableText = extractSearchText(row);
              if (!includesSearchTerm(searchableText, term)) return null;

              return {
                id: row.id,
                type: 'file',
                category: row.tipo || 'document',
                title: row.titulo || 'Documento',
                snippet: buildSnippet(searchableText, term, 'Documento do paciente'),
                date: row.created_at,
                tabKey: 'exames',
                sourceTable: 'patient_documentos',
                sourceRecordId: row.id,
              };
            },
          },
          {
            sourceTable: 'clinical_documents',
            type: 'file' as const,
            category: 'clinical_document',
            tabKey: 'documentos_clinicos',
            dateField: 'created_at',
            buildQuery: () => {
              let query = supabase
                .from('clinical_documents')
                .select('id, title, document_type, content, created_at, appointment_id, professional_id, source_record_id')
                .eq('clinic_id', clinicId)
                .eq('patient_id', patientId)
                .order('created_at', { ascending: false })
                .limit(1000);

              if (appointmentId) query = query.eq('appointment_id', appointmentId);
              if (professionalId) query = query.eq('professional_id', professionalId);

              return query;
            },
            toHit: (row: any): RemoteHit | null => {
              const searchableText = extractSearchText({ title: row.title, document_type: row.document_type, content: row.content });
              if (!includesSearchTerm(searchableText, term)) return null;

              return {
                id: row.id,
                type: 'file',
                category: 'clinical_document',
                title: row.title || row.document_type || 'Documento Clínico',
                snippet: buildSnippet(searchableText, term, 'Documento clínico'),
                date: row.created_at,
                tabKey: 'documentos_clinicos',
                sourceTable: 'clinical_documents',
                sourceRecordId: row.source_record_id || row.id,
              };
            },
          },
          {
            sourceTable: 'clinical_media',
            type: 'file' as const,
            category: 'document',
            tabKey: 'exames',
            dateField: 'created_at',
            buildQuery: () => {
              let query = supabase
                .from('clinical_media')
                .select('id, file_name, description, category, created_at, appointment_id, professional_id, file_type')
                .eq('clinic_id', clinicId)
                .eq('patient_id', patientId)
                .order('created_at', { ascending: false })
                .limit(1000);

              if (appointmentId) query = query.eq('appointment_id', appointmentId);
              if (professionalId) query = query.eq('professional_id', professionalId);

              return query;
            },
            toHit: (row: any): RemoteHit | null => {
              const searchableText = extractSearchText(row);
              if (!includesSearchTerm(searchableText, term)) return null;

              return {
                id: row.id,
                type: 'file',
                category: row.category || (row.file_type?.startsWith('image/') ? 'image' : 'document'),
                title: row.file_name || 'Arquivo Clínico',
                snippet: buildSnippet(searchableText, term, row.description || 'Arquivo clínico'),
                date: row.created_at,
                tabKey: 'exames',
                sourceTable: 'clinical_media',
                sourceRecordId: row.id,
              };
            },
          },
          ...(specialtyKey === 'psicologia'
            ? [
                {
                  sourceTable: 'sessoes_psicologia',
                  type: 'entry' as const,
                  category: 'evolution',
                  tabKey: 'evolucao',
                  dateField: 'data_sessao',
                  buildQuery: () => {
                    let query = supabase
                      .from('sessoes_psicologia')
                      .select('id, data_sessao, tema_central, relato_paciente, observacoes_terapeuta, intervencoes_realizadas, objetivo_sessao, demanda_principal, professional_id, appointment_id')
                      .eq('clinic_id', clinicId)
                      .eq('patient_id', patientId)
                      .order('data_sessao', { ascending: false })
                      .limit(1000);

                    if (appointmentId) query = query.eq('appointment_id', appointmentId);
                    if (professionalId) query = query.eq('professional_id', professionalId);

                    return query;
                  },
                  toHit: (row: any): RemoteHit | null => {
                    const searchableText = extractSearchText(row);
                    if (!includesSearchTerm(searchableText, term)) return null;

                    return {
                      id: row.id,
                      type: 'entry',
                      category: 'evolution',
                      title: row.tema_central || row.demanda_principal || 'Sessão de Psicologia',
                      snippet: buildSnippet(searchableText, term, 'Sessão terapêutica'),
                      date: row.data_sessao || row.created_at,
                      tabKey: 'evolucao',
                      sourceTable: 'sessoes_psicologia',
                      sourceRecordId: row.id,
                    };
                  },
                },
                {
                  sourceTable: 'patient_anamnese_psicologia',
                  type: 'entry' as const,
                  category: 'anamnesis',
                  tabKey: 'anamnese',
                  dateField: 'created_at',
                  buildQuery: () => {
                    let query = supabase
                      .from('patient_anamnese_psicologia')
                      .select('id, queixa_principal, historico_pessoal, historico_familiar, medicamentos, data, created_at, appointment_id, professional_id')
                      .eq('clinic_id', clinicId)
                      .eq('patient_id', patientId)
                      .order('created_at', { ascending: false })
                      .limit(1000);

                    if (appointmentId) query = query.eq('appointment_id', appointmentId);
                    if (professionalId) query = query.eq('professional_id', professionalId);

                    return query;
                  },
                  toHit: (row: any): RemoteHit | null => {
                    const searchableText = extractSearchText(row);
                    if (!includesSearchTerm(searchableText, term)) return null;

                    return {
                      id: row.id,
                      type: 'entry',
                      category: 'anamnesis',
                      title: row.queixa_principal || 'Anamnese Psicológica',
                      snippet: buildSnippet(searchableText, term, 'Anamnese psicológica'),
                      date: row.created_at,
                      tabKey: 'anamnese',
                      sourceTable: 'patient_anamnese_psicologia',
                      sourceRecordId: row.id,
                    };
                  },
                },
                {
                  sourceTable: 'psychology_diagnostic_hypotheses',
                  type: 'entry' as const,
                  category: 'diagnostico',
                  tabKey: 'diagnostico',
                  dateField: 'created_at',
                  buildQuery: () => {
                    let query = supabase
                      .from('psychology_diagnostic_hypotheses')
                      .select('id, hipotese_principal, hipoteses_secundarias, descricao_clinica, sintomas_observados, observacoes, data_registro, appointment_id, professional_id')
                      .eq('clinic_id', clinicId)
                      .eq('patient_id', patientId)
                      .order('created_at', { ascending: false })
                      .limit(1000);

                    if (appointmentId) query = query.eq('appointment_id', appointmentId);
                    if (professionalId) query = query.eq('professional_id', professionalId);

                    return query;
                  },
                  toHit: (row: any): RemoteHit | null => {
                    const searchableText = extractSearchText(row);
                    if (!includesSearchTerm(searchableText, term)) return null;

                    return {
                      id: row.id,
                      type: 'entry',
                      category: 'diagnostico',
                      title: row.hipotese_principal || 'Hipótese Diagnóstica',
                      snippet: buildSnippet(searchableText, term, 'Hipótese diagnóstica psicológica'),
                      date: row.data_registro || row.created_at,
                      tabKey: 'diagnostico',
                      sourceTable: 'psychology_diagnostic_hypotheses',
                      sourceRecordId: row.id,
                    };
                  },
                },
              ]
            : []),
          ...(specialtyKey === 'pediatria'
            ? [
                {
                  sourceTable: 'body_measurements',
                  type: 'entry' as const,
                  category: 'exam',
                  tabKey: 'crescimento_desenvolvimento',
                  dateField: 'created_at',
                  buildQuery: () => supabase
                    .from('body_measurements')
                    .select('id, measurement_type, data, created_at, appointment_id, professional_id')
                    .eq('clinic_id', clinicId)
                    .eq('patient_id', patientId)
                    .in('measurement_type', ['pediatric_growth', 'pediatric_milestones'])
                    .order('created_at', { ascending: false })
                    .limit(1000),
                  toHit: (row: any): RemoteHit | null => {
                    const searchableText = extractSearchText(row);
                    if (!includesSearchTerm(searchableText, term)) return null;

                    return {
                      id: row.id,
                      type: 'entry',
                      category: 'exam',
                      title: row.measurement_type === 'pediatric_milestones' ? 'Marcos do Desenvolvimento' : 'Crescimento e Desenvolvimento',
                      snippet: buildSnippet(searchableText, term, 'Registro pediátrico'),
                      date: row.created_at,
                      tabKey: 'crescimento_desenvolvimento',
                      sourceTable: 'body_measurements',
                      sourceRecordId: row.id,
                    };
                  },
                },
              ]
            : []),
          ...(specialtyKey === 'dermatologia'
            ? [
                {
                  sourceTable: 'patient_condutas',
                  type: 'entry' as const,
                  category: 'conduta',
                  tabKey: 'conduta',
                  dateField: 'created_at',
                  buildQuery: () => supabase
                    .from('patient_condutas')
                    .select('id, orientacoes, solicitacao_exames, prescricoes, encaminhamentos, retorno_observacoes, data_hora, created_at, appointment_id, profissional_id')
                    .eq('clinic_id', clinicId)
                    .eq('patient_id', patientId)
                    .order('created_at', { ascending: false })
                    .limit(1000),
                  toHit: (row: any): RemoteHit | null => {
                    const searchableText = extractSearchText(row);
                    if (!includesSearchTerm(searchableText, term)) return null;

                    return {
                      id: row.id,
                      type: 'entry',
                      category: 'conduta',
                      title: 'Plano de Conduta Dermatológica',
                      snippet: buildSnippet(searchableText, term, 'Plano dermatológico'),
                      date: row.data_hora || row.created_at,
                      tabKey: 'conduta',
                      sourceTable: 'patient_condutas',
                      sourceRecordId: row.id,
                    };
                  },
                },
              ]
            : []),
          {
            sourceTable: 'clinical_addendums',
            type: 'entry' as const,
            category: 'addendum',
            tabKey: 'evolucao',
            dateField: 'created_at',
            buildQuery: () => {
              let query = supabase
                .from('clinical_addendums')
                .select('id, content, reason, record_type, record_id, created_at, specialty_id, professional_id')
                .eq('clinic_id', clinicId)
                .eq('patient_id', patientId)
                .order('created_at', { ascending: false })
                .limit(1000);

              if (specialtyId) query = query.eq('specialty_id', specialtyId);
              if (professionalId) query = query.eq('professional_id', professionalId);

              return query;
            },
            toHit: (row: any): RemoteHit | null => {
              const searchableText = extractSearchText(row);
              if (!includesSearchTerm(searchableText, term)) return null;

              return {
                id: row.id,
                type: 'entry',
                category: 'addendum',
                title: `Adendo em ${row.record_type || 'registro'}`,
                snippet: buildSnippet(searchableText, term, row.reason || 'Adendo clínico'),
                date: row.created_at,
                tabKey: row.record_type === 'clinical_documents' ? 'documentos_clinicos' : 'evolucao',
                sourceTable: 'clinical_addendums',
                sourceRecordId: row.record_id || row.id,
              };
            },
          },
          {
            sourceTable: 'clinical_alerts',
            type: 'alert' as const,
            category: 'alert',
            tabKey: 'alertas',
            dateField: 'created_at',
            buildQuery: () => {
              let query = supabase
                .from('clinical_alerts')
                .select('id, title, description, alert_type, severity, created_at, appointment_id, is_active')
                .eq('clinic_id', clinicId)
                .eq('patient_id', patientId)
                .order('created_at', { ascending: false })
                .limit(1000);

              if (appointmentId) query = query.eq('appointment_id', appointmentId);

              return query;
            },
            toHit: (row: any): RemoteHit | null => {
              const searchableText = extractSearchText(row);
              if (!includesSearchTerm(searchableText, term)) return null;

              return {
                id: row.id,
                type: 'alert',
                category: row.severity || 'info',
                title: row.title || 'Alerta Clínico',
                snippet: buildSnippet(searchableText, term, row.description || 'Alerta clínico'),
                date: row.created_at,
                tabKey: 'alertas',
                sourceTable: 'clinical_alerts',
                sourceRecordId: row.id,
              };
            },
          },
          ...(specialtyKey === 'estetica'
            ? [
                {
                  sourceTable: 'facial_maps',
                  type: 'entry' as const,
                  category: 'facial_map',
                  tabKey: 'facial_map',
                  dateField: 'created_at',
                  buildQuery: () => {
                    let query = supabase
                      .from('facial_maps')
                      .select('id, map_type, general_notes, created_at, appointment_id, professional_id')
                      .eq('clinic_id', clinicId)
                      .eq('patient_id', patientId)
                      .order('created_at', { ascending: false })
                      .limit(1000);

                    if (appointmentId) query = query.eq('appointment_id', appointmentId);
                    if (professionalId) query = query.eq('professional_id', professionalId);

                    return query;
                  },
                  toHit: (row: any): RemoteHit | null => {
                    const searchableText = extractSearchText(row);
                    if (!includesSearchTerm(searchableText, term)) return null;

                    return {
                      id: row.id,
                      type: 'entry',
                      category: 'facial_map',
                      title: 'Mapa Facial',
                      snippet: buildSnippet(searchableText, term, row.general_notes || 'Mapa facial'),
                      date: row.created_at,
                      tabKey: 'facial_map',
                      sourceTable: 'facial_maps',
                      sourceRecordId: row.id,
                    };
                  },
                },
                {
                  sourceTable: 'aesthetic_products_used',
                  type: 'entry' as const,
                  category: 'produto',
                  tabKey: 'produtos_utilizados',
                  dateField: 'registered_at',
                  buildQuery: () => {
                    let query = supabase
                      .from('aesthetic_products_used')
                      .select('id, product_name, manufacturer, batch_number, procedure_description, procedure_type, application_area, notes, registered_at, appointment_id')
                      .eq('clinic_id', clinicId)
                      .eq('patient_id', patientId)
                      .order('registered_at', { ascending: false })
                      .limit(1000);

                    if (appointmentId) query = query.eq('appointment_id', appointmentId);

                    return query;
                  },
                  toHit: (row: any): RemoteHit | null => {
                    const searchableText = extractSearchText(row);
                    if (!includesSearchTerm(searchableText, term)) return null;

                    return {
                      id: row.id,
                      type: 'entry',
                      category: 'produto',
                      title: row.product_name || 'Produto Utilizado',
                      snippet: buildSnippet(searchableText, term, row.notes || 'Produto utilizado'),
                      date: row.registered_at,
                      tabKey: 'produtos_utilizados',
                      sourceTable: 'aesthetic_products_used',
                      sourceRecordId: row.id,
                    };
                  },
                },
                {
                  sourceTable: 'clinical_performed_procedures',
                  type: 'entry' as const,
                  category: 'procedimento_realizado',
                  tabKey: 'procedimentos_realizados',
                  dateField: 'performed_at',
                  buildQuery: () => {
                    let query = supabase
                      .from('clinical_performed_procedures')
                      .select('id, procedure_name, region, technique, notes, status, performed_at, appointment_id, specialty_id, professional_id, procedure_id')
                      .eq('clinic_id', clinicId)
                      .eq('patient_id', patientId)
                      .order('performed_at', { ascending: false })
                      .limit(1000);

                    if (specialtyId) query = query.eq('specialty_id', specialtyId);
                    if (appointmentId) query = query.eq('appointment_id', appointmentId);
                    if (professionalId) query = query.eq('professional_id', professionalId);
                    if (procedureId) query = query.eq('procedure_id', procedureId);

                    return query;
                  },
                  toHit: (row: any): RemoteHit | null => {
                    const searchableText = extractSearchText(row);
                    if (!includesSearchTerm(searchableText, term)) return null;

                    return {
                      id: row.id,
                      type: 'entry',
                      category: 'procedimento_realizado',
                      title: row.procedure_name || 'Procedimento Realizado',
                      snippet: buildSnippet(searchableText, term, row.notes || 'Procedimento realizado'),
                      date: row.performed_at,
                      tabKey: 'procedimentos_realizados',
                      sourceTable: 'clinical_performed_procedures',
                      sourceRecordId: row.id,
                    };
                  },
                },
                {
                  sourceTable: 'aesthetic_before_after',
                  type: 'file' as const,
                  category: 'before_after',
                  tabKey: 'before_after_photos',
                  dateField: 'created_at',
                  buildQuery: () => {
                    let query = supabase
                      .from('aesthetic_before_after')
                      .select('id, title, description, procedure_type, view_angle, created_at, appointment_id, procedure_id')
                      .eq('clinic_id', clinicId)
                      .eq('patient_id', patientId)
                      .order('created_at', { ascending: false })
                      .limit(1000);

                    if (appointmentId) query = query.eq('appointment_id', appointmentId);
                    if (procedureId) query = query.eq('procedure_id', procedureId);

                    return query;
                  },
                  toHit: (row: any): RemoteHit | null => {
                    const searchableText = extractSearchText(row);
                    if (!includesSearchTerm(searchableText, term)) return null;

                    return {
                      id: row.id,
                      type: 'file',
                      category: 'before_after',
                      title: row.title || 'Antes e Depois',
                      snippet: buildSnippet(searchableText, term, row.description || 'Registro antes e depois'),
                      date: row.created_at,
                      tabKey: 'before_after_photos',
                      sourceTable: 'aesthetic_before_after',
                      sourceRecordId: row.id,
                    };
                  },
                },
              ]
            : []),
        ];

        const response = await Promise.all(
          searchDefinitions.map(async (definition) => {
            try {
              const { data, error } = await definition.buildQuery();

              if (error) {
                console.error(`[ProntuarioSearch] ${definition.sourceTable} error`, error);
                return { definition, rows: 0, hits: 0, results: [] as RemoteHit[] };
              }

              const rows = data || [];
              const results = rows
                .map((row: any) => definition.toHit(row))
                .filter((hit: RemoteHit | null): hit is RemoteHit => hit !== null);

              return {
                definition,
                rows: rows.length,
                hits: results.length,
                results,
              };
            } catch (tableError) {
              console.error(`[ProntuarioSearch] ${definition.sourceTable} unexpected failure`, tableError);
              return { definition, rows: 0, hits: 0, results: [] as RemoteHit[] };
            }
          })
        );

        if (cancelled) return;

        const hits = response.flatMap(item => item.results);

        console.log('[ProntuarioSearch] entities consulted', response.map(item => ({
          table: item.definition.sourceTable,
          rows: item.rows,
          hits: item.hits,
          specialtyKey: specialtyKey || null,
          specialtyId: specialtyId || null,
          appointmentId: appointmentId || null,
          professionalId: professionalId || null,
        })));

        console.log('[ProntuarioSearch] results by tab', {
          all: hits.length,
          evolucoes: hits.filter(hit => hit.type === 'entry').length,
          arquivos: hits.filter(hit => hit.type === 'file').length,
          alertas: hits.filter(hit => hit.type === 'alert').length,
        });

        if (hits.length === 0) {
          console.warn('[ProntuarioSearch] no remote results for current query', {
            term,
            patientId,
            clinicId,
            specialtyId: specialtyId || null,
            appointmentId: appointmentId || null,
          });
        }

        setRemoteHits(hits);
      } catch (err) {
        console.error('[ProntuarioSearch] remote search failed:', err);
        if (!cancelled) setRemoteHits([]);
      }
    })();

    return () => { cancelled = true; };
  }, [debouncedQuery, patientId, clinicId, specialtyId, specialtyKey, appointmentId, professionalId, procedureId]);

  // Check if date is within range
  const isInDateRange = useCallback((dateStr: string) => {
    if (dateRange === 'all') return true;
    
    const date = parseISO(dateStr);
    const now = new Date();
    
    switch (dateRange) {
      case '7d': return isWithinInterval(date, { start: subDays(now, 7), end: now });
      case '30d': return isWithinInterval(date, { start: subDays(now, 30), end: now });
      case '90d': return isWithinInterval(date, { start: subMonths(now, 3), end: now });
      case '1y': return isWithinInterval(date, { start: subYears(now, 1), end: now });
      default: return true;
    }
  }, [dateRange]);

  // Highlight matching text
  const highlightText = (text: string, searchTerm: string) => {
    if (!searchTerm.trim()) return text;
    const regex = new RegExp(`(${searchTerm.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
    const parts = text.split(regex);
    return parts.map((part, i) => 
      regex.test(part) ? <mark key={i} className="bg-yellow-200 dark:bg-yellow-800 px-0.5 rounded">{part}</mark> : part
    );
  };

  // Extract text content from entry for search
  const extractEntryText = (entry: MedicalRecordEntry): string => {
    return extractSearchText({
      entry_type: entry.entry_type,
      template_id: entry.template_id,
      notes: entry.notes,
      content: entry.content,
      status: entry.status,
    });
  };

  // Search across all data
  const searchResults = useMemo(() => {
    if (!debouncedQuery.trim() || debouncedQuery.length < 2) return [];
    
    const results: SearchResult[] = [];
    const searchLower = debouncedQuery.toLowerCase();

    // Search in Entries
    if (activeFilter === 'all' || activeFilter === 'entry') {
      for (const entry of entries) {
        if (!isInDateRange(entry.created_at)) continue;
        
        const searchableText = extractEntryText(entry);
        
        if (includesSearchTerm(searchableText, searchLower)) {
          const tabKey = entryTypeToTab[entry.entry_type] || entryTypeToTab['default'];

          results.push({
            id: entry.id,
            type: 'entry',
            category: entry.entry_type,
            title: categoryLabels[entry.entry_type] || 'Evolução',
            snippet: buildSnippet(searchableText, debouncedQuery, 'Registro clínico'),
            date: entry.created_at,
            tabKey,
            highlight: [debouncedQuery],
            sourceTable: entry.entry_type === 'anamnesis' ? 'anamnesis_records' : 'clinical_evolutions',
            sourceRecordId: entry.id,
          });
        }
      }
    }

    // Search in Files
    if (activeFilter === 'all' || activeFilter === 'file') {
      for (const file of files) {
        if (!isInDateRange(file.created_at)) continue;
        
        const searchableText = `${file.file_name} ${file.description || ''} ${file.category}`;
        
        if (includesSearchTerm(searchableText, searchLower)) {
          results.push({
            id: file.id,
            type: 'file',
            category: file.category,
            title: file.file_name,
            snippet: buildSnippet(searchableText, debouncedQuery, file.description || `Arquivo ${categoryLabels[file.category] || file.category}`),
            date: file.created_at,
            tabKey: 'exames',
            highlight: [debouncedQuery],
            sourceTable: 'clinical_media',
            sourceRecordId: file.id,
          });
        }
      }
    }

    // Search in Alerts
    if (activeFilter === 'all' || activeFilter === 'alert') {
      for (const alert of alerts) {
        if (!isInDateRange(alert.created_at)) continue;
        
        const searchableText = `${alert.title} ${alert.description || ''} ${alert.alert_type}`;
        
        if (includesSearchTerm(searchableText, searchLower)) {
          results.push({
            id: alert.id,
            type: 'alert',
            category: alert.alert_type,
            title: alert.title,
            snippet: buildSnippet(searchableText, debouncedQuery, alert.description || `Alerta ${alert.severity}`),
            date: alert.created_at,
            tabKey: 'alertas',
            highlight: [debouncedQuery],
            sourceTable: 'clinical_alerts',
            sourceRecordId: alert.id,
          });
        }
      }
    }

    // Merge remote DB hits (clinical_documents/media/addendums/alerts)
    const seen = new Set(results.map((r) => `${r.sourceTable || r.type}-${r.id}`));
    for (const h of remoteHits) {
      if (activeFilter !== 'all' && activeFilter !== h.type) continue;
      if (!isInDateRange(h.date)) continue;
      const key = `${h.sourceTable}-${h.id}`;
      if (seen.has(key)) continue;
      seen.add(key);
      results.push({ ...h, highlight: [debouncedQuery] });
    }

    console.log(`[ProntuarioSearch] term="${debouncedQuery}" filter="${activeFilter}" total results: ${results.length} (local entries:${entries.length}, files:${files.length}, alerts:${alerts.length}, remote:${remoteHits.length})`);

    // Sort by date (newest first)
    return results.sort((a, b) => 
      new Date(b.date).getTime() - new Date(a.date).getTime()
    ).slice(0, 50);
  }, [debouncedQuery, activeFilter, entries, files, alerts, remoteHits, isInDateRange]);

  const handleResultClick = (result: SearchResult) => {
    console.log('[ProntuarioSearch] result clicked', result);
    onNavigateToTab(result.tabKey);
    onResultClick(result);
    scheduleResultNavigation(result);
    setIsOpen(false);
    setQuery("");
  };

  const getResultIcon = (type: SearchResultType, category?: string) => {
    if (type === 'alert') return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
    if (type === 'file') {
      if (category === 'image') return <Stethoscope className="h-4 w-4 text-purple-500" />;
      return <Paperclip className="h-4 w-4 text-green-500" />;
    }
    return <FileText className="h-4 w-4 text-primary" />;
  };

  const getSeverityBadge = (type: SearchResultType, category: string) => {
    if (type === 'alert') {
      const colors: Record<string, string> = {
        critical: 'bg-red-100 text-red-700 border-red-200',
        warning: 'bg-yellow-100 text-yellow-700 border-yellow-200',
        info: 'bg-blue-100 text-blue-700 border-blue-200',
      };
      return colors[category] || colors.info;
    }
    return 'bg-muted text-muted-foreground';
  };

  return (
    <div ref={containerRef} className={cn("relative w-full", className)}>
      {/* Search Input */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          ref={inputRef}
          type="text"
          placeholder="Pesquisar no prontuário..."
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setIsOpen(e.target.value.length >= 2);
          }}
          onFocus={() => query.length >= 2 && setIsOpen(true)}
          className="pl-10 pr-20 h-10 bg-background"
        />
        <div className="absolute right-1 top-1/2 transform -translate-y-1/2 flex items-center gap-1">
          {isSearching && (
            <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
          )}
          {query && (
            <Button
              variant="ghost"
              size="sm"
              className="h-7 w-7 p-0"
              onClick={() => {
                setQuery("");
                setIsOpen(false);
                inputRef.current?.focus();
              }}
            >
              <X className="h-4 w-4" />
            </Button>
          )}
          <Button
            variant="ghost"
            size="sm"
            className={cn("h-7 w-7 p-0", showFilters && "bg-muted")}
            onClick={() => setShowFilters(!showFilters)}
          >
            <Filter className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Search Results Dropdown */}
      {isOpen && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-background border rounded-lg shadow-lg z-50 overflow-hidden">
          {/* Type Filters */}
          <div className="flex items-center gap-1 p-2 border-b bg-muted/30 overflow-x-auto">
            {filterOptions.map(filter => (
              <Button
                key={filter.id}
                variant={activeFilter === filter.id ? "secondary" : "ghost"}
                size="sm"
                className="h-7 text-xs whitespace-nowrap"
                onClick={() => setActiveFilter(filter.id)}
              >
                {filter.icon}
                <span className="ml-1">{filter.label}</span>
              </Button>
            ))}
          </div>

          {/* Date Range Filters (toggle) */}
          {showFilters && (
            <div className="flex items-center gap-1 p-2 border-b bg-muted/20 overflow-x-auto">
              <Calendar className="h-3 w-3 text-muted-foreground mr-1" />
              {dateRangeOptions.map(option => (
                <Button
                  key={option.id}
                  variant={dateRange === option.id ? "secondary" : "ghost"}
                  size="sm"
                  className="h-6 text-xs whitespace-nowrap"
                  onClick={() => setDateRange(option.id)}
                >
                  {option.label}
                </Button>
              ))}
            </div>
          )}

          {/* Results */}
          <ScrollArea className="max-h-80">
            {isSearching ? (
              <div className="p-6 text-center">
                <Loader2 className="h-6 w-6 animate-spin mx-auto text-muted-foreground" />
                <p className="text-sm text-muted-foreground mt-2">Pesquisando...</p>
              </div>
            ) : searchResults.length > 0 ? (
              <div className="divide-y">
                {searchResults.map(result => (
                  <button
                    key={`${result.type}-${result.id}`}
                    className="w-full p-3 hover:bg-muted/50 transition-colors text-left flex items-start gap-3"
                    onClick={() => handleResultClick(result)}
                  >
                    <div className="mt-0.5">
                      {getResultIcon(result.type, result.category)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-medium text-sm truncate">
                          {result.title}
                        </span>
                        <Badge 
                          variant="outline" 
                          className={cn("text-xs shrink-0", getSeverityBadge(result.type, result.category))}
                        >
                          {categoryLabels[result.category] || result.category}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground mt-0.5 line-clamp-2">
                        {highlightText(result.snippet, debouncedQuery)}
                      </p>
                      <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                        <Calendar className="h-3 w-3" />
                        <span>{format(parseISO(result.date), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}</span>
                      </div>
                    </div>
                    <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0 mt-1" />
                  </button>
                ))}
              </div>
            ) : debouncedQuery.length >= 2 ? (
              <div className="p-6 text-center text-muted-foreground">
                <Search className="h-8 w-8 mx-auto mb-2 opacity-30" />
                <p className="text-sm">Nenhum resultado para "{debouncedQuery}"</p>
                <p className="text-xs mt-1">Tente outros termos ou ajuste os filtros</p>
              </div>
            ) : (
              <div className="p-6 text-center text-muted-foreground">
                <Search className="h-8 w-8 mx-auto mb-2 opacity-30" />
                <p className="text-sm">Digite pelo menos 2 caracteres</p>
              </div>
            )}
          </ScrollArea>

          {searchResults.length > 0 && (
            <div className="p-2 border-t bg-muted/30 text-xs text-muted-foreground text-center">
              {searchResults.length} resultado(s) encontrado(s)
              {dateRange !== 'all' && ` • ${dateRangeOptions.find(d => d.id === dateRange)?.label}`}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
