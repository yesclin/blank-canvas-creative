import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import type { ProcedureMaterial, ProcedureMaterialFormData, MaterialCategory } from '@/types/cadastros-clinicos';

// =============================================
// ARQUITETURA CANÔNICA
// ---------------------------------------------
// Vínculo procedimento -> insumo vive em
// `procedure_consumption_templates` (item_id -> inventory_items),
// que é exatamente a fonte lida pela RPC
// `process_appointment_consumption` na finalização do atendimento.
//
// `procedure_materials` (product_id -> products) é o modelo LEGADO:
// permanece apenas como leitura para não perder vínculos antigos.
// Nada é escrito nele.
// =============================================

async function getClinicId(): Promise<string> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Usuário não autenticado');

  const { data: profile } = await supabase
    .from('profiles')
    .select('clinic_id')
    .eq('user_id', user.id)
    .limit(1)
    .maybeSingle();

  if (!profile?.clinic_id) throw new Error('Clínica não encontrada');
  return profile.clinic_id;
}

const TEMPLATE_SELECT = `
  id,
  clinic_id,
  procedure_id,
  item_id,
  default_quantity,
  unit,
  is_required,
  allow_quantity_edit_on_finish,
  notes,
  created_at,
  inventory_items:item_id (name, category, default_cost_price, unit_of_measure),
  procedures:procedure_id (name, clinic_id)
`;

function mapTemplate(row: any): ProcedureMaterial {
  return {
    id: row.id,
    clinic_id: row.clinic_id,
    procedure_id: row.procedure_id,
    material_id: row.item_id,
    quantity: Number(row.default_quantity) || 0,
    unit: row.unit || row.inventory_items?.unit_of_measure || 'un',
    is_required: !!row.is_required,
    allow_manual_edit: !!row.allow_quantity_edit_on_finish,
    notes: row.notes || undefined,
    created_at: row.created_at,
    material_name: row.inventory_items?.name,
    material_category: (row.inventory_items?.category || 'outros') as MaterialCategory,
    material_unit_cost: Number(row.inventory_items?.default_cost_price) || 0,
    procedure_name: row.procedures?.name,
  };
}

function mapLegacy(row: any): ProcedureMaterial {
  return {
    id: row.id,
    clinic_id: row.procedures?.clinic_id || '',
    procedure_id: row.procedure_id,
    material_id: row.product_id,
    quantity: Number(row.quantity) || 0,
    unit: row.products?.unit || 'un',
    is_required: false,
    allow_manual_edit: true,
    notes: undefined,
    created_at: row.created_at,
    material_name: row.products?.name,
    material_category: (row.products?.category || 'outros') as MaterialCategory,
    material_unit_cost: Number(row.products?.cost_price) || 0,
    procedure_name: row.procedures?.name,
    is_legacy: true,
  };
}

// =============================================
// QUERIES
// =============================================

export function useProcedureMaterialsList() {
  return useQuery({
    queryKey: ['procedure-materials-list'],
    queryFn: async () => {
      const clinicId = await getClinicId();

      const [templates, legacy] = await Promise.all([
        supabase
          .from('procedure_consumption_templates')
          .select(TEMPLATE_SELECT)
          .eq('clinic_id', clinicId)
          .order('created_at', { ascending: false }),
        supabase
          .from('procedure_materials')
          .select(`
            id, procedure_id, product_id, quantity, created_at,
            products:product_id (name, category, cost_price, unit),
            procedures:procedure_id (name, clinic_id)
          `)
          .order('created_at', { ascending: false }),
      ]);

      if (templates.error) throw templates.error;
      if (legacy.error) throw legacy.error;

      const legacyOfClinic = (legacy.data || []).filter(
        (r: any) => r.procedures?.clinic_id === clinicId,
      );

      return [
        ...(templates.data || []).map(mapTemplate),
        ...legacyOfClinic.map(mapLegacy),
      ];
    },
  });
}

export function useProcedureMaterialsByProcedure(procedureId: string | null) {
  return useQuery({
    queryKey: ['procedure-materials', procedureId],
    queryFn: async () => {
      if (!procedureId) return [];

      const [templates, legacy] = await Promise.all([
        supabase
          .from('procedure_consumption_templates')
          .select(TEMPLATE_SELECT)
          .eq('procedure_id', procedureId)
          .order('created_at'),
        supabase
          .from('procedure_materials')
          .select(`
            id, procedure_id, product_id, quantity, created_at,
            products:product_id (name, category, cost_price, unit),
            procedures:procedure_id (name, clinic_id)
          `)
          .eq('procedure_id', procedureId)
          .order('created_at'),
      ]);

      if (templates.error) throw templates.error;
      if (legacy.error) throw legacy.error;

      return [
        ...(templates.data || []).map(mapTemplate),
        ...(legacy.data || []).map(mapLegacy),
      ];
    },
    enabled: !!procedureId,
  });
}

// =============================================
// MUTATIONS
// =============================================

function invalidate(queryClient: ReturnType<typeof useQueryClient>) {
  queryClient.invalidateQueries({ queryKey: ['procedure-materials-list'] });
  queryClient.invalidateQueries({ queryKey: ['procedure-materials'] });
  queryClient.invalidateQueries({ queryKey: ['procedures-with-costs'] });
  queryClient.invalidateQueries({ queryKey: ['procedure-cost-detail'] });
}

export function useCreateProcedureMaterial() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (formData: ProcedureMaterialFormData) => {
      const clinicId = await getClinicId();

      const { data, error } = await supabase
        .from('procedure_consumption_templates')
        .insert({
          clinic_id: clinicId,
          procedure_id: formData.procedure_id,
          item_id: formData.material_id,
          default_quantity: formData.quantity,
          unit: formData.unit || 'un',
          is_required: formData.is_required,
          allow_quantity_edit_on_finish: formData.allow_manual_edit,
          notes: formData.notes || null,
        })
        .select('id')
        .maybeSingle();

      if (error) {
        if (error.code === '23505' || error.code === '23405') {
          throw new Error('Este insumo já está vinculado ao procedimento');
        }
        throw error;
      }
      return data;
    },
    onSuccess: () => {
      invalidate(queryClient);
      toast.success('Insumo vinculado com sucesso!');
    },
    onError: (error: any) => {
      console.error('Error creating procedure consumption template:', error);
      toast.error(error.message || 'Erro ao vincular insumo');
    },
  });
}

export function useUpdateProcedureMaterial() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, formData }: { id: string; formData: Partial<ProcedureMaterialFormData> }) => {
      const { data, error } = await supabase
        .from('procedure_consumption_templates')
        .update({
          default_quantity: formData.quantity,
          unit: formData.unit,
          is_required: formData.is_required,
          allow_quantity_edit_on_finish: formData.allow_manual_edit,
          notes: formData.notes || null,
        })
        .eq('id', id)
        .select('id')
        .maybeSingle();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      invalidate(queryClient);
      toast.success('Vínculo atualizado com sucesso!');
    },
    onError: (error) => {
      console.error('Error updating procedure consumption template:', error);
      toast.error('Erro ao atualizar vínculo');
    },
  });
}

export function useDeleteProcedureMaterial() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (item: string | ProcedureMaterial) => {
      const id = typeof item === 'string' ? item : item.id;
      const isLegacy = typeof item !== 'string' && item.is_legacy;

      const { error } = await supabase
        .from(isLegacy ? 'procedure_materials' : 'procedure_consumption_templates')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      invalidate(queryClient);
      toast.success('Vínculo removido com sucesso!');
    },
    onError: (error) => {
      console.error('Error deleting procedure material:', error);
      toast.error('Erro ao remover vínculo');
    },
  });
}

// =============================================
// FORM HOOK
// =============================================

const defaultFormData: ProcedureMaterialFormData = {
  procedure_id: '',
  material_id: '',
  quantity: 1,
  unit: 'unidade',
  is_required: true,
  allow_manual_edit: true,
  notes: '',
};

export function useProcedureMaterialForm(initialData?: ProcedureMaterial | null) {
  const [formData, setFormData] = useState<ProcedureMaterialFormData>(
    initialData
      ? {
          procedure_id: initialData.procedure_id,
          material_id: initialData.material_id,
          quantity: initialData.quantity,
          unit: initialData.unit,
          is_required: initialData.is_required,
          allow_manual_edit: initialData.allow_manual_edit,
          notes: initialData.notes || '',
        }
      : defaultFormData
  );

  const updateField = <K extends keyof ProcedureMaterialFormData>(
    field: K,
    value: ProcedureMaterialFormData[K]
  ) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const resetForm = () => {
    setFormData(defaultFormData);
  };

  const isValid = formData.procedure_id && formData.material_id && formData.quantity > 0;

  return {
    formData,
    updateField,
    resetForm,
    isValid,
  };
}
