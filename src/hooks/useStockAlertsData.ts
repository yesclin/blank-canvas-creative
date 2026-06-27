import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useClinicData } from "@/hooks/useClinicData";

export interface StockAlertItem {
  item_id: string;
  name: string;
  category: string | null;
  unit: string;
  minimum_stock: number;
  current_stock: number;
  last_movement_at: string | null;
}

export interface StockAlertBatch {
  batch_id: string;
  item_id: string;
  item_name: string;
  batch_number: string;
  expiry_date: string;
  quantity_available: number;
  days_to_expiry: number;
}

export interface StockAlertsData {
  outOfStock: StockAlertItem[];
  lowStock: StockAlertItem[];
  expiringSoon: StockAlertBatch[];
  expired: StockAlertBatch[];
  noMovement: StockAlertItem[];
  totals: {
    totalItems: number;
    sellable: number;
    lowStock: number;
    outOfStock: number;
    expiringSoon: number;
    expired: number;
  };
}

const NO_MOVEMENT_THRESHOLD_DAYS = 90;

export function useStockAlertsData() {
  const { clinic } = useClinicData();

  return useQuery({
    queryKey: ["stock-alerts-data", clinic?.id],
    enabled: !!clinic?.id,
    refetchOnWindowFocus: false,
    queryFn: async (): Promise<StockAlertsData> => {
      const clinicId = clinic!.id;

      const [itemsRes, batchesRes, movementsRes] = await Promise.all([
        supabase
          .from("inventory_items")
          .select("id, name, category, unit_of_measure, minimum_stock, is_active, controls_stock, is_sellable")
          .eq("clinic_id", clinicId)
          .eq("is_active", true),
        supabase
          .from("inventory_batches")
          .select("id, item_id, batch_number, expiry_date, quantity_available, status")
          .eq("clinic_id", clinicId),
        supabase
          .from("inventory_movements")
          .select("item_id, created_at")
          .eq("clinic_id", clinicId)
          .order("created_at", { ascending: false })
          .limit(1000),
      ]);

      if (itemsRes.error) throw itemsRes.error;
      if (batchesRes.error) throw batchesRes.error;
      if (movementsRes.error) throw movementsRes.error;

      const items = itemsRes.data || [];
      const batches = batchesRes.data || [];
      const movements = movementsRes.data || [];

      const stockByItem = new Map<string, number>();
      for (const b of batches) {
        if (b.status !== "active") continue;
        stockByItem.set(b.item_id, (stockByItem.get(b.item_id) || 0) + Number(b.quantity_available || 0));
      }

      const lastMovementByItem = new Map<string, string>();
      for (const m of movements) {
        if (!lastMovementByItem.has(m.item_id)) lastMovementByItem.set(m.item_id, m.created_at);
      }

      const nameById = new Map<string, string>(items.map((i) => [i.id as string, i.name as string]));
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const outOfStock: StockAlertItem[] = [];
      const lowStock: StockAlertItem[] = [];
      const noMovement: StockAlertItem[] = [];

      for (const i of items) {
        if (!i.controls_stock) continue;
        const current = stockByItem.get(i.id) || 0;
        const last = lastMovementByItem.get(i.id) || null;
        const base: StockAlertItem = {
          item_id: i.id,
          name: i.name,
          category: i.category,
          unit: i.unit_of_measure,
          minimum_stock: i.minimum_stock || 0,
          current_stock: current,
          last_movement_at: last,
        };
        if (current <= 0) outOfStock.push(base);
        else if (i.minimum_stock > 0 && current <= i.minimum_stock) lowStock.push(base);

        const lastDate = last ? new Date(last) : null;
        const daysSince = lastDate
          ? Math.floor((today.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24))
          : Infinity;
        if (current > 0 && daysSince >= NO_MOVEMENT_THRESHOLD_DAYS) noMovement.push(base);
      }

      const expiringSoon: StockAlertBatch[] = [];
      const expired: StockAlertBatch[] = [];

      for (const b of batches) {
        if (!b.expiry_date) continue;
        if (b.status !== "active") continue;
        if (Number(b.quantity_available || 0) <= 0) continue;
        const exp = new Date(b.expiry_date);
        const diffDays = Math.floor((exp.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
        const payload: StockAlertBatch = {
          batch_id: b.id,
          item_id: b.item_id,
          item_name: nameById.get(b.item_id) || "—",
          batch_number: b.batch_number,
          expiry_date: b.expiry_date,
          quantity_available: Number(b.quantity_available || 0),
          days_to_expiry: diffDays,
        };
        if (diffDays < 0) expired.push(payload);
        else if (diffDays <= 30) expiringSoon.push(payload);
      }

      outOfStock.sort((a, b) => a.name.localeCompare(b.name));
      lowStock.sort((a, b) => a.current_stock - b.current_stock);
      expiringSoon.sort((a, b) => a.days_to_expiry - b.days_to_expiry);
      expired.sort((a, b) => a.expiry_date.localeCompare(b.expiry_date));
      noMovement.sort((a, b) => (a.last_movement_at || "").localeCompare(b.last_movement_at || ""));

      return {
        outOfStock,
        lowStock,
        expiringSoon,
        expired,
        noMovement,
        totals: {
          totalItems: items.filter((i) => i.controls_stock).length,
          sellable: items.filter((i) => i.is_sellable).length,
          lowStock: lowStock.length,
          outOfStock: outOfStock.length,
          expiringSoon: expiringSoon.length,
          expired: expired.length,
        },
      };
    },
  });
}
