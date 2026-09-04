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
  source: 'procedure' | 'kit' | 'extra' | 'canonical';
  kit_id?: string;
  kit_name?: string;
  is_required?: boolean;
  allow_manual_edit?: boolean;
  /**
   * true quando o item vem de `procedure_consumption_templates` /
   * `procedure_consumption_kits`: a baixa é feita no banco pela RPC
   * `process_appointment_consumption` na finalização, então o consumo manual
   * deve IGNORAR esses itens para não duplicar movimentação.
   */
  handled_by_engine?: boolean;
}

export interface MaterialConsumptionRecord {
  id: string;
  clinic_id: string;
  appointment_id: string;
  procedure_id?: string;
  product_id: string;
  material_id?: string;
  kit_id?: string;
  professional_id?: string;
  patient_id?: string;
  quantity: number;
  unit: string;
  unit_cost: number;
  total_cost: number;
  consumption_type?: 'automatic' | 'manual' | 'adjustment';
  source?: 'procedure' | 'kit' | 'extra';
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
  product_id: string;
  alert_type: string;
  current_quantity: number;
  min_quantity: number;
  is_resolved: boolean;
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

      // === MODELO CANÔNICO: procedure_consumption_templates → inventory_items ===
      // Estes itens são baixados no banco pela RPC process_appointment_consumption.
      const [{ data: canonicalTemplates }, { data: canonicalKits }] = await Promise.all([
        supabase
          .from('procedure_consumption_templates')
          .select(`
            default_quantity,
            unit,
            is_required,
            allow_quantity_edit_on_finish,
            inventory_items:item_id (id, name, unit_of_measure, default_cost_price, is_active)
          `)
          .eq('procedure_id', procedureId),
        supabase
          .from('procedure_consumption_kits')
          .select(`
            quantity,
            is_required,
            inventory_kits:kit_id (
              id,
              name,
              is_active,
              inventory_kit_items (
                quantity,
                inventory_items:item_id (id, name, unit_of_measure, default_cost_price, is_active)
              )
            )
          `)
          .eq('procedure_id', procedureId),
      ]);

      (canonicalTemplates || []).forEach((t: any) => {
        const item = t.inventory_items;
        if (!item || item.is_active === false) return;
        items.push({
          material_id: item.id,
          material_name: item.name,
          quantity: Number(t.default_quantity) || 0,
          unit: t.unit || item.unit_of_measure || 'un',
          unit_cost: Number(item.default_cost_price) || 0,
          source: 'canonical',
          is_required: !!t.is_required,
          allow_manual_edit: !!t.allow_quantity_edit_on_finish,
          handled_by_engine: true,
        });
      });

      (canonicalKits || []).forEach((ck: any) => {
        const kit = ck.inventory_kits;
        if (!kit || kit.is_active === false) return;
        (kit.inventory_kit_items || []).forEach((ki: any) => {
          const item = ki.inventory_items;
          if (!item || item.is_active === false) return;
          items.push({
            material_id: item.id,
            material_name: item.name,
            quantity: (Number(ki.quantity) || 0) * (Number(ck.quantity) || 1),
            unit: item.unit_of_measure || 'un',
            unit_cost: Number(item.default_cost_price) || 0,
            source: 'canonical',
            kit_id: kit.id,
            kit_name: kit.name,
            is_required: !!ck.is_required,
            allow_manual_edit: false,
            handled_by_engine: true,
          });
        });
      });

      // Se o procedimento já usa o modelo canônico, NÃO carrega os vínculos
      // legados (evita listar/baixar o mesmo insumo duas vezes).
      if (items.length > 0) return items;

      // === MODELO LEGADO: procedure_products → products ===
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
        // Itens canônicos são baixados pela RPC process_appointment_consumption
        // na finalização — pular aqui evita consumo duplicado.
        if (m.handled_by_engine || m.source === 'canonical') continue;

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
          products:product_id (name, unit, cost_price),
          professionals:professional_id (full_name),
          patients:patient_id (full_name)
        `)
        .eq('clinic_id', clinicId)
        .order('created_at', { ascending: false });
        
      if (appointmentId) {
        query = query.eq('appointment_id', appointmentId);
      } else {
        query = query.limit(100);
      }
      
      const { data, error } = await query;
      
      if (error) throw error;
      
      return (data || []).map((item: any) => ({
        ...item,
        material_name: item.products?.name,
        consumed_at: item.created_at,
        unit: item.products?.unit ?? 'un',
        unit_cost: Number(item.products?.cost_price) || 0,
        total_cost: (Number(item.products?.cost_price) || 0) * (Number(item.quantity) || 0),
        professional_name: item.professionals?.full_name,
        patient_name: item.patients?.full_name,
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
          products:product_id (name, current_stock, min_stock)
        `)
        .eq('clinic_id', clinicId)
        .order('created_at', { ascending: false });
        
      if (onlyUnresolved) {
        query = query.eq('is_active', true);
      }
      
      const { data, error } = await query;
      
      if (error) throw error;
      
      return (data || []).map((item: any) => ({
        ...item,
        material_name: item.products?.name,
        current_quantity: Number(item.products?.current_stock) || 0,
        min_quantity: Number(item.threshold ?? item.products?.min_stock) || 0,
        is_resolved: item.is_active === false,
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
          is_active: false,
          updated_at: new Date().toISOString(),
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
