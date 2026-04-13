import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useExpiringBatches, useExpiredBatches } from "@/hooks/useInventoryBatches";
import { format, differenceInDays } from "date-fns";
import { ptBR } from "date-fns/locale";

export function ExpiryTab() {
  const [range, setRange] = useState("30");
  const { data: expiring = [], isLoading: l1 } = useExpiringBatches(parseInt(range));
  const { data: expired = [], isLoading: l2 } = useExpiredBatches();

  const allBatches = [...expired, ...expiring];
  const today = new Date();

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Controle de Validade</CardTitle>
            <CardDescription>Lotes vencidos e próximos do vencimento</CardDescription>
          </div>
          <Select value={range} onValueChange={setRange}>
            <SelectTrigger className="w-[180px]"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="7">Próximos 7 dias</SelectItem>
              <SelectItem value="15">Próximos 15 dias</SelectItem>
              <SelectItem value="30">Próximos 30 dias</SelectItem>
              <SelectItem value="60">Próximos 60 dias</SelectItem>
              <SelectItem value="90">Próximos 90 dias</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </CardHeader>
      <CardContent>
        {(l1 || l2) ? (
          <p className="text-center text-muted-foreground py-8">Carregando...</p>
        ) : allBatches.length === 0 ? (
          <p className="text-center text-muted-foreground py-8">Nenhum lote com vencimento próximo</p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Item</TableHead>
                <TableHead>Lote</TableHead>
                <TableHead>Validade</TableHead>
                <TableHead>Dias Restantes</TableHead>
                <TableHead className="text-right">Disponível</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {allBatches.map(b => {
                const expDate = new Date(b.expiry_date!);
                const daysLeft = differenceInDays(expDate, today);
                const isExpired = daysLeft < 0;

                return (
                  <TableRow key={b.id}>
                    <TableCell className="font-medium">{(b as any).inventory_items?.name || '-'}</TableCell>
                    <TableCell>{b.batch_number}</TableCell>
                    <TableCell>{format(expDate, "dd/MM/yyyy", { locale: ptBR })}</TableCell>
                    <TableCell>
                      <span className={isExpired ? 'text-red-600 font-bold' : daysLeft <= 7 ? 'text-orange-600 font-medium' : ''}>
                        {isExpired ? `Vencido há ${Math.abs(daysLeft)} dias` : `${daysLeft} dias`}
                      </span>
                    </TableCell>
                    <TableCell className="text-right">{b.quantity_available}</TableCell>
                    <TableCell>
                      {isExpired ? (
                        <Badge variant="destructive">Vencido</Badge>
                      ) : daysLeft <= 7 ? (
                        <Badge variant="outline" className="border-red-400 text-red-600">Crítico</Badge>
                      ) : (
                        <Badge variant="outline" className="border-orange-400 text-orange-600">Atenção</Badge>
                      )}
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
