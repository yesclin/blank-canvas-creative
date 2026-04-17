import { useState, useMemo, useRef, useEffect, useCallback } from "react";
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
  Filter
} from "lucide-react";
import { format, parseISO, isWithinInterval, subDays, subMonths, subYears } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";

// Types for search
export type SearchResultType = 'entry' | 'file' | 'alert';

export interface SearchResult {
  id: string;
  type: SearchResultType;
  category: string;
  title: string;
  snippet: string;
  date: string;
  tabKey: string;
  highlight: string[];
}

interface MedicalRecordEntry {
  id: string;
  entry_type: string;
  template_id: string | null;
  content: Record<string, unknown>;
  notes: string | null;
  status: string;
  created_at: string;
}

interface MedicalRecordFile {
  id: string;
  file_name: string;
  file_type: string;
  category: string;
  description: string | null;
  created_at: string;
}

interface ClinicalAlert {
  id: string;
  alert_type: string;
  severity: string;
  title: string;
  description: string | null;
  created_at: string;
}

interface ProntuarioSearchBarProps {
  entries: MedicalRecordEntry[];
  files: MedicalRecordFile[];
  alerts: ClinicalAlert[];
  onResultClick: (result: SearchResult) => void;
  onNavigateToTab: (tabKey: string) => void;
  className?: string;
}

const filterOptions: { id: SearchResultType | 'all'; label: string; icon: React.ReactNode }[] = [
  { id: 'all', label: 'Todos', icon: <Search className="h-3 w-3" /> },
  { id: 'entry', label: 'Evoluções', icon: <FileText className="h-3 w-3" /> },
  { id: 'file', label: 'Arquivos', icon: <Paperclip className="h-3 w-3" /> },
  { id: 'alert', label: 'Alertas', icon: <AlertTriangle className="h-3 w-3" /> },
];

const dateRangeOptions = [
  { id: 'all', label: 'Todo período' },
  { id: '7d', label: 'Últimos 7 dias' },
  { id: '30d', label: 'Últimos 30 dias' },
  { id: '90d', label: 'Últimos 3 meses' },
  { id: '1y', label: 'Último ano' },
];

// Map entry_type to tab key
const entryTypeToTab: Record<string, string> = {
  'anamnese': 'anamnese',
  'evolucao': 'evolucao',
  'diagnostico': 'diagnostico',
  'prescricao': 'prescricoes',
  'procedimento': 'procedimentos',
  'exame': 'exames',
  'default': 'evolucao',
};

const categoryLabels: Record<string, string> = {
  'entry': 'Evolução',
  'file': 'Arquivo',
  'alert': 'Alerta',
  'anamnese': 'Anamnese',
  'evolucao': 'Evolução',
  'diagnostico': 'Diagnóstico',
  'prescricao': 'Prescrição',
  'procedimento': 'Procedimento',
  'exam': 'Exame',
  'document': 'Documento',
  'image': 'Imagem',
  'report': 'Laudo',
};

export function ProntuarioSearchBar({ 
  entries, 
  files, 
  alerts,
  onResultClick,
  onNavigateToTab,
  className
}: ProntuarioSearchBarProps) {
  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [activeFilter, setActiveFilter] = useState<SearchResultType | 'all'>('all');
  const [dateRange, setDateRange] = useState<string>('all');
  const [showFilters, setShowFilters] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

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

  // Debounced search (300ms)
  useEffect(() => {
    if (query.length >= 2) {
      setIsSearching(true);
      const timer = setTimeout(() => {
        setDebouncedQuery(query);
        setIsSearching(false);
      }, 300);
      return () => clearTimeout(timer);
    } else {
      setDebouncedQuery("");
      setIsSearching(false);
    }
  }, [query]);

  // Check if date is within range
  const isInDateRange = useCallback((dateStr: string) => {
    if (dateRange === 'all') return true;
    
    const date = parseISO(dateStr);
    const now = new Date();
    
    switch (dateRange) {
      case '7d': return isWithinInterval(date, { start: subDays(now, 7), end: now });
      case '30d': return isWithinInterval(date, { start: subDays(now, 30), end: now });
      case '90d': return isWithinInterval(date, { start: subMonths(now, 3), end: now });
      case '1y': return isWithinInterval(date, { start: subYears(now, 1), end: now });
      default: return true;
    }
  }, [dateRange]);

  // Highlight matching text
  const highlightText = (text: string, searchTerm: string) => {
    if (!searchTerm.trim()) return text;
    const regex = new RegExp(`(${searchTerm.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
    const parts = text.split(regex);
    return parts.map((part, i) => 
      regex.test(part) ? <mark key={i} className="bg-yellow-200 dark:bg-yellow-800 px-0.5 rounded">{part}</mark> : part
    );
  };

  // Extract text content from entry for search
  const extractEntryText = (entry: MedicalRecordEntry): string => {
    const parts: string[] = [];
    
    if (entry.notes) parts.push(entry.notes);
    
    // Extract all string values from content
    if (entry.content && typeof entry.content === 'object') {
      const extractStrings = (obj: unknown): void => {
        if (typeof obj === 'string') {
          parts.push(obj);
        } else if (Array.isArray(obj)) {
          obj.forEach(extractStrings);
        } else if (typeof obj === 'object' && obj !== null) {
          Object.values(obj).forEach(extractStrings);
        }
      };
      extractStrings(entry.content);
    }
    
    return parts.join(' ');
  };

  // Search across all data
  const searchResults = useMemo(() => {
    if (!debouncedQuery.trim() || debouncedQuery.length < 2) return [];
    
    const results: SearchResult[] = [];
    const searchLower = debouncedQuery.toLowerCase();

    // Search in Entries
    if (activeFilter === 'all' || activeFilter === 'entry') {
      for (const entry of entries) {
        if (!isInDateRange(entry.created_at)) continue;
        
        const searchableText = extractEntryText(entry);
        
        if (searchableText.toLowerCase().includes(searchLower)) {
          const idx = searchableText.toLowerCase().indexOf(searchLower);
          const start = Math.max(0, idx - 40);
          const end = Math.min(searchableText.length, idx + debouncedQuery.length + 80);
          const snippet = (start > 0 ? '...' : '') + 
            searchableText.substring(start, end) + 
            (end < searchableText.length ? '...' : '');

          const tabKey = entryTypeToTab[entry.entry_type] || entryTypeToTab['default'];

          results.push({
            id: entry.id,
            type: 'entry',
            category: entry.entry_type,
            title: categoryLabels[entry.entry_type] || 'Evolução',
            snippet,
            date: entry.created_at,
            tabKey,
            highlight: [debouncedQuery]
          });
        }
      }
    }

    // Search in Files
    if (activeFilter === 'all' || activeFilter === 'file') {
      for (const file of files) {
        if (!isInDateRange(file.created_at)) continue;
        
        const searchableText = `${file.file_name} ${file.description || ''} ${file.category}`;
        
        if (searchableText.toLowerCase().includes(searchLower)) {
          results.push({
            id: file.id,
            type: 'file',
            category: file.category,
            title: file.file_name,
            snippet: file.description || `Arquivo ${categoryLabels[file.category] || file.category}`,
            date: file.created_at,
            tabKey: file.category === 'image' ? 'imagens' : 'exames',
            highlight: [debouncedQuery]
          });
        }
      }
    }

    // Search in Alerts
    if (activeFilter === 'all' || activeFilter === 'alert') {
      for (const alert of alerts) {
        if (!isInDateRange(alert.created_at)) continue;
        
        const searchableText = `${alert.title} ${alert.description || ''} ${alert.alert_type}`;
        
        if (searchableText.toLowerCase().includes(searchLower)) {
          results.push({
            id: alert.id,
            type: 'alert',
            category: alert.alert_type,
            title: alert.title,
            snippet: alert.description || `Alerta ${alert.severity}`,
            date: alert.created_at,
            tabKey: 'alertas',
            highlight: [debouncedQuery]
          });
        }
      }
    }

    // Sort by date (newest first)
    return results.sort((a, b) => 
      new Date(b.date).getTime() - new Date(a.date).getTime()
    ).slice(0, 25);
  }, [debouncedQuery, activeFilter, entries, files, alerts, isInDateRange]);

  const handleResultClick = (result: SearchResult) => {
    onResultClick(result);
    onNavigateToTab(result.tabKey);
    setIsOpen(false);
    setQuery("");
  };

  const getResultIcon = (type: SearchResultType, category?: string) => {
    if (type === 'alert') return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
    if (type === 'file') {
      if (category === 'image') return <Stethoscope className="h-4 w-4 text-purple-500" />;
      return <Paperclip className="h-4 w-4 text-green-500" />;
    }
    return <FileText className="h-4 w-4 text-primary" />;
  };

  const getSeverityBadge = (type: SearchResultType, category: string) => {
    if (type === 'alert') {
      const colors: Record<string, string> = {
        critical: 'bg-red-100 text-red-700 border-red-200',
        warning: 'bg-yellow-100 text-yellow-700 border-yellow-200',
        info: 'bg-blue-100 text-blue-700 border-blue-200',
      };
      return colors[category] || colors.info;
    }
    return 'bg-muted text-muted-foreground';
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
          {isSearching && (
            <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
          )}
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
            {filterOptions.map(filter => (
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
              {dateRangeOptions.map(option => (
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
            {isSearching ? (
              <div className="p-6 text-center">
                <Loader2 className="h-6 w-6 animate-spin mx-auto text-muted-foreground" />
                <p className="text-sm text-muted-foreground mt-2">Pesquisando...</p>
              </div>
            ) : searchResults.length > 0 ? (
              <div className="divide-y">
                {searchResults.map(result => (
                  <button
                    key={`${result.type}-${result.id}`}
                    className="w-full p-3 hover:bg-muted/50 transition-colors text-left flex items-start gap-3"
                    onClick={() => handleResultClick(result)}
                  >
                    <div className="mt-0.5">
                      {getResultIcon(result.type, result.category)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-medium text-sm truncate">
                          {result.title}
                        </span>
                        <Badge 
                          variant="outline" 
                          className={cn("text-xs shrink-0", getSeverityBadge(result.type, result.category))}
                        >
                          {categoryLabels[result.category] || result.category}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground mt-0.5 line-clamp-2">
                        {highlightText(result.snippet, debouncedQuery)}
                      </p>
                      <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                        <Calendar className="h-3 w-3" />
                        <span>{format(parseISO(result.date), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}</span>
                      </div>
                    </div>
                    <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0 mt-1" />
                  </button>
                ))}
              </div>
            ) : debouncedQuery.length >= 2 ? (
              <div className="p-6 text-center text-muted-foreground">
                <Search className="h-8 w-8 mx-auto mb-2 opacity-30" />
                <p className="text-sm">Nenhum resultado para "{debouncedQuery}"</p>
                <p className="text-xs mt-1">Tente outros termos ou ajuste os filtros</p>
              </div>
            ) : (
              <div className="p-6 text-center text-muted-foreground">
                <Search className="h-8 w-8 mx-auto mb-2 opacity-30" />
                <p className="text-sm">Digite pelo menos 2 caracteres</p>
              </div>
            )}
          </ScrollArea>

          {searchResults.length > 0 && (
            <div className="p-2 border-t bg-muted/30 text-xs text-muted-foreground text-center">
              {searchResults.length} resultado(s) encontrado(s)
              {dateRange !== 'all' && ` • ${dateRangeOptions.find(d => d.id === dateRange)?.label}`}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
