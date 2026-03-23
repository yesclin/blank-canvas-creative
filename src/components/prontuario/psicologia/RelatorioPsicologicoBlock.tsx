import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
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
  FileText,
  Download,
  Save,
  Eye,
  EyeOff,
  ShieldAlert,
  Loader2,
  CalendarDays,
  AlertTriangle,
  TrendingUp,
  TrendingDown,
  Minus,
  Zap,
  BarChart3,
} from 'lucide-react';
import { format, subMonths } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { toast } from 'sonner';
import jsPDF from 'jspdf';
import { useRelatorioPsicologicoData, type ReportSection, type RelatorioPsicologicoAggregated } from '@/hooks/prontuario/psicologia/useRelatorioPsicologicoData';
import { useClinicData } from '@/hooks/useClinicData';

interface RelatorioPsicologicoBlockProps {
  patientId: string | null;
  patientName?: string;
  canEdit: boolean;
}

function AnalysisSummary({ aggregated }: { aggregated: RelatorioPsicologicoAggregated }) {
  const { trendAnalysis, riskAnalysis, engagementAnalysis, techniqueAnalysis } = aggregated;

  const trendIcon = trendAnalysis.pattern === 'melhora' ? <TrendingUp className="h-3 w-3" /> :
    trendAnalysis.pattern === 'regressao' ? <TrendingDown className="h-3 w-3" /> :
    <Minus className="h-3 w-3" />;

  const trendColor = trendAnalysis.pattern === 'melhora' ? 'bg-green-50 dark:bg-green-950/30 border-green-300 text-green-700 dark:text-green-400' :
    trendAnalysis.pattern === 'regressao' ? 'bg-red-50 dark:bg-red-950/30 border-red-300 text-red-700 dark:text-red-400' :
    'bg-yellow-50 dark:bg-yellow-950/30 border-yellow-300 text-yellow-700 dark:text-yellow-400';

  const engColor = engagementAnalysis.classification === 'alto' ? 'bg-green-50 dark:bg-green-950/30 border-green-300 text-green-700 dark:text-green-400' :
    engagementAnalysis.classification === 'baixo' ? 'bg-red-50 dark:bg-red-950/30 border-red-300 text-red-700 dark:text-red-400' :
    'bg-yellow-50 dark:bg-yellow-950/30 border-yellow-300 text-yellow-700 dark:text-yellow-400';

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-2 p-3 rounded-lg bg-muted/50 border">
      <div className="text-center space-y-1">
        <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium">Tendência</p>
        <Badge variant="outline" className={`text-xs ${trendColor}`}>
          {trendIcon}
          <span className="ml-1">
            {trendAnalysis.pattern === 'melhora' ? 'Melhora' :
              trendAnalysis.pattern === 'regressao' ? 'Regressão' :
              trendAnalysis.pattern === 'estabilidade' ? 'Estável' : 'N/A'}
          </span>
        </Badge>
      </div>

      <div className="text-center space-y-1">
        <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium">Risco</p>
        <Badge variant="outline" className={riskAnalysis.hasHighRisk
          ? 'bg-red-50 dark:bg-red-950/30 border-red-300 text-red-700 dark:text-red-400 text-xs'
          : 'text-xs'}>
          <ShieldAlert className="h-3 w-3 mr-1" />
          {riskAnalysis.hasHighRisk ? `Alto (${riskAnalysis.highRiskCount}x)` : 'Sem risco alto'}
        </Badge>
      </div>

      <div className="text-center space-y-1">
        <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium">Engajamento</p>
        <Badge variant="outline" className={`text-xs ${engColor}`}>
          <Zap className="h-3 w-3 mr-1" />
          {engagementAnalysis.classification === 'insuficiente' ? 'N/A' :
            `${engagementAnalysis.classification.charAt(0).toUpperCase() + engagementAnalysis.classification.slice(1)} (${engagementAnalysis.average})`}
        </Badge>
      </div>

      <div className="text-center space-y-1">
        <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium">Sessões</p>
        <Badge variant="outline" className="text-xs">
          <BarChart3 className="h-3 w-3 mr-1" />
          {aggregated.totalSessions}
        </Badge>
      </div>
    </div>
  );
}

export function RelatorioPsicologicoBlock({
  patientId,
  patientName,
  canEdit,
}: RelatorioPsicologicoBlockProps) {
  const { loading, saving, aggregateReportData, saveReport } = useRelatorioPsicologicoData();
  const { clinic } = useClinicData();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [sections, setSections] = useState<ReportSection[]>([]);
  const [aggregated, setAggregated] = useState<RelatorioPsicologicoAggregated | null>(null);
  const [includeConfidential, setIncludeConfidential] = useState(false);
  const [periodStart, setPeriodStart] = useState(() =>
    format(subMonths(new Date(), 3), 'yyyy-MM-dd'),
  );
  const [periodEnd, setPeriodEnd] = useState(() => format(new Date(), 'yyyy-MM-dd'));
  const [professionalName, setProfessionalName] = useState('');
  const [professionalReg, setProfessionalReg] = useState('');
  const [step, setStep] = useState<'config' | 'edit'>('config');

  const handleGenerate = async () => {
    if (!patientId) {
      toast.error('Paciente não selecionado');
      return;
    }

    const result = await aggregateReportData(patientId, periodStart, periodEnd, includeConfidential);
    if (!result) return;

    setSections(result.sections);
    setAggregated(result.aggregated);
    setProfessionalName(result.aggregated.professionalName);
    setProfessionalReg(result.aggregated.professionalRegistration);
    setStep('edit');
  };

  const handleSectionContentChange = (key: string, content: string) => {
    setSections(prev => prev.map(s => (s.key === key ? { ...s, content } : s)));
  };

  const handleSectionVisibilityToggle = (key: string) => {
    setSections(prev => prev.map(s => (s.key === key ? { ...s, visible: !s.visible } : s)));
  };

  const handleSave = async () => {
    if (!patientId) return;
    const docId = await saveReport({
      patientId,
      sections,
      professionalName,
      patientName: patientName || '',
    });
    if (docId) {
      handleExportPdf();
      setDialogOpen(false);
      setStep('config');
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
        if (y > 270) { doc.addPage(); y = 20; }
        doc.text(line, x, y);
        y += fontSize * 0.45;
      }
    };

    // Header
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('RELATÓRIO PSICOLÓGICO', pageWidth / 2, y, { align: 'center' });
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
      y += 5;
    }
    doc.text(format(new Date(), "dd 'de' MMMM 'de' yyyy", { locale: ptBR }), pageWidth / 2, y, { align: 'center' });

    // Footer
    const totalPages = doc.getNumberOfPages();
    for (let i = 1; i <= totalPages; i++) {
      doc.setPage(i);
      doc.setFontSize(8);
      doc.setFont('helvetica', 'normal');
      doc.text(`Página ${i} de ${totalPages}`, pageWidth / 2, 290, { align: 'center' });
    }

    const fileName = `relatorio-psicologico-${(patientName || 'paciente').replace(/\s+/g, '-').toLowerCase()}-${format(new Date(), 'yyyy-MM-dd')}.pdf`;
    doc.save(fileName);
    toast.success('PDF exportado com sucesso');
  };

  const openDialog = () => {
    setStep('config');
    setAggregated(null);
    setDialogOpen(true);
  };

  return (
    <>
      <Card className="border-dashed border-primary/20">
        <CardContent className="py-6 flex flex-col items-center gap-3">
          <FileText className="h-8 w-8 text-primary/60" />
          <p className="text-sm text-muted-foreground text-center max-w-md">
            Gere um relatório inteligente consolidado com análise automática de tendência, risco, engajamento e técnicas predominantes.
          </p>
          <Button onClick={openDialog} disabled={!canEdit || !patientId}>
            <FileText className="h-4 w-4 mr-2" />
            Gerar Relatório Inteligente
          </Button>
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] min-h-0 flex flex-col overflow-hidden">
          <DialogHeader className="shrink-0">
            <DialogTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Relatório Psicológico Inteligente
            </DialogTitle>
            <DialogDescription>
              {step === 'config'
                ? 'Selecione o período e as opções. O sistema analisará automaticamente tendências, riscos e engajamento.'
                : 'Revise e edite as seções antes de salvar. Todas as informações foram consolidadas a partir dos registros existentes.'}
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

                  <div className="flex items-center gap-2 p-3 rounded-lg bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800">
                    <Checkbox
                      id="include-confidential"
                      checked={includeConfidential}
                      onCheckedChange={checked => setIncludeConfidential(!!checked)}
                    />
                    <div className="space-y-0.5">
                      <Label htmlFor="include-confidential" className="text-sm font-medium flex items-center gap-1">
                        <ShieldAlert className="h-3.5 w-3.5 text-amber-600" />
                        Incluir informações sensíveis
                      </Label>
                      <p className="text-xs text-muted-foreground">
                        Observações confidenciais das sessões serão incluídas no relatório.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-2 p-3 rounded-lg bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800">
                    <AlertTriangle className="h-4 w-4 text-blue-600 mt-0.5 shrink-0" />
                    <p className="text-xs text-muted-foreground">
                      O relatório é gerado exclusivamente com dados já registrados. A análise de tendência, risco e engajamento utiliza regras lógicas — nenhum conteúdo é inventado.
                    </p>
                  </div>
                </div>
              </div>

              <DialogFooter className="shrink-0 gap-2 pt-2 border-t">
                <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancelar</Button>
                <Button onClick={handleGenerate} disabled={loading}>
                  {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                  Gerar Pré-visualização
                </Button>
              </DialogFooter>
            </>
          ) : (
            <>
              <div className="flex-1 min-h-0 overflow-y-auto pr-2">
                <div className="space-y-4 py-2">
                  {/* Analysis summary badges */}
                  {aggregated && <AnalysisSummary aggregated={aggregated} />}

                  {sections.map(section => (
                    <div key={section.key} className="space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <h4 className="text-sm font-semibold">{section.title}</h4>
                          {section.confidential && (
                            <Badge variant="outline" className="text-[10px] bg-amber-50 dark:bg-amber-950/30 border-amber-300">
                              <ShieldAlert className="h-3 w-3 mr-1" />
                              Sensível
                            </Badge>
                          )}
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleSectionVisibilityToggle(section.key)}
                          className="h-7 px-2 text-xs"
                        >
                          {section.visible ? <Eye className="h-3.5 w-3.5 mr-1" /> : <EyeOff className="h-3.5 w-3.5 mr-1" />}
                          {section.visible ? 'Visível' : 'Oculto'}
                        </Button>
                      </div>
                      {section.visible && (
                        <Textarea
                          value={section.content}
                          onChange={e => handleSectionContentChange(section.key, e.target.value)}
                          className="min-h-[80px] text-sm"
                          rows={Math.max(3, section.content.split('\n').length + 1)}
                        />
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
                <Button variant="outline" onClick={() => setStep('config')}>Voltar</Button>
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
