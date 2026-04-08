import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus, Send, X } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useClinicalAddendums, type AddendumInput, type ClinicalAddendum } from "@/hooks/prontuario/useClinicalAddendums";
import type { RecordEditability } from "@/hooks/prontuario/useRecordEditability";
import { Separator } from "@/components/ui/separator";

interface Props {
  recordType: string;
  recordId: string;
  patientId: string;
  professionalId: string;
  specialtyId?: string | null;
  moduleOrigin?: string;
  editability: RecordEditability;
}

/**
 * Combined component: shows addendum list + add form when record is locked.
 */
export function AddendumSection({
  recordType,
  recordId,
  patientId,
  professionalId,
  specialtyId,
  moduleOrigin,
  editability,
}: Props) {
  const { addendums, isLoading, createAddendum, isCreating } = useClinicalAddendums(recordType, recordId);
  const [showForm, setShowForm] = useState(false);
  const [content, setContent] = useState("");
  const [reason, setReason] = useState("");

  const canAddAddendum = !editability.canEdit && !editability.isLoading;
  const needsReason = editability.requiresAddendumJustification;

  const handleSubmit = async () => {
    if (!content.trim()) return;
    if (needsReason && !reason.trim()) return;

    await createAddendum({
      patient_id: patientId,
      record_type: recordType,
      record_id: recordId,
      specialty_id: specialtyId,
      professional_id: professionalId,
      content: content.trim(),
      reason: reason.trim() || undefined,
      module_origin: moduleOrigin,
    });

    setContent("");
    setReason("");
    setShowForm(false);
  };

  return (
    <div className="space-y-3">
      {/* Addendum list */}
      {addendums.length > 0 && (
        <div className="space-y-2">
          <Separator />
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
            Adendos ({addendums.length})
          </p>
          {addendums.map((a) => (
            <AddendumCard key={a.id} addendum={a} />
          ))}
        </div>
      )}

      {/* Add button (only when locked) */}
      {canAddAddendum && !showForm && (
        <Button
          variant="outline"
          size="sm"
          onClick={() => setShowForm(true)}
          className="gap-1.5"
        >
          <Plus className="h-3.5 w-3.5" />
          Adicionar adendo
        </Button>
      )}

      {/* Form */}
      {showForm && (
        <div className="border rounded-md p-3 space-y-3 bg-muted/30">
          <p className="text-sm font-medium">Novo adendo</p>
          <div className="space-y-1.5">
            <Label htmlFor="addendum-content" className="text-xs">
              Conteúdo do adendo *
            </Label>
            <Textarea
              id="addendum-content"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Descreva o complemento ao registro..."
              rows={4}
              className="text-sm"
            />
          </div>
          {needsReason && (
            <div className="space-y-1.5">
              <Label htmlFor="addendum-reason" className="text-xs">
                Motivo do adendo *
              </Label>
              <Input
                id="addendum-reason"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Motivo para o complemento..."
                className="text-sm"
              />
            </div>
          )}
          <div className="flex gap-2">
            <Button
              size="sm"
              onClick={handleSubmit}
              disabled={isCreating || !content.trim() || (needsReason && !reason.trim())}
              className="gap-1.5"
            >
              <Send className="h-3.5 w-3.5" />
              Salvar adendo
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => {
                setShowForm(false);
                setContent("");
                setReason("");
              }}
            >
              <X className="h-3.5 w-3.5" />
              Cancelar
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

function AddendumCard({ addendum }: { addendum: ClinicalAddendum }) {
  return (
    <div className="border-l-2 border-primary/40 pl-3 py-2 space-y-1">
      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        <span className="font-medium">{addendum.professional_name}</span>
        <span>•</span>
        <span>
          {format(new Date(addendum.created_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
        </span>
        {addendum.reason && (
          <>
            <span>•</span>
            <span className="italic">Motivo: {addendum.reason}</span>
          </>
        )}
      </div>
      <p className="text-sm whitespace-pre-wrap">{addendum.content}</p>
    </div>
  );
}
