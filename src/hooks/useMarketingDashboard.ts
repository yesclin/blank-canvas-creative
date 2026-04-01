import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useClinicData } from '@/hooks/useClinicData';
import { format, subDays, addDays, startOfMonth, endOfMonth } from 'date-fns';

export interface DashboardData {
  patientsWithAppointmentTomorrow: Array<{ id: string; full_name: string; phone: string | null; scheduled_date: string; start_time: string; professional_name: string }>;
  patientsNoReturn30: number;
  patientsNoReturn60: number;
  patientsNoReturn90: number;
  birthdaysThisMonth: Array<{ id: string; full_name: string; phone: string | null; birth_date: string }>;
  recentAbsences: Array<{ id: string; full_name: string; phone: string | null; scheduled_date: string }>;
  completedToday: number;
  totalPrepared: number;
  totalSent: number;
  totalPending: number;
  totalFailed: number;
}

export function useMarketingDashboard() {
  const { clinic } = useClinicData();

  return useQuery({
    queryKey: ['marketing-dashboard', clinic?.id],
    enabled: !!clinic?.id,
    refetchInterval: 60000,
    queryFn: async (): Promise<DashboardData> => {
      const clinicId = clinic!.id;
      const today = format(new Date(), 'yyyy-MM-dd');
      const tomorrow = format(addDays(new Date(), 1), 'yyyy-MM-dd');
      const thirtyAgo = format(subDays(new Date(), 30), 'yyyy-MM-dd');
      const sixtyAgo = format(subDays(new Date(), 60), 'yyyy-MM-dd');
      const ninetyAgo = format(subDays(new Date(), 90), 'yyyy-MM-dd');
      const monthStart = format(startOfMonth(new Date()), 'MM-dd');
      const monthEnd = format(endOfMonth(new Date()), 'MM-dd');

      // Parallel queries
      const [
        tomorrowAppts,
        allPatientAppts,
        birthdayPatients,
        recentMissed,
        completedAppts,
        messageStats,
      ] = await Promise.all([
        // 1. Patients with appointment tomorrow
        supabase
          .from('appointments')
          .select('patient_id, scheduled_date, start_time, patients(id, full_name, phone), professionals(full_name)')
          .eq('clinic_id', clinicId)
          .eq('scheduled_date', tomorrow)
          .neq('status', 'cancelado')
          .limit(100),

        // 2. All appointments for no-return calculation
        supabase
          .from('appointments')
          .select('patient_id, scheduled_date')
          .eq('clinic_id', clinicId)
          .in('status', ['finalizado', 'concluido', 'atendido', 'confirmado'])
          .order('scheduled_date', { ascending: false })
          .limit(5000),

        // 3. Birthdays this month
        supabase
          .from('patients')
          .select('id, full_name, phone, birth_date')
          .eq('clinic_id', clinicId)
          .eq('is_active', true)
          .not('birth_date', 'is', null)
          .limit(1000),

        // 4. Recent absences (last 30 days)
        supabase
          .from('appointments')
          .select('patient_id, scheduled_date, patients(id, full_name, phone)')
          .eq('clinic_id', clinicId)
          .eq('status', 'faltou')
          .gte('scheduled_date', thirtyAgo)
          .order('scheduled_date', { ascending: false })
          .limit(50),

        // 5. Completed today
        supabase
          .from('appointments')
          .select('id', { count: 'exact', head: true })
          .eq('clinic_id', clinicId)
          .eq('scheduled_date', today)
          .in('status', ['finalizado', 'concluido', 'atendido']),

        // 6. Message stats
        supabase
          .from('message_queue')
          .select('status')
          .eq('clinic_id', clinicId),
      ]);

      // Process tomorrow appointments
      const tomorrowList = (tomorrowAppts.data || []).map((a: any) => ({
        id: a.patients?.id || a.patient_id,
        full_name: a.patients?.full_name || 'Paciente',
        phone: a.patients?.phone || null,
        scheduled_date: a.scheduled_date,
        start_time: a.start_time,
        professional_name: a.professionals?.full_name || '',
      }));

      // Process no-return: find patients whose last appointment is older than X days
      const lastApptByPatient = new Map<string, string>();
      (allPatientAppts.data || []).forEach((a: any) => {
        if (!lastApptByPatient.has(a.patient_id)) {
          lastApptByPatient.set(a.patient_id, a.scheduled_date);
        }
      });

      let noReturn30 = 0, noReturn60 = 0, noReturn90 = 0;
      lastApptByPatient.forEach((lastDate) => {
        if (lastDate < ninetyAgo) noReturn90++;
        else if (lastDate < sixtyAgo) noReturn60++;
        else if (lastDate < thirtyAgo) noReturn30++;
      });

      // Process birthdays - filter in JS since we can't do month extraction in the query easily
      const currentMonth = new Date().getMonth() + 1;
      const birthdays = (birthdayPatients.data || [])
        .filter((p: any) => {
          if (!p.birth_date) return false;
          const month = parseInt(p.birth_date.split('-')[1], 10);
          return month === currentMonth;
        })
        .map((p: any) => ({
          id: p.id,
          full_name: p.full_name,
          phone: p.phone,
          birth_date: p.birth_date,
        }));

      // Process absences
      const absences = (recentMissed.data || []).map((a: any) => ({
        id: a.patients?.id || a.patient_id,
        full_name: a.patients?.full_name || 'Paciente',
        phone: a.patients?.phone || null,
        scheduled_date: a.scheduled_date,
      }));

      // Process message stats
      const msgs = messageStats.data || [];
      const totalPrepared = msgs.length;
      const totalSent = msgs.filter((m: any) => ['sent', 'delivered', 'read'].includes(m.status)).length;
      const totalPending = msgs.filter((m: any) => m.status === 'pending').length;
      const totalFailed = msgs.filter((m: any) => m.status === 'failed').length;

      return {
        patientsWithAppointmentTomorrow: tomorrowList,
        patientsNoReturn30: noReturn30,
        patientsNoReturn60: noReturn60,
        patientsNoReturn90: noReturn90,
        birthdaysThisMonth: birthdays,
        recentAbsences: absences,
        completedToday: completedAppts.count || 0,
        totalPrepared,
        totalSent,
        totalPending,
        totalFailed,
      };
    },
  });
}
