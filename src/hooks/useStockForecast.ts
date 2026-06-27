import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useClinicData } from "@/hooks/useClinicData";
import { entryMovementTypes, exitMovementTypes } from "@/types/inventory-batches";

export interface ConsumptionForecast {
  item_id: string;
  name: string;
  category: string | null;
  unit: string;
  current_stock: number;
  total_consumed: number;
  avg_per_day: number;
  days_remaining: number | null;
  exhaustion_date: string | null;
  suggested_purchase: number;
  severity: "critical" | "warning" | "info" | "ok";
  has_history: boolean;
  default_cost_price: number;
}

export interface MonthlyMovement {
  month: string; // yyyy-MM
  label: string; // MMM/yy
  entries: number;
  exits: number;
  balance: number;
}

export interface StockForecastData {
  forecasts: ConsumptionForecast[];
  monthly: MonthlyMovement[];
  windowDays: number;
  hasAnyHistory: boolean;
}

function severityFor(days: number | null): ConsumptionForecast["severity"] {
  if (days === null) return "ok";
  if (days <= 7) return "critical";
  if (days <= 15) return "warning";
  if (days <= 30) return "info";
  return "ok";
}

export function useStockForecast(windowDays = 90, targetCoverageDays = 30) {
  const { clinic } = useClinicData();

  return useQuery({
    queryKey: ["stock-forecast", clinic?.id, windowDays, targetCoverageDays],
    enabled: !!clinic?.id,
    refetchOnWindowFocus: false,
    queryFn: async (): Promise<StockForecastData> => {
      const clinicId = clinic!.id;
      const sinceDate = new Date();
      sinceDate.setDate(sinceDate.getDate() - windowDays);
      const sixMonthsAgo = new Date();
      sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 5);
      sixMonthsAgo.setDate(1);
      const earliest = sinceDate < sixMonthsAgo ? sinceDate : sixMonthsAgo;

      const [itemsRes, batchesRes, movementsRes] = await Promise.all([
        supabase
          .from("inventory_items")
          .select("id, name, category, unit_of_measure, default_cost_price, controls_stock")
          .eq("clinic_id", clinicId)
          .eq("is_active", true),
        supabase
          .from("inventory_batches")
          .select("item_id, quantity_available, status")
          .eq("clinic_id", clinicId),
        supabase
          .from("inventory_movements")
          .select("item_id, movement_type, quantity, created_at")
          .eq("clinic_id", clinicId)
          .gte("created_at", earliest.toISOString()),
      ]);

      if (itemsRes.error) throw itemsRes.error;
      if (batchesRes.error) throw batchesRes.error;
      if (movementsRes.error) throw movementsRes.error;

      const items = (itemsRes.data || []).filter((i: any) => i.controls_stock);
      const batches = batchesRes.data || [];
      const movements = movementsRes.data || [];

      const stockByItem = new Map<string, number>();
      for (const b of batches) {
        if (b.status !== "active") continue;
        stockByItem.set(b.item_id, (stockByItem.get(b.item_id) || 0) + Number(b.quantity_available || 0));
      }

      const cutoff = sinceDate.getTime();
      const consumedByItem = new Map<string, number>();
      for (const m of movements) {
        if (!exitMovementTypes.includes(m.movement_type as any)) continue;
        if (new Date(m.created_at).getTime() < cutoff) continue;
        consumedByItem.set(m.item_id, (consumedByItem.get(m.item_id) || 0) + Math.abs(Number(m.quantity || 0)));
      }

      const forecasts: ConsumptionForecast[] = items.map((i: any) => {
        const current = stockByItem.get(i.id) || 0;
        const consumed = consumedByItem.get(i.id) || 0;
        const avgDay = consumed / windowDays;
        const hasHistory = consumed > 0;
        const daysRem = hasHistory && avgDay > 0 ? Math.floor(current / avgDay) : null;
        const exhDate = daysRem !== null
          ? new Date(Date.now() + daysRem * 86400000).toISOString().slice(0, 10)
          : null;
        const targetQty = Math.ceil(avgDay * targetCoverageDays);
        const suggested = hasHistory ? Math.max(0, targetQty - current) : 0;
        return {
          item_id: i.id,
          name: i.name,
          category: i.category,
          unit: i.unit_of_measure,
          current_stock: current,
          total_consumed: consumed,
          avg_per_day: avgDay,
          days_remaining: daysRem,
          exhaustion_date: exhDate,
          suggested_purchase: suggested,
          severity: severityFor(daysRem),
          has_history: hasHistory,
          default_cost_price: Number(i.default_cost_price || 0),
        };
      });

      // monthly aggregation (last 6 months)
      const monthsMap = new Map<string, { entries: number; exits: number }>();
      for (let k = 5; k >= 0; k--) {
        const d = new Date();
        d.setMonth(d.getMonth() - k);
        const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
        monthsMap.set(key, { entries: 0, exits: 0 });
      }
      for (const m of movements) {
        const d = new Date(m.created_at);
        const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
        const slot = monthsMap.get(key);
        if (!slot) continue;
        const q = Math.abs(Number(m.quantity || 0));
        if (entryMovementTypes.includes(m.movement_type as any)) slot.entries += q;
        else if (exitMovementTypes.includes(m.movement_type as any)) slot.exits += q;
      }
      const monthly: MonthlyMovement[] = Array.from(monthsMap.entries()).map(([month, v]) => {
        const [y, mo] = month.split("-");
        const label = new Date(Number(y), Number(mo) - 1, 1).toLocaleDateString("pt-BR", {
          month: "short",
          year: "2-digit",
        });
        return { month, label, entries: v.entries, exits: v.exits, balance: v.entries - v.exits };
      });

      forecasts.sort((a, b) => {
        const order = { critical: 0, warning: 1, info: 2, ok: 3 } as const;
        if (order[a.severity] !== order[b.severity]) return order[a.severity] - order[b.severity];
        return (a.days_remaining ?? 9999) - (b.days_remaining ?? 9999);
      });

      return {
        forecasts,
        monthly,
        windowDays,
        hasAnyHistory: forecasts.some((f) => f.has_history),
      };
    },
  });
}
