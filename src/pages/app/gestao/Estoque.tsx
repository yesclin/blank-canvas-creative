import { useState, useCallback } from "react";
import {
  Package, Search, Edit, ToggleLeft, ToggleRight,
  ArrowDownCircle, ArrowUpCircle, Settings2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent } from "@/components/ui/tabs";
import { InventoryModuleHero } from "@/components/estoque/InventoryModuleHero";
import { InventorySectionTabs } from "@/components/estoque/InventorySectionTabs";
import { InventoryItemFormDialog } from "@/components/inventory/InventoryItemFormDialog";
import { EntryFormDialog } from "@/components/estoque/EntryFormDialog";
import { ExitFormDialog } from "@/components/estoque/ExitFormDialog";
import { AdjustmentFormDialog } from "@/components/estoque/AdjustmentFormDialog";
import { BatchesTab } from "@/components/estoque/tabs/BatchesTab";
import { MovementsListTab } from "@/components/estoque/tabs/MovementsListTab";
import { AlertsTab } from "@/components/estoque/tabs/AlertsTab";
import { ExpiryTab } from "@/components/estoque/tabs/ExpiryTab";
import { InventoryKitsTab } from "@/components/catalogo-clinico/InventoryKitsTab";
import { StockPredictionAlerts } from "@/components/estoque/StockPredictionAlerts";
import { useInventoryItems, useToggleInventoryItem } from "@/hooks/useInventoryItems";
import { useExpiringBatches, useExpiredBatches } from "@/hooks/useInventoryBatches";
import type { InventoryItem } from "@/types/inventory-items";
import { inventoryItemTypeLabels, inventoryItemTypeColors } from "@/types/inventory-items";
import { entryMovementTypes, exitMovementTypes } from "@/types/inventory-batches";

export default function Estoque() {
  const { data: items = [], isLoading } = useInventoryItems({ includeInactive: true });
  const toggleItem = useToggleInventoryItem();
  const { data: expiringBatches = [] } = useExpiringBatches(30);
  const { data: expiredBatches = [] } = useExpiredBatches();

  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");

  const [isItemDialogOpen, setIsItemDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<InventoryItem | undefined>();
  const [isEntryOpen, setIsEntryOpen] = useState(false);
  const [isExitOpen, setIsExitOpen] = useState(false);
  const [isAdjustOpen, setIsAdjustOpen] = useState(false);

  const activeItems = items.filter(i => i.is_active);
  const stockItems = activeItems.filter(i => i.controls_stock);
  const totalItems = stockItems.length;
  const sellableCount = activeItems.filter(i => i.is_sellable).length;
  const expiringCount = expiringBatches.length;
  const expiredBatchCount = expiredBatches.length;

  const categories = [...new Set(items.map(i => i.category).filter(Boolean))];

  const filteredItems = items.filter(item => {
    const matchesSearch = item.name.toLowerCase().includes(search.toLowerCase()) ||
      item.commercial_name?.toLowerCase().includes(search.toLowerCase()) ||
      item.sku?.toLowerCase().includes(search.toLowerCase());
    const matchesCategory = categoryFilter === "all" || item.category === categoryFilter;
    const matchesStatus = statusFilter === "all" ||
      (statusFilter === "active" && item.is_active) ||
      (statusFilter === "inactive" && !item.is_active) ||
      (statusFilter === "stock" && item.controls_stock) ||
      (statusFilter === "sellable" && item.is_sellable);
    return matchesSearch && matchesCategory && matchesStatus;
  });

  const handleEditItem = useCallback((item: InventoryItem) => {
    setEditingItem(item);
    setIsItemDialogOpen(true);
  }, []);

  const handleToggleItem = useCallback(async (item: InventoryItem) => {
    try {
      await toggleItem.mutateAsync({ id: item.id, isActive: !item.is_active });
    } catch (e) { console.error(e); }
  }, [toggleItem]);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <Package className="h-6 w-6 text-primary" />
            Estoque
          </h1>
          <p className="text-muted-foreground mt-1">Carregando dados...</p>
        </div>
        <div className="grid gap-4 md:grid-cols-4">
          {[1, 2, 3, 4].map(i => (
            <Card key={i}>
              <CardContent className="pt-6">
                <div className="h-8 w-16 bg-muted animate-pulse rounded" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <InventoryModuleHero
        totalItems={totalItems}
        sellableCount={sellableCount}
        lowStockCount={0}
        outOfStockCount={0}
        expiringCount={expiringCount}
        expiredBatchCount={expiredBatchCount}
        onCreateItem={() => { setEditingItem(undefined); setIsItemDialogOpen(true); }}
        onEntry={() => setIsEntryOpen(true)}
        onExit={() => setIsExitOpen(true)}
        onAdjust={() => setIsAdjustOpen(true)}
      />

      {/* Main Tabs */}
      <Tabs defaultValue="items" className="space-y-5">
        <InventorySectionTabs />

        {/* TAB: ITENS */}
        <TabsContent value="items" className="space-y-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 rounded-xl border border-border bg-card p-4">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Buscar item..." className="pl-9" value={search} onChange={e => setSearch(e.target.value)} />
            </div>
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-[180px]"><SelectValue placeholder="Categoria" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas categorias</SelectItem>
                {categories.map(c => <SelectItem key={c!} value={c!}>{c}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[180px]"><SelectValue placeholder="Status" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="active">Ativos</SelectItem>
                <SelectItem value="inactive">Inativos</SelectItem>
                <SelectItem value="stock">Controla estoque</SelectItem>
                <SelectItem value="sellable">Vendáveis</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Card>
            <CardContent className="pt-6">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Item</TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead>Categoria</TableHead>
                    <TableHead>Unidade</TableHead>
                    <TableHead className="text-right">Custo Padrão</TableHead>
                    <TableHead className="text-right">Preço Venda</TableHead>
                    <TableHead>Flags</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredItems.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={9} className="text-center text-muted-foreground py-8">
                        {search || categoryFilter !== "all" || statusFilter !== "all"
                          ? "Nenhum item encontrado com os filtros aplicados"
                          : "Nenhum item cadastrado. Clique em \"Novo Item\" para começar."}
                      </TableCell>
                    </TableRow>
                  ) : filteredItems.map(item => (
                    <TableRow key={item.id}>
                      <TableCell className="font-medium">{item.name}</TableCell>
                      <TableCell>
                        <Badge className={inventoryItemTypeColors[item.item_type]}>
                          {inventoryItemTypeLabels[item.item_type]}
                        </Badge>
                      </TableCell>
                      <TableCell>{item.category || '-'}</TableCell>
                      <TableCell>{item.unit_of_measure}</TableCell>
                      <TableCell className="text-right">
                        {item.default_cost_price ? `R$ ${item.default_cost_price.toFixed(2)}` : '-'}
                      </TableCell>
                      <TableCell className="text-right">
                        {item.default_sale_price ? `R$ ${item.default_sale_price.toFixed(2)}` : '-'}
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-1 flex-wrap">
                          {item.controls_stock && <Badge variant="outline" className="text-xs">Estoque</Badge>}
                          {item.controls_batch && <Badge variant="outline" className="text-xs">Lote</Badge>}
                          {item.is_sellable && <Badge variant="outline" className="text-xs">Venda</Badge>}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={item.is_active ? "default" : "secondary"}>
                          {item.is_active ? "Ativo" : "Inativo"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button variant="ghost" size="icon" title="Editar" onClick={() => handleEditItem(item)}>
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon" title={item.is_active ? "Desativar" : "Ativar"}
                            onClick={() => handleToggleItem(item)} disabled={toggleItem.isPending}>
                            {item.is_active ? <ToggleRight className="h-4 w-4 text-primary" /> : <ToggleLeft className="h-4 w-4" />}
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="batches"><BatchesTab /></TabsContent>

        <TabsContent value="entries">
          <MovementsListTab
            filterTypes={entryMovementTypes}
            title="Entradas"
            description="Todas as entradas de estoque por compra, manual e devolução"
            onNewClick={() => setIsEntryOpen(true)}
            newButtonLabel="Nova Entrada"
          />
        </TabsContent>

        <TabsContent value="exits">
          <MovementsListTab
            filterTypes={exitMovementTypes}
            title="Saídas"
            description="Consumo em procedimentos, vendas, perdas e transferências"
            onNewClick={() => setIsExitOpen(true)}
            newButtonLabel="Nova Saída"
          />
        </TabsContent>

        <TabsContent value="adjustments">
          <MovementsListTab
            filterTypes={['adjustment']}
            title="Ajustes"
            description="Ajustes de inventário e correções"
            onNewClick={() => setIsAdjustOpen(true)}
            newButtonLabel="Novo Ajuste"
          />
        </TabsContent>

        <TabsContent value="kits">
          <InventoryKitsTab />
        </TabsContent>

        <TabsContent value="alerts"><AlertsTab /></TabsContent>
        <TabsContent value="expiry"><ExpiryTab /></TabsContent>

        <TabsContent value="prediction">
          <StockPredictionAlerts compact={false} maxItems={50} showHeader={true} />
        </TabsContent>

        <TabsContent value="history">
          <MovementsListTab
            title="Histórico Completo"
            description="Todas as movimentações de estoque"
          />
        </TabsContent>
      </Tabs>

      {/* Dialogs */}
      <InventoryItemFormDialog
        open={isItemDialogOpen}
        onOpenChange={setIsItemDialogOpen}
        editItem={editingItem}
      />
      <EntryFormDialog open={isEntryOpen} onOpenChange={setIsEntryOpen} items={items} />
      <ExitFormDialog open={isExitOpen} onOpenChange={setIsExitOpen} items={items} />
      <AdjustmentFormDialog open={isAdjustOpen} onOpenChange={setIsAdjustOpen} items={items} />
    </div>
  );
}
