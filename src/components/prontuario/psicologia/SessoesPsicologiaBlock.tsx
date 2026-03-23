import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Slider } from "@/components/ui/slider";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { 
  Plus, FileText, Clock, User, CheckCircle, Save, X, ChevronRight, Brain,
  MessageSquare, Lightbulb, ClipboardCheck, Eye, Calendar, Timer, Hash,
  AlertTriangle, SmilePlus, ShieldAlert, TrendingUp, Video, MapPin,
} from "lucide-react";
import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import type { 
  SessaoPsicologia, SessaoFormData, StatusSessao,
} from "@/hooks/prontuario/psicologia/useSessoesPsicologiaData";
import { INTERVENCOES_OPTIONS, ENCAMINHAMENTOS_OPTIONS } from "@/hooks/prontuario/psicologia/useSessoesPsicologiaData";
import { EvolucaoEmocionalChart } from "./EvolucaoEmocionalChart";
import { EscalaPHQ9 } from "./EscalaPHQ9";
import { EscalaGAD7 } from "./EscalaGAD7";
import { PlanoAcaoCriseModal, PlanoAcaoCriseBadge } from "./PlanoAcaoCriseModal";
import { useClinicData } from "@/hooks/useClinicData";

interface SessoesPsicologiaBlockProps {
  sessoes: SessaoPsicologia[];
  loading?: boolean;
  saving?: boolean;
  canEdit?: boolean;
  currentProfessionalId?: string;
  currentProfessionalName?: string;
  onSave: (data: SessaoFormData & { assinar: boolean }) => Promise<string | null>;
  onSign?: (sessaoId: string) => Promise<void>;
}

const statusConfig: Record<StatusSessao, { label: string; color: string }> = {
  rascunho: { label: 'Rascunho', color: 'bg-yellow-100 text-yellow-700 border-yellow-300' },
  assinada: { label: 'Assinada', color: 'bg-green-100 text-green-700 border-green-300' },
};

const EMOCOES_OPTIONS = [
  'Ansiedade', 'Tristeza', 'Raiva', 'Culpa', 'Medo', 'Alegria', 'Frustração', 'Apatia',
];

const EMPTY_FORM: SessaoFormData = {
  data_sessao: new Date().toISOString(),
  duracao_minutos: 50,
  modalidade: 'presencial',
  tema_central: '',
  abordagem_terapeutica: '',
  relato_paciente: '',
  intervencoes_realizadas: '',
  intervencoes_tags: [],
  observacoes_terapeuta: '',
  encaminhamentos_tarefas: '',
  encaminhamentos_tags: [],
  risco_interno: '',
  risco_atual: 'ausente',
  humor_paciente: null,
  emocoes_predominantes: [],
  evolucao_caso: '',
  adesao_terapeutica: '',
  phq9_respostas: null,
  phq9_total: null,
  gad7_respostas: null,
  gad7_total: null,
  tarefa_casa: '',
  proximo_foco: '',
};

function RiscoBadge({ risco }: { risco: string }) {
  if (!risco || risco === 'ausente') return null;
  if (risco === 'baixo') return <Badge variant="outline" className="text-xs border-blue-300 text-blue-700 bg-blue-50">Risco Baixo</Badge>;
  if (risco === 'moderado') return <Badge className="text-xs bg-yellow-500 hover:bg-yellow-600 text-white"><AlertTriangle className="h-3 w-3 mr-1" />Risco Moderado</Badge>;
  if (risco === 'alto') return <Badge variant="destructive" className="text-xs animate-pulse"><ShieldAlert className="h-3 w-3 mr-1" />Risco Alto</Badge>;
  return null;
}

export function SessoesPsicologiaBlock({
  sessoes, loading = false, saving = false, canEdit = false,
  currentProfessionalId, currentProfessionalName, onSave, onSign,
}: SessoesPsicologiaBlockProps) {
  const { clinic } = useClinicData();
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedSessao, setSelectedSessao] = useState<SessaoPsicologia | null>(null);
  const [formData, setFormData] = useState<SessaoFormData>(EMPTY_FORM);
  const [customIntervencao, setCustomIntervencao] = useState('');
  const [customEncaminhamento, setCustomEncaminhamento] = useState('');

  // Crisis action plan modal state
  const [criseModalOpen, setCriseModalOpen] = useState(false);
  const [criseSessionId, setCriseSessionId] = useState<string>('');
  const [criseStatus, setCriseStatus] = useState<'crise' | 'regressao'>('crise');

  const nextSessionNumber = sessoes.length > 0 
    ? Math.max(...sessoes.map(s => s.numero_sessao || 0)) + 1 : 1;

  // Detect if new session would trigger crisis/regression
  const detectCrisisAfterSave = (savedFormData: SessaoFormData): 'crise' | 'regressao' | 'normal' => {
    const EVOLUCAO_MAP: Record<string, number> = { melhorando: 1, estavel: 0, 'estável': 0, piorando: -1 };

    // Build list: existing sessions + new one
    const sorted = [...sessoes]
      .sort((a, b) => new Date(a.data_sessao).getTime() - new Date(b.data_sessao).getTime());

    // Add the newly saved session as virtual entry
    const allSessions = [
      ...sorted.map(s => ({ evolucao: s.evolucao_caso?.toLowerCase().trim() || '', risco: s.risco_atual?.toLowerCase().trim() || '' })),
      { evolucao: savedFormData.evolucao_caso?.toLowerCase().trim() || '', risco: savedFormData.risco_atual?.toLowerCase().trim() || '' },
    ];

    const last2 = allSessions.slice(-2);
    const last3 = allSessions.slice(-3);

    // CRISIS: 3 consecutive piorando
    if (last3.length >= 3 && last3.every(s => s.evolucao === 'piorando')) return 'crise';
    // CRISIS: risco alto in last 2
    if (last2.some(s => s.risco === 'alto')) return 'crise';

    // REGRESSION: 2 consecutive piorando
    if (last2.length >= 2 && last2.every(s => s.evolucao === 'piorando')) return 'regressao';
    // REGRESSION: sum of last 3 <= -2
    if (last3.length >= 2) {
      const sum = last3.reduce((acc, s) => acc + (EVOLUCAO_MAP[s.evolucao] ?? 0), 0);
      if (sum <= -2) return 'regressao';
    }

    return 'normal';
  };

  const handleOpenForm = () => {
    setFormData({ ...EMPTY_FORM, data_sessao: new Date().toISOString() });
    setIsFormOpen(true);
  };

  const handleCloseForm = () => {
    setIsFormOpen(false);
    setFormData(EMPTY_FORM);
    setCustomIntervencao('');
    setCustomEncaminhamento('');
  };

  const handleSaveWithCrisisCheck = async (assinar: boolean) => {
    const currentFormData = { ...formData };
    const sessionId = await onSave({ ...currentFormData, assinar });
    if (!sessionId) return;

    handleCloseForm();

    // Check crisis/regression after save
    const status = detectCrisisAfterSave(currentFormData);
    if (status === 'crise' || status === 'regressao') {
      setCriseSessionId(sessionId);
      setCriseStatus(status);
      setCriseModalOpen(true);
    }
  };

  const handleSaveDraft = async () => {
    await handleSaveWithCrisisCheck(false);
  };

  const handleSaveAndSign = async () => {
    await handleSaveWithCrisisCheck(true);
  };

  const toggleTag = (field: 'intervencoes_tags' | 'encaminhamentos_tags' | 'emocoes_predominantes', tag: string) => {
    setFormData(prev => {
      const current = prev[field];
      return { ...prev, [field]: current.includes(tag) ? current.filter(t => t !== tag) : [...current, tag] };
    });
  };

  const addCustomTag = (field: 'intervencoes_tags' | 'encaminhamentos_tags', value: string, resetFn: (v: string) => void) => {
    if (!value.trim()) return;
    setFormData(prev => ({ ...prev, [field]: [...prev[field], value.trim()] }));
    resetFn('');
  };

  if (loading) {
    return <div className="space-y-4"><Skeleton className="h-8 w-48" /><Skeleton className="h-32 w-full" /><Skeleton className="h-32 w-full" /></div>;
  }

  // Check for high-risk sessions (latest)
  const latestRisco = sessoes.length > 0 ? sessoes[0]?.risco_atual : null;

  return (
    <div className="space-y-4">
      {/* Risk Banner */}
      {latestRisco && (latestRisco === 'moderado' || latestRisco === 'alto') && (
        <Card className={`border ${latestRisco === 'alto' ? 'border-red-300 bg-red-50 dark:bg-red-950/20' : 'border-yellow-300 bg-yellow-50 dark:bg-yellow-950/20'}`}>
          <CardContent className="p-3 flex items-center gap-3">
            {latestRisco === 'alto' ? (
              <ShieldAlert className="h-5 w-5 text-red-600 dark:text-red-400 animate-pulse" />
            ) : (
              <AlertTriangle className="h-5 w-5 text-yellow-600 dark:text-yellow-400" />
            )}
            <div className="flex-1">
              <p className={`text-sm font-medium ${latestRisco === 'alto' ? 'text-red-700 dark:text-red-400' : 'text-yellow-700 dark:text-yellow-400'}`}>
                {latestRisco === 'alto' ? 'Risco Alto registrado na última sessão' : 'Risco Moderado registrado na última sessão'}
              </p>
              <p className="text-xs text-muted-foreground">Este alerta é interno e não será exportado em relatórios.</p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h2 className="text-lg font-semibold">Evoluções — Sessões de Terapia</h2>
          <Badge variant="secondary">{sessoes.length} sessões</Badge>
        </div>
        {canEdit && (
          <Button onClick={handleOpenForm}>
            <Plus className="h-4 w-4 mr-2" /> Nova Sessão (#{nextSessionNumber})
          </Button>
        )}
      </div>

      {/* Evolution Chart */}
      <EvolucaoEmocionalChart sessoes={sessoes} />

      {/* Sessions List */}
      {sessoes.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="p-8 text-center">
            <Brain className="h-12 w-12 mx-auto mb-3 text-muted-foreground opacity-50" />
            <h3 className="font-semibold mb-2">Nenhuma sessão registrada</h3>
            <p className="text-sm text-muted-foreground mb-4">Registre a primeira sessão de terapia deste paciente.</p>
            {canEdit && <Button onClick={handleOpenForm}><Plus className="h-4 w-4 mr-2" /> Nova Sessão</Button>}
          </CardContent>
        </Card>
      ) : (
        <div className="relative">
          <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-border" />
          {sessoes.map((sessao) => (
            <div key={sessao.id} className="relative pl-10 pb-4 last:pb-0">
              <div className={`absolute left-2.5 top-3 w-3 h-3 rounded-full border-2 ${
                sessao.status === 'assinada' ? 'bg-green-500 border-green-300' : 'bg-yellow-500 border-yellow-300'
              }`} />
              <Card className="hover:shadow-md transition-shadow cursor-pointer" onClick={() => setSelectedSessao(sessao)}>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-2">
                        {sessao.numero_sessao && (
                          <Badge variant="outline" className="flex items-center gap-1 font-mono">
                            <Hash className="h-3 w-3" /> Sessão {sessao.numero_sessao}
                          </Badge>
                        )}
                        <Badge variant="outline" className="flex items-center gap-1">
                          {sessao.modalidade === 'online' ? <Video className="h-3 w-3" /> : <MapPin className="h-3 w-3" />}
                          {sessao.modalidade === 'online' ? 'Online' : 'Presencial'}
                        </Badge>
                        <Badge variant="outline" className="flex items-center gap-1">
                          <Timer className="h-3 w-3" /> {sessao.duracao_minutos} min
                        </Badge>
                        <Badge className={statusConfig[sessao.status].color}>
                          {sessao.status === 'assinada' && <CheckCircle className="h-3 w-3 mr-1" />}
                          {statusConfig[sessao.status].label}
                        </Badge>
                        {sessao.humor_paciente && (
                          <Badge variant="secondary" className="text-xs">
                            <SmilePlus className="h-3 w-3 mr-1" /> Humor: {sessao.humor_paciente}/10
                          </Badge>
                        )}
                        <RiscoBadge risco={sessao.risco_atual} />
                        {sessao.risco_interno && !sessao.risco_atual?.match(/moderado|alto/) && (
                          <Badge variant="destructive" className="text-xs animate-pulse">
                            <ShieldAlert className="h-3 w-3 mr-1" /> Risco
                          </Badge>
                        )}
                        {clinic?.id && <PlanoAcaoCriseBadge sessaoId={sessao.id} clinicId={clinic.id} />}
                      </div>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground mb-2">
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3.5 w-3.5" />
                          {format(parseISO(sessao.data_sessao), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                        </span>
                        <span className="flex items-center gap-1"><User className="h-3.5 w-3.5" /> {sessao.profissional_nome}</span>
                      </div>
                      {sessao.tema_central && <p className="text-sm font-medium text-primary mb-1">{sessao.tema_central}</p>}
                      {sessao.relato_paciente && <p className="text-sm text-muted-foreground line-clamp-2">{sessao.relato_paciente}</p>}
                      {sessao.intervencoes_tags?.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-2">
                          {sessao.intervencoes_tags.map(tag => <Badge key={tag} variant="secondary" className="text-[10px]">{tag}</Badge>)}
                        </div>
                      )}
                    </div>
                    <ChevronRight className="h-5 w-5 text-muted-foreground flex-shrink-0" />
                  </div>
                </CardContent>
              </Card>
            </div>
          ))}
        </div>
      )}

      {/* ===== NEW SESSION DIALOG ===== */}
      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] flex flex-col overflow-hidden">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Brain className="h-5 w-5 text-primary" /> Nova Evolução — Sessão #{nextSessionNumber}
            </DialogTitle>
            <DialogDescription>Preencha parcial ou completamente. Salve como rascunho a qualquer momento.</DialogDescription>
          </DialogHeader>

          {currentProfessionalName && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground bg-muted/50 p-3 rounded-lg">
              <User className="h-4 w-4" /><span>Terapeuta: <strong>{currentProfessionalName}</strong></span>
            </div>
          )}

          <ScrollArea className="flex-1 min-h-0 pr-4">
            <div className="space-y-6">
              {/* 1. Identificação */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="space-y-2">
                  <Label className="flex items-center gap-2"><Calendar className="h-4 w-4 text-primary" /> Data</Label>
                  <Input type="datetime-local" value={formData.data_sessao.slice(0, 16)}
                    onChange={(e) => setFormData(prev => ({ ...prev, data_sessao: new Date(e.target.value).toISOString() }))} />
                </div>
                <div className="space-y-2">
                  <Label className="flex items-center gap-2"><Timer className="h-4 w-4 text-primary" /> Duração (min)</Label>
                  <Input type="number" min={15} max={180} value={formData.duracao_minutos}
                    onChange={(e) => setFormData(prev => ({ ...prev, duracao_minutos: parseInt(e.target.value) || 50 }))} />
                </div>
                <div className="space-y-2">
                  <Label>Modalidade</Label>
                  <Select value={formData.modalidade} onValueChange={(v) => setFormData(prev => ({ ...prev, modalidade: v }))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="presencial"><span className="flex items-center gap-2"><MapPin className="h-3 w-3" /> Presencial</span></SelectItem>
                      <SelectItem value="online"><span className="flex items-center gap-2"><Video className="h-3 w-3" /> Online</span></SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label className="flex items-center gap-2"><SmilePlus className="h-4 w-4 text-yellow-500" /> Humor (1-10)</Label>
                  <div className="flex items-center gap-2">
                    <Slider min={1} max={10} step={1} value={formData.humor_paciente ? [formData.humor_paciente] : [5]}
                      onValueChange={([v]) => setFormData(prev => ({ ...prev, humor_paciente: v }))} className="flex-1" />
                    <Badge variant="outline" className="min-w-[32px] text-center">{formData.humor_paciente || '—'}</Badge>
                  </div>
                </div>
              </div>

              <Separator />

              {/* 2. Tema Central */}
              <div className="space-y-2">
                <Label className="flex items-center gap-2"><MessageSquare className="h-4 w-4 text-blue-500" /> Tema Central da Sessão *</Label>
                <Input placeholder="Ex: Ansiedade social, Luto, Conflito familiar..." value={formData.tema_central}
                  onChange={(e) => setFormData(prev => ({ ...prev, tema_central: e.target.value }))} />
                <Textarea placeholder="Resumo da sessão (opcional)..." value={formData.abordagem_terapeutica}
                  onChange={(e) => setFormData(prev => ({ ...prev, abordagem_terapeutica: e.target.value }))} rows={2} className="resize-none" />
              </div>

              {/* 3. Relato do Paciente */}
              <div className="space-y-3">
                <Label className="flex items-center gap-2"><MessageSquare className="h-4 w-4 text-blue-500" /> Relato do Paciente</Label>
                <Textarea placeholder="Principais falas / acontecimentos..." value={formData.relato_paciente}
                  onChange={(e) => setFormData(prev => ({ ...prev, relato_paciente: e.target.value }))} rows={4} className="resize-none" />
                
                <Label className="text-sm">Emoções Predominantes</Label>
                <div className="flex flex-wrap gap-2">
                  {EMOCOES_OPTIONS.map(e => (
                    <Badge key={e} variant={formData.emocoes_predominantes.includes(e) ? "default" : "outline"}
                      className="cursor-pointer transition-colors hover:opacity-80"
                      onClick={() => toggleTag('emocoes_predominantes', e)}>{e}</Badge>
                  ))}
                </div>
              </div>

              <Separator />

              {/* 4. Intervenções */}
              <div className="space-y-3">
                <Label className="flex items-center gap-2"><Lightbulb className="h-4 w-4 text-yellow-500" /> Intervenções Realizadas</Label>
                <div className="flex flex-wrap gap-2">
                  {INTERVENCOES_OPTIONS.map(opt => (
                    <Badge key={opt} variant={formData.intervencoes_tags.includes(opt) ? "default" : "outline"}
                      className="cursor-pointer transition-colors hover:opacity-80"
                      onClick={() => toggleTag('intervencoes_tags', opt)}>{opt}</Badge>
                  ))}
                </div>
                <div className="flex gap-2">
                  <Input placeholder="Outra intervenção..." value={customIntervencao}
                    onChange={(e) => setCustomIntervencao(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addCustomTag('intervencoes_tags', customIntervencao, setCustomIntervencao))}
                    className="flex-1" />
                  <Button variant="outline" size="sm" onClick={() => addCustomTag('intervencoes_tags', customIntervencao, setCustomIntervencao)}
                    disabled={!customIntervencao.trim()}><Plus className="h-4 w-4" /></Button>
                </div>
                {formData.intervencoes_tags.filter(t => !INTERVENCOES_OPTIONS.includes(t as any)).length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {formData.intervencoes_tags.filter(t => !INTERVENCOES_OPTIONS.includes(t as any)).map(tag => (
                      <Badge key={tag} variant="default" className="cursor-pointer" onClick={() => toggleTag('intervencoes_tags', tag)}>{tag} ×</Badge>
                    ))}
                  </div>
                )}
                <Textarea placeholder="Observações técnicas (opcional)..." value={formData.intervencoes_realizadas}
                  onChange={(e) => setFormData(prev => ({ ...prev, intervencoes_realizadas: e.target.value }))} rows={2} className="resize-none" />
              </div>

              {/* Observações Clínicas */}
              <div className="space-y-2">
                <Label className="flex items-center gap-2"><Eye className="h-4 w-4 text-green-500" /> Observações Clínicas</Label>
                <Textarea placeholder="Impressões sobre estado emocional, comportamento, resistências, progressos..."
                  value={formData.observacoes_terapeuta}
                  onChange={(e) => setFormData(prev => ({ ...prev, observacoes_terapeuta: e.target.value }))} rows={3} className="resize-none" />
              </div>

              <Separator />

              {/* 5. Avaliação Clínica */}
              <div className="space-y-4">
                <Label className="flex items-center gap-2 text-base font-semibold"><TrendingUp className="h-4 w-4 text-primary" /> Avaliação Clínica</Label>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label>Evolução do caso</Label>
                    <Select value={formData.evolucao_caso} onValueChange={(v) => setFormData(prev => ({ ...prev, evolucao_caso: v }))}>
                      <SelectTrigger><SelectValue placeholder="Selecionar..." /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="melhorando">Melhorando</SelectItem>
                        <SelectItem value="estavel">Estável</SelectItem>
                        <SelectItem value="piorando">Piorando</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Adesão ao processo</Label>
                    <Select value={formData.adesao_terapeutica} onValueChange={(v) => setFormData(prev => ({ ...prev, adesao_terapeutica: v }))}>
                      <SelectTrigger><SelectValue placeholder="Selecionar..." /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="boa">Boa</SelectItem>
                        <SelectItem value="parcial">Parcial</SelectItem>
                        <SelectItem value="baixa">Baixa</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Risco atual</Label>
                    <Select value={formData.risco_atual} onValueChange={(v) => setFormData(prev => ({ ...prev, risco_atual: v }))}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="ausente">Ausente</SelectItem>
                        <SelectItem value="baixo">Baixo</SelectItem>
                        <SelectItem value="moderado">Moderado</SelectItem>
                        <SelectItem value="alto">Alto</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                {formData.risco_atual === 'alto' && (
                  <div className="p-3 rounded-lg border border-red-300 bg-red-50 dark:bg-red-950/20 text-sm text-red-700 dark:text-red-400 flex items-center gap-2">
                    <ShieldAlert className="h-4 w-4" /> Um alerta interno será gerado no prontuário ao salvar.
                  </div>
                )}
              </div>

              <Separator />

              {/* 6. Encaminhamentos */}
              <div className="space-y-3">
                <Label className="flex items-center gap-2"><ClipboardCheck className="h-4 w-4 text-orange-500" /> Encaminhamentos / Tarefas</Label>
                <div className="flex flex-wrap gap-2">
                  {ENCAMINHAMENTOS_OPTIONS.map(opt => (
                    <Badge key={opt} variant={formData.encaminhamentos_tags.includes(opt) ? "default" : "outline"}
                      className="cursor-pointer transition-colors hover:opacity-80"
                      onClick={() => toggleTag('encaminhamentos_tags', opt)}>{opt}</Badge>
                  ))}
                </div>
                <div className="flex gap-2">
                  <Input placeholder="Outro encaminhamento..." value={customEncaminhamento}
                    onChange={(e) => setCustomEncaminhamento(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addCustomTag('encaminhamentos_tags', customEncaminhamento, setCustomEncaminhamento))}
                    className="flex-1" />
                  <Button variant="outline" size="sm" onClick={() => addCustomTag('encaminhamentos_tags', customEncaminhamento, setCustomEncaminhamento)}
                    disabled={!customEncaminhamento.trim()}><Plus className="h-4 w-4" /></Button>
                </div>
                <Textarea placeholder="Tarefa para casa (opcional)..." value={formData.tarefa_casa}
                  onChange={(e) => setFormData(prev => ({ ...prev, tarefa_casa: e.target.value }))} rows={2} className="resize-none" />
                <Input placeholder="Próximo foco terapêutico..." value={formData.proximo_foco}
                  onChange={(e) => setFormData(prev => ({ ...prev, proximo_foco: e.target.value }))} />
              </div>

              <Separator />

              {/* Escalas Opcionais */}
              <div className="space-y-3">
                <Label className="text-base font-semibold">Escalas Clínicas (Opcionais)</Label>
                <EscalaPHQ9 respostas={formData.phq9_respostas}
                  onChange={(r, t) => setFormData(prev => ({ ...prev, phq9_respostas: r, phq9_total: t }))} />
                <EscalaGAD7 respostas={formData.gad7_respostas}
                  onChange={(r, t) => setFormData(prev => ({ ...prev, gad7_respostas: r, gad7_total: t }))} />
              </div>

              <Separator />

              {/* Campo Interno de Risco */}
              <div className="space-y-2 border border-red-200 dark:border-red-800 rounded-lg p-4 bg-red-50/50 dark:bg-red-950/20">
                <Label className="flex items-center gap-2 text-red-700 dark:text-red-400">
                  <ShieldAlert className="h-4 w-4" /> Campo Interno de Risco (opcional, confidencial)
                </Label>
                <p className="text-xs text-red-600/70 dark:text-red-400/70">
                  Registre sinais de ideação suicida, autolesão ou risco iminente. Este campo não é exportado em relatórios.
                </p>
                <Textarea placeholder="Observações sobre risco (uso interno)..." value={formData.risco_interno}
                  onChange={(e) => setFormData(prev => ({ ...prev, risco_interno: e.target.value }))} rows={2} className="resize-none border-red-200 dark:border-red-800" />
              </div>
            </div>
          </ScrollArea>

          <Separator />

          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={handleCloseForm} disabled={saving}><X className="h-4 w-4 mr-1" /> Cancelar</Button>
            <Button variant="secondary" onClick={handleSaveDraft} disabled={saving}>
              <Save className="h-4 w-4 mr-1" /> {saving ? 'Salvando...' : 'Salvar Rascunho'}
            </Button>
            <Button onClick={handleSaveAndSign} disabled={saving}><CheckCircle className="h-4 w-4 mr-1" /> Salvar e Assinar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ===== VIEW SESSION DIALOG ===== */}
      <Dialog open={!!selectedSessao} onOpenChange={() => setSelectedSessao(null)}>
        <DialogContent className="max-w-3xl max-h-[80vh] flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Eye className="h-5 w-5" />
              {selectedSessao?.numero_sessao ? `Sessão #${selectedSessao.numero_sessao}` : 'Detalhes da Sessão'}
            </DialogTitle>
            {selectedSessao && (
              <DialogDescription className="flex items-center gap-4 flex-wrap">
                <span className="flex items-center gap-1"><Calendar className="h-4 w-4" />
                  {format(parseISO(selectedSessao.data_sessao), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}</span>
                <span className="flex items-center gap-1"><Timer className="h-4 w-4" /> {selectedSessao.duracao_minutos} min</span>
                <span className="flex items-center gap-1"><User className="h-4 w-4" /> {selectedSessao.profissional_nome}</span>
                <span className="flex items-center gap-1">
                  {selectedSessao.modalidade === 'online' ? <Video className="h-4 w-4" /> : <MapPin className="h-4 w-4" />}
                  {selectedSessao.modalidade === 'online' ? 'Online' : 'Presencial'}
                </span>
              </DialogDescription>
            )}
          </DialogHeader>

          {selectedSessao && (
            <>
              <div className="flex items-center gap-2 flex-wrap">
                <Badge className={statusConfig[selectedSessao.status].color}>
                  {selectedSessao.status === 'assinada' && <CheckCircle className="h-3 w-3 mr-1" />}
                  {statusConfig[selectedSessao.status].label}
                </Badge>
                {selectedSessao.humor_paciente && <Badge variant="secondary"><SmilePlus className="h-3 w-3 mr-1" /> Humor: {selectedSessao.humor_paciente}/10</Badge>}
                <RiscoBadge risco={selectedSessao.risco_atual} />
                {selectedSessao.evolucao_caso && (
                  <Badge variant="outline" className="text-xs">
                    Evolução: {selectedSessao.evolucao_caso === 'melhorando' ? 'Melhorando' : selectedSessao.evolucao_caso === 'piorando' ? 'Piorando' : 'Estável'}
                  </Badge>
                )}
                {selectedSessao.assinada_em && (
                  <span className="text-xs text-muted-foreground">
                    Assinada em {format(parseISO(selectedSessao.assinada_em), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                  </span>
                )}
              </div>

              <ScrollArea className="flex-1 min-h-0">
                <div className="space-y-4 pr-4">
                  {selectedSessao.tema_central && (
                    <div className="space-y-1">
                      <h4 className="text-sm font-semibold flex items-center gap-2"><MessageSquare className="h-4 w-4 text-blue-500" /> Tema Central</h4>
                      <p className="text-sm font-medium text-primary">{selectedSessao.tema_central}</p>
                    </div>
                  )}
                  {selectedSessao.relato_paciente && (
                    <div className="space-y-1">
                      <h4 className="text-sm font-semibold flex items-center gap-2"><MessageSquare className="h-4 w-4 text-blue-500" /> Relato do Paciente</h4>
                      <p className="text-sm whitespace-pre-wrap">{selectedSessao.relato_paciente}</p>
                    </div>
                  )}
                  {selectedSessao.emocoes_predominantes?.length > 0 && (
                    <div className="space-y-1">
                      <h4 className="text-sm font-semibold">Emoções Predominantes</h4>
                      <div className="flex flex-wrap gap-1">{selectedSessao.emocoes_predominantes.map(e => <Badge key={e} variant="secondary" className="text-xs">{e}</Badge>)}</div>
                    </div>
                  )}
                  {(selectedSessao.intervencoes_tags?.length > 0 || selectedSessao.intervencoes_realizadas) && (
                    <div className="space-y-1">
                      <h4 className="text-sm font-semibold flex items-center gap-2"><Lightbulb className="h-4 w-4 text-yellow-500" /> Intervenções</h4>
                      {selectedSessao.intervencoes_tags?.length > 0 && (
                        <div className="flex flex-wrap gap-1 mb-1">{selectedSessao.intervencoes_tags.map(tag => <Badge key={tag} variant="secondary" className="text-xs">{tag}</Badge>)}</div>
                      )}
                      {selectedSessao.intervencoes_realizadas && <p className="text-sm whitespace-pre-wrap text-muted-foreground">{selectedSessao.intervencoes_realizadas}</p>}
                    </div>
                  )}
                  {selectedSessao.observacoes_terapeuta && (
                    <div className="space-y-1">
                      <h4 className="text-sm font-semibold flex items-center gap-2"><Eye className="h-4 w-4 text-green-500" /> Observações Clínicas</h4>
                      <p className="text-sm whitespace-pre-wrap">{selectedSessao.observacoes_terapeuta}</p>
                    </div>
                  )}

                  {/* Avaliação Clínica */}
                  {(selectedSessao.evolucao_caso || selectedSessao.adesao_terapeutica) && (
                    <div className="space-y-2">
                      <h4 className="text-sm font-semibold flex items-center gap-2"><TrendingUp className="h-4 w-4 text-primary" /> Avaliação Clínica</h4>
                      <div className="grid grid-cols-3 gap-2">
                        {selectedSessao.evolucao_caso && <div className="bg-muted/50 p-2 rounded text-center"><p className="text-[10px] text-muted-foreground">Evolução</p><p className="text-sm font-medium capitalize">{selectedSessao.evolucao_caso}</p></div>}
                        {selectedSessao.adesao_terapeutica && <div className="bg-muted/50 p-2 rounded text-center"><p className="text-[10px] text-muted-foreground">Adesão</p><p className="text-sm font-medium capitalize">{selectedSessao.adesao_terapeutica}</p></div>}
                        <div className="bg-muted/50 p-2 rounded text-center"><p className="text-[10px] text-muted-foreground">Risco</p><p className="text-sm font-medium capitalize">{selectedSessao.risco_atual || 'Ausente'}</p></div>
                      </div>
                    </div>
                  )}

                  {/* Escalas */}
                  {selectedSessao.phq9_total !== null && selectedSessao.phq9_total !== undefined && (
                    <EscalaPHQ9 respostas={selectedSessao.phq9_respostas} onChange={() => {}} readOnly />
                  )}
                  {selectedSessao.gad7_total !== null && selectedSessao.gad7_total !== undefined && (
                    <EscalaGAD7 respostas={selectedSessao.gad7_respostas} onChange={() => {}} readOnly />
                  )}

                  {(selectedSessao.encaminhamentos_tags?.length > 0 || selectedSessao.encaminhamentos_tarefas || selectedSessao.tarefa_casa) && (
                    <div className="space-y-1">
                      <h4 className="text-sm font-semibold flex items-center gap-2"><ClipboardCheck className="h-4 w-4 text-orange-500" /> Encaminhamentos / Tarefas</h4>
                      {selectedSessao.encaminhamentos_tags?.length > 0 && (
                        <div className="flex flex-wrap gap-1 mb-1">{selectedSessao.encaminhamentos_tags.map(tag => <Badge key={tag} variant="outline" className="text-xs">{tag}</Badge>)}</div>
                      )}
                      {selectedSessao.tarefa_casa && <p className="text-sm whitespace-pre-wrap text-muted-foreground">{selectedSessao.tarefa_casa}</p>}
                      {selectedSessao.proximo_foco && <p className="text-xs text-muted-foreground mt-1">Próximo foco: {selectedSessao.proximo_foco}</p>}
                    </div>
                  )}

                  {selectedSessao.risco_interno && (
                    <div className="space-y-1 border border-red-200 dark:border-red-800 rounded-lg p-3 bg-red-50/50 dark:bg-red-950/20">
                      <h4 className="text-sm font-semibold flex items-center gap-2 text-red-700 dark:text-red-400"><ShieldAlert className="h-4 w-4" /> Campo Interno de Risco</h4>
                      <p className="text-sm whitespace-pre-wrap text-red-600 dark:text-red-400">{selectedSessao.risco_interno}</p>
                    </div>
                  )}
                </div>
              </ScrollArea>

              {selectedSessao.status === 'rascunho' && canEdit && onSign && (
                <>
                  <Separator />
                  <DialogFooter>
                    <Button onClick={() => onSign(selectedSessao.id)} disabled={saving}><CheckCircle className="h-4 w-4 mr-1" /> Assinar Sessão</Button>
                  </DialogFooter>
                </>
              )}
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Crisis Action Plan Modal */}
      {clinic?.id && currentProfessionalId && (
        <PlanoAcaoCriseModal
          open={criseModalOpen}
          onOpenChange={setCriseModalOpen}
          patientId={sessoes[0]?.patient_id || ''}
          clinicId={clinic.id}
          sessaoId={criseSessionId}
          profissionalId={currentProfessionalId}
          regressionStatus={criseStatus}
          onSaved={() => {}}
        />
      )}
    </div>
  );
}
