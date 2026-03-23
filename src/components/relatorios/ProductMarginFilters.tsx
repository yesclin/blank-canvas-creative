import { useState } from 'react';
import { format, subDays, startOfMonth, endOfMonth } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Calendar, X, Download, FileSpreadsheet } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import type { ProductMarginFilters as MarginFiltersType } from '@/types/productMarginReport';
import { marginStatusOptions } from '@/types/productMarginReport';

interface ProductMarginFiltersProps {
  filters: MarginFiltersType;
  onFiltersChange: (filters: MarginFiltersType) => void;
  products?: { id: string; name: string }[];
  categories?: { id: string; name: string }[];
  onExportCSV?: () => void;
  onExportPDF?: () => void;
}

type QuickPeriod = 'today' | 'week' | 'month' | 'custom';

const periodOptions: { value: QuickPeriod; label: string }[] = [
  { value: 'today', label: 'Hoje' },
  { value: 'week', label: 'Esta semana' },
  { value: 'month', label: 'Este mês' },
  { value: 'custom', label: 'Personalizado' },
];

export function ProductMarginFilters({
  filters,
  onFiltersChange,
  products = [],
  categories = [],
  onExportCSV,
  onExportPDF,
}: ProductMarginFiltersProps) {
  const [period, setPeriod] = useState<QuickPeriod>('month');

  const handlePeriodChange = (newPeriod: QuickPeriod) => {
    setPeriod(newPeriod);
    const today = new Date();
    let startDate: Date;
    let endDate: Date = today;

    switch (newPeriod) {
      case 'today':
        startDate = today;
        break;
      case 'week':
        startDate = subDays(today, 7);
        break;
      case 'month':
        startDate = startOfMonth(today);
        endDate = endOfMonth(today);
        break;
      default:
        return;
    }

    onFiltersChange({ ...filters, startDate, endDate });
  };

  const handleClearFilters = () => {
    const today = new Date();
    onFiltersChange({
      startDate: startOfMonth(today),
      endDate: endOfMonth(today),
      status: 'all',
      productId: undefined,
      categoryId: undefined,
    });
    setPeriod('month');
  };

  const activeFiltersCount = [
    filters.status !== 'all',
    filters.productId,
    filters.categoryId,
  ].filter(Boolean).length;

  return (
    <div className="space-y-4 p-4 bg-card rounded-lg border">
      {/* Linha principal: período, status e filtros */}
      <div className="flex flex-wrap items-center gap-3">
        {/* Período rápido */}
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">Período:</span>
          <div className="flex gap-1">
            {periodOptions.map((option) => (
              <Button
                key={option.value}
                variant={period === option.value ? 'default' : 'outline'}
                size="sm"
                onClick={() => handlePeriodChange(option.value)}
                className="text-xs"
              >
                {option.label}
              </Button>
            ))}
          </div>
        </div>

        {/* Seletor de data customizada */}
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" size="sm" className="gap-2">
              <Calendar className="h-4 w-4" />
              {format(filters.startDate, 'dd/MM/yy', { locale: ptBR })} -{' '}
              {format(filters.endDate, 'dd/MM/yy', { locale: ptBR })}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <CalendarComponent
              mode="range"
              selected={{ from: filters.startDate, to: filters.endDate }}
              onSelect={(range) => {
                if (range?.from && range?.to) {
                  setPeriod('custom');
                  onFiltersChange({ ...filters, startDate: range.from, endDate: range.to });
                }
              }}
              locale={ptBR}
              numberOfMonths={2}
            />
          </PopoverContent>
        </Popover>

        {/* Status da venda */}
        <Select
          value={filters.status}
          onValueChange={(value: 'all' | 'active' | 'canceled') =>
            onFiltersChange({ ...filters, status: value })
          }
        >
          <SelectTrigger className="w-[140px]">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            {marginStatusOptions.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Espaçador */}
        <div className="flex-1" />

        {/* Limpar filtros */}
        {activeFiltersCount > 0 && (
          <Button variant="ghost" size="sm" onClick={handleClearFilters} className="gap-1 text-muted-foreground">
            <X className="h-4 w-4" />
            Limpar
          </Button>
        )}

        {/* Botões de exportação */}
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={onExportPDF} className="gap-2">
            <Download className="h-4 w-4" />
            PDF
          </Button>
          <Button variant="outline" size="sm" onClick={onExportCSV} className="gap-2">
            <FileSpreadsheet className="h-4 w-4" />
            CSV
          </Button>
        </div>
      </div>

      {/* Linha de filtros adicionais */}
      <div className="flex flex-wrap items-center gap-3 pt-2 border-t">
        {/* Produto */}
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">Produto:</span>
          <Select
            value={filters.productId || 'all'}
            onValueChange={(value) =>
              onFiltersChange({ ...filters, productId: value === 'all' ? undefined : value })
            }
          >
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="Todos os produtos" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os produtos</SelectItem>
              {products.map((product) => (
                <SelectItem key={product.id} value={product.id}>
                  {product.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Categoria */}
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">Categoria:</span>
          <Select
            value={filters.categoryId || 'all'}
            onValueChange={(value) =>
              onFiltersChange({ ...filters, categoryId: value === 'all' ? undefined : value })
            }
          >
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Todas as categorias" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas as categorias</SelectItem>
              {categories.map((cat) => (
                <SelectItem key={cat.id} value={cat.id}>
                  {cat.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
    </div>
  );
}
