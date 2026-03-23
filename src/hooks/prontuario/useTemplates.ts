import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useClinicData } from '@/hooks/useClinicData';
import { toast } from 'sonner';

export type TemplateType = 
  | 'anamnese' 
  | 'evolution' 
  | 'diagnosis' 
  | 'procedure' 
  | 'prescription' 
  | 'vital_signs' 
  | 'exam_request' 
  | 'conduct' 
  | 'odontogram' 
  | 'tooth_procedure' 
  | 'dental_session'
  // Psychology
  | 'session_record'
  | 'therapeutic_goals'
  | 'therapeutic_plan'
  // Psychiatry
  | 'diagnosis_dsm'
  | 'psychiatric_prescription'
  | 'symptom_evolution'
  | 'medication_history'
  // Nutrition
  | 'nutritional_assessment'
  | 'body_measurements'
  | 'meal_plan'
  | 'nutritional_evolution'
  // Aesthetics
  | 'aesthetic_assessment'
  | 'aesthetic_procedure'
  | 'products_used'
  | 'before_after_photos'
  | 'consent_form'
  // Physiotherapy
  | 'functional_assessment'
  | 'chief_complaint'
  | 'pain_scale'
  | 'range_of_motion'
  | 'physio_therapeutic_plan'
  | 'applied_exercises'
  | 'session_evolution'
  // Pediatrics
  | 'pediatric_anamnesis'
  | 'gestational_history'
  | 'growth_data'
  | 'growth_curve'
  | 'neuropsychomotor_development'
  | 'vaccines'
  | 'pediatric_diagnosis'
  | 'pediatric_conduct'
  | 'pediatric_evolution'
  // Gynecology
  | 'gyneco_anamnesis'
  | 'gyneco_data'
  | 'obstetric_history'
  | 'gyneco_exam'
  | 'gyneco_exams_results'
  | 'gyneco_diagnosis'
  | 'gyneco_conduct'
  | 'gyneco_evolution'
  // Ophthalmology
  | 'ophthalmo_anamnesis'
  | 'visual_acuity'
  | 'ophthalmo_exam'
  | 'intraocular_pressure'
  | 'ophthalmo_diagnosis'
  | 'ophthalmo_complementary_exams'
  | 'ophthalmo_conduct'
  | 'ophthalmo_evolution'
  // Cardiology
  | 'cardio_anamnesis'
  | 'cardio_vital_signs'
  | 'cardio_risk_factors'
  | 'cardio_exams'
  | 'cardio_diagnosis'
  | 'cardio_conduct'
  | 'cardio_evolution'
  // Custom / Personalized
  | 'custom_block'
  | 'custom_form'
  | 'custom_checklist'
  | 'custom_notes';
export type TemplateScope = 'system' | 'specialty' | 'professional' | 'clinic';

export interface Template {
  id: string;
  clinic_id: string;
  name: string;
  type: TemplateType;
  description: string | null;
  scope: TemplateScope;
  specialty_id: string | null;
  professional_id: string | null;
  is_default: boolean;
  is_active: boolean;
  is_system: boolean;
  created_at: string;
  updated_at: string;
  fields_count?: number;
}

export interface TemplateInput {
  name: string;
  type: TemplateType;
  description?: string;
  scope: TemplateScope;
  specialty_id?: string | null;
  professional_id?: string | null;
  is_default?: boolean;
  is_active?: boolean;
}

export function useTemplates(typeFilter?: TemplateType) {
  const { clinic, isLoading: clinicLoading } = useClinicData();
  const [templates, setTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const fetchTemplates = useCallback(async () => {
    if (!clinic?.id) return;
    setLoading(true);
    try {
      let query = supabase
        .from('medical_record_templates')
        .select('*')
        .eq('clinic_id', clinic.id)
        .order('created_at', { ascending: false });

      if (typeFilter) {
        query = query.eq('type', typeFilter);
      }

      const { data, error } = await query;
      if (error) throw error;

      // Get field counts
      const templatesWithCounts = await Promise.all(
        (data || []).map(async (t) => {
          const { count } = await supabase
            .from('medical_record_fields')
            .select('*', { count: 'exact', head: true })
            .eq('template_id', t.id);
          return { ...t, fields_count: count || 0 } as Template;
        })
      );

      setTemplates(templatesWithCounts);
    } catch (err) {
      console.error('Error fetching templates:', err);
      toast.error('Erro ao carregar modelos');
    } finally {
      setLoading(false);
    }
  }, [clinic?.id, typeFilter]);

  useEffect(() => {
    if (!clinicLoading && clinic?.id) {
      fetchTemplates();
    }
  }, [clinicLoading, clinic?.id, fetchTemplates]);

  const create = async (input: TemplateInput): Promise<string | null> => {
    if (!clinic?.id) return null;
    setSaving(true);
    try {
      const { data, error } = await supabase
        .from('medical_record_templates')
        .insert({
          clinic_id: clinic.id,
          name: input.name,
          type: input.type,
          description: input.description || null,
          scope: input.scope,
          specialty_id: input.specialty_id || null,
          professional_id: input.professional_id || null,
          is_default: input.is_default || false,
          is_active: input.is_active !== false,
          is_system: false,
        })
        .select()
        .single();

      if (error) throw error;
      toast.success('Modelo criado');
      await fetchTemplates();
      return data.id;
    } catch (err) {
      console.error('Error creating template:', err);
      toast.error('Erro ao criar modelo');
      return null;
    } finally {
      setSaving(false);
    }
  };

  const update = async (id: string, input: Partial<TemplateInput>): Promise<boolean> => {
    setSaving(true);
    try {
      const { error } = await supabase
        .from('medical_record_templates')
        .update({
          name: input.name,
          type: input.type,
          description: input.description,
          is_default: input.is_default,
          is_active: input.is_active,
        })
        .eq('id', id);

      if (error) throw error;
      toast.success('Modelo atualizado');
      await fetchTemplates();
      return true;
    } catch (err) {
      console.error('Error updating template:', err);
      toast.error('Erro ao atualizar modelo');
      return false;
    } finally {
      setSaving(false);
    }
  };

  const remove = async (id: string): Promise<boolean> => {
    setSaving(true);
    try {
      const { error } = await supabase.from('medical_record_templates').delete().eq('id', id);
      if (error) throw error;
      toast.success('Modelo excluído');
      await fetchTemplates();
      return true;
    } catch (err) {
      console.error('Error deleting template:', err);
      toast.error('Erro ao excluir modelo');
      return false;
    } finally {
      setSaving(false);
    }
  };

  const duplicate = async (id: string): Promise<boolean> => {
    if (!clinic?.id) return false;
    setSaving(true);
    try {
      const { data: original, error: fetchErr } = await supabase
        .from('medical_record_templates')
        .select('*')
        .eq('id', id)
        .single();

      if (fetchErr) throw fetchErr;

      const { data: newTemplate, error: insertErr } = await supabase
        .from('medical_record_templates')
        .insert({
          clinic_id: clinic.id,
          name: `${original.name} (Cópia)`,
          type: original.type,
          description: original.description,
          scope: original.scope,
          specialty_id: original.specialty_id,
          professional_id: original.professional_id,
          is_default: false,
          is_active: false,
          is_system: false,
        })
        .select()
        .single();

      if (insertErr) throw insertErr;

      // Copy fields
      const { data: fields } = await supabase
        .from('medical_record_fields')
        .select('*')
        .eq('template_id', id)
        .order('field_order');

      if (fields && fields.length > 0) {
        const newFields = fields.map((f) => ({
          template_id: newTemplate.id,
          label: f.label,
          field_type: f.field_type,
          placeholder: f.placeholder,
          options: f.options,
          is_required: f.is_required,
          field_order: f.field_order,
        }));

        await supabase.from('medical_record_fields').insert(newFields);
      }

      toast.success('Modelo duplicado');
      await fetchTemplates();
      return true;
    } catch (err) {
      console.error('Error duplicating template:', err);
      toast.error('Erro ao duplicar modelo');
      return false;
    } finally {
      setSaving(false);
    }
  };

  const toggleActive = async (id: string, active: boolean): Promise<boolean> => {
    return update(id, { is_active: active });
  };

  return {
    templates,
    loading: loading || clinicLoading,
    saving,
    fetchTemplates,
    create,
    update,
    remove,
    duplicate,
    toggleActive,
  };
}
