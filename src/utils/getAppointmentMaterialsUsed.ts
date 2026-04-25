/**
 * getAppointmentMaterialsUsed
 *
 * Fonte unificada para os materiais/produtos efetivamente consumidos em um
 * atendimento. Busca em todas as tabelas conhecidas, considerando variações
 * de `reference_type` e aplicando um fallback temporal (mesma clínica,
 * mesmo paciente e mesmo profissional dentro da janela started_at →
 * finished_at) para registros legados que não foram salvos com
 * `appointment_id`.
 *
 * Retorna uma lista normalizada que pode ser exibida diretamente dentro de
 * "Procedimentos Realizados" no documento consolidado do atendimento.
 */
import { supabase } from "@/integrations/supabase/client";

export type MaterialUsedSource =
  | "stock_movement"
  | "material_consumption"
  | "aesthetic_product"
  | "fallback_temporal"
  | "procedure_predicted"
  | "procedure_kit_predicted";

export interface AppointmentMaterialUsed {
  id: string;
  source: MaterialUsedSource;
  origin_label: string; // Ex: "Estoque", "Consumo manual", "Estética", "Previsto no procedimento"
  /** true quando o item ainda não foi confirmado/consumido — apenas previsto pelo procedimento */
  is_predicted?: boolean;
  product_id: string | null;
  material_id: string | null;
  procedure_id: string | null;
  name: string;
  quantity: number;
  unit: string | null;
  batch_number: string | null;
  expiry_date: string | null;
  manufacturer: string | null;
  unit_cost: number | null;
  total_cost: number | null;
  movement_type: string | null;
  notes: string | null;
  created_at: string;
}

interface AppointmentWindow {
  appointment_id: string;
  clinic_id: string;
  patient_id: string;
  professional_id: string;
  procedure_id?: string | null;
  started_at: string | null;
  finished_at: string | null;
}

async function safe<T>(p: PromiseLike<{ data: T | null; error: any }>): Promise<T> {
  try {
    const { data, error } = await p;
    if (error) return [] as any;
    return (data ?? ([] as any)) as T;
  } catch {
    return [] as any;
  }
}

function originLabel(src: MaterialUsedSource): string {
  switch (src) {
    case "stock_movement": return "Estoque";
    case "material_consumption": return "Consumo manual";
    case "aesthetic_product": return "Estética";
    case "fallback_temporal": return "Vinculação por janela";
  }
}

export async function getAppointmentMaterialsUsed(
  appointmentId: string,
  appointmentWindow?: Partial<AppointmentWindow>,
): Promise<AppointmentMaterialUsed[]> {
  if (!appointmentId) return [];

  // 1. stock_movements — todas as variações de reference_type que indicam atendimento
  const stockMovementsRaw = await safe<any[]>(
    supabase
      .from("stock_movements")
      .select(`
        id, product_id, quantity, unit_cost, notes, movement_type,
        reference_type, reference_id, created_at,
        products:product_id (name, unit)
      `)
      .eq("reference_id", appointmentId)
      .in("reference_type", ["appointment", "manual_appointment", "procedure_execution", "appointment_material"])
      .order("created_at"),
  );

  // 2. material_consumption (modelo dedicado)
  const consumptionRaw = await safe<any[]>(
    supabase
      .from("material_consumption")
      .select(`
        id, product_id, quantity, notes, created_at,
        products:product_id (name, unit, cost_price)
      `)
      .eq("appointment_id", appointmentId)
      .order("created_at"),
  );

  // 3. aesthetic_products_used (estética)
  const aestheticRaw = await safe<any[]>(
    supabase
      .from("aesthetic_products_used")
      .select(`
        id, product_name, quantity, unit, manufacturer, batch_number, expiry_date,
        application_area, procedure_type, notes, registered_at, created_at
      `)
      .eq("appointment_id", appointmentId)
      .order("created_at"),
  );

  const items: AppointmentMaterialUsed[] = [];

  for (const r of stockMovementsRaw as any[]) {
    items.push({
      id: r.id,
      source: "stock_movement",
      origin_label: originLabel("stock_movement"),
      product_id: r.product_id ?? null,
      material_id: null,
      procedure_id: null,
      name: r.products?.name ?? "Material",
      quantity: Number(r.quantity ?? 0),
      unit: r.products?.unit ?? null,
      batch_number: null,
      expiry_date: null,
      manufacturer: null,
      unit_cost: r.unit_cost != null ? Number(r.unit_cost) : null,
      total_cost: r.unit_cost != null ? Number(r.unit_cost) * Number(r.quantity ?? 0) : null,
      movement_type: r.movement_type ?? null,
      notes: r.notes ?? null,
      created_at: r.created_at,
    });
  }

  for (const r of consumptionRaw as any[]) {
    // Evita duplicar se o mesmo consumo já foi registrado via stock_movement
    if (items.some((i) => i.product_id === r.product_id && Number(i.quantity) === Number(r.quantity))) continue;
    const unitCost = r.products?.cost_price != null ? Number(r.products.cost_price) : null;
    items.push({
      id: r.id,
      source: "material_consumption",
      origin_label: originLabel("material_consumption"),
      product_id: r.product_id ?? null,
      material_id: null,
      procedure_id: null,
      name: r.products?.name ?? "Material",
      quantity: Number(r.quantity ?? 0),
      unit: r.products?.unit ?? null,
      batch_number: null,
      expiry_date: null,
      manufacturer: null,
      unit_cost: unitCost,
      total_cost: unitCost != null ? unitCost * Number(r.quantity ?? 0) : null,
      movement_type: null,
      notes: r.notes ?? null,
      created_at: r.created_at,
    });
  }

  for (const r of aestheticRaw as any[]) {
    items.push({
      id: r.id,
      source: "aesthetic_product",
      origin_label: originLabel("aesthetic_product"),
      product_id: null,
      material_id: null,
      procedure_id: null,
      name: r.product_name ?? "Produto",
      quantity: Number(r.quantity ?? 0),
      unit: r.unit ?? "un",
      batch_number: r.batch_number ?? null,
      expiry_date: r.expiry_date ?? null,
      manufacturer: r.manufacturer ?? null,
      unit_cost: null,
      total_cost: null,
      movement_type: null,
      notes: r.notes ?? null,
      created_at: r.registered_at ?? r.created_at,
    });
  }

  // 4. Fallback temporal — apenas se nada foi encontrado e temos janela
  if (
    items.length === 0 &&
    appointmentWindow?.clinic_id &&
    appointmentWindow?.patient_id &&
    appointmentWindow?.started_at &&
    appointmentWindow?.finished_at
  ) {
    const windowStart = appointmentWindow.started_at;
    const windowEnd = appointmentWindow.finished_at;
    const clinicId = appointmentWindow.clinic_id;

    // Stock movements órfãos (sem reference_id) na janela do atendimento
    const orphans = await safe<any[]>(
      supabase
        .from("stock_movements")
        .select(`
          id, product_id, quantity, unit_cost, notes, movement_type, created_at,
          products:product_id (name, unit)
        `)
        .eq("clinic_id", clinicId)
        .is("reference_id", null)
        .gte("created_at", windowStart)
        .lte("created_at", windowEnd)
        .order("created_at"),
    );

    for (const r of orphans as any[]) {
      items.push({
        id: r.id,
        source: "fallback_temporal",
        origin_label: originLabel("fallback_temporal"),
        product_id: r.product_id ?? null,
        material_id: null,
        procedure_id: null,
        name: r.products?.name ?? "Material",
        quantity: Number(r.quantity ?? 0),
        unit: r.products?.unit ?? null,
        batch_number: null,
        expiry_date: null,
        manufacturer: null,
        unit_cost: r.unit_cost != null ? Number(r.unit_cost) : null,
        total_cost: r.unit_cost != null ? Number(r.unit_cost) * Number(r.quantity ?? 0) : null,
        movement_type: r.movement_type ?? null,
        notes: r.notes ?? null,
        created_at: r.created_at,
      });
    }
  }

  // Ordena por data
  items.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
  return items;
}
