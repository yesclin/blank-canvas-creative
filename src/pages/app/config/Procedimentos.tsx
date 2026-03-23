import { useState } from "react";
import { ListChecks, Plus, Search, Edit, ToggleLeft, ToggleRight, Loader2, ShieldAlert, Package } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
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
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { ProcedureFormDialog } from "@/components/procedures/ProcedureFormDialog";
import { ProcedureProductsDialog } from "@/components/procedures/ProcedureProductsDialog";
import {
  Procedure,
  useProceduresList,
  useToggleProcedureStatus,
  checkProcedureUsage,
} from "@/hooks/useProceduresCRUD";
import { usePermissions } from "@/hooks/usePermissions";
import { useProcedureProductCosts } from "@/hooks/useProcedureProductCosts";

export default function ConfigProcedimentos() {
  const [search, setSearch] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [dialogMode, setDialogMode] = useState<"create" | "edit">("create");
  const [selectedProcedure, setSelectedProcedure] = useState<Procedure | null>(null);
  const [confirmToggle, setConfirmToggle] = useState<Procedure | null>(null);
  const [toggleUsageInfo, setToggleUsageInfo] = useState<{ isUsed: boolean; count: number } | null>(null);
  const [productsDialogOpen, setProductsDialogOpen] = useState(false);
  const [productsDialogProcedure, setProductsDialogProcedure] = useState<Procedure | null>(null);

  const { data: procedures, isLoading, error } = useProceduresList(true);
  const { data: productCosts } = useProcedureProductCosts();
  const toggleStatusMutation = useToggleProcedureStatus();
  const { can, isOwner, isAdmin } = usePermissions();

  // Helper para formatar custo
  const formatCurrency = (value: number) => 
    value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

  // Obter custo do procedimento
  const getProcedureCost = (procedureId: string) => {
    const cost = productCosts?.[procedureId];
    return cost?.total_cost || 0;
  };

  const getProductCount = (procedureId: string) => {
    const cost = productCosts?.[procedureId];
    return cost?.product_count || 0;
  };

  // Check if user can manage procedures (owner and admin have total bypass)
  const canManage = isOwner || isAdmin || can("configuracoes", "edit");

  const filteredProcedures = (procedures || []).filter((proc) =>
    proc.name.toLowerCase().includes(search.toLowerCase()) ||
    (proc.specialty?.toLowerCase().includes(search.toLowerCase()) ?? false)
  );

  const handleCreate = () => {
    setSelectedProcedure(null);
    setDialogMode("create");
    setIsDialogOpen(true);
  };

  const handleEdit = (procedure: Procedure) => {
    setSelectedProcedure(procedure);
    setDialogMode("edit");
    setIsDialogOpen(true);
  };

  const handleToggleStatus = async (procedure: Procedure) => {
    // Check usage before showing dialog
    const usageInfo = await checkProcedureUsage(procedure.id);
    setToggleUsageInfo(usageInfo);
    setConfirmToggle(procedure);
  };

  const handleOpenProducts = (procedure: Procedure) => {
    setProductsDialogProcedure(procedure);
    setProductsDialogOpen(true);
  };

  const confirmStatusChange = async () => {
    if (!confirmToggle) return;
    
    await toggleStatusMutation.mutateAsync({
      id: confirmToggle.id,
      isActive: !confirmToggle.is_active,
    });
    setConfirmToggle(null);
    setToggleUsageInfo(null);
  };
  
  const cancelStatusChange = () => {
    setConfirmToggle(null);
    setToggleUsageInfo(null);
  };

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <ShieldAlert className="h-12 w-12 text-destructive mb-4" />
        <h2 className="text-xl font-semibold mb-2">Erro ao carregar procedimentos</h2>
        <p className="text-muted-foreground">
          Não foi possível carregar a lista de procedimentos. Tente novamente.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <ListChecks className="h-6 w-6 text-primary" />
            Procedimentos
          </h1>
          <p className="text-muted-foreground mt-1">
            Gerencie os procedimentos oferecidos pela clínica
          </p>
        </div>

        {canManage && (
          <Button onClick={handleCreate}>
            <Plus className="h-4 w-4 mr-2" />
            Novo Procedimento
          </Button>
        )}
      </div>

      {!canManage && (
        <Card className="border-warning/50 bg-warning/10">
          <CardContent className="flex items-center gap-3 py-4">
            <ShieldAlert className="h-5 w-5 text-warning" />
            <p className="text-sm text-warning-foreground">
              Você tem permissão apenas para visualizar os procedimentos. 
              Contate um administrador para realizar alterações.
            </p>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <div className="flex items-center gap-4">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar procedimento..."
                className="pl-9"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <Badge variant="outline" className="ml-auto">
              {filteredProcedures.length} procedimento(s)
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex items-center gap-4">
                  <Skeleton className="h-12 flex-1" />
                </div>
              ))}
            </div>
          ) : filteredProcedures.length === 0 ? (
            <div className="text-center py-12">
              <ListChecks className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-1">Nenhum procedimento encontrado</h3>
              <p className="text-muted-foreground text-sm">
                {search
                  ? "Tente buscar com outros termos"
                  : "Comece criando seu primeiro procedimento"}
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Procedimento</TableHead>
                  <TableHead>Especialidade</TableHead>
                  <TableHead>Duração</TableHead>
                  <TableHead>Valor</TableHead>
                  <TableHead>Custo</TableHead>
                  <TableHead>Retorno</TableHead>
                  <TableHead>Status</TableHead>
                  {canManage && <TableHead className="text-right">Ações</TableHead>}
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredProcedures.map((procedure) => {
                  const procedureCost = getProcedureCost(procedure.id);
                  const productCount = getProductCount(procedure.id);
                  
                  return (
                  <TableRow 
                    key={procedure.id}
                    className={!procedure.is_active ? "opacity-60" : ""}
                  >
                    <TableCell className="font-medium">
                      {procedure.name}
                      {procedure.description && (
                        <p className="text-xs text-muted-foreground mt-0.5 truncate max-w-[200px]">
                          {procedure.description}
                        </p>
                      )}
                    </TableCell>
                    <TableCell>{procedure.specialty || "—"}</TableCell>
                    <TableCell>{procedure.duration_minutes} min</TableCell>
                    <TableCell>
                      {procedure.price
                        ? formatCurrency(procedure.price)
                        : "—"}
                    </TableCell>
                    <TableCell>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <span className={procedureCost > 0 ? "cursor-help" : ""}>
                            {procedureCost > 0 
                              ? formatCurrency(procedureCost)
                              : <span className="text-muted-foreground">—</span>
                            }
                          </span>
                        </TooltipTrigger>
                        {productCount > 0 && (
                          <TooltipContent>
                            {productCount} produto(s) vinculado(s)
                          </TooltipContent>
                        )}
                      </Tooltip>
                    </TableCell>
                    <TableCell>
                      {procedure.allows_return ? (
                        <span className="text-sm">{procedure.return_days} dias</span>
                      ) : (
                        <span className="text-muted-foreground">Não</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge 
                        variant={procedure.is_active ? "default" : "destructive"}
                      >
                        {procedure.is_active ? "Ativo" : "Inativo"}
                      </Badge>
                    </TableCell>
                    {canManage && (
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleOpenProducts(procedure)}
                              >
                                <Package className="h-4 w-4" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>Configurar produtos</TooltipContent>
                          </Tooltip>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleEdit(procedure)}
                            title="Editar procedimento"
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleToggleStatus(procedure)}
                            title={procedure.is_active ? "Desativar procedimento" : "Ativar procedimento"}
                            disabled={toggleStatusMutation.isPending}
                          >
                            {toggleStatusMutation.isPending ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : procedure.is_active ? (
                              <ToggleRight className="h-4 w-4 text-primary" />
                            ) : (
                              <ToggleLeft className="h-4 w-4" />
                            )}
                          </Button>
                        </div>
                      </TableCell>
                    )}
                  </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Create/Edit Dialog */}
      <ProcedureFormDialog
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        procedure={selectedProcedure}
        mode={dialogMode}
      />

      {/* Products Configuration Dialog */}
      <ProcedureProductsDialog
        open={productsDialogOpen}
        onOpenChange={setProductsDialogOpen}
        procedure={productsDialogProcedure}
      />

      {/* Confirm Toggle Status Dialog */}
      <AlertDialog open={!!confirmToggle} onOpenChange={cancelStatusChange}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {confirmToggle?.is_active ? "Desativar Procedimento" : "Ativar Procedimento"}
            </AlertDialogTitle>
            <AlertDialogDescription className="space-y-2">
              {confirmToggle?.is_active ? (
                <>
                  <p>
                    Tem certeza que deseja desativar "{confirmToggle?.name}"?
                  </p>
                  {toggleUsageInfo?.isUsed && (
                    <p className="text-amber-600 font-medium">
                      ⚠️ Este procedimento foi utilizado em {toggleUsageInfo.count} agendamento(s).
                    </p>
                  )}
                  <p className="text-sm text-muted-foreground">
                    O procedimento não estará mais disponível para novos agendamentos, 
                    mas continuará visível em relatórios históricos.
                  </p>
                </>
              ) : (
                <p>
                  Tem certeza que deseja ativar "{confirmToggle?.name}"? 
                  O procedimento voltará a estar disponível para agendamentos.
                </p>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={toggleStatusMutation.isPending}>
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmStatusChange}
              disabled={toggleStatusMutation.isPending}
              className={confirmToggle?.is_active ? "bg-destructive hover:bg-destructive/90" : ""}
            >
              {toggleStatusMutation.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Processando...
                </>
              ) : confirmToggle?.is_active ? (
                "Desativar"
              ) : (
                "Ativar"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
