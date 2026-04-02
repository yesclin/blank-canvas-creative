import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Search, X } from "lucide-react";
import { LEAD_STATUSES, LEAD_SOURCES } from "@/types/crm";
import { useCrmSpecialties, useCrmUsers } from "@/hooks/crm/useCrmOptions";
import type { LeadsFilters } from "@/hooks/crm/useLeads";

interface LeadsFiltersBarProps {
  filters: LeadsFilters;
  onFiltersChange: (filters: LeadsFilters) => void;
}

export function LeadsFiltersBar({ filters, onFiltersChange }: LeadsFiltersBarProps) {
  const { data: specialties } = useCrmSpecialties();
  const { data: users } = useCrmUsers();

  const set = (key: keyof LeadsFilters, value: string) => {
    onFiltersChange({ ...filters, [key]: value === "__all__" ? undefined : value });
  };

  const clearAll = () => onFiltersChange({});
  const hasFilters = Object.values(filters).some(v => v);

  return (
    <div className="flex flex-wrap items-center gap-3">
      <div className="relative flex-1 min-w-[200px] max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Buscar por nome, telefone ou email..."
          className="pl-9"
          value={filters.search || ""}
          onChange={e => set("search", e.target.value)}
        />
      </div>

      <Select value={filters.status || "__all__"} onValueChange={v => set("status", v)}>
        <SelectTrigger className="w-[140px]"><SelectValue placeholder="Status" /></SelectTrigger>
        <SelectContent>
          <SelectItem value="__all__">Todos</SelectItem>
          {LEAD_STATUSES.map(s => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}
        </SelectContent>
      </Select>

      <Select value={filters.source || "__all__"} onValueChange={v => set("source", v)}>
        <SelectTrigger className="w-[140px]"><SelectValue placeholder="Origem" /></SelectTrigger>
        <SelectContent>
          <SelectItem value="__all__">Todas</SelectItem>
          {LEAD_SOURCES.map(s => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}
        </SelectContent>
      </Select>

      <Select value={filters.specialty_interest_id || "__all__"} onValueChange={v => set("specialty_interest_id", v)}>
        <SelectTrigger className="w-[160px]"><SelectValue placeholder="Especialidade" /></SelectTrigger>
        <SelectContent>
          <SelectItem value="__all__">Todas</SelectItem>
          {(specialties || []).map((s: any) => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
        </SelectContent>
      </Select>

      <Select value={filters.assigned_to || "__all__"} onValueChange={v => set("assigned_to", v)}>
        <SelectTrigger className="w-[160px]"><SelectValue placeholder="Responsável" /></SelectTrigger>
        <SelectContent>
          <SelectItem value="__all__">Todos</SelectItem>
          {(users || []).map((u: any) => <SelectItem key={u.id} value={u.id}>{u.name}</SelectItem>)}
        </SelectContent>
      </Select>

      {hasFilters && (
        <Button variant="ghost" size="sm" onClick={clearAll}>
          <X className="h-4 w-4 mr-1" /> Limpar
        </Button>
      )}
    </div>
  );
}
