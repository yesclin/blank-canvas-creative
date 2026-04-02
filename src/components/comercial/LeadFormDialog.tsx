import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useCreateLead, useUpdateLead } from "@/hooks/crm/useLeads";
import { useCrmSpecialties, useCrmProcedures, useCrmUsers } from "@/hooks/crm/useCrmOptions";
import { LEAD_SOURCES, LEAD_STATUSES, type CrmLead } from "@/types/crm";
import { Loader2 } from "lucide-react";

interface LeadFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editLead?: CrmLead | null;
}

export function LeadFormDialog({ open, onOpenChange, editLead }: LeadFormDialogProps) {
  const isEditing = !!editLead;
  const createLead = useCreateLead();
  const updateLead = useUpdateLead();
  const { data: specialties } = useCrmSpecialties();
  const { data: procedures } = useCrmProcedures();
  const { data: users } = useCrmUsers();

  const [form, setForm] = useState({
    name: editLead?.name || "",
    email: editLead?.email || "",
    phone: editLead?.phone || "",
    birth_date: editLead?.birth_date || "",
    gender: editLead?.gender || "",
    source: editLead?.source || "",
    campaign_name: editLead?.campaign_name || "",
    specialty_interest_id: editLead?.specialty_interest_id || "",
    procedure_interest_id: editLead?.procedure_interest_id || "",
    status: editLead?.status || "novo",
    notes: editLead?.notes || "",
    assigned_to: editLead?.assigned_to || "",
  });

  const isPending = createLead.isPending || updateLead.isPending;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) return;

    const payload = {
      name: form.name,
      email: form.email || undefined,
      phone: form.phone || undefined,
      birth_date: form.birth_date || undefined,
      gender: form.gender || undefined,
      source: form.source || undefined,
      campaign_name: form.campaign_name || undefined,
      specialty_interest_id: form.specialty_interest_id || undefined,
      procedure_interest_id: form.procedure_interest_id || undefined,
      status: form.status,
      notes: form.notes || undefined,
      assigned_to: form.assigned_to || undefined,
    };

    if (isEditing) {
      await updateLead.mutateAsync({ id: editLead.id, ...payload });
    } else {
      await createLead.mutateAsync(payload);
    }
    onOpenChange(false);
  };

  const set = (field: string, value: string) => setForm(prev => ({ ...prev, [field]: value }));

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEditing ? "Editar Lead" : "Novo Lead"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <Label htmlFor="name">Nome *</Label>
              <Input id="name" value={form.name} onChange={e => set("name", e.target.value)} required maxLength={200} />
            </div>
            <div>
              <Label htmlFor="phone">Telefone</Label>
              <Input id="phone" value={form.phone} onChange={e => set("phone", e.target.value)} maxLength={20} />
            </div>
            <div>
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" value={form.email} onChange={e => set("email", e.target.value)} maxLength={255} />
            </div>
            <div>
              <Label htmlFor="birth_date">Data de Nascimento</Label>
              <Input id="birth_date" type="date" value={form.birth_date} onChange={e => set("birth_date", e.target.value)} />
            </div>
            <div>
              <Label>Gênero</Label>
              <Select value={form.gender} onValueChange={v => set("gender", v)}>
                <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="masculino">Masculino</SelectItem>
                  <SelectItem value="feminino">Feminino</SelectItem>
                  <SelectItem value="outro">Outro</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Origem</Label>
              <Select value={form.source} onValueChange={v => set("source", v)}>
                <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                <SelectContent>
                  {LEAD_SOURCES.map(s => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="campaign_name">Nome da Campanha</Label>
              <Input id="campaign_name" value={form.campaign_name} onChange={e => set("campaign_name", e.target.value)} maxLength={200} />
            </div>
            <div>
              <Label>Especialidade de Interesse</Label>
              <Select value={form.specialty_interest_id} onValueChange={v => set("specialty_interest_id", v)}>
                <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                <SelectContent>
                  {(specialties || []).map((s: any) => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Procedimento de Interesse</Label>
              <Select value={form.procedure_interest_id} onValueChange={v => set("procedure_interest_id", v)}>
                <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                <SelectContent>
                  {(procedures || []).map((p: any) => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Status</Label>
              <Select value={form.status} onValueChange={v => set("status", v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {LEAD_STATUSES.map(s => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Responsável</Label>
              <Select value={form.assigned_to} onValueChange={v => set("assigned_to", v)}>
                <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                <SelectContent>
                  {(users || []).map((u: any) => <SelectItem key={u.id} value={u.id}>{u.name}</SelectItem>)}
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
            <Button type="submit" disabled={isPending || !form.name.trim()}>
              {isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              {isEditing ? "Salvar" : "Criar Lead"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
