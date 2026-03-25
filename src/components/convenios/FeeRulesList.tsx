import { useState } from "react";
import { Settings, Plus, Search, Edit, Percent, DollarSign } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import type { InsuranceFeeRule, Insurance, FeeType } from "@/types/convenios";
import { feeTypeLabels } from "@/types/convenios";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useCreateFeeRule } from "@/hooks/useConveniosData";
import { toast } from "sonner";

const useProcedureOptions = () => useQuery({
  queryKey: ["procedures-options"],
  queryFn: async () => {
    const { data } = await supabase.from("procedures").select("id, name").eq("is_active", true).order("name");
    return (data || []).map(p => ({ id: p.id, name: p.name }));
  },
});
const useProfessionalOptions = () => useQuery({
  queryKey: ["professionals-options"],
  queryFn: async () => {
    const { data } = await supabase.from("professionals").select("id, full_name").eq("is_active", true).order("full_name");
    return (data || []).map(p => ({ id: p.id, name: p.full_name }));
  },
});

interface FeeRulesListProps {
  feeRules: InsuranceFeeRule[];
  insurances: Insurance[];
}

export function FeeRulesList({ feeRules, insurances }: FeeRulesListProps) {
  const { data: procedureOptions = [] } = useProcedureOptions();
  const { data: professionalOptions = [] } = useProfessionalOptions();
  const createFeeRule = useCreateFeeRule();
  const [search, setSearch] = useState("");
  const [insuranceFilter, setInsuranceFilter] = useState<string>("all");
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const [form, setForm] = useState({
    insurance_id: '',
    procedure_id: '',
    professional_id: '',
    fee_type: 'percentage' as FeeType,
    fee_value: '',
    payment_deadline_days: '30',
    description: '',
  });

  const resetForm = () => setForm({
    insurance_id: '', procedure_id: '', professional_id: '',
    fee_type: 'percentage', fee_value: '', payment_deadline_days: '30', description: '',
  });

  const filteredRules = feeRules.filter((rule) => {
    const matchesSearch =
      rule.insurance_name?.toLowerCase().includes(search.toLowerCase()) ||
      rule.procedure_name?.toLowerCase().includes(search.toLowerCase()) ||
      rule.professional_name?.toLowerCase().includes(search.toLowerCase()) ||
      rule.description?.toLowerCase().includes(search.toLowerCase());
    const matchesInsurance = insuranceFilter === "all" || rule.insurance_id === insuranceFilter;
    return matchesSearch && matchesInsurance;
  });

  const formatValue = (rule: InsuranceFeeRule) => {
    if (rule.fee_type === 'percentage') return `${rule.fee_value}%`;
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(rule.fee_value);
  };

  const handleSave = () => {
    if (!form.insurance_id || !form.fee_value) {
      toast.error('Convênio e valor são obrigatórios');
      return;
    }
    createFeeRule.mutate({
      insurance_id: form.insurance_id,
      fee_type: form.fee_type,
      fee_value: parseFloat(form.fee_value),
      payment_deadline_days: parseInt(form.payment_deadline_days) || 30,
      description: form.description || undefined,
      professional_id: form.professional_id && form.professional_id !== 'all' ? form.professional_id : undefined,
      procedure_id: form.procedure_id && form.procedure_id !== 'all' ? form.procedure_id : undefined,
    }, {
      onSuccess: () => { setIsDialogOpen(false); resetForm(); },
    });
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex flex-col sm:flex-row gap-2 flex-1">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Buscar regra..." className="pl-9" value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
          <Select value={insuranceFilter} onValueChange={setInsuranceFilter}>
            <SelectTrigger className="w-[180px]"><SelectValue placeholder="Convênio" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos Convênios</SelectItem>
              {insurances.filter(i => i.is_active).map((ins) => (
                <SelectItem key={ins.id} value={ins.id}>{ins.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <Button onClick={() => { resetForm(); setIsDialogOpen(true); }}>
          <Plus className="h-4 w-4 mr-2" />Nova Regra
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Settings className="h-5 w-5" />Regras de Repasse</CardTitle>
          <CardDescription>Configure o percentual ou valor fixo de repasse para profissionais por convênio</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Convênio</TableHead>
                <TableHead>Procedimento</TableHead>
                <TableHead>Profissional</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead className="text-right">Valor Repasse</TableHead>
                <TableHead>Prazo (dias)</TableHead>
                <TableHead>Descrição</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredRules.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={9} className="text-center text-muted-foreground py-8">
                    Nenhuma regra de repasse encontrada
                  </TableCell>
                </TableRow>
              ) : (
                filteredRules.map((rule) => (
                  <TableRow key={rule.id}>
                    <TableCell className="font-medium">{rule.insurance_name}</TableCell>
                    <TableCell>{rule.procedure_name || 'Todos'}</TableCell>
                    <TableCell>{rule.professional_name || 'Todos'}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className="flex items-center gap-1 w-fit">
                        {rule.fee_type === 'percentage' ? <Percent className="h-3 w-3" /> : <DollarSign className="h-3 w-3" />}
                        {feeTypeLabels[rule.fee_type]}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right font-medium">{formatValue(rule)}</TableCell>
                    <TableCell>{rule.payment_deadline_days}</TableCell>
                    <TableCell className="max-w-[200px] truncate">{rule.description || '-'}</TableCell>
                    <TableCell>
                      <Badge variant={rule.is_active ? "default" : "secondary"}>
                        {rule.is_active ? "Ativo" : "Inativo"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="icon"><Edit className="h-4 w-4" /></Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Nova Regra de Repasse</DialogTitle>
            <DialogDescription>Configure o repasse para profissionais por convênio</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label>Convênio *</Label>
              <Select value={form.insurance_id} onValueChange={(v) => setForm(p => ({ ...p, insurance_id: v }))}>
                <SelectTrigger><SelectValue placeholder="Selecione o convênio" /></SelectTrigger>
                <SelectContent>
                  {insurances.filter(i => i.is_active).map((ins) => (
                    <SelectItem key={ins.id} value={ins.id}>{ins.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label>Procedimento (opcional)</Label>
              <Select value={form.procedure_id} onValueChange={(v) => setForm(p => ({ ...p, procedure_id: v }))}>
                <SelectTrigger><SelectValue placeholder="Todos os procedimentos" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os procedimentos</SelectItem>
                  {procedureOptions.map((proc) => (
                    <SelectItem key={proc.id} value={proc.id}>{proc.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label>Profissional (opcional)</Label>
              <Select value={form.professional_id} onValueChange={(v) => setForm(p => ({ ...p, professional_id: v }))}>
                <SelectTrigger><SelectValue placeholder="Todos os profissionais" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os profissionais</SelectItem>
                  {professionalOptions.map((prof) => (
                    <SelectItem key={prof.id} value={prof.id}>{prof.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label>Tipo de Repasse *</Label>
                <Select value={form.fee_type} onValueChange={(v) => setForm(p => ({ ...p, fee_type: v as FeeType }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="percentage">Percentual</SelectItem>
                    <SelectItem value="fixed">Valor Fixo</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label>Valor *</Label>
                <Input type="number" min="0" step="0.01" placeholder="50" value={form.fee_value}
                  onChange={(e) => setForm(p => ({ ...p, fee_value: e.target.value }))} />
              </div>
            </div>
            <div className="grid gap-2">
              <Label>Prazo de Pagamento (dias)</Label>
              <Input type="number" min="0" value={form.payment_deadline_days}
                onChange={(e) => setForm(p => ({ ...p, payment_deadline_days: e.target.value }))} />
            </div>
            <div className="grid gap-2">
              <Label>Descrição</Label>
              <Textarea placeholder="Descrição da regra..." value={form.description}
                onChange={(e) => setForm(p => ({ ...p, description: e.target.value }))} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>Cancelar</Button>
            <Button onClick={handleSave} disabled={createFeeRule.isPending}>
              {createFeeRule.isPending ? 'Salvando...' : 'Salvar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
