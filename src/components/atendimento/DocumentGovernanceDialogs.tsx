import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
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

// ─── Sign Document Dialog ────────────────────────────────
interface SignDialogProps {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  documentId: string;
  clinicId: string;
  alreadySigned: boolean;
}

export function SignDocumentDialog({ open, onOpenChange, documentId, clinicId, alreadySigned }: SignDialogProps) {
  const signDoc = useSignDocument();

  const handleSign = async () => {
    await signDoc.mutateAsync({ documentId, clinicId });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <PenTool className="h-4 w-4" />
            Assinar Documento
          </DialogTitle>
        </DialogHeader>
        {alreadySigned ? (
          <div className="flex items-center gap-2 text-sm text-green-600 py-4">
            <CheckCircle2 className="h-5 w-5" />
            <span>Este documento já foi assinado.</span>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="rounded-lg border border-amber-200 bg-amber-50 dark:bg-amber-950/20 p-3">
              <div className="flex items-start gap-2">
                <AlertTriangle className="h-4 w-4 text-amber-600 mt-0.5" />
                <div className="text-xs text-amber-800 dark:text-amber-200">
                  <p className="font-medium">Atenção</p>
                  <p className="mt-1">
                    Ao assinar, você confirma que revisou o conteúdo do documento consolidado e que as informações estão corretas.
                    Esta ação é irreversível.
                  </p>
                </div>
              </div>
            </div>
            <div className="rounded-lg border p-4 text-center space-y-2">
              <Shield className="h-8 w-8 mx-auto text-muted-foreground/40" />
              <p className="text-xs text-muted-foreground">
                Assinatura via autenticação do sistema.<br />
                Futuras integrações com certificado digital serão suportadas.
              </p>
            </div>
          </div>
        )}
        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>Cancelar</Button>
          {!alreadySigned && (
            <Button onClick={handleSign} disabled={signDoc.isPending}>
              {signDoc.isPending ? "Assinando..." : "Confirmar Assinatura"}
            </Button>
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
