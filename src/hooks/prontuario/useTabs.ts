import { useState, useEffect, useCallback } from 'react';

// NOTE: When adding new specialty tabs, also update:
// - src/pages/app/Prontuario.tsx (ICON_MAP, TAB_KEY_MAP, DEFAULT_NAV_ITEMS)
// - src/components/config/prontuario/TemplatesSection.tsx (TYPES, TYPE_COLORS)
// - src/components/config/prontuario/TemplateDialog.tsx (TEMPLATE_TYPES)
// - src/hooks/prontuario/useTemplates.ts (TemplateType)
import { supabase } from '@/integrations/supabase/client';
import { useClinicData } from '@/hooks/useClinicData';
import { toast } from 'sonner';

export interface TabConfig {
  id: string;
  clinic_id: string;
  name: string;
  key: string;
  icon: string | null;
  display_order: number;
  is_active: boolean;
  is_system: boolean;
  scope: 'system' | 'specialty' | 'professional';
  specialty_id: string | null;
  professional_id: string | null;
  created_at: string;
  updated_at: string;
}

const DEFAULT_TABS = [
  { name: 'Resumo', key: 'resumo', icon: 'LayoutDashboard', display_order: 1 },
  { name: 'Anamnese', key: 'anamnese', icon: 'FileText', display_order: 2 },
  { name: 'Sinais Vitais', key: 'sinais_vitais', icon: 'Heart', display_order: 3 },
  { name: 'Odontograma', key: 'odontograma', icon: 'Smile', display_order: 4 },
  { name: 'Procedimentos por Dente', key: 'tooth_procedures', icon: 'Crosshair', display_order: 5 },
  { name: 'Evolução', key: 'evolucao', icon: 'Activity', display_order: 6 },
  { name: 'Diagnóstico (CID)', key: 'diagnostico', icon: 'Stethoscope', display_order: 7 },
  { name: 'Solicitação de Exames', key: 'exames_solicitacao', icon: 'ClipboardList', display_order: 8 },
  { name: 'Plano/Conduta', key: 'conduta', icon: 'Target', display_order: 9 },
  { name: 'Prescrições', key: 'prescricoes', icon: 'Pill', display_order: 10 },
  { name: 'Fotos Intraorais', key: 'fotos_intraorais', icon: 'Camera', display_order: 11 },
  { name: 'Exames/Documentos', key: 'exames', icon: 'Paperclip', display_order: 12 },
  { name: 'Histórico', key: 'historico', icon: 'History', display_order: 13 },
  // Psychology tabs
  { name: 'Registro de Sessão', key: 'session_record', icon: 'NotebookPen', display_order: 14 },
  { name: 'Objetivos Terapêuticos', key: 'therapeutic_goals', icon: 'Goal', display_order: 15 },
  { name: 'Plano Terapêutico', key: 'therapeutic_plan', icon: 'Route', display_order: 16 },
  // Pediatrics tabs
  { name: 'Anamnese Pediátrica', key: 'pediatric_anamnesis', icon: 'Baby', display_order: 17 },
  { name: 'Histórico Gestacional', key: 'gestational_history', icon: 'Heart', display_order: 18 },
  { name: 'Dados de Crescimento', key: 'growth_data', icon: 'Ruler', display_order: 19 },
  { name: 'Curva de Crescimento', key: 'growth_curve', icon: 'GrowthChart', display_order: 20 },
  { name: 'Desenvolvimento DNPM', key: 'neuropsychomotor_development', icon: 'BrainDevelopment', display_order: 21 },
  { name: 'Vacinas', key: 'vaccines', icon: 'ShieldCheck', display_order: 22 },
  { name: 'Diagnóstico', key: 'pediatric_diagnosis', icon: 'Stethoscope', display_order: 23 },
  { name: 'Conduta/Orientações', key: 'pediatric_conduct', icon: 'Target', display_order: 24 },
  { name: 'Evolução Clínica', key: 'pediatric_evolution', icon: 'Activity', display_order: 25 },
  // Gynecology tabs
  { name: 'Anamnese Ginecológica', key: 'gyneco_anamnesis', icon: 'CircleUser', display_order: 26 },
  { name: 'Dados Ginecológicos', key: 'gyneco_data', icon: 'CalendarDays', display_order: 27 },
  { name: 'Histórico Obstétrico (G/P/A)', key: 'obstetric_history', icon: 'HeartPulse', display_order: 28 },
  { name: 'Exame Ginecológico', key: 'gyneco_exam', icon: 'Search', display_order: 29 },
  { name: 'Exames/Resultados', key: 'gyneco_exams_results', icon: 'ClipboardList', display_order: 30 },
  { name: 'Diagnóstico', key: 'gyneco_diagnosis', icon: 'Stethoscope', display_order: 31 },
  { name: 'Conduta/Prescrição', key: 'gyneco_conduct', icon: 'Target', display_order: 32 },
  { name: 'Evolução Clínica', key: 'gyneco_evolution', icon: 'Activity', display_order: 33 },
  // Ophthalmology tabs
  { name: 'Anamnese Oftalmológica', key: 'ophthalmo_anamnesis', icon: 'Eye', display_order: 34 },
  { name: 'Acuidade Visual (OD/OE)', key: 'visual_acuity', icon: 'Focus', display_order: 35 },
  { name: 'Exame Oftalmológico', key: 'ophthalmo_exam', icon: 'Microscope', display_order: 36 },
  { name: 'Pressão Intraocular (OD/OE)', key: 'intraocular_pressure', icon: 'Gauge', display_order: 37 },
  { name: 'Diagnóstico (OD/OE)', key: 'ophthalmo_diagnosis', icon: 'Stethoscope', display_order: 38 },
  { name: 'Exames Complementares', key: 'ophthalmo_complementary_exams', icon: 'ClipboardList', display_order: 39 },
  { name: 'Conduta/Prescrição', key: 'ophthalmo_conduct', icon: 'Target', display_order: 40 },
  { name: 'Evolução Clínica', key: 'ophthalmo_evolution', icon: 'Activity', display_order: 41 },
];

export function useTabs() {
  const { clinic, isLoading: clinicLoading } = useClinicData();
  const [tabs, setTabs] = useState<TabConfig[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const fetchTabs = useCallback(async () => {
    if (!clinic?.id) return;
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('medical_record_tabs')
        .select('*')
        .eq('clinic_id', clinic.id)
        .eq('scope', 'system')
        .order('display_order', { ascending: true });

      if (error) throw error;
      setTabs((data as TabConfig[]) || []);
    } catch (err) {
      console.error('Error fetching tabs:', err);
      toast.error('Erro ao carregar abas');
    } finally {
      setLoading(false);
    }
  }, [clinic?.id]);

  useEffect(() => {
    if (!clinicLoading && clinic?.id) {
      fetchTabs();
    }
  }, [clinicLoading, clinic?.id, fetchTabs]);

  const initializeDefaults = async () => {
    if (!clinic?.id) return false;
    setSaving(true);
    try {
      const { count } = await supabase
        .from('medical_record_tabs')
        .select('*', { count: 'exact', head: true })
        .eq('clinic_id', clinic.id);

      if (count && count > 0) {
        toast.info('Abas já configuradas');
        return true;
      }

      const inserts = DEFAULT_TABS.map((tab) => ({
        clinic_id: clinic.id,
        name: tab.name,
        key: tab.key,
        icon: tab.icon,
        display_order: tab.display_order,
        is_active: true,
        is_system: true,
        scope: 'system' as const,
        specialty_id: null,
        professional_id: null,
      }));

      const { error } = await supabase.from('medical_record_tabs').insert(inserts);
      if (error) throw error;

      toast.success('Abas padrão criadas');
      await fetchTabs();
      return true;
    } catch (err) {
      console.error('Error initializing tabs:', err);
      toast.error('Erro ao criar abas');
      return false;
    } finally {
      setSaving(false);
    }
  };

  const toggleActive = async (id: string, active: boolean) => {
    setSaving(true);
    try {
      const { error } = await supabase
        .from('medical_record_tabs')
        .update({ is_active: active })
        .eq('id', id);

      if (error) throw error;
      setTabs((prev) => prev.map((t) => (t.id === id ? { ...t, is_active: active } : t)));
      toast.success(active ? 'Aba ativada' : 'Aba desativada');
    } catch (err) {
      console.error('Error toggling tab:', err);
      toast.error('Erro ao alterar aba');
    } finally {
      setSaving(false);
    }
  };

  const reorder = async (reordered: { id: string; display_order: number }[]) => {
    setSaving(true);
    try {
      for (const item of reordered) {
        const { error } = await supabase
          .from('medical_record_tabs')
          .update({ display_order: item.display_order })
          .eq('id', item.id);
        if (error) throw error;
      }
      await fetchTabs();
      toast.success('Ordem salva');
    } catch (err) {
      console.error('Error reordering tabs:', err);
      toast.error('Erro ao reordenar');
    } finally {
      setSaving(false);
    }
  };

  return {
    tabs,
    loading: loading || clinicLoading,
    saving,
    fetchTabs,
    initializeDefaults,
    toggleActive,
    reorder,
  };
}
