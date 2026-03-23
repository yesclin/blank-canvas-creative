/**
 * ESTÉTICA - Termos de Consentimento
 * 
 * Módulo completo para gestão de termos de consentimento:
 * - Vinculação com procedimentos
 * - Aceite digital com assinatura
 * - Histórico de versões
 */

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { 
  FileCheck, 
  Plus, 
  CheckCircle2,
  Clock,
  FileText,
  Download,
  Pen,
  History,
  AlertCircle,
  Syringe,
  User,
  Calendar,
  Shield,
} from "lucide-react";
import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useAestheticConsent, DEFAULT_CONSENT_TEMPLATES } from "@/hooks/aesthetics";
import type { ConsentType, AestheticConsentRecord } from "./types";
import { CONSENT_TYPE_LABELS } from "./types";
import { SignatureCanvas } from "./SignatureCanvas";

interface ConsentModuleProps {
  patientId: string;
  appointmentId?: string | null;
  canEdit?: boolean;
}

export function ConsentModule({
  patientId,
  appointmentId,
  canEdit = false,
}: ConsentModuleProps) {
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [selectedType, setSelectedType] = useState<ConsentType | null>(null);
  const [selectedProcedureId, setSelectedProcedureId] = useState<string>('');
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [historyDialogOpen, setHistoryDialogOpen] = useState(false);
  const [historyType, setHistoryType] = useState<ConsentType | null>(null);
  const [selectedConsent, setSelectedConsent] = useState<AestheticConsentRecord | null>(null);
  const [agreed, setAgreed] = useState(false);
  const [signatureData, setSignatureData] = useState<string | null>(null);
  const [step, setStep] = useState<'read' | 'sign'>('read');

  const { 
    consents, 
    procedures,
    isLoading, 
    hasConsentForType,
    getLatestConsentForType,
    getVersionHistory,
    createConsent,
    isCreating,
    templates,
  } = useAestheticConsent(patientId);

  const handleCreateConsent = async () => {
    if (!selectedType || !agreed || !signatureData) return;

    const procedure = procedures.find(p => p.id === selectedProcedureId);

    await createConsent({
      consent_type: selectedType,
      appointment_id: appointmentId || undefined,
      procedure_id: selectedProcedureId || undefined,
      procedure_name: procedure?.name || undefined,
      signature_data: signatureData,
    });

    setCreateDialogOpen(false);
    resetForm();
  };

  const resetForm = () => {
    setSelectedType(null);
    setSelectedProcedureId('');
    setAgreed(false);
    setSignatureData(null);
    setStep('read');
  };

  const openConsentDialog = (type: ConsentType) => {
    setSelectedType(type);
    setAgreed(false);
    setSignatureData(null);
    setStep('read');
    setCreateDialogOpen(true);
  };

  const viewConsent = (consent: AestheticConsentRecord) => {
    setSelectedConsent(consent);
    setViewDialogOpen(true);
  };

  const openHistory = (type: ConsentType) => {
    setHistoryType(type);
    setHistoryDialogOpen(true);
  };

  const handleProceedToSign = () => {
    if (!agreed) return;
    setStep('sign');
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-48" />
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <Skeleton className="h-20" />
            <Skeleton className="h-20" />
            <Skeleton className="h-20" />
          </div>
        </CardContent>
      </Card>
    );
  }

  const consentTypes: ConsentType[] = ['toxin', 'filler', 'biostimulator', 'general'];

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <Shield className="h-5 w-5 text-primary" />
          <h2 className="text-lg font-semibold">Termos de Consentimento</h2>
          <Badge variant="secondary">{consents.length} assinado(s)</Badge>
        </div>
      </div>

      {/* Alerta para procedimentos invasivos */}
      <Card className="border-primary/30 bg-primary/5">
        <CardContent className="py-3 px-4">
          <div className="flex items-center gap-2 text-primary">
            <AlertCircle className="h-4 w-4" />
            <span className="text-sm font-medium">
              Termos de consentimento são obrigatórios para procedimentos invasivos.
            </span>
          </div>
        </CardContent>
      </Card>

      {/* Cards de Tipos de Consentimento */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {consentTypes.map((type) => {
          const hasConsent = hasConsentForType(type);
          const latestConsent = getLatestConsentForType(type);
          const versionHistory = getVersionHistory(type);
          const template = templates[type];

          return (
            <Card 
              key={type} 
              className={`p-4 transition-colors ${hasConsent ? 'border-primary/30 bg-primary/5' : 'border-muted'}`}
            >
              <div className="flex items-start justify-between">
                <div className="space-y-1.5 flex-1">
                  <div className="flex items-center gap-2">
                    {hasConsent ? (
                      <CheckCircle2 className="h-5 w-5 text-primary" />
                    ) : (
                      <Clock className="h-5 w-5 text-muted-foreground" />
                    )}
                    <h4 className="font-medium">{CONSENT_TYPE_LABELS[type]}</h4>
                  </div>
                  
                  {hasConsent && latestConsent ? (
                    <div className="text-xs text-muted-foreground space-y-0.5">
                      <p className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        Aceito em {format(parseISO(latestConsent.accepted_at), "dd/MM/yyyy HH:mm", { locale: ptBR })}
                      </p>
                      <p className="flex items-center gap-1">
                        <FileText className="h-3 w-3" />
                        Versão {latestConsent.term_version}
                      </p>
                      {(latestConsent as any).procedure_name && (
                        <p className="flex items-center gap-1">
                          <Syringe className="h-3 w-3" />
                          {(latestConsent as any).procedure_name}
                        </p>
                      )}
                    </div>
                  ) : (
                    <p className="text-xs text-muted-foreground">
                      Pendente de aceite • Versão atual: {template.version}
                    </p>
                  )}
                </div>

                <div className="flex flex-col gap-1">
                  {hasConsent && latestConsent && (
                    <>
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => viewConsent(latestConsent)}
                        title="Ver termo"
                      >
                        <FileText className="h-4 w-4" />
                      </Button>
                      {versionHistory.length > 1 && (
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => openHistory(type)}
                          title="Histórico de versões"
                        >
                          <History className="h-4 w-4" />
                        </Button>
                      )}
                    </>
                  )}
                  {canEdit && (
                    <Button 
                      size="sm"
                      variant={hasConsent ? "outline" : "default"}
                      onClick={() => openConsentDialog(type)}
                    >
                      {hasConsent ? (
                        <>
                          <Plus className="h-4 w-4 mr-1" />
                          Novo
                        </>
                      ) : (
                        <>
                          <Pen className="h-4 w-4 mr-1" />
                          Coletar
                        </>
                      )}
                    </Button>
                  )}
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      {/* Histórico Geral */}
      {consents.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <History className="h-4 w-4" />
              Histórico de Consentimentos
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[250px]">
              <div className="space-y-2">
                {consents.map((consent) => (
                  <div 
                    key={consent.id}
                    className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 cursor-pointer transition-colors"
                    onClick={() => viewConsent(consent)}
                  >
                    <div className="flex items-center gap-3">
                      <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                        <CheckCircle2 className="h-4 w-4 text-primary" />
                      </div>
                      <div>
                        <p className="font-medium text-sm">{consent.term_title}</p>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <span>v{consent.term_version}</span>
                          <span>•</span>
                          <span>{format(parseISO(consent.accepted_at), "dd/MM/yyyy HH:mm", { locale: ptBR })}</span>
                          {(consent as any).procedure_name && (
                            <>
                              <span>•</span>
                              <span>{(consent as any).procedure_name}</span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {consent.signature_data && (
                        <Badge variant="outline" className="text-xs gap-1">
                          <Pen className="h-3 w-3" />
                          Assinado
                        </Badge>
                      )}
                      <Badge variant="secondary" className="text-xs">
                        {CONSENT_TYPE_LABELS[consent.consent_type as ConsentType]}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      )}

      {/* Dialog de Coleta de Consentimento */}
      <Dialog open={createDialogOpen} onOpenChange={(open) => {
        setCreateDialogOpen(open);
        if (!open) resetForm();
      }}>
        <DialogContent className="max-w-2xl max-h-[90vh]">
          {selectedType && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <FileCheck className="h-5 w-5" />
                  {step === 'read' ? templates[selectedType].title : 'Assinatura Digital'}
                </DialogTitle>
                <div className="flex items-center gap-2">
                  <Badge variant="outline">Versão {templates[selectedType].version}</Badge>
                  {step === 'sign' && (
                    <Badge variant="secondary">Etapa 2 de 2</Badge>
                  )}
                </div>
              </DialogHeader>

              {step === 'read' ? (
                <>
                  {/* Seleção de Procedimento */}
                  {procedures.length > 0 && (
                    <div className="space-y-2 border-b pb-4">
                      <Label className="text-sm">Vincular a um Procedimento (opcional)</Label>
                      <Select value={selectedProcedureId} onValueChange={setSelectedProcedureId}>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione um procedimento..." />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="">Nenhum (termo geral)</SelectItem>
                          {procedures.map((proc) => (
                            <SelectItem key={proc.id} value={proc.id}>
                              {proc.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}

                  {/* Conteúdo do Termo */}
                  <ScrollArea className="h-[350px] pr-4">
                    <div className="prose prose-sm max-w-none">
                      <pre className="whitespace-pre-wrap font-sans text-sm leading-relaxed bg-muted/30 p-4 rounded-lg">
                        {templates[selectedType].content}
                      </pre>
                    </div>
                  </ScrollArea>

                  {/* Checkbox de Concordância */}
                  <div className="border-t pt-4 mt-4">
                    <div className="flex items-start space-x-3">
                      <Checkbox
                        id="agree"
                        checked={agreed}
                        onCheckedChange={(checked) => setAgreed(!!checked)}
                      />
                      <Label htmlFor="agree" className="text-sm leading-relaxed">
                        Eu, paciente, declaro que li e compreendi todas as informações 
                        acima e concordo com os termos apresentados.
                      </Label>
                    </div>
                  </div>

                  <DialogFooter>
                    <Button variant="outline" onClick={() => setCreateDialogOpen(false)}>
                      Cancelar
                    </Button>
                    <Button onClick={handleProceedToSign} disabled={!agreed}>
                      <Pen className="h-4 w-4 mr-1.5" />
                      Prosseguir para Assinatura
                    </Button>
                  </DialogFooter>
                </>
              ) : (
                <>
                  {/* Etapa de Assinatura */}
                  <div className="space-y-4">
                    <div className="bg-muted/30 p-4 rounded-lg text-center">
                      <User className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                      <p className="text-sm text-muted-foreground">
                        O paciente deve assinar abaixo para confirmar o aceite do termo.
                      </p>
                    </div>

                    <SignatureCanvas
                      onSave={setSignatureData}
                      onClear={() => setSignatureData(null)}
                    />

                    {signatureData && (
                      <div className="flex items-center justify-center gap-2 text-sm text-primary">
                        <CheckCircle2 className="h-4 w-4" />
                        Assinatura capturada
                      </div>
                    )}
                  </div>

                  <DialogFooter>
                    <Button variant="outline" onClick={() => setStep('read')}>
                      Voltar
                    </Button>
                    <Button 
                      onClick={handleCreateConsent} 
                      disabled={!signatureData || isCreating}
                    >
                      {isCreating ? 'Registrando...' : 'Confirmar e Salvar'}
                    </Button>
                  </DialogFooter>
                </>
              )}
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Dialog de Visualização */}
      <Dialog open={viewDialogOpen} onOpenChange={setViewDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh]">
          {selectedConsent && (
            <>
              <DialogHeader>
                <DialogTitle>{selectedConsent.term_title}</DialogTitle>
                <div className="flex items-center gap-2 text-sm text-muted-foreground flex-wrap">
                  <Badge variant="outline">Versão {selectedConsent.term_version}</Badge>
                  <span>•</span>
                  <span>
                    Aceito em {format(parseISO(selectedConsent.accepted_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                  </span>
                  {(selectedConsent as any).procedure_name && (
                    <>
                      <span>•</span>
                      <Badge variant="secondary" className="text-xs">
                        {(selectedConsent as any).procedure_name}
                      </Badge>
                    </>
                  )}
                </div>
              </DialogHeader>

              <ScrollArea className="h-[350px] pr-4">
                <div className="prose prose-sm max-w-none">
                  <pre className="whitespace-pre-wrap font-sans text-sm leading-relaxed bg-muted/30 p-4 rounded-lg">
                    {selectedConsent.term_content}
                  </pre>
                </div>
              </ScrollArea>

              {selectedConsent.signature_data && (
                <div className="border-t pt-4 mt-4">
                  <Label className="text-sm">Assinatura Digital do Paciente</Label>
                  <div className="border rounded-lg p-4 mt-2 bg-white">
                    <img 
                      src={selectedConsent.signature_data} 
                      alt="Assinatura" 
                      className="max-h-24 mx-auto"
                    />
                  </div>
                </div>
              )}

              <DialogFooter>
                <Button variant="outline" size="sm">
                  <Download className="h-4 w-4 mr-1" />
                  Exportar PDF
                </Button>
                <Button onClick={() => setViewDialogOpen(false)}>
                  Fechar
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Dialog de Histórico de Versões */}
      <Dialog open={historyDialogOpen} onOpenChange={setHistoryDialogOpen}>
        <DialogContent className="max-w-lg">
          {historyType && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <History className="h-5 w-5" />
                  Histórico - {CONSENT_TYPE_LABELS[historyType]}
                </DialogTitle>
              </DialogHeader>

              <ScrollArea className="h-[400px]">
                <div className="space-y-3">
                  {getVersionHistory(historyType).map((consent, index) => (
                    <Card 
                      key={consent.id} 
                      className={`p-3 cursor-pointer hover:bg-muted/50 transition-colors ${index === 0 ? 'border-primary' : ''}`}
                      onClick={() => {
                        setHistoryDialogOpen(false);
                        viewConsent(consent);
                      }}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="flex items-center gap-2">
                            <Badge variant={index === 0 ? "default" : "secondary"} className="text-xs">
                              v{consent.term_version}
                            </Badge>
                            {index === 0 && (
                              <Badge variant="outline" className="text-xs">Atual</Badge>
                            )}
                          </div>
                          <p className="text-xs text-muted-foreground mt-1">
                            {format(parseISO(consent.accepted_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                          </p>
                          {(consent as any).procedure_name && (
                            <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                              <Syringe className="h-3 w-3" />
                              {(consent as any).procedure_name}
                            </p>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          {consent.signature_data && (
                            <Pen className="h-4 w-4 text-muted-foreground" />
                          )}
                          <FileText className="h-4 w-4 text-muted-foreground" />
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              </ScrollArea>

              <DialogFooter>
                <Button onClick={() => setHistoryDialogOpen(false)}>
                  Fechar
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}