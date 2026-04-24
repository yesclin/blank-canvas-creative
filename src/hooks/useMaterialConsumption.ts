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
// Lê de procedure_products + procedure_product_kits (modelo atual baseado em
// `products`). Mantém fallback para procedure_materials/procedure_kits do
// modelo antigo (caso ainda exista algum vínculo legado).

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

      // === MODELO ATUAL: procedure_products → products ===
      const { data: procedureProducts } = await supabase
        .from('procedure_products')
        .select(`
          quantity,
          products:product_id (id, name, unit, cost_price, is_active)
        `)
        .eq('procedure_id', procedureId);

      (procedureProducts || []).forEach((pp: any) => {
        const prod = pp.products;
        if (prod && prod.is_active !== false) {
          items.push({
            material_id: prod.id,
            material_name: prod.name,
            quantity: Number(pp.quantity) || 0,
            unit: prod.unit || 'un',
            unit_cost: Number(prod.cost_price) || 0,
            source: 'procedure',
            is_required: false,
            allow_manual_edit: true,
          });
        }
      });

      // === MODELO ATUAL: procedure_product_kits → product_kits → product_kit_items → products ===
      const { data: procedureKits } = await supabase
        .from('procedure_product_kits')
        .select(`
          quantity,
          product_kits:product_kit_id (
            id,
            name,
            is_active,
            product_kit_items (
              quantity,
              products:product_id (id, name, unit, cost_price, is_active)
            )
          )
        `)
        .eq('procedure_id', procedureId);

      (procedureKits || []).forEach((pk: any) => {
        const kit = pk.product_kits;
        if (!kit || kit.is_active === false) return;
        (kit.product_kit_items || []).forEach((kitItem: any) => {
          const prod = kitItem.products;
          if (prod && prod.is_active !== false) {
            items.push({
              material_id: prod.id,
              material_name: prod.name,
              quantity: (Number(kitItem.quantity) || 0) * (Number(pk.quantity) || 1),
              unit: prod.unit || 'un',
              unit_cost: Number(prod.cost_price) || 0,
              source: 'kit',
              kit_id: kit.id,
              kit_name: kit.name,
              is_required: false,
              allow_manual_edit: false,
            });
          }
        });
      });

      // === LEGADO: procedure_materials (caso a tabela ainda exista) ===
      try {
        const { data: legacyMaterials } = await supabase
          .from('procedure_materials')
          .select(`
            quantity,
            unit,
            is_required,
            allow_manual_edit,
            materials:material_id (id, name, unit_cost, is_active)
          `)
          .eq('procedure_id', procedureId);

        (legacyMaterials || []).forEach((pm: any) => {
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
      } catch {
        // tabela legada ausente — ignorar
      }

      return items;
    },
    enabled: !!appointmentId,
  });
}

// =============================================
// PROCESSAR CONSUMO DE MATERIAIS
// =============================================
// Registra cada item como saída em `stock_movements` (modelo atual). A baixa
// do `current_stock` é feita pelo trigger do banco que recalcula a partir das
// movimentações. Caso não haja trigger, fazemos update manual no produto.

export function useProcessMaterialConsumption() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      appointmentId,
      materials,
    }: {
      appointmentId: string;
      materials: MaterialConsumptionItem[];
    }) => {
      const clinicId = await getClinicId();
      const { data: { user } } = await supabase.auth.getUser();

      // Get appointment context for audit
      const { data: appointment } = await supabase
        .from('appointments')
        .select('procedure_id, patient_id, professional_id')
        .eq('id', appointmentId)
        .single();

      let consumedCount = 0;
      let alertsCount = 0;
      let totalCost = 0;
      const insufficientStock: string[] = [];

      for (const m of materials) {
        if (!m.material_id || m.quantity <= 0) continue;

        // Verificar estoque atual do produto
        const { data: product } = await supabase
          .from('products')
          .select('id, name, current_stock, cost_price, min_stock')
          .eq('id', m.material_id)
          .single();

        if (!product) continue;

        const previous = Number(product.current_stock) || 0;
        if (previous < m.quantity) {
          insufficientStock.push(`${product.name} (disp: ${previous}, necessário: ${m.quantity})`);
          continue;
        }

        const newQty = previous - m.quantity;
        const unitCost = Number(m.unit_cost) || Number(product.cost_price) || 0;

        // Registrar movimento de saída
        const { error: movErr } = await supabase
          .from('stock_movements')
          .insert({
            clinic_id: clinicId,
            product_id: m.material_id,
            movement_type: 'saida',
            quantity: m.quantity,
            unit_cost: unitCost,
            reference_type: 'appointment',
            reference_id: appointmentId,
            notes: `Consumo em atendimento${m.source === 'kit' ? ` (kit: ${m.kit_name})` : ''}${m.source === 'extra' ? ' (extra)' : ''}`,
            performed_by: user?.id || null,
          });

        if (movErr) throw movErr;

        // Atualizar saldo do produto
        const { error: updErr } = await supabase
          .from('products')
          .update({
            current_stock: newQty,
            updated_at: new Date().toISOString(),
          })
          .eq('id', m.material_id);

        if (updErr) throw updErr;

        consumedCount++;
        totalCost += m.quantity * unitCost;

        // Detectar alerta de estoque mínimo
        const minStock = Number(product.min_stock) || 0;
        if (minStock > 0 && newQty <= minStock) {
          alertsCount++;
        }
      }

      if (insufficientStock.length > 0) {
        throw new Error(`Estoque insuficiente para: ${insufficientStock.join('; ')}`);
      }

      return {
        success: true,
        consumed_count: consumedCount,
        alerts_count: alertsCount,
        total_cost: totalCost,
      };
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ['material-consumption'] });
      queryClient.invalidateQueries({ queryKey: ['stock-alerts'] });
      queryClient.invalidateQueries({ queryKey: ['materials-list'] });
      queryClient.invalidateQueries({ queryKey: ['products'] });
      queryClient.invalidateQueries({ queryKey: ['stock-products'] });
      queryClient.invalidateQueries({ queryKey: ['stock-movements'] });
      queryClient.invalidateQueries({ queryKey: ['stock-stats'] });

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
      const errorMessage = error.message || '';

      if (errorMessage.toLowerCase().includes('insuficiente') || errorMessage.toLowerCase().includes('insufficient')) {
        toast.error('❌ Estoque insuficiente', {
          description: errorMessage.replace(/^Estoque insuficiente para:\s*/i, '').slice(0, 200),
          duration: 8000,
        });
      } else {
        toast.error('❌ Erro ao processar baixa', {
          description: errorMessage || 'Não foi possível realizar a baixa de materiais.',
          duration: 6000,
        });
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
