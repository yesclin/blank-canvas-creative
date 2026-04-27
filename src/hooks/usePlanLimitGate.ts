/**
 * usePlanLimitGate
 * --------------------------------------------------
 * Hook utilitário para validar limites do plano antes de executar
 * uma ação (criar profissional, paciente, especialidade, agendamento).
 *
 * Faz a contagem on-demand contra o Supabase respeitando o `clinic_id`
 * efetivo (compatível com modo suporte do Super Admin) e usa o helper
 * `canCreateResource` para decidir.
 *
 * Uso típico (frontend):
 *   const gate = usePlanLimitGate();
 *   const ok = await gate.ensureCanCreate('professionals');
 *   if (!ok) return; // toast já foi exibido
 *   ...prossegue com criação
 *
 * IMPORTANTE: Esta validação é uma camada de UX. Limites devem
 * idealmente ser revalidados no banco (RPC/trigger) para serem seguros
 * de verdade — frontend pode ser contornado.
 */
import { useCallback } from 'react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { withTimeout } from '@/lib/asyncTimeout';
import {
  canCreateResource,
  useClinicFeatures,
  type ResourceType,
} from '@/hooks/useClinicFeatures';

const RESOURCE_LABELS: Record<ResourceType, string> = {
  professionals: 'profissionais',
  patients: 'pacientes',
  specialties: 'especialidades',
  appointments_monthly: 'agendamentos no mês',
  whatsapp_instances: 'instâncias de WhatsApp',
};

async function countResource(
  type: ResourceType,
  clinicId: string,
): Promise<number> {
  switch (type) {
    case 'professionals': {
      const { count } = await supabase
        .from('professionals')
        .select('id', { count: 'exact', head: true })
        .eq('clinic_id', clinicId)
        .eq('is_active', true);
      return count ?? 0;
    }
    case 'patients': {
      const { count } = await supabase
        .from('patients')
        .select('id', { count: 'exact', head: true })
        .eq('clinic_id', clinicId);
      return count ?? 0;
    }
    case 'specialties': {
      const { count } = await supabase
        .from('specialties')
        .select('id', { count: 'exact', head: true })
        .eq('clinic_id', clinicId)
        .eq('is_active', true);
      return count ?? 0;
    }
    case 'appointments_monthly': {
      const now = new Date();
      const start = new Date(now.getFullYear(), now.getMonth(), 1);
      const end = new Date(now.getFullYear(), now.getMonth() + 1, 1);
      const fmt = (d: Date) =>
        `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(
          d.getDate(),
        ).padStart(2, '0')}`;
      const { count } = await supabase
        .from('appointments')
        .select('id', { count: 'exact', head: true })
        .eq('clinic_id', clinicId)
        .gte('scheduled_date', fmt(start))
        .lt('scheduled_date', fmt(end));
      return count ?? 0;
    }
    case 'whatsapp_instances': {
      const { count } = await supabase
        .from('clinic_channel_integrations')
        .select('id', { count: 'exact', head: true })
        .eq('clinic_id', clinicId)
        .eq('channel', 'whatsapp');
      return count ?? 0;
    }
    default:
      return 0;
  }
}

export function usePlanLimitGate() {
  const { limits, clinic_id, loading } = useClinicFeatures();

  /**
   * Valida o limite e — quando atingido — exibe toast e retorna false.
   * Retorna true quando a ação pode prosseguir.
   */
  const ensureCanCreate = useCallback(
    async (type: ResourceType): Promise<boolean> => {
      // Em loading: não bloquear (evita falso negativo). Backend/RLS deve
      // ser a defesa final.
      if (loading) return true;
      if (!clinic_id) return true;

      const limit = limits[
        type === 'professionals'
          ? 'max_professionals'
          : type === 'patients'
            ? 'max_patients'
            : type === 'specialties'
              ? 'max_specialties'
              : type === 'appointments_monthly'
                ? 'max_appointments_monthly'
                : 'max_whatsapp_instances'
      ];

      if (limit === null || limit === undefined) return true; // ilimitado

      try {
        const current = await countResource(type, clinic_id);
        const result = canCreateResource(type, current, limits);
        if (result.allowed) return true;

        toast.error('Limite do plano atingido. Faça upgrade para continuar.', {
          description: `Seu plano permite até ${result.limit} ${RESOURCE_LABELS[type]}.`,
        });
        return false;
      } catch (err) {
        // Se a contagem falhar, NÃO bloqueamos a ação — o backend/RLS é a defesa final.
        console.warn('[usePlanLimitGate] count failed, allowing action', err);
        return true;
      }
    },
    [clinic_id, limits, loading],
  );

  return { ensureCanCreate };
}
