import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import {
  ArrowLeft,
  Loader2,
  Save,
  Info,
  CalendarClock,
  Layers,
  Wallet,
  FileText,
  Package as PackageIcon,
  Users,
  ShieldCheck,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";

import { supabase } from "@/integrations/supabase/client";
import { useClinicData } from "@/hooks/useClinicData";
import {
  useProceduresList,
  useProcedureForm,
  useCreateProcedure,
  useUpdateProcedure,
  type ProcedureType,
  type ProcedureChargeMode,
  type ProcedureCommissionType,
  type ProcedureCommissionTrigger,
} from "@/hooks/useProceduresCRUD";

const TYPE_OPTIONS: { value: ProcedureType; label: string }[] = [
  { value: "consulta", label: "Consulta" },
  { value: "retorno", label: "Retorno" },
  { value: "procedimento", label: "Procedimento" },
  { value: "sessao", label: "Sessão" },
  { value: "pacote", label: "Pacote" },
  { value: "avaliacao", label: "Avaliação" },
  { value: "acompanhamento", label: "Acompanhamento" },
  { value: "outro", label: "Outro" },
];

const AGENDA_COLORS = [
  "#3B82F6", "#8B5CF6", "#EC4899", "#EF4444", "#F97316",
  "#EAB308", "#22C55E", "#14B8A6", "#0EA5E9", "#64748B",
];

export default function ProcedimentoEditor() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const isNew = !id || id === "novo";
  const { clinic } = useClinicData();

  const { data: allProcedures } = useProceduresList(true);
  const procedure = useMemo(
    () => (isNew ? null : allProcedures?.find((p) => p.id === id) ?? null),
    [isNew, id, allProcedures]
  );

  const { formData, updateField, loadProcedure, resetForm, isValid } = useProcedureForm();
  const createMutation = useCreateProcedure();
  const updateMutation = useUpdateProcedure();

  const [tab, setTab] = useState("basico");

  // Load once when procedure is available
  useEffect(() => {
    if (procedure) loadProcedure(procedure);
    else resetForm();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [procedure?.id]);

  const { data: specialties = [] } = useQuery({
    queryKey: ["specialties-for-procedures", clinic?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("specialties")
        .select("id, name")
        .eq("is_active", true)
        .or(`clinic_id.is.null,clinic_id.eq.${clinic!.id}`)
        .order("name");
      if (error) throw error;
      return data as { id: string; name: string }[];
    },
    enabled: !!clinic?.id,
  });

  const { data: financeCategories = [] } = useQuery({
    queryKey: ["finance-categories-for-procedures", clinic?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("finance_categories")
        .select("id, name, type")
        .eq("clinic_id", clinic!.id)
        .order("name");
      if (error) return [];
      return (data ?? []) as { id: string; name: string; type: string }[];
    },
    enabled: !!clinic?.id,
  });

  const { data: paymentMethods = [] } = useQuery({
    queryKey: ["payment-methods-for-procedures", clinic?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("payment_methods")
        .select("id, name")
        .eq("clinic_id", clinic!.id)
        .eq("is_active", true)
        .order("name");
      if (error) return [];
      return (data ?? []) as { id: string; name: string }[];
    },
    enabled: !!clinic?.id,
  });

  const { data: anamnesisTemplates = [] } = useQuery({
    queryKey: ["anamnesis-templates-for-procedures", clinic?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("anamnesis_templates")
        .select("id, name")
        .or(`clinic_id.is.null,clinic_id.eq.${clinic!.id}`)
        .order("name");
      if (error) return [];
      return (data ?? []) as { id: string; name: string }[];
    },
    enabled: !!clinic?.id,
  });

  const { data: consentTerms = [] } = useQuery({
    queryKey: ["consent-terms-for-procedures", clinic?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("consent_terms")
        .select("id, title")
        .eq("clinic_id", clinic!.id)
        .order("title");
      if (error) return [];
      return (data ?? []) as { id: string; title: string }[];
    },
    enabled: !!clinic?.id,
  });

  const busy = createMutation.isPending || updateMutation.isPending;

  const handleSave = async () => {
    if (!isValid) {
      toast.error("Preencha o nome e a duração antes de salvar.");
      return;
    }
    try {
      if (isNew) {
        const created = await createMutation.mutateAsync(formData);
        navigate(`/app/config/procedimentos/${created.id}`, { replace: true });
      } else if (procedure) {
        await updateMutation.mutateAsync({ id: procedure.id, formData });
      }
    } catch {
      /* toast já emitido pelas mutations */
    }
  };

  const currency = (v: number | null | undefined) =>
    typeof v === "number"
      ? v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })
      : "—";

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate("/app/config/procedimentos")}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold">
              {isNew ? "Novo Procedimento" : formData.name || "Procedimento"}
            </h1>
            <p className="text-sm text-muted-foreground">
              Configure como o procedimento se comporta em Agenda, Sessões, Financeiro, Prontuário e Estoque.
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {formData.type && (
            <Badge variant="outline" className="capitalize">
              {TYPE_OPTIONS.find((t) => t.value === formData.type)?.label ?? formData.type}
            </Badge>
          )}
          {formData.uses_sessions && <Badge variant="secondary">Sessões</Badge>}
          {formData.is_free && <Badge className="bg-emerald-100 text-emerald-800">Gratuito</Badge>}
          <Button onClick={handleSave} disabled={busy || !isValid}>
            {busy ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
            Salvar
          </Button>
        </div>
      </div>

      <Tabs value={tab} onValueChange={setTab} className="space-y-4">
        <TabsList className="flex h-auto w-full flex-wrap justify-start gap-1 bg-muted/50 p-1">
          <TabsTrigger value="basico"><Info className="mr-1 h-3.5 w-3.5" />Dados básicos</TabsTrigger>
          <TabsTrigger value="agenda"><CalendarClock className="mr-1 h-3.5 w-3.5" />Agenda</TabsTrigger>
          <TabsTrigger value="sessoes"><Layers className="mr-1 h-3.5 w-3.5" />Sessões</TabsTrigger>
          <TabsTrigger value="financeiro"><Wallet className="mr-1 h-3.5 w-3.5" />Financeiro</TabsTrigger>
          <TabsTrigger value="prontuario"><FileText className="mr-1 h-3.5 w-3.5" />Prontuário</TabsTrigger>
          <TabsTrigger value="estoque"><PackageIcon className="mr-1 h-3.5 w-3.5" />Estoque</TabsTrigger>
          <TabsTrigger value="profissionais"><Users className="mr-1 h-3.5 w-3.5" />Profissionais</TabsTrigger>
          <TabsTrigger value="convenios"><ShieldCheck className="mr-1 h-3.5 w-3.5" />Convênios</TabsTrigger>
        </TabsList>

        {/* BÁSICO */}
        <TabsContent value="basico">
          <Card>
            <CardHeader>
              <CardTitle>Dados básicos</CardTitle>
              <CardDescription>Identidade e classificação do procedimento.</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <Label>Nome *</Label>
                <Input value={formData.name} onChange={(e) => updateField("name", e.target.value)} />
              </div>
              <div>
                <Label>Tipo</Label>
                <Select
                  value={formData.type ?? "procedimento"}
                  onValueChange={(v) => updateField("type", v as ProcedureType)}
                >
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {TYPE_OPTIONS.map((t) => (
                      <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Especialidade</Label>
                <Select
                  value={formData.specialty_id || ""}
                  onValueChange={(v) => {
                    updateField("specialty_id", v);
                    const s = specialties.find((x) => x.id === v);
                    if (s) updateField("specialty", s.name);
                  }}
                >
                  <SelectTrigger><SelectValue placeholder="Selecione..." /></SelectTrigger>
                  <SelectContent>
                    {specialties.map((s) => (
                      <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Categoria</Label>
                <Input
                  placeholder="Ex.: Estética facial, Odontologia..."
                  value={formData.category ?? ""}
                  onChange={(e) => updateField("category", e.target.value)}
                />
              </div>
              <div>
                <Label>Duração padrão (min) *</Label>
                <Input
                  type="number"
                  min={5}
                  value={formData.duration_minutes}
                  onChange={(e) => updateField("duration_minutes", Number(e.target.value) || 0)}
                />
              </div>
              <div className="sm:col-span-2">
                <Label>Descrição</Label>
                <Textarea
                  rows={3}
                  value={formData.description ?? ""}
                  onChange={(e) => updateField("description", e.target.value)}
                />
              </div>
              <div className="sm:col-span-2">
                <Label>Cor na agenda</Label>
                <div className="mt-1 flex flex-wrap gap-2">
                  {AGENDA_COLORS.map((c) => (
                    <button
                      key={c}
                      type="button"
                      className={`h-7 w-7 rounded-full border-2 transition ${
                        formData.color === c ? "border-foreground scale-110" : "border-transparent"
                      }`}
                      style={{ backgroundColor: c }}
                      onClick={() => updateField("color", c)}
                      aria-label={`Selecionar cor ${c}`}
                    />
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* AGENDA */}
        <TabsContent value="agenda">
          <Card>
            <CardHeader>
              <CardTitle>Configuração da agenda</CardTitle>
              <CardDescription>Como este procedimento aparece e se comporta ao agendar.</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4 sm:grid-cols-2">
              <SwitchRow
                label="Aparece na agenda"
                description="Se desativado, não aparece nas opções ao criar um agendamento."
                checked={formData.show_in_agenda ?? true}
                onChange={(v) => updateField("show_in_agenda", v)}
              />
              <SwitchRow
                label="Agendável online"
                description="Disponível no autoagendamento público."
                checked={formData.bookable_online ?? false}
                onChange={(v) => updateField("bookable_online", v)}
              />
              <SwitchRow
                label="Permite encaixe"
                description="Permite agendamento fora dos horários regulares."
                checked={formData.allow_walkin ?? true}
                onChange={(v) => updateField("allow_walkin", v)}
              />
              <SwitchRow
                label="Permite retorno"
                checked={formData.allows_return}
                onChange={(v) => updateField("allows_return", v)}
              />
              {formData.allows_return && (
                <div>
                  <Label>Prazo de retorno sem cobrança (dias)</Label>
                  <Input
                    type="number"
                    min={0}
                    value={formData.return_days ?? 15}
                    onChange={(e) => updateField("return_days", Number(e.target.value) || 0)}
                  />
                </div>
              )}
              <div>
                <Label>Intervalo mínimo entre agendamentos (min)</Label>
                <Input
                  type="number"
                  min={0}
                  value={formData.min_interval_minutes ?? ""}
                  onChange={(e) => updateField("min_interval_minutes", e.target.value ? Number(e.target.value) : null)}
                />
              </div>
              <div>
                <Label>Antecedência mínima (h)</Label>
                <Input
                  type="number"
                  min={0}
                  value={formData.min_booking_notice_hours ?? ""}
                  onChange={(e) => updateField("min_booking_notice_hours", e.target.value ? Number(e.target.value) : null)}
                />
              </div>
              <div>
                <Label>Antecedência máxima (dias)</Label>
                <Input
                  type="number"
                  min={0}
                  value={formData.max_booking_notice_days ?? ""}
                  onChange={(e) => updateField("max_booking_notice_days", e.target.value ? Number(e.target.value) : null)}
                />
              </div>
              <SwitchRow
                label="Exige profissional específico"
                checked={formData.requires_specific_professional ?? false}
                onChange={(v) => updateField("requires_specific_professional", v)}
              />
              <SwitchRow
                label="Exige sala/equipamento"
                checked={formData.requires_room ?? false}
                onChange={(v) => updateField("requires_room", v)}
              />
              <Separator className="sm:col-span-2" />
              <SwitchRow
                label="Gera cobrança ao agendar"
                description="Cria lançamento a receber no momento do agendamento."
                checked={formData.charge_on_schedule ?? false}
                onChange={(v) => updateField("charge_on_schedule", v)}
              />
              <SwitchRow
                label="Gera cobrança ao finalizar"
                description="Cria/consolida cobrança quando o atendimento é finalizado."
                checked={formData.charge_on_finish ?? true}
                onChange={(v) => updateField("charge_on_finish", v)}
              />
            </CardContent>
          </Card>
        </TabsContent>

        {/* SESSÕES */}
        <TabsContent value="sessoes">
          <Card>
            <CardHeader>
              <CardTitle>Sessões / Tratamento</CardTitle>
              <CardDescription>Configure se o procedimento é vendido como pacote de sessões.</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4 sm:grid-cols-2">
              <SwitchRow
                label="Usa sessões"
                checked={formData.uses_sessions ?? false}
                onChange={(v) => updateField("uses_sessions", v)}
              />
              <SwitchRow
                label="Permite venda avulsa"
                checked={formData.allow_single_sale ?? true}
                onChange={(v) => updateField("allow_single_sale", v)}
              />
              {formData.uses_sessions && (
                <>
                  <div>
                    <Label>Quantidade padrão de sessões</Label>
                    <Input
                      type="number"
                      min={1}
                      value={formData.default_sessions_count ?? ""}
                      onChange={(e) => updateField("default_sessions_count", e.target.value ? Number(e.target.value) : null)}
                    />
                  </div>
                  <div>
                    <Label>Intervalo recomendado (dias)</Label>
                    <Input
                      type="number"
                      min={0}
                      value={formData.session_interval_days ?? ""}
                      onChange={(e) => updateField("session_interval_days", e.target.value ? Number(e.target.value) : null)}
                    />
                  </div>
                  <div>
                    <Label>Duração da sessão (min)</Label>
                    <Input
                      type="number"
                      min={5}
                      value={formData.session_duration_minutes ?? ""}
                      onChange={(e) => updateField("session_duration_minutes", e.target.value ? Number(e.target.value) : null)}
                    />
                  </div>
                  <div>
                    <Label>Validade do pacote (dias)</Label>
                    <Input
                      type="number"
                      min={0}
                      value={formData.package_validity_days ?? ""}
                      onChange={(e) => updateField("package_validity_days", e.target.value ? Number(e.target.value) : null)}
                    />
                  </div>
                  <div>
                    <Label>Preço do pacote</Label>
                    <Input
                      type="number"
                      step="0.01"
                      value={formData.package_price ?? ""}
                      onChange={(e) => updateField("package_price", e.target.value ? Number(e.target.value) : null)}
                    />
                  </div>
                  <div>
                    <Label>Preço por sessão</Label>
                    <Input
                      type="number"
                      step="0.01"
                      value={formData.price_per_session ?? ""}
                      onChange={(e) => updateField("price_per_session", e.target.value ? Number(e.target.value) : null)}
                    />
                  </div>
                  <SwitchRow
                    label="Tratamento aberto (sem qtd definida)"
                    checked={formData.open_treatment ?? false}
                    onChange={(v) => updateField("open_treatment", v)}
                  />
                  <SwitchRow
                    label="Sugerir próxima sessão automaticamente"
                    checked={formData.suggest_next_session ?? true}
                    onChange={(v) => updateField("suggest_next_session", v)}
                  />
                  <SwitchRow
                    label="Bloquear agendamento fora do intervalo"
                    checked={formData.block_outside_interval ?? false}
                    onChange={(v) => updateField("block_outside_interval", v)}
                  />
                  <SwitchRow
                    label="Cancelar sessão sem perder pacote"
                    checked={formData.allow_cancel_without_losing_package ?? true}
                    onChange={(v) => updateField("allow_cancel_without_losing_package", v)}
                  />
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* FINANCEIRO */}
        <TabsContent value="financeiro">
          <Card>
            <CardHeader>
              <CardTitle>Financeiro</CardTitle>
              <CardDescription>Valores, cobranças e comissões.</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4 sm:grid-cols-2">
              <SwitchRow
                label="Procedimento gratuito"
                checked={formData.is_free ?? false}
                onChange={(v) => updateField("is_free", v)}
              />
              <div>
                <Label>Valor padrão</Label>
                <Input
                  type="number"
                  step="0.01"
                  disabled={formData.is_free}
                  value={formData.price ?? ""}
                  onChange={(e) => updateField("price", e.target.value ? Number(e.target.value) : undefined)}
                />
              </div>
              <div>
                <Label>Valor particular</Label>
                <Input
                  type="number"
                  step="0.01"
                  disabled={formData.is_free}
                  value={formData.particular_price ?? ""}
                  onChange={(e) => updateField("particular_price", e.target.value ? Number(e.target.value) : null)}
                />
              </div>
              <div>
                <Label>Valor por convênio</Label>
                <Input
                  type="number"
                  step="0.01"
                  disabled={formData.is_free}
                  value={formData.insurance_price ?? ""}
                  onChange={(e) => updateField("insurance_price", e.target.value ? Number(e.target.value) : null)}
                />
              </div>
              <SwitchRow
                label="Permite desconto"
                checked={formData.allow_discount ?? true}
                onChange={(v) => updateField("allow_discount", v)}
              />
              <div>
                <Label>Valor mínimo permitido</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={formData.min_price ?? ""}
                  onChange={(e) => updateField("min_price", e.target.value ? Number(e.target.value) : null)}
                />
              </div>
              <SwitchRow
                label="Permite parcelamento"
                checked={formData.allow_installments ?? true}
                onChange={(v) => updateField("allow_installments", v)}
              />
              <div>
                <Label>Máx. parcelas</Label>
                <Input
                  type="number"
                  min={1}
                  max={36}
                  value={formData.max_installments ?? 12}
                  onChange={(e) => updateField("max_installments", Number(e.target.value) || 1)}
                />
              </div>
              <div>
                <Label>Modo de cobrança</Label>
                <Select
                  value={formData.charge_mode ?? "automatic"}
                  onValueChange={(v) => updateField("charge_mode", v as ProcedureChargeMode)}
                >
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="automatic">Automática</SelectItem>
                    <SelectItem value="manual">Manual</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Categoria financeira padrão</Label>
                <Select
                  value={formData.default_finance_category_id ?? ""}
                  onValueChange={(v) => updateField("default_finance_category_id", v || null)}
                >
                  <SelectTrigger><SelectValue placeholder="Nenhuma" /></SelectTrigger>
                  <SelectContent>
                    {financeCategories.map((c) => (
                      <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Forma de pagamento padrão</Label>
                <Select
                  value={formData.default_payment_method_id ?? ""}
                  onValueChange={(v) => updateField("default_payment_method_id", v || null)}
                >
                  <SelectTrigger><SelectValue placeholder="Nenhuma" /></SelectTrigger>
                  <SelectContent>
                    {paymentMethods.map((m) => (
                      <SelectItem key={m.id} value={m.id}>{m.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Centro de custo</Label>
                <Input
                  value={formData.cost_center ?? ""}
                  onChange={(e) => updateField("cost_center", e.target.value)}
                />
              </div>

              <Separator className="sm:col-span-2" />

              <div>
                <Label>Comissão</Label>
                <Select
                  value={formData.commission_type ?? "none"}
                  onValueChange={(v) => updateField("commission_type", v as ProcedureCommissionType)}
                >
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Sem comissão</SelectItem>
                    <SelectItem value="fixed">Valor fixo</SelectItem>
                    <SelectItem value="percent">Percentual</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {(formData.commission_type ?? "none") !== "none" && (
                <>
                  <div>
                    <Label>
                      {formData.commission_type === "percent" ? "Percentual (%)" : "Valor (R$)"}
                    </Label>
                    <Input
                      type="number"
                      step="0.01"
                      value={formData.commission_value ?? ""}
                      onChange={(e) => updateField("commission_value", e.target.value ? Number(e.target.value) : null)}
                    />
                  </div>
                  <div>
                    <Label>Quando gerar comissão</Label>
                    <Select
                      value={formData.commission_trigger ?? "on_payment"}
                      onValueChange={(v) => updateField("commission_trigger", v as ProcedureCommissionTrigger)}
                    >
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="on_finish">Ao finalizar atendimento</SelectItem>
                        <SelectItem value="on_payment">Ao receber pagamento</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </>
              )}

              <Alert className="sm:col-span-2">
                <AlertDescription className="text-xs">
                  Valor atual: <b>{currency(formData.price ?? null)}</b>. Se o procedimento for gratuito,
                  os campos de valor são ignorados na cobrança.
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>
        </TabsContent>

        {/* PRONTUÁRIO */}
        <TabsContent value="prontuario">
          <Card>
            <CardHeader>
              <CardTitle>Prontuário / Atendimento</CardTitle>
              <CardDescription>Exigências clínicas e protocolo do procedimento.</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4 sm:grid-cols-2">
              <SwitchRow
                label="Exige anamnese antes"
                checked={formData.requires_anamnesis ?? false}
                onChange={(v) => updateField("requires_anamnesis", v)}
              />
              <div>
                <Label>Modelo de anamnese padrão</Label>
                <Select
                  value={formData.default_anamnesis_template_id ?? ""}
                  onValueChange={(v) => updateField("default_anamnesis_template_id", v || null)}
                >
                  <SelectTrigger><SelectValue placeholder="Nenhum" /></SelectTrigger>
                  <SelectContent>
                    {anamnesisTemplates.map((t) => (
                      <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <SwitchRow
                label="Exige evolução clínica"
                checked={formData.requires_evolution ?? false}
                onChange={(v) => updateField("requires_evolution", v)}
              />
              <SwitchRow
                label="Exige assinatura"
                checked={formData.requires_signature ?? false}
                onChange={(v) => updateField("requires_signature", v)}
              />
              <SwitchRow
                label="Exige fotos antes/depois"
                checked={formData.requires_before_after_photos ?? false}
                onChange={(v) => updateField("requires_before_after_photos", v)}
              />
              <SwitchRow
                label="Exige termo de consentimento"
                checked={formData.requires_consent_term ?? false}
                onChange={(v) => updateField("requires_consent_term", v)}
              />
              <div>
                <Label>Modelo de termo padrão</Label>
                <Select
                  value={formData.default_consent_term_id ?? ""}
                  onValueChange={(v) => updateField("default_consent_term_id", v || null)}
                >
                  <SelectTrigger><SelectValue placeholder="Nenhum" /></SelectTrigger>
                  <SelectContent>
                    {consentTerms.map((t) => (
                      <SelectItem key={t.id} value={t.id}>{t.title}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="sm:col-span-2">
                <Label>Protocolo / instruções</Label>
                <Textarea
                  rows={3}
                  value={formData.protocol_notes ?? ""}
                  onChange={(e) => updateField("protocol_notes", e.target.value)}
                />
              </div>
              <div className="sm:col-span-2">
                <Label>Cuidados pré-procedimento</Label>
                <Textarea
                  rows={2}
                  value={formData.pre_procedure_care ?? ""}
                  onChange={(e) => updateField("pre_procedure_care", e.target.value)}
                />
              </div>
              <div className="sm:col-span-2">
                <Label>Cuidados pós-procedimento</Label>
                <Textarea
                  rows={2}
                  value={formData.post_procedure_care ?? ""}
                  onChange={(e) => updateField("post_procedure_care", e.target.value)}
                />
              </div>
              <div className="sm:col-span-2">
                <Label>Contraindicações</Label>
                <Textarea
                  rows={2}
                  value={formData.contraindications ?? ""}
                  onChange={(e) => updateField("contraindications", e.target.value)}
                />
              </div>
              <div className="sm:col-span-2">
                <Label>Intercorrências possíveis</Label>
                <Textarea
                  rows={2}
                  value={formData.possible_intercurrences ?? ""}
                  onChange={(e) => updateField("possible_intercurrences", e.target.value)}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ESTOQUE */}
        <TabsContent value="estoque">
          <Card>
            <CardHeader>
              <CardTitle>Materiais / Estoque</CardTitle>
              <CardDescription>
                Vincule produtos e kits em <b>Configurações → Catálogo Clínico → Consumo</b>.
                Aqui você define o comportamento de baixa.
              </CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4 sm:grid-cols-2">
              <SwitchRow
                label="Baixa automática ao finalizar atendimento"
                checked={formData.auto_deduct_stock ?? true}
                onChange={(v) => updateField("auto_deduct_stock", v)}
              />
              <SwitchRow
                label="Permitir ajuste manual dos itens"
                checked={formData.allow_manual_stock_adjust ?? true}
                onChange={(v) => updateField("allow_manual_stock_adjust", v)}
              />
              <SwitchRow
                label="Alertar quando não houver estoque"
                checked={formData.alert_when_no_stock ?? true}
                onChange={(v) => updateField("alert_when_no_stock", v)}
              />
            </CardContent>
          </Card>
        </TabsContent>

        {/* PROFISSIONAIS */}
        <TabsContent value="profissionais">
          <Card>
            <CardHeader>
              <CardTitle>Profissionais</CardTitle>
              <CardDescription>
                A lista de profissionais autorizados é gerenciada em <b>Equipe → Profissional</b>.
                Aqui você define se o vínculo é obrigatório.
              </CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4 sm:grid-cols-2">
              <SwitchRow
                label="Restringir a profissionais autorizados"
                description="Bloqueia agendamento com profissionais que não têm autorização para este procedimento."
                checked={formData.restrict_to_authorized_professionals ?? false}
                onChange={(v) => updateField("restrict_to_authorized_professionals", v)}
              />
            </CardContent>
          </Card>
        </TabsContent>

        {/* CONVÊNIOS */}
        <TabsContent value="convenios">
          <Card>
            <CardHeader>
              <CardTitle>Convênios</CardTitle>
              <CardDescription>Regras de cobertura e códigos.</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4 sm:grid-cols-2">
              <SwitchRow
                label="Aceita convênio"
                checked={formData.accepts_insurance ?? false}
                onChange={(v) => updateField("accepts_insurance", v)}
              />
              <SwitchRow
                label="Exige autorização"
                checked={formData.requires_insurance_authorization ?? false}
                onChange={(v) => updateField("requires_insurance_authorization", v)}
              />
              <div>
                <Label>Código TUSS</Label>
                <Input
                  value={formData.tuss_code ?? ""}
                  onChange={(e) => updateField("tuss_code", e.target.value)}
                />
              </div>
              <div>
                <Label>Código TISS</Label>
                <Input
                  value={formData.tiss_code ?? ""}
                  onChange={(e) => updateField("tiss_code", e.target.value)}
                />
              </div>
              <Alert className="sm:col-span-2">
                <AlertDescription className="text-xs">
                  Configure valores por convênio em <b>Gestão → Convênios → Tabelas de Preços</b>.
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

function SwitchRow({
  label,
  description,
  checked,
  onChange,
}: {
  label: string;
  description?: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <div className="flex items-start justify-between gap-3 rounded-md border p-3">
      <div className="space-y-0.5">
        <Label className="text-sm font-medium">{label}</Label>
        {description && <p className="text-xs text-muted-foreground">{description}</p>}
      </div>
      <Switch checked={checked} onCheckedChange={onChange} />
    </div>
  );
}
