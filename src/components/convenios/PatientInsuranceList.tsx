import { useState } from "react";
import { Users, Plus, Search, Edit, CreditCard, Calendar, AlertTriangle } from "lucide-react";
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
import type { PatientInsurance, Insurance } from "@/types/convenios";
import { holderTypeLabels } from "@/types/convenios";
import { format, parseISO, isBefore } from "date-fns";
import { ptBR } from "date-fns/locale";
import { toast } from "sonner";

interface PatientInsuranceListProps {
  patientInsurances: PatientInsurance[];
  insurances: Insurance[];
  patients: Array<{ id: string; name: string }>;
}

export function PatientInsuranceList({ patientInsurances, insurances, patients }: PatientInsuranceListProps) {
  const [search, setSearch] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const filteredPatientInsurances = patientInsurances.filter((pi) =>
    pi.patient_name?.toLowerCase().includes(search.toLowerCase()) ||
    pi.insurance_name?.toLowerCase().includes(search.toLowerCase()) ||
    pi.card_number?.toLowerCase().includes(search.toLowerCase())
  );

  const isExpired = (validUntil?: string) => {
    if (!validUntil) return false;
    return isBefore(parseISO(validUntil), new Date());
  };

  const isExpiringSoon = (validUntil?: string) => {
    if (!validUntil) return false;
    const expDate = parseISO(validUntil);
    const today = new Date();
    const daysUntil = Math.ceil((expDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    return daysUntil > 0 && daysUntil <= 30;
  };

  const handleSave = () => {
    toast.success('Vínculo salvo com sucesso!');
    setIsDialogOpen(false);
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar paciente, convênio ou carteirinha..."
            className="pl-9"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        
        <Button onClick={() => setIsDialogOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Vincular Paciente
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Pacientes Vinculados a Convênios
          </CardTitle>
          <CardDescription>
            Gerencie as carteirinhas de convênio dos pacientes
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Paciente</TableHead>
                <TableHead>Convênio</TableHead>
                <TableHead>Nº Carteirinha</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead>Validade</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredPatientInsurances.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                    Nenhum vínculo encontrado
                  </TableCell>
                </TableRow>
              ) : (
                filteredPatientInsurances.map((pi) => (
                  <TableRow key={pi.id}>
                    <TableCell className="font-medium">{pi.patient_name}</TableCell>
                    <TableCell>{pi.insurance_name}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <CreditCard className="h-4 w-4 text-muted-foreground" />
                        <span className="font-mono text-sm">{pi.card_number}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={pi.holder_type === 'titular' ? 'default' : 'secondary'}>
                        {holderTypeLabels[pi.holder_type]}
                      </Badge>
                      {pi.holder_type === 'dependente' && pi.holder_name && (
                        <div className="text-xs text-muted-foreground mt-1">
                          Titular: {pi.holder_name}
                        </div>
                      )}
                    </TableCell>
                    <TableCell>
                      {pi.valid_until ? (
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4 text-muted-foreground" />
                          <span className={isExpired(pi.valid_until) ? 'text-red-600' : isExpiringSoon(pi.valid_until) ? 'text-yellow-600' : ''}>
                            {format(parseISO(pi.valid_until), 'dd/MM/yyyy', { locale: ptBR })}
                          </span>
                          {isExpired(pi.valid_until) && (
                            <AlertTriangle className="h-4 w-4 text-red-600" />
                          )}
                          {isExpiringSoon(pi.valid_until) && (
                            <AlertTriangle className="h-4 w-4 text-yellow-600" />
                          )}
                        </div>
                      ) : (
                        <span className="text-muted-foreground">Sem validade</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {isExpired(pi.valid_until) ? (
                        <Badge variant="destructive">Vencida</Badge>
                      ) : pi.is_active ? (
                        <Badge variant="default">Ativa</Badge>
                      ) : (
                        <Badge variant="secondary">Inativa</Badge>
                      )}
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

      {/* Dialog para novo vínculo */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Vincular Paciente a Convênio</DialogTitle>
            <DialogDescription>
              Registre a carteirinha do convênio do paciente
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
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
              <Label>Número da Carteirinha *</Label>
              <Input placeholder="Ex: 0123456789012345" />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label>Validade</Label>
                <Input type="date" />
              </div>
              <div className="grid gap-2">
                <Label>Tipo</Label>
                <Select defaultValue="titular">
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="titular">Titular</SelectItem>
                    <SelectItem value="dependente">Dependente</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid gap-2">
              <Label>Nome do Titular (se dependente)</Label>
              <Input placeholder="Nome completo do titular" />
            </div>

            <div className="grid gap-2">
              <Label>CPF do Titular (se dependente)</Label>
              <Input placeholder="000.000.000-00" />
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
