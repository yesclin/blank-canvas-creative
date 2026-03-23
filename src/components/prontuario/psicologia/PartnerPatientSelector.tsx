/**
 * PartnerPatientSelector — Busca e seleciona o parceiro(a) para atendimento de casal.
 * Exibe um campo de busca por nome que consulta a tabela de pacientes da clínica.
 */

import { useState, useEffect, useCallback } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Users, Search, X, UserPlus } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useClinicData } from "@/hooks/useClinicData";

interface PatientResult {
  id: string;
  full_name: string;
  cpf?: string | null;
  phone?: string | null;
}

interface PartnerPatientSelectorProps {
  currentPatientId: string;
  currentPatientName?: string;
  selectedPartner: PatientResult | null;
  onSelectPartner: (patient: PatientResult | null) => void;
  disabled?: boolean;
}

export function PartnerPatientSelector({
  currentPatientId,
  currentPatientName,
  selectedPartner,
  onSelectPartner,
  disabled = false,
}: PartnerPatientSelectorProps) {
  const { clinic } = useClinicData();
  const [search, setSearch] = useState("");
  const [results, setResults] = useState<PatientResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [showResults, setShowResults] = useState(false);

  const doSearch = useCallback(async (term: string) => {
    if (!term.trim() || term.length < 2 || !clinic?.id) {
      setResults([]);
      return;
    }
    setSearching(true);
    try {
      const { data, error } = await supabase
        .from("patients")
        .select("id, full_name, cpf, phone")
        .eq("clinic_id", clinic.id)
        .neq("id", currentPatientId)
        .ilike("full_name", `%${term}%`)
        .limit(10);

      if (error) throw error;
      setResults(data || []);
      setShowResults(true);
    } catch {
      setResults([]);
    } finally {
      setSearching(false);
    }
  }, [clinic?.id, currentPatientId]);

  useEffect(() => {
    const timeout = setTimeout(() => doSearch(search), 300);
    return () => clearTimeout(timeout);
  }, [search, doSearch]);

  if (selectedPartner) {
    return (
      <Card className="border-primary/30 bg-primary/5">
        <CardContent className="p-4">
          <Label className="text-xs text-muted-foreground mb-2 block">Atendimento de Casal</Label>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Users className="h-5 w-5 text-primary" />
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium">{currentPatientName || "Paciente titular"}</span>
                  <Badge variant="outline" className="text-[10px]">Titular</Badge>
                </div>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="text-sm font-medium">{selectedPartner.full_name}</span>
                  <Badge variant="outline" className="text-[10px]">Parceiro(a)</Badge>
                </div>
              </div>
            </div>
            {!disabled && (
              <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => onSelectPartner(null)}>
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-dashed border-primary/30">
      <CardContent className="p-4">
        <Label className="text-xs text-muted-foreground mb-2 block">
          <UserPlus className="h-3.5 w-3.5 inline mr-1" />
          Selecione o(a) parceiro(a) para atendimento de casal
        </Label>
        <div className="relative">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar paciente por nome..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 h-9"
            disabled={disabled}
            onFocus={() => results.length > 0 && setShowResults(true)}
            onBlur={() => setTimeout(() => setShowResults(false), 200)}
          />
          {showResults && results.length > 0 && (
            <div className="absolute top-full left-0 right-0 mt-1 bg-background border rounded-md shadow-lg z-50 max-h-48 overflow-y-auto">
              {results.map((p) => (
                <button
                  key={p.id}
                  className="w-full text-left px-3 py-2 hover:bg-muted text-sm flex items-center justify-between"
                  onMouseDown={(e) => {
                    e.preventDefault();
                    onSelectPartner(p);
                    setSearch("");
                    setShowResults(false);
                  }}
                >
                  <span>{p.full_name}</span>
                  {p.cpf && <span className="text-xs text-muted-foreground">{p.cpf}</span>}
                </button>
              ))}
            </div>
          )}
          {showResults && search.length >= 2 && results.length === 0 && !searching && (
            <div className="absolute top-full left-0 right-0 mt-1 bg-background border rounded-md shadow-lg z-50 p-3 text-sm text-muted-foreground text-center">
              Nenhum paciente encontrado
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
