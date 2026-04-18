import { useState, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Plus, Search, Edit2, Copy, Trash2, Loader2,
  CalendarPlus, Bell, XCircle, CheckCircle, Zap,
  MessageCircle, Mail, ChevronRight, ChevronLeft, Lock,
  AlertTriangle, Send, Eye, Check, Sparkles,
} from "lucide-react";
import {
  useAutomationRules,
  EVENT_TYPE_LABELS,
  DELAY_TYPE_LABELS,
  type AutomationFormData,
  type AutomationRuleRow,
  type EventType,
  type DelayType,
  type AutomationChannel,
} from "@/hooks/useAutomationRules";
import { useMessageTemplates } from "@/hooks/useMessageTemplates";
import { useWhatsAppIntegration } from "@/hooks/useWhatsAppIntegration";
import { DYNAMIC_FIELDS } from "@/types/comunicacao";
import { cn } from "@/lib/utils";

// ── Constants ──

const EVENT_CARDS: { type: EventType; icon: React.ElementType; description: string }[] = [
  { type: "appointment_created", icon: CalendarPlus, description: "Dispara quando um novo agendamento é criado" },
  { type: "appointment_reminder", icon: Bell, description: "Envia lembrete antes da consulta agendada" },
  { type: "appointment_cancelled", icon: XCircle, description: "Notifica quando a consulta é cancelada" },
  { type: "appointment_completed", icon: CheckCircle, description: "Envia mensagem após a consulta ser finalizada" },
];

const WIZARD_STEPS = [
  { key: "event", label: "Evento", number: 1 },
  { key: "timing", label: "Regra de Envio", number: 2 },
  { key: "message", label: "Mensagem", number: 3 },
  { key: "review", label: "Revisão", number: 4 },
] as const;

const emptyForm: AutomationFormData = {
  name: "",
  description: "",
  trigger_type: "appointment_created",
  delay_type: "immediate",
  delay_value: 0,
  channel: "whatsapp",
  template_id: null,
  is_active: true,
  priority: 0,
};

// ── Helper: preview content ──
const previewContent = (content: string) =>
  content
    .replace(/\{\{nome_paciente\}\}/g, "Maria Silva")
    .replace(/\{\{primeiro_nome\}\}/g, "Maria")
    .replace(/\{\{data_consulta\}\}/g, "25/01/2024")
    .replace(/\{\{hora_consulta\}\}/g, "14:00")
    .replace(/\{\{profissional\}\}/g, "Dr. João Oliveira")
    .replace(/\{\{endereco_clinica\}\}/g, "Av. Paulista, 1000")
    .replace(/\{\{link_agenda\}\}/g, "https://clinica.com/agendar")
    .replace(/\{\{nome_clinica\}\}/g, "Clínica YesClin");

export default function MarketingAutomacoes() {
  const {
    automations, loading, saving, maxAutomations, canCreateMore,
    createAutomation, updateAutomation, deleteAutomation,
    toggleAutomation, duplicateAutomation,
  } = useAutomationRules();
  const { templates } = useMessageTemplates();
  const { isConfigured: whatsappConfigured } = useWhatsAppIntegration();

  const [searchTerm, setSearchTerm] = useState("");
  const [wizardOpen, setWizardOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [selectedAutomation, setSelectedAutomation] = useState<AutomationRuleRow | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<AutomationFormData>(emptyForm);
  const [wizardStep, setWizardStep] = useState(0);
  const [customMessage, setCustomMessage] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const activeCount = automations.filter((a) => a.is_active).length;

  const filteredAutomations = automations.filter((a) =>
    a.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    EVENT_TYPE_LABELS[a.trigger_type as EventType]?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Check if same event automation already exists
  const hasDuplicateEvent = automations.some(
    (a) => a.trigger_type === form.trigger_type && (!editingId || a.id !== editingId)
  );

  const selectedTemplate = templates.find((t) => t.id === form.template_id);
  const messageContent = selectedTemplate?.content || customMessage;
  const needsDelayValue = form.delay_type !== "immediate";

  // ── Wizard handlers ──
  const handleOpenWizard = () => {
    if (!canCreateMore) return;
    setEditingId(null);
    setForm({ ...emptyForm, priority: automations.length + 1 });
    setCustomMessage("");
    setWizardStep(0);
    setWizardOpen(true);
  };

  const handleOpenEdit = (automation: AutomationRuleRow) => {
    setEditingId(automation.id);
    setForm({
      name: automation.name,
      description: automation.description || "",
      trigger_type: automation.trigger_type as EventType,
      delay_type: (automation.delay_type || "immediate") as DelayType,
      delay_value: automation.delay_value || 0,
      channel: (automation.channel || "whatsapp") as AutomationChannel,
      template_id: automation.template_id,
      is_active: automation.is_active,
      priority: automation.priority,
    });
    setEditOpen(true);
  };

  const handleWizardSave = async () => {
    const finalForm = {
      ...form,
      name: form.name || `${EVENT_TYPE_LABELS[form.trigger_type]} - ${DELAY_TYPE_LABELS[form.delay_type]}`,
    };
    await createAutomation(finalForm);
    setWizardOpen(false);
  };

  const handleEditSave = async () => {
    if (!editingId || !form.name) return;
    await updateAutomation(editingId, form);
    setEditOpen(false);
  };

  const handleDelete = async () => {
    if (!selectedAutomation) return;
    await deleteAutomation(selectedAutomation.id);
    setDeleteOpen(false);
    setSelectedAutomation(null);
  };

  const insertVariable = (key: string) => {
    const ta = textareaRef.current;
    if (ta) {
      const start = ta.selectionStart;
      const end = ta.selectionEnd;
      const newVal = customMessage.substring(0, start) + key + customMessage.substring(end);
      setCustomMessage(newVal);
      setTimeout(() => {
        ta.focus();
        ta.setSelectionRange(start + key.length, start + key.length);
      }, 0);
    } else {
      setCustomMessage((prev) => prev + key);
    }
  };

  const canGoNext = (step: number): boolean => {
    switch (step) {
      case 0: return !!form.trigger_type;
      case 1: return !!form.delay_type && !!form.channel && (!needsDelayValue || form.delay_value > 0);
      case 2: return !!(form.template_id || customMessage.trim());
      default: return true;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <>
      {/* ── LIST VIEW ── */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold text-foreground">Automações</h2>
            <p className="text-sm text-muted-foreground">
              {activeCount} ativa{activeCount !== 1 ? "s" : ""} · {automations.length}/{maxAutomations === 0 ? "∞" : maxAutomations} criadas
            </p>
          </div>
          <Button onClick={handleOpenWizard} disabled={!canCreateMore} className="gap-2">
            {!canCreateMore ? <Lock className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
            Nova Automação
          </Button>
        </div>

        {!canCreateMore && (
          <div className="flex items-center gap-2 px-4 py-3 rounded-lg border border-amber-200 bg-amber-50 dark:border-amber-800 dark:bg-amber-950/30 text-sm text-amber-700 dark:text-amber-400">
            <AlertTriangle className="h-4 w-4 shrink-0" />
            Limite de {maxAutomations} automações atingido. Faça upgrade para automações ilimitadas.
          </div>
        )}

        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Buscar automações..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-9" />
        </div>

        <div className="space-y-3">
          {filteredAutomations.map((automation) => {
            const eventType = automation.trigger_type as EventType;
            const eventCard = EVENT_CARDS.find((c) => c.type === eventType);
            const Icon = eventCard?.icon || Zap;
            const delayType = (automation.delay_type || "immediate") as DelayType;

            return (
              <Card key={automation.id} className={cn("transition-all", !automation.is_active && "opacity-60")}>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3">
                      <div className={cn(
                        "p-2.5 rounded-xl shrink-0",
                        automation.is_active
                          ? "bg-primary/10 text-primary"
                          : "bg-muted text-muted-foreground"
                      )}>
                        <Icon className="h-5 w-5" />
                      </div>
                      <div className="min-w-0">
                        <h4 className="font-medium text-sm leading-tight">{automation.name}</h4>
                        {automation.description && (
                          <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">{automation.description}</p>
                        )}
                        <div className="flex items-center gap-1.5 mt-2 flex-wrap">
                          <Badge variant="outline" className="text-xs">{EVENT_TYPE_LABELS[eventType] || automation.trigger_type}</Badge>
                          <Badge variant="secondary" className="text-xs">
                            {delayType === "immediate" ? "Imediato" : `${automation.delay_value} ${DELAY_TYPE_LABELS[delayType]}`}
                          </Badge>
                          <Badge variant="secondary" className="text-xs flex items-center gap-1">
                            {automation.channel === "email" ? <Mail className="h-3 w-3" /> : <MessageCircle className="h-3 w-3" />}
                            {automation.channel === "email" ? "Email" : "WhatsApp"}
                          </Badge>
                          {automation.template && (
                            <Badge variant="secondary" className="text-xs">📝 {automation.template.name}</Badge>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleOpenEdit(automation)} title="Editar">
                        <Edit2 className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => duplicateAutomation(automation)} title="Duplicar">
                        <Copy className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => { setSelectedAutomation(automation); setDeleteOpen(true); }} title="Excluir">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                      <Switch checked={automation.is_active} onCheckedChange={() => toggleAutomation(automation.id)} />
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}

          {filteredAutomations.length === 0 && (
            <Card>
              <CardContent className="py-12 text-center">
                <Zap className="h-10 w-10 mx-auto mb-3 text-muted-foreground/40" />
                <p className="text-muted-foreground mb-3">Nenhuma automação encontrada</p>
                <Button variant="outline" size="sm" onClick={handleOpenWizard} disabled={!canCreateMore} className="gap-2">
                  <Plus className="h-4 w-4" /> Criar primeira automação
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════════
          WIZARD DIALOG — 4-Step Premium Flow
         ══════════════════════════════════════════════════════════ */}
      <Dialog open={wizardOpen} onOpenChange={setWizardOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-hidden flex flex-col p-0">
          {/* Step Progress Bar */}
          <div className="px-6 pt-6 pb-4 border-b border-border">
            <DialogHeader className="mb-4">
              <DialogTitle className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-primary" />
                Nova Automação
              </DialogTitle>
            </DialogHeader>
            <div className="flex items-center gap-0">
              {WIZARD_STEPS.map((step, i) => (
                <div key={step.key} className="flex items-center flex-1">
                  <button
                    onClick={() => i < wizardStep && setWizardStep(i)}
                    disabled={i > wizardStep}
                    className={cn(
                      "flex items-center gap-2 text-xs font-medium transition-colors",
                      i <= wizardStep ? "text-primary" : "text-muted-foreground",
                      i < wizardStep && "cursor-pointer hover:text-primary/80"
                    )}
                  >
                    <span className={cn(
                      "flex items-center justify-center h-7 w-7 rounded-full text-xs font-bold transition-all duration-300 shrink-0",
                      i < wizardStep
                        ? "bg-primary text-primary-foreground"
                        : i === wizardStep
                          ? "bg-primary text-primary-foreground ring-4 ring-primary/20"
                          : "bg-muted text-muted-foreground"
                    )}>
                      {i < wizardStep ? <Check className="h-3.5 w-3.5" /> : step.number}
                    </span>
                    <span className="hidden sm:inline">{step.label}</span>
                  </button>
                  {i < WIZARD_STEPS.length - 1 && (
                    <div className={cn(
                      "flex-1 h-0.5 mx-2 rounded-full transition-colors duration-300",
                      i < wizardStep ? "bg-primary" : "bg-muted"
                    )} />
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Step Content */}
          <ScrollArea className="flex-1 px-6 py-5">
            <div key={wizardStep} className="animate-fade-in min-h-[280px]">

              {/* ── STEP 1: EVENT ── */}
              {wizardStep === 0 && (
                <div className="space-y-3">
                  <p className="text-sm text-muted-foreground mb-1">Selecione o evento que dispara esta automação:</p>
                  {EVENT_CARDS.map(({ type, icon: EventIcon, description }) => (
                    <button
                      key={type}
                      onClick={() => setForm((prev) => ({ ...prev, trigger_type: type }))}
                      className={cn(
                        "w-full flex items-start gap-4 p-4 rounded-xl border text-left transition-all duration-200",
                        form.trigger_type === type
                          ? "border-primary bg-primary/5 ring-2 ring-primary/20 shadow-sm"
                          : "border-border hover:border-muted-foreground/30 hover:bg-muted/50"
                      )}
                    >
                      <div className={cn(
                        "p-2 rounded-lg shrink-0",
                        form.trigger_type === type ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"
                      )}>
                        <EventIcon className="h-5 w-5" />
                      </div>
                      <div>
                        <p className="font-medium text-sm">{EVENT_TYPE_LABELS[type]}</p>
                        <p className="text-xs text-muted-foreground mt-0.5">{description}</p>
                      </div>
                      {form.trigger_type === type && (
                        <Check className="h-5 w-5 text-primary ml-auto shrink-0 mt-0.5" />
                      )}
                    </button>
                  ))}
                  {hasDuplicateEvent && (
                    <div className="flex items-center gap-2 px-3 py-2 rounded-lg border border-amber-200 bg-amber-50 dark:border-amber-800 dark:bg-amber-950/30 text-xs text-amber-700 dark:text-amber-400">
                      <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
                      Já existe uma automação para este evento.
                    </div>
                  )}
                </div>
              )}

              {/* ── STEP 2: TIMING & CHANNEL ── */}
              {wizardStep === 1 && (
                <div className="space-y-6">
                  {/* Timing */}
                  <div className="space-y-3">
                    <Label className="text-sm font-medium">Quando enviar a mensagem:</Label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {(Object.entries(DELAY_TYPE_LABELS) as [DelayType, string][]).map(([key, label]) => (
                        <button
                          key={key}
                          onClick={() => setForm((prev) => ({
                            ...prev,
                            delay_type: key,
                            delay_value: key === "immediate" ? 0 : prev.delay_value || 1,
                          }))}
                          className={cn(
                            "p-3 rounded-xl border text-left text-sm font-medium transition-all",
                            form.delay_type === key
                              ? "border-primary bg-primary/5 ring-2 ring-primary/20"
                              : "border-border hover:border-muted-foreground/30"
                          )}
                        >
                          {label}
                        </button>
                      ))}
                    </div>
                    {needsDelayValue && (
                      <div className="max-w-xs">
                        <Label className="text-xs text-muted-foreground">
                          {form.delay_type.includes("hours") ? "Quantas horas?" : "Quantos dias?"}
                        </Label>
                        <Input
                          type="number"
                          min={1}
                          value={form.delay_value || ""}
                          onChange={(e) => setForm((prev) => ({ ...prev, delay_value: Number(e.target.value) || 0 }))}
                          placeholder={form.delay_type.includes("hours") ? "Ex: 24" : "Ex: 2"}
                          className="mt-1"
                        />
                      </div>
                    )}
                  </div>

                  <Separator />

                  {/* Channel */}
                  <div className="space-y-3">
                    <Label className="text-sm font-medium">Canal de envio:</Label>
                    <div className="flex gap-3">
                      <button
                        onClick={() => setForm((prev) => ({ ...prev, channel: "whatsapp" }))}
                        className={cn(
                          "flex-1 flex items-center justify-center gap-2 p-4 rounded-xl border text-sm font-medium transition-all",
                          form.channel === "whatsapp"
                            ? "border-primary bg-primary/5 ring-2 ring-primary/20"
                            : "border-border hover:border-muted-foreground/30"
                        )}
                      >
                        <MessageCircle className="h-5 w-5 text-green-600" />
                        WhatsApp
                      </button>
                      <button
                        onClick={() => setForm((prev) => ({ ...prev, channel: "email" }))}
                        className={cn(
                          "flex-1 flex items-center justify-center gap-2 p-4 rounded-xl border text-sm font-medium transition-all",
                          form.channel === "email"
                            ? "border-primary bg-primary/5 ring-2 ring-primary/20"
                            : "border-border hover:border-muted-foreground/30"
                        )}
                      >
                        <Mail className="h-5 w-5 text-blue-600" />
                        Email
                      </button>
                    </div>
                    {form.channel === "whatsapp" && !whatsappConfigured && (
                      <div className="flex items-center gap-2 px-3 py-2.5 rounded-lg border border-amber-200 bg-amber-50 dark:border-amber-800 dark:bg-amber-950/30 text-xs text-amber-700 dark:text-amber-400">
                        <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
                        <span>WhatsApp não configurado.</span>
                        <Button
                          variant="link"
                          size="sm"
                          className="h-auto p-0 text-xs text-amber-700 dark:text-amber-400 underline"
                          onClick={() => { setWizardOpen(false); /* navigate handled by parent */ }}
                        >
                          Configurar agora
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* ── STEP 3: MESSAGE ── */}
              {wizardStep === 2 && (
                <div className="space-y-4">
                  {/* Template Selection */}
                  <div>
                    <Label className="text-sm font-medium">Template de mensagem:</Label>
                    <Select
                      value={form.template_id || "custom"}
                      onValueChange={(v) => setForm((prev) => ({ ...prev, template_id: v === "custom" ? null : v }))}
                    >
                      <SelectTrigger className="mt-1">
                        <SelectValue placeholder="Selecione um template" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="custom">✍️ Mensagem personalizada</SelectItem>
                        {templates.filter((t) => t.is_active).map((t) => (
                          <SelectItem key={t.id} value={t.id}>
                            {t.name} ({t.channel === "whatsapp" ? "WhatsApp" : t.channel})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Custom message editor or template preview */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    {/* Left: Editor */}
                    <div className="space-y-2">
                      <Label className="text-xs text-muted-foreground">
                        {form.template_id ? "Conteúdo do template:" : "Sua mensagem:"}
                      </Label>
                      {form.template_id ? (
                        <div className="p-3 rounded-lg border bg-muted/30 text-sm whitespace-pre-wrap min-h-[160px]">
                          {selectedTemplate?.content || "Template não encontrado"}
                        </div>
                      ) : (
                        <>
                          <Textarea
                            ref={textareaRef}
                            value={customMessage}
                            onChange={(e) => setCustomMessage(e.target.value)}
                            placeholder="Olá {{primeiro_nome}}, sua consulta está agendada para {{data_consulta}} às {{hora_consulta}}..."
                            rows={7}
                            className="resize-none"
                          />
                          <p className="text-xs text-muted-foreground text-right">{customMessage.length} caracteres</p>
                        </>
                      )}

                      {/* Variable buttons */}
                      {!form.template_id && (
                        <div>
                          <Label className="text-xs text-muted-foreground">Inserir variável no cursor:</Label>
                          <div className="flex flex-wrap gap-1 mt-1">
                            {DYNAMIC_FIELDS.map((field) => (
                              <Button
                                key={field.key}
                                variant="outline"
                                size="sm"
                                className="text-xs h-7 px-2"
                                onClick={() => insertVariable(field.key)}
                              >
                                {field.label}
                              </Button>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Right: Preview */}
                    <div className="space-y-2">
                      <Label className="text-xs text-muted-foreground flex items-center gap-1">
                        <Eye className="h-3 w-3" /> Preview
                      </Label>
                      <div className={cn(
                        "rounded-2xl p-4 min-h-[160px]",
                        form.channel === "whatsapp"
                          ? "bg-[#e5ddd5] dark:bg-[#0b141a]"
                          : "bg-muted/50 border"
                      )}>
                        {form.channel === "whatsapp" ? (
                          <div className="bg-white dark:bg-[#1f2c34] rounded-lg px-3 py-2 max-w-[85%] shadow-sm">
                            <p className="text-sm whitespace-pre-wrap text-foreground">
                              {previewContent(messageContent) || "Sua mensagem aparecerá aqui..."}
                            </p>
                            <p className="text-[10px] text-muted-foreground text-right mt-1">14:00 ✓✓</p>
                          </div>
                        ) : (
                          <div className="space-y-2">
                            <div className="flex items-center gap-2 pb-2 border-b border-border">
                              <Mail className="h-4 w-4 text-muted-foreground" />
                              <span className="text-xs font-medium">Clínica YesClin</span>
                            </div>
                            <p className="text-sm whitespace-pre-wrap">
                              {previewContent(messageContent) || "Sua mensagem aparecerá aqui..."}
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Warnings */}
                  {!form.template_id && customMessage.trim() && !DYNAMIC_FIELDS.some((f) => customMessage.includes(f.key)) && (
                    <div className="flex items-center gap-2 px-3 py-2 rounded-lg border border-amber-200 bg-amber-50 dark:border-amber-800 dark:bg-amber-950/30 text-xs text-amber-700 dark:text-amber-400">
                      <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
                      Nenhuma variável dinâmica foi utilizada na mensagem.
                    </div>
                  )}
                </div>
              )}

              {/* ── STEP 4: REVIEW & ACTIVATE ── */}
              {wizardStep === 3 && (
                <div className="space-y-5">
                  <div>
                    <Label>Nome da Automação *</Label>
                    <Input
                      value={form.name}
                      onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
                      placeholder={`${EVENT_TYPE_LABELS[form.trigger_type]} - ${DELAY_TYPE_LABELS[form.delay_type]}`}
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label>Descrição (opcional)</Label>
                    <Textarea
                      value={form.description}
                      onChange={(e) => setForm((prev) => ({ ...prev, description: e.target.value }))}
                      placeholder="Descreva o que esta automação faz..."
                      rows={2}
                      className="mt-1"
                    />
                  </div>

                  {/* Summary Card */}
                  <Card className="border-primary/20 bg-primary/5">
                    <CardContent className="p-4 space-y-3">
                      <p className="text-sm font-semibold flex items-center gap-2">
                        <Sparkles className="h-4 w-4 text-primary" />
                        Resumo da automação
                      </p>
                      <div className="grid grid-cols-2 gap-3 text-sm">
                        <div>
                          <p className="text-xs text-muted-foreground">Evento</p>
                          <p className="font-medium">{EVENT_TYPE_LABELS[form.trigger_type]}</p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">Envio</p>
                          <p className="font-medium">
                            {form.delay_type === "immediate" ? "Imediato" : `${form.delay_value} ${DELAY_TYPE_LABELS[form.delay_type]}`}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">Canal</p>
                          <p className="font-medium flex items-center gap-1">
                            {form.channel === "whatsapp" ? <MessageCircle className="h-3.5 w-3.5" /> : <Mail className="h-3.5 w-3.5" />}
                            {form.channel === "whatsapp" ? "WhatsApp" : "Email"}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">Mensagem</p>
                          <p className="font-medium truncate">{selectedTemplate?.name || "Personalizada"}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Activate toggle */}
                  <div className="flex items-center justify-between p-4 rounded-xl border bg-muted/30">
                    <div>
                      <p className="text-sm font-medium">Ativar automação</p>
                      <p className="text-xs text-muted-foreground">A automação começa a disparar imediatamente após salvar</p>
                    </div>
                    <Switch
                      checked={form.is_active}
                      onCheckedChange={(v) => setForm((prev) => ({ ...prev, is_active: v }))}
                    />
                  </div>
                </div>
              )}
            </div>
          </ScrollArea>

          {/* Footer */}
          <div className="flex items-center justify-between px-6 py-4 border-t border-border bg-muted/30">
            <div>
              {wizardStep > 0 && (
                <Button variant="ghost" onClick={() => setWizardStep((s) => s - 1)} className="gap-1">
                  <ChevronLeft className="h-4 w-4" /> Voltar
                </Button>
              )}
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setWizardOpen(false)}>
                Cancelar
              </Button>
              {wizardStep < WIZARD_STEPS.length - 1 ? (
                <Button onClick={() => setWizardStep((s) => s + 1)} disabled={!canGoNext(wizardStep)} className="gap-1">
                  Próximo <ChevronRight className="h-4 w-4" />
                </Button>
              ) : (
                <Button onClick={handleWizardSave} disabled={saving} className="gap-2">
                  {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Zap className="h-4 w-4" />}
                  Salvar e Ativar
                </Button>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* ══════════════════════════════════════════════════════════
          EDIT DIALOG
         ══════════════════════════════════════════════════════════ */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Editar Automação</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Nome *</Label>
              <Input value={form.name} onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))} />
            </div>
            <div>
              <Label>Descrição</Label>
              <Textarea value={form.description} onChange={(e) => setForm((prev) => ({ ...prev, description: e.target.value }))} rows={2} />
            </div>
            <div>
              <Label>Evento</Label>
              <Select value={form.trigger_type} onValueChange={(v) => setForm((prev) => ({ ...prev, trigger_type: v as EventType }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {Object.entries(EVENT_TYPE_LABELS).map(([key, label]) => (
                    <SelectItem key={key} value={key}>{label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Quando enviar</Label>
                <Select value={form.delay_type} onValueChange={(v) => setForm((prev) => ({ ...prev, delay_type: v as DelayType }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {Object.entries(DELAY_TYPE_LABELS).map(([key, label]) => (
                      <SelectItem key={key} value={key}>{label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              {needsDelayValue && (
                <div>
                  <Label>Valor</Label>
                  <Input type="number" min={1} value={form.delay_value || ""} onChange={(e) => setForm((prev) => ({ ...prev, delay_value: Number(e.target.value) || 0 }))} />
                </div>
              )}
            </div>
            <div>
              <Label>Canal</Label>
              <Select value={form.channel} onValueChange={(v) => setForm((prev) => ({ ...prev, channel: v as AutomationChannel }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="whatsapp">WhatsApp</SelectItem>
                  <SelectItem value="email">Email</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Template</Label>
              <Select value={form.template_id || "none"} onValueChange={(v) => setForm((prev) => ({ ...prev, template_id: v === "none" ? null : v }))}>
                <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Nenhum</SelectItem>
                  {templates.filter((t) => t.is_active).map((t) => (
                    <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center gap-2">
              <Switch checked={form.is_active} onCheckedChange={(v) => setForm((prev) => ({ ...prev, is_active: v }))} />
              <Label>Ativa</Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditOpen(false)}>Cancelar</Button>
            <Button onClick={handleEditSave} disabled={saving || !form.name}>
              {saving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
              Salvar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ══════════════════════════════════════════════════════════
          DELETE DIALOG
         ══════════════════════════════════════════════════════════ */}
      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir automação?</AlertDialogTitle>
            <AlertDialogDescription>
              A automação "{selectedAutomation?.name}" será excluída permanentemente.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
