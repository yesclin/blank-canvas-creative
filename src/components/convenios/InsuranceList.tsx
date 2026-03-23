import { useState } from "react";
import { Building2, Plus, Search, Edit, ToggleLeft, ToggleRight, Settings, FileText, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { InsuranceFormDialog } from "./InsuranceFormDialog";
import type { Insurance } from "@/types/convenios";
import { guideTypeLabels, type TissGuideType } from "@/types/convenios";
import { useToggleInsuranceStatus } from "@/hooks/useConveniosData";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface InsuranceListProps {
  insurances: Insurance[];
  onSelectInsurance?: (insurance: Insurance) => void;
}

export function InsuranceList({ insurances, onSelectInsurance }: InsuranceListProps) {
  const [search, setSearch] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedInsurance, setSelectedInsurance] = useState<Insurance | null>(null);
  const [insuranceToToggle, setInsuranceToToggle] = useState<Insurance | null>(null);
  
  const toggleStatus = useToggleInsuranceStatus();

  const filteredInsurances = insurances.filter((insurance) =>
    insurance.name.toLowerCase().includes(search.toLowerCase()) ||
    insurance.code?.toLowerCase().includes(search.toLowerCase()) ||
    insurance.ans_code?.toLowerCase().includes(search.toLowerCase())
  );

  const handleEdit = (insurance: Insurance) => {
    setSelectedInsurance(insurance);
    setIsDialogOpen(true);
  };

  const handleNew = () => {
    setSelectedInsurance(null);
    setIsDialogOpen(true);
  };

  const handleToggleStatus = (insurance: Insurance) => {
    setInsuranceToToggle(insurance);
  };

  const confirmToggleStatus = () => {
    if (insuranceToToggle) {
      toggleStatus.mutate({ 
        id: insuranceToToggle.id, 
        is_active: !insuranceToToggle.is_active 
      });
      setInsuranceToToggle(null);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar convênio..."
            className="pl-9"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        
        <Button onClick={handleNew}>
          <Plus className="h-4 w-4 mr-2" />
          Novo Convênio
        </Button>
      </div>

      <Card>
        <CardContent className="pt-6">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Convênio</TableHead>
                <TableHead>Código ANS</TableHead>
                <TableHead>Contato</TableHead>
                <TableHead>Tipos de Guia</TableHead>
                <TableHead>Repasse Padrão</TableHead>
                <TableHead>Autorização</TableHead>
                <TableHead>Retorno</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredInsurances.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={9} className="text-center text-muted-foreground py-8">
                    {insurances.length === 0 
                      ? "Nenhum convênio cadastrado. Clique em 'Novo Convênio' para começar."
                      : "Nenhum convênio encontrado com os filtros aplicados."}
                  </TableCell>
                </TableRow>
              ) : (
                filteredInsurances.map((insurance) => (
                  <TableRow 
                    key={insurance.id} 
                    className="cursor-pointer hover:bg-muted/50"
                    onClick={() => onSelectInsurance?.(insurance)}
                  >
                    <TableCell>
                      <div className="font-medium">{insurance.name}</div>
                      <div className="text-sm text-muted-foreground">{insurance.code || "-"}</div>
                    </TableCell>
                    <TableCell>{insurance.ans_code || "-"}</TableCell>
                    <TableCell>
                      <div className="text-sm">{insurance.contact_phone || "-"}</div>
                      <div className="text-xs text-muted-foreground">{insurance.contact_email || ""}</div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {insurance.allowed_guide_types?.slice(0, 2).map((type) => (
                          <Badge key={type} variant="outline" className="text-xs">
                            {guideTypeLabels[type as TissGuideType] || type}
                          </Badge>
                        ))}
                        {(insurance.allowed_guide_types?.length || 0) > 2 && (
                          <Badge variant="outline" className="text-xs">
                            +{(insurance.allowed_guide_types?.length || 0) - 2}
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      {insurance.default_fee_type === 'percentage' 
                        ? `${insurance.default_fee_value}%`
                        : insurance.default_fee_value 
                          ? `R$ ${insurance.default_fee_value}` 
                          : '-'}
                    </TableCell>
                    <TableCell>
                      <Badge variant={insurance.requires_authorization ? "default" : "secondary"}>
                        {insurance.requires_authorization ? "Sim" : "Não"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {insurance.return_allowed ? `${insurance.return_days} dias` : "Não permite"}
                    </TableCell>
                    <TableCell>
                      <Badge variant={insurance.is_active ? "default" : "secondary"}>
                        {insurance.is_active ? "Ativo" : "Inativo"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button 
                          variant="ghost" 
                          size="icon"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleEdit(insurance);
                          }}
                          title="Editar"
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="icon"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleToggleStatus(insurance);
                          }}
                          title={insurance.is_active ? "Desativar" : "Ativar"}
                          disabled={toggleStatus.isPending}
                        >
                          {toggleStatus.isPending ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : insurance.is_active ? (
                            <ToggleRight className="h-4 w-4 text-green-600" />
                          ) : (
                            <ToggleLeft className="h-4 w-4 text-muted-foreground" />
                          )}
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <InsuranceFormDialog
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        insurance={selectedInsurance}
      />

      <AlertDialog open={!!insuranceToToggle} onOpenChange={() => setInsuranceToToggle(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {insuranceToToggle?.is_active ? 'Desativar Convênio' : 'Ativar Convênio'}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {insuranceToToggle?.is_active 
                ? `Deseja desativar o convênio "${insuranceToToggle?.name}"? Ele não aparecerá mais nas listagens ativas.`
                : `Deseja reativar o convênio "${insuranceToToggle?.name}"?`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={confirmToggleStatus}>
              {insuranceToToggle?.is_active ? 'Desativar' : 'Ativar'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
