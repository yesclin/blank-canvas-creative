import { useState, useRef, useCallback, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Pill, Search, Eye, PlusCircle, Loader2, AlertCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

// ── Types ──────────────────────────────────────────
export interface MedicationResult {
  nome_comercial: string;
  principio_ativo: string;
  forma_farmaceutica: string;
  concentracao: string;
  fabricante: string;
  registro_anvisa?: string;
  categoria?: string;
}

interface MedicationAutocompleteProps {
  value: string;
  onChange: (value: string) => void;
  onInsert: (med: MedicationResult) => void;
  placeholder?: string;
}

const DEBOUNCE_MS = 300;

export function MedicationAutocomplete({
  value,
  onChange,
  onInsert,
  placeholder = 'Ex: Amoxicilina 500mg',
}: MedicationAutocompleteProps) {
  const [results, setResults] = useState<MedicationResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [detailMed, setDetailMed] = useState<MedicationResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const searchMedications = useCallback(async (query: string) => {
    if (query.length < 2) {
      setResults([]);
      setShowDropdown(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        setError('Sessão expirada');
        setLoading(false);
        return;
      }

      const url = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/medications-search?q=${encodeURIComponent(query)}`;
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${session.access_token}`,
          apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
        },
      });

      if (!response.ok) {
        throw new Error(`Erro ${response.status}`);
      }

      const json = await response.json();
      const meds: MedicationResult[] = json.data || [];
      setResults(meds);
      setShowDropdown(meds.length > 0);
    } catch (err) {
      console.error('Medication search error:', err);
      setError('Base externa indisponível no momento. Digite manualmente.');
      setResults([]);
      setShowDropdown(false);
    } finally {
      setLoading(false);
    }
  }, []);

  const handleInputChange = (newValue: string) => {
    onChange(newValue);

    if (debounceRef.current) clearTimeout(debounceRef.current);

    debounceRef.current = setTimeout(() => {
      searchMedications(newValue.trim());
    }, DEBOUNCE_MS);
  };

  // Close dropdown on outside click
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  // Cleanup debounce on unmount
  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, []);

  const handleInsert = (med: MedicationResult) => {
    onInsert(med);
    setShowDropdown(false);
  };

  return (
    <div ref={containerRef} className="relative">
      <Label className="text-xs">Nome do Medicamento *</Label>
      <div className="relative">
        <Input
          placeholder={placeholder}
          value={value}
          onChange={(e) => handleInputChange(e.target.value)}
          onFocus={() => {
            if (results.length > 0) setShowDropdown(true);
          }}
        />
        {loading && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2">
            <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
          </div>
        )}
      </div>

      {error && (
        <p className="text-xs text-destructive mt-1 flex items-center gap-1">
          <AlertCircle className="h-3 w-3" />
          {error}
        </p>
      )}

      {/* Dropdown de sugestões */}
      {showDropdown && results.length > 0 && (
        <div className="absolute z-50 top-full left-0 right-0 mt-1 bg-popover border border-border rounded-lg shadow-lg max-h-72 overflow-y-auto">
          {results.map((med, i) => (
            <div
              key={`${med.nome_comercial}-${i}`}
              className="px-3 py-2.5 hover:bg-accent/50 transition-colors border-b border-border/50 last:border-0"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-medium text-sm">{med.nome_comercial}</span>
                    {med.categoria && (
                      <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
                        {med.categoria}
                      </Badge>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    <span className="font-medium">Princípio ativo:</span> {med.principio_ativo}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {med.forma_farmaceutica} • {med.concentracao}
                  </p>
                </div>
                <div className="flex items-center gap-1 flex-shrink-0 pt-0.5">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="h-7 px-2 text-xs"
                    onClick={(e) => {
                      e.stopPropagation();
                      setDetailMed(med);
                    }}
                  >
                    <Eye className="h-3.5 w-3.5 mr-1" />
                    Detalhes
                  </Button>
                  <Button
                    type="button"
                    variant="default"
                    size="sm"
                    className="h-7 px-2 text-xs"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleInsert(med);
                    }}
                  >
                    <PlusCircle className="h-3.5 w-3.5 mr-1" />
                    Inserir
                  </Button>
                </div>
              </div>
            </div>
          ))}
          <div className="px-3 py-1.5 bg-muted/50 text-[10px] text-muted-foreground text-center">
            As informações são apenas auxiliares. A prescrição é de responsabilidade exclusiva do profissional.
          </div>
        </div>
      )}

      {/* Modal de detalhes */}
      <Dialog open={!!detailMed} onOpenChange={() => setDetailMed(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Pill className="h-5 w-5 text-primary" />
              Detalhes do Medicamento
            </DialogTitle>
          </DialogHeader>
          {detailMed && (
            <div className="space-y-4">
              <div className="space-y-3">
                <DetailRow label="Nome Comercial" value={detailMed.nome_comercial} />
                <DetailRow label="Princípio Ativo" value={detailMed.principio_ativo} />
                <DetailRow label="Forma Farmacêutica" value={detailMed.forma_farmaceutica} />
                <DetailRow label="Concentração" value={detailMed.concentracao} />
                <DetailRow label="Fabricante" value={detailMed.fabricante} />
                {detailMed.registro_anvisa && (
                  <DetailRow label="Registro ANVISA" value={detailMed.registro_anvisa} />
                )}
                {detailMed.categoria && (
                  <DetailRow label="Categoria" value={detailMed.categoria} />
                )}
              </div>
              <Separator />
              <p className="text-[11px] text-muted-foreground italic">
                As informações exibidas são apenas auxiliares. A prescrição é de responsabilidade exclusiva do profissional de saúde.
              </p>
              <div className="flex justify-end gap-2">
                <Button variant="outline" size="sm" onClick={() => setDetailMed(null)}>
                  Fechar
                </Button>
                <Button
                  size="sm"
                  onClick={() => {
                    handleInsert(detailMed);
                    setDetailMed(null);
                  }}
                >
                  <PlusCircle className="h-4 w-4 mr-1" />
                  Inserir no Receituário
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start gap-2">
      <span className="text-xs font-medium text-muted-foreground w-36 flex-shrink-0">{label}:</span>
      <span className="text-sm">{value}</span>
    </div>
  );
}
