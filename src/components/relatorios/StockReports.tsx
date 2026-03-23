import { Package, AlertTriangle, TrendingDown, DollarSign, Lock } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from '@/components/ui/chart';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { ReportKPICards } from './ReportKPICards';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { useFinancialAccessControl } from '@/hooks/useFinancialAccessControl';
import type { StockConsumptionReport } from '@/types/relatorios';

interface StockReportsProps {
  stockConsumption: StockConsumptionReport[];
}

function formatCurrency(value: number): string {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
}

const COLORS = ['hsl(var(--primary))', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];

const chartConfig = {
  consumed: { label: 'Consumo', color: 'hsl(var(--primary))' },
  estimatedCost: { label: 'Custo', color: 'hsl(var(--accent))' },
};

export function StockReports({ stockConsumption }: StockReportsProps) {
  const { canViewCost, isLoading } = useFinancialAccessControl();
  
  // Se não pode ver custo, mostra mensagem de acesso restrito para relatório de estoque com custos
  if (!isLoading && !canViewCost) {
    return (
      <Alert>
        <Lock className="h-4 w-4" />
        <AlertTitle>Acesso Restrito</AlertTitle>
        <AlertDescription>
          Você não tem permissão para visualizar custos de estoque. 
          Entre em contato com o administrador da clínica.
        </AlertDescription>
      </Alert>
    );
  }
  
  const totalItens = stockConsumption.reduce((acc, s) => acc + s.consumed, 0);
  const custoTotal = stockConsumption.reduce((acc, s) => acc + s.estimatedCost, 0);
  const categorias = [...new Set(stockConsumption.map(s => s.category))].length;
  const itemMaisCaro = stockConsumption.sort((a, b) => b.estimatedCost - a.estimatedCost)[0];

  // Agrupar por categoria para o gráfico de pizza
  const byCategory = stockConsumption.reduce((acc, item) => {
    const existing = acc.find(a => a.category === item.category);
    if (existing) {
      existing.cost += item.estimatedCost;
    } else {
      acc.push({ category: item.category, cost: item.estimatedCost });
    }
    return acc;
  }, [] as { category: string; cost: number }[]);

  return (
    <div className="space-y-6">
      {/* KPIs */}
      <ReportKPICards
        cards={[
          { title: 'Itens Consumidos', value: totalItens, format: 'number', icon: <Package className="h-5 w-5" /> },
          { title: 'Custo Total', value: custoTotal, format: 'currency', variation: -3, icon: <DollarSign className="h-5 w-5" /> },
          { title: 'Categorias', value: categorias, format: 'number', icon: <TrendingDown className="h-5 w-5" /> },
          { title: 'Item Mais Caro', value: formatCurrency(itemMaisCaro?.estimatedCost || 0), icon: <AlertTriangle className="h-5 w-5" /> },
        ]}
      />

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Consumo por Item */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Consumo por Item</CardTitle>
          </CardHeader>
          <CardContent>
            <ChartContainer config={chartConfig} className="h-[300px] w-full">
              <BarChart data={stockConsumption.slice(0, 5)} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis type="number" />
                <YAxis dataKey="productName" type="category" width={120} className="text-xs" />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Bar dataKey="consumed" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]} name="Quantidade" />
              </BarChart>
            </ChartContainer>
          </CardContent>
        </Card>

        {/* Custo por Categoria */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Custo por Categoria</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px] flex items-center justify-center">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={byCategory}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    dataKey="cost"
                    nameKey="category"
                    label={({ category, percent }) => `${category}: ${(percent * 100).toFixed(0)}%`}
                    labelLine={false}
                  >
                    {byCategory.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <ChartTooltip formatter={(value) => formatCurrency(Number(value))} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabela de Consumo */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Detalhamento de Consumo</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Produto</TableHead>
                <TableHead>Categoria</TableHead>
                <TableHead className="text-right">Consumo</TableHead>
                <TableHead className="text-right">Unidade</TableHead>
                <TableHead className="text-right">Custo Estimado</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {stockConsumption.sort((a, b) => b.estimatedCost - a.estimatedCost).map((item) => (
                <TableRow key={item.productId}>
                  <TableCell className="font-medium">{item.productName}</TableCell>
                  <TableCell>
                    <Badge variant="outline">{item.category}</Badge>
                  </TableCell>
                  <TableCell className="text-right">{item.consumed}</TableCell>
                  <TableCell className="text-right text-muted-foreground">{item.unit}</TableCell>
                  <TableCell className="text-right font-semibold">{formatCurrency(item.estimatedCost)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
