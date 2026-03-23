import { useState } from 'react';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import {
  ShoppingCart,
  CreditCard,
  ChevronRight,
  Loader2,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { usePatientSales } from '@/hooks/usePatientSales';
import { SaleDetailsDialog } from '@/components/gestao/SaleDetailsDialog';
import { paymentStatusLabels, paymentStatusColors, type PaymentStatus } from '@/types/inventory';
import { paymentMethods } from '@/types/gestao';

interface PatientSalesHistoryProps {
  patientId: string;
}

export function PatientSalesHistory({ patientId }: PatientSalesHistoryProps) {
  const { data: sales = [], isLoading } = usePatientSales(patientId);
  const [selectedSaleId, setSelectedSaleId] = useState<string | null>(null);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  const getPaymentMethodLabel = (method?: string | null) => {
    return paymentMethods.find((m) => m.value === method)?.label || method || '-';
  };

  const totalVendas = sales
    .filter(s => s.payment_status !== 'cancelado')
    .reduce((sum, s) => sum + Number(s.total_amount), 0);

  if (isLoading) {
    return (
      <Card>
        <CardContent className="py-12">
          <div className="flex items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base flex items-center gap-2">
              <ShoppingCart className="h-4 w-4" />
              Histórico de Vendas
            </CardTitle>
            {sales.length > 0 && (
              <div className="text-sm text-muted-foreground">
                Total: <span className="font-semibold text-foreground">{formatCurrency(totalVendas)}</span>
              </div>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {sales.length > 0 ? (
            <div className="space-y-3">
              {sales.map((sale) => {
                const isCanceled = sale.payment_status === 'cancelado' || sale.status === 'cancelado';
                
                return (
                  <div
                    key={sale.id}
                    className={`flex items-center justify-between p-3 border rounded-lg transition-colors cursor-pointer ${
                      isCanceled 
                        ? 'bg-muted/50 border-destructive/30 opacity-75' 
                        : 'hover:bg-muted/30'
                    }`}
                    onClick={() => setSelectedSaleId(sale.id)}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`text-center min-w-[50px] ${isCanceled ? 'opacity-60' : ''}`}>
                        <p className="text-lg font-semibold">
                          {format(parseISO(sale.sale_date), 'dd', { locale: ptBR })}
                        </p>
                        <p className="text-xs text-muted-foreground uppercase">
                          {format(parseISO(sale.sale_date), 'MMM', { locale: ptBR })}
                        </p>
                      </div>
                      <Separator orientation="vertical" className="h-10" />
                      <div className={isCanceled ? 'opacity-60' : ''}>
                        <p className={`font-medium ${isCanceled ? 'line-through text-muted-foreground' : ''}`}>
                          {formatCurrency(sale.total_amount)}
                        </p>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <CreditCard className="h-3.5 w-3.5" />
                          <span>{getPaymentMethodLabel(sale.payment_method)}</span>
                        </div>
                        {sale.sale_items && sale.sale_items.length > 0 && (
                          <p className="text-xs text-muted-foreground mt-0.5">
                            {sale.sale_items.length} {sale.sale_items.length === 1 ? 'item' : 'itens'}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <Badge className={paymentStatusColors[sale.payment_status as PaymentStatus]}>
                        {paymentStatusLabels[sale.payment_status as PaymentStatus] || sale.payment_status}
                      </Badge>
                      <Button variant="ghost" size="icon" disabled={isCanceled}>
                        <ChevronRight className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-8">
              <ShoppingCart className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
              <p className="text-muted-foreground">Nenhuma venda registrada</p>
            </div>
          )}
        </CardContent>
      </Card>

      <SaleDetailsDialog
        saleId={selectedSaleId}
        open={!!selectedSaleId}
        onOpenChange={(open) => !open && setSelectedSaleId(null)}
      />
    </>
  );
}
