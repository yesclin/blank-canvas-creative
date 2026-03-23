import { useState } from "react";
import { FileText, Plus, Search, Edit, Link as LinkIcon } from "lucide-react";
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
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import type { InsuranceProcedure, Insurance } from "@/types/convenios";
import { mockProcedures } from "@/hooks/useConveniosMockData";
import { toast } from "sonner";

interface InsuranceProceduresListProps {
  insuranceProcedures: InsuranceProcedure[];
  insurances: Insurance[];
}

export function InsuranceProceduresList({ insuranceProcedures, insurances }: InsuranceProceduresListProps) {
  const [search, setSearch] = useState("");
  const [insuranceFilter, setInsuranceFilter] = useState<string>("all");
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const filteredProcedures = insuranceProcedures.filter((ip) => {
    const matchesSearch = 
      ip.procedure_name?.toLowerCase().includes(search.toLowerCase()) ||
      ip.procedure_code?.toLowerCase().includes(search.toLowerCase());
    
    const matchesInsurance = insuranceFilter === "all" || ip.insurance_id === insuranceFilter;
    
    return matchesSearch && matchesInsurance;
  });

  // Group by insurance
  const groupedByInsurance = filteredProcedures.reduce((acc, proc) => {
    const insuranceName = insurances.find(i => i.id === proc.insurance_id)?.name || 'Desconhecido';
    if (!acc[insuranceName]) {
      acc[insuranceName] = [];
    }
    acc[insuranceName].push(proc);
    return acc;
  }, {} as Record<string, InsuranceProcedure[]>);

  const formatCurrency = (value?: number) => {
    if (value === undefined || value === null) return "-";
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  const handleSave = () => {
    toast.success('Procedimento vinculado com sucesso!');
    setIsDialogOpen(false);
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex flex-col sm:flex-row gap-2 flex-1">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar procedimento..."
              className="pl-9"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          
          <Select value={insuranceFilter} onValueChange={setInsuranceFilter}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Convênio" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos Convênios</SelectItem>
              {insurances.filter(i => i.is_active).map((insurance) => (
                <SelectItem key={insurance.id} value={insurance.id}>{insurance.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        
        <Button onClick={() => setIsDialogOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Vincular Procedimento
        </Button>
      </div>

      {Object.entries(groupedByInsurance).length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center text-muted-foreground">
            Nenhum procedimento vinculado encontrado
          </CardContent>
        </Card>
      ) : (
        Object.entries(groupedByInsurance).map(([insuranceName, procedures]) => (
          <Card key={insuranceName}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <LinkIcon className="h-5 w-5" />
                {insuranceName}
              </CardTitle>
              <CardDescription>
                {procedures.length} procedimento(s) vinculado(s)
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Código</TableHead>
                    <TableHead>Procedimento</TableHead>
                    <TableHead className="text-right">Valor Coberto</TableHead>
                    <TableHead>Autorização</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {procedures.map((proc) => (
                    <TableRow key={proc.id}>
                      <TableCell className="font-mono">{proc.procedure_code || '-'}</TableCell>
                      <TableCell className="font-medium">{proc.procedure_name}</TableCell>
                      <TableCell className="text-right">{formatCurrency(proc.covered_value)}</TableCell>
                      <TableCell>
                        <Badge variant={proc.requires_authorization ? "default" : "secondary"}>
                          {proc.requires_authorization ? "Obrigatória" : "Não necessária"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant={proc.is_active ? "default" : "secondary"}>
                          {proc.is_active ? "Ativo" : "Inativo"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="icon">
                          <Edit className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        ))
      )}

      {/* Dialog para vincular procedimento */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Vincular Procedimento ao Convênio</DialogTitle>
            <DialogDescription>
              Defina o valor coberto e regras de autorização
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
              <Label>Procedimento *</Label>
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

            <div className="grid gap-2">
              <Label>Valor Coberto (R$)</Label>
              <Input type="number" min="0" step="0.01" placeholder="0,00" />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Exige Autorização</Label>
                <p className="text-xs text-muted-foreground">
                  Este procedimento precisa de autorização prévia
                </p>
              </div>
              <Switch />
            </div>

            <div className="grid gap-2">
              <Label>Observações</Label>
              <Textarea placeholder="Observações sobre cobertura..." />
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
