/**
 * ESTÉTICA - Produtos Utilizados
 * 
 * Bloco para registro de produtos com rastreabilidade de lote e validade.
 */

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { 
  Plus, 
  Package, 
  AlertTriangle,
  Calendar,
  Trash2,
  Edit,
  FileText,
} from 'lucide-react';
import { format, differenceInDays, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import {
  useProdutosUtilizadosData,
  PROCEDURE_TYPES,
  PRODUCT_UNITS,
  type AestheticProductUsed,
  type CreateProductUsedData,
} from '@/hooks/aesthetics/useProdutosUtilizadosData';

interface ProdutosUtilizadosBlockProps {
  patientId: string | null;
  appointmentId?: string | null;
  canEdit?: boolean;
}

export function ProdutosUtilizadosBlock({
  patientId,
  appointmentId,
  canEdit = false,
}: ProdutosUtilizadosBlockProps) {
  const {
    products,
    currentAppointmentProducts,
    isLoading,
    addProduct,
    updateProduct,
    deleteProduct,
    isAdding,
    getExpiringProducts,
  } = useProdutosUtilizadosData({ patientId, appointmentId });

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<AestheticProductUsed | null>(null);
  const [showAllHistory, setShowAllHistory] = useState(false);
  
  const [formData, setFormData] = useState<CreateProductUsedData>({
    product_name: '',
    manufacturer: '',
    batch_number: '',
    expiry_date: '',
    quantity: 1,
    unit: 'un',
    procedure_type: '',
    application_area: '',
    notes: '',
  });

  const displayProducts = showAllHistory ? products : currentAppointmentProducts;
  const expiringProducts = getExpiringProducts();

  const resetForm = () => {
    setFormData({
      product_name: '',
      manufacturer: '',
      batch_number: '',
      expiry_date: '',
      quantity: 1,
      unit: 'un',
      procedure_type: '',
      application_area: '',
      notes: '',
    });
    setEditingProduct(null);
  };

  const handleOpenNew = () => {
    resetForm();
    setDialogOpen(true);
  };

  const handleEdit = (product: AestheticProductUsed) => {
    setEditingProduct(product);
    setFormData({
      product_name: product.product_name,
      manufacturer: product.manufacturer || '',
      batch_number: product.batch_number || '',
      expiry_date: product.expiry_date || '',
      quantity: product.quantity,
      unit: product.unit,
      procedure_type: product.procedure_type || '',
      application_area: product.application_area || '',
      notes: product.notes || '',
    });
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!formData.product_name || formData.quantity <= 0) return;

    if (editingProduct) {
      await updateProduct({ id: editingProduct.id, data: formData });
    } else {
      await addProduct(formData);
    }
    
    setDialogOpen(false);
    resetForm();
  };

  const handleDelete = async (id: string) => {
    if (confirm('Tem certeza que deseja remover este produto?')) {
      await deleteProduct(id);
    }
  };

  const getExpiryBadge = (expiryDate: string | null) => {
    if (!expiryDate) return null;
    
    const days = differenceInDays(parseISO(expiryDate), new Date());
    
    if (days < 0) {
      return <Badge variant="destructive" className="text-xs">Vencido</Badge>;
    } else if (days <= 30) {
      return <Badge variant="outline" className="text-xs border-primary/50 text-primary">Vence em {days}d</Badge>;
    }
    return null;
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (!patientId) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <Package className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground">Selecione um paciente para ver os produtos.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-3">
          <Package className="h-5 w-5 text-primary" />
          <div>
            <h3 className="font-semibold">Produtos Utilizados</h3>
            <p className="text-xs text-muted-foreground">
              {displayProducts.length} produto(s) registrado(s)
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowAllHistory(!showAllHistory)}
            className="text-muted-foreground"
          >
            {showAllHistory ? 'Apenas Sessão Atual' : 'Ver Histórico'}
          </Button>
          
          {canEdit && (
            <Button size="sm" onClick={handleOpenNew}>
              <Plus className="h-4 w-4 mr-1.5" />
              Registrar
            </Button>
          )}
        </div>
      </div>

      {/* Alerta de produtos próximos do vencimento */}
      {expiringProducts.length > 0 && (
        <Card className="border-destructive/30 bg-destructive/5">
          <CardContent className="py-3 px-4">
            <div className="flex items-center gap-2 text-destructive">
              <AlertTriangle className="h-4 w-4" />
              <span className="text-sm font-medium">
                {expiringProducts.length} produto(s) próximo(s) do vencimento
              </span>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Tabela de produtos */}
      {displayProducts.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <FileText className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
            <p className="text-muted-foreground">
              {showAllHistory 
                ? 'Nenhum produto registrado para este paciente.'
                : 'Nenhum produto registrado nesta sessão.'}
            </p>
            {canEdit && (
              <Button size="sm" variant="outline" className="mt-4" onClick={handleOpenNew}>
                <Plus className="h-4 w-4 mr-1.5" />
                Registrar Primeiro Produto
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Produto</TableHead>
                  <TableHead>Fabricante</TableHead>
                  <TableHead>Lote</TableHead>
                  <TableHead>Validade</TableHead>
                  <TableHead>Qtd</TableHead>
                  <TableHead>Tipo</TableHead>
                  {canEdit && <TableHead className="w-20">Ações</TableHead>}
                </TableRow>
              </TableHeader>
              <TableBody>
                {displayProducts.map((product) => (
                  <TableRow key={product.id}>
                    <TableCell className="font-medium">{product.product_name}</TableCell>
                    <TableCell className="text-muted-foreground">
                      {product.manufacturer || '-'}
                    </TableCell>
                    <TableCell>
                      {product.batch_number ? (
                        <code className="text-xs bg-muted px-1.5 py-0.5 rounded">
                          {product.batch_number}
                        </code>
                      ) : '-'}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {product.expiry_date ? (
                          <>
                            <span className="text-sm">
                              {format(parseISO(product.expiry_date), 'dd/MM/yyyy')}
                            </span>
                            {getExpiryBadge(product.expiry_date)}
                          </>
                        ) : '-'}
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="font-medium">{product.quantity}</span>
                      <span className="text-muted-foreground ml-1">{product.unit}</span>
                    </TableCell>
                    <TableCell>
                      {product.procedure_type ? (
                        <Badge variant="secondary" className="text-xs">
                          {PROCEDURE_TYPES.find(t => t.value === product.procedure_type)?.label || product.procedure_type}
                        </Badge>
                      ) : '-'}
                    </TableCell>
                    {canEdit && (
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-8 w-8"
                            onClick={() => handleEdit(product)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-8 w-8 text-destructive hover:text-destructive"
                            onClick={() => handleDelete(product.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    )}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* Dialog de Registro/Edição */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {editingProduct ? 'Editar Produto' : 'Registrar Produto Utilizado'}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-2">
            {/* Produto e Fabricante */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs">Produto *</Label>
                <Input
                  value={formData.product_name}
                  onChange={(e) => setFormData({ ...formData, product_name: e.target.value })}
                  placeholder="Nome do produto"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Fabricante</Label>
                <Input
                  value={formData.manufacturer}
                  onChange={(e) => setFormData({ ...formData, manufacturer: e.target.value })}
                  placeholder="Nome do fabricante"
                />
              </div>
            </div>

            {/* Lote e Validade */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs">Número do Lote</Label>
                <Input
                  value={formData.batch_number}
                  onChange={(e) => setFormData({ ...formData, batch_number: e.target.value })}
                  placeholder="Ex: LOT2024ABC"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Data de Validade</Label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    type="date"
                    value={formData.expiry_date}
                    onChange={(e) => setFormData({ ...formData, expiry_date: e.target.value })}
                    className="pl-9"
                  />
                </div>
              </div>
            </div>

            {/* Quantidade e Unidade */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs">Quantidade *</Label>
                <Input
                  type="number"
                  value={formData.quantity}
                  onChange={(e) => setFormData({ ...formData, quantity: parseFloat(e.target.value) || 0 })}
                  min="0"
                  step="0.1"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Unidade</Label>
                <Select
                  value={formData.unit}
                  onValueChange={(v) => setFormData({ ...formData, unit: v })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {PRODUCT_UNITS.map((u) => (
                      <SelectItem key={u.value} value={u.value}>{u.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Tipo de Procedimento e Área */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs">Tipo de Procedimento</Label>
                <Select
                  value={formData.procedure_type}
                  onValueChange={(v) => setFormData({ ...formData, procedure_type: v })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione" />
                  </SelectTrigger>
                  <SelectContent>
                    {PROCEDURE_TYPES.map((t) => (
                      <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Área de Aplicação</Label>
                <Input
                  value={formData.application_area}
                  onChange={(e) => setFormData({ ...formData, application_area: e.target.value })}
                  placeholder="Ex: Glabela, Testa"
                />
              </div>
            </div>

            {/* Observações */}
            <div className="space-y-1.5">
              <Label className="text-xs">Observações</Label>
              <Textarea
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                placeholder="Observações adicionais..."
                rows={2}
                className="resize-none"
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Cancelar
            </Button>
            <Button 
              onClick={handleSave}
              disabled={!formData.product_name || formData.quantity <= 0 || isAdding}
            >
              {isAdding ? 'Salvando...' : 'Salvar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
