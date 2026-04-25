import { useState, useRef, useEffect, useCallback, useMemo } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Search,
  X,
  FileText,
  Stethoscope,
  AlertTriangle,
  Paperclip,
  Calendar,
  ChevronRight,
  Loader2,
  Filter,
  ClipboardList,
  Activity,
  Smile,
  Image as ImageIcon,
  Pill,
  User,
  HeartPulse,
} from "lucide-react";
import { format, parseISO, isWithinInterval, subDays, subMonths, subYears } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";
import {
  useProntuarioGlobalSearch,
  type GlobalSearchResult,
  type GlobalSearchResultType,
  normalizeText,
} from "@/hooks/prontuario/useProntuarioGlobalSearch";

// Backwards-compatible export so callers depending on this type keep working.
export type SearchResult = GlobalSearchResult;
export type SearchResultType = GlobalSearchResultType;

interface ProntuarioSearchBarProps {
  patientId: string | null;
  onResultClick: (result: SearchResult) => void;
  onNavigateToTab: (tabKey: string) => void;
  className?: string;
}

type FilterId = "all" | GlobalSearchResultType;

const filterOptions: { id: FilterId; label: string; icon: React.ReactNode }[] = [
  { id: "all", label: "Todos", icon: <Search className="h-3 w-3" /> },
  { id: "evolution", label: "Evoluções", icon: <FileText className="h-3 w-3" /> },
  { id: "anamnesis", label: "Anamneses", icon: <ClipboardList className="h-3 w-3" /> },
  { id: "alert", label: "Alertas", icon: <AlertTriangle className="h-3 w-3" /> },
  { id: "media", label: "Arquivos", icon: <Paperclip className="h-3 w-3" /> },
  { id: "document", label: "Documentos", icon: <FileText className="h-3 w-3" /> },
  { id: "aesthetic_product", label: "Produtos", icon: <Pill className="h-3 w-3" /> },
  { id: "facial_map", label: "Mapa Facial", icon: <Smile className="h-3 w-3" /> },
  { id: "odontogram", label: "Odontograma", icon: <Activity className="h-3 w-3" /> },
  { id: "patient", label: "Paciente", icon: <User className="h-3 w-3" /> },
  { id: "clinical_data", label: "Dados Clínicos", icon: <HeartPulse className="h-3 w-3" /> },
];

const dateRangeOptions = [
  { id: "all", label: "Todo período" },
  { id: "7d", label: "Últimos 7 dias" },
  { id: "30d", label: "Últimos 30 dias" },
  { id: "90d", label: "Últimos 3 meses" },
  { id: "1y", label: "Último ano" },
];

const typeLabel: Record<GlobalSearchResultType, string> = {
  patient: "Paciente",
  clinical_data: "Dados Clínicos",
  anamnesis: "Anamnese",
  evolution: "Evolução",
  alert: "Alerta",
  document: "Documento",
  media: "Arquivo",
  aesthetic_product: "Produto",
  facial_map: "Mapa Facial",
  before_after: "Antes/Depois",
  odontogram: "Odontograma",
  measurement: "Medida",
};

const PREVIEW_LIMIT = 20;

export function ProntuarioSearchBar({
  patientId,
  onResultClick,
  onNavigateToTab,
  className,
}: ProntuarioSearchBarProps) {
  const [query, setQuery] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [activeFilter, setActiveFilter] = useState<FilterId>("all");
  const [dateRange, setDateRange] = useState<string>("all");
  const [showFilters, setShowFilters] = useState(false);
  const [showAll, setShowAll] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const { results, isLoading, totalResults } = useProntuarioGlobalSearch(patientId, query);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Reset showAll when query changes
  useEffect(() => {
    setShowAll(false);
  }, [query, activeFilter, dateRange]);

  const isInDateRange = useCallback(
    (dateStr: string) => {
      if (dateRange === "all") return true;
      try {
        const date = parseISO(dateStr);
        const now = new Date();
        switch (dateRange) {
          case "7d":
            return isWithinInterval(date, { start: subDays(now, 7), end: now });
          case "30d":
            return isWithinInterval(date, { start: subDays(now, 30), end: now });
          case "90d":
            return isWithinInterval(date, { start: subMonths(now, 3), end: now });
          case "1y":
            return isWithinInterval(date, { start: subYears(now, 1), end: now });
          default:
            return true;
        }
      } catch {
        return true;
      }
    },
    [dateRange]
  );

  // Apply tab + date filters to results returned by the hook
  const filteredResults = useMemo(() => {
    return results.filter((r) => {
      if (activeFilter !== "all" && r.type !== activeFilter) return false;
      if (!isInDateRange(r.date)) return false;
      return true;
    });
  }, [results, activeFilter, isInDateRange]);

  const visibleResults = showAll ? filteredResults : filteredResults.slice(0, PREVIEW_LIMIT);

  // Highlight matching text (accent + case insensitive)
  const highlightText = (text: string, searchTerm: string) => {
    if (!searchTerm.trim()) return text;
    const normTerm = normalizeText(searchTerm);
    if (!normTerm) return text;
    const normText = normalizeText(text);
    const idx = normText.indexOf(normTerm);
    if (idx < 0) return text;
    const before = text.slice(0, idx);
    const match = text.slice(idx, idx + searchTerm.length);
    const after = text.slice(idx + searchTerm.length);
    return (
      <>
        {before}
        <mark className="bg-yellow-200 dark:bg-yellow-800 px-0.5 rounded">{match}</mark>
        {after}
      </>
    );
  };

  const handleResultClick = (result: SearchResult) => {
    onResultClick(result);
    onNavigateToTab(result.navigationTarget);
    setIsOpen(false);
    setQuery("");
  };

  const getResultIcon = (type: GlobalSearchResultType) => {
    switch (type) {
      case "alert":
        return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
      case "media":
        return <Paperclip className="h-4 w-4 text-green-500" />;
      case "document":
        return <FileText className="h-4 w-4 text-blue-500" />;
      case "anamnesis":
        return <ClipboardList className="h-4 w-4 text-purple-500" />;
      case "evolution":
        return <Stethoscope className="h-4 w-4 text-primary" />;
      case "aesthetic_product":
        return <Pill className="h-4 w-4 text-pink-500" />;
      case "facial_map":
        return <Smile className="h-4 w-4 text-rose-500" />;
      case "before_after":
        return <ImageIcon className="h-4 w-4 text-rose-400" />;
      case "odontogram":
        return <Activity className="h-4 w-4 text-cyan-500" />;
      case "patient":
        return <User className="h-4 w-4 text-foreground" />;
      case "clinical_data":
        return <HeartPulse className="h-4 w-4 text-red-500" />;
      default:
        return <FileText className="h-4 w-4 text-muted-foreground" />;
    }
  };

  return (
    <div ref={containerRef} className={cn("relative w-full", className)}>
      {/* Search Input */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          ref={inputRef}
          type="text"
          placeholder="Pesquisar no prontuário..."
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setIsOpen(e.target.value.length >= 2);
          }}
          onFocus={() => query.length >= 2 && setIsOpen(true)}
          className="pl-10 pr-20 h-10 bg-background"
        />
        <div className="absolute right-1 top-1/2 transform -translate-y-1/2 flex items-center gap-1">
          {isLoading && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />}
          {query && (
            <Button
              variant="ghost"
              size="sm"
              className="h-7 w-7 p-0"
              onClick={() => {
                setQuery("");
                setIsOpen(false);
                inputRef.current?.focus();
              }}
            >
              <X className="h-4 w-4" />
            </Button>
          )}
          <Button
            variant="ghost"
            size="sm"
            className={cn("h-7 w-7 p-0", showFilters && "bg-muted")}
            onClick={() => setShowFilters(!showFilters)}
          >
            <Filter className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Search Results Dropdown */}
      {isOpen && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-background border rounded-lg shadow-lg z-50 overflow-hidden">
          {/* Type Filters */}
          <div className="flex items-center gap-1 p-2 border-b bg-muted/30 overflow-x-auto">
            {filterOptions.map((filter) => (
              <Button
                key={filter.id}
                variant={activeFilter === filter.id ? "secondary" : "ghost"}
                size="sm"
                className="h-7 text-xs whitespace-nowrap"
                onClick={() => setActiveFilter(filter.id)}
              >
                {filter.icon}
                <span className="ml-1">{filter.label}</span>
              </Button>
            ))}
          </div>

          {/* Date Range Filters (toggle) */}
          {showFilters && (
            <div className="flex items-center gap-1 p-2 border-b bg-muted/20 overflow-x-auto">
              <Calendar className="h-3 w-3 text-muted-foreground mr-1" />
              {dateRangeOptions.map((option) => (
                <Button
                  key={option.id}
                  variant={dateRange === option.id ? "secondary" : "ghost"}
                  size="sm"
                  className="h-6 text-xs whitespace-nowrap"
                  onClick={() => setDateRange(option.id)}
                >
                  {option.label}
                </Button>
              ))}
            </div>
          )}

          {/* Results */}
          <ScrollArea className="max-h-80">
            {isLoading ? (
              <div className="p-6 text-center">
                <Loader2 className="h-6 w-6 animate-spin mx-auto text-muted-foreground" />
                <p className="text-sm text-muted-foreground mt-2">Pesquisando...</p>
              </div>
            ) : visibleResults.length > 0 ? (
              <div className="divide-y">
                {visibleResults.map((result) => (
                  <button
                    key={`${result.type}-${result.id}`}
                    className="w-full p-3 hover:bg-muted/50 transition-colors text-left flex items-start gap-3"
                    onClick={() => handleResultClick(result)}
                  >
                    <div className="mt-0.5">{getResultIcon(result.type)}</div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-medium text-sm truncate">{result.title}</span>
                        <Badge variant="outline" className="text-xs shrink-0">
                          {typeLabel[result.type]}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground mt-0.5 line-clamp-2">
                        {highlightText(result.snippet, query)}
                      </p>
                      <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                        <Calendar className="h-3 w-3" />
                        <span>
                          {format(parseISO(result.date), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                        </span>
                      </div>
                    </div>
                    <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0 mt-1" />
                  </button>
                ))}
              </div>
            ) : query.length >= 2 ? (
              <div className="p-6 text-center text-muted-foreground">
                <Search className="h-8 w-8 mx-auto mb-2 opacity-30" />
                <p className="text-sm">Nenhum resultado para "{query}"</p>
                <p className="text-xs mt-1">Tente outros termos ou ajuste os filtros</p>
              </div>
            ) : (
              <div className="p-6 text-center text-muted-foreground">
                <Search className="h-8 w-8 mx-auto mb-2 opacity-30" />
                <p className="text-sm">Digite pelo menos 2 caracteres</p>
              </div>
            )}
          </ScrollArea>

          {filteredResults.length > 0 && (
            <div className="p-2 border-t bg-muted/30 text-xs text-muted-foreground flex items-center justify-between gap-2">
              <span>
                {filteredResults.length} resultado(s){totalResults !== filteredResults.length && ` de ${totalResults}`}
                {dateRange !== "all" && ` • ${dateRangeOptions.find((d) => d.id === dateRange)?.label}`}
              </span>
              {!showAll && filteredResults.length > PREVIEW_LIMIT && (
                <Button variant="ghost" size="sm" className="h-6 text-xs" onClick={() => setShowAll(true)}>
                  Ver todos os resultados
                </Button>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
