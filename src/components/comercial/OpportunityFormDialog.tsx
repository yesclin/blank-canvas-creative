import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useCreateOpportunity, useUpdateOpportunity } from "@/hooks/crm/useOpportunities";
import { useCrmSpecialties, useCrmProcedures, useCrmProfessionals, useCrmUsers, useCrmLeadsForSelect } from "@/hooks/crm/useCrmOptions";
import { OPPORTUNITY_STATUSES, type CrmOpportunity, type CrmLead } from "@/types/crm";
import { Loader2 } from "lucide-react";

interface OpportunityFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editOpportunity?: CrmOpportunity | null;
  prefillLead?: CrmLead | null;
}

export function OpportunityFormDialog({ open, onOpenChange, editOpportunity, prefillLead }: OpportunityFormDialogProps) {
  const isEditing = !!editOpportunity;
  const createOpp = useCreateOpportunity();
  const updateOpp = useUpdateOpportunity();
  const { data: specialties } = useCrmSpecialties();
  const { data: procedures } = useCrmProcedures();
  const { data: professionals } = useCrmProfessionals();
  const { data: users } = useCrmUsers();
  const { data: leads } = useCrmLeadsForSelect();

  const [form, setForm] = useState({
    title: editOpportunity?.title || (prefillLead ? `Oportunidade - ${prefillLead.name}` : ""),
    lead_id: editOpportunity?.lead_id || prefillLead?.id || "",
    specialty_id: editOpportunity?.specialty_id || prefillLead?.specialty_interest_id || "",
    procedure_id: editOpportunity?.procedure_id || prefillLead?.procedure_interest_id || "",
    professional_id: editOpportunity?.professional_id || "",
    estimated_value: editOpportunity?.estimated_value?.toString() || "",
    closing_probability: editOpportunity?.closing_probability?.toString() || "0",
    expected_close_date: editOpportunity?.expected_close_date || "",
    assigned_to_user_id: editOpportunity?.assigned_to_user_id || prefillLead?.assigned_to || "",
    status: editOpportunity?.status || "aberta",
    notes: editOpportunity?.notes || "",
  });

  const isPending = createOpp.isPending || updateOpp.isPending;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim()) return;

    const payload = {
      title: form.title,
      lead_id: form.lead_id || undefined,
      specialty_id: form.specialty_id || undefined,
      procedure_id: form.procedure_id || undefined,
      professional_id: form.professional_id || undefined,
      estimated_value: form.estimated_value ? parseFloat(form.estimated_value) : undefined,
      closing_probability: form.closing_probability ? parseInt(form.closing_probability) : 0,
      expected_close_date: form.expected_close_date || undefined,
      assigned_to_user_id: form.assigned_to_user_id || undefined,
      status: form.status,
      notes: form.notes || undefined,
    };

    if (isEditing) {
      await updateOpp.mutateAsync({ id: editOpportunity.id, ...payload });
    } else {
      await createOpp.mutateAsync(payload);
    }
    onOpenChange(false);
  };

  const set = (field: string, value: string) => setForm(prev => ({ ...prev, [field]: value }));

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEditing ? "Editar Oportunidade" : "Nova Oportunidade"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <Label htmlFor="title">Título *</Label>
              <Input id="title" value={form.title} onChange={e => set("title", e.target.value)} required maxLength={300} />
            </div>
            <div className="col-span-2">
              <Label>Lead</Label>
              <Select value={form.lead_id} onValueChange={v => set("lead_id", v)}>
                <SelectTrigger><SelectValue placeholder="Vincular a um lead" /></SelectTrigger>
                <SelectContent>
                  {(leads || []).map((l: any) => (
                    <SelectItem key={l.id} value={l.id}>{l.name}{l.phone ? ` - ${l.phone}` : ""}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Especialidade</Label>
              <Select value={form.specialty_id} onValueChange={v => set("specialty_id", v)}>
                <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                <SelectContent>
                  {(specialties || []).map((s: any) => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Procedimento</Label>
              <Select value={form.procedure_id} onValueChange={v => set("procedure_id", v)}>
                <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                <SelectContent>
                  {(procedures || []).map((p: any) => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Profissional</Label>
              <Select value={form.professional_id} onValueChange={v => set("professional_id", v)}>
                <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                <SelectContent>
                  {(professionals || []).map((p: any) => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Responsável</Label>
              <Select value={form.assigned_to_user_id} onValueChange={v => set("assigned_to_user_id", v)}>
                <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                <SelectContent>
                  {(users || []).map((u: any) => <SelectItem key={u.id} value={u.id}>{u.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="estimated_value">Valor Estimado (R$)</Label>
              <Input id="estimated_value" type="number" step="0.01" min="0" value={form.estimated_value} onChange={e => set("estimated_value", e.target.value)} />
            </div>
            <div>
              <Label htmlFor="closing_probability">Probabilidade (%)</Label>
              <Input id="closing_probability" type="number" min="0" max="100" value={form.closing_probability} onChange={e => set("closing_probability", e.target.value)} />
            </div>
            <div>
              <Label htmlFor="expected_close_date">Previsão de Fechamento</Label>
              <Input id="expected_close_date" type="date" value={form.expected_close_date} onChange={e => set("expected_close_date", e.target.value)} />
            </div>
            <div>
              <Label>Status</Label>
              <Select value={form.status} onValueChange={v => set("status", v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {OPPORTUNITY_STATUSES.map(s => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div>
            <Label htmlFor="notes">Observações</Label>
            <Textarea id="notes" value={form.notes} onChange={e => set("notes", e.target.value)} maxLength={2000} rows={3} />
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
            <Button type="submit" disabled={isPending || !form.title.trim()}>
              {isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              {isEditing ? "Salvar" : "Criar Oportunidade"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
