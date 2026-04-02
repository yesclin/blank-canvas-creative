import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";
import { useCrmProfessionals, useCrmSpecialties, useCrmUsers } from "@/hooks/crm/useCrmOptions";
import { LEAD_SOURCES } from "@/types/crm";
import type { CommercialFilters } from "@/hooks/crm/useCommercialStats";

interface CommercialFiltersBarProps {
  filters: CommercialFilters;
  onChange: (f: CommercialFilters) => void;
  showSource?: boolean;
  showAssigned?: boolean;
}

export function CommercialFiltersBar({ filters, onChange, showSource = true, showAssigned = true }: CommercialFiltersBarProps) {
  const { data: professionals } = useCrmProfessionals();
  const { data: specialties } = useCrmSpecialties();
  const { data: users } = useCrmUsers();

  const hasFilters = Object.values(filters).some(v => v);
  const set = (k: keyof CommercialFilters, v: string) => onChange({ ...filters, [k]: v || undefined });

  return (
    <div className="flex flex-wrap gap-2 items-center">
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

      <Select value={filters.professionalId || ""} onValueChange={v => set("professionalId", v)}>
        <SelectTrigger className="w-[160px]"><SelectValue placeholder="Profissional" /></SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Todos</SelectItem>
          {(professionals || []).map((p: any) => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}
        </SelectContent>
      </Select>

      <Select value={filters.specialtyId || ""} onValueChange={v => set("specialtyId", v)}>
        <SelectTrigger className="w-[150px]"><SelectValue placeholder="Especialidade" /></SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Todas</SelectItem>
          {(specialties || []).map((s: any) => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
        </SelectContent>
      </Select>

      {showSource && (
        <Select value={filters.source || ""} onValueChange={v => set("source", v)}>
          <SelectTrigger className="w-[130px]"><SelectValue placeholder="Origem" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas</SelectItem>
            {LEAD_SOURCES.map(s => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}
          </SelectContent>
        </Select>
      )}

      {showAssigned && (
        <Select value={filters.assignedTo || ""} onValueChange={v => set("assignedTo", v)}>
          <SelectTrigger className="w-[160px]"><SelectValue placeholder="Responsável" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos</SelectItem>
            {(users || []).map((u: any) => <SelectItem key={u.id} value={u.id}>{u.name}</SelectItem>)}
          </SelectContent>
        </Select>
      )}

      {hasFilters && (
        <Button variant="ghost" size="sm" onClick={() => onChange({})}>
          <X className="h-4 w-4 mr-1" /> Limpar
        </Button>
      )}
    </div>
  );
}
