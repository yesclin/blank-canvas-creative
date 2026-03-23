import { useState } from 'react';
import { format, subDays, startOfMonth, endOfMonth, subMonths } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Calendar, Filter, Download, FileSpreadsheet } from 'lucide-react';
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
import { cn } from '@/lib/utils';
import type { ReportFilters, ReportPeriod } from '@/types/relatorios';

interface ReportFiltersBarProps {
  filters: ReportFilters;
  onFiltersChange: (filters: ReportFilters) => void;
  professionals?: { id: string; name: string }[];
  insurances?: { id: string; name: string }[];
  showProfessionalFilter?: boolean;
  showInsuranceFilter?: boolean;
  onExportPDF?: () => void;
  onExportExcel?: () => void;
}

const periodOptions: { value: ReportPeriod; label: string }[] = [
  { value: 'day', label: 'Hoje' },
  { value: 'week', label: 'Esta semana' },
  { value: 'month', label: 'Este mês' },
  { value: 'custom', label: 'Personalizado' },
];

export function ReportFiltersBar({
  filters,
  onFiltersChange,
  professionals = [],
  insurances = [],
  showProfessionalFilter = true,
  showInsuranceFilter = true,
  onExportPDF,
  onExportExcel,
}: ReportFiltersBarProps) {
  const [period, setPeriod] = useState<ReportPeriod>('month');

  const handlePeriodChange = (newPeriod: ReportPeriod) => {
    setPeriod(newPeriod);
    const today = new Date();
    let startDate: Date;
    let endDate: Date = today;

    switch (newPeriod) {
      case 'day':
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

  return (
    <div className="flex flex-wrap items-center gap-3 p-4 bg-card rounded-lg border">
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

      {/* Seletor de data */}
      <div className="flex items-center gap-2">
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" size="sm" className="gap-2">
              <Calendar className="h-4 w-4" />
              {format(filters.startDate, 'dd/MM/yy', { locale: ptBR })} - {format(filters.endDate, 'dd/MM/yy', { locale: ptBR })}
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
      </div>

      {/* Filtro por profissional */}
      {showProfessionalFilter && professionals.length > 0 && (
        <Select
          value={filters.professionalId || 'all'}
          onValueChange={(value) => 
            onFiltersChange({ ...filters, professionalId: value === 'all' ? undefined : value })
          }
        >
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Profissional" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos profissionais</SelectItem>
            {professionals.map((prof) => (
              <SelectItem key={prof.id} value={prof.id}>
                {prof.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}

      {/* Filtro por convênio */}
      {showInsuranceFilter && insurances.length > 0 && (
        <Select
          value={filters.insuranceId || 'all'}
          onValueChange={(value) => 
            onFiltersChange({ ...filters, insuranceId: value === 'all' ? undefined : value })
          }
        >
          <SelectTrigger className="w-[160px]">
            <SelectValue placeholder="Convênio" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos convênios</SelectItem>
            {insurances.map((ins) => (
              <SelectItem key={ins.id} value={ins.id}>
                {ins.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}

      {/* Espaçador */}
      <div className="flex-1" />

      {/* Botões de exportação */}
      <div className="flex items-center gap-2">
        <Button variant="outline" size="sm" onClick={onExportPDF} className="gap-2">
          <Download className="h-4 w-4" />
          PDF
        </Button>
        <Button variant="outline" size="sm" onClick={onExportExcel} className="gap-2">
          <FileSpreadsheet className="h-4 w-4" />
          Excel
        </Button>
      </div>
    </div>
  );
}
