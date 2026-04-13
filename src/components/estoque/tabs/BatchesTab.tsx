import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useInventoryBatches, useUpdateBatchStatus } from "@/hooks/useInventoryBatches";
import { batchStatusLabels, batchStatusColors } from "@/types/inventory-batches";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Button } from "@/components/ui/button";
import { Ban, CheckCircle } from "lucide-react";

export function BatchesTab() {
  const [statusFilter, setStatusFilter] = useState("all");
  const { data: batches = [], isLoading } = useInventoryBatches({ status: statusFilter });
  const updateStatus = useUpdateBatchStatus();

  const today = new Date().toISOString().split("T")[0];

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Lotes</CardTitle>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[160px]"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              <SelectItem value="active">Ativos</SelectItem>
              <SelectItem value="expired">Vencidos</SelectItem>
              <SelectItem value="blocked">Bloqueados</SelectItem>
              <SelectItem value="depleted">Esgotados</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <p className="text-center text-muted-foreground py-8">Carregando...</p>
        ) : batches.length === 0 ? (
          <p className="text-center text-muted-foreground py-8">Nenhum lote encontrado</p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Item</TableHead>
                <TableHead>Lote</TableHead>
                <TableHead>Validade</TableHead>
                <TableHead className="text-right">Recebido</TableHead>
                <TableHead className="text-right">Disponível</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Local</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {batches.map(batch => {
                const isExpired = batch.expiry_date && batch.expiry_date < today;
                const displayStatus = isExpired && batch.status === 'active' ? 'expired' : batch.status;

                return (
                  <TableRow key={batch.id}>
                    <TableCell className="font-medium">{(batch as any).inventory_items?.name || '-'}</TableCell>
                    <TableCell>{batch.batch_number}</TableCell>
                    <TableCell>
                      {batch.expiry_date ? (
                        <span className={isExpired ? 'text-red-600 font-medium' : ''}>
                          {format(new Date(batch.expiry_date), "dd/MM/yyyy", { locale: ptBR })}
                        </span>
                      ) : '-'}
                    </TableCell>
                    <TableCell className="text-right">{batch.quantity_received}</TableCell>
                    <TableCell className="text-right">{batch.quantity_available}</TableCell>
                    <TableCell>
                      <Badge className={batchStatusColors[displayStatus as keyof typeof batchStatusColors]}>
                        {batchStatusLabels[displayStatus as keyof typeof batchStatusLabels]}
                      </Badge>
                    </TableCell>
                    <TableCell>{batch.storage_location || '-'}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        {batch.status === 'active' && (
                          <Button variant="ghost" size="icon" title="Bloquear lote"
                            onClick={() => updateStatus.mutate({ id: batch.id, status: 'blocked' })}
                            disabled={updateStatus.isPending}>
                            <Ban className="h-4 w-4 text-yellow-600" />
                          </Button>
                        )}
                        {batch.status === 'blocked' && (
                          <Button variant="ghost" size="icon" title="Desbloquear lote"
                            onClick={() => updateStatus.mutate({ id: batch.id, status: 'active' })}
                            disabled={updateStatus.isPending}>
                            <CheckCircle className="h-4 w-4 text-green-600" />
                          </Button>
                        )}
                      </div>
                    </TableCell>
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
