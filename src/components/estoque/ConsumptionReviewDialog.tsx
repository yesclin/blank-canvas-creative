import { useState, useEffect } from "react";
import { Loader2, AlertTriangle, CheckCircle2, Package } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { useProcedureConsumptionTemplates } from "@/hooks/useProcedureConsumption";
import { useCreateInventoryMovement } from "@/hooks/useInventoryMovements";
import { useInventoryBatches } from "@/hooks/useInventoryBatches";
import type { ProcedureConsumptionTemplate } from "@/hooks/useProcedureConsumption";

interface ConsumptionLine {
  templateId: string;
  itemId: string;
  itemName: string;
  unit: string;
  quantity: number;
  unitCost: number;
  isRequired: boolean;
  batchRequired: boolean;
  allowEdit: boolean;
  batchId: string;
  controlsBatch: boolean;
  requiresTraceability: boolean;
}

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  procedureId: string;
  appointmentId?: string;
  patientId?: string;
  professionalId?: string;
  onConfirmed?: (totalCost: number) => void;
}

export function ConsumptionReviewDialog({
  open, onOpenChange, procedureId, appointmentId, patientId, professionalId, onConfirmed,
}: Props) {
  const { data: templates = [] } = useProcedureConsumptionTemplates(procedureId);
  const createMovement = useCreateInventoryMovement();
  const [lines, setLines] = useState<ConsumptionLine[]>([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (templates.length > 0 && open) {
      setLines(templates.map(t => ({
        templateId: t.id,
        itemId: t.item_id,
        itemName: t.inventory_items?.name || '',
        unit: t.unit,
        quantity: t.default_quantity,
        unitCost: t.inventory_items?.default_cost_price || 0,
        isRequired: t.is_required,
        batchRequired: t.batch_required,
        allowEdit: t.allow_quantity_edit_on_finish,
        batchId: '',
        controlsBatch: t.inventory_items?.controls_batch || false,
        requiresTraceability: t.inventory_items?.requires_traceability || false,
      })));
    }
  }, [templates, open]);

  const updateLine = (idx: number, key: keyof ConsumptionLine, value: any) => {
    setLines(prev => prev.map((l, i) => i === idx ? { ...l, [key]: value } : l));
  };

  const totalCost = lines.reduce((sum, l) => sum + l.unitCost * l.quantity, 0);

  const hasValidationErrors = lines.some(l =>
    (l.isRequired && l.quantity <= 0) ||
    (l.batchRequired && !l.batchId)
  );

  const formatCurrency = (v: number) => new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(v);

  const handleConfirm = async () => {
    if (hasValidationErrors) return;
    setSaving(true);
    try {
      for (const line of lines) {
        if (line.quantity <= 0) continue;
        await createMovement.mutateAsync({
          item_id: line.itemId,
          batch_id: line.batchId || undefined,
          movement_type: 'procedure_consumption',
          quantity: line.quantity,
          unit_cost: line.unitCost,
          reason: `Consumo em procedimento`,
          source_module: 'appointment',
          source_id: appointmentId || undefined,
          patient_id: patientId || undefined,
          professional_id: professionalId || undefined,
          appointment_id: appointmentId || undefined,
          notes: appointmentId ? `Atendimento: ${appointmentId}` : undefined,
        });
      }
      onConfirmed?.(totalCost);
      onOpenChange(false);
    } catch (e) {
      console.error(e);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={v => !saving && onOpenChange(v)}>
      <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Package className="h-5 w-5 text-primary" />
            Revisão de Consumo
          </DialogTitle>
          <DialogDescription>
            Confirme os itens consumidos antes de finalizar o atendimento
          </DialogDescription>
        </DialogHeader>

        {lines.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Package className="h-8 w-8 mx-auto mb-2 opacity-50" />
            Nenhum consumo configurado para este procedimento
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Item</TableHead>
                <TableHead>Qtd</TableHead>
                <TableHead>Lote</TableHead>
                <TableHead className="text-right">Custo Unit.</TableHead>
                <TableHead className="text-right">Subtotal</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {lines.map((line, idx) => (
                <ConsumptionLineRow
                  key={line.templateId}
                  line={line}
                  onUpdate={(key, value) => updateLine(idx, key, value)}
                />
              ))}
            </TableBody>
          </Table>
        )}

        <div className="flex justify-between items-center mt-4 pt-4 border-t">
          <span className="text-muted-foreground font-medium">Custo Total:</span>
          <span className="text-xl font-bold text-primary">{formatCurrency(totalCost)}</span>
        </div>

        {hasValidationErrors && (
          <div className="flex items-center gap-2 text-sm text-destructive mt-2">
            <AlertTriangle className="h-4 w-4" />
            Resolva os itens obrigatórios antes de confirmar
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>Cancelar</Button>
          <Button onClick={handleConfirm} disabled={saving || hasValidationErrors || lines.length === 0}>
            {saving ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Registrando...</> : (
              <><CheckCircle2 className="h-4 w-4 mr-2" />Confirmar Consumo</>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function ConsumptionLineRow({ line, onUpdate }: {
  line: ConsumptionLine;
  onUpdate: (key: keyof ConsumptionLine, value: any) => void;
}) {
  const { data: batches = [] } = useInventoryBatches(
    line.controlsBatch ? { itemId: line.itemId, status: 'active' } : undefined
  );

  const formatCurrency = (v: number) => new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(v);

  const today = new Date().toISOString().split("T")[0];

  // Filter out expired batches and sort FEFO (first expired, first out)
  const availableBatches = batches
    .filter(b => b.quantity_available > 0)
    .filter(b => !b.expiry_date || b.expiry_date >= today) // block expired
    .sort((a, b) => {
      // FEFO: batches expiring sooner come first
      if (a.expiry_date && b.expiry_date) return a.expiry_date.localeCompare(b.expiry_date);
      if (a.expiry_date) return -1;
      if (b.expiry_date) return 1;
      return 0;
    });

  const hasError = (line.isRequired && line.quantity <= 0) || (line.batchRequired && !line.batchId);
  const selectedBatch = batches.find(b => b.id === line.batchId);
  const batchStockInsufficient = selectedBatch && line.quantity > selectedBatch.quantity_available;

  return (
    <TableRow className={hasError || batchStockInsufficient ? 'bg-destructive/5' : ''}>
      <TableCell>
        <div>
          <span className="font-medium">{line.itemName}</span>
          <div className="flex gap-1 mt-0.5">
            {line.isRequired && <Badge variant="outline" className="text-xs">Obrigatório</Badge>}
            {line.requiresTraceability && <Badge variant="outline" className="text-xs">Rastreável</Badge>}
          </div>
        </div>
      </TableCell>
      <TableCell>
        {line.allowEdit ? (
          <Input
            type="number" min="0" step="0.01" className="w-20"
            value={line.quantity}
            onChange={e => onUpdate("quantity", parseFloat(e.target.value) || 0)}
          />
        ) : (
          <span>{line.quantity} {line.unit}</span>
        )}
      </TableCell>
      <TableCell>
        {line.controlsBatch ? (
          <div>
            <Select value={line.batchId} onValueChange={v => onUpdate("batchId", v)}>
              <SelectTrigger className="w-[140px]">
                <SelectValue placeholder="Selecionar" />
              </SelectTrigger>
              <SelectContent>
                {availableBatches.map(b => (
                  <SelectItem key={b.id} value={b.id}>
                    {b.batch_number} (Disp: {b.quantity_available})
                    {b.expiry_date ? ` Val: ${b.expiry_date}` : ''}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {batchStockInsufficient && (
              <span className="text-xs text-destructive">Saldo insuficiente no lote</span>
            )}
          </div>
        ) : (
          <span className="text-muted-foreground">-</span>
        )}
      </TableCell>
      <TableCell className="text-right">{formatCurrency(line.unitCost)}</TableCell>
      <TableCell className="text-right font-medium">{formatCurrency(line.unitCost * line.quantity)}</TableCell>
      <TableCell>
        {hasError || batchStockInsufficient ? (
          <AlertTriangle className="h-4 w-4 text-destructive" />
        ) : (
          <CheckCircle2 className="h-4 w-4 text-green-600" />
        )}
      </TableCell>
    </TableRow>
  );
}
