import { useState, useRef, useEffect, useCallback } from "react";
import { Search, Plus, AlertTriangle, User } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import type { Patient } from "@/types/agenda";

interface PatientAutocompleteProps {
  value: string; // patient_id
  onSelect: (patientId: string) => void;
  onCreateNew: () => void;
  /** Pre-loaded patients list for initial display */
  patients: Patient[];
}

interface SearchResult extends Patient {}

export function PatientAutocomplete({
  value,
  onSelect,
  onCreateNew,
  patients,
}: PatientAutocompleteProps) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>();

  // Resolve selected patient name from value
  useEffect(() => {
    if (value) {
      const found = patients.find(p => p.id === value);
      if (found) {
        setSelectedPatient(found);
        setQuery("");
      }
    } else {
      setSelectedPatient(null);
    }
  }, [value, patients]);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const searchPatients = useCallback(async (term: string) => {
    if (term.length < 2) {
      setResults([]);
      setIsOpen(false);
      return;
    }

    setIsSearching(true);

    try {
      // Clean CPF/phone: remove non-digits for numeric search
      const cleanTerm = term.replace(/\D/g, "");
      const isNumeric = cleanTerm.length >= 3;

      let query = supabase
        .from("patients")
        .select("id, clinic_id, full_name, email, phone, cpf, birth_date, gender, has_clinical_alert, clinical_alert_text, is_active")
        .eq("is_active", true)
        .order("full_name")
        .limit(10);

      if (isNumeric) {
        // Search by CPF or phone (numeric)
        query = query.or(`cpf.ilike.%${cleanTerm}%,phone.ilike.%${cleanTerm}%`);
      } else {
        // Search by name
        query = query.ilike("full_name", `%${term}%`);
      }

      const { data, error } = await query;

      if (error) {
        console.error("Patient search error:", error);
        setResults([]);
      } else {
        setResults((data || []) as SearchResult[]);
      }
    } catch (err) {
      console.error("Patient search error:", err);
      setResults([]);
    } finally {
      setIsSearching(false);
      setIsOpen(true);
    }
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setQuery(val);

    // Clear selection if user is typing
    if (selectedPatient) {
      setSelectedPatient(null);
      onSelect("");
    }

    // Debounce search
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      searchPatients(val);
    }, 300);
  };

  const handleSelect = (patient: Patient) => {
    setSelectedPatient(patient);
    setQuery("");
    setIsOpen(false);
    onSelect(patient.id);
  };

  const handleClear = () => {
    setSelectedPatient(null);
    setQuery("");
    onSelect("");
    inputRef.current?.focus();
  };

  const formatCpf = (cpf: string) => {
    const clean = cpf.replace(/\D/g, "");
    if (clean.length === 11) {
      return `${clean.slice(0, 3)}.${clean.slice(3, 6)}.${clean.slice(6, 9)}-${clean.slice(9)}`;
    }
    return cpf;
  };

  return (
    <div ref={containerRef} className="relative">
      {selectedPatient ? (
        <div className="flex items-center gap-2 h-10 px-3 py-2 rounded-md border bg-background">
          <User className="h-4 w-4 text-muted-foreground shrink-0" />
          <span className="flex-1 truncate text-sm">{selectedPatient.full_name}</span>
          {selectedPatient.has_clinical_alert && (
            <AlertTriangle className="h-4 w-4 text-amber-500 shrink-0" />
          )}
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="h-6 px-2 text-xs text-muted-foreground"
            onClick={handleClear}
          >
            Alterar
          </Button>
        </div>
      ) : (
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            ref={inputRef}
            placeholder="Buscar por nome, CPF ou telefone..."
            value={query}
            onChange={handleInputChange}
            onFocus={() => {
              if (query.length >= 2) setIsOpen(true);
            }}
            className="pl-9"
            autoComplete="off"
          />
        </div>
      )}

      {/* Dropdown results */}
      {isOpen && !selectedPatient && (
        <div className="absolute z-50 top-full left-0 right-0 mt-1 bg-popover border rounded-md shadow-lg max-h-[240px] overflow-y-auto">
          {isSearching ? (
            <div className="px-3 py-4 text-sm text-muted-foreground text-center">
              Buscando...
            </div>
          ) : results.length > 0 ? (
            <>
              {results.map((patient) => (
                <button
                  key={patient.id}
                  type="button"
                  className="w-full flex items-start gap-3 px-3 py-2.5 text-left hover:bg-accent transition-colors text-sm"
                  onClick={() => handleSelect(patient)}
                >
                  <User className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="font-medium truncate flex items-center gap-1.5">
                      {patient.full_name}
                      {patient.has_clinical_alert && (
                        <AlertTriangle className="h-3.5 w-3.5 text-amber-500 shrink-0" />
                      )}
                    </div>
                    <div className="text-xs text-muted-foreground flex gap-3 mt-0.5">
                      {patient.cpf && <span>CPF: {formatCpf(patient.cpf)}</span>}
                      {patient.phone && <span>Tel: {patient.phone}</span>}
                    </div>
                  </div>
                </button>
              ))}
              <div className="border-t">
                <button
                  type="button"
                  className="w-full flex items-center gap-2 px-3 py-2.5 text-sm text-primary hover:bg-accent transition-colors font-medium"
                  onClick={() => {
                    setIsOpen(false);
                    onCreateNew();
                  }}
                >
                  <Plus className="h-4 w-4" />
                  Cadastrar novo paciente
                </button>
              </div>
            </>
          ) : (
            <div className="py-3">
              <p className="text-sm text-muted-foreground text-center mb-2">
                Nenhum paciente encontrado
              </p>
              <div className="border-t">
                <button
                  type="button"
                  className="w-full flex items-center gap-2 px-3 py-2.5 text-sm text-primary hover:bg-accent transition-colors font-medium"
                  onClick={() => {
                    setIsOpen(false);
                    onCreateNew();
                  }}
                >
                  <Plus className="h-4 w-4" />
                  Cadastrar novo paciente
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
