import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, ArrowDownCircle, ArrowUpCircle } from "lucide-react";
import { useInventoryMovements } from "@/hooks/useInventoryMovements";
import { movementTypeLabels, movementTypeColors, entryMovementTypes, type InventoryMovementType } from "@/types/inventory-batches";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface Props {
  filterTypes?: InventoryMovementType[];
  title: string;
  description: string;
  onNewClick?: () => void;
  newButtonLabel?: string;
}

export function MovementsListTab({ filterTypes, title, description, onNewClick, newButtonLabel }: Props) {
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  const { data: movements = [], isLoading } = useInventoryMovements({
    types: filterTypes,
    startDate: startDate || undefined,
    endDate: endDate || undefined,
  });

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>{title}</CardTitle>
            <CardDescription>{description}</CardDescription>
          </div>
          {onNewClick && (
            <Button onClick={onNewClick}>
              <Plus className="h-4 w-4 mr-2" />
              {newButtonLabel || "Novo"}
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex gap-2 mb-4">
          <Input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className="w-[160px]" placeholder="Data início" />
          <Input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} className="w-[160px]" placeholder="Data fim" />
        </div>
        {isLoading ? (
          <p className="text-center text-muted-foreground py-8">Carregando...</p>
        ) : movements.length === 0 ? (
          <p className="text-center text-muted-foreground py-8">Nenhuma movimentação encontrada</p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Data/Hora</TableHead>
                <TableHead>Item</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead>Lote</TableHead>
                <TableHead className="text-right">Qtd</TableHead>
                <TableHead className="text-right">Custo Unit.</TableHead>
                <TableHead>Motivo</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {movements.map(m => {
                const isEntry = entryMovementTypes.includes(m.movement_type);
                return (
                  <TableRow key={m.id}>
                    <TableCell>{format(new Date(m.created_at), "dd/MM/yyyy HH:mm", { locale: ptBR })}</TableCell>
                    <TableCell className="font-medium">{(m as any).inventory_items?.name || '-'}</TableCell>
                    <TableCell>
                      <Badge className={movementTypeColors[m.movement_type]}>
                        {isEntry ? <ArrowDownCircle className="h-3 w-3 mr-1" /> : <ArrowUpCircle className="h-3 w-3 mr-1" />}
                        {movementTypeLabels[m.movement_type]}
                      </Badge>
                    </TableCell>
                    <TableCell>{(m as any).inventory_batches?.batch_number || '-'}</TableCell>
                    <TableCell className="text-right">{isEntry ? '+' : '-'}{m.quantity}</TableCell>
                    <TableCell className="text-right">{m.unit_cost ? `R$ ${Number(m.unit_cost).toFixed(2)}` : '-'}</TableCell>
                    <TableCell>{m.reason || m.notes || '-'}</TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}
