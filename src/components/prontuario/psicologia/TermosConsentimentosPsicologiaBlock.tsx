import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
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
  Shield,
  FileText,
  Check,
  X,
  Calendar,
  User,
  Clock,
  History,
  Eye,
  AlertTriangle,
  ShieldCheck,
  ShieldX,
  Plus,
  HandshakeIcon,
} from "lucide-react";
import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import { ConsentCollectionDialog } from "@/components/prontuario/ConsentCollectionDialog";
import type { ConsentTerm } from "@/hooks/lgpd/useConsentTerms";
import type { PatientConsent } from "@/hooks/lgpd/usePatientConsents";

interface TermosConsentimentosPsicologiaBlockProps {
  // Termos disponíveis (ativos) para coleta
  availableTerms: ConsentTerm[];
  // Consentimentos já registrados para este paciente
  patientConsents: PatientConsent[];
  // Estado de carregamento
  loading?: boolean;
  saving?: boolean;
  // Dados do paciente
  patientId: string;
  patientName: string;
  // Callbacks
  onGrantConsent: (termId: string, termVersion: string) => Promise<boolean>;
  onRevokeConsent: (consentId: string) => Promise<boolean>;
  // Permissões
  canEdit?: boolean;
}

/**
 * TERMOS / CONSENTIMENTOS - Bloco exclusivo para Psicologia
 * 
 * Este bloco é obrigatório para a especialidade Psicologia e permite:
 * - Registro do termo de consentimento terapêutico
 * - Aceite do paciente com confirmação dupla (LGPD)
 * - Versionamento dos termos
 * - Histórico completo de aceites
 */
export function TermosConsentimentosPsicologiaBlock({
  availableTerms,
  patientConsents,
  loading = false,
  saving = false,
  patientId,
  patientName,
  onGrantConsent,
  onRevokeConsent,
  canEdit = false,
}: TermosConsentimentosPsicologiaBlockProps) {
  const [collectTermId, setCollectTermId] = useState<string | null>(null);
  const [revokeConsentId, setRevokeConsentId] = useState<string | null>(null);
  const [viewConsent, setViewConsent] = useState<PatientConsent | null>(null);
  const [viewTermContent, setViewTermContent] = useState<ConsentTerm | null>(null);

  // Find the term being collected
  const termToCollect = collectTermId 
    ? availableTerms.find(t => t.id === collectTermId)
    : null;

  // Active consents (granted, not revoked)
  const activeConsents = patientConsents.filter(c => c.status === 'granted');
  
  // Revoked consents (for history)
  const revokedConsents = patientConsents.filter(c => c.status === 'revoked');

  // Check if patient has consented to a specific term
  const hasConsentForTerm = (termId: string) => {
    return activeConsents.some(c => c.term_id === termId);
  };

  // Get consent for a term
  const getConsentForTerm = (termId: string) => {
    return activeConsents.find(c => c.term_id === termId);
  };

  // Handle consent collection
  const handleConfirmConsent = async () => {
    if (!termToCollect) return false;
    return await onGrantConsent(termToCollect.id, termToCollect.version);
  };

  // Handle consent revocation
  const handleRevokeConsent = async () => {
    if (!revokeConsentId) return;
    await onRevokeConsent(revokeConsentId);
    setRevokeConsentId(null);
  };

  // Find full term info for a consent
  const findTermForConsent = (consent: PatientConsent) => {
    return availableTerms.find(t => t.id === consent.term_id);
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-32 w-full" />
      </div>
    );
  }

  const activeTerms = availableTerms.filter(t => t.is_active);
  const hasNoActiveTerms = activeTerms.length === 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h2 className="text-lg font-semibold">Termos / Consentimentos</h2>
          <Badge variant="secondary">{activeConsents.length} ativo(s)</Badge>
        </div>
      </div>

      {/* Psychology-specific info */}
      <div className="bg-purple-50 dark:bg-purple-950/20 border border-purple-200 dark:border-purple-800 p-4 rounded-lg">
        <div className="flex items-start gap-3">
          <HandshakeIcon className="h-5 w-5 text-purple-600 dark:text-purple-400 mt-0.5 flex-shrink-0" />
          <div>
            <p className="font-medium text-purple-900 dark:text-purple-100">
              Termo de Consentimento Terapêutico
            </p>
            <p className="text-sm text-purple-700 dark:text-purple-300 mt-1">
              O termo de consentimento é obrigatório para o acompanhamento psicológico, 
              conforme o Código de Ética Profissional do Psicólogo e a LGPD. 
              Registre o aceite do paciente antes de iniciar o atendimento.
            </p>
          </div>
        </div>
      </div>

      {/* No active terms warning */}
      {hasNoActiveTerms && (
        <Card className="border-amber-200 bg-amber-50 dark:border-amber-800 dark:bg-amber-950/20">
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <AlertTriangle className="h-5 w-5 text-amber-600 dark:text-amber-400 mt-0.5" />
              <div>
                <p className="font-medium text-amber-900 dark:text-amber-100">
                  Nenhum termo ativo configurado
                </p>
                <p className="text-sm text-amber-700 dark:text-amber-300 mt-1">
                  Configure os termos de consentimento nas configurações da clínica 
                  (Configurações → Segurança → Termos LGPD) para poder coletar o aceite dos pacientes.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Active Terms - collect or show status */}
      {activeTerms.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-sm font-medium text-muted-foreground flex items-center gap-2">
            <FileText className="h-4 w-4" />
            Termos Disponíveis
          </h3>
          
          <div className="grid gap-3">
            {activeTerms.map((term) => {
              const consent = getConsentForTerm(term.id);
              const hasConsent = !!consent;

              return (
                <Card key={term.id} className={hasConsent ? "border-green-200 bg-green-50/50 dark:border-green-800 dark:bg-green-950/20" : ""}>
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          {hasConsent ? (
                            <ShieldCheck className="h-5 w-5 text-green-600 dark:text-green-400" />
                          ) : (
                            <Shield className="h-5 w-5 text-muted-foreground" />
                          )}
                          <h4 className="font-medium">{term.title}</h4>
                          <Badge variant="outline" className="text-xs">v{term.version}</Badge>
                        </div>
                        
                        {hasConsent && consent && (
                          <div className="flex items-center gap-4 text-sm text-green-700 dark:text-green-300 mt-2">
                            <div className="flex items-center gap-1">
                              <Check className="h-4 w-4" />
                              <span>Aceito em {format(parseISO(consent.granted_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}</span>
                            </div>
                          </div>
                        )}

                        {!hasConsent && (
                          <p className="text-sm text-muted-foreground mt-1">
                            Termo pendente de aceite
                          </p>
                        )}
                      </div>

                      <div className="flex items-center gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setViewTermContent(term)}
                        >
                          <Eye className="h-4 w-4 mr-1" />
                          Ver Termo
                        </Button>

                        {hasConsent && consent ? (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setRevokeConsentId(consent.id)}
                            disabled={saving || !canEdit}
                            className="text-red-600 hover:text-red-700"
                          >
                            <X className="h-4 w-4 mr-1" />
                            Revogar
                          </Button>
                        ) : (
                          <Button
                            size="sm"
                            onClick={() => setCollectTermId(term.id)}
                            disabled={saving || !canEdit}
                          >
                            <Plus className="h-4 w-4 mr-1" />
                            Coletar Aceite
                          </Button>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      )}

      {/* Consent History */}
      {patientConsents.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-sm font-medium text-muted-foreground flex items-center gap-2">
            <History className="h-4 w-4" />
            Histórico de Consentimentos
          </h3>

          <Card>
            <CardContent className="p-0">
              <ScrollArea className="max-h-64">
                <div className="divide-y">
                  {patientConsents.map((consent) => (
                    <div 
                      key={consent.id} 
                      className="p-3 flex items-center justify-between hover:bg-muted/50 cursor-pointer"
                      onClick={() => setViewConsent(consent)}
                    >
                      <div className="flex items-center gap-3">
                        {consent.status === 'granted' ? (
                          <ShieldCheck className="h-4 w-4 text-green-600" />
                        ) : (
                          <ShieldX className="h-4 w-4 text-red-500" />
                        )}
                        <div>
                          <p className="font-medium text-sm">{consent.term_title}</p>
                          <p className="text-xs text-muted-foreground">
                            v{consent.term_version} • {consent.status === 'granted' ? 'Aceito' : 'Revogado'} em{' '}
                            {format(parseISO(consent.status === 'granted' ? consent.granted_at : consent.revoked_at!), "dd/MM/yyyy", { locale: ptBR })}
                          </p>
                        </div>
                      </div>
                      <Badge variant={consent.status === 'granted' ? 'default' : 'secondary'}>
                        {consent.status === 'granted' ? 'Ativo' : 'Revogado'}
                      </Badge>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Empty state */}
      {activeTerms.length > 0 && patientConsents.length === 0 && (
        <Card className="border-dashed">
          <CardContent className="p-8 text-center">
            <Shield className="h-12 w-12 mx-auto mb-3 text-muted-foreground opacity-50" />
            <h3 className="font-semibold mb-2">Nenhum consentimento registrado</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Colete o termo de consentimento do paciente para iniciar o acompanhamento.
            </p>
            {canEdit && activeTerms[0] && (
              <Button onClick={() => setCollectTermId(activeTerms[0].id)}>
                <Plus className="h-4 w-4 mr-2" />
                Coletar Primeiro Aceite
              </Button>
            )}
          </CardContent>
        </Card>
      )}

      {/* Collect Consent Dialog */}
      {termToCollect && (
        <ConsentCollectionDialog
          open={!!collectTermId}
          onOpenChange={(open) => !open && setCollectTermId(null)}
          patientName={patientName}
          termTitle={termToCollect.title}
          termVersion={termToCollect.version}
          termContent={termToCollect.content}
          onConfirm={handleConfirmConsent}
          isLoading={saving}
        />
      )}

      {/* Revoke Confirmation Dialog */}
      <AlertDialog open={!!revokeConsentId} onOpenChange={() => setRevokeConsentId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-red-500" />
              Revogar Consentimento?
            </AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação registrará a revogação do consentimento do paciente. 
              O histórico será mantido para fins de auditoria. 
              O paciente precisará aceitar o termo novamente para continuar o acompanhamento.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleRevokeConsent}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Confirmar Revogação
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* View Consent Details Dialog */}
      <Dialog open={!!viewConsent} onOpenChange={() => setViewConsent(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {viewConsent?.status === 'granted' ? (
                <ShieldCheck className="h-5 w-5 text-green-600" />
              ) : (
                <ShieldX className="h-5 w-5 text-red-500" />
              )}
              Detalhes do Consentimento
            </DialogTitle>
          </DialogHeader>

          {viewConsent && (
            <div className="space-y-4">
              <div className="bg-muted/50 p-4 rounded-lg space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Termo:</span>
                  <span className="font-medium">{viewConsent.term_title}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Versão:</span>
                  <span>{viewConsent.term_version}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Status:</span>
                  <Badge variant={viewConsent.status === 'granted' ? 'default' : 'secondary'}>
                    {viewConsent.status === 'granted' ? 'Ativo' : 'Revogado'}
                  </Badge>
                </div>
                <Separator />
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Data do Aceite:</span>
                  <span>{format(parseISO(viewConsent.granted_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}</span>
                </div>
                {viewConsent.revoked_at && (
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Data da Revogação:</span>
                    <span>{format(parseISO(viewConsent.revoked_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}</span>
                  </div>
                )}
              </div>

              <div className="text-xs text-muted-foreground">
                <p>User Agent: {viewConsent.user_agent || 'Não registrado'}</p>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* View Term Content Dialog */}
      <Dialog open={!!viewTermContent} onOpenChange={() => setViewTermContent(null)}>
        <DialogContent className="max-w-2xl max-h-[80vh]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              {viewTermContent?.title}
            </DialogTitle>
            <DialogDescription>
              Versão {viewTermContent?.version}
            </DialogDescription>
          </DialogHeader>

          {viewTermContent && (
            <ScrollArea className="h-[400px]">
              <div className="whitespace-pre-wrap text-sm p-4 bg-muted/30 rounded-lg">
                {viewTermContent.content}
              </div>
            </ScrollArea>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
