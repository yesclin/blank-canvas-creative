import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useCreateFollowup, useUpdateFollowup } from "@/hooks/crm/useFollowups";
import { useCrmUsers, useCrmLeadsForSelect } from "@/hooks/crm/useCrmOptions";
import { FOLLOWUP_TYPES } from "@/types/followup";
import type { CrmFollowup } from "@/types/followup";
import { Loader2 } from "lucide-react";

interface FollowupDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editFollowup?: CrmFollowup | null;
  prefillLeadId?: string;
  prefillOpportunityId?: string;
}

export function FollowupDialog({ open, onOpenChange, editFollowup, prefillLeadId, prefillOpportunityId }: FollowupDialogProps) {
  const isEditing = !!editFollowup;
  const createFollowup = useCreateFollowup();
  const updateFollowup = useUpdateFollowup();
  const { data: users } = useCrmUsers();
  const { data: leads } = useCrmLeadsForSelect();

  const getDefaultDateTime = () => {
    const d = new Date();
    d.setHours(d.getHours() + 1, 0, 0, 0);
    return d.toISOString().slice(0, 16);
  };

  const [form, setForm] = useState({
    subject: "",
    followup_type: "ligacao",
    scheduled_at: getDefaultDateTime(),
    lead_id: prefillLeadId || "",
    opportunity_id: prefillOpportunityId || "",
    assigned_to: "",
    notes: "",
  });

  useEffect(() => {
    if (open) {
      if (editFollowup) {
        setForm({
          subject: editFollowup.subject || "",
          followup_type: editFollowup.followup_type,
          scheduled_at: editFollowup.scheduled_at?.slice(0, 16) || getDefaultDateTime(),
          lead_id: editFollowup.lead_id || "",
          opportunity_id: editFollowup.opportunity_id || "",
          assigned_to: editFollowup.assigned_to || "",
          notes: editFollowup.notes || "",
        });
      } else {
        setForm({
          subject: "",
          followup_type: "ligacao",
          scheduled_at: getDefaultDateTime(),
          lead_id: prefillLeadId || "",
          opportunity_id: prefillOpportunityId || "",
          assigned_to: "",
          notes: "",
        });
      }
    }
  }, [open, editFollowup, prefillLeadId, prefillOpportunityId]);

  const isPending = createFollowup.isPending || updateFollowup.isPending;
  const set = (field: string, value: string) => setForm(prev => ({ ...prev, [field]: value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.scheduled_at) return;

    const payload = {
      followup_type: form.followup_type,
      subject: form.subject || undefined,
      scheduled_at: new Date(form.scheduled_at).toISOString(),
      lead_id: form.lead_id || undefined,
      opportunity_id: form.opportunity_id || undefined,
      assigned_to: form.assigned_to || undefined,
      notes: form.notes || undefined,
    };

    if (isEditing) {
      await updateFollowup.mutateAsync({ id: editFollowup.id, ...payload });
    } else {
      await createFollowup.mutateAsync(payload);
    }
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEditing ? "Editar Follow-up" : "Novo Follow-up"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="subject">Assunto</Label>
            <Input id="subject" value={form.subject} onChange={e => set("subject", e.target.value)} placeholder="Ex: Retorno sobre orçamento" maxLength={300} />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Tipo *</Label>
              <Select value={form.followup_type} onValueChange={v => set("followup_type", v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {FOLLOWUP_TYPES.map(t => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="scheduled_at">Data/Hora *</Label>
              <Input id="scheduled_at" type="datetime-local" value={form.scheduled_at} onChange={e => set("scheduled_at", e.target.value)} required />
            </div>
          </div>

          <div>
            <Label>Lead</Label>
            <Select value={form.lead_id} onValueChange={v => set("lead_id", v)}>
              <SelectTrigger><SelectValue placeholder="Vincular a um lead" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="">Nenhum</SelectItem>
                {(leads || []).map((l: any) => (
                  <SelectItem key={l.id} value={l.id}>{l.name}{l.phone ? ` - ${l.phone}` : ""}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label>Responsável</Label>
            <Select value={form.assigned_to} onValueChange={v => set("assigned_to", v)}>
              <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="">Nenhum</SelectItem>
                {(users || []).map((u: any) => <SelectItem key={u.id} value={u.id}>{u.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="notes">Observações</Label>
            <Textarea id="notes" value={form.notes} onChange={e => set("notes", e.target.value)} maxLength={2000} rows={3} />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
            <Button type="submit" disabled={isPending || !form.scheduled_at}>
              {isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              {isEditing ? "Salvar" : "Criar Follow-up"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
