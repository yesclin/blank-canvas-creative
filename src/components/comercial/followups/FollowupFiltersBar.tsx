import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Search, X } from "lucide-react";
import { FOLLOWUP_TYPES, FOLLOWUP_STATUSES } from "@/types/followup";
import { useCrmUsers } from "@/hooks/crm/useCrmOptions";
import type { FollowupsFilters } from "@/hooks/crm/useFollowups";

interface FollowupFiltersBarProps {
  filters: FollowupsFilters;
  onFiltersChange: (filters: FollowupsFilters) => void;
}

export function FollowupFiltersBar({ filters, onFiltersChange }: FollowupFiltersBarProps) {
  const { data: users } = useCrmUsers();
  const hasFilters = Object.values(filters).some(v => v);

  const set = (key: keyof FollowupsFilters, value: string) => {
    onFiltersChange({ ...filters, [key]: value || undefined });
  };

  return (
    <div className="flex flex-wrap gap-2 items-center">
      <div className="relative flex-1 min-w-[200px] max-w-xs">
        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Buscar assunto ou notas..."
          className="pl-9"
          value={filters.search || ""}
          onChange={e => set("search", e.target.value)}
        />
      </div>

      <Select value={filters.status || ""} onValueChange={v => set("status", v)}>
        <SelectTrigger className="w-[140px]"><SelectValue placeholder="Status" /></SelectTrigger>
        <SelectContent>
          <SelectItem value="">Todos</SelectItem>
          {FOLLOWUP_STATUSES.map(s => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}
        </SelectContent>
      </Select>

      <Select value={filters.followup_type || ""} onValueChange={v => set("followup_type", v)}>
        <SelectTrigger className="w-[140px]"><SelectValue placeholder="Tipo" /></SelectTrigger>
        <SelectContent>
          <SelectItem value="">Todos</SelectItem>
          {FOLLOWUP_TYPES.map(t => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}
        </SelectContent>
      </Select>

      <Select value={filters.assigned_to || ""} onValueChange={v => set("assigned_to", v)}>
        <SelectTrigger className="w-[160px]"><SelectValue placeholder="Responsável" /></SelectTrigger>
        <SelectContent>
          <SelectItem value="">Todos</SelectItem>
          {(users || []).map((u: any) => <SelectItem key={u.id} value={u.id}>{u.name}</SelectItem>)}
        </SelectContent>
      </Select>

      {hasFilters && (
        <Button variant="ghost" size="sm" onClick={() => onFiltersChange({})}>
          <X className="h-4 w-4 mr-1" /> Limpar
        </Button>
      )}
    </div>
  );
}
