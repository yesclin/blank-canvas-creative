import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

// =============================================
// TYPES
// =============================================

export interface MaterialConsumptionItem {
  material_id: string;
  material_name?: string;
  quantity: number;
  unit: string;
  unit_cost: number;
  source: 'procedure' | 'kit' | 'extra';
  kit_id?: string;
  kit_name?: string;
  is_required?: boolean;
  allow_manual_edit?: boolean;
}

export interface MaterialConsumptionRecord {
  id: string;
  clinic_id: string;
  appointment_id: string;
  procedure_id?: string;
  material_id: string;
  kit_id?: string;
  professional_id?: string;
  patient_id?: string;
  quantity: number;
  unit: string;
  unit_cost: number;
  total_cost: number;
  consumption_type: 'automatic' | 'manual' | 'adjustment';
  source: 'procedure' | 'kit' | 'extra';
  notes?: string;
  consumed_at: string;
  created_at: string;
  // Joined fields
  material_name?: string;
  procedure_name?: string;
  professional_name?: string;
  patient_name?: string;
}

export interface StockAlert {
  id: string;
  clinic_id: string;
  material_id: string;
  alert_type: 'low_stock' | 'out_of_stock' | 'insufficient';
  current_quantity: number;
  min_quantity: number;
  required_quantity?: number;
  appointment_id?: string;
  is_resolved: boolean;
  resolved_at?: string;
  created_at: string;
  // Joined
  material_name?: string;
}

// =============================================
// HELPER: Get clinic_id from current user
// =============================================
async function getClinicId(): Promise<string> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Usuário não autenticado');
  
  const { data: profile } = await supabase
    .from('profiles')
    .select('clinic_id')
    .eq('user_id', user.id)
    .single();
    
  if (!profile?.clinic_id) throw new Error('Clínica não encontrada');
  return profile.clinic_id;
}

// =============================================
// CONFIGURAÇÃO DE BAIXA AUTOMÁTICA
// =============================================

export function useAutoConsumptionConfig() {
  return useQuery({
    queryKey: ['auto-consumption-config'],
    queryFn: async () => {
      const clinicId = await getClinicId();
      
      const { data, error } = await supabase
        .from('clinics')
        .select('auto_material_consumption')
        .eq('id', clinicId)
        .single();
        
      if (error) throw error;
      return data?.auto_material_consumption ?? false;
    },
  });
}

export function useUpdateAutoConsumptionConfig() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (enabled: boolean) => {
      const clinicId = await getClinicId();
      
      const { error } = await supabase
        .from('clinics')
        .update({ auto_material_consumption: enabled })
        .eq('id', clinicId);
        
      if (error) throw error;
      return enabled;
    },
    onSuccess: (enabled) => {
      queryClient.invalidateQueries({ queryKey: ['auto-consumption-config'] });
      toast.success(enabled ? 'Baixa automática ativada!' : 'Baixa automática desativada');
    },
    onError: (error) => {
      console.error('Error updating auto consumption config:', error);
      toast.error('Erro ao atualizar configuração');
    },
  });
}

// =============================================
// BUSCAR MATERIAIS PARA CONSUMO DE UM ATENDIMENTO
// =============================================

export function useAppointmentMaterials(appointmentId: string | null) {
  return useQuery({
    queryKey: ['appointment-materials', appointmentId],
    queryFn: async (): Promise<MaterialConsumptionItem[]> => {
      if (!appointmentId) return [];
      
      // Get appointment details
      const { data: appointment, error: appError } = await supabase
        .from('appointments')
        .select('procedure_id')
        .eq('id', appointmentId)
        .single();
        
      if (appError || !appointment?.procedure_id) return [];
      
      const procedureId = appointment.procedure_id;
      const items: MaterialConsumptionItem[] = [];
      
      // Get direct materials linked to procedure
      const { data: materials, error: matError } = await supabase
        .from('procedure_materials')
        .select(`
          quantity,
          unit,
          is_required,
          allow_manual_edit,
          materials:material_id (id, name, unit_cost, is_active)
        `)
        .eq('procedure_id', procedureId);
        
      if (!matError && materials) {
        materials.forEach((pm: any) => {
          if (pm.materials?.is_active) {
            items.push({
              material_id: pm.materials.id,
              material_name: pm.materials.name,
              quantity: pm.quantity,
              unit: pm.unit,
              unit_cost: pm.materials.unit_cost || 0,
              source: 'procedure',
              is_required: pm.is_required,
              allow_manual_edit: pm.allow_manual_edit,
            });
          }
        });
      }
      
      // Get kits linked to procedure
      const { data: kits, error: kitError } = await supabase
        .from('procedure_kits')
        .select(`
          quantity,
          is_required,
          material_kits:kit_id (
            id,
            name,
            is_active,
            material_kit_items (
              quantity,
              unit,
              materials:material_id (id, name, unit_cost, is_active)
            )
          )
        `)
        .eq('procedure_id', procedureId);
        
      if (!kitError && kits) {
        kits.forEach((pk: any) => {
          if (pk.material_kits?.is_active) {
            const kitItems = pk.material_kits.material_kit_items || [];
            kitItems.forEach((item: any) => {
              if (item.materials?.is_active) {
                items.push({
                  material_id: item.materials.id,
                  material_name: item.materials.name,
                  quantity: item.quantity * pk.quantity,
                  unit: item.unit,
                  unit_cost: item.materials.unit_cost || 0,
                  source: 'kit',
                  kit_id: pk.material_kits.id,
                  kit_name: pk.material_kits.name,
                  is_required: pk.is_required,
                  allow_manual_edit: false,
                });
              }
            });
          }
        });
      }
      
      return items;
    },
    enabled: !!appointmentId,
  });
}

// =============================================
// PROCESSAR CONSUMO DE MATERIAIS
// =============================================

export function useProcessMaterialConsumption() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ 
      appointmentId, 
      materials 
    }: { 
      appointmentId: string; 
      materials: MaterialConsumptionItem[];
    }) => {
      const { data, error } = await supabase.rpc('process_material_consumption', {
        p_appointment_id: appointmentId,
        p_materials: materials.map(m => ({
          material_id: m.material_id,
          quantity: m.quantity,
          unit: m.unit,
          unit_cost: m.unit_cost,
          kit_id: m.kit_id || null,
          source: m.source,
          consumption_type: 'automatic',
        })),
      });
      
      if (error) throw error;
      
      // Parse result as the expected type
      const result = data as { 
        success: boolean; 
        consumed_count?: number; 
        alerts_count?: number;
        total_cost?: number;
        message?: string;
        error?: string;
      } | null;
      
      return result;
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ['material-consumption'] });
      queryClient.invalidateQueries({ queryKey: ['stock-alerts'] });
      queryClient.invalidateQueries({ queryKey: ['materials-list'] });
      
      if (result?.consumed_count && result.consumed_count > 0) {
        const totalCost = result.total_cost 
          ? new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(result.total_cost) 
          : "";
        
        toast.success(
          `✅ Baixa realizada com sucesso!`, 
          { 
            description: `${result.consumed_count} material(is) consumido(s)${totalCost ? ` • Custo total: ${totalCost}` : ""}`,
            duration: 5000,
          }
        );
      }
      
      if (result?.alerts_count && result.alerts_count > 0) {
        toast.warning(
          `⚠️ Atenção: Estoque baixo detectado`,
          {
            description: `${result.alerts_count} material(is) atingiram o limite mínimo de estoque`,
            duration: 6000,
          }
        );
      }
    },
    onError: (error: Error) => {
      console.error('Error processing material consumption:', error);
      
      // Parse specific error messages for better UX
      const errorMessage = error.message || '';
      
      if (errorMessage.includes('insufficient') || errorMessage.includes('estoque insuficiente')) {
        toast.error(
          '❌ Estoque insuficiente',
          {
            description: 'Um ou mais materiais não possuem quantidade suficiente em estoque. Verifique e reponha antes de continuar.',
            duration: 8000,
          }
        );
      } else if (errorMessage.includes('not found') || errorMessage.includes('não encontrado')) {
        toast.error(
          '❌ Material não encontrado',
          {
            description: 'Um ou mais materiais não foram encontrados no cadastro. Verifique a configuração do procedimento.',
            duration: 6000,
          }
        );
      } else {
        toast.error(
          '❌ Erro ao processar baixa',
          {
            description: 'Não foi possível realizar a baixa de materiais. Tente novamente ou contate o suporte.',
            duration: 6000,
          }
        );
      }
    },
  });
}

// =============================================
// HISTÓRICO DE CONSUMO
// =============================================

export function useMaterialConsumptionHistory(appointmentId?: string) {
  return useQuery({
    queryKey: ['material-consumption', appointmentId],
    queryFn: async () => {
      const clinicId = await getClinicId();
      
      let query = supabase
        .from('material_consumption')
        .select(`
          *,
          materials:material_id (name),
          procedures:procedure_id (name),
          professionals:professional_id (name),
          patients:patient_id (name)
        `)
        .eq('clinic_id', clinicId)
        .order('consumed_at', { ascending: false });
        
      if (appointmentId) {
        query = query.eq('appointment_id', appointmentId);
      } else {
        query = query.limit(100);
      }
      
      const { data, error } = await query;
      
      if (error) throw error;
      
      return (data || []).map((item: any) => ({
        ...item,
        material_name: item.materials?.name,
        procedure_name: item.procedures?.name,
        professional_name: item.professionals?.name,
        patient_name: item.patients?.name,
      })) as MaterialConsumptionRecord[];
    },
  });
}

// =============================================
// ALERTAS DE ESTOQUE
// =============================================

export function useStockAlerts(onlyUnresolved: boolean = true) {
  return useQuery({
    queryKey: ['stock-alerts', onlyUnresolved],
    queryFn: async () => {
      const clinicId = await getClinicId();
      
      let query = supabase
        .from('stock_alerts')
        .select(`
          *,
          materials:material_id (name)
        `)
        .eq('clinic_id', clinicId)
        .order('created_at', { ascending: false });
        
      if (onlyUnresolved) {
        query = query.eq('is_resolved', false);
      }
      
      const { data, error } = await query;
      
      if (error) throw error;
      
      return (data || []).map((item: any) => ({
        ...item,
        material_name: item.materials?.name,
      })) as StockAlert[];
    },
  });
}

export function useResolveStockAlert() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (alertId: string) => {
      const { data: { user } } = await supabase.auth.getUser();
      
      const { error } = await supabase
        .from('stock_alerts')
        .update({
          is_resolved: true,
          resolved_at: new Date().toISOString(),
          resolved_by: user?.id,
        })
        .eq('id', alertId);
        
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['stock-alerts'] });
      toast.success('Alerta resolvido!');
    },
    onError: (error) => {
      console.error('Error resolving stock alert:', error);
      toast.error('Erro ao resolver alerta');
    },
  });
}
