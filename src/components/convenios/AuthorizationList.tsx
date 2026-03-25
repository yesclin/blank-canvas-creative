import { useState } from "react";
import { FileCheck, Plus, Search, Clock, CheckCircle, XCircle, Edit } from "lucide-react";
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
import type { InsuranceAuthorization, AuthorizationStatus, Insurance } from "@/types/convenios";
import { authorizationStatusLabels, authorizationStatusColors } from "@/types/convenios";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useCreateAuthorization } from "@/hooks/useConveniosData";
import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import { toast } from "sonner";

const useProcedureOptions = () => useQuery({
  queryKey: ["procedures-options"],
  queryFn: async () => {
    const { data } = await supabase.from("procedures").select("id, name").eq("is_active", true).order("name");
    return (data || []).map(p => ({ id: p.id, name: p.name }));
  },
});

interface AuthorizationListProps {
  authorizations: InsuranceAuthorization[];
  insurances: Insurance[];
  patients: Array<{ id: string; name: string }>;
}

export function AuthorizationList({ authorizations, insurances, patients }: AuthorizationListProps) {
  const { data: procedureOptions = [] } = useProcedureOptions();
  const createAuth = useCreateAuthorization();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const [form, setForm] = useState({
    insurance_id: '',
    patient_id: '',
    procedure_id: '',
    authorization_number: '',
    authorization_date: new Date().toISOString().split('T')[0],
    status: 'pendente',
    valid_until: '',
    notes: '',
  });

  const resetForm = () => setForm({
    insurance_id: '', patient_id: '', procedure_id: '',
    authorization_number: '', authorization_date: new Date().toISOString().split('T')[0],
    status: 'pendente', valid_until: '', notes: '',
  });

  const filteredAuthorizations = authorizations.filter((auth) => {
    const matchesSearch =
      auth.authorization_number.toLowerCase().includes(search.toLowerCase()) ||
      auth.patient_name?.toLowerCase().includes(search.toLowerCase()) ||
      auth.insurance_name?.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === "all" || auth.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const getStatusIcon = (status: AuthorizationStatus) => {
    switch (status) {
      case 'pendente': return <Clock className="h-3 w-3" />;
      case 'aprovada': return <CheckCircle className="h-3 w-3" />;
      case 'negada': return <XCircle className="h-3 w-3" />;
      case 'utilizada': return <FileCheck className="h-3 w-3" />;
    }
  };

  const handleSave = () => {
    if (!form.insurance_id || !form.patient_id || !form.authorization_number) {
      toast.error('Convênio, paciente e número de autorização são obrigatórios');
      return;
    }
    createAuth.mutate({
      insurance_id: form.insurance_id,
      patient_id: form.patient_id,
      procedure_id: form.procedure_id || undefined,
      authorization_number: form.authorization_number,
      notes: form.notes || undefined,
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
            <Input placeholder="Buscar autorização..." className="pl-9" value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[150px]"><SelectValue placeholder="Status" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos Status</SelectItem>
              <SelectItem value="pendente">Pendente</SelectItem>
              <SelectItem value="aprovada">Aprovada</SelectItem>
              <SelectItem value="negada">Negada</SelectItem>
              <SelectItem value="utilizada">Utilizada</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <Button onClick={() => { resetForm(); setIsDialogOpen(true); }}>
          <Plus className="h-4 w-4 mr-2" />Nova Autorização
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><FileCheck className="h-5 w-5" />Autorizações de Procedimentos</CardTitle>
          <CardDescription>Controle de autorizações solicitadas aos convênios</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nº Autorização</TableHead>
                <TableHead>Convênio</TableHead>
                <TableHead>Paciente</TableHead>
                <TableHead>Procedimento</TableHead>
                <TableHead>Data</TableHead>
                <TableHead>Validade</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredAuthorizations.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center text-muted-foreground py-8">
                    Nenhuma autorização encontrada
                  </TableCell>
                </TableRow>
              ) : (
                filteredAuthorizations.map((auth) => (
                  <TableRow key={auth.id}>
                    <TableCell className="font-mono font-medium">{auth.authorization_number}</TableCell>
                    <TableCell>{auth.insurance_name}</TableCell>
                    <TableCell>{auth.patient_name}</TableCell>
                    <TableCell>{auth.procedure_name || '-'}</TableCell>
                    <TableCell>
                      {auth.authorization_date ? format(parseISO(auth.authorization_date), 'dd/MM/yyyy', { locale: ptBR }) : '-'}
                    </TableCell>
                    <TableCell>
                      {auth.valid_until ? format(parseISO(auth.valid_until), 'dd/MM/yyyy', { locale: ptBR }) : '-'}
                    </TableCell>
                    <TableCell>
                      <Badge className={authorizationStatusColors[auth.status]}>
                        <span className="flex items-center gap-1">
                          {getStatusIcon(auth.status)}
                          {authorizationStatusLabels[auth.status]}
                        </span>
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
            <DialogTitle>Nova Autorização</DialogTitle>
            <DialogDescription>Registre uma solicitação de autorização de procedimento</DialogDescription>
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
              <Label>Paciente *</Label>
              <Select value={form.patient_id} onValueChange={(v) => setForm(p => ({ ...p, patient_id: v }))}>
                <SelectTrigger><SelectValue placeholder="Selecione o paciente" /></SelectTrigger>
                <SelectContent>
                  {patients.map((patient) => (
                    <SelectItem key={patient.id} value={patient.id}>{patient.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label>Procedimento</Label>
              <Select value={form.procedure_id} onValueChange={(v) => setForm(p => ({ ...p, procedure_id: v }))}>
                <SelectTrigger><SelectValue placeholder="Selecione o procedimento" /></SelectTrigger>
                <SelectContent>
                  {procedureOptions.map((proc) => (
                    <SelectItem key={proc.id} value={proc.id}>{proc.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label>Nº Autorização *</Label>
                <Input placeholder="Ex: AUTH-2024-001" value={form.authorization_number}
                  onChange={(e) => setForm(p => ({ ...p, authorization_number: e.target.value }))} />
              </div>
              <div className="grid gap-2">
                <Label>Data *</Label>
                <Input type="date" value={form.authorization_date}
                  onChange={(e) => setForm(p => ({ ...p, authorization_date: e.target.value }))} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label>Status</Label>
                <Select value={form.status} onValueChange={(v) => setForm(p => ({ ...p, status: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pendente">Pendente</SelectItem>
                    <SelectItem value="aprovada">Aprovada</SelectItem>
                    <SelectItem value="negada">Negada</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label>Válida até</Label>
                <Input type="date" value={form.valid_until}
                  onChange={(e) => setForm(p => ({ ...p, valid_until: e.target.value }))} />
              </div>
            </div>
            <div className="grid gap-2">
              <Label>Observações</Label>
              <Textarea placeholder="Observações adicionais..." value={form.notes}
                onChange={(e) => setForm(p => ({ ...p, notes: e.target.value }))} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>Cancelar</Button>
            <Button onClick={handleSave} disabled={createAuth.isPending}>
              {createAuth.isPending ? 'Salvando...' : 'Salvar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
