import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Search, X } from "lucide-react";
import { QUOTE_STATUSES } from "@/types/quote";
import type { QuotesFilters } from "@/hooks/crm/useQuotes";

interface QuoteFiltersBarProps {
  filters: QuotesFilters;
  onFiltersChange: (filters: QuotesFilters) => void;
}

export function QuoteFiltersBar({ filters, onFiltersChange }: QuoteFiltersBarProps) {
  const hasFilters = Object.values(filters).some(v => v);

  const set = (key: keyof QuotesFilters, value: string) => {
    onFiltersChange({ ...filters, [key]: value || undefined });
  };

  return (
    <div className="flex flex-wrap gap-2 items-center">
      <div className="relative flex-1 min-w-[200px] max-w-xs">
        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Buscar nº ou notas..."
          className="pl-9"
          value={filters.search || ""}
          onChange={e => set("search", e.target.value)}
        />
      </div>

      <Select value={filters.status || ""} onValueChange={v => set("status", v)}>
        <SelectTrigger className="w-[140px]"><SelectValue placeholder="Status" /></SelectTrigger>
        <SelectContent>
          <SelectItem value="">Todos</SelectItem>
          {QUOTE_STATUSES.map(s => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}
        </SelectContent>
      </Select>

      <Input
        type="date"
        className="w-[140px]"
        value={filters.dateFrom || ""}
        onChange={e => set("dateFrom", e.target.value)}
        placeholder="De"
      />
      <Input
        type="date"
        className="w-[140px]"
        value={filters.dateTo || ""}
        onChange={e => set("dateTo", e.target.value)}
        placeholder="Até"
      />

      {hasFilters && (
        <Button variant="ghost" size="sm" onClick={() => onFiltersChange({})}>
          <X className="h-4 w-4 mr-1" /> Limpar
        </Button>
      )}
    </div>
  );
}
