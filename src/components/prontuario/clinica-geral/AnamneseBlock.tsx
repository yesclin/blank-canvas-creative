import { useState, useMemo, useCallback, useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useClinicData } from "@/hooks/useClinicData";
import { AnamnesisTemplateBuilderDialog } from "@/components/configuracoes/AnamnesisTemplateBuilderDialog";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  FileText,
  Edit3,
  Save,
  X,
  Clock,
  History,
  AlertTriangle,
  Stethoscope,
  ChevronRight,
  Lock,
  Settings,
  Check,
  CheckCircle2,
  Calculator,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  calculateIMC,
  mapStructuredToLegacy,
  type SecaoAnamnese,
} from "@/hooks/prontuario/clinica-geral/anamneseTemplates";
import { useAnamnesisTemplatesV2, type AnamnesisTemplateV2, type TemplateSection } from "@/hooks/useAnamnesisTemplatesV2";
import { useInstitutionalPdf } from "@/hooks/useInstitutionalPdf";
import { FileDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

// ─── Types ───────────────────────────────────────────────────────────

export interface AnamneseData {
  id: string;
  patient_id: string;
  version: number;
  queixa_principal: string;
  historia_doenca_atual: string;
  antecedentes_pessoais: string;
  antecedentes_familiares: string;
  habitos_vida: string;
  medicamentos_uso_continuo: string;
  alergias: string;
  comorbidades: string;
  historia_ginecologica?: string;
  revisao_sistemas?: string;
  structured_data?: Record<string, unknown>;
  template_id?: string;
  created_at: string;
  created_by: string;
  created_by_name?: string;
  is_current: boolean;
}

interface AnamneseBlockProps {
  currentAnamnese: AnamneseData | null;
  anamneseHistory: AnamneseData[];
  loading?: boolean;
  saving?: boolean;
  canEdit?: boolean;
  onSave: (data: Omit<AnamneseData, 'id' | 'patient_id' | 'version' | 'created_at' | 'created_by' | 'created_by_name' | 'is_current'>) => Promise<void>;
  onUpdate?: (id: string, data: Omit<AnamneseData, 'id' | 'patient_id' | 'version' | 'created_at' | 'created_by' | 'created_by_name' | 'is_current'>) => Promise<void>;
  patientName?: string;
  patientCpf?: string;
  patientData?: any;
  specialtyId?: string | null;
  specialtyName?: string | null;
}

// ─── Multi-select badge component ────────────────────────────────────

function MultiSelectField({
  options, value, onChange, readOnly
}: { options: string[]; value: string[]; onChange: (v: string[]) => void; readOnly?: boolean }) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {options.map(opt => {
        const selected = value.includes(opt);
        return (
          <Badge
            key={opt}
            variant={selected ? 'default' : 'outline'}
            className={!readOnly ? 'cursor-pointer transition-colors' : ''}
            onClick={() => {
              if (readOnly) return;
              onChange(selected ? value.filter(v => v !== opt) : [...value, opt]);
            }}
          >
            {selected ? '✓ ' : ''}{opt}
          </Badge>
        );
      })}
    </div>
  );
}

// ─── Unified template type ───────────────────────────────────────

interface UnifiedTemplate {
  id: string;
  nome: string;
  descricao: string;
  icon: string;
  is_system: boolean;
  secoes: SecaoAnamnese[];
}

// Fields that duplicate patient/appointment data and must be excluded
const IDENTIFICATION_FIELD_IDS = new Set([
  'f_nome', 'f_idade', 'f_data_atendimento', 'f_profissional', 'f_sexo',
]);

const IDENTIFICATION_SECTION_IDS = new Set([
  'section_identificacao', 'identificacao', 'identificacao_complementar',
]);

function v2TemplateToUnified(t: AnamnesisTemplateV2): UnifiedTemplate {
  return {
    id: t.id,
    nome: t.name,
    descricao: t.description || '',
    icon: t.icon || 'Stethoscope',
    is_system: t.is_system,
    secoes: t.structure
      .map(section => {
        // Filter out identification fields from any section
        const filteredFields = (section.fields || []).filter(f => !IDENTIFICATION_FIELD_IDS.has(f.id));
        return {
          id: section.id,
          titulo: section.title,
          icon: 'Stethoscope',
          campos: filteredFields.map(f => ({
            id: f.id,
            label: f.label,
            type: f.type as any,
            placeholder: f.placeholder,
            options: f.options,
            required: f.required,
            section: section.title,
          })),
        };
      })
      // Remove sections that are now empty OR are pure identification sections
      .filter(s => s.campos.length > 0 || !IDENTIFICATION_SECTION_IDS.has(s.id))
      .filter(s => s.campos.length > 0),
  };
}

// ─── Main component ──────────────────────────────────────────────────

export function AnamneseBlock({
  currentAnamnese,
  anamneseHistory,
  loading = false,
  saving = false,
  canEdit = false,
  onSave,
  onUpdate,
  patientName,
  patientCpf,
  patientData,
  specialtyId,
  specialtyName,
}: AnamneseBlockProps) {
  const navigate = useNavigate();
  const { generateAnamnesisPdf, generating } = useInstitutionalPdf();

  const [isEditing, setIsEditing] = useState(false);
  const [isEditingExisting, setIsEditingExisting] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [selectedVersion, setSelectedVersion] = useState<AnamneseData | null>(null);
  const [structuredData, setStructuredData] = useState<Record<string, unknown>>({});
  const [selectedTemplateId, setSelectedTemplateId] = useState<string | null>(null);
  const [pendingTemplateId, setPendingTemplateId] = useState<string | null>(null);
  const [showSwitchConfirm, setShowSwitchConfirm] = useState(false);
  const [showTemplateEditor, setShowTemplateEditor] = useState(false);
  const [editingV2Template, setEditingV2Template] = useState<AnamnesisTemplateV2 | null>(null);
  const [creatingDefault, setCreatingDefault] = useState(false);
  const [lastAutoSave, setLastAutoSave] = useState<Date | null>(null);

  // Auto-save refs
  const autoSaveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastSavedData = useRef<string>('');

  // ─── Fetch clinic templates from DB (V2) ──────────────────────────
  const { templates: v2Templates, isLoading: loadingTemplates, createTemplate } = useAnamnesisTemplatesV2({
    specialtyId: specialtyId,
    activeOnly: true
  });

  const allTemplates: UnifiedTemplate[] = useMemo(() => {
    return v2Templates.map(v2TemplateToUnified);
  }, [v2Templates]);

  const activeTemplate = useMemo(() => {
    if (!allTemplates.length) return null;
    if (selectedTemplateId) {
      const found = allTemplates.find(t => t.id === selectedTemplateId);
      if (found) return found;
    }
    const defaultTpl = allTemplates.find(t => allTemplates.length === 1 || t.is_system);
    return defaultTpl || allTemplates[0];
  }, [allTemplates, selectedTemplateId]);

  useEffect(() => {
    if (activeTemplate && !selectedTemplateId) {
      setSelectedTemplateId(activeTemplate.id);
    }
  }, [activeTemplate, selectedTemplateId]);

  // ─── Auto-save (10s debounce, silent) ───────────────────────────────
  useEffect(() => {
    if (!isEditing) return;
    const currentDataStr = JSON.stringify(structuredData);
    if (currentDataStr === lastSavedData.current || currentDataStr === '{}') return;

    if (autoSaveTimer.current) clearTimeout(autoSaveTimer.current);
    autoSaveTimer.current = setTimeout(() => {
      lastSavedData.current = currentDataStr;
      setLastAutoSave(new Date());
    }, 10000);

    return () => {
      if (autoSaveTimer.current) clearTimeout(autoSaveTimer.current);
    };
  }, [structuredData, isEditing]);

  // ─── IMC calculation ────────────────────────────────────────────
  const imcResult = useMemo(() => {
    const peso = structuredData.peso_kg as number | null;
    const altura = structuredData.altura_cm as number | null;
    return calculateIMC(peso ?? null, altura ?? null);
  }, [structuredData.peso_kg, structuredData.altura_cm]);

  // ─── Check if form has data ─────────────────────────────────────
  const hasFilledData = useCallback(() => {
    return Object.values(structuredData).some(v => {
      if (Array.isArray(v)) return v.length > 0;
      return v !== undefined && v !== null && v !== '';
    });
  }, [structuredData]);

  // ─── Template switch handler ────────────────────────────────────
  const handleTemplateSwitch = useCallback((newTemplateId: string) => {
    if (newTemplateId === selectedTemplateId) return;
    if (hasFilledData()) {
      setPendingTemplateId(newTemplateId);
      setShowSwitchConfirm(true);
    } else {
      setSelectedTemplateId(newTemplateId);
      setStructuredData({});
    }
  }, [selectedTemplateId, hasFilledData]);

  const confirmTemplateSwitch = useCallback(() => {
    if (pendingTemplateId) {
      setSelectedTemplateId(pendingTemplateId);
      setStructuredData({});
      setPendingTemplateId(null);
    }
    setShowSwitchConfirm(false);
  }, [pendingTemplateId]);

  // ─── Open template editor ──────────────────────────────────────
  const handleOpenTemplateEditor = useCallback(() => {
    if (!activeTemplate || activeTemplate.is_system) {
      setEditingV2Template(null);
    } else {
      const v2Tpl = v2Templates.find(t => t.id === activeTemplate.id);
      setEditingV2Template(v2Tpl || null);
    }
    setShowTemplateEditor(true);
  }, [activeTemplate, v2Templates]);

  // ─── Create default template (IDEMPOTENT) ─────────────────────
  const { clinic } = useClinicData();

  const handleCreateDefaultTemplate = useCallback(async () => {
    if (!specialtyId || !clinic?.id || creatingDefault) return;
    setCreatingDefault(true);
    try {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) throw new Error('Usuário não autenticado');

      // ── 1. Check if a template already exists for this clinic+specialty ──
      const { data: existing, error: fetchErr } = await supabase
        .from('anamnesis_templates')
        .select('id, current_version_id, is_active, is_default')
        .eq('clinic_id', clinic.id)
        .eq('specialty_id', specialtyId)
        .eq('archived', false)
        .limit(1)
        .maybeSingle();

      if (fetchErr) {
        console.error('Erro ao verificar modelo existente:', { code: (fetchErr as any).code, message: fetchErr.message, details: (fetchErr as any).details, clinic_id: clinic.id, specialty_id: specialtyId });
        throw fetchErr;
      }

      // ── If template exists, just ensure it's active+default and reload ──
      if (existing) {
        console.log('Modelo de anamnese já existe, reutilizando:', existing.id);
        if (!existing.is_active || !existing.is_default) {
          await supabase
            .from('anamnesis_templates')
            .update({ is_active: true, is_default: true } as any)
            .eq('id', existing.id);
        }
        // Force refetch templates
        window.location.reload();
        return;
      }

      // ── 2. No template found — create one ──
      const defaultStructure: TemplateSection[] = [
        // BLOCO 1 — Queixa Principal
        {
          id: 'section_queixa_principal', type: 'section', title: 'Queixa Principal',
          fields: [
            { id: 'f_queixa_principal', type: 'textarea', label: 'Queixa principal', required: true, placeholder: 'Descreva a queixa principal do paciente nas palavras dele...' },
          ],
        },
        // BLOCO 2 — História da Doença Atual (HDA)
        {
          id: 'section_hda', type: 'section', title: 'História da Doença Atual (HDA)',
          fields: [
            { id: 'f_hda_inicio', type: 'text', label: 'Início dos sintomas', placeholder: 'Ex: Há 3 dias, após esforço físico' },
            { id: 'f_hda_evolucao', type: 'textarea', label: 'Evolução', placeholder: 'Progressiva, estável, intermitente...' },
            { id: 'f_hda_localizacao_irradiacao', type: 'text', label: 'Localização / Irradiação', placeholder: 'Ex: Precordial, irradiando para braço esquerdo' },
            { id: 'f_hda_intensidade', type: 'select', label: 'Intensidade (0-10)', options: ['0','1','2','3','4','5','6','7','8','9','10'] },
            { id: 'f_hda_sintomas_associados', type: 'textarea', label: 'Sintomas associados', placeholder: 'Náusea, febre, dispneia, sudorese...' },
            { id: 'f_hda_piora_melhora', type: 'textarea', label: 'Fatores de piora / melhora', placeholder: 'O que piora e o que alivia os sintomas...' },
            { id: 'f_hda_tratamentos_previos', type: 'textarea', label: 'Tratamentos prévios', placeholder: 'Medicamentos, procedimentos já realizados...' },
          ],
        },
        // BLOCO 3 — Revisão de Sistemas
        {
          id: 'section_revisao_sistemas', type: 'section', title: 'Revisão de Sistemas',
          fields: [
            { id: 'f_rs_febre', type: 'select', label: 'Febre', options: ['Não','Sim'] },
            { id: 'f_rs_febre_obs', type: 'text', label: 'Febre — observação', placeholder: 'Detalhes...' },
            { id: 'f_rs_perda_peso', type: 'select', label: 'Perda de peso', options: ['Não','Sim'] },
            { id: 'f_rs_perda_peso_obs', type: 'text', label: 'Perda de peso — observação', placeholder: 'Quanto, em quanto tempo...' },
            { id: 'f_rs_dispneia', type: 'select', label: 'Dispneia', options: ['Não','Sim'] },
            { id: 'f_rs_dispneia_obs', type: 'text', label: 'Dispneia — observação', placeholder: 'Aos esforços, em repouso...' },
            { id: 'f_rs_dor_toracica', type: 'select', label: 'Dor torácica', options: ['Não','Sim'] },
            { id: 'f_rs_dor_toracica_obs', type: 'text', label: 'Dor torácica — observação', placeholder: 'Tipo, duração...' },
            { id: 'f_rs_nauseas_vomitos', type: 'select', label: 'Náuseas / Vômitos', options: ['Não','Sim'] },
            { id: 'f_rs_nauseas_obs', type: 'text', label: 'Náuseas — observação', placeholder: 'Frequência, gatilhos...' },
            { id: 'f_rs_intestinal', type: 'select', label: 'Alterações intestinais', options: ['Não','Sim'] },
            { id: 'f_rs_intestinal_obs', type: 'text', label: 'Intestinal — observação', placeholder: 'Constipação, diarreia...' },
            { id: 'f_rs_urinario', type: 'select', label: 'Alterações urinárias', options: ['Não','Sim'] },
            { id: 'f_rs_urinario_obs', type: 'text', label: 'Urinário — observação', placeholder: 'Disúria, polaciúria...' },
            { id: 'f_rs_cefaleia_tontura', type: 'select', label: 'Cefaleia / Tontura', options: ['Não','Sim'] },
            { id: 'f_rs_cefaleia_obs', type: 'text', label: 'Cefaleia — observação', placeholder: 'Tipo, frequência...' },
            { id: 'f_rs_edema', type: 'select', label: 'Edema', options: ['Não','Sim'] },
            { id: 'f_rs_edema_obs', type: 'text', label: 'Edema — observação', placeholder: 'Localização, intensidade...' },
            { id: 'f_rs_outros', type: 'textarea', label: 'Outros achados na revisão', placeholder: 'Outros sintomas relevantes...' },
          ],
        },
        // BLOCO 4 — Antecedentes Pessoais
        {
          id: 'section_antecedentes_pessoais', type: 'section', title: 'Antecedentes Pessoais',
          fields: [
            { id: 'f_ap_doencas_preexistentes', type: 'textarea', label: 'Doenças pré-existentes', placeholder: 'HAS, DM, Asma, Cardiopatia...' },
            { id: 'f_ap_internacoes_previas', type: 'textarea', label: 'Internações prévias', placeholder: 'Motivo, data, duração...' },
            { id: 'f_ap_cirurgias_previas', type: 'textarea', label: 'Cirurgias prévias', placeholder: 'Tipo, ano, complicações...' },
            { id: 'f_ap_alergias', type: 'textarea', label: 'Alergias', placeholder: 'Medicamentos, alimentos, contrastes, látex...' },
            { id: 'f_ap_imunizacoes', type: 'text', label: 'Imunizações', placeholder: 'Em dia, pendências...' },
            { id: 'f_ap_gineco_obstetrico', type: 'textarea', label: 'Ginecológico / Obstétrico (se aplicável)', placeholder: 'G_P_A_, DUM, contraceptivos...' },
          ],
        },
        // BLOCO 5 — Medicamentos / Tratamentos
        {
          id: 'section_medicamentos', type: 'section', title: 'Medicamentos / Tratamentos',
          fields: [
            { id: 'f_med_em_uso', type: 'textarea', label: 'Medicamentos em uso', placeholder: 'Nome, dose, posologia...' },
            { id: 'f_med_aderencia', type: 'select', label: 'Aderência ao tratamento', options: ['Boa','Irregular','Baixa'] },
            { id: 'f_med_aderencia_obs', type: 'text', label: 'Observação sobre aderência', placeholder: 'Detalhes...' },
            { id: 'f_med_suplementos', type: 'textarea', label: 'Suplementos / Fitoterápicos', placeholder: 'Suplementos em uso...' },
          ],
        },
        // BLOCO 6 — Antecedentes Familiares
        {
          id: 'section_antecedentes_familiares', type: 'section', title: 'Antecedentes Familiares',
          fields: [
            { id: 'f_af_historico', type: 'textarea', label: 'Histórico familiar', placeholder: 'Pai IAM aos 55a, mãe DM2, irmão HAS...' },
          ],
        },
        // BLOCO 7 — Hábitos de Vida
        {
          id: 'section_habitos_vida', type: 'section', title: 'Hábitos de Vida',
          fields: [
            { id: 'f_hv_tabagismo', type: 'select', label: 'Tabagismo', options: ['Nunca fumou','Ex-fumante','Fumante ativo'] },
            { id: 'f_hv_tabagismo_macos', type: 'text', label: 'Maços/ano (se aplicável)', placeholder: 'Ex: 20 maços/ano' },
            { id: 'f_hv_etilismo', type: 'select', label: 'Etilismo', options: ['Não','Ocasional','Frequente'] },
            { id: 'f_hv_etilismo_qtd', type: 'text', label: 'Quantidade (se aplicável)', placeholder: 'Ex: 2 cervejas/semana' },
            { id: 'f_hv_drogas', type: 'select', label: 'Uso de drogas ilícitas', options: ['Não','Sim'] },
            { id: 'f_hv_drogas_quais', type: 'text', label: 'Quais drogas (se aplicável)', placeholder: 'Especificar...' },
            { id: 'f_hv_atividade_fisica', type: 'text', label: 'Atividade física', placeholder: 'Ex: Caminhada 3x/semana, 30min' },
            { id: 'f_hv_alimentacao', type: 'textarea', label: 'Padrão alimentar', placeholder: 'Descreva resumidamente...' },
            { id: 'f_hv_sono', type: 'text', label: 'Sono', placeholder: 'Ex: 7h/noite, fragmentado' },
            { id: 'f_hv_estresse_trabalho', type: 'textarea', label: 'Estresse / Trabalho', placeholder: 'Nível de estresse, carga de trabalho...' },
          ],
        },
        // BLOCO 8 — Exame Físico
        {
          id: 'section_exame_fisico', type: 'section', title: 'Exame Físico',
          fields: [
            { id: 'f_ef_estado_geral', type: 'text', label: 'Estado geral', placeholder: 'BEG, lúcido, orientado, corado, hidratado...' },
            { id: 'f_ef_pa', type: 'text', label: 'PA (mmHg)', placeholder: 'Ex: 120x80' },
            { id: 'f_ef_fc', type: 'text', label: 'FC (bpm)', placeholder: 'Ex: 72' },
            { id: 'f_ef_fr', type: 'text', label: 'FR (irpm)', placeholder: 'Ex: 16' },
            { id: 'f_ef_temp', type: 'text', label: 'Temperatura (°C)', placeholder: 'Ex: 36.5' },
            { id: 'f_ef_spo2', type: 'text', label: 'SpO₂ (%)', placeholder: 'Ex: 98' },
            { id: 'f_ef_cabeca_pescoco', type: 'textarea', label: 'Cabeça e Pescoço', placeholder: 'Oroscopia, otoscopia, linfonodos...' },
            { id: 'f_ef_cardio', type: 'textarea', label: 'Cardiovascular', placeholder: 'RCR 2T, BNF, sem sopros...' },
            { id: 'f_ef_respiratorio', type: 'textarea', label: 'Respiratório', placeholder: 'MV presente bilateralmente, sem RA...' },
            { id: 'f_ef_abdome', type: 'textarea', label: 'Abdome', placeholder: 'Plano, flácido, indolor à palpação, RHA+...' },
            { id: 'f_ef_neurologico', type: 'textarea', label: 'Neurológico', placeholder: 'Glasgow 15, pupilas isocóricas, sem déficits...' },
            { id: 'f_ef_pele_extremidades', type: 'textarea', label: 'Pele e Extremidades', placeholder: 'Sem lesões, pulsos presentes, sem edema...' },
          ],
        },
        // BLOCO 9 — Hipóteses Diagnósticas
        {
          id: 'section_hipoteses', type: 'section', title: 'Hipóteses Diagnósticas',
          fields: [
            { id: 'f_hd_principais', type: 'textarea', label: 'Hipóteses principais', placeholder: 'CID-10 e descrição...' },
            { id: 'f_hd_diferenciais', type: 'textarea', label: 'Diagnósticos diferenciais', placeholder: 'Liste as hipóteses diferenciais...' },
          ],
        },
        // BLOCO 10 — Plano / Conduta
        {
          id: 'section_conduta', type: 'section', title: 'Plano / Conduta',
          fields: [
            { id: 'f_pc_exames', type: 'textarea', label: 'Exames solicitados', placeholder: 'Hemograma, glicemia, ECG...' },
            { id: 'f_pc_prescricao_orientacoes', type: 'textarea', label: 'Prescrição e Orientações', placeholder: 'Prescrições, orientações gerais...' },
            { id: 'f_pc_encaminhamentos', type: 'textarea', label: 'Encaminhamentos', placeholder: 'Especialidades, exames de imagem...' },
            { id: 'f_pc_retorno', type: 'text', label: 'Retorno', placeholder: 'Ex: em 15 dias, em 1 mês' },
            { id: 'f_pc_sinais_alarme', type: 'textarea', label: 'Sinais de alarme', placeholder: 'Orientar o paciente a retornar se...' },
          ],
        },
      ];

      const name = `Anamnese Padrão - ${specialtyName || 'Geral'} (YesClin)`;

      try {
        await createTemplate({
          name,
          description: 'Modelo padrão criado automaticamente pelo YesClin',
          specialty_id: specialtyId,
          icon: 'Stethoscope',
          is_default: true,
          structure: defaultStructure,
        });
      } catch (createErr: any) {
        // Handle duplicate/conflict — try to fetch and use existing
        if (createErr?.code === '23505' || createErr?.message?.includes('duplicate')) {
          console.warn('Conflito de duplicidade ao criar modelo, buscando existente...');
          window.location.reload();
          return;
        }
        throw createErr;
      }
    } catch (err: any) {
      console.error('Erro ao criar modelo padrão:', {
        code: err?.code,
        message: err?.message,
        details: err?.details,
        clinic_id: clinic?.id,
        specialty_id: specialtyId,
      });
      toast.error(`Erro ao criar modelo: ${err?.message || 'Erro desconhecido'}`);
    } finally {
      setCreatingDefault(false);
    }
  }, [specialtyId, specialtyName, clinic?.id, createTemplate, creatingDefault]);

  // ─── Auto-provision default template if none exist ──────────────
  const autoProvisionTriggered = useRef(false);
  useEffect(() => {
    if (
      !loadingTemplates &&
      allTemplates.length === 0 &&
      specialtyId &&
      clinic?.id &&
      !creatingDefault &&
      !autoProvisionTriggered.current
    ) {
      autoProvisionTriggered.current = true;
      handleCreateDefaultTemplate();
    }
  }, [loadingTemplates, allTemplates.length, specialtyId, clinic?.id, creatingDefault, handleCreateDefaultTemplate]);

  // ─── Handlers ───────────────────────────────────────────────────
  const handleStartEdit = () => {
    if (currentAnamnese?.template_id) {
      setSelectedTemplateId(currentAnamnese.template_id);
    }
    if (currentAnamnese?.structured_data && Object.keys(currentAnamnese.structured_data).length > 0) {
      setStructuredData({ ...currentAnamnese.structured_data });
    } else if (currentAnamnese) {
      setStructuredData({
        qp_descricao: currentAnamnese.queixa_principal || '',
        hda_evolucao: currentAnamnese.historia_doenca_atual || '',
        hpp_doencas_obs: currentAnamnese.antecedentes_pessoais || '',
        hf_detalhes: currentAnamnese.antecedentes_familiares || '',
        med_lista: currentAnamnese.medicamentos_uso_continuo || '',
        alergias_medicamentosas: currentAnamnese.alergias || '',
        hab_alimentacao: currentAnamnese.habitos_vida || '',
      });
    }
    setLastAutoSave(null);
    setIsEditingExisting(true);
    setIsEditing(true);
  };

  const handleStartNewVersion = () => {
    if (currentAnamnese?.template_id) {
      setSelectedTemplateId(currentAnamnese.template_id);
    }
    if (currentAnamnese?.structured_data && Object.keys(currentAnamnese.structured_data).length > 0) {
      setStructuredData({ ...currentAnamnese.structured_data });
    } else if (currentAnamnese) {
      setStructuredData({
        qp_descricao: currentAnamnese.queixa_principal || '',
        hda_evolucao: currentAnamnese.historia_doenca_atual || '',
        hpp_doencas_obs: currentAnamnese.antecedentes_pessoais || '',
        hf_detalhes: currentAnamnese.antecedentes_familiares || '',
        med_lista: currentAnamnese.medicamentos_uso_continuo || '',
        alergias_medicamentosas: currentAnamnese.alergias || '',
        hab_alimentacao: currentAnamnese.habitos_vida || '',
      });
    }
    setLastAutoSave(null);
    setIsEditingExisting(false);
    setIsEditing(true);
  };

  const handleCancel = () => {
    setIsEditing(false);
    setIsEditingExisting(false);
    setStructuredData({});
    setLastAutoSave(null);
  };

  const handleSave = async () => {
    const legacy = mapStructuredToLegacy(structuredData);
    const saveData = {
      queixa_principal: legacy.queixa_principal || '',
      historia_doenca_atual: legacy.historia_doenca_atual || '',
      antecedentes_pessoais: legacy.antecedentes_pessoais || '',
      antecedentes_familiares: legacy.antecedentes_familiares || '',
      habitos_vida: legacy.habitos_vida || '',
      medicamentos_uso_continuo: legacy.medicamentos_uso_continuo || '',
      alergias: legacy.alergias || '',
      comorbidades: currentAnamnese?.comorbidades || '',
      structured_data: structuredData,
      template_id: activeTemplate?.id || '',
    };
    if (isEditingExisting && currentAnamnese && onUpdate) {
      await onUpdate(currentAnamnese.id, saveData);
    } else {
      await onSave(saveData);
    }
    setIsEditing(false);
    setIsEditingExisting(false);
    setStructuredData({});
    setLastAutoSave(null);
  };

  const updateField = (fieldId: string, value: unknown) => {
    setStructuredData(prev => ({ ...prev, [fieldId]: value }));
  };

  // ─── Field renderer ─────────────────────────────────────────────
  const renderField = (campo: { id: string; label: string; type: string; placeholder?: string; options?: string[]; required?: boolean }) => {
    const value = structuredData[campo.id];

    switch (campo.type) {
      case 'text':
        return (
          <Input
            value={(value as string) || ''}
            onChange={e => updateField(campo.id, e.target.value)}
            placeholder={campo.placeholder}
            className="bg-background"
          />
        );
      case 'textarea':
        return (
          <Textarea
            value={(value as string) || ''}
            onChange={e => updateField(campo.id, e.target.value)}
            placeholder={campo.placeholder}
            rows={campo.required ? 5 : 3}
            className="bg-background resize-none text-sm leading-relaxed"
          />
        );
      case 'number':
        return (
          <Input
            type="number"
            value={(value as number) ?? ''}
            onChange={e => updateField(campo.id, e.target.value ? parseFloat(e.target.value) : null)}
            placeholder={campo.placeholder}
            className="bg-background"
          />
        );
      case 'date':
        return (
          <Input
            type="date"
            value={(value as string) || ''}
            onChange={e => updateField(campo.id, e.target.value)}
            className="bg-background"
          />
        );
      case 'select':
        return (
          <Select value={(value as string) || ''} onValueChange={v => updateField(campo.id, v)}>
            <SelectTrigger className="bg-background"><SelectValue placeholder="Selecione..." /></SelectTrigger>
            <SelectContent className="bg-background z-50">
              {campo.options?.map(opt => (
                <SelectItem key={opt} value={opt}>{opt}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        );
      case 'radio':
        return (
          <RadioGroup value={(value as string) || ''} onValueChange={v => updateField(campo.id, v)} className="flex flex-wrap gap-4">
            {campo.options?.map(opt => (
              <div key={opt} className="flex items-center space-x-2">
                <RadioGroupItem value={opt} id={`${campo.id}-${opt}`} />
                <Label htmlFor={`${campo.id}-${opt}`} className="text-sm font-normal">{opt}</Label>
              </div>
            ))}
          </RadioGroup>
        );
      case 'multiselect':
        return (
          <MultiSelectField
            options={campo.options || []}
            value={(value as string[]) || []}
            onChange={v => updateField(campo.id, v)}
          />
        );
      default:
        return (
          <Input
            value={(value as string) || ''}
            onChange={e => updateField(campo.id, e.target.value)}
            placeholder={campo.placeholder}
            className="bg-background"
          />
        );
    }
  };

  // ─── Render section in view mode ────────────────────────────────
  const renderViewSection = (secao: SecaoAnamnese, data: Record<string, unknown>) => {
    const filledFields = secao.campos.filter(c => {
      const v = data[c.id];
      if (Array.isArray(v)) return v.length > 0;
      return v !== undefined && v !== null && v !== '';
    });
    if (filledFields.length === 0) return null;

    return (
      <div key={secao.id} className="space-y-3 p-5">
        <h4 className="font-semibold text-sm text-foreground">{secao.titulo}</h4>
        <div className="grid gap-3">
          {filledFields.map(campo => {
            const val = data[campo.id];
            const display = Array.isArray(val) ? val.join(', ') : String(val);
            return (
              <div key={campo.id}>
                <Label className="text-xs text-muted-foreground">{campo.label}</Label>
                <p className="text-sm whitespace-pre-wrap mt-0.5">{display}</p>
              </div>
            );
          })}
          {secao.id === 'dados_antropometricos' && data.peso_kg && data.altura_cm && (() => {
            const imc = calculateIMC(data.peso_kg as number, data.altura_cm as number);
            if (!imc) return null;
            return (
              <div className="p-3 bg-muted/50 rounded-lg">
                <div className="flex items-center gap-2">
                  <Calculator className="h-4 w-4 text-primary" />
                  <span className="text-sm font-medium">IMC: {imc.value} — {imc.classification}</span>
                </div>
              </div>
            );
          })()}
        </div>
      </div>
    );
  };

  // ─── Legacy view ─────────────────────────────────────────────────
  const renderLegacyView = (anamnese: AnamneseData) => {
    const sections = [
      { key: 'queixa_principal', label: 'Queixa Principal', value: anamnese.queixa_principal },
      { key: 'historia_doenca_atual', label: 'HDA', value: anamnese.historia_doenca_atual },
      { key: 'antecedentes_pessoais', label: 'Antecedentes Pessoais', value: anamnese.antecedentes_pessoais },
      { key: 'antecedentes_familiares', label: 'Antecedentes Familiares', value: anamnese.antecedentes_familiares },
      { key: 'habitos_vida', label: 'Hábitos de Vida', value: anamnese.habitos_vida },
      { key: 'medicamentos', label: 'Medicamentos', value: anamnese.medicamentos_uso_continuo },
      { key: 'alergias', label: 'Alergias', value: anamnese.alergias },
      { key: 'comorbidades', label: 'Comorbidades', value: anamnese.comorbidades },
    ].filter(s => s.value);

    return (
      <div className="divide-y">
        {sections.map(s => (
          <div key={s.key} className="p-5">
            <h4 className="font-semibold text-sm mb-1.5">{s.label}</h4>
            <p className="text-sm whitespace-pre-wrap text-muted-foreground">{s.value}</p>
          </div>
        ))}
      </div>
    );
  };

  // ─── Loading ────────────────────────────────────────────────────
  if (loading || loadingTemplates) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  // ─── No templates exist ─────────────────────────────────────────
   if (allTemplates.length === 0) {
    // Auto-provisioning is in progress or will trigger
    return (
      <Card className="border-dashed">
        <CardContent className="p-10 text-center">
          <Stethoscope className="h-10 w-10 mx-auto mb-4 text-primary animate-pulse" />
          <h3 className="text-lg font-semibold mb-2">
            {creatingDefault ? 'Criando modelo padrão...' : 'Preparando modelo de anamnese...'}
          </h3>
          <p className="text-sm text-muted-foreground max-w-md mx-auto">
            O modelo padrão será configurado automaticamente para esta especialidade.
          </p>
        </CardContent>
      </Card>
    );
  }

  // ─── Template exists but no structure ───────────────────────────
  if (activeTemplate && activeTemplate.secoes.length === 0 && !currentAnamnese) {
    return (
      <Card className="border-dashed">
        <CardContent className="p-10 text-center">
          <FileText className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-40" />
          <h3 className="text-lg font-semibold mb-2">
            Este modelo não possui estrutura configurada.
          </h3>
          <p className="text-sm text-muted-foreground mb-6 max-w-md mx-auto">
            O modelo "{activeTemplate.nome}" não possui campos definidos.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <Button onClick={() => specialtyId && navigate(`/app/config/prontuario?especialidade_id=${specialtyId}&tipo=anamnese`)}>
              <Settings className="h-4 w-4 mr-2" />
              Editar modelo
            </Button>
            <Button variant="outline" onClick={handleCreateDefaultTemplate} disabled={creatingDefault}>
              <Stethoscope className="h-4 w-4 mr-2" />
              {creatingDefault ? 'Criando...' : 'Criar modelo padrão'}
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  // ─── Template selector (compact) ────────────────────────────────
  const renderTemplateSelector = () => (
    <div className="flex items-center gap-2">
      <Select value={selectedTemplateId || ''} onValueChange={handleTemplateSwitch}>
        <SelectTrigger className="bg-background h-8 text-xs w-64">
          <div className="flex items-center gap-1.5 truncate">
            <SelectValue placeholder="Selecionar modelo..." />
          </div>
        </SelectTrigger>
        <SelectContent className="bg-background z-50">
          {allTemplates.map(t => (
            <SelectItem key={t.id} value={t.id}>
              <div className="flex items-center gap-2">
                <span className="truncate">{t.nome}</span>
                {t.is_system && <Lock className="h-3 w-3 text-muted-foreground flex-shrink-0" />}
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Button variant="ghost" size="sm" onClick={handleOpenTemplateEditor} className="h-8 px-2">
        <Settings className="h-3.5 w-3.5" />
      </Button>
    </div>
  );

  // ─── Switch confirmation dialog ─────────────────────────────────
  const renderSwitchConfirmDialog = () => (
    <AlertDialog open={showSwitchConfirm} onOpenChange={setShowSwitchConfirm}>
      <AlertDialogContent className="bg-background">
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-destructive" />
            Trocar modelo de anamnese?
          </AlertDialogTitle>
          <AlertDialogDescription>
            Trocar o modelo irá apagar os dados atuais preenchidos.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={() => setPendingTemplateId(null)}>Cancelar</AlertDialogCancel>
          <AlertDialogAction onClick={confirmTemplateSwitch} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
            Trocar modelo
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );

  // ─── Empty state ────────────────────────────────────────────────
  if (!currentAnamnese && !isEditing) {
    return (
      <>
        {renderSwitchConfirmDialog()}
        <Card className="border-dashed">
          <CardContent className="p-8 text-center">
            <FileText className="h-10 w-10 mx-auto mb-3 text-muted-foreground opacity-50" />
            <h3 className="font-semibold mb-3">Nenhuma anamnese registrada</h3>
            <div className="flex flex-col items-center gap-3 mb-4">
              {renderTemplateSelector()}
            </div>
            {canEdit && activeTemplate && (
              <Button onClick={() => setIsEditing(true)}>
                <Edit3 className="h-4 w-4 mr-2" />
                Registrar Anamnese
              </Button>
            )}
          </CardContent>
        </Card>
        <AnamnesisTemplateBuilderDialog
          open={showTemplateEditor}
          onOpenChange={setShowTemplateEditor}
          template={editingV2Template}
        />
      </>
    );
  }

  // ─── EDITING MODE — Premium single-page layout ──────────────────
  if (isEditing) {
    const sections = activeTemplate?.secoes || [];
    // Block icons for premium feel
    const blockIcons: Record<string, React.ReactNode> = {
      'motivo_consulta': <Stethoscope className="h-4 w-4" />,
      'section_queixa_principal': <Stethoscope className="h-4 w-4" />,
      'queixa_principal': <Stethoscope className="h-4 w-4" />,
      'section_hda': <Clock className="h-4 w-4" />,
      'historia_atual': <Clock className="h-4 w-4" />,
      'historia_doenca_atual': <Clock className="h-4 w-4" />,
      'section_antecedentes_pessoais': <FileText className="h-4 w-4" />,
      'section_medicamentos_alergias': <FileText className="h-4 w-4" />,
      'section_historico_familiar': <FileText className="h-4 w-4" />,
      'section_habitos': <FileText className="h-4 w-4" />,
      'contexto_clinico': <FileText className="h-4 w-4" />,
      'section_exame_fisico': <Stethoscope className="h-4 w-4" />,
      'section_hipoteses': <CheckCircle2 className="h-4 w-4" />,
      'section_conduta': <CheckCircle2 className="h-4 w-4" />,
      'impressao_conduta': <CheckCircle2 className="h-4 w-4" />,
      'plano_conduta': <CheckCircle2 className="h-4 w-4" />,
    };

    // Determine if a section uses a grid layout for compact fields (selects)
    const isCompactSection = (secao: SecaoAnamnese) => {
      const selectFields = secao.campos.filter(c => c.type === 'select' || c.type === 'radio');
      return selectFields.length >= 3;
    };

    return (
      <>
        {renderSwitchConfirmDialog()}
        <div className="space-y-6">
          {/* Minimal header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <h3 className="font-semibold text-base tracking-tight">
                {currentAnamnese ? 'Atualizar Anamnese' : 'Nova Anamnese'}
              </h3>
              <Badge variant="outline" className="text-[10px] font-medium border-amber-300 text-amber-600 bg-amber-50">
                Rascunho
              </Badge>
              {lastAutoSave && (
                <span className="text-[10px] text-muted-foreground/70 flex items-center gap-1">
                  <Check className="h-2.5 w-2.5" />
                  {format(lastAutoSave, "HH:mm")}
                </span>
              )}
            </div>
            {allTemplates.length > 1 && renderTemplateSelector()}
          </div>

          {/* Premium blocks */}
          <div className="space-y-8">
            {sections.map((secao) => {
              const compact = isCompactSection(secao);
              const textareaFields = secao.campos.filter(c => c.type === 'textarea');
              const otherFields = secao.campos.filter(c => c.type !== 'textarea');
              const icon = blockIcons[secao.id] || <FileText className="h-4 w-4" />;

              return (
                <div key={secao.id} className="space-y-4">
                  {/* Block title */}
                  <div className="flex items-center gap-2.5 pb-2 border-b border-border/50">
                    <span className="text-primary/70">{icon}</span>
                    <h4 className="font-semibold text-sm tracking-tight text-foreground">
                      {secao.titulo}
                    </h4>
                  </div>

                  {/* Fields */}
                  <div className="space-y-5 pl-0.5">
                    {/* Large textarea fields first */}
                    {textareaFields.map(campo => (
                      <div key={campo.id} className="space-y-1.5">
                        <Label className={cn(
                          "text-xs font-medium text-muted-foreground uppercase tracking-wider",
                          campo.required && "after:content-['*'] after:text-destructive after:ml-0.5"
                        )}>
                          {campo.label}
                        </Label>
                        {renderField(campo)}
                      </div>
                    ))}

                    {/* Compact grid for selects and short fields */}
                    {otherFields.length > 0 && (
                      <div className={cn(
                        compact ? "grid grid-cols-2 md:grid-cols-4 gap-4" : "grid grid-cols-1 md:grid-cols-2 gap-4"
                      )}>
                        {otherFields.map(campo => (
                          <div key={campo.id} className="space-y-1.5">
                            <Label className={cn(
                              "text-xs font-medium text-muted-foreground uppercase tracking-wider",
                              campo.required && "after:content-['*'] after:text-destructive after:ml-0.5"
                            )}>
                              {campo.label}
                            </Label>
                            {renderField(campo)}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Sticky action bar — clean */}
          <div className="sticky bottom-0 z-10 bg-background/95 backdrop-blur-sm border-t py-3 flex items-center justify-between">
            <Button variant="ghost" size="sm" onClick={handleCancel} disabled={saving} className="text-muted-foreground">
              <X className="h-4 w-4 mr-1.5" />
              Cancelar
            </Button>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={handleSave} disabled={saving}>
                <Save className="h-4 w-4 mr-1.5" />
                {saving ? 'Salvando...' : 'Salvar Rascunho'}
              </Button>
              <Button size="sm" onClick={handleSave} disabled={saving}>
                <CheckCircle2 className="h-4 w-4 mr-1.5" />
                Finalizar
              </Button>
            </div>
          </div>
        </div>

        <AnamnesisTemplateBuilderDialog
          open={showTemplateEditor}
          onOpenChange={setShowTemplateEditor}
          template={editingV2Template}
        />
      </>
    );
  }

  // ─── VIEW MODE ──────────────────────────────────────────────────
  const hasStructuredData = currentAnamnese?.structured_data && Object.keys(currentAnamnese.structured_data).length > 0;

  return (
    <div className="space-y-3">
      {/* Compact header */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <h3 className="font-semibold text-sm truncate">
            {activeTemplate?.nome || 'Anamnese'}
          </h3>
          <Badge variant="outline" className="text-[10px] flex-shrink-0">
            v{currentAnamnese?.version || 1}
          </Badge>
          <Badge variant="secondary" className="text-[10px] flex-shrink-0 bg-emerald-500/10 text-emerald-700 border-emerald-200">
            <Check className="h-2.5 w-2.5 mr-0.5" />
            Finalizado
          </Badge>
        </div>
        {currentAnamnese && (
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Clock className="h-3 w-3" />
            <span>
              {format(parseISO(currentAnamnese.created_at), "dd/MM/yyyy HH:mm", { locale: ptBR })}
              {currentAnamnese.created_by_name && ` • ${currentAnamnese.created_by_name}`}
            </span>
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="flex items-center justify-end gap-2 flex-wrap">
        {currentAnamnese && (
          <Button variant="ghost" size="sm" disabled={generating} onClick={() => {
            generateAnamnesisPdf(
              {
                name: patientName || 'Paciente',
                cpf: patientCpf,
                id: patientData?.id,
                age: patientData?.age || patientData?.idade,
                sex: patientData?.sex || patientData?.sexo,
                phone: patientData?.phone || patientData?.telefone,
                insurance_name: patientData?.insurance_name || patientData?.convenio,
                birth_date: patientData?.birth_date || patientData?.data_nascimento,
              },
              currentAnamnese,
              activeTemplate?.secoes || [],
              {
                name: currentAnamnese.created_by_name,
                specialty: specialtyName || undefined,
              },
            );
          }}>
            <FileDown className="h-4 w-4 mr-1" />
            {generating ? 'Gerando...' : 'PDF'}
          </Button>
        )}
        {anamneseHistory.length > 1 && (
          <Button variant="ghost" size="sm" onClick={() => setShowHistory(true)}>
            <History className="h-4 w-4 mr-1" />
            Histórico ({anamneseHistory.length})
          </Button>
        )}
        {canEdit && onUpdate && (
          <Button variant="outline" size="sm" onClick={handleStartEdit}>
            <Edit3 className="h-4 w-4 mr-1.5" />
            Editar
          </Button>
        )}
        {canEdit && (
          <Button size="sm" onClick={handleStartNewVersion}>
            <Edit3 className="h-4 w-4 mr-1.5" />
            Nova Versão
          </Button>
        )}
      </div>

      {/* Content */}
      <Card>
        <CardContent className="p-0 divide-y">
          {hasStructuredData ? (
            (activeTemplate?.secoes || []).map(secao =>
              renderViewSection(secao, currentAnamnese!.structured_data!)
            )
          ) : (
            currentAnamnese && renderLegacyView(currentAnamnese)
          )}
        </CardContent>
      </Card>

      {/* History Dialog */}
      <Dialog open={showHistory} onOpenChange={setShowHistory}>
        <DialogContent className="max-w-2xl max-h-[80vh]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <History className="h-5 w-5" />
              Histórico de Anamneses
            </DialogTitle>
            <DialogDescription>
              Versões anteriores da anamnese
            </DialogDescription>
          </DialogHeader>
          <ScrollArea className="max-h-[400px]">
            <div className="space-y-2">
              {anamneseHistory.map((anamnese) => (
                <div
                  key={anamnese.id}
                  className={cn(
                    "p-3 rounded-lg border cursor-pointer transition-colors hover:bg-muted/50",
                    anamnese.is_current && "border-primary bg-primary/5"
                  )}
                  onClick={() => setSelectedVersion(anamnese)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Badge variant={anamnese.is_current ? 'default' : 'outline'}>v{anamnese.version}</Badge>
                      {anamnese.is_current && <Badge variant="secondary" className="text-xs">Atual</Badge>}
                    </div>
                    <ChevronRight className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">
                    {format(parseISO(anamnese.created_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                    {anamnese.created_by_name && ` • ${anamnese.created_by_name}`}
                  </p>
                </div>
              ))}
            </div>
          </ScrollArea>
        </DialogContent>
      </Dialog>

      {/* Version Detail Dialog */}
      <Dialog open={!!selectedVersion} onOpenChange={() => setSelectedVersion(null)}>
        <DialogContent className="max-w-3xl max-h-[80vh]">
          <DialogHeader>
            <DialogTitle>Anamnese — Versão {selectedVersion?.version}</DialogTitle>
            <DialogDescription>
              {selectedVersion && format(parseISO(selectedVersion.created_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
              {selectedVersion?.created_by_name && ` • ${selectedVersion.created_by_name}`}
            </DialogDescription>
          </DialogHeader>
          <ScrollArea className="max-h-[500px]">
            {selectedVersion && (
              selectedVersion.structured_data && Object.keys(selectedVersion.structured_data).length > 0 ? (
                <div className="space-y-4 pr-4">
                  {(activeTemplate?.secoes || []).map(secao => {
                    const filledFields = secao.campos.filter(c => {
                      const v = selectedVersion.structured_data?.[c.id];
                      if (Array.isArray(v)) return v.length > 0;
                      return v !== undefined && v !== null && v !== '';
                    });
                    if (filledFields.length === 0) return null;
                    return (
                      <div key={secao.id}>
                        <h4 className="text-sm font-semibold text-muted-foreground mb-2">{secao.titulo}</h4>
                        {filledFields.map(campo => {
                          const val = selectedVersion.structured_data?.[campo.id];
                          const display = Array.isArray(val) ? val.join(', ') : String(val);
                          return (
                            <div key={campo.id} className="mb-2">
                              <Label className="text-xs text-muted-foreground">{campo.label}</Label>
                              <p className="text-sm whitespace-pre-wrap">{display}</p>
                            </div>
                          );
                        })}
                        <Separator className="my-3" />
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="space-y-4 pr-4">
                  {[
                    { label: 'Queixa Principal', value: selectedVersion.queixa_principal },
                    { label: 'HDA', value: selectedVersion.historia_doenca_atual },
                    { label: 'Antecedentes Pessoais', value: selectedVersion.antecedentes_pessoais },
                    { label: 'Antecedentes Familiares', value: selectedVersion.antecedentes_familiares },
                    { label: 'Hábitos de Vida', value: selectedVersion.habitos_vida },
                    { label: 'Medicamentos', value: selectedVersion.medicamentos_uso_continuo },
                    { label: 'Alergias', value: selectedVersion.alergias },
                    { label: 'Comorbidades', value: selectedVersion.comorbidades },
                  ].filter(s => s.value).map(s => (
                    <div key={s.label}>
                      <Label className="text-muted-foreground">{s.label}</Label>
                      <p className="text-sm mt-1 whitespace-pre-wrap">{s.value}</p>
                      <Separator className="mt-3" />
                    </div>
                  ))}
                </div>
              )
            )}
          </ScrollArea>
          <DialogFooter>
            <Button variant="outline" onClick={() => setSelectedVersion(null)}>Fechar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Template Editor Dialog */}
      <AnamnesisTemplateBuilderDialog
        open={showTemplateEditor}
        onOpenChange={setShowTemplateEditor}
        template={editingV2Template}
      />
    </div>
  );
}
