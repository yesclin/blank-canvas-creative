import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Scale,
  Download,
  Save,
  Eye,
  EyeOff,
  Loader2,
  CalendarDays,
  AlertTriangle,
  ShieldAlert,
} from 'lucide-react';
import { format, subMonths } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { toast } from 'sonner';
import jsPDF from 'jspdf';
import { useRelatorioJudicialData, type JudicialReportSection } from '@/hooks/prontuario/psicologia/useRelatorioJudicialData';
import { useClinicData } from '@/hooks/useClinicData';

interface RelatorioJudicialBlockProps {
  patientId: string | null;
  patientName?: string;
  canEdit: boolean;
}

export function RelatorioJudicialBlock({
  patientId,
  patientName,
  canEdit,
}: RelatorioJudicialBlockProps) {
  const { loading, saving, aggregateJudicialReportData, saveJudicialReport } = useRelatorioJudicialData();
  const { clinic } = useClinicData();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [sections, setSections] = useState<JudicialReportSection[]>([]);
  const [finalidade, setFinalidade] = useState('');
  const [ciencia, setCiencia] = useState(false);
  const [periodStart, setPeriodStart] = useState(() =>
    format(subMonths(new Date(), 6), 'yyyy-MM-dd'),
  );
  const [periodEnd, setPeriodEnd] = useState(() => format(new Date(), 'yyyy-MM-dd'));
  const [professionalName, setProfessionalName] = useState('');
  const [professionalReg, setProfessionalReg] = useState('');
  const [step, setStep] = useState<'config' | 'edit'>('config');

  const canGenerate = finalidade.trim().length > 0 && ciencia;

  const handleGenerate = async () => {
    if (!patientId) {
      toast.error('Paciente não selecionado');
      return;
    }
    if (!finalidade.trim()) {
      toast.error('A finalidade do relatório é obrigatória');
      return;
    }
    if (!ciencia) {
      toast.error('É necessário declarar ciência sobre a natureza do documento');
      return;
    }

    const result = await aggregateJudicialReportData(patientId, periodStart, periodEnd);
    if (!result) return;

    // Inject finalidade into the finalidade section
    const updatedSections = result.sections.map(s =>
      s.key === 'finalidade' ? { ...s, content: finalidade } : s,
    );

    setSections(updatedSections);
    setProfessionalName(result.aggregated.professionalName);
    setProfessionalReg(result.aggregated.professionalRegistration);
    setStep('edit');
  };

  const handleSectionContentChange = (key: string, content: string) => {
    setSections(prev => prev.map(s => (s.key === key ? { ...s, content } : s)));
  };

  const handleSectionVisibilityToggle = (key: string) => {
    setSections(prev => prev.map(s => {
      if (s.key === key && s.fixed) return s; // fixed sections cannot be hidden
      return s.key === key ? { ...s, visible: !s.visible } : s;
    }));
  };

  const handleSave = async () => {
    if (!patientId) return;
    const docId = await saveJudicialReport({
      patientId,
      sections,
      professionalName,
      patientName: patientName || '',
      finalidade,
      cienciaDeclarada: ciencia,
    });
    if (docId) {
      handleExportPdf();
      setDialogOpen(false);
      setStep('config');
      setFinalidade('');
      setCiencia(false);
    }
  };

  const handleExportPdf = () => {
    const doc = new jsPDF('p', 'mm', 'a4');
    const pageWidth = 210;
    const marginLeft = 20;
    const marginRight = 20;
    const maxWidth = pageWidth - marginLeft - marginRight;
    let y = 25;

    const addWrappedText = (text: string, x: number, fontSize: number, isBold = false) => {
      doc.setFontSize(fontSize);
      doc.setFont('helvetica', isBold ? 'bold' : 'normal');
      const lines = doc.splitTextToSize(text, maxWidth);
      for (const line of lines) {
        if (y > 270) {
          doc.addPage();
          y = 20;
        }
        doc.text(line, x, y);
        y += fontSize * 0.45;
      }
    };

    // Header
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('RELATÓRIO PSICOLÓGICO – USO JUDICIAL', pageWidth / 2, y, { align: 'center' });
    y += 10;

    if (clinic?.name) {
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.text(clinic.name, pageWidth / 2, y, { align: 'center' });
      y += 8;
    }

    doc.setDrawColor(100);
    doc.line(marginLeft, y, pageWidth - marginRight, y);
    y += 8;

    // Sections
    const visibleSections = sections.filter(s => s.visible);
    for (const section of visibleSections) {
      if (y > 255) {
        doc.addPage();
        y = 20;
      }
      addWrappedText(section.title, marginLeft, 12, true);
      y += 2;
      addWrappedText(section.content, marginLeft, 10, false);
      y += 6;
    }

    // Signature
    y += 10;
    if (y > 250) {
      doc.addPage();
      y = 20;
    }

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
      y += 5;
    }
    doc.text(format(new Date(), "dd 'de' MMMM 'de' yyyy", { locale: ptBR }), pageWidth / 2, y, {
      align: 'center',
    });

    y += 8;
    doc.setFontSize(7);
    doc.setFont('helvetica', 'italic');
    doc.text(
      'Este documento não se caracteriza como laudo pericial. Não contém informações clínicas confidenciais.',
      pageWidth / 2,
      y,
      { align: 'center' },
    );

    // Footer
    const totalPages = doc.getNumberOfPages();
    for (let i = 1; i <= totalPages; i++) {
      doc.setPage(i);
      doc.setFontSize(8);
      doc.setFont('helvetica', 'normal');
      doc.text(`Página ${i} de ${totalPages}`, pageWidth / 2, 290, { align: 'center' });
    }

    const fileName = `relatorio-judicial-${(patientName || 'paciente').replace(/\s+/g, '-').toLowerCase()}-${format(new Date(), 'yyyy-MM-dd')}.pdf`;
    doc.save(fileName);
    toast.success('PDF do Relatório Judicial exportado com sucesso');
  };

  const openDialog = () => {
    setStep('config');
    setFinalidade('');
    setCiencia(false);
    setDialogOpen(true);
  };

  return (
    <>
      <Card className="border-dashed border-primary/20">
        <CardContent className="py-6 flex flex-col items-center gap-3">
          <Scale className="h-8 w-8 text-primary/60" />
          <p className="text-sm text-muted-foreground text-center max-w-md">
            Gere um relatório psicológico para uso judicial, com delimitação técnica e proteção jurídica do profissional.
          </p>
          <Button variant="outline" onClick={openDialog} disabled={!canEdit || !patientId}>
            <Scale className="h-4 w-4 mr-2" />
            Gerar Relatório Judicial
          </Button>
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-hidden flex flex-col min-h-0">
          <DialogHeader className="shrink-0">
            <DialogTitle className="flex items-center gap-2">
              <Scale className="h-5 w-5" />
              Relatório Psicológico – Uso Judicial
            </DialogTitle>
            <DialogDescription>
              {step === 'config'
                ? 'Informe a finalidade e confirme a ciência. Este relatório não substitui laudo pericial.'
                : 'Revise e edite as seções antes de exportar. Nenhum dado confidencial é incluído automaticamente.'}
            </DialogDescription>
          </DialogHeader>

          {step === 'config' ? (
            <>
              <div className="flex-1 min-h-0 overflow-y-auto pr-2">
                <div className="space-y-4 py-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="flex items-center gap-1">
                        <CalendarDays className="h-3.5 w-3.5" />
                        Período Inicial
                      </Label>
                      <Input type="date" value={periodStart} onChange={e => setPeriodStart(e.target.value)} />
                    </div>
                    <div className="space-y-2">
                      <Label className="flex items-center gap-1">
                        <CalendarDays className="h-3.5 w-3.5" />
                        Período Final
                      </Label>
                      <Input type="date" value={periodEnd} onChange={e => setPeriodEnd(e.target.value)} />
                    </div>
                  </div>

                  {/* Finalidade - MANDATORY */}
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">
                      Finalidade do Relatório <span className="text-destructive">*</span>
                    </Label>
                    <Textarea
                      value={finalidade}
                      onChange={e => setFinalidade(e.target.value)}
                      placeholder="Descreva a finalidade para a qual este relatório está sendo emitido (ex.: solicitação judicial, processo de guarda, etc.)"
                      className="min-h-[80px] text-sm"
                    />
                  </div>

                  {/* Ciência checkbox - MANDATORY */}
                  <div className="flex items-start gap-2 p-4 rounded-lg bg-destructive/5 border border-destructive/20">
                    <Checkbox
                      id="ciencia-judicial"
                      checked={ciencia}
                      onCheckedChange={checked => setCiencia(!!checked)}
                      className="mt-0.5"
                    />
                    <div className="space-y-1">
                      <Label htmlFor="ciencia-judicial" className="text-sm font-medium flex items-center gap-1">
                        <ShieldAlert className="h-3.5 w-3.5 text-destructive" />
                        Estou ciente de que este documento não substitui laudo pericial
                        <span className="text-destructive">*</span>
                      </Label>
                      <p className="text-xs text-muted-foreground">
                        Este relatório refere-se exclusivamente ao acompanhamento psicológico e não constitui parecer pericial.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-2 p-3 rounded-lg bg-muted/50 border">
                    <AlertTriangle className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                    <div className="text-xs text-muted-foreground space-y-1">
                      <p>
                        Este relatório <strong>não inclui automaticamente</strong>:
                      </p>
                      <ul className="list-disc pl-4 space-y-0.5">
                        <li>Diagnóstico clínico ou parecer pericial</li>
                        <li>Notas confidenciais ou plano de ação de crise</li>
                        <li>Risco clínico ou ideação suicida</li>
                        <li>Observações internas do terapeuta</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>

              <DialogFooter className="shrink-0 pt-2 border-t">
                <Button variant="outline" onClick={() => setDialogOpen(false)}>
                  Cancelar
                </Button>
                <Button onClick={handleGenerate} disabled={loading || !canGenerate}>
                  {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                  Gerar Pré-visualização
                </Button>
              </DialogFooter>
            </>
          ) : (
            <>
              <div className="flex-1 min-h-0 overflow-y-auto pr-4">
                <div className="space-y-4 py-2">
                  <div className="p-2 rounded-md bg-destructive/5 border border-destructive/20">
                    <p className="text-xs text-muted-foreground flex items-center gap-1">
                      <ShieldAlert className="h-3.5 w-3.5 text-destructive" />
                      Documento para uso judicial — Não constitui laudo pericial — Nenhum dado sensível incluído.
                    </p>
                  </div>

                  {sections.map(section => (
                    <div key={section.key} className="space-y-2">
                      <div className="flex items-center justify-between">
                        <h4 className="text-sm font-semibold">{section.title}</h4>
                        {!section.fixed && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleSectionVisibilityToggle(section.key)}
                            className="h-7 px-2 text-xs"
                          >
                            {section.visible ? (
                              <Eye className="h-3.5 w-3.5 mr-1" />
                            ) : (
                              <EyeOff className="h-3.5 w-3.5 mr-1" />
                            )}
                            {section.visible ? 'Visível' : 'Oculto'}
                          </Button>
                        )}
                      </div>
                      {section.visible && !section.fixed && (
                        <Textarea
                          value={section.content}
                          onChange={e => handleSectionContentChange(section.key, e.target.value)}
                          className="min-h-[80px] text-sm"
                          rows={Math.max(3, section.content.split('\n').length + 1)}
                        />
                      )}
                      {section.visible && section.fixed && (
                        <div className="p-3 rounded-md bg-muted/50 border text-sm text-muted-foreground italic">
                          {section.content}
                        </div>
                      )}
                      {!section.visible && (
                        <p className="text-xs text-muted-foreground italic pl-2">
                          Esta seção não será incluída no relatório final.
                        </p>
                      )}
                      <Separator className="mt-2" />
                    </div>
                  ))}
                </div>
              </div>

              <DialogFooter className="shrink-0 gap-2 pt-2 border-t">
                <Button variant="outline" onClick={() => setStep('config')}>
                  Voltar
                </Button>
                <Button variant="outline" onClick={handleExportPdf}>
                  <Download className="h-4 w-4 mr-2" />
                  Exportar PDF
                </Button>
                <Button onClick={handleSave} disabled={saving}>
                  {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                  <Save className="h-4 w-4 mr-2" />
                  Salvar e Exportar
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
