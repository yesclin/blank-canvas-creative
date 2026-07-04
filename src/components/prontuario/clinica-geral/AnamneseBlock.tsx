import { useState, useEffect, useMemo, useRef, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import {
  Stethoscope,
  Activity,
  Target,
  HeartPulse,
  ClipboardList,
  Pill,
  Eye,
  Lightbulb,
  Brain,
  Flag,
  Save,
  Clock,
  User as UserIcon,
  CheckCircle2,
} from "lucide-react";
import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { useResolvedAnamnesisTemplate } from "@/hooks/prontuario/useResolvedAnamnesisTemplate";
import { AnamneseModelSelector } from "@/components/prontuario/AnamneseModelSelector";
import { useNavigate } from "react-router-dom";

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
  specialtyKey?: string | null;
  appointmentId?: string | null;
  appointmentDate?: string | null;
  professionalName?: string | null;
  professionalRegistration?: string | null;
}

// ─── Structured form state ───────────────────────────────────────────

interface PrimeiraEntrevistaData {
  queixa_principal: string;
  historia_queixa_atual: string;
  objetivo_paciente: string;
  habitos: {
    fuma: boolean;
    alcool: boolean;
    atividade_fisica: boolean;
    sedentario: boolean;
    sono_adequado: boolean;
    alimentacao_equilibrada: boolean;
    observacoes: string;
  };
  antecedentes_relevantes: string;
  medicacoes_uso_continuo: string;
  observacoes_iniciais: string;
  hipotese_inicial: string;
  impressao_clinica: string;
  objetivos_tratamento: string;
}

const EMPTY_FORM: PrimeiraEntrevistaData = {
  queixa_principal: "",
  historia_queixa_atual: "",
  objetivo_paciente: "",
  habitos: {
    fuma: false,
    alcool: false,
    atividade_fisica: false,
    sedentario: false,
    sono_adequado: false,
    alimentacao_equilibrada: false,
    observacoes: "",
  },
  antecedentes_relevantes: "",
  medicacoes_uso_continuo: "",
  observacoes_iniciais: "",
  hipotese_inicial: "",
  impressao_clinica: "",
  objetivos_tratamento: "",
};

type HabitoBoolKey = Exclude<keyof PrimeiraEntrevistaData["habitos"], "observacoes">;
const HABITOS_OPTIONS: Array<{ key: HabitoBoolKey; label: string }> = [
  { key: "fuma", label: "Fuma" },
  { key: "alcool", label: "Consome álcool" },
  { key: "atividade_fisica", label: "Atividade física" },
  { key: "sedentario", label: "Sedentário" },
  { key: "sono_adequado", label: "Sono adequado" },
  { key: "alimentacao_equilibrada", label: "Alimentação equilibrada" },
];

function loadFromRecord(record: AnamneseData | null): PrimeiraEntrevistaData {
  if (!record) return { ...EMPTY_FORM, habitos: { ...EMPTY_FORM.habitos } };
  const s = (record.structured_data || {}) as Partial<PrimeiraEntrevistaData> & Record<string, unknown>;
  return {
    queixa_principal: (s.queixa_principal as string) ?? record.queixa_principal ?? "",
    historia_queixa_atual: (s.historia_queixa_atual as string) ?? record.historia_doenca_atual ?? "",
    objetivo_paciente: (s.objetivo_paciente as string) ?? "",
    habitos: {
      ...EMPTY_FORM.habitos,
      ...(s.habitos as PrimeiraEntrevistaData["habitos"] | undefined),
    },
    antecedentes_relevantes: (s.antecedentes_relevantes as string) ?? record.antecedentes_pessoais ?? "",
    medicacoes_uso_continuo: (s.medicacoes_uso_continuo as string) ?? record.medicamentos_uso_continuo ?? "",
    observacoes_iniciais: (s.observacoes_iniciais as string) ?? "",
    hipotese_inicial: (s.hipotese_inicial as string) ?? "",
    impressao_clinica: (s.impressao_clinica as string) ?? "",
    objetivos_tratamento: (s.objetivos_tratamento as string) ?? "",
  };
}

function toLegacyPayload(form: PrimeiraEntrevistaData) {
  const habitosText = HABITOS_OPTIONS
    .filter((h) => form.habitos[h.key])
    .map((h) => h.label)
    .join(", ") + (form.habitos.observacoes ? ` — Obs: ${form.habitos.observacoes}` : "");
  return {
    queixa_principal: form.queixa_principal,
    historia_doenca_atual: form.historia_queixa_atual,
    antecedentes_pessoais: form.antecedentes_relevantes,
    antecedentes_familiares: "",
    habitos_vida: habitosText.trim(),
    medicamentos_uso_continuo: form.medicacoes_uso_continuo,
    alergias: "",
    comorbidades: "",
    structured_data: form as unknown as Record<string, unknown>,
  };
}

// ─── Section card ────────────────────────────────────────────────────

function SectionCard({
  icon: Icon,
  number,
  title,
  description,
  children,
}: {
  icon: React.ComponentType<{ className?: string }>;
  number: number;
  title: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-3 text-base">
          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-primary">
            <Icon className="h-4 w-4" />
          </span>
          <span className="text-muted-foreground text-xs font-medium">{number}.</span>
          <span>{title}</span>
        </CardTitle>
        {description && (
          <p className="text-xs text-muted-foreground ml-11">{description}</p>
        )}
      </CardHeader>
      <CardContent className="ml-11 pl-0">{children}</CardContent>
    </Card>
  );
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
  appointmentDate,
  professionalName,
  professionalRegistration,
  specialtyId,
  specialtyName,
}: AnamneseBlockProps) {
  const navigate = useNavigate();
  const [form, setForm] = useState<PrimeiraEntrevistaData>(() => loadFromRecord(currentAnamnese));
  const [lastSavedAt, setLastSavedAt] = useState<Date | null>(null);
  const [isDirty, setIsDirty] = useState(false);
  const [started, setStarted] = useState(false);
  const [selectedTemplateId, setSelectedTemplateId] = useState<string | null>(null);
  const autoSaveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastSerialized = useRef<string>(JSON.stringify(loadFromRecord(currentAnamnese)));
  const initializedFor = useRef<string | null>(currentAnamnese?.id ?? null);

  const {
    data: resolvedTemplate,
    allTemplates,
    isLoading: templatesLoading,
  } = useResolvedAnamnesisTemplate(specialtyId ?? null, null);

  // Sync when record changes (e.g. after save creates a new version)
  useEffect(() => {
    const recordId = currentAnamnese?.id ?? null;
    if (recordId !== initializedFor.current) {
      const next = loadFromRecord(currentAnamnese);
      setForm(next);
      lastSerialized.current = JSON.stringify(next);
      setIsDirty(false);
      initializedFor.current = recordId;
    }
  }, [currentAnamnese]);

  const update = useCallback(<K extends keyof PrimeiraEntrevistaData>(key: K, value: PrimeiraEntrevistaData[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    setIsDirty(true);
  }, []);

  const updateHabito = useCallback(<K extends keyof PrimeiraEntrevistaData["habitos"]>(key: K, value: PrimeiraEntrevistaData["habitos"][K]) => {
    setForm((prev) => ({ ...prev, habitos: { ...prev.habitos, [key]: value } }));
    setIsDirty(true);
  }, []);

  const doSave = useCallback(async (silent: boolean) => {
    if (!canEdit) return;
    const payload = toLegacyPayload(form);
    try {
      if (currentAnamnese && onUpdate) {
        await onUpdate(currentAnamnese.id, payload);
      } else {
        await onSave(payload);
      }
      setLastSavedAt(new Date());
      setIsDirty(false);
      lastSerialized.current = JSON.stringify(form);
      if (!silent) toast.success("Anamnese salva");
    } catch (err) {
      if (!silent) toast.error("Erro ao salvar anamnese");
      console.error("[AnamneseBlock] save error", err);
    }
  }, [canEdit, currentAnamnese, form, onSave, onUpdate]);

  // Auto-save (debounce 3s after user stops typing)
  useEffect(() => {
    if (!canEdit) return;
    const serialized = JSON.stringify(form);
    if (serialized === lastSerialized.current) return;
    if (autoSaveTimer.current) clearTimeout(autoSaveTimer.current);
    autoSaveTimer.current = setTimeout(() => {
      void doSave(true);
    }, 3000);
    return () => {
      if (autoSaveTimer.current) clearTimeout(autoSaveTimer.current);
    };
  }, [form, canEdit, doSave]);

  const createdAtLabel = useMemo(() => {
    const iso = currentAnamnese?.created_at;
    if (!iso) return null;
    try {
      return format(parseISO(iso), "dd 'de' MMMM 'de' yyyy 'às' HH:mm", { locale: ptBR });
    } catch {
      return iso;
    }
  }, [currentAnamnese?.created_at]);

  const profLabel = currentAnamnese?.created_by_name || professionalName || "—";
  const profSuffix = professionalRegistration ? ` (${professionalRegistration})` : "";

  if (loading) {
    return (
      <div className="space-y-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-40 w-full" />
        ))}
      </div>
    );
  }

  // Template selection gate: never auto-open a form. Sempre mostrar o seletor
  // até o usuário escolher um modelo — inclusive para "Outras Especialidades /
  // Atendimento Geral", que nunca deve assumir um modelo padrão.
  const isGenericSpecialty =
    specialtyKey === "other_specialty" ||
    specialtyKey === "outras_especialidades" ||
    specialtyKey === "atendimento_geral" ||
    specialtyKey === "custom";
  const shouldShowSelector =
    !currentAnamnese &&
    !started &&
    !templatesLoading &&
    (isGenericSpecialty || allTemplates.length === 0 || allTemplates.length > 1 || !selectedTemplateId);

  if (templatesLoading && !currentAnamnese) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-40 w-full" />
      </div>
    );
  }

  if (shouldShowSelector) {
    return (
      <AnamneseModelSelector
        icon={<Stethoscope className="h-10 w-10 text-primary opacity-70" />}
        emptyTitle="Escolha um modelo de anamnese"
        emptyDescription={
          allTemplates.length === 0
            ? `Nenhum modelo de anamnese está liberado para esta especialidade${specialtyName ? ` (${specialtyName})` : ""}.`
            : "Selecione um modelo liberado para esta clínica e especialidade para iniciar."
        }
        registerLabel="Iniciar Anamnese"
        resolvedTemplate={resolvedTemplate}
        allTemplates={allTemplates}
        isLoading={templatesLoading}
        selectedTemplateId={selectedTemplateId}
        onTemplateChange={setSelectedTemplateId}
        canEdit={canEdit}
        canManageTemplates={canEdit}
        onRegister={() => setStarted(true)}
        onConfigureTemplate={() => navigate("/app/config/prontuario")}
        specialtyLabel={specialtyName ?? undefined}
      />
    );
  }

  return (
    <div className="space-y-6">

      {/* Header / meta */}
      <Card className="border-primary/20 bg-primary/5">
        <CardContent className="pt-4 pb-4 flex flex-wrap items-center justify-between gap-3">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-sm font-semibold">
              <Stethoscope className="h-4 w-4 text-primary" />
              Anamnese — Primeira Entrevista Clínica
            </div>
            <p className="text-xs text-muted-foreground">
              Informações iniciais da primeira consulta. Demais dados (evolução, plano, procedimentos,
              documentos, anexos, alertas, histórico) ficam em suas próprias abas.
            </p>
          </div>
          <div className="flex flex-col items-end gap-1 text-xs text-muted-foreground">
            {createdAtLabel && (
              <span className="flex items-center gap-1">
                <Clock className="h-3 w-3" /> Criada em {createdAtLabel}
              </span>
            )}
            <span className="flex items-center gap-1">
              <UserIcon className="h-3 w-3" /> Responsável: {profLabel}{profSuffix}
            </span>
            {currentAnamnese?.version != null && (
              <Badge variant="outline" className="text-[10px]">Versão {currentAnamnese.version}</Badge>
            )}
          </div>
        </CardContent>
      </Card>

      {/* 1. Queixa principal */}
      <SectionCard icon={Stethoscope} number={1} title="Queixa Principal" description="O que trouxe o paciente até a clínica?">
        <Textarea
          rows={4}
          value={form.queixa_principal}
          onChange={(e) => update("queixa_principal", e.target.value)}
          disabled={!canEdit}
          placeholder="Descreva a queixa principal relatada pelo paciente..."
        />
      </SectionCard>

      {/* 2. História da queixa atual */}
      <SectionCard
        icon={Activity}
        number={2}
        title="História da Queixa Atual"
        description="Quando começou, como evoluiu, fatores que melhoram/pioram e sintomas associados."
      >
        <Textarea
          rows={6}
          value={form.historia_queixa_atual}
          onChange={(e) => update("historia_queixa_atual", e.target.value)}
          disabled={!canEdit}
          placeholder="Evolução temporal, gatilhos, alívio, sintomas associados..."
        />
      </SectionCard>

      {/* 3. Objetivo do paciente */}
      <SectionCard
        icon={Target}
        number={3}
        title="Objetivo do Paciente"
        description="Ex.: aliviar dor, estética, acompanhamento, prevenção, avaliação."
      >
        <Textarea
          rows={4}
          value={form.objetivo_paciente}
          onChange={(e) => update("objetivo_paciente", e.target.value)}
          disabled={!canEdit}
          placeholder="O que o paciente busca com este atendimento..."
        />
      </SectionCard>

      {/* 4. Hábitos de vida */}
      <SectionCard icon={HeartPulse} number={4} title="Hábitos de Vida">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {HABITOS_OPTIONS.map((h) => (
            <label
              key={h.key}
              className={cn(
                "flex items-center gap-2 rounded-md border p-3 cursor-pointer transition-colors",
                form.habitos[h.key] ? "border-primary/40 bg-primary/5" : "border-border",
                !canEdit && "opacity-70 cursor-not-allowed"
              )}
            >
              <Checkbox
                checked={form.habitos[h.key]}
                onCheckedChange={(v) => updateHabito(h.key, Boolean(v))}
                disabled={!canEdit}
              />
              <span className="text-sm">{h.label}</span>
            </label>
          ))}
        </div>
        <div className="mt-3 space-y-1.5">
          <Label className="text-xs text-muted-foreground">Observações</Label>
          <Textarea
            rows={2}
            value={form.habitos.observacoes}
            onChange={(e) => updateHabito("observacoes", e.target.value)}
            disabled={!canEdit}
            placeholder="Detalhes adicionais sobre hábitos..."
          />
        </div>
      </SectionCard>

      {/* 5. Antecedentes relevantes */}
      <SectionCard
        icon={ClipboardList}
        number={5}
        title="Antecedentes Relevantes"
        description="Apenas o que for relevante para esta consulta. Não repita alergias, documentos ou alertas."
      >
        <Textarea
          rows={4}
          value={form.antecedentes_relevantes}
          onChange={(e) => update("antecedentes_relevantes", e.target.value)}
          disabled={!canEdit}
          placeholder="Antecedentes pertinentes à queixa atual..."
        />
      </SectionCard>

      {/* 6. Medicações de uso contínuo */}
      <SectionCard icon={Pill} number={6} title="Medicações de Uso Contínuo">
        <Input
          value={form.medicacoes_uso_continuo}
          onChange={(e) => update("medicacoes_uso_continuo", e.target.value)}
          disabled={!canEdit}
          placeholder="Liste as medicações em uso contínuo..."
        />
      </SectionCard>

      {/* 7. Observações iniciais */}
      <SectionCard
        icon={Eye}
        number={7}
        title="Observações Iniciais"
        description="Tudo que o profissional perceber na primeira consulta."
      >
        <Textarea
          rows={4}
          value={form.observacoes_iniciais}
          onChange={(e) => update("observacoes_iniciais", e.target.value)}
          disabled={!canEdit}
          placeholder="Percepções, comportamento, postura, comunicação..."
        />
      </SectionCard>

      {/* 8. Hipótese inicial */}
      <SectionCard icon={Lightbulb} number={8} title="Hipótese Inicial">
        <Textarea
          rows={4}
          value={form.hipotese_inicial}
          onChange={(e) => update("hipotese_inicial", e.target.value)}
          disabled={!canEdit}
          placeholder="Hipótese diagnóstica inicial..."
        />
      </SectionCard>

      {/* 9. Impressão clínica */}
      <SectionCard icon={Brain} number={9} title="Impressão Clínica">
        <Textarea
          rows={4}
          value={form.impressao_clinica}
          onChange={(e) => update("impressao_clinica", e.target.value)}
          disabled={!canEdit}
          placeholder="Síntese clínica do profissional após a primeira entrevista..."
        />
      </SectionCard>

      {/* 10. Objetivos do tratamento */}
      <SectionCard icon={Flag} number={10} title="Objetivos do Tratamento">
        <Textarea
          rows={4}
          value={form.objetivos_tratamento}
          onChange={(e) => update("objetivos_tratamento", e.target.value)}
          disabled={!canEdit}
          placeholder="Metas terapêuticas pactuadas..."
        />
      </SectionCard>

      <Separator />

      {/* Footer actions */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-4">
        <div className="text-xs text-muted-foreground flex items-center gap-2">
          {saving ? (
            <span className="flex items-center gap-1"><Clock className="h-3 w-3 animate-pulse" /> Salvando...</span>
          ) : lastSavedAt ? (
            <span className="flex items-center gap-1 text-emerald-600">
              <CheckCircle2 className="h-3 w-3" /> Salvo automaticamente às {format(lastSavedAt, "HH:mm:ss")}
            </span>
          ) : isDirty ? (
            <span>Alterações não salvas — salvamento automático em alguns segundos</span>
          ) : (
            <span>Pronto</span>
          )}
        </div>
        <Button onClick={() => doSave(false)} disabled={!canEdit || saving || !isDirty} size="sm">
          <Save className="h-4 w-4 mr-2" />
          Salvar agora
        </Button>
      </div>
    </div>
  );
}
