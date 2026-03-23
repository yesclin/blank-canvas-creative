import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
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
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  FileText,
  Download,
  Save,
  Eye,
  EyeOff,
  Loader2,
  AlertTriangle,
  ClipboardCheck,
  FlaskConical,
  Lock,
} from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { toast } from 'sonner';
import jsPDF from 'jspdf';
import { useLaudoPsicologicoData, type LaudoSection } from '@/hooks/prontuario/psicologia/useLaudoPsicologicoData';
import { useClinicData } from '@/hooks/useClinicData';

interface LaudoPsicologicoBlockProps {
  patientId: string | null;
  patientName?: string;
  canEdit: boolean;
}

export function LaudoPsicologicoBlock({
  patientId,
  patientName,
  canEdit,
}: LaudoPsicologicoBlockProps) {
  const {
    loading,
    saving,
    loadingAvaliacoes,
    avaliacoes,
    fetchAvaliacoes,
    buildLaudo,
    saveLaudo,
  } = useLaudoPsicologicoData();
  const { clinic } = useClinicData();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [sections, setSections] = useState<LaudoSection[]>([]);
  const [selectedAvaliacaoId, setSelectedAvaliacaoId] = useState('');
  const [professionalName, setProfessionalName] = useState('');
  const [professionalReg, setProfessionalReg] = useState('');
  const [reviewConfirmed, setReviewConfirmed] = useState(false);
  const [step, setStep] = useState<'select' | 'edit'>('select');

  useEffect(() => {
    if (dialogOpen && patientId) {
      fetchAvaliacoes(patientId);
    }
  }, [dialogOpen, patientId, fetchAvaliacoes]);

  const handleGenerate = async () => {
    if (!patientId || !selectedAvaliacaoId) {
      toast.error('Selecione uma avaliação');
      return;
    }

    const result = await buildLaudo(selectedAvaliacaoId, patientId);
    if (!result) return;

    setSections(result.sections);
    setProfessionalName(result.aggregated.professionalName);
    setProfessionalReg(result.aggregated.professionalRegistration);
    setReviewConfirmed(false);
    setStep('edit');
  };

  const handleSectionContentChange = (key: string, content: string) => {
    setSections(prev => prev.map(s => (s.key === key ? { ...s, content } : s)));
  };

  const handleSectionVisibilityToggle = (key: string) => {
    setSections(prev => prev.map(s => {
      if (s.key === key && s.key !== 'limitacao_tecnica') {
        return { ...s, visible: !s.visible };
      }
      return s;
    }));
  };

  const handleSave = async (isDraft: boolean) => {
    if (!patientId) return;
    if (!isDraft && !reviewConfirmed) {
      toast.error('Confirme a revisão do laudo antes de emitir.');
      return;
    }

    const docId = await saveLaudo({
      patientId,
      sections,
      professionalName,
      patientName: patientName || '',
      avaliacaoId: selectedAvaliacaoId,
      isDraft,
    });
    if (docId) {
      if (!isDraft) handleExportPdf();
      setDialogOpen(false);
      setStep('select');
      setSelectedAvaliacaoId('');
      setReviewConfirmed(false);
    }
  };

  const handleExportPdf = () => {
    const doc = new jsPDF('p', 'mm', 'a4');
    const pageWidth = 210;
    const marginLeft = 25;
    const marginRight = 20;
    const maxWidth = pageWidth - marginLeft - marginRight;
    let y = 25;

    const addWrappedText = (text: string, x: number, fontSize: number, isBold = false) => {
      doc.setFontSize(fontSize);
      doc.setFont('helvetica', isBold ? 'bold' : 'normal');
      const lines = doc.splitTextToSize(text, maxWidth);
      for (const line of lines) {
        if (y > 270) { doc.addPage(); y = 20; }
        doc.text(line, x, y);
        y += fontSize * 0.45;
      }
    };

    // Header
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('LAUDO PSICOLÓGICO', pageWidth / 2, y, { align: 'center' });
    y += 8;

    if (clinic?.name) {
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.text(clinic.name, pageWidth / 2, y, { align: 'center' });
      y += 6;
    }

    doc.setFontSize(9);
    doc.text(`Data de emissão: ${format(new Date(), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}`, pageWidth / 2, y, { align: 'center' });
    y += 8;

    doc.setDrawColor(100);
    doc.line(marginLeft, y, pageWidth - marginRight, y);
    y += 8;

    // Sections
    const visibleSections = sections.filter(s => s.visible);
    for (const section of visibleSections) {
      if (y > 255) { doc.addPage(); y = 20; }
      addWrappedText(section.title, marginLeft, 12, true);
      y += 2;
      addWrappedText(section.content, marginLeft, 10, false);
      y += 6;
    }

    // Signature
    y += 10;
    if (y > 250) { doc.addPage(); y = 20; }
    doc.setDrawColor(100);
    const sigLineX = pageWidth / 2 - 40;
    doc.line(sigLineX, y, sigLineX + 80, y);
    y += 5;
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(professionalName, pageWidth / 2, y, { align: 'center' });
    y += 5;
    if (professionalReg) {
      doc.text(`CRP: ${professionalReg}`, pageWidth / 2, y, { align: 'center' });
    }

    // Footer
    const totalPages = doc.getNumberOfPages();
    for (let i = 1; i <= totalPages; i++) {
      doc.setPage(i);
      doc.setFontSize(8);
      doc.setFont('helvetica', 'normal');
      doc.text(`Página ${i} de ${totalPages}`, pageWidth / 2, 290, { align: 'center' });
    }

    const fileName = `laudo-psicologico-${(patientName || 'paciente').replace(/\s+/g, '-').toLowerCase()}-${format(new Date(), 'yyyy-MM-dd')}.pdf`;
    doc.save(fileName);
    toast.success('PDF do laudo exportado');
  };

  const openDialog = () => {
    setStep('select');
    setSelectedAvaliacaoId('');
    setSections([]);
    setReviewConfirmed(false);
    setDialogOpen(true);
  };

  return (
    <>
      <Card className="border-dashed border-primary/20">
        <CardContent className="py-6 flex flex-col items-center gap-3">
          <ClipboardCheck className="h-8 w-8 text-primary/60" />
          <p className="text-sm text-muted-foreground text-center max-w-md">
            Gere um laudo psicológico estruturado a partir de uma avaliação (psicodiagnóstico) já registrada. O sistema consolida os dados sem gerar diagnósticos automáticos.
          </p>
          <Button onClick={openDialog} disabled={!canEdit || !patientId}>
            <ClipboardCheck className="h-4 w-4 mr-2" />
            Gerar Laudo Psicológico
          </Button>
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-hidden flex flex-col min-h-0">
          <DialogHeader className="shrink-0">
            <DialogTitle className="flex items-center gap-2">
              <ClipboardCheck className="h-5 w-5" />
              Laudo Psicológico Estruturado
            </DialogTitle>
            <DialogDescription>
              {step === 'select'
                ? 'Selecione a avaliação psicológica (psicodiagnóstico) base para o laudo.'
                : 'Revise e edite todas as seções. Nenhum diagnóstico é gerado automaticamente.'}
            </DialogDescription>
          </DialogHeader>

          {step === 'select' ? (
            <>
              <div className="flex-1 min-h-0 overflow-y-auto pr-2">
                <div className="space-y-4 py-4">
                  {loadingAvaliacoes ? (
                    <div className="flex items-center justify-center py-8">
                      <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                    </div>
                  ) : avaliacoes.length === 0 ? (
                    <div className="flex flex-col items-center gap-3 py-8 text-center">
                      <AlertTriangle className="h-8 w-8 text-amber-500" />
                      <div className="space-y-1">
                        <p className="text-sm font-medium">Nenhuma avaliação com instrumentos encontrada</p>
                        <p className="text-xs text-muted-foreground max-w-sm">
                          É necessário ter pelo menos uma anamnese do tipo "Avaliação Psicológica (Psicodiagnóstico)" com instrumentos psicológicos registrados.
                        </p>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <Label>Selecione a avaliação base</Label>
                      <Select value={selectedAvaliacaoId} onValueChange={setSelectedAvaliacaoId}>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione uma avaliação..." />
                        </SelectTrigger>
                        <SelectContent>
                          {avaliacoes.map(av => (
                            <SelectItem key={av.id} value={av.id}>
                              <span className="flex items-center gap-2">
                                <FlaskConical className="h-3.5 w-3.5 text-muted-foreground" />
                                {format(new Date(av.createdAt), 'dd/MM/yyyy', { locale: ptBR })}
                                {' – '}
                                {av.responses.pd_finalidade_avaliacao || 'Avaliação'}
                              </span>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>

                      {selectedAvaliacaoId && (() => {
                        const sel = avaliacoes.find(a => a.id === selectedAvaliacaoId);
                        if (!sel) return null;
                        const instCount = [1, 2, 3, 4, 5].filter(i => sel.responses[`pd_instrumento_${i}_nome`]).length;
                        return (
                          <div className="p-3 rounded-lg bg-muted/50 border space-y-1">
                            <p className="text-xs text-muted-foreground">
                              <strong>Finalidade:</strong> {sel.responses.pd_finalidade_avaliacao || 'N/A'}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              <strong>Instrumentos registrados:</strong> {instCount}
                            </p>
                          </div>
                        );
                      })()}

                      <div className="flex items-start gap-2 p-3 rounded-lg bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800">
                        <AlertTriangle className="h-4 w-4 text-blue-600 mt-0.5 shrink-0" />
                        <p className="text-xs text-muted-foreground">
                          O laudo é gerado exclusivamente com dados registrados na avaliação. Nenhum diagnóstico ou interpretação é gerado automaticamente pelo sistema.
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <DialogFooter className="shrink-0 border-t pt-2">
                <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancelar</Button>
                <Button onClick={handleGenerate} disabled={loading || !selectedAvaliacaoId}>
                  {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                  Gerar Estrutura do Laudo
                </Button>
              </DialogFooter>
            </>
          ) : (
            <>
              <div className="flex-1 min-h-0 overflow-y-auto pr-4">
                <div className="space-y-4 py-2">
                  {sections.map(section => (
                    <div key={section.key} className="space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <h4 className="text-sm font-semibold">{section.title}</h4>
                          {!section.editable && (
                            <Badge variant="outline" className="text-[10px]">
                              <Lock className="h-3 w-3 mr-1" />
                              Fixo
                            </Badge>
                          )}
                        </div>
                        {section.key !== 'limitacao_tecnica' && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleSectionVisibilityToggle(section.key)}
                            className="h-7 px-2 text-xs"
                          >
                            {section.visible ? <Eye className="h-3.5 w-3.5 mr-1" /> : <EyeOff className="h-3.5 w-3.5 mr-1" />}
                            {section.visible ? 'Visível' : 'Oculto'}
                          </Button>
                        )}
                      </div>
                      {section.visible && (
                        section.editable ? (
                          <Textarea
                            value={section.content}
                            onChange={e => handleSectionContentChange(section.key, e.target.value)}
                            className="min-h-[80px] text-sm"
                            rows={Math.max(3, section.content.split('\n').length + 1)}
                          />
                        ) : (
                          <div className="p-3 rounded-md bg-muted/50 border text-sm text-muted-foreground whitespace-pre-line">
                            {section.content}
                          </div>
                        )
                      )}
                      {!section.visible && (
                        <p className="text-xs text-muted-foreground italic pl-2">
                          Esta seção não será incluída no laudo final.
                        </p>
                      )}
                      <Separator className="mt-2" />
                    </div>
                  ))}
                </div>
              </div>

              {/* Review checkbox */}
              <div className="shrink-0 flex items-center gap-2 p-3 rounded-lg bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800">
                <Checkbox
                  id="review-confirmation"
                  checked={reviewConfirmed}
                  onCheckedChange={checked => setReviewConfirmed(!!checked)}
                />
                <Label htmlFor="review-confirmation" className="text-sm font-medium cursor-pointer">
                  Confirmo que revisei integralmente este laudo.
                </Label>
              </div>

              <DialogFooter className="shrink-0 gap-2 pt-2 border-t">
                <Button variant="outline" onClick={() => setStep('select')}>Voltar</Button>
                <Button variant="outline" onClick={() => handleSave(true)} disabled={saving}>
                  {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                  <Save className="h-4 w-4 mr-2" />
                  Salvar Rascunho
                </Button>
                <Button variant="outline" onClick={handleExportPdf}>
                  <Download className="h-4 w-4 mr-2" />
                  Exportar PDF
                </Button>
                <Button onClick={() => handleSave(false)} disabled={saving || !reviewConfirmed}>
                  {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                  <FileText className="h-4 w-4 mr-2" />
                  Emitir Laudo
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
