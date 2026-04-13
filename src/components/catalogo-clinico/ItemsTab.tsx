import { Package, Search, Edit, ToggleLeft, ToggleRight, Plus } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useInventoryItems, useToggleInventoryItem } from "@/hooks/useInventoryItems";
import { inventoryItemTypeLabels, type InventoryItem, type InventoryItemType } from "@/types/inventory-items";
import { InventoryItemFormDialog } from "@/components/inventory/InventoryItemFormDialog";

export function CatalogoClinicoItemsTab() {
  const { data: items, isLoading } = useInventoryItems({ isConsumable: true });
  const toggleMutation = useToggleInventoryItem();
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [editItem, setEditItem] = useState<InventoryItem | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);

  const filtered = (items || []).filter((item) => {
    const matchesSearch = item.name.toLowerCase().includes(search.toLowerCase());
    const matchesType = typeFilter === "all" || item.item_type === typeFilter;
    return matchesSearch && matchesType;
  });

  if (isLoading) {
    return (
      <Card>
        <CardContent className="pt-6 space-y-3">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-12 w-full" />
          ))}
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <Alert>
        <Package className="h-4 w-4" />
        <AlertDescription>
          Itens assistenciais consumíveis em procedimentos. Para cadastrar itens puramente comerciais, use <strong>Gestão → Estoque</strong>.
        </AlertDescription>
      </Alert>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Itens Assistenciais</CardTitle>
              <CardDescription>
                {filtered.length} {filtered.length === 1 ? "item" : "itens"} consumíveis em procedimentos
              </CardDescription>
            </div>
            <Button onClick={() => { setEditItem(null); setIsFormOpen(true); }}>
              <Plus className="h-4 w-4 mr-2" />
              Novo Item
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-3 mb-4">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar item assistencial..."
                className="pl-9"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Tipo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os tipos</SelectItem>
                {Object.entries(inventoryItemTypeLabels).map(([value, label]) => (
                  <SelectItem key={value} value={value}>{label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead>Unidade</TableHead>
                <TableHead className="text-right">Custo</TableHead>
                <TableHead>Flags</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                    {search || typeFilter !== "all"
                      ? "Nenhum item encontrado com os filtros aplicados"
                      : "Nenhum item assistencial cadastrado. Clique em \"Novo Item\" para começar."}
                  </TableCell>
                </TableRow>
              ) : (
                filtered.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell className="font-medium">
                      <div>
                        {item.name}
                        {item.commercial_name && (
                          <span className="text-xs text-muted-foreground block">{item.commercial_name}</span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="text-xs">
                        {inventoryItemTypeLabels[item.item_type as InventoryItemType]}
                      </Badge>
                    </TableCell>
                    <TableCell>{item.unit_of_measure}</TableCell>
                    <TableCell className="text-right">
                      {Number(item.default_cost_price) > 0
                        ? `R$ ${Number(item.default_cost_price).toFixed(2)}`
                        : "-"}
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {item.controls_batch && <Badge variant="secondary" className="text-xs">Lote</Badge>}
                        {item.controls_expiry && <Badge variant="secondary" className="text-xs">Validade</Badge>}
                        {item.requires_traceability && <Badge variant="secondary" className="text-xs">Rastreável</Badge>}
                        {item.is_sellable && <Badge variant="secondary" className="text-xs">Vendável</Badge>}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={item.is_active ? "default" : "secondary"}>
                        {item.is_active ? "Ativo" : "Inativo"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button variant="ghost" size="icon" title="Editar" onClick={() => { setEditItem(item); setIsFormOpen(true); }}>
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost" size="icon"
                          title={item.is_active ? "Desativar" : "Ativar"}
                          onClick={() => toggleMutation.mutate({ id: item.id, isActive: !item.is_active })}
                          disabled={toggleMutation.isPending}
                        >
                          {item.is_active ? <ToggleRight className="h-4 w-4 text-primary" /> : <ToggleLeft className="h-4 w-4" />}
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

      <InventoryItemFormDialog
        open={isFormOpen}
        onOpenChange={setIsFormOpen}
        editItem={editItem}
      />
    </div>
  );
}
