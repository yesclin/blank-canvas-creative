import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from '@/components/ui/dropdown-menu';
import {
  FileText,
  Plus,
  Trash2,
  Eye,
  Printer,
  Pill,
  Calendar,
  User,
  Clock,
  ScrollText,
  Ban,
  Bookmark,
  FolderOpen,
  Shield,
  ClipboardPen,
  FileBarChart,
  Save,
} from 'lucide-react';
import { MedicationAutocomplete, type MedicationResult } from './MedicationAutocomplete';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import type {
  DocumentoClinico,
  ConteudoReceituario,
  ConteudoAtestado,
  ConteudoDeclaracao,
  ConteudoRelatorio,
  ConteudoDocumento,
  MedicamentoItem,
  TipoReceita,
  TipoDocumentoClinico,
  ModeloReceitaProfissional,
  ModeloDocumento,
  SaveDocumentoOptions,
} from '@/hooks/prontuario/clinica-geral/useDocumentosClinicosData';
import { TIPO_DOC_LABELS } from '@/hooks/prontuario/clinica-geral/useDocumentosClinicosData';

// ─── Types ──────────────────────────────────────────
type ViewMode = 'list' | 'receituario' | 'atestado' | 'declaracao' | 'relatorio';

interface DocumentosClinicosBlockProps {
  documentos: DocumentoClinico[];
  loading: boolean;
  saving: boolean;
  canEdit: boolean;
  currentProfessionalName?: string;
  currentProfessionalRegistration?: string;
  currentProfessionalSignatureUrl?: string;
  modelosPessoais: ModeloReceitaProfissional[];
  modelosDocumento: ModeloDocumento[];
  medicamentoSuggestions: string[];
  activeSpecialtyId?: string;
  onSave: (tipo: TipoDocumentoClinico, conteudo: ConteudoDocumento, options?: SaveDocumentoOptions) => Promise<string | null>;
  onCancel: (id: string, motivo: string) => Promise<boolean>;
  onSaveModeloPessoal: (nome: string, conteudo: ConteudoReceituario) => Promise<boolean>;
  onDeleteModeloPessoal: (id: string) => Promise<boolean>;
  patientName?: string;
}

const EMPTY_MED: MedicamentoItem = { nome: '', dosagem: '', frequencia: '', duracao: '' };

const TIPO_RECEITA_LABELS: Record<TipoReceita, string> = {
  simples: 'Simples',
  controlada: 'Controlada',
  especial: 'Especial',
};

const TIPO_RECEITA_COLORS: Record<TipoReceita, string> = {
  simples: 'bg-muted text-muted-foreground',
  controlada: 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300',
  especial: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300',
};

const STATUS_LABELS: Record<string, string> = {
  rascunho: 'Rascunho',
  emitido: 'Emitido',
  cancelado: 'Cancelado',
};

const TIPO_DOC_ICONS: Record<TipoDocumentoClinico, { icon: React.ReactNode; bg: string }> = {
  receituario: { icon: <Pill className="h-4 w-4 text-blue-600 dark:text-blue-400" />, bg: 'bg-blue-100 dark:bg-blue-900/30' },
  atestado: { icon: <FileText className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />, bg: 'bg-emerald-100 dark:bg-emerald-900/30' },
  declaracao: { icon: <ClipboardPen className="h-4 w-4 text-violet-600 dark:text-violet-400" />, bg: 'bg-violet-100 dark:bg-violet-900/30' },
  relatorio: { icon: <FileBarChart className="h-4 w-4 text-orange-600 dark:text-orange-400" />, bg: 'bg-orange-100 dark:bg-orange-900/30' },
};

const TIPO_DOC_ICONS_LG: Record<TipoDocumentoClinico, { icon: React.ReactNode; bg: string }> = {
  receituario: { icon: <Pill className="h-6 w-6 text-blue-600 dark:text-blue-400" />, bg: 'bg-blue-100 dark:bg-blue-900/30' },
  atestado: { icon: <FileText className="h-6 w-6 text-emerald-600 dark:text-emerald-400" />, bg: 'bg-emerald-100 dark:bg-emerald-900/30' },
  declaracao: { icon: <ClipboardPen className="h-6 w-6 text-violet-600 dark:text-violet-400" />, bg: 'bg-violet-100 dark:bg-violet-900/30' },
  relatorio: { icon: <FileBarChart className="h-6 w-6 text-orange-600 dark:text-orange-400" />, bg: 'bg-orange-100 dark:bg-orange-900/30' },
};

export function DocumentosClinicosBlock({
  documentos,
  loading,
  saving,
  canEdit,
  currentProfessionalName,
  currentProfessionalRegistration,
  currentProfessionalSignatureUrl,
  modelosPessoais,
  modelosDocumento,
  medicamentoSuggestions,
  activeSpecialtyId,
  onSave,
  onCancel,
  onSaveModeloPessoal,
  onDeleteModeloPessoal,
  patientName,
}: DocumentosClinicosBlockProps) {
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [viewingDoc, setViewingDoc] = useState<DocumentoClinico | null>(null);
  const [cancelDocId, setCancelDocId] = useState<string | null>(null);
  const [cancelMotivo, setCancelMotivo] = useState('');
  const [saveModeloOpen, setSaveModeloOpen] = useState(false);
  const [modeloNome, setModeloNome] = useState('');

  // ── Receituário Form ──
  const [medicamentos, setMedicamentos] = useState<MedicamentoItem[]>([{ ...EMPTY_MED }]);
  const [obsGerais, setObsGerais] = useState('');
  const [tipoReceita, setTipoReceita] = useState<TipoReceita>('simples');
  const [numeroTalonario, setNumeroTalonario] = useState('');
  const [selectedModeloId, setSelectedModeloId] = useState<string | null>(null);

  // ── Atestado Form ──
  const [tipoAfastamento, setTipoAfastamento] = useState<'dias' | 'periodo'>('dias');
  const [diasAfastamento, setDiasAfastamento] = useState('');
  const [dataInicio, setDataInicio] = useState('');
  const [dataFim, setDataFim] = useState('');
  const [cid, setCid] = useState('');
  const [obsAtestado, setObsAtestado] = useState('');

  // ── Declaração Form ──
  const [textoDeclaracao, setTextoDeclaracao] = useState('');

  // ── Relatório Form ──
  const [relTitulo, setRelTitulo] = useState('');
  const [relObjetivo, setRelObjetivo] = useState('');
  const [relHistorico, setRelHistorico] = useState('');
  const [relDescricao, setRelDescricao] = useState('');
  const [relConclusao, setRelConclusao] = useState('');
  const [relRecomendacoes, setRelRecomendacoes] = useState('');

  // (autocomplete now handled by MedicationAutocomplete component)

  // Filter modelos for active specialty
  const receituarioModelos = useMemo(() =>
    modelosDocumento.filter(m => m.tipo === 'receituario' && (!m.specialty_id || m.specialty_id === activeSpecialtyId)),
    [modelosDocumento, activeSpecialtyId]
  );

  const resetReceituario = () => {
    setMedicamentos([{ ...EMPTY_MED }]);
    setObsGerais('');
    setTipoReceita('simples');
    setNumeroTalonario('');
    setSelectedModeloId(null);
  };

  const resetAtestado = () => {
    setTipoAfastamento('dias');
    setDiasAfastamento('');
    setDataInicio('');
    setDataFim('');
    setCid('');
    setObsAtestado('');
  };

  const resetDeclaracao = () => setTextoDeclaracao('');

  const resetRelatorio = () => {
    setRelTitulo('');
    setRelObjetivo('');
    setRelHistorico('');
    setRelDescricao('');
    setRelConclusao('');
    setRelRecomendacoes('');
  };

  const addMedicamento = () => setMedicamentos(prev => [...prev, { ...EMPTY_MED }]);
  const removeMedicamento = (idx: number) => {
    if (medicamentos.length <= 1) return;
    setMedicamentos(prev => prev.filter((_, i) => i !== idx));
  };
  const updateMedicamento = (idx: number, field: keyof MedicamentoItem, value: string) => {
    setMedicamentos(prev => prev.map((m, i) => i === idx ? { ...m, [field]: value } : m));
  };

  const loadModeloPessoal = (modelo: ModeloReceitaProfissional) => {
    const c = typeof modelo.conteudo_json === 'string' ? JSON.parse(modelo.conteudo_json) : modelo.conteudo_json;
    if (c?.medicamentos) {
      setMedicamentos(c.medicamentos);
      setObsGerais(c.observacoes_gerais || '');
    }
  };

  const handleSaveReceituario = async () => {
    const validMeds = medicamentos.filter(m => m.nome.trim());
    if (validMeds.length === 0) return;
    const conteudo: ConteudoReceituario = { medicamentos: validMeds, observacoes_gerais: obsGerais || undefined };
    const options: SaveDocumentoOptions = {
      tipo_receita: tipoReceita,
      numero_talonario: tipoReceita !== 'simples' ? numeroTalonario : undefined,
      modelo_id: selectedModeloId || undefined,
    };
    const id = await onSave('receituario', conteudo, options);
    if (id) { resetReceituario(); setViewMode('list'); }
  };

  const handleSaveAtestado = async () => {
    const conteudo: ConteudoAtestado = {
      tipo_afastamento: tipoAfastamento,
      ...(tipoAfastamento === 'dias' ? { dias: parseInt(diasAfastamento) || 1 } : { data_inicio: dataInicio, data_fim: dataFim }),
      cid: cid || undefined,
      observacao: obsAtestado || undefined,
    };
    const id = await onSave('atestado', conteudo);
    if (id) { resetAtestado(); setViewMode('list'); }
  };

  const handleSaveDeclaracao = async (asDraft = false) => {
    if (!textoDeclaracao.trim()) return;
    const conteudo: ConteudoDeclaracao = { texto: textoDeclaracao };
    const id = await onSave('declaracao', conteudo, asDraft ? { status: 'rascunho' } : undefined);
    if (id) { resetDeclaracao(); setViewMode('list'); }
  };

  const handleSaveRelatorio = async (asDraft = false) => {
    if (!relTitulo.trim() || !relDescricao.trim()) return;
    const conteudo: ConteudoRelatorio = {
      titulo_relatorio: relTitulo,
      objetivo: relObjetivo || undefined,
      historico_clinico: relHistorico || undefined,
      descricao_detalhada: relDescricao,
      conclusao: relConclusao || undefined,
      recomendacoes: relRecomendacoes || undefined,
    };
    const id = await onSave('relatorio', conteudo, asDraft ? { status: 'rascunho' } : undefined);
    if (id) { resetRelatorio(); setViewMode('list'); }
  };

  const handleCancel = async () => {
    if (!cancelDocId || !cancelMotivo.trim()) return;
    await onCancel(cancelDocId, cancelMotivo);
    setCancelDocId(null);
    setCancelMotivo('');
  };

  const handleSaveModelo = async () => {
    if (!modeloNome.trim()) return;
    const validMeds = medicamentos.filter(m => m.nome.trim());
    if (validMeds.length === 0) return;
    await onSaveModeloPessoal(modeloNome, { medicamentos: validMeds, observacoes_gerais: obsGerais || undefined });
    setSaveModeloOpen(false);
    setModeloNome('');
  };


  // ── Header component ──
  const ProfessionalHeader = () => (
    <Card>
      <CardContent className="p-4 text-sm space-y-1 bg-muted/30">
        <p><span className="font-medium">Paciente:</span> {patientName || '—'}</p>
        <p><span className="font-medium">Profissional:</span> {currentProfessionalName || '—'}</p>
        {currentProfessionalRegistration && <p><span className="font-medium">Registro:</span> {currentProfessionalRegistration}</p>}
        <p><span className="font-medium">Data:</span> {format(new Date(), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}</p>
      </CardContent>
    </Card>
  );

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-32 w-full" />
      </div>
    );
  }

  // ─── LIST VIEW ──────────────────────────────────
  if (viewMode === 'list') {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <ScrollText className="h-5 w-5 text-primary" />
            Documentos Clínicos
          </h2>
          <Badge variant="secondary">{documentos.length} documento{documentos.length !== 1 ? 's' : ''}</Badge>
        </div>

        {canEdit && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {([
              { tipo: 'receituario' as const, desc: 'Prescrever medicamentos' },
              { tipo: 'atestado' as const, desc: 'Emitir atestado médico' },
              { tipo: 'declaracao' as const, desc: 'Emitir declaração formal' },
              { tipo: 'relatorio' as const, desc: 'Relatório técnico clínico' },
            ]).map(item => (
              <Card key={item.tipo} className="cursor-pointer hover:border-primary/50 hover:shadow-sm transition-all" onClick={() => setViewMode(item.tipo)}>
                <CardContent className="p-4 flex items-center gap-3">
                  <div className={`h-11 w-11 rounded-lg flex items-center justify-center flex-shrink-0 ${TIPO_DOC_ICONS_LG[item.tipo].bg}`}>
                    {TIPO_DOC_ICONS_LG[item.tipo].icon}
                  </div>
                  <div className="min-w-0">
                    <h3 className="font-semibold text-sm">Novo {TIPO_DOC_LABELS[item.tipo]}</h3>
                    <p className="text-xs text-muted-foreground truncate">{item.desc}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* History */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Histórico de Documentos Emitidos</CardTitle>
          </CardHeader>
          <CardContent>
            {documentos.length === 0 ? (
              <div className="py-8 text-center">
                <ScrollText className="h-12 w-12 mx-auto mb-3 text-muted-foreground opacity-50" />
                <p className="text-muted-foreground">Nenhum documento clínico emitido.</p>
              </div>
            ) : (
              <ScrollArea className="max-h-[500px]">
                <div className="space-y-3">
                  {documentos.map(doc => {
                    const tipoInfo = TIPO_DOC_ICONS[doc.tipo];
                    return (
                      <div key={doc.id} className="flex items-center justify-between border rounded-lg p-3 gap-3">
                        <div className="flex items-center gap-3 min-w-0 flex-1">
                          <div className={`h-9 w-9 rounded-lg flex items-center justify-center flex-shrink-0 ${tipoInfo.bg}`}>
                            {tipoInfo.icon}
                          </div>
                          <div className="min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="font-medium text-sm">{TIPO_DOC_LABELS[doc.tipo]}</span>
                              <Badge
                                variant={doc.status === 'emitido' ? 'default' : doc.status === 'rascunho' ? 'secondary' : 'destructive'}
                                className="text-[10px]"
                              >
                                {STATUS_LABELS[doc.status] || doc.status}
                              </Badge>
                              {doc.tipo === 'receituario' && doc.tipo_receita && doc.tipo_receita !== 'simples' && (
                                <Badge className={`text-[10px] ${TIPO_RECEITA_COLORS[doc.tipo_receita]}`}>
                                  <Shield className="h-2.5 w-2.5 mr-0.5" />
                                  {TIPO_RECEITA_LABELS[doc.tipo_receita]}
                                </Badge>
                              )}
                            </div>
                            <div className="flex items-center gap-3 text-xs text-muted-foreground mt-0.5">
                              <span className="flex items-center gap-1">
                                <Calendar className="h-3 w-3" />
                                {format(parseISO(doc.created_at), "dd/MM/yyyy", { locale: ptBR })}
                              </span>
                              <span className="flex items-center gap-1">
                                <Clock className="h-3 w-3" />
                                {format(parseISO(doc.created_at), "HH:mm")}
                              </span>
                              {doc.profissional_nome && (
                                <span className="flex items-center gap-1">
                                  <User className="h-3 w-3" />
                                  {doc.profissional_nome}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-1 flex-shrink-0">
                          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setViewingDoc(doc)}>
                            <Eye className="h-4 w-4" />
                          </Button>
                          {doc.status === 'emitido' && canEdit && (
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive" onClick={() => setCancelDocId(doc.id)}>
                              <Ban className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </ScrollArea>
            )}
          </CardContent>
        </Card>

        {/* View Dialog */}
        <Dialog open={!!viewingDoc} onOpenChange={() => setViewingDoc(null)}>
          <DialogContent className="max-w-lg max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                {viewingDoc && TIPO_DOC_ICONS[viewingDoc.tipo].icon}
                {viewingDoc && TIPO_DOC_LABELS[viewingDoc.tipo]}
                <Badge variant={viewingDoc?.status === 'emitido' ? 'default' : viewingDoc?.status === 'rascunho' ? 'secondary' : 'destructive'} className="ml-2">
                  {STATUS_LABELS[viewingDoc?.status || ''] || viewingDoc?.status}
                </Badge>
              </DialogTitle>
            </DialogHeader>
            {viewingDoc && (
              <div className="space-y-4">
                <div className="text-sm space-y-1">
                  <p><span className="font-medium">Paciente:</span> {patientName || '—'}</p>
                  <p><span className="font-medium">Profissional:</span> {viewingDoc.profissional_nome || '—'}</p>
                  {viewingDoc.profissional_registro && (
                    <p><span className="font-medium">Registro:</span> {viewingDoc.profissional_registro}</p>
                  )}
                  <p><span className="font-medium">Data:</span> {format(parseISO(viewingDoc.created_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}</p>
                  {viewingDoc.tipo_receita && viewingDoc.tipo_receita !== 'simples' && (
                    <p><span className="font-medium">Tipo:</span> Receita {TIPO_RECEITA_LABELS[viewingDoc.tipo_receita]}</p>
                  )}
                  {viewingDoc.numero_talonario && (
                    <p><span className="font-medium">Talonário:</span> {viewingDoc.numero_talonario}</p>
                  )}
                </div>
                <Separator />
                {viewingDoc.tipo === 'receituario' && <ReceituarioView conteudo={viewingDoc.conteudo_json as ConteudoReceituario} />}
                {viewingDoc.tipo === 'atestado' && <AtestadoView conteudo={viewingDoc.conteudo_json as ConteudoAtestado} />}
                {viewingDoc.tipo === 'declaracao' && <DeclaracaoView conteudo={viewingDoc.conteudo_json as ConteudoDeclaracao} />}
                {viewingDoc.tipo === 'relatorio' && <RelatorioView conteudo={viewingDoc.conteudo_json as ConteudoRelatorio} />}
                {/* Signature */}
                {viewingDoc.profissional_nome && (
                  <div className="pt-4 border-t text-center text-sm">
                    {(viewingDoc as any).assinatura_url && (
                      <img src={(viewingDoc as any).assinatura_url} alt="Assinatura" className="h-12 mx-auto mb-1 opacity-80" />
                    )}
                    <p className="font-medium">{viewingDoc.profissional_nome}</p>
                    {viewingDoc.profissional_registro && <p className="text-xs text-muted-foreground">{viewingDoc.profissional_registro}</p>}
                  </div>
                )}
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* Cancel Dialog */}
        <AlertDialog open={!!cancelDocId} onOpenChange={() => { setCancelDocId(null); setCancelMotivo(''); }}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Cancelar Documento</AlertDialogTitle>
              <AlertDialogDescription>
                Esta ação não pode ser desfeita. O documento será cancelado logicamente e um registro será criado no log jurídico.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <Textarea placeholder="Motivo do cancelamento (obrigatório)..." value={cancelMotivo} onChange={e => setCancelMotivo(e.target.value)} />
            <AlertDialogFooter>
              <AlertDialogCancel>Voltar</AlertDialogCancel>
              <AlertDialogAction onClick={handleCancel} disabled={!cancelMotivo.trim() || saving} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                Confirmar Cancelamento
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    );
  }

  // ─── RECEITUÁRIO FORM ──────────────────────────
  if (viewMode === 'receituario') {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <Pill className="h-5 w-5 text-blue-600" />
            Novo Receituário
          </h2>
          <Button variant="outline" size="sm" onClick={() => { resetReceituario(); setViewMode('list'); }}>Voltar</Button>
        </div>

        <ProfessionalHeader />

        {/* Tipo de Receita + Modelos */}
        <Card>
          <CardContent className="pt-5 space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <Label className="text-xs font-medium">Tipo de Receita</Label>
                <Select value={tipoReceita} onValueChange={v => setTipoReceita(v as TipoReceita)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="simples">Simples</SelectItem>
                    <SelectItem value="controlada">Controlada</SelectItem>
                    <SelectItem value="especial">Especial</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {tipoReceita !== 'simples' && (
                <div>
                  <Label className="text-xs font-medium">Nº Talonário</Label>
                  <Input placeholder="Número do talonário" value={numeroTalonario} onChange={e => setNumeroTalonario(e.target.value)} />
                </div>
              )}
            </div>

            {(modelosPessoais.length > 0 || receituarioModelos.length > 0) && (
              <div>
                <Label className="text-xs font-medium mb-1 block">Carregar Modelo</Label>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="sm">
                      <FolderOpen className="h-4 w-4 mr-2" />
                      Inserir Modelo
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="start" className="w-64">
                    {receituarioModelos.length > 0 && (
                      <>
                        <DropdownMenuLabel className="text-xs">Modelos Institucionais</DropdownMenuLabel>
                        {receituarioModelos.map(m => (
                          <DropdownMenuItem key={m.id} onClick={() => setSelectedModeloId(m.id)}>
                            {m.nome} {m.is_default && <Badge variant="secondary" className="ml-2 text-[9px]">Padrão</Badge>}
                          </DropdownMenuItem>
                        ))}
                        <DropdownMenuSeparator />
                      </>
                    )}
                    {modelosPessoais.length > 0 && (
                      <>
                        <DropdownMenuLabel className="text-xs">Meus Modelos</DropdownMenuLabel>
                        {modelosPessoais.map(m => (
                          <DropdownMenuItem key={m.id} className="flex items-center justify-between" onClick={() => loadModeloPessoal(m)}>
                            <span className="truncate">{m.nome_modelo}</span>
                            <Button variant="ghost" size="icon" className="h-5 w-5 ml-2 flex-shrink-0" onClick={e => { e.stopPropagation(); onDeleteModeloPessoal(m.id); }}>
                              <Trash2 className="h-3 w-3 text-destructive" />
                            </Button>
                          </DropdownMenuItem>
                        ))}
                      </>
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Medicamentos */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Medicamentos</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {medicamentos.map((med, idx) => {
              return (
                <div key={idx} className="border rounded-lg p-4 space-y-3 relative">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-muted-foreground">Medicamento {idx + 1}</span>
                    {medicamentos.length > 1 && (
                      <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => removeMedicamento(idx)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="sm:col-span-2">
                      <MedicationAutocomplete
                        value={med.nome}
                        onChange={(v) => updateMedicamento(idx, 'nome', v)}
                        onInsert={(result: MedicationResult) => {
                          updateMedicamento(idx, 'nome', result.nome_comercial);
                          updateMedicamento(idx, 'dosagem', result.concentracao);
                        }}
                      />
                    </div>
                    <div>
                      <Label className="text-xs">Dosagem *</Label>
                      <Input placeholder="Ex: 500mg" value={med.dosagem} onChange={e => updateMedicamento(idx, 'dosagem', e.target.value)} />
                    </div>
                    <div>
                      <Label className="text-xs">Frequência *</Label>
                      <Input placeholder="Ex: 8/8h" value={med.frequencia} onChange={e => updateMedicamento(idx, 'frequencia', e.target.value)} />
                    </div>
                    <div>
                      <Label className="text-xs">Duração *</Label>
                      <Input placeholder="Ex: 7 dias" value={med.duracao} onChange={e => updateMedicamento(idx, 'duracao', e.target.value)} />
                    </div>
                    <div>
                      <Label className="text-xs">Observações</Label>
                      <Input placeholder="Tomar após refeição" value={med.observacoes || ''} onChange={e => updateMedicamento(idx, 'observacoes', e.target.value)} />
                    </div>
                  </div>
                </div>
              );
            })}
            <Button variant="outline" size="sm" onClick={addMedicamento} className="w-full">
              <Plus className="h-4 w-4 mr-2" />
              Adicionar Medicamento
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-5">
            <Label className="text-xs">Observações Gerais</Label>
            <Textarea placeholder="Observações adicionais..." value={obsGerais} onChange={e => setObsGerais(e.target.value)} rows={3} />
          </CardContent>
        </Card>

        <div className="flex items-center justify-between gap-3 flex-wrap">
          <Button variant="outline" size="sm" onClick={() => setSaveModeloOpen(true)} disabled={!medicamentos.some(m => m.nome.trim())}>
            <Bookmark className="h-4 w-4 mr-2" />
            Salvar como Modelo
          </Button>
          <div className="flex gap-3">
            <Button variant="outline" onClick={() => { resetReceituario(); setViewMode('list'); }}>Cancelar</Button>
            <Button onClick={handleSaveReceituario} disabled={saving || !medicamentos.some(m => m.nome.trim())}>
              <Printer className="h-4 w-4 mr-2" />
              {saving ? 'Emitindo...' : 'Emitir Receituário'}
            </Button>
          </div>
        </div>

        <Dialog open={saveModeloOpen} onOpenChange={setSaveModeloOpen}>
          <DialogContent className="max-w-sm">
            <DialogHeader>
              <DialogTitle>Salvar Modelo Pessoal</DialogTitle>
            </DialogHeader>
            <div className="space-y-3">
              <div>
                <Label className="text-xs">Nome do modelo *</Label>
                <Input placeholder="Ex: Antibiótico padrão" value={modeloNome} onChange={e => setModeloNome(e.target.value)} />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setSaveModeloOpen(false)}>Cancelar</Button>
              <Button onClick={handleSaveModelo} disabled={!modeloNome.trim()}>Salvar</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    );
  }

  // ─── ATESTADO FORM ──────────────────────────────
  if (viewMode === 'atestado') {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <FileText className="h-5 w-5 text-emerald-600" />
            Novo Atestado
          </h2>
          <Button variant="outline" size="sm" onClick={() => { resetAtestado(); setViewMode('list'); }}>Voltar</Button>
        </div>

        <ProfessionalHeader />

        <Card>
          <CardContent className="pt-5 space-y-5">
            <div>
              <Label className="text-sm font-medium mb-2 block">Tipo de Afastamento</Label>
              <RadioGroup value={tipoAfastamento} onValueChange={v => setTipoAfastamento(v as 'dias' | 'periodo')} className="flex gap-6">
                <div className="flex items-center gap-2">
                  <RadioGroupItem value="dias" id="dias" />
                  <Label htmlFor="dias" className="cursor-pointer">X dias</Label>
                </div>
                <div className="flex items-center gap-2">
                  <RadioGroupItem value="periodo" id="periodo" />
                  <Label htmlFor="periodo" className="cursor-pointer">Data início e fim</Label>
                </div>
              </RadioGroup>
            </div>

            {tipoAfastamento === 'dias' ? (
              <div className="max-w-[200px]">
                <Label className="text-xs">Quantidade de dias *</Label>
                <Input type="number" min="1" placeholder="Ex: 3" value={diasAfastamento} onChange={e => setDiasAfastamento(e.target.value)} />
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-xs">Data início *</Label>
                  <Input type="date" value={dataInicio} onChange={e => setDataInicio(e.target.value)} />
                </div>
                <div>
                  <Label className="text-xs">Data fim *</Label>
                  <Input type="date" value={dataFim} onChange={e => setDataFim(e.target.value)} />
                </div>
              </div>
            )}

            <div className="max-w-[300px]">
              <Label className="text-xs">CID (opcional)</Label>
              <Input placeholder="Ex: J06.9" value={cid} onChange={e => setCid(e.target.value)} />
            </div>

            <div>
              <Label className="text-xs">Observação complementar</Label>
              <Textarea placeholder="Observações adicionais..." value={obsAtestado} onChange={e => setObsAtestado(e.target.value)} rows={3} />
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-end gap-3">
          <Button variant="outline" onClick={() => { resetAtestado(); setViewMode('list'); }}>Cancelar</Button>
          <Button onClick={handleSaveAtestado} disabled={saving || (tipoAfastamento === 'dias' ? !diasAfastamento : !dataInicio || !dataFim)}>
            <Printer className="h-4 w-4 mr-2" />
            {saving ? 'Emitindo...' : 'Emitir Atestado'}
          </Button>
        </div>
      </div>
    );
  }

  // ─── DECLARAÇÃO FORM ──────────────────────────────
  if (viewMode === 'declaracao') {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <ClipboardPen className="h-5 w-5 text-violet-600" />
            Nova Declaração
          </h2>
          <Button variant="outline" size="sm" onClick={() => { resetDeclaracao(); setViewMode('list'); }}>Voltar</Button>
        </div>

        <ProfessionalHeader />

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Conteúdo da Declaração</CardTitle>
          </CardHeader>
          <CardContent>
            <Textarea
              placeholder="Digite o texto da declaração..."
              value={textoDeclaracao}
              onChange={e => setTextoDeclaracao(e.target.value)}
              rows={12}
              className="min-h-[250px] resize-y"
            />
          </CardContent>
        </Card>

        <div className="flex justify-end gap-3">
          <Button variant="outline" onClick={() => { resetDeclaracao(); setViewMode('list'); }}>Cancelar</Button>
          <Button variant="secondary" onClick={() => handleSaveDeclaracao(true)} disabled={saving || !textoDeclaracao.trim()}>
            <Save className="h-4 w-4 mr-2" />
            Salvar Rascunho
          </Button>
          <Button onClick={() => handleSaveDeclaracao(false)} disabled={saving || !textoDeclaracao.trim()}>
            <Printer className="h-4 w-4 mr-2" />
            {saving ? 'Emitindo...' : 'Emitir Declaração'}
          </Button>
        </div>
      </div>
    );
  }

  // ─── RELATÓRIO FORM ──────────────────────────────
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold flex items-center gap-2">
          <FileBarChart className="h-5 w-5 text-orange-600" />
          Novo Relatório
        </h2>
        <Button variant="outline" size="sm" onClick={() => { resetRelatorio(); setViewMode('list'); }}>Voltar</Button>
      </div>

      <ProfessionalHeader />

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Estrutura do Relatório</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label className="text-xs font-medium">Título do Relatório *</Label>
            <Input placeholder="Ex: Relatório de Acompanhamento Clínico" value={relTitulo} onChange={e => setRelTitulo(e.target.value)} />
          </div>

          <div>
            <Label className="text-xs font-medium">Objetivo</Label>
            <Textarea placeholder="Objetivo deste relatório..." value={relObjetivo} onChange={e => setRelObjetivo(e.target.value)} rows={2} />
          </div>

          <div>
            <Label className="text-xs font-medium">Histórico Clínico Resumido</Label>
            <Textarea placeholder="Histórico relevante do paciente..." value={relHistorico} onChange={e => setRelHistorico(e.target.value)} rows={3} />
          </div>

          <div>
            <Label className="text-xs font-medium">Descrição Detalhada *</Label>
            <Textarea placeholder="Descrição detalhada do caso clínico..." value={relDescricao} onChange={e => setRelDescricao(e.target.value)} rows={6} className="min-h-[150px] resize-y" />
          </div>

          <div>
            <Label className="text-xs font-medium">Conclusão</Label>
            <Textarea placeholder="Conclusão do relatório..." value={relConclusao} onChange={e => setRelConclusao(e.target.value)} rows={3} />
          </div>

          <div>
            <Label className="text-xs font-medium">Recomendações</Label>
            <Textarea placeholder="Recomendações ao paciente ou encaminhamento..." value={relRecomendacoes} onChange={e => setRelRecomendacoes(e.target.value)} rows={3} />
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end gap-3">
        <Button variant="outline" onClick={() => { resetRelatorio(); setViewMode('list'); }}>Cancelar</Button>
        <Button variant="secondary" onClick={() => handleSaveRelatorio(true)} disabled={saving || !relTitulo.trim() || !relDescricao.trim()}>
          <Save className="h-4 w-4 mr-2" />
          Salvar Rascunho
        </Button>
        <Button onClick={() => handleSaveRelatorio(false)} disabled={saving || !relTitulo.trim() || !relDescricao.trim()}>
          <Printer className="h-4 w-4 mr-2" />
          {saving ? 'Emitindo...' : 'Emitir Relatório'}
        </Button>
      </div>
    </div>
  );
}

// ─── Sub-Components ─────────────────────────────────

function ReceituarioView({ conteudo }: { conteudo: ConteudoReceituario }) {
  return (
    <div className="space-y-3">
      <h4 className="font-medium text-sm">Medicamentos Prescritos</h4>
      {(conteudo.medicamentos || []).map((med, i) => (
        <div key={i} className="border rounded-lg p-3 space-y-1 text-sm">
          <p className="font-medium">{i + 1}. {med.nome}</p>
          <div className="grid grid-cols-3 gap-2 text-muted-foreground text-xs">
            <p>Dosagem: {med.dosagem}</p>
            <p>Freq.: {med.frequencia}</p>
            <p>Duração: {med.duracao}</p>
          </div>
          {med.observacoes && <p className="text-xs text-muted-foreground italic">{med.observacoes}</p>}
        </div>
      ))}
      {conteudo.observacoes_gerais && (
        <>
          <Separator />
          <div>
            <p className="text-xs font-medium text-muted-foreground mb-1">Observações Gerais</p>
            <p className="text-sm">{conteudo.observacoes_gerais}</p>
          </div>
        </>
      )}
    </div>
  );
}

function AtestadoView({ conteudo }: { conteudo: ConteudoAtestado }) {
  return (
    <div className="space-y-3 text-sm">
      <div>
        <p className="text-xs font-medium text-muted-foreground mb-1">Afastamento</p>
        {conteudo.tipo_afastamento === 'dias' ? (
          <p>{conteudo.dias} dia{(conteudo.dias || 0) > 1 ? 's' : ''}</p>
        ) : (
          <p>De {conteudo.data_inicio ? format(parseISO(conteudo.data_inicio), 'dd/MM/yyyy') : '—'} até {conteudo.data_fim ? format(parseISO(conteudo.data_fim), 'dd/MM/yyyy') : '—'}</p>
        )}
      </div>
      {conteudo.cid && (
        <div>
          <p className="text-xs font-medium text-muted-foreground mb-1">CID</p>
          <p>{conteudo.cid}</p>
        </div>
      )}
      {conteudo.observacao && (
        <div>
          <p className="text-xs font-medium text-muted-foreground mb-1">Observação</p>
          <p>{conteudo.observacao}</p>
        </div>
      )}
    </div>
  );
}

function DeclaracaoView({ conteudo }: { conteudo: ConteudoDeclaracao }) {
  return (
    <div className="space-y-3 text-sm">
      <div>
        <p className="text-xs font-medium text-muted-foreground mb-1">Conteúdo da Declaração</p>
        <p className="whitespace-pre-wrap bg-muted/30 p-3 rounded-lg">{conteudo.texto}</p>
      </div>
    </div>
  );
}

function RelatorioView({ conteudo }: { conteudo: ConteudoRelatorio }) {
  return (
    <div className="space-y-4 text-sm">
      <div>
        <p className="text-xs font-medium text-muted-foreground mb-1">Título</p>
        <p className="font-semibold">{conteudo.titulo_relatorio}</p>
      </div>
      {conteudo.objetivo && (
        <div>
          <p className="text-xs font-medium text-muted-foreground mb-1">Objetivo</p>
          <p className="whitespace-pre-wrap">{conteudo.objetivo}</p>
        </div>
      )}
      {conteudo.historico_clinico && (
        <div>
          <p className="text-xs font-medium text-muted-foreground mb-1">Histórico Clínico</p>
          <p className="whitespace-pre-wrap">{conteudo.historico_clinico}</p>
        </div>
      )}
      <div>
        <p className="text-xs font-medium text-muted-foreground mb-1">Descrição Detalhada</p>
        <p className="whitespace-pre-wrap bg-muted/30 p-3 rounded-lg">{conteudo.descricao_detalhada}</p>
      </div>
      {conteudo.conclusao && (
        <div>
          <p className="text-xs font-medium text-muted-foreground mb-1">Conclusão</p>
          <p className="whitespace-pre-wrap">{conteudo.conclusao}</p>
        </div>
      )}
      {conteudo.recomendacoes && (
        <div>
          <p className="text-xs font-medium text-muted-foreground mb-1">Recomendações</p>
          <p className="whitespace-pre-wrap">{conteudo.recomendacoes}</p>
        </div>
      )}
    </div>
  );
}
