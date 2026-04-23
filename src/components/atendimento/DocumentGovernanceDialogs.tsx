import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  useDocumentNotes,
  useAddDocumentNote,
  useSignDocument,
  useDocumentHistory,
  logDocumentAction,
} from "@/hooks/useDocumentGovernance";
import {
  StickyNote, PenTool, History, Clock, FileText,
  CheckCircle2, AlertTriangle, Plus, Lock, Shield,
  KeyRound, Eye, EyeOff, Loader2, User, FileCheck,
} from "lucide-react";
import { cn } from "@/lib/utils";

// ─── Add Note / Addendum Dialog ──────────────────────────
interface AddNoteDialogProps {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  documentId: string;
  clinicId: string;
  mode: "note" | "addendum";
}

export function AddNoteDialog({ open, onOpenChange, documentId, clinicId, mode }: AddNoteDialogProps) {
  const [content, setContent] = useState("");
  const addNote = useAddDocumentNote();

  const handleSubmit = async () => {
    if (!content.trim()) return;
    await addNote.mutateAsync({ documentId, clinicId, noteType: mode, content: content.trim() });
    setContent("");
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {mode === "addendum" ? <FileText className="h-4 w-4" /> : <StickyNote className="h-4 w-4" />}
            {mode === "addendum" ? "Adicionar Adendo" : "Adicionar Nota"}
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <p className="text-xs text-muted-foreground">
            {mode === "addendum"
              ? "O adendo será anexado ao documento consolidado sem alterar o conteúdo original."
              : "A nota será registrada como complemento ao documento."
            }
          </p>
          <div>
            <Label htmlFor="note-content">Conteúdo</Label>
            <Textarea
              id="note-content"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder={mode === "addendum" ? "Descreva o adendo clínico..." : "Escreva sua nota..."}
              rows={5}
              className="mt-1"
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>Cancelar</Button>
          <Button onClick={handleSubmit} disabled={!content.trim() || addNote.isPending}>
            {addNote.isPending ? "Salvando..." : "Salvar"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─── Sign Document Dialog (Assinatura Avançada YesClin) ──
// Mirrors the prontuário's AdvancedSignatureDialog UX:
// Two-step flow (Review + Authenticate), password reauth, irreversibility checks.
interface SignDialogProps {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  documentId: string;
  clinicId: string;
  alreadySigned: boolean;
  patientName?: string;
  professionalName?: string;
  generatedAt?: string | null;
  snapshot?: unknown;
}

export function SignDocumentDialog({
  open,
  onOpenChange,
  documentId,
  clinicId,
  alreadySigned,
  patientName,
  professionalName,
  generatedAt,
  snapshot,
}: SignDialogProps) {
  const signDoc = useSignDocument();
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [confirmIrreversible, setConfirmIrreversible] = useState(false);
  const [confirmAccuracy, setConfirmAccuracy] = useState(false);
  const [step, setStep] = useState<"review" | "authenticate">("review");

  useEffect(() => {
    if (!open) {
      setPassword("");
      setShowPassword(false);
      setConfirmIrreversible(false);
      setConfirmAccuracy(false);
      setStep("review");
    }
  }, [open]);

  const canProceedToAuth = confirmIrreversible && confirmAccuracy;
  const canSign = password.trim().length >= 6;
  const signing = signDoc.isPending;

  const handleSign = async () => {
    if (!canSign) return;
    try {
      await signDoc.mutateAsync({ documentId, clinicId, password, snapshot });
      onOpenChange(false);
    } catch {
      // toast already shown by hook
    }
  };

  const formatDate = (dateStr?: string | null) => {
    if (!dateStr) return "—";
    try {
      return new Date(dateStr).toLocaleDateString("pt-BR", {
        day: "2-digit", month: "2-digit", year: "numeric",
        hour: "2-digit", minute: "2-digit",
      });
    } catch { return dateStr; }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-primary" />
            Assinatura Avançada YesClin
          </DialogTitle>
          <DialogDescription>
            Assinatura eletrônica avançada com reautenticação e integridade documental
          </DialogDescription>
        </DialogHeader>

        {alreadySigned ? (
          <div className="flex items-center gap-3 py-6">
            <CheckCircle2 className="h-6 w-6 text-green-600" />
            <div>
              <p className="font-medium text-green-700">Documento já assinado</p>
              <p className="text-sm text-muted-foreground">
                Este documento consolidado já foi assinado e está bloqueado.
              </p>
            </div>
          </div>
        ) : (
          <div className="overflow-y-auto max-h-[65vh] pr-2">
            <div className="space-y-6">
              {/* Steps indicator */}
              <div className="flex items-center gap-4 text-sm">
                <div className={cn("flex items-center gap-2", step === "review" ? "text-primary font-medium" : "text-muted-foreground")}>
                  <div className={cn("h-6 w-6 rounded-full flex items-center justify-center text-xs", step === "review" ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground")}>1</div>
                  Revisão
                </div>
                <div className="h-px flex-1 bg-border" />
                <div className={cn("flex items-center gap-2", step === "authenticate" ? "text-primary font-medium" : "text-muted-foreground")}>
                  <div className={cn("h-6 w-6 rounded-full flex items-center justify-center text-xs", step === "authenticate" ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground")}>2</div>
                  Autenticação
                </div>
              </div>

              {step === "review" && (
                <>
                  {/* Document Summary */}
                  <div className="rounded-lg border bg-muted/30 p-4 space-y-3">
                    <h4 className="font-medium flex items-center gap-2">
                      <FileText className="h-4 w-4" />
                      Resumo do Documento
                    </h4>
                    <div className="grid grid-cols-2 gap-3 text-sm">
                      <div>
                        <span className="text-muted-foreground">Paciente:</span>
                        <p className="font-medium">{patientName || "—"}</p>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Profissional:</span>
                        <p className="font-medium">{professionalName || "—"}</p>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Tipo:</span>
                        <p className="font-medium">Documento Consolidado</p>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Gerado em:</span>
                        <p className="font-medium">{formatDate(generatedAt)}</p>
                      </div>
                    </div>
                  </div>

                  <Separator />

                  {/* Warning */}
                  <Alert variant="destructive" className="border-destructive/50 bg-destructive/10">
                    <AlertTriangle className="h-4 w-4" />
                    <AlertTitle>Ação Irreversível</AlertTitle>
                    <AlertDescription>
                      Após a assinatura, este documento será bloqueado permanentemente.
                      Não será possível editar, excluir ou modificar o conteúdo.
                      Apenas visualização, exportação e adendos serão permitidos.
                    </AlertDescription>
                  </Alert>

                  {/* Confirmations */}
                  <div className="space-y-3">
                    <div className="flex items-start gap-3">
                      <Checkbox
                        id="confirmAccuracyAtt"
                        checked={confirmAccuracy}
                        onCheckedChange={(c) => setConfirmAccuracy(c === true)}
                      />
                      <label htmlFor="confirmAccuracyAtt" className="text-sm leading-relaxed cursor-pointer">
                        Declaro que as informações contidas neste documento são verdadeiras e
                        correspondem fielmente ao atendimento realizado.
                      </label>
                    </div>
                    <div className="flex items-start gap-3">
                      <Checkbox
                        id="confirmIrreversibleAtt"
                        checked={confirmIrreversible}
                        onCheckedChange={(c) => setConfirmIrreversible(c === true)}
                      />
                      <label htmlFor="confirmIrreversibleAtt" className="text-sm leading-relaxed cursor-pointer">
                        Compreendo que esta ação é <strong>irreversível</strong> e que o documento
                        será bloqueado permanentemente após a assinatura.
                      </label>
                    </div>
                  </div>

                  {/* Technical info */}
                  <div className="rounded-lg bg-muted/50 p-4 space-y-2 text-sm">
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <KeyRound className="h-4 w-4" />
                      <span>Reautenticação por senha obrigatória</span>
                    </div>
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <FileCheck className="h-4 w-4" />
                      <span>Hash SHA-256 de integridade</span>
                    </div>
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Lock className="h-4 w-4" />
                      <span>Snapshot imutável do conteúdo</span>
                    </div>
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Clock className="h-4 w-4" />
                      <span>Carimbo de tempo: {new Date().toLocaleString("pt-BR")}</span>
                    </div>
                  </div>
                </>
              )}

              {step === "authenticate" && (
                <>
                  <div className="rounded-lg border bg-muted/30 p-4 space-y-2">
                    <h4 className="font-medium flex items-center gap-2">
                      <User className="h-4 w-4" />
                      Validação de Identidade
                    </h4>
                    <p className="text-sm text-muted-foreground">
                      Para garantir a autenticidade da assinatura, confirme sua identidade digitando sua senha atual.
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="signPasswordAtt" className="flex items-center gap-2">
                      <KeyRound className="h-4 w-4" />
                      Senha Atual
                    </Label>
                    <div className="relative">
                      <Input
                        id="signPasswordAtt"
                        type={showPassword ? "text" : "password"}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="Digite sua senha para confirmar"
                        autoFocus
                        onKeyDown={(e) => {
                          if (e.key === "Enter" && canSign && !signing) handleSign();
                        }}
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7 p-0"
                        onClick={() => setShowPassword(!showPassword)}
                      >
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </Button>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Método: Reautenticação por senha (password_reauth)
                    </p>
                  </div>

                  <Alert className="border-primary/30 bg-primary/5">
                    <Shield className="h-4 w-4" />
                    <AlertTitle>Assinatura Avançada YesClin</AlertTitle>
                    <AlertDescription className="text-xs space-y-1">
                      <p>Ao confirmar, o sistema irá:</p>
                      <ul className="list-disc pl-4 space-y-0.5">
                        <li>Validar sua identidade pela senha</li>
                        <li>Gerar hash SHA-256 do conteúdo final</li>
                        <li>Criar snapshot imutável do documento</li>
                        <li>Registrar IP, navegador e carimbo de tempo</li>
                        <li>Bloquear permanentemente o documento</li>
                      </ul>
                    </AlertDescription>
                  </Alert>
                </>
              )}
            </div>
          </div>
        )}

        <DialogFooter className="border-t pt-4">
          {alreadySigned ? (
            <Button onClick={() => onOpenChange(false)}>Fechar</Button>
          ) : step === "review" ? (
            <>
              <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
              <Button onClick={() => setStep("authenticate")} disabled={!canProceedToAuth}>
                <KeyRound className="h-4 w-4 mr-2" />
                Validar Identidade
              </Button>
            </>
          ) : (
            <>
              <Button variant="outline" onClick={() => setStep("review")} disabled={signing}>
                Voltar
              </Button>
              <Button onClick={handleSign} disabled={!canSign || signing}>
                {signing ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Assinando...
                  </>
                ) : (
                  <>
                    <Shield className="h-4 w-4 mr-2" />
                    Assinar Documento
                  </>
                )}
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─── Notes & History Panel ───────────────────────────────
interface NotesHistoryPanelProps {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  documentId: string;
  clinicId: string;
}

const ACTION_LABELS: Record<string, string> = {
  generated: "Documento gerado",
  printed: "Documento impresso",
  pdf_exported: "PDF exportado",
  signed: "Documento assinado",
  note_added: "Nota adicionada",
  addendum_added: "Adendo registrado",
};

function fmtDateTime(d: string) {
  try {
    return new Date(d).toLocaleString("pt-BR", {
      day: "2-digit", month: "2-digit", year: "numeric",
      hour: "2-digit", minute: "2-digit",
    });
  } catch { return d; }
}

export function NotesHistoryPanel({ open, onOpenChange, documentId, clinicId }: NotesHistoryPanelProps) {
  const { data: notes = [], isLoading: notesLoading } = useDocumentNotes(documentId);
  const { data: history = [], isLoading: histLoading } = useDocumentHistory(documentId);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <History className="h-4 w-4" />
            Notas e Histórico
          </DialogTitle>
        </DialogHeader>
        <Tabs defaultValue="notes" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="notes" className="gap-1.5">
              <StickyNote className="h-3.5 w-3.5" />
              Notas & Adendos ({notes.length})
            </TabsTrigger>
            <TabsTrigger value="history" className="gap-1.5">
              <Clock className="h-3.5 w-3.5" />
              Histórico ({history.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="notes">
            <ScrollArea className="h-[400px] pr-3">
              {notesLoading ? (
                <p className="text-sm text-muted-foreground py-8 text-center">Carregando...</p>
              ) : notes.length === 0 ? (
                <p className="text-sm text-muted-foreground py-8 text-center">Nenhuma nota ou adendo registrado.</p>
              ) : (
                <div className="space-y-3 py-2">
                  {notes.map((n) => (
                    <div key={n.id} className="rounded-lg border p-3 space-y-1">
                      <div className="flex items-center justify-between">
                        <Badge variant={n.note_type === "addendum" ? "default" : "secondary"} className="text-[10px]">
                          {n.note_type === "addendum" ? "Adendo" : "Nota"}
                        </Badge>
                        <span className="text-[10px] text-muted-foreground">{fmtDateTime(n.created_at)}</span>
                      </div>
                      <p className="text-sm whitespace-pre-wrap">{n.content}</p>
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>
          </TabsContent>

          <TabsContent value="history">
            <ScrollArea className="h-[400px] pr-3">
              {histLoading ? (
                <p className="text-sm text-muted-foreground py-8 text-center">Carregando...</p>
              ) : history.length === 0 ? (
                <p className="text-sm text-muted-foreground py-8 text-center">Nenhum registro de ação.</p>
              ) : (
                <div className="relative py-2">
                  {/* Timeline */}
                  <div className="absolute left-3 top-4 bottom-4 w-px bg-border" />
                  <div className="space-y-4">
                    {history.map((h) => (
                      <div key={h.id} className="flex items-start gap-3 pl-1">
                        <div className={cn(
                          "h-5 w-5 rounded-full border-2 bg-background flex items-center justify-center shrink-0 z-10",
                          h.action_type === "signed" ? "border-green-500" :
                          h.action_type === "generated" ? "border-primary" :
                          "border-muted-foreground/40"
                        )}>
                          <div className={cn(
                            "h-2 w-2 rounded-full",
                            h.action_type === "signed" ? "bg-green-500" :
                            h.action_type === "generated" ? "bg-primary" :
                            "bg-muted-foreground/40"
                          )} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium">
                            {ACTION_LABELS[h.action_type] || h.action_type}
                          </p>
                          <p className="text-[10px] text-muted-foreground">{fmtDateTime(h.created_at)}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </ScrollArea>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
