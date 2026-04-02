import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Loader2, AlertCircle, UserCheck } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useConvertLeadToPatient, type LeadToPatientData } from "@/hooks/crm/useConversions";
import type { CrmLead } from "@/types/crm";

interface LeadToPatientDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  lead: CrmLead | null;
}

interface MatchedPatient {
  id: string;
  full_name: string;
  phone: string | null;
  email: string | null;
  cpf: string | null;
}

export function LeadToPatientDialog({ open, onOpenChange, lead }: LeadToPatientDialogProps) {
  const convert = useConvertLeadToPatient();
  const [mode, setMode] = useState<"new" | "existing">("new");
  const [matches, setMatches] = useState<MatchedPatient[]>([]);
  const [selectedPatientId, setSelectedPatientId] = useState("");
  const [searching, setSearching] = useState(false);

  const [form, setForm] = useState({
    full_name: "",
    email: "",
    phone: "",
    cpf: "",
    birth_date: "",
    gender: "",
  });

  // Pre-fill from lead & search duplicates
  useEffect(() => {
    if (!lead || !open) return;
    setForm({
      full_name: lead.name || "",
      email: lead.email || "",
      phone: lead.phone || "",
      cpf: "",
      birth_date: lead.birth_date || "",
      gender: lead.gender || "",
    });
    setMode("new");
    setSelectedPatientId("");

    // Search for potential duplicates
    const searchDuplicates = async () => {
      setSearching(true);
      const conditions: string[] = [];
      if (lead.phone) conditions.push(`phone.eq.${lead.phone}`);
      if (lead.email) conditions.push(`email.eq.${lead.email}`);

      if (conditions.length === 0) {
        setMatches([]);
        setSearching(false);
        return;
      }

      const { data } = await supabase
        .from("patients")
        .select("id, full_name, phone, email, cpf")
        .or(conditions.join(","))
        .limit(10);

      setMatches(data || []);
      setSearching(false);
    };

    searchDuplicates();
  }, [lead, open]);

  if (!lead) return null;

  const alreadyConverted = !!lead.converted_patient_id;

  const handleSubmit = async () => {
    if (alreadyConverted) return;

    const payload: LeadToPatientData = {
      leadId: lead.id,
    };

    if (mode === "existing" && selectedPatientId) {
      payload.existingPatientId = selectedPatientId;
    } else {
      payload.patientData = {
        full_name: form.full_name.trim(),
        email: form.email.trim() || undefined,
        phone: form.phone.trim() || undefined,
        cpf: form.cpf.trim() || undefined,
        birth_date: form.birth_date || undefined,
        gender: form.gender || undefined,
      };
    }

    await convert.mutateAsync(payload);
    onOpenChange(false);
  };

  const canSubmit = mode === "existing"
    ? !!selectedPatientId
    : form.full_name.trim().length > 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UserCheck className="h-5 w-5" /> Converter Lead em Paciente
          </DialogTitle>
          <DialogDescription>
            Converta o lead <strong>{lead.name}</strong> em um paciente.
          </DialogDescription>
        </DialogHeader>

        {alreadyConverted ? (
          <div className="flex items-center gap-2 text-sm text-muted-foreground py-4">
            <AlertCircle className="h-4 w-4" />
            Este lead já foi convertido em paciente.
          </div>
        ) : (
          <div className="space-y-4">
            {/* Duplicate warning */}
            {matches.length > 0 && (
              <div className="border border-amber-200 bg-amber-50 dark:bg-amber-950/20 dark:border-amber-800 rounded-md p-3 space-y-2">
                <p className="text-sm font-medium text-amber-800 dark:text-amber-300 flex items-center gap-1">
                  <AlertCircle className="h-4 w-4" />
                  Possíveis pacientes duplicados encontrados
                </p>
                <RadioGroup value={mode === "existing" ? selectedPatientId : ""} onValueChange={(v) => {
                  setMode("existing");
                  setSelectedPatientId(v);
                }}>
                  {matches.map(p => (
                    <div key={p.id} className="flex items-center gap-2 text-sm">
                      <RadioGroupItem value={p.id} id={`patient-${p.id}`} />
                      <Label htmlFor={`patient-${p.id}`} className="font-normal cursor-pointer">
                        {p.full_name} {p.phone && `• ${p.phone}`} {p.email && `• ${p.email}`}
                      </Label>
                    </div>
                  ))}
                </RadioGroup>
                <Button variant="ghost" size="sm" className="text-xs" onClick={() => { setMode("new"); setSelectedPatientId(""); }}>
                  Criar novo paciente
                </Button>
              </div>
            )}

            {mode === "new" && (
              <div className="space-y-3">
                <div>
                  <Label htmlFor="full_name">Nome Completo *</Label>
                  <Input id="full_name" value={form.full_name} onChange={e => setForm(p => ({ ...p, full_name: e.target.value }))} />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label htmlFor="phone">Telefone</Label>
                    <Input id="phone" value={form.phone} onChange={e => setForm(p => ({ ...p, phone: e.target.value }))} />
                  </div>
                  <div>
                    <Label htmlFor="email">Email</Label>
                    <Input id="email" type="email" value={form.email} onChange={e => setForm(p => ({ ...p, email: e.target.value }))} />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label htmlFor="cpf">CPF</Label>
                    <Input id="cpf" value={form.cpf} onChange={e => setForm(p => ({ ...p, cpf: e.target.value }))} />
                  </div>
                  <div>
                    <Label htmlFor="birth_date">Data de Nascimento</Label>
                    <Input id="birth_date" type="date" value={form.birth_date} onChange={e => setForm(p => ({ ...p, birth_date: e.target.value }))} />
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
          {!alreadyConverted && (
            <Button onClick={handleSubmit} disabled={!canSubmit || convert.isPending}>
              {convert.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              {mode === "existing" ? "Vincular Paciente" : "Criar Paciente"}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
