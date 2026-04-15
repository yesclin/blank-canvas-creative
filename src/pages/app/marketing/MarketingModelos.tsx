import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  Search,
  Heart,
  ExternalLink,
  MoreVertical,
  Copy,
  Eye,
  Star,
  Palette,
  ImageOff,
  Sparkles,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import {
  useMarketingModels,
  CATEGORY_LABELS,
  CHANNEL_LABELS,
  type MarketingModel,
} from "@/hooks/marketing/useMarketingModels";

// ─── Model Card ──────────────────────────────────────────────
function ModelCard({
  model,
  isFavorite,
  onToggleFavorite,
  onOpenCanva,
  onViewDetails,
}: {
  model: MarketingModel;
  isFavorite: boolean;
  onToggleFavorite: () => void;
  onOpenCanva: () => void;
  onViewDetails: () => void;
}) {
  return (
    <div className="group relative bg-card border border-border rounded-xl overflow-hidden transition-all duration-200 hover:shadow-lg hover:border-primary/30 hover:-translate-y-0.5">
      {/* Thumbnail */}
      <div
        className="relative aspect-[4/3] bg-muted overflow-hidden cursor-pointer"
        onClick={onViewDetails}
      >
        {model.thumbnail_url ? (
          <img
            src={model.thumbnail_url}
            alt={model.title}
            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <ImageOff className="w-10 h-10 text-muted-foreground/40" />
          </div>
        )}

        {/* Badges overlay */}
        <div className="absolute top-2 left-2 flex gap-1.5">
          {model.is_featured && (
            <Badge className="bg-amber-500/90 text-white text-[10px] px-1.5 py-0.5 gap-1">
              <Star className="w-3 h-3" />
              Destaque
            </Badge>
          )}
          <Badge variant="secondary" className="text-[10px] px-1.5 py-0.5">
            {CHANNEL_LABELS[model.channel] || model.channel}
          </Badge>
        </div>

        {/* Canva badge */}
        <div className="absolute top-2 right-2">
          <Badge className="bg-[#7d2ae8]/90 text-white text-[10px] px-1.5 py-0.5 gap-1">
            <Palette className="w-3 h-3" />
            Canva
          </Badge>
        </div>

        {/* Favorite button */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            onToggleFavorite();
          }}
          className={cn(
            "absolute bottom-2 right-2 p-1.5 rounded-full transition-all",
            "bg-background/80 backdrop-blur-sm hover:bg-background",
            isFavorite ? "text-red-500" : "text-muted-foreground hover:text-red-400"
          )}
        >
          <Heart className={cn("w-4 h-4", isFavorite && "fill-current")} />
        </button>
      </div>

      {/* Content */}
      <div className="p-4 space-y-3">
        <div>
          <h3 className="font-semibold text-sm text-foreground line-clamp-1">{model.title}</h3>
          {model.description && (
            <p className="text-xs text-muted-foreground line-clamp-2 mt-1">{model.description}</p>
          )}
        </div>

        <div className="flex items-center gap-1.5 flex-wrap">
          <Badge variant="outline" className="text-[10px] px-1.5 py-0">
            {CATEGORY_LABELS[model.category] || model.category}
          </Badge>
          {model.occasion && (
            <Badge variant="outline" className="text-[10px] px-1.5 py-0">
              {model.occasion}
            </Badge>
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            className="flex-1 gap-1.5 text-xs h-8"
            onClick={onOpenCanva}
            disabled={!model.external_url}
          >
            <ExternalLink className="w-3.5 h-3.5" />
            {model.cta_label || "Usar no Canva"}
          </Button>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0">
                <MoreVertical className="w-4 h-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={onToggleFavorite}>
                <Heart className={cn("w-4 h-4 mr-2", isFavorite && "fill-red-500 text-red-500")} />
                {isFavorite ? "Remover favorito" : "Favoritar"}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={onViewDetails}>
                <Eye className="w-4 h-4 mr-2" />
                Ver detalhes
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => {
                  if (model.external_url) {
                    navigator.clipboard.writeText(model.external_url);
                    toast.success("Link copiado!");
                  }
                }}
                disabled={!model.external_url}
              >
                <Copy className="w-4 h-4 mr-2" />
                Copiar link
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </div>
  );
}

// ─── Detail Sheet ────────────────────────────────────────────
function ModelDetailSheet({
  model,
  open,
  onClose,
  isFavorite,
  onToggleFavorite,
  onOpenCanva,
}: {
  model: MarketingModel | null;
  open: boolean;
  onClose: () => void;
  isFavorite: boolean;
  onToggleFavorite: () => void;
  onOpenCanva: () => void;
}) {
  if (!model) return null;

  return (
    <Sheet open={open} onOpenChange={onClose}>
      <SheetContent className="sm:max-w-lg overflow-y-auto">
        <SheetHeader>
          <SheetTitle>{model.title}</SheetTitle>
        </SheetHeader>

        <div className="mt-6 space-y-6">
          {/* Preview image */}
          <div className="rounded-lg overflow-hidden bg-muted aspect-[4/3]">
            {(model.preview_url || model.thumbnail_url) ? (
              <img
                src={model.preview_url || model.thumbnail_url || ""}
                alt={model.title}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <ImageOff className="w-12 h-12 text-muted-foreground/40" />
              </div>
            )}
          </div>

          {/* Info */}
          {model.description && (
            <p className="text-sm text-muted-foreground">{model.description}</p>
          )}

          <div className="flex flex-wrap gap-2">
            <Badge variant="outline">
              {CATEGORY_LABELS[model.category] || model.category}
            </Badge>
            <Badge variant="secondary">
              {CHANNEL_LABELS[model.channel] || model.channel}
            </Badge>
            {model.occasion && (
              <Badge variant="outline">{model.occasion}</Badge>
            )}
            <Badge className="bg-[#7d2ae8]/90 text-white gap-1">
              <Palette className="w-3 h-3" />
              Canva
            </Badge>
            {model.is_system && (
              <Badge variant="outline" className="text-primary border-primary/30">
                Sistema
              </Badge>
            )}
          </div>

          {/* Actions */}
          <div className="flex gap-3">
            <Button className="flex-1 gap-2" onClick={onOpenCanva} disabled={!model.external_url}>
              <ExternalLink className="w-4 h-4" />
              {model.cta_label || "Usar no Canva"}
            </Button>
            <Button
              variant="outline"
              size="icon"
              onClick={onToggleFavorite}
              className={cn(isFavorite && "text-red-500 border-red-200")}
            >
              <Heart className={cn("w-4 h-4", isFavorite && "fill-current")} />
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}

// ─── Skeleton ────────────────────────────────────────────────
function ModelCardSkeleton() {
  return (
    <div className="bg-card border border-border rounded-xl overflow-hidden">
      <Skeleton className="aspect-[4/3] w-full" />
      <div className="p-4 space-y-3">
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-3 w-full" />
        <div className="flex gap-1.5">
          <Skeleton className="h-5 w-16 rounded-full" />
          <Skeleton className="h-5 w-12 rounded-full" />
        </div>
        <Skeleton className="h-8 w-full rounded-md" />
      </div>
    </div>
  );
}

// ─── Empty State ─────────────────────────────────────────────
function EmptyState({ hasFilters, onClear }: { hasFilters: boolean; onClear: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mb-4">
        <Sparkles className="w-8 h-8 text-primary" />
      </div>
      <h3 className="font-semibold text-foreground mb-1">
        {hasFilters ? "Nenhum modelo encontrado" : "Nenhum modelo disponível"}
      </h3>
      <p className="text-sm text-muted-foreground max-w-sm">
        {hasFilters
          ? "Tente ajustar os filtros para encontrar o modelo ideal."
          : "Em breve novos modelos estarão disponíveis."}
      </p>
      {hasFilters && (
        <Button variant="outline" size="sm" className="mt-4" onClick={onClear}>
          Limpar filtros
        </Button>
      )}
    </div>
  );
}

// ─── Main Component ──────────────────────────────────────────
export default function MarketingModelos() {
  const {
    models,
    favorites,
    isLoading,
    filters,
    setFilters,
    filterOptions,
    toggleFavorite,
    openInCanva,
  } = useMarketingModels();

  const [detailModel, setDetailModel] = useState<MarketingModel | null>(null);

  const hasActiveFilters =
    !!filters.search || !!filters.category || !!filters.channel ||
    !!filters.occasion || filters.favoritesOnly || filters.origin !== "all";

  const clearFilters = () =>
    setFilters({
      search: "",
      category: null,
      channel: null,
      occasion: null,
      favoritesOnly: false,
      origin: "all",
    });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-xl font-bold text-foreground">Modelos Prontos</h2>
        <p className="text-sm text-muted-foreground mt-0.5">
          Escolha um modelo e personalize no Canva em segundos
        </p>
      </div>

      {/* Search + Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Buscar modelos..."
            value={filters.search}
            onChange={(e) => setFilters({ ...filters, search: e.target.value })}
            className="pl-9 h-9"
          />
        </div>

        <div className="flex gap-2 flex-wrap">
          <Select
            value={filters.category || "all"}
            onValueChange={(v) => setFilters({ ...filters, category: v === "all" ? null : v })}
          >
            <SelectTrigger className="w-[150px] h-9 text-xs">
              <SelectValue placeholder="Categoria" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas categorias</SelectItem>
              {filterOptions.categories.map((c) => (
                <SelectItem key={c} value={c}>
                  {CATEGORY_LABELS[c] || c}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select
            value={filters.channel || "all"}
            onValueChange={(v) => setFilters({ ...filters, channel: v === "all" ? null : v })}
          >
            <SelectTrigger className="w-[140px] h-9 text-xs">
              <SelectValue placeholder="Canal" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos canais</SelectItem>
              {filterOptions.channels.map((c) => (
                <SelectItem key={c} value={c}>
                  {CHANNEL_LABELS[c] || c}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Button
            variant={filters.favoritesOnly ? "default" : "outline"}
            size="sm"
            className="h-9 gap-1.5 text-xs"
            onClick={() => setFilters({ ...filters, favoritesOnly: !filters.favoritesOnly })}
          >
            <Heart className={cn("w-3.5 h-3.5", filters.favoritesOnly && "fill-current")} />
            Favoritos
          </Button>

          {hasActiveFilters && (
            <Button variant="ghost" size="sm" className="h-9 text-xs" onClick={clearFilters}>
              Limpar
            </Button>
          )}
        </div>
      </div>

      {/* Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <ModelCardSkeleton key={i} />
          ))}
        </div>
      ) : models.length === 0 ? (
        <EmptyState hasFilters={hasActiveFilters} onClear={clearFilters} />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {models.map((model) => (
            <ModelCard
              key={model.id}
              model={model}
              isFavorite={favorites.has(model.id)}
              onToggleFavorite={() => toggleFavorite(model.id)}
              onOpenCanva={() => openInCanva(model)}
              onViewDetails={() => setDetailModel(model)}
            />
          ))}
        </div>
      )}

      {/* Detail Sheet */}
      <ModelDetailSheet
        model={detailModel}
        open={!!detailModel}
        onClose={() => setDetailModel(null)}
        isFavorite={detailModel ? favorites.has(detailModel.id) : false}
        onToggleFavorite={() => detailModel && toggleFavorite(detailModel.id)}
        onOpenCanva={() => detailModel && openInCanva(detailModel)}
      />
    </div>
  );
}
