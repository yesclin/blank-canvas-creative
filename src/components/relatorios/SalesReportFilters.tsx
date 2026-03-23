import { useState } from 'react';
import { format, subDays, startOfMonth, endOfMonth } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Calendar, Search, X, Download, FileSpreadsheet } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { Badge } from '@/components/ui/badge';
import { ChevronDown, Filter } from 'lucide-react';
import type { SalesReportFilters as SalesFiltersType } from '@/types/salesReport';
import { paymentMethodOptions, saleStatusOptions } from '@/types/salesReport';

interface SalesReportFiltersProps {
  filters: SalesFiltersType;
  onFiltersChange: (filters: SalesFiltersType) => void;
  products?: { id: string; name: string }[];
  patients?: { id: string; name: string }[];
  users?: { id: string; name: string }[];
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

export function SalesReportFilters({
  filters,
  onFiltersChange,
  products = [],
  patients = [],
  users = [],
  onExportCSV,
  onExportPDF,
}: SalesReportFiltersProps) {
  const [period, setPeriod] = useState<QuickPeriod>('month');
  const [isAdvancedOpen, setIsAdvancedOpen] = useState(false);
  const [patientSearch, setPatientSearch] = useState('');

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
      patientId: undefined,
      paymentMethod: undefined,
      responsibleUserId: undefined,
    });
    setPeriod('month');
    setPatientSearch('');
  };

  const activeFiltersCount = [
    filters.status !== 'all',
    filters.productId,
    filters.patientId,
    filters.paymentMethod,
    filters.responsibleUserId,
  ].filter(Boolean).length;

  const filteredPatients = patients.filter((p) =>
    p.name.toLowerCase().includes(patientSearch.toLowerCase())
  );

  return (
    <div className="space-y-4 p-4 bg-card rounded-lg border">
      {/* Linha principal: período e status */}
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
            {saleStatusOptions.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Espaçador */}
        <div className="flex-1" />

        {/* Botão filtros avançados */}
        <Collapsible open={isAdvancedOpen} onOpenChange={setIsAdvancedOpen}>
          <CollapsibleTrigger asChild>
            <Button variant="outline" size="sm" className="gap-2">
              <Filter className="h-4 w-4" />
              Filtros
              {activeFiltersCount > 0 && (
                <Badge variant="secondary" className="ml-1 h-5 w-5 p-0 flex items-center justify-center text-xs">
                  {activeFiltersCount}
                </Badge>
              )}
              <ChevronDown className={`h-4 w-4 transition-transform ${isAdvancedOpen ? 'rotate-180' : ''}`} />
            </Button>
          </CollapsibleTrigger>
        </Collapsible>

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

      {/* Filtros avançados */}
      <Collapsible open={isAdvancedOpen} onOpenChange={setIsAdvancedOpen}>
        <CollapsibleContent>
          <div className="pt-4 border-t grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {/* Produto */}
            <div className="space-y-2">
              <Label className="text-sm">Produto</Label>
              <Select
                value={filters.productId || 'all'}
                onValueChange={(value) =>
                  onFiltersChange({ ...filters, productId: value === 'all' ? undefined : value })
                }
              >
                <SelectTrigger>
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

            {/* Paciente com busca */}
            <div className="space-y-2">
              <Label className="text-sm">Paciente</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-full justify-start text-left font-normal">
                    <Search className="mr-2 h-4 w-4 text-muted-foreground" />
                    {filters.patientId
                      ? patients.find((p) => p.id === filters.patientId)?.name || 'Paciente selecionado'
                      : 'Buscar paciente...'}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[280px] p-2" align="start">
                  <Input
                    placeholder="Digite o nome..."
                    value={patientSearch}
                    onChange={(e) => setPatientSearch(e.target.value)}
                    className="mb-2"
                  />
                  <div className="max-h-[200px] overflow-y-auto space-y-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="w-full justify-start"
                      onClick={() => {
                        onFiltersChange({ ...filters, patientId: undefined });
                        setPatientSearch('');
                      }}
                    >
                      Todos os pacientes
                    </Button>
                    {filteredPatients.slice(0, 20).map((patient) => (
                      <Button
                        key={patient.id}
                        variant={filters.patientId === patient.id ? 'secondary' : 'ghost'}
                        size="sm"
                        className="w-full justify-start"
                        onClick={() => {
                          onFiltersChange({ ...filters, patientId: patient.id });
                          setPatientSearch('');
                        }}
                      >
                        {patient.name}
                      </Button>
                    ))}
                    {filteredPatients.length === 0 && patientSearch && (
                      <p className="text-sm text-muted-foreground p-2 text-center">
                        Nenhum paciente encontrado
                      </p>
                    )}
                  </div>
                </PopoverContent>
              </Popover>
            </div>

            {/* Forma de Pagamento */}
            <div className="space-y-2">
              <Label className="text-sm">Forma de Pagamento</Label>
              <Select
                value={filters.paymentMethod || 'all'}
                onValueChange={(value) =>
                  onFiltersChange({ ...filters, paymentMethod: value === 'all' ? undefined : value })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Todas" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas</SelectItem>
                  {paymentMethodOptions.map((method) => (
                    <SelectItem key={method.value} value={method.value}>
                      {method.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Usuário responsável */}
            <div className="space-y-2">
              <Label className="text-sm">Responsável</Label>
              <Select
                value={filters.responsibleUserId || 'all'}
                onValueChange={(value) =>
                  onFiltersChange({ ...filters, responsibleUserId: value === 'all' ? undefined : value })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Todos" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  {users.map((user) => (
                    <SelectItem key={user.id} value={user.id}>
                      {user.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CollapsibleContent>
      </Collapsible>
    </div>
  );
}
