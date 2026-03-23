import { useState } from 'react';
import { Search, Filter, X, Users, UserCheck, UserX, Shield, Building2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Separator } from '@/components/ui/separator';
import type { PatientFilters, PatientSortField, PatientSortOrder } from '@/types/pacientes';

interface PatientFiltersProps {
  filters: PatientFilters;
  onFiltersChange: (filters: PatientFilters) => void;
  sortField: PatientSortField;
  sortOrder: PatientSortOrder;
  onSortChange: (field: PatientSortField, order: PatientSortOrder) => void;
  insurances: { id: string; name: string }[];
  professionals: { id: string; name: string; specialty: string }[];
  stats: {
    total: number;
    active: number;
    inactive: number;
    withInsurance: number;
    withAlerts: number;
  };
}

export function PatientFiltersComponent({
  filters,
  onFiltersChange,
  sortField,
  sortOrder,
  onSortChange,
  insurances,
  professionals,
  stats,
}: PatientFiltersProps) {
  const [showFilters, setShowFilters] = useState(false);

  const activeFiltersCount = [
    filters.status !== 'all',
    filters.insuranceType !== 'all',
    filters.insuranceId,
    filters.professionalId,
  ].filter(Boolean).length;

  const clearFilters = () => {
    onFiltersChange({
      search: '',
      status: 'all',
      insuranceType: 'all',
      insuranceId: null,
      professionalId: null,
    });
  };

  return (
    <div className="space-y-4">
      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        <div className="bg-card border rounded-lg p-3 flex items-center gap-3">
          <div className="p-2 rounded-lg bg-primary/10">
            <Users className="h-4 w-4 text-primary" />
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Total</p>
            <p className="text-lg font-semibold">{stats.total}</p>
          </div>
        </div>
        <div className="bg-card border rounded-lg p-3 flex items-center gap-3">
          <div className="p-2 rounded-lg bg-green-500/10">
            <UserCheck className="h-4 w-4 text-green-600" />
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Ativos</p>
            <p className="text-lg font-semibold">{stats.active}</p>
          </div>
        </div>
        <div className="bg-card border rounded-lg p-3 flex items-center gap-3">
          <div className="p-2 rounded-lg bg-muted">
            <UserX className="h-4 w-4 text-muted-foreground" />
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Inativos</p>
            <p className="text-lg font-semibold">{stats.inactive}</p>
          </div>
        </div>
        <div className="bg-card border rounded-lg p-3 flex items-center gap-3">
          <div className="p-2 rounded-lg bg-blue-500/10">
            <Building2 className="h-4 w-4 text-blue-600" />
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Convênio</p>
            <p className="text-lg font-semibold">{stats.withInsurance}</p>
          </div>
        </div>
        <div className="bg-card border rounded-lg p-3 flex items-center gap-3">
          <div className="p-2 rounded-lg bg-amber-500/10">
            <Shield className="h-4 w-4 text-amber-600" />
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Com Alertas</p>
            <p className="text-lg font-semibold">{stats.withAlerts}</p>
          </div>
        </div>
      </div>

      {/* Search and Filters Bar */}
      <div className="flex flex-col sm:flex-row gap-3">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por nome, CPF, telefone ou e-mail..."
            className="pl-10"
            value={filters.search}
            onChange={(e) => onFiltersChange({ ...filters, search: e.target.value })}
          />
        </div>

        {/* Sort */}
        <Select
          value={`${sortField}-${sortOrder}`}
          onValueChange={(value) => {
            const [field, order] = value.split('-') as [PatientSortField, PatientSortOrder];
            onSortChange(field, order);
          }}
        >
          <SelectTrigger className="w-full sm:w-[200px]">
            <SelectValue placeholder="Ordenar por" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="name-asc">Nome (A-Z)</SelectItem>
            <SelectItem value="name-desc">Nome (Z-A)</SelectItem>
            <SelectItem value="last_appointment-desc">Último atendimento</SelectItem>
            <SelectItem value="created_at-desc">Mais recente</SelectItem>
            <SelectItem value="created_at-asc">Mais antigo</SelectItem>
          </SelectContent>
        </Select>

        {/* Filter Button */}
        <Popover open={showFilters} onOpenChange={setShowFilters}>
          <PopoverTrigger asChild>
            <Button variant="outline" className="relative">
              <Filter className="h-4 w-4 mr-2" />
              Filtros
              {activeFiltersCount > 0 && (
                <Badge variant="secondary" className="ml-2 h-5 w-5 p-0 flex items-center justify-center text-xs">
                  {activeFiltersCount}
                </Badge>
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-80" align="end">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="font-medium">Filtros avançados</h4>
                {activeFiltersCount > 0 && (
                  <Button variant="ghost" size="sm" onClick={clearFilters}>
                    <X className="h-4 w-4 mr-1" />
                    Limpar
                  </Button>
                )}
              </div>
              <Separator />

              {/* Status */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Status</label>
                <Select
                  value={filters.status}
                  onValueChange={(value) => onFiltersChange({ ...filters, status: value as 'all' | 'active' | 'inactive' })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Todos" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos</SelectItem>
                    <SelectItem value="active">Ativos</SelectItem>
                    <SelectItem value="inactive">Inativos</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Insurance Type */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Tipo de Atendimento</label>
                <Select
                  value={filters.insuranceType}
                  onValueChange={(value) => onFiltersChange({ ...filters, insuranceType: value as 'all' | 'particular' | 'insurance' })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Todos" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos</SelectItem>
                    <SelectItem value="particular">Particular</SelectItem>
                    <SelectItem value="insurance">Convênio</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Specific Insurance */}
              {filters.insuranceType === 'insurance' && (
                <div className="space-y-2">
                  <label className="text-sm font-medium">Convênio</label>
                  <Select
                    value={filters.insuranceId || 'all'}
                    onValueChange={(value) => onFiltersChange({ ...filters, insuranceId: value === 'all' ? null : value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Todos os convênios" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos os convênios</SelectItem>
                      {insurances.map((ins) => (
                        <SelectItem key={ins.id} value={ins.id}>
                          {ins.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              {/* Professional */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Profissional</label>
                <Select
                  value={filters.professionalId || 'all'}
                  onValueChange={(value) => onFiltersChange({ ...filters, professionalId: value === 'all' ? null : value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Todos os profissionais" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos os profissionais</SelectItem>
                    {professionals.map((prof) => (
                      <SelectItem key={prof.id} value={prof.id}>
                        {prof.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </PopoverContent>
        </Popover>
      </div>

      {/* Active Filters Tags */}
      {activeFiltersCount > 0 && (
        <div className="flex flex-wrap gap-2">
          {filters.status !== 'all' && (
            <Badge variant="secondary" className="gap-1">
              Status: {filters.status === 'active' ? 'Ativos' : 'Inativos'}
              <X
                className="h-3 w-3 cursor-pointer"
                onClick={() => onFiltersChange({ ...filters, status: 'all' })}
              />
            </Badge>
          )}
          {filters.insuranceType !== 'all' && (
            <Badge variant="secondary" className="gap-1">
              {filters.insuranceType === 'particular' ? 'Particular' : 'Convênio'}
              <X
                className="h-3 w-3 cursor-pointer"
                onClick={() => onFiltersChange({ ...filters, insuranceType: 'all', insuranceId: null })}
              />
            </Badge>
          )}
          {filters.insuranceId && (
            <Badge variant="secondary" className="gap-1">
              {insurances.find(i => i.id === filters.insuranceId)?.name}
              <X
                className="h-3 w-3 cursor-pointer"
                onClick={() => onFiltersChange({ ...filters, insuranceId: null })}
              />
            </Badge>
          )}
          {filters.professionalId && (
            <Badge variant="secondary" className="gap-1">
              {professionals.find(p => p.id === filters.professionalId)?.name}
              <X
                className="h-3 w-3 cursor-pointer"
                onClick={() => onFiltersChange({ ...filters, professionalId: null })}
              />
            </Badge>
          )}
        </div>
      )}
    </div>
  );
}
