import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import {
  ShoppingCart,
  Package,
  CreditCard,
  User,
  Calendar,
  FileText,
  X,
  Loader2,
  Receipt,
  ArrowUpCircle,
  ArrowDownCircle,
  Ban,
  CheckCircle,
  RotateCcw,
  BoxesIcon,
  DollarSign,
  TrendingUp,
  TrendingDown,
  ExternalLink,
  Clock,
  UserX,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { paymentStatusLabels, paymentStatusColors, type PaymentStatus, stockMovementTypeLabels, type StockMovementType } from "@/types/inventory";
import { paymentMethods } from "@/types/gestao";

interface SaleReportDetailsDialogProps {
  saleId: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

// Hook para buscar detalhes completos da venda
function useSaleFullDetails(saleId: string | undefined) {
  return useQuery({
    queryKey: ["sale-full-details", saleId],
    queryFn: async () => {
      if (!saleId) return null;

      // Buscar venda com itens e relacionamentos
      const { data: sale, error: saleError } = await supabase
        .from("sales")
        .select(`
          *,
          patients(id, full_name),
          professionals(id, full_name),
          sale_items(*),
          appointments(id, scheduled_date, start_time, status, appointment_type)
        `)
        .eq("id", saleId)
        .single();

      if (saleError) throw saleError;

      // Buscar movimentos de estoque relacionados
      const { data: stockMovements, error: stockError } = await supabase
        .from("stock_movements")
        .select(`
          *,
          products(id, name, unit)
        `)
        .eq("reference_id", saleId)
        .order("created_at", { ascending: false });

      if (stockError) throw stockError;

      // Buscar transações financeiras relacionadas (pela venda ou pela transação vinculada)
      let transactions: any[] = [];
      
      // Buscar transação de entrada
      if (sale.transaction_id) {
        const { data: mainTx } = await supabase
          .from("finance_transactions")
          .select("*")
          .eq("id", sale.transaction_id)
          .maybeSingle();
        
        if (mainTx) transactions.push(mainTx);
      }

      // Buscar transações de estorno (descrição que referencia a venda)
      const { data: reversalTx } = await supabase
        .from("finance_transactions")
        .select("*")
        .ilike("description", `%${saleId}%`)
        .neq("id", sale.transaction_id || "");

      if (reversalTx) {
        transactions = [...transactions, ...reversalTx];
      }

      // Também buscar por notes que mencionam a venda
      const { data: notesTx } = await supabase
        .from("finance_transactions")
        .select("*")
        .ilike("notes", `%${saleId}%`)
        .not("id", "in", `(${transactions.map(t => t.id).join(",") || "''"})`)
        .limit(10);

      if (notesTx) {
        transactions = [...transactions, ...notesTx];
      }

      // Buscar perfis dos usuários (criador e cancelador)
      const userIds = new Set<string>();
      if (sale.created_by) userIds.add(sale.created_by);
      if (sale.canceled_by) userIds.add(sale.canceled_by);

      let profilesMap: Record<string, string> = {};
      if (userIds.size > 0) {
        const { data: profiles } = await supabase
          .from("profiles")
          .select("id, full_name")
          .in("id", Array.from(userIds));

        if (profiles) {
          profilesMap = profiles.reduce((acc, p) => {
            acc[p.id] = p.full_name || "Usuário desconhecido";
            return acc;
          }, {} as Record<string, string>);
        }
      }

      return {
        sale,
        stockMovements: stockMovements || [],
        transactions,
        createdByName: sale.created_by ? profilesMap[sale.created_by] || null : null,
        canceledByName: sale.canceled_by ? profilesMap[sale.canceled_by] || null : null,
      };
    },
    enabled: !!saleId,
  });
}

function formatCurrency(value: number): string {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value);
}

function formatDateTime(dateStr: string): string {
  try {
    return format(new Date(dateStr), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR });
  } catch {
    return dateStr;
  }
}

function getPaymentMethodLabel(method?: string | null): string {
  return paymentMethods.find((m) => m.value === method)?.label || method || "-";
}

function getMovementTypeColor(type: StockMovementType): string {
  switch (type) {
    case 'entrada':
    case 'devolucao':
      return 'text-green-600 dark:text-green-400';
    case 'saida':
    case 'venda':
      return 'text-red-600 dark:text-red-400';
    default:
      return 'text-muted-foreground';
  }
}

function getMovementIcon(type: StockMovementType) {
  switch (type) {
    case 'entrada':
    case 'devolucao':
      return <ArrowUpCircle className="h-4 w-4 text-green-600" />;
    case 'saida':
    case 'venda':
      return <ArrowDownCircle className="h-4 w-4 text-red-600" />;
    default:
      return <RotateCcw className="h-4 w-4 text-muted-foreground" />;
  }
}

export function SaleReportDetailsDialog({ saleId, open, onOpenChange }: SaleReportDetailsDialogProps) {
  const { data, isLoading } = useSaleFullDetails(saleId || undefined);

  const sale = data?.sale;
  const stockMovements = data?.stockMovements || [];
  const transactions = data?.transactions || [];
  const createdByName = data?.createdByName;
  const canceledByName = data?.canceledByName;

  const isCanceled = sale?.status === 'cancelado' || sale?.payment_status === 'cancelado';

  if (!open) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[750px] max-h-[90vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ShoppingCart className={`h-5 w-5 ${isCanceled ? 'text-destructive' : 'text-primary'}`} />
            Detalhes da Venda
            {isCanceled && (
              <Badge variant="destructive" className="ml-2">
                <Ban className="h-3 w-3 mr-1" />
                Cancelada
              </Badge>
            )}
            {!isCanceled && (
              <Badge variant="outline" className="bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400 ml-2">
                <CheckCircle className="h-3 w-3 mr-1" />
                Ativa
              </Badge>
            )}
          </DialogTitle>
          <DialogDescription>
            {sale?.sale_number ? `Venda ${sale.sale_number}` : "Visualize todos os detalhes da venda"}
          </DialogDescription>
        </DialogHeader>

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : sale ? (
          <ScrollArea className="max-h-[70vh] pr-2">
            <Tabs defaultValue="resumo" className="w-full">
              <TabsList className="grid w-full grid-cols-4 mb-4">
                <TabsTrigger value="resumo" className="gap-1.5">
                  <Receipt className="h-3.5 w-3.5" />
                  Resumo
                </TabsTrigger>
                <TabsTrigger value="produtos" className="gap-1.5">
                  <Package className="h-3.5 w-3.5" />
                  Produtos
                </TabsTrigger>
                <TabsTrigger value="estoque" className="gap-1.5">
                  <BoxesIcon className="h-3.5 w-3.5" />
                  Estoque
                </TabsTrigger>
                <TabsTrigger value="financeiro" className="gap-1.5">
                  <DollarSign className="h-3.5 w-3.5" />
                  Financeiro
                </TabsTrigger>
              </TabsList>

              {/* Tab Resumo */}
              <TabsContent value="resumo" className="space-y-4">
                {/* Alerta de Cancelamento */}
                {isCanceled && (
                  <Card className="border-destructive/50 bg-destructive/5">
                    <CardContent className="py-4">
                      <div className="flex items-start gap-3">
                        <div className="p-2 rounded-full bg-destructive/10">
                          <UserX className="h-5 w-5 text-destructive" />
                        </div>
                        <div className="flex-1 space-y-1">
                          <h4 className="font-semibold text-destructive">Venda Cancelada</h4>
                          <div className="text-sm space-y-1">
                            {sale.canceled_at && (
                              <p className="flex items-center gap-2">
                                <Clock className="h-3.5 w-3.5" />
                                <span className="text-muted-foreground">Cancelado em:</span>
                                <span className="font-medium">{formatDateTime(sale.canceled_at)}</span>
                              </p>
                            )}
                            {canceledByName && (
                              <p className="flex items-center gap-2">
                                <User className="h-3.5 w-3.5" />
                                <span className="text-muted-foreground">Cancelado por:</span>
                                <span className="font-medium">{canceledByName}</span>
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Info básica */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground flex items-center gap-1">
                      <Calendar className="h-3.5 w-3.5" />
                      Data da Venda
                    </p>
                    <p className="font-medium">{formatDateTime(sale.sale_date)}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground flex items-center gap-1">
                      <Receipt className="h-3.5 w-3.5" />
                      Status do Pagamento
                    </p>
                    <Badge className={paymentStatusColors[sale.payment_status as PaymentStatus]}>
                      {paymentStatusLabels[sale.payment_status as PaymentStatus] || sale.payment_status}
                    </Badge>
                  </div>
                  {sale.patients && (
                    <div className="space-y-1">
                      <p className="text-sm text-muted-foreground flex items-center gap-1">
                        <User className="h-3.5 w-3.5" />
                        Cliente
                      </p>
                      <Link 
                        to={`/app/prontuario/${sale.patient_id}`}
                        className="font-medium text-primary hover:underline inline-flex items-center gap-1"
                        onClick={() => onOpenChange(false)}
                      >
                        {sale.patients.full_name}
                        <ExternalLink className="h-3 w-3" />
                      </Link>
                    </div>
                  )}
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground flex items-center gap-1">
                      <CreditCard className="h-3.5 w-3.5" />
                      Forma de Pagamento
                    </p>
                    <p className="font-medium">{getPaymentMethodLabel(sale.payment_method)}</p>
                  </div>
                </div>

                {/* Atendimento vinculado */}
                {sale.appointments && (
                  <>
                    <Separator />
                    <Card className="border-primary/20 bg-primary/5">
                      <CardContent className="py-4">
                        <div className="flex items-center justify-between">
                          <div className="space-y-1">
                            <p className="text-sm text-muted-foreground flex items-center gap-1">
                              <Calendar className="h-3.5 w-3.5" />
                              Atendimento Vinculado
                            </p>
                            <p className="font-medium">
                              {format(new Date(sale.appointments.scheduled_date), "dd/MM/yyyy", { locale: ptBR })} às {sale.appointments.start_time?.slice(0, 5)}
                              {sale.appointments.appointment_type && (
                                <span className="text-muted-foreground"> - {sale.appointments.appointment_type}</span>
                              )}
                            </p>
                          </div>
                          <Link 
                            to={`/app/agenda?date=${sale.appointments.scheduled_date}`}
                            className="text-primary hover:underline text-sm flex items-center gap-1"
                            onClick={() => onOpenChange(false)}
                          >
                            Ver na agenda
                            <ExternalLink className="h-3 w-3" />
                          </Link>
                        </div>
                      </CardContent>
                    </Card>
                  </>
                )}

                <Separator />

                {/* Valores */}
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium">Valores</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Subtotal</span>
                      <span>{formatCurrency(sale.subtotal)}</span>
                    </div>
                    {sale.discount_amount > 0 && (
                      <div className="flex justify-between text-sm text-red-600">
                        <span>Desconto ({sale.discount_percent || 0}%)</span>
                        <span>- {formatCurrency(sale.discount_amount)}</span>
                      </div>
                    )}
                    <Separator />
                    <div className="flex justify-between font-medium text-lg">
                      <span>Total</span>
                      <span className={isCanceled ? 'text-muted-foreground line-through' : 'text-green-600'}>
                        {formatCurrency(sale.total_amount)}
                      </span>
                    </div>
                  </CardContent>
                </Card>

                {/* Observações */}
                {sale.notes && (
                  <>
                    <div>
                      <h4 className="font-medium flex items-center gap-2 mb-2 text-sm">
                        <FileText className="h-4 w-4" />
                        Observações
                      </h4>
                      <p className="text-sm text-muted-foreground bg-muted p-3 rounded-md">
                        {sale.notes}
                      </p>
                    </div>
                  </>
                )}

                {/* Rastreabilidade */}
                <div className="bg-muted/50 p-4 rounded-lg space-y-3">
                  <h4 className="font-medium text-sm flex items-center gap-2">
                    <ArrowUpCircle className="h-4 w-4" />
                    Rastreabilidade
                  </h4>
                  <div className="text-xs space-y-2">
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <span className="text-muted-foreground">ID da Venda:</span>
                        <p className="font-mono text-[10px] break-all">{sale.id}</p>
                      </div>
                      {sale.sale_number && (
                        <div>
                          <span className="text-muted-foreground">Número:</span>
                          <p className="font-medium">{sale.sale_number}</p>
                        </div>
                      )}
                    </div>
                    <Separator />
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <span className="text-muted-foreground">Criado em:</span>
                        <p className="font-medium">{formatDateTime(sale.created_at)}</p>
                      </div>
                      {createdByName && (
                        <div>
                          <span className="text-muted-foreground">Criado por:</span>
                          <p className="font-medium">{createdByName}</p>
                        </div>
                      )}
                    </div>
                    {sale.transaction_id && (
                      <div>
                        <span className="text-muted-foreground">ID Transação Financeira:</span>
                        <p className="font-mono text-[10px] break-all">{sale.transaction_id}</p>
                      </div>
                    )}
                  </div>
                </div>
              </TabsContent>

              {/* Tab Produtos */}
              <TabsContent value="produtos" className="space-y-4">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Produto</TableHead>
                      <TableHead className="text-center">Qtd</TableHead>
                      <TableHead className="text-right">Preço Unit.</TableHead>
                      <TableHead className="text-right">Total</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {sale.sale_items?.length > 0 ? (
                      sale.sale_items.map((item: any) => (
                        <TableRow key={item.id}>
                          <TableCell className="font-medium">
                            <div className="flex items-center gap-2">
                              <Package className="h-4 w-4 text-muted-foreground" />
                              {item.product_name}
                            </div>
                          </TableCell>
                          <TableCell className="text-center">
                            <Badge variant="outline">{item.quantity}</Badge>
                          </TableCell>
                          <TableCell className="text-right">{formatCurrency(item.unit_price)}</TableCell>
                          <TableCell className="text-right font-medium">{formatCurrency(item.total_price)}</TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={4} className="text-center text-muted-foreground py-8">
                          Nenhum item encontrado
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>

                {/* Totalizador */}
                <div className="flex justify-end pt-2 border-t">
                  <div className="text-right space-y-1">
                    <p className="text-sm text-muted-foreground">
                      Total de {sale.sale_items?.length || 0} item(ns)
                    </p>
                    <p className="text-lg font-bold">{formatCurrency(sale.total_amount)}</p>
                  </div>
                </div>
              </TabsContent>

              {/* Tab Estoque */}
              <TabsContent value="estoque" className="space-y-4">
                {stockMovements.length > 0 ? (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Tipo</TableHead>
                        <TableHead>Produto</TableHead>
                        <TableHead className="text-center">Qtd</TableHead>
                        <TableHead>Motivo</TableHead>
                        <TableHead className="text-right">Data</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {stockMovements.map((movement: any) => (
                        <TableRow key={movement.id}>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              {getMovementIcon(movement.movement_type)}
                              <span className={getMovementTypeColor(movement.movement_type)}>
                                {stockMovementTypeLabels[movement.movement_type as StockMovementType] || movement.movement_type}
                              </span>
                            </div>
                          </TableCell>
                          <TableCell className="font-medium">
                            {movement.products?.name || movement.product_id}
                          </TableCell>
                          <TableCell className="text-center">
                            <Badge 
                              variant="outline" 
                              className={movement.movement_type === 'venda' || movement.movement_type === 'saida' 
                                ? 'border-red-200 text-red-700 dark:border-red-800 dark:text-red-400' 
                                : 'border-green-200 text-green-700 dark:border-green-800 dark:text-green-400'
                              }
                            >
                              {movement.movement_type === 'venda' || movement.movement_type === 'saida' ? '-' : '+'}
                              {movement.quantity}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-sm text-muted-foreground">
                            {movement.reason}
                          </TableCell>
                          <TableCell className="text-right text-sm">
                            {formatDateTime(movement.created_at)}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <BoxesIcon className="h-12 w-12 mx-auto mb-3 opacity-50" />
                    <p>Nenhum movimento de estoque encontrado</p>
                    <p className="text-sm">Movimentos são registrados automaticamente nas vendas</p>
                  </div>
                )}
              </TabsContent>

              {/* Tab Financeiro */}
              <TabsContent value="financeiro" className="space-y-4">
                {transactions.length > 0 ? (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Tipo</TableHead>
                        <TableHead>Descrição</TableHead>
                        <TableHead className="text-right">Valor</TableHead>
                        <TableHead className="text-right">Data</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {transactions.map((tx: any) => (
                        <TableRow key={tx.id}>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              {tx.type === 'entrada' ? (
                                <>
                                  <TrendingUp className="h-4 w-4 text-green-600" />
                                  <Badge variant="outline" className="border-green-200 text-green-700 dark:border-green-800 dark:text-green-400">
                                    Entrada
                                  </Badge>
                                </>
                              ) : (
                                <>
                                  <TrendingDown className="h-4 w-4 text-red-600" />
                                  <Badge variant="outline" className="border-red-200 text-red-700 dark:border-red-800 dark:text-red-400">
                                    Saída
                                  </Badge>
                                </>
                              )}
                            </div>
                          </TableCell>
                          <TableCell className="font-medium max-w-[200px] truncate">
                            {tx.description}
                          </TableCell>
                          <TableCell className={`text-right font-semibold ${tx.type === 'entrada' ? 'text-green-600' : 'text-red-600'}`}>
                            {tx.type === 'entrada' ? '+' : '-'} {formatCurrency(tx.amount)}
                          </TableCell>
                          <TableCell className="text-right text-sm">
                            {formatDateTime(tx.transaction_date)}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <DollarSign className="h-12 w-12 mx-auto mb-3 opacity-50" />
                    <p>Nenhuma transação financeira encontrada</p>
                    <p className="text-sm">Transações são registradas automaticamente nas vendas</p>
                  </div>
                )}

                {/* Resumo financeiro */}
                {transactions.length > 0 && (
                  <Card className="bg-muted/50">
                    <CardContent className="pt-4">
                      <div className="grid grid-cols-3 gap-4 text-center">
                        <div>
                          <p className="text-xs text-muted-foreground">Entradas</p>
                          <p className="text-lg font-bold text-green-600">
                            {formatCurrency(
                              transactions
                                .filter((t: any) => t.type === 'entrada')
                                .reduce((sum: number, t: any) => sum + Number(t.amount), 0)
                            )}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">Saídas</p>
                          <p className="text-lg font-bold text-red-600">
                            {formatCurrency(
                              transactions
                                .filter((t: any) => t.type === 'saida')
                                .reduce((sum: number, t: any) => sum + Number(t.amount), 0)
                            )}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">Líquido</p>
                          <p className="text-lg font-bold text-primary">
                            {formatCurrency(
                              transactions.reduce((sum: number, t: any) => 
                                t.type === 'entrada' 
                                  ? sum + Number(t.amount) 
                                  : sum - Number(t.amount), 0
                              )
                            )}
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </TabsContent>
            </Tabs>
          </ScrollArea>
        ) : (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <X className="h-12 w-12 text-muted-foreground/50 mb-3" />
            <p className="text-muted-foreground">Venda não encontrada</p>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
