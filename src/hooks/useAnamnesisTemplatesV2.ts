/**
 * Hook V2 para gerenciamento de modelos de anamnese com versionamento
 * Usa a nova arquitetura: anamnesis_templates + anamnesis_template_versions + anamnesis_records
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useClinicData } from '@/hooks/useClinicData';
import { toast } from 'sonner';
import type { Json } from '@/integrations/supabase/types';

// ─── Types ────────────────────────────────────────────────────────

export interface TemplateSection {
  id: string;
  type: 'section';
  title: string;
  fields: TemplateField[];
}

export interface TemplateField {
  id: string;
  type: 'text' | 'textarea' | 'number' | 'date' | 'select' | 'multiselect' | 'checkbox' | 'radio' | 'scale' | 'calculated' | 'section';
  label: string;
  required?: boolean;
  placeholder?: string;
  options?: string[];
  /** Future: conditions for conditional logic */
  conditions?: Json;
}

export interface AnamnesisTemplateV2 {
  id: string;
  clinic_id: string | null;
  specialty_id: string | null;
  specialty_name?: string;
  name: string;
  description: string | null;
  icon: string;
  is_system: boolean;
  is_default: boolean;
  is_active: boolean;
  current_version_id: string | null;
  current_version_number?: number;
  structure: TemplateSection[];
  usage_count: number;
  created_at: string;
  updated_at: string;
}

export interface AnamnesisRecord {
  id: string;
  appointment_id: string | null;
  patient_id: string;
  clinic_id: string;
  template_id: string;
  template_version_id: string;
  responses: Record<string, unknown>;
  created_at: string;
  updated_at: string;
  created_by: string | null;
  template_name?: string;
  version_number?: number;
}

// ─── Main Hook ────────────────────────────────────────────────────

export function useAnamnesisTemplatesV2(options?: {
  specialtyId?: string | null;
  activeOnly?: boolean;
}) {
  const { clinic } = useClinicData();
  const queryClient = useQueryClient();
  const { specialtyId, activeOnly = false } = options || {};

  // ─── Fetch templates with current version structure ─────────
  const templatesQuery = useQuery({
    queryKey: ['anamnesis-templates-v2', clinic?.id, specialtyId, activeOnly],
    queryFn: async () => {
      if (!clinic?.id) return [];

      // Fetch templates (own clinic + global)
      const { data: templates, error } = await supabase
        .from('anamnesis_templates')
        .select('*, specialties(name)')
        .or(`clinic_id.is.null,clinic_id.eq.${clinic.id}`)
        .eq('archived', false)
        .order('is_system', { ascending: false })
        .order('name') as any;

      if (error) throw error;

      let q_filter = templates || [];
      if (specialtyId) {
        q_filter = q_filter.filter((t: any) => t.specialty_id === specialtyId);
      }
      if (activeOnly) {
        q_filter = q_filter.filter((t: any) => t.is_active === true);
      }

      // Fetch current versions for all templates
      const versionIds = q_filter
        .map((t: any) => t.current_version_id)
        .filter(Boolean);

      let versionsMap: Record<string, { structure: Json; version_number: number }> = {};
      if (versionIds.length > 0) {
        const { data: versions } = await supabase
          .from('anamnesis_template_versions')
          .select('id, structure, version_number')
          .in('id', versionIds);

        if (versions) {
          versionsMap = versions.reduce((acc, v) => {
            acc[v.id] = { structure: v.structure, version_number: v.version_number };
            return acc;
          }, {} as Record<string, { structure: Json; version_number: number }>);
        }
      }

      return q_filter.map((t: any) => {
        const tmpl = t;
        const version = tmpl.current_version_id ? versionsMap[tmpl.current_version_id] : null;

        // Build structure: prefer versioned structure, fallback to legacy campos
        let structure: TemplateSection[] = [];
        if (version?.structure) {
          // Normalize: some templates store sections with titulo/campos instead of title/fields
          const raw = version.structure as any[];
          if (Array.isArray(raw)) {
            structure = raw.map((s: any, idx: number) => ({
              id: s.id || `section_${idx}`,
              type: 'section' as const,
              title: s.title || s.titulo || 'Seção',
              fields: Array.isArray(s.fields)
                ? s.fields
                : Array.isArray(s.campos)
                  ? (s.campos as any[]).map((c: any) => ({
                      id: c.id || c.nome || '',
                      type: c.type || c.tipo || 'text',
                      label: c.label || c.nome || '',
                      required: c.required ?? c.obrigatorio ?? false,
                      placeholder: c.placeholder || '',
                      options: c.options || c.opcoes || undefined,
                    }))
                  : [],
            }));
          } else {
            structure = [];
          }
        } else if (Array.isArray(tmpl.campos) && tmpl.campos.length > 0) {
          // Detect format: nested sections ({id, title, fields}) vs flat campos ({id, label, section})
          const firstItem = tmpl.campos[0] as any;
          const isNestedSections = firstItem && (Array.isArray(firstItem.fields) || firstItem.title || firstItem.titulo);

          if (isNestedSections) {
            // Nested section format (same as versioned structure)
            structure = (tmpl.campos as any[]).map((s: any, idx: number) => ({
              id: s.id || `section_${idx}`,
              type: 'section' as const,
              title: s.title || s.titulo || 'Seção',
              fields: Array.isArray(s.fields)
                ? (s.fields as any[]).map((f: any) => ({
                    id: f.id || '',
                    type: f.type || 'text',
                    label: f.label || f.nome || '',
                    required: f.required ?? f.obrigatorio ?? false,
                    placeholder: f.placeholder || '',
                    options: f.options || f.opcoes || undefined,
                  }))
                : Array.isArray(s.campos)
                  ? (s.campos as any[]).map((c: any) => ({
                      id: c.id || c.nome || '',
                      type: c.type || c.tipo || 'text',
                      label: c.label || c.nome || '',
                      required: c.required ?? c.obrigatorio ?? false,
                      placeholder: c.placeholder || '',
                      options: c.options || c.opcoes || undefined,
                    }))
                  : [],
            }));
          } else {
            // Legacy flat campos (with section property) into grouped sections
            const sectionMap = new Map<string, TemplateField[]>();
            for (const campo of tmpl.campos as any[]) {
              const sectionTitle = campo.section || 'Geral';
              if (!sectionMap.has(sectionTitle)) sectionMap.set(sectionTitle, []);
              sectionMap.get(sectionTitle)!.push({
                id: campo.id,
                type: campo.type || 'textarea',
                label: campo.label || '',
                required: campo.required || false,
                placeholder: campo.placeholder,
                options: campo.options,
              });
            }
            let idx = 0;
            for (const [title, fields] of sectionMap) {
              structure.push({
                id: `section_legacy_${idx++}`,
                type: 'section',
                title,
                fields,
              });
            }
          }
        }

        return {
          id: tmpl.id,
          clinic_id: tmpl.clinic_id,
          specialty_id: tmpl.specialty_id,
          specialty_name: tmpl.specialties?.name || null,
          name: tmpl.name,
          description: tmpl.description,
          icon: tmpl.icon || 'Stethoscope',
          is_system: tmpl.is_system ?? false,
          is_default: tmpl.is_default ?? false,
          is_active: tmpl.is_active ?? true,
          current_version_id: tmpl.current_version_id,
          current_version_number: version?.version_number,
          structure,
          usage_count: tmpl.usage_count ?? 0,
          created_at: tmpl.created_at,
          updated_at: tmpl.updated_at,
        } as AnamnesisTemplateV2;
      });
    },
    enabled: !!clinic?.id,
  });

  // ─── Create template with initial version ───────────────────
  const createMutation = useMutation({
    mutationFn: async (input: {
      name: string;
      description?: string;
      specialty_id: string;
      icon?: string;
      is_default?: boolean;
      structure: TemplateSection[];
    }) => {
      if (!clinic?.id) throw new Error('Clínica não selecionada');
      const { data: userData } = await supabase.auth.getUser();

      // Create template
      const { data: tmpl, error: tErr } = await supabase
        .from('anamnesis_templates')
        .insert({
          clinic_id: clinic.id,
          name: input.name,
          description: input.description || null,
          template_type: 'anamnese_personalizada',
          specialty: 'custom',
          specialty_id: input.specialty_id,
          icon: input.icon || 'ClipboardList',
          is_system: false,
          is_default: input.is_default ?? false,
          is_active: true,
          created_by: userData.user?.id,
        } as any)
        .select()
        .single();
      if (tErr) throw tErr;

      // Create version 1
      const { data: ver, error: vErr } = await supabase
        .from('anamnesis_template_versions')
        .insert({
          template_id: tmpl.id,
          version: 1,
          version_number: 1,
          structure: input.structure as unknown as Json,
          created_by: userData.user?.id,
        })
        .select()
        .single();
      if (vErr) throw vErr;

      // Link current version
      await supabase
        .from('anamnesis_templates')
        .update({ current_version_id: ver.id } as any)
        .eq('id', tmpl.id);

      return tmpl;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['anamnesis-templates-v2'] });
      toast.success('Modelo criado com sucesso');
    },
    onError: (e: Error) => {
      console.error('Erro ao criar modelo:', e);
      toast.error('Erro ao criar modelo');
    },
  });

  // ─── Update template (creates new version) ─────────────────
  const updateMutation = useMutation({
    mutationFn: async (input: {
      id: string;
      name?: string;
      description?: string;
      specialty_id?: string;
      icon?: string;
      is_default?: boolean;
      is_active?: boolean;
      structure?: TemplateSection[];
    }) => {
      const { data: userData } = await supabase.auth.getUser();

      // Update template metadata
      const metaUpdate: Record<string, unknown> = {};
      if (input.name !== undefined) metaUpdate.name = input.name;
      if (input.description !== undefined) metaUpdate.description = input.description;
      if (input.specialty_id !== undefined) metaUpdate.specialty_id = input.specialty_id;
      if (input.icon !== undefined) metaUpdate.icon = input.icon;
      if (input.is_default !== undefined) metaUpdate.is_default = input.is_default;
      if (input.is_active !== undefined) metaUpdate.is_active = input.is_active;

      if (Object.keys(metaUpdate).length > 0) {
        const { error } = await supabase
          .from('anamnesis_templates')
          .update(metaUpdate as any)
          .eq('id', input.id);
        if (error) throw error;
      }

      // If structure changed, create new version
      if (input.structure) {
        // Get current max version
        const { data: versions } = await supabase
          .from('anamnesis_template_versions')
          .select('version_number')
          .eq('template_id', input.id)
          .order('version_number', { ascending: false })
          .limit(1);

        const nextVersion = (versions?.[0]?.version_number || 0) + 1;

        const { data: ver, error: vErr } = await supabase
          .from('anamnesis_template_versions')
          .insert({
            template_id: input.id,
            version_number: nextVersion,
            structure: input.structure as unknown as Json,
            created_by: userData.user?.id,
          })
          .select()
          .single();
        if (vErr) throw vErr;

        // Update current version pointer
        await supabase
          .from('anamnesis_templates')
          .update({ current_version_id: ver.id } as any)
          .eq('id', input.id);
      }

      return input;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['anamnesis-templates-v2'] });
      toast.success('Modelo atualizado');
    },
    onError: (e: Error) => {
      console.error('Erro ao atualizar modelo:', e);
      toast.error('Erro ao atualizar modelo');
    },
  });

  // ─── Clone template ─────────────────────────────────────────
  const cloneMutation = useMutation({
    mutationFn: async (input: { sourceId: string; newName: string }) => {
      if (!clinic?.id) throw new Error('Clínica não selecionada');
      const { data: userData } = await supabase.auth.getUser();

      // Fetch source template + current version
      const source = templatesQuery.data?.find(t => t.id === input.sourceId);
      if (!source) throw new Error('Template de origem não encontrado');

      // Create clone
      const { data: tmpl, error: tErr } = await supabase
        .from('anamnesis_templates')
        .insert({
          clinic_id: clinic.id,
          name: input.newName,
          description: source.description,
          template_type: 'anamnese_personalizada',
          specialty: 'custom',
          specialty_id: source.specialty_id,
          icon: source.icon,
          is_system: false,
          is_default: false,
          is_active: true,
          created_by: userData.user?.id,
        } as any)
        .select()
        .single();
      if (tErr) throw tErr;

      // Create version 1 with same structure
      const { data: ver, error: vErr } = await supabase
        .from('anamnesis_template_versions')
        .insert({
          template_id: tmpl.id,
          version: 1,
          version_number: 1,
          structure: source.structure as unknown as Json,
          created_by: userData.user?.id,
        })
        .select()
        .single();
      if (vErr) throw vErr;

      await supabase
        .from('anamnesis_templates')
        .update({ current_version_id: ver.id } as any)
        .eq('id', tmpl.id);

      return tmpl;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['anamnesis-templates-v2'] });
      toast.success('Modelo clonado com sucesso');
    },
    onError: (e: Error) => {
      console.error('Erro ao clonar modelo:', e);
      toast.error('Erro ao clonar modelo');
    },
  });

  // ─── Delete template (blocked if linked to records) ──────────
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      // Pre-check: verify no linked records exist (friendlier UX than DB error)
      const { count, error: countErr } = await supabase
        .from('anamnesis_records')
        .select('id', { count: 'exact', head: true })
        .eq('template_id', id);

      if (countErr) throw countErr;

      if (count && count > 0) {
        throw new Error(
          `Este modelo possui ${count} atendimento(s) vinculado(s) e não pode ser excluído. Desative-o em vez de excluir.`
        );
      }

      const { error } = await supabase
        .from('anamnesis_templates')
        .delete()
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['anamnesis-templates-v2'] });
      toast.success('Modelo excluído');
    },
    onError: (e: Error) => {
      toast.error(e.message || 'Erro ao excluir modelo');
    },
  });

  // ─── Archive all templates (reset) ──────────────────────────
  const archiveAllMutation = useMutation({
    mutationFn: async () => {
      if (!clinic?.id) throw new Error('Clínica não selecionada');
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) throw new Error('Usuário não autenticado');

      // Use RPC function that bypasses validation trigger
      const { error } = await supabase.rpc('reset_anamnesis_templates', {
        p_clinic_id: clinic.id,
        p_user_id: userData.user.id,
      });
      if (error) throw error;

      return true;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['anamnesis-templates-v2'] });
      toast.success('Todos os modelos foram arquivados com sucesso');
    },
    onError: (e: Error) => {
      console.error('Erro ao resetar modelos:', e);
      toast.error('Erro ao resetar modelos');
    },
  });

  return {
    templates: templatesQuery.data || [],
    isLoading: templatesQuery.isLoading,
    error: templatesQuery.error,
    createTemplate: createMutation.mutateAsync,
    updateTemplate: updateMutation.mutateAsync,
    cloneTemplate: cloneMutation.mutateAsync,
    deleteTemplate: deleteMutation.mutateAsync,
    archiveAllTemplates: archiveAllMutation.mutateAsync,
    isCreating: createMutation.isPending,
    isUpdating: updateMutation.isPending,
    isCloning: cloneMutation.isPending,
    isDeleting: deleteMutation.isPending,
    isArchiving: archiveAllMutation.isPending,
  };
}

// ─── Anamnesis Records Hook ───────────────────────────────────────

export function useAnamnesisRecords(patientId: string | null, appointmentId?: string | null, specialtyId?: string | null) {
  const { clinic } = useClinicData();
  const queryClient = useQueryClient();

  const recordsQuery = useQuery({
    queryKey: ['anamnesis-records', patientId, appointmentId, specialtyId, clinic?.id],
    queryFn: async () => {
      if (!patientId || !clinic?.id) return [];

      let q = supabase
        .from('anamnesis_records')
        .select('*, anamnesis_templates(name), anamnesis_template_versions(version_number)')
        .eq('patient_id', patientId)
        .eq('clinic_id', clinic.id)
        .order('created_at', { ascending: false });

      if (appointmentId) {
        q = q.eq('appointment_id', appointmentId);
      }

      if (specialtyId) {
        q = q.eq('specialty_id', specialtyId);
      }

      const { data, error } = await q;
      if (error) throw error;

      return (data || []).map(r => ({
        id: r.id,
        appointment_id: r.appointment_id,
        patient_id: r.patient_id,
        clinic_id: r.clinic_id,
        template_id: r.template_id,
        template_version_id: r.template_version_id,
        responses: (r.responses as Record<string, unknown>) || {},
        created_at: r.created_at,
        updated_at: r.updated_at,
        created_by: r.created_by,
        template_name: (r as any).anamnesis_templates?.name,
        version_number: (r as any).anamnesis_template_versions?.version_number,
      })) as AnamnesisRecord[];
    },
    enabled: !!patientId && !!clinic?.id,
  });

  const saveMutation = useMutation({
    mutationFn: async (input: {
      id?: string;
      appointment_id?: string;
      patient_id: string;
      template_id: string;
      template_version_id: string;
      responses: Record<string, unknown>;
      specialty_id?: string | null;
    }) => {
      if (!clinic?.id) throw new Error('Clínica não identificada');
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) throw new Error('Usuário não autenticado');

      if (input.id) {
        // Update existing record — only responses change, structure is immutable
        const { error } = await supabase
          .from('anamnesis_records')
          .update({
            responses: input.responses as unknown as Json,
            data: input.responses as unknown as Json,
          } as any)
          .eq('id', input.id);
        if (error) throw error;
      } else {
        // Resolve professional_id: prefer from appointment, fallback to logged-in user's professional record
        let resolvedProfessionalId: string | null = null;

        if (input.appointment_id) {
          const { data: apptData } = await supabase
            .from('appointments')
            .select('professional_id')
            .eq('id', input.appointment_id)
            .maybeSingle();
          if (apptData?.professional_id) {
            resolvedProfessionalId = apptData.professional_id;
          }
        }

        if (!resolvedProfessionalId) {
          // Try active professional first
          const { data: profData } = await supabase
            .from('professionals')
            .select('id')
            .eq('user_id', userData.user.id)
            .eq('clinic_id', clinic.id)
            .eq('is_active', true)
            .limit(1)
            .maybeSingle();
          resolvedProfessionalId = profData?.id || null;

          // Try inactive professional and reactivate
          if (!resolvedProfessionalId) {
            const { data: inactiveProf } = await supabase
              .from('professionals')
              .select('id')
              .eq('user_id', userData.user.id)
              .eq('clinic_id', clinic.id)
              .limit(1)
              .maybeSingle();
            if (inactiveProf?.id) {
              await supabase
                .from('professionals')
                .update({ is_active: true } as any)
                .eq('id', inactiveProf.id);
              resolvedProfessionalId = inactiveProf.id;
            }
          }

          // Auto-create professional from profile data
          if (!resolvedProfessionalId) {
            const { data: profile } = await supabase
              .from('profiles')
              .select('full_name, email')
              .eq('user_id', userData.user.id)
              .eq('clinic_id', clinic.id)
              .maybeSingle();

            const profName = profile?.full_name || userData.user.email?.split('@')[0] || 'Profissional';
            const profEmail = profile?.email || userData.user.email || '';

            const { data: newProf, error: createErr } = await supabase
              .from('professionals')
              .insert({
                clinic_id: clinic.id,
                user_id: userData.user.id,
                full_name: profName,
                email: profEmail,
                is_active: true,
              } as any)
              .select('id')
              .single();

            if (createErr) {
              console.error('Erro ao criar profissional automaticamente:', createErr);
              throw new Error('Não foi possível vincular seu usuário como profissional. Contate o administrador.');
            }
            resolvedProfessionalId = newProf.id;
          }
        }

        if (!resolvedProfessionalId) {
          throw new Error('Profissional não encontrado. Verifique se seu cadastro de profissional está ativo.');
        }

        // Create new record with immutable context snapshot
        const insertData: Record<string, unknown> = {
          appointment_id: input.appointment_id || null,
          patient_id: input.patient_id,
          clinic_id: clinic.id,
          professional_id: resolvedProfessionalId,
          template_id: input.template_id,
          template_version_id: input.template_version_id,
          responses: input.responses as unknown as Json,
          data: input.responses as unknown as Json,
          created_by: userData.user.id,
        };

        // Persist immutable context
        if (input.specialty_id) insertData.specialty_id = input.specialty_id;

        const { error } = await supabase
          .from('anamnesis_records')
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          .insert(insertData as any);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['anamnesis-records'] });
      toast.success('Anamnese salva com sucesso');
    },
    onError: (e: Error) => {
      console.error('Erro ao salvar anamnese:', e);
      toast.error(e.message || 'Erro ao salvar anamnese');
    },
  });

  return {
    records: recordsQuery.data || [],
    isLoading: recordsQuery.isLoading,
    saveRecord: saveMutation.mutateAsync,
    isSaving: saveMutation.isPending,
    refetch: recordsQuery.refetch,
  };
}
