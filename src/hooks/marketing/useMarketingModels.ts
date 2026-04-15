import { useState, useEffect, useMemo, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useClinicData } from "@/hooks/useClinicData";
import { toast } from "sonner";

export interface MarketingModel {
  id: string;
  clinic_id: string | null;
  title: string;
  slug: string;
  description: string | null;
  category: string;
  specialty_id: string | null;
  channel: string;
  occasion: string | null;
  thumbnail_url: string | null;
  preview_url: string | null;
  external_provider: string;
  external_url: string;
  cta_label: string | null;
  is_system: boolean;
  is_active: boolean;
  is_featured: boolean;
  sort_order: number;
  created_at: string;
}

export interface ModelFilters {
  search: string;
  category: string | null;
  channel: string | null;
  occasion: string | null;
  favoritesOnly: boolean;
  origin: "all" | "system" | "custom";
}

const CATEGORY_LABELS: Record<string, string> = {
  aniversario: "Aniversário",
  "pos-consulta": "Pós-Consulta",
  reativacao: "Reativação",
  promocao: "Promoção",
  institucional: "Institucional",
  lembrete: "Lembrete",
  captacao: "Captação",
  "datas-comemorativas": "Datas Comemorativas",
};

const CHANNEL_LABELS: Record<string, string> = {
  whatsapp: "WhatsApp",
  instagram: "Instagram",
  facebook: "Facebook",
  email: "E-mail",
  sms: "SMS",
};

export { CATEGORY_LABELS, CHANNEL_LABELS };

export function useMarketingModels() {
  const { clinic } = useClinicData();
  const [models, setModels] = useState<MarketingModel[]>([]);
  const [favorites, setFavorites] = useState<Set<string>>(new Set());
  const [isLoading, setIsLoading] = useState(true);
  const [filters, setFilters] = useState<ModelFilters>({
    search: "",
    category: null,
    channel: null,
    occasion: null,
    favoritesOnly: false,
    origin: "all",
  });

  // Fetch models
  useEffect(() => {
    if (!clinic?.id) return;
    let cancelled = false;

    const fetchModels = async () => {
      setIsLoading(true);
      try {
        const { data, error } = await supabase
          .from("marketing_model_library")
          .select("*")
          .eq("is_active", true)
          .order("is_featured", { ascending: false })
          .order("sort_order", { ascending: true });

        if (error) throw error;
        if (!cancelled) setModels((data as MarketingModel[]) || []);
      } catch (err) {
        console.error("Error fetching marketing models:", err);
        toast.error("Erro ao carregar modelos");
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    };

    fetchModels();
    return () => { cancelled = true; };
  }, [clinic?.id]);

  // Fetch favorites
  useEffect(() => {
    const fetchFavorites = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from("marketing_model_favorites")
        .select("template_id")
        .eq("user_id", user.id);

      if (!error && data) {
        setFavorites(new Set(data.map((f: any) => f.template_id)));
      }
    };
    fetchFavorites();
  }, []);

  // Toggle favorite
  const toggleFavorite = useCallback(async (templateId: string) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const isFav = favorites.has(templateId);
    
    // Optimistic update
    setFavorites(prev => {
      const next = new Set(prev);
      if (isFav) next.delete(templateId);
      else next.add(templateId);
      return next;
    });

    try {
      if (isFav) {
        await supabase
          .from("marketing_model_favorites")
          .delete()
          .eq("template_id", templateId)
          .eq("user_id", user.id);
      } else {
        await supabase
          .from("marketing_model_favorites")
          .insert({ template_id: templateId, user_id: user.id });
      }
    } catch {
      // Revert on error
      setFavorites(prev => {
        const next = new Set(prev);
        if (isFav) next.add(templateId);
        else next.delete(templateId);
        return next;
      });
      toast.error("Erro ao atualizar favorito");
    }
  }, [favorites]);

  // Log click
  const logClick = useCallback(async (templateId: string) => {
    if (!clinic?.id) return;
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    try {
      await supabase.from("marketing_model_clicks").insert({
        clinic_id: clinic.id,
        template_id: templateId,
        user_id: user.id,
        source_context: "modelos-tab",
      });
    } catch (err) {
      console.error("Error logging click:", err);
      // Don't block the user
    }
  }, [clinic?.id]);

  // Open in Canva
  const openInCanva = useCallback((model: MarketingModel) => {
    if (!model.external_url) {
      toast.error("Link do modelo não disponível");
      return;
    }

    try {
      new URL(model.external_url);
    } catch {
      toast.error("Link do modelo inválido");
      return;
    }

    // Log click (fire and forget)
    logClick(model.id);
    window.open(model.external_url, "_blank", "noopener,noreferrer");
  }, [logClick]);

  // Filtered models
  const filteredModels = useMemo(() => {
    return models.filter((m) => {
      if (filters.search) {
        const q = filters.search.toLowerCase();
        const match = m.title.toLowerCase().includes(q) ||
          m.description?.toLowerCase().includes(q) ||
          m.category.toLowerCase().includes(q);
        if (!match) return false;
      }
      if (filters.category && m.category !== filters.category) return false;
      if (filters.channel && m.channel !== filters.channel) return false;
      if (filters.occasion && m.occasion !== filters.occasion) return false;
      if (filters.favoritesOnly && !favorites.has(m.id)) return false;
      if (filters.origin === "system" && !m.is_system) return false;
      if (filters.origin === "custom" && m.is_system) return false;
      return true;
    });
  }, [models, filters, favorites]);

  // Available filter options from current data
  const filterOptions = useMemo(() => {
    const categories = [...new Set(models.map(m => m.category))];
    const channels = [...new Set(models.map(m => m.channel))];
    const occasions = [...new Set(models.map(m => m.occasion).filter(Boolean))] as string[];
    return { categories, channels, occasions };
  }, [models]);

  return {
    models: filteredModels,
    allModels: models,
    favorites,
    isLoading,
    filters,
    setFilters,
    filterOptions,
    toggleFavorite,
    openInCanva,
  };
}
