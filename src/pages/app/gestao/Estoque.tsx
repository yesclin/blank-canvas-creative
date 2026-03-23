import { useState } from "react";
import { Package, Plus, Search, AlertTriangle, ArrowUpCircle, ArrowDownCircle, Edit, ToggleLeft, ToggleRight, History, TrendingDown, Clock, ExternalLink, User, Syringe, Boxes, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { useStockData } from "@/hooks/useStockData";
import { stockUnits, movementReasons, type MovementType } from "@/types/gestao";
import { stockMovementTypeLabels, type StockMovementType } from "@/types/inventory";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { SaleDetailsDialog } from "@/components/gestao/SaleDetailsDialog";
import { ProductKitsTab } from "@/components/estoque/ProductKitsTab";
import { StockPredictionAlerts } from "@/components/estoque/StockPredictionAlerts";

export default function Estoque() {
  const { categories, products, movements, lowStockProducts, outOfStockProducts, expiringProducts, stats, isLoading } = useStockData();
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [isProductDialogOpen, setIsProductDialogOpen] = useState(false);
  const [isMovementDialogOpen, setIsMovementDialogOpen] = useState(false);
  const [movementType, setMovementType] = useState<MovementType>("entrada");
  
  // Sale details dialog state
  const [selectedSaleId, setSelectedSaleId] = useState<string | null>(null);
  const [isSaleDialogOpen, setIsSaleDialogOpen] = useState(false);
  
  const handleViewSale = (saleId: string) => {
    setSelectedSaleId(saleId);
    setIsSaleDialogOpen(true);
  };
  
  const filteredProducts = products.filter((product) => {
    const matchesSearch = product.name.toLowerCase().includes(search.toLowerCase());
    const matchesCategory = categoryFilter === "all" || product.category === categoryFilter;
    const matchesStatus = statusFilter === "all" || 
      (statusFilter === "active" && product.is_active) ||
      (statusFilter === "inactive" && !product.is_active) ||
      (statusFilter === "low" && product.current_quantity <= product.min_quantity && product.current_quantity > 0) ||
      (statusFilter === "out" && product.current_quantity === 0);
    return matchesSearch && matchesCategory && matchesStatus;
  });

  const getStockBadge = (product: typeof products[0]) => {
    if (product.current_quantity === 0) {
      return <Badge variant="destructive">Zerado</Badge>;
    }
    if (product.current_quantity <= product.min_quantity) {
      return <Badge variant="outline" className="border-yellow-500 text-yellow-600">Baixo</Badge>;
    }
    return <Badge variant="outline" className="border-green-500 text-green-600">OK</Badge>;
  };

  const getCategoryName = (category?: string | null) => {
    return category || "Sem categoria";
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <Package className="h-6 w-6 text-primary" />
            Controle de Estoque
          </h1>
          <p className="text-muted-foreground mt-1">
            Carregando dados do estoque...
          </p>
        </div>
        <div className="grid gap-4 md:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <div className="h-4 w-24 bg-muted animate-pulse rounded" />
              </CardHeader>
              <CardContent>
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
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
          <Package className="h-6 w-6 text-primary" />
          Controle de Estoque
        </h1>
        <p className="text-muted-foreground mt-1">
          Gerencie produtos, movimentações e alertas de estoque
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Itens</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalProducts}</div>
            <p className="text-xs text-muted-foreground">produtos cadastrados</p>
          </CardContent>
        </Card>
        <Card className={stats.lowStock > 0 ? "border-yellow-300 bg-yellow-50/50" : ""}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Estoque Baixo</CardTitle>
            <TrendingDown className="h-4 w-4 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{stats.lowStock}</div>
            <p className="text-xs text-muted-foreground">itens abaixo do mínimo</p>
          </CardContent>
        </Card>
        <Card className={stats.outOfStock > 0 ? "border-red-300 bg-red-50/50" : ""}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Zerados</CardTitle>
            <AlertTriangle className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{stats.outOfStock}</div>
            <p className="text-xs text-muted-foreground">itens sem estoque</p>
          </CardContent>
        </Card>
        <Card className={stats.expiringSoon > 0 ? "border-orange-300 bg-orange-50/50" : ""}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Próx. Vencimento</CardTitle>
            <Clock className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">{stats.expiringSoon}</div>
            <p className="text-xs text-muted-foreground">vencem em 30 dias</p>
          </CardContent>
        </Card>
      </div>

      {/* Stock Prediction Alerts - Based on Future Agenda */}
      <StockPredictionAlerts />

      {/* Traditional Alerts Section */}
      {(lowStockProducts.length > 0 || outOfStockProducts.length > 0) && (
        <Card className="border-yellow-200 bg-yellow-50/30">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-yellow-600" />
              Alertas de Estoque Atual
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {outOfStockProducts.map(product => (
              <div key={product.id} className="flex items-center justify-between p-2 bg-red-100 rounded-md">
                <span className="text-sm font-medium text-red-800">{product.name}</span>
                <Badge variant="destructive">Sem estoque</Badge>
              </div>
            ))}
            {lowStockProducts.filter(p => p.current_quantity > 0).map(product => (
              <div key={product.id} className="flex items-center justify-between p-2 bg-yellow-100 rounded-md">
                <span className="text-sm font-medium text-yellow-800">{product.name}</span>
                <span className="text-sm text-yellow-700">
                  {product.current_quantity} / {product.min_quantity} {product.unit}
                </span>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Main Tabs */}
      <Tabs defaultValue="products" className="space-y-4">
        <TabsList>
          <TabsTrigger value="products">Produtos</TabsTrigger>
          <TabsTrigger value="kits" className="flex items-center gap-1">
            <Boxes className="h-4 w-4" />
            Kits
          </TabsTrigger>
          <TabsTrigger value="movements">Movimentações</TabsTrigger>
          <TabsTrigger value="categories">Categorias</TabsTrigger>
        </TabsList>

        {/* Products Tab */}
        <TabsContent value="products" className="space-y-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 flex-1">
              <div className="relative flex-1 max-w-sm">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar produto..."
                  className="pl-9"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Categoria" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas categorias</SelectItem>
                  {categories.map((cat) => (
                    <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="active">Ativos</SelectItem>
                  <SelectItem value="inactive">Inativos</SelectItem>
                  <SelectItem value="low">Estoque baixo</SelectItem>
                  <SelectItem value="out">Zerados</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="flex gap-2">
              <Dialog open={isMovementDialogOpen} onOpenChange={setIsMovementDialogOpen}>
                <DialogTrigger asChild>
                  <Button variant="outline">
                    <History className="h-4 w-4 mr-2" />
                    Nova Movimentação
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[500px]">
                  <DialogHeader>
                    <DialogTitle>Nova Movimentação</DialogTitle>
                    <DialogDescription>
                      Registre entrada, saída ou ajuste de estoque
                    </DialogDescription>
                  </DialogHeader>
                  <div className="grid gap-4 py-4">
                    <div className="grid gap-2">
                      <Label>Tipo de Movimentação *</Label>
                      <div className="flex gap-2">
                        <Button 
                          type="button"
                          variant={movementType === 'entrada' ? 'default' : 'outline'}
                          className="flex-1"
                          onClick={() => setMovementType('entrada')}
                        >
                          <ArrowDownCircle className="h-4 w-4 mr-2" />
                          Entrada
                        </Button>
                        <Button 
                          type="button"
                          variant={movementType === 'saida' ? 'default' : 'outline'}
                          className="flex-1"
                          onClick={() => setMovementType('saida')}
                        >
                          <ArrowUpCircle className="h-4 w-4 mr-2" />
                          Saída
                        </Button>
                        <Button 
                          type="button"
                          variant={movementType === 'ajuste' ? 'default' : 'outline'}
                          className="flex-1"
                          onClick={() => setMovementType('ajuste')}
                        >
                          Ajuste
                        </Button>
                      </div>
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="product">Produto *</Label>
                      <Select>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione o produto" />
                        </SelectTrigger>
                        <SelectContent>
                          {products.filter(p => p.is_active).map((product) => (
                            <SelectItem key={product.id} value={product.id}>
                              {product.name} ({product.current_quantity} {product.unit})
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="grid gap-2">
                        <Label htmlFor="quantity">Quantidade *</Label>
                        <Input id="quantity" type="number" min="0" step="0.01" />
                      </div>
                      <div className="grid gap-2">
                        <Label htmlFor="reason">Motivo *</Label>
                        <Select>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione" />
                          </SelectTrigger>
                          <SelectContent>
                            {movementReasons[movementType].map((reason) => (
                              <SelectItem key={reason} value={reason}>{reason}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    {movementType === 'entrada' && (
                      <div className="grid gap-2">
                        <Label htmlFor="unit_cost">Custo Unitário (R$)</Label>
                        <Input id="unit_cost" type="number" min="0" step="0.01" />
                      </div>
                    )}
                    <div className="grid gap-2">
                      <Label htmlFor="notes">Observações</Label>
                      <Textarea id="notes" placeholder="Observações adicionais..." />
                    </div>
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setIsMovementDialogOpen(false)}>
                      Cancelar
                    </Button>
                    <Button onClick={() => setIsMovementDialogOpen(false)}>
                      Registrar
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>

              <Dialog open={isProductDialogOpen} onOpenChange={setIsProductDialogOpen}>
                <DialogTrigger asChild>
                  <Button>
                    <Plus className="h-4 w-4 mr-2" />
                    Novo Produto
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[500px]">
                  <DialogHeader>
                    <DialogTitle>Novo Produto</DialogTitle>
                    <DialogDescription>
                      Cadastre um novo item no estoque
                    </DialogDescription>
                  </DialogHeader>
                  <div className="grid gap-4 py-4">
                    <div className="grid gap-2">
                      <Label htmlFor="name">Nome do Produto *</Label>
                      <Input id="name" placeholder="Ex: Seringa 10ml" />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="grid gap-2">
                        <Label htmlFor="category">Categoria</Label>
                        <Select>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione" />
                          </SelectTrigger>
                          <SelectContent>
                            {categories.map((cat) => (
                              <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="grid gap-2">
                        <Label htmlFor="unit">Unidade *</Label>
                        <Select>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione" />
                          </SelectTrigger>
                          <SelectContent>
                            {stockUnits.map((unit) => (
                              <SelectItem key={unit.value} value={unit.value}>{unit.label}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="grid gap-2">
                        <Label htmlFor="current_qty">Quantidade Atual</Label>
                        <Input id="current_qty" type="number" min="0" step="0.01" defaultValue="0" />
                      </div>
                      <div className="grid gap-2">
                        <Label htmlFor="min_qty">Quantidade Mínima</Label>
                        <Input id="min_qty" type="number" min="0" step="0.01" defaultValue="0" />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="grid gap-2">
                        <Label htmlFor="avg_cost">Custo Médio (R$)</Label>
                        <Input id="avg_cost" type="number" min="0" step="0.01" />
                      </div>
                      <div className="grid gap-2">
                        <Label htmlFor="expiration">Data de Validade</Label>
                        <Input id="expiration" type="date" />
                      </div>
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="supplier">Fornecedor</Label>
                      <Input id="supplier" placeholder="Nome do fornecedor" />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="product_notes">Observações</Label>
                      <Textarea id="product_notes" placeholder="Observações adicionais..." />
                    </div>
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setIsProductDialogOpen(false)}>
                      Cancelar
                    </Button>
                    <Button onClick={() => setIsProductDialogOpen(false)}>
                      Salvar
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>
          </div>

          <Card>
            <CardContent className="pt-6">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Produto</TableHead>
                    <TableHead>Categoria</TableHead>
                    <TableHead className="text-right">Qtd. Atual</TableHead>
                    <TableHead className="text-right">Qtd. Mín.</TableHead>
                    <TableHead className="text-right">Custo Méd.</TableHead>
                    <TableHead>Estoque</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredProducts.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center text-muted-foreground py-8">
                        Nenhum produto encontrado
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredProducts.map((product) => (
                      <TableRow key={product.id}>
                        <TableCell className="font-medium">{product.name}</TableCell>
                        <TableCell>{getCategoryName(product.category)}</TableCell>
                        <TableCell className="text-right">
                          {product.current_quantity} {product.unit}
                        </TableCell>
                        <TableCell className="text-right">
                          {product.min_quantity} {product.unit}
                        </TableCell>
                        <TableCell className="text-right">
                          {product.avg_cost ? `R$ ${product.avg_cost.toFixed(2)}` : "-"}
                        </TableCell>
                        <TableCell>{getStockBadge(product)}</TableCell>
                        <TableCell>
                          <Badge variant={product.is_active ? "default" : "secondary"}>
                            {product.is_active ? "Ativo" : "Inativo"}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-1">
                            <Button variant="ghost" size="icon">
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="icon">
                              {product.is_active ? (
                                <ToggleRight className="h-4 w-4 text-primary" />
                              ) : (
                                <ToggleLeft className="h-4 w-4" />
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
        </TabsContent>

        {/* Kits Tab */}
        <TabsContent value="kits" className="space-y-4">
          <ProductKitsTab />
        </TabsContent>

        {/* Movements Tab */}
        <TabsContent value="movements" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Histórico de Movimentações</CardTitle>
              <CardDescription>
                Todas as entradas, saídas e ajustes de estoque
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Data/Hora</TableHead>
                    <TableHead>Produto</TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead className="text-right">Quantidade</TableHead>
                    <TableHead>Motivo</TableHead>
                    <TableHead className="text-right">Custo Unit.</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {movements.map((movement) => {
                    const product = products.find(p => p.id === movement.product_id);
                    const isSale = movement.reference_type === 'sale';
                    const isProcedureUse = movement.reference_type === 'procedure_execution';
                    const patientName = (movement as any).patient_name;
                    
                    // Format the reason display
                    const getReasonDisplay = () => {
                      if (isProcedureUse) {
                        return 'Uso em Procedimento';
                      }
                      return movement.reason;
                    };
                    
                    return (
                      <TableRow key={movement.id}>
                        <TableCell>
                          {format(new Date(movement.created_at), "dd/MM/yyyy HH:mm", { locale: ptBR })}
                        </TableCell>
                        <TableCell className="font-medium">{product?.name || (movement as any).products?.name || "-"}</TableCell>
                        <TableCell>
                          <Badge 
                            variant={
                              movement.movement_type === 'entrada' || movement.movement_type === 'devolucao' 
                                ? 'default' 
                                : movement.movement_type === 'saida' || movement.movement_type === 'venda' 
                                  ? 'destructive' 
                                  : 'secondary'
                            }
                          >
                            {(movement.movement_type === 'entrada' || movement.movement_type === 'devolucao') && <ArrowDownCircle className="h-3 w-3 mr-1" />}
                            {(movement.movement_type === 'saida' || movement.movement_type === 'venda') && <ArrowUpCircle className="h-3 w-3 mr-1" />}
                            {stockMovementTypeLabels[movement.movement_type as StockMovementType] || movement.movement_type}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          {(movement.movement_type === 'saida' || movement.movement_type === 'venda') ? '-' : ''}{movement.quantity} {product?.unit || (movement as any).products?.unit}
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-col gap-1">
                            <div className="flex items-center gap-1.5">
                              {isProcedureUse && <Syringe className="h-3.5 w-3.5 text-orange-600" />}
                              <span className={isProcedureUse ? 'text-orange-700 font-medium' : ''}>{getReasonDisplay()}</span>
                            </div>
                            {isProcedureUse && patientName && (
                              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                <User className="h-3 w-3" />
                                <span>Paciente: {patientName}</span>
                              </div>
                            )}
                            {isProcedureUse && movement.notes && (
                              <span className="text-xs text-muted-foreground">{movement.notes}</span>
                            )}
                            {isSale && movement.notes && (
                              <span className="text-xs text-muted-foreground">{movement.notes}</span>
                            )}
                            {isSale && movement.reference_id && (
                              <button
                                onClick={() => handleViewSale(movement.reference_id!)}
                                className="text-xs text-primary hover:underline flex items-center gap-1 mt-0.5"
                              >
                                <ExternalLink className="h-3 w-3" />
                                Ver venda
                              </button>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          {movement.unit_cost ? `R$ ${Number(movement.unit_cost).toFixed(2)}` : "-"}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Categories Tab */}
        <TabsContent value="categories" className="space-y-4">
          <div className="flex justify-end">
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Nova Categoria
            </Button>
          </div>
          <Card>
            <CardContent className="pt-6">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nome</TableHead>
                    <TableHead>Descrição</TableHead>
                    <TableHead>Produtos</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {categories.map((category) => {
                    return (
                      <TableRow key={category.id}>
                        <TableCell className="font-medium">{category.name}</TableCell>
                        <TableCell>-</TableCell>
                        <TableCell>{category.product_count} produtos</TableCell>
                        <TableCell>
                          <Badge variant="default">
                            Ativa
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <Button variant="ghost" size="icon">
                            <Edit className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
      
      {/* Sale Details Dialog */}
      <SaleDetailsDialog
        saleId={selectedSaleId}
        open={isSaleDialogOpen}
        onOpenChange={setIsSaleDialogOpen}
      />
    </div>
  );
}
