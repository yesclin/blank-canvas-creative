import { useState } from "react";
import { FileCheck, Plus, Search, Clock, CheckCircle, XCircle, Edit } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import type { InsuranceAuthorization, AuthorizationStatus, Insurance } from "@/types/convenios";
import { authorizationStatusLabels, authorizationStatusColors } from "@/types/convenios";
import { mockProcedures } from "@/hooks/useConveniosMockData";
import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import { toast } from "sonner";

interface AuthorizationListProps {
  authorizations: InsuranceAuthorization[];
  insurances: Insurance[];
  patients: Array<{ id: string; name: string }>;
}

export function AuthorizationList({ authorizations, insurances, patients }: AuthorizationListProps) {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [isDialogOpen, setIsDialogOpen] = useState(false);

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
      case 'pendente':
        return <Clock className="h-3 w-3" />;
      case 'aprovada':
        return <CheckCircle className="h-3 w-3" />;
      case 'negada':
        return <XCircle className="h-3 w-3" />;
      case 'utilizada':
        return <FileCheck className="h-3 w-3" />;
    }
  };

  const handleSave = () => {
    toast.success('Autorização registrada com sucesso!');
    setIsDialogOpen(false);
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex flex-col sm:flex-row gap-2 flex-1">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar autorização..."
              className="pl-9"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos Status</SelectItem>
              <SelectItem value="pendente">Pendente</SelectItem>
              <SelectItem value="aprovada">Aprovada</SelectItem>
              <SelectItem value="negada">Negada</SelectItem>
              <SelectItem value="utilizada">Utilizada</SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        <Button onClick={() => setIsDialogOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Nova Autorização
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileCheck className="h-5 w-5" />
            Autorizações de Procedimentos
          </CardTitle>
          <CardDescription>
            Controle de autorizações solicitadas aos convênios
          </CardDescription>
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
                      {format(parseISO(auth.authorization_date), 'dd/MM/yyyy', { locale: ptBR })}
                    </TableCell>
                    <TableCell>
                      {auth.valid_until 
                        ? format(parseISO(auth.valid_until), 'dd/MM/yyyy', { locale: ptBR })
                        : '-'}
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
                      <Button variant="ghost" size="icon">
                        <Edit className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Dialog para nova autorização */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Nova Autorização</DialogTitle>
            <DialogDescription>
              Registre uma solicitação de autorização de procedimento
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label>Convênio *</Label>
              <Select>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o convênio" />
                </SelectTrigger>
                <SelectContent>
                  {insurances.filter(i => i.is_active).map((insurance) => (
                    <SelectItem key={insurance.id} value={insurance.id}>
                      {insurance.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-2">
              <Label>Paciente *</Label>
              <Select>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o paciente" />
                </SelectTrigger>
                <SelectContent>
                  {patients.map((patient) => (
                    <SelectItem key={patient.id} value={patient.id}>
                      {patient.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-2">
              <Label>Procedimento</Label>
              <Select>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o procedimento" />
                </SelectTrigger>
                <SelectContent>
                  {mockProcedures.map((proc) => (
                    <SelectItem key={proc.id} value={proc.id}>
                      {proc.code} - {proc.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label>Nº Autorização *</Label>
                <Input placeholder="Ex: AUTH-2024-001" />
              </div>
              <div className="grid gap-2">
                <Label>Data *</Label>
                <Input type="date" defaultValue={new Date().toISOString().split('T')[0]} />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label>Status</Label>
                <Select defaultValue="pendente">
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pendente">Pendente</SelectItem>
                    <SelectItem value="aprovada">Aprovada</SelectItem>
                    <SelectItem value="negada">Negada</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label>Válida até</Label>
                <Input type="date" />
              </div>
            </div>

            <div className="grid gap-2">
              <Label>Observações</Label>
              <Textarea placeholder="Observações adicionais..." />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSave}>
              Salvar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
