import { supabase } from "@/integrations/supabase/client";

/**
 * Standard specialty catalog with slugs and metadata
 * These are the officially supported Yesclin specialties
 */
export const STANDARD_SPECIALTY_CATALOG: Record<string, { name: string; description: string }> = {
  "clinica-geral": { name: "Clínica Geral", description: "Atendimento médico generalista" },
  "psicologia": { name: "Psicologia", description: "Saúde mental e terapia" },
  "nutricao": { name: "Nutrição", description: "Alimentação e dieta" },
  "fisioterapia": { name: "Fisioterapia", description: "Reabilitação e movimento" },
  "fisioterapia-pilates": { name: "Pilates", description: "Exercícios terapêuticos" },
  "fonoaudiologia": { name: "Fonoaudiologia", description: "Tratamento da fala e audição" },
  "estetica-harmonizacao-facial": { name: "Estética / Harmonização Facial", description: "Procedimentos estéticos" },
  "odontologia": { name: "Odontologia", description: "Saúde bucal com odontograma digital" },
  "dermatologia": { name: "Dermatologia", description: "Cuidados com a pele" },
  "pediatria": { name: "Pediatria", description: "Atendimento infantil" },
};

// Legacy slug mapping for backwards compatibility
const LEGACY_SLUG_MAP: Record<string, string> = {
  "pilates": "fisioterapia-pilates",
  "estetica": "estetica-harmonizacao-facial",
};

/**
 * Normalize a slug to handle legacy mappings
 */
export function normalizeSlug(slug: string): string {
  return LEGACY_SLUG_MAP[slug] || slug;
}

/**
 * Check if a slug is a standard (curated) specialty
 */
export function isStandardSpecialtySlug(slug: string): boolean {
  const normalized = normalizeSlug(slug);
  return normalized in STANDARD_SPECIALTY_CATALOG;
}

/**
 * Generate a slug for a custom specialty name
 */
export function generateCustomSlug(name: string): string {
  const normalized = name
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // Remove accents
    .replace(/[^a-z0-9]+/g, "-") // Replace non-alphanumeric with hyphens
    .replace(/^-+|-+$/g, ""); // Trim hyphens
  
  return `personalizada:${normalized}`;
}

/**
 * Parse a custom slug to extract the specialty name
 */
export function parseCustomSlug(slug: string): string | null {
  if (!slug.startsWith("personalizada:")) return null;
  return slug.replace("personalizada:", "").replace(/-/g, " ");
}

/**
 * Resolve a specialty by slug, creating it if necessary (idempotent upsert)
 * Returns the specialty ID or throws an error
 */
export async function resolveSpecialtyBySlug(
  clinicId: string,
  slug: string,
  customName?: string
): Promise<{ id: string; name: string; isNew: boolean }> {
  const normalizedSlug = normalizeSlug(slug);
  
  // CASE 1: Standard specialty
  if (isStandardSpecialtySlug(normalizedSlug)) {
    const catalogEntry = STANDARD_SPECIALTY_CATALOG[normalizedSlug];
    if (!catalogEntry) {
      throw new Error(`Especialidade padrão não encontrada: ${slug}`);
    }
    
    // Try to find existing specialty for this clinic by name
    const { data: existing, error: findErr } = await supabase
      .from("specialties")
      .select("id, name")
      .eq("clinic_id", clinicId)
      .eq("name", catalogEntry.name)
      .maybeSingle();
    
    if (findErr) {
      console.error("Error finding standard specialty:", findErr);
      throw new Error("Não foi possível concluir a configuração. Tente novamente.");
    }
    
    if (existing) {
      // Activate and return existing
      await supabase
        .from("specialties")
        .update({ is_active: true })
        .eq("id", existing.id);
      
      return { id: existing.id, name: existing.name, isNew: false };
    }
    
    // Create new standard specialty for this clinic
    const { data: created, error: createErr } = await supabase
      .from("specialties")
      .insert({
        name: catalogEntry.name,
        description: catalogEntry.description,
        area: "Padrão",
        clinic_id: clinicId,
        specialty_type: "padrao",
        is_active: true,
      })
      .select("id, name")
      .single();
    
    if (createErr) {
      // Check if it's a duplicate error (race condition)
      if (createErr.code === "23505") {
        // Retry find
        const { data: retryFind } = await supabase
          .from("specialties")
          .select("id, name")
          .eq("clinic_id", clinicId)
          .eq("name", catalogEntry.name)
          .single();
        
        if (retryFind) {
          return { id: retryFind.id, name: retryFind.name, isNew: false };
        }
      }
      console.error("Error creating standard specialty:", createErr);
      throw new Error("Não foi possível concluir a configuração. Tente novamente.");
    }
    
    return { id: created.id, name: created.name, isNew: true };
  }
  
  // CASE 2: Custom specialty
  if (slug.startsWith("personalizada:") || customName) {
    const specialtyName = customName || parseCustomSlug(slug) || slug;
    
    // Try to find existing custom specialty
    const { data: existing, error: findErr } = await supabase
      .from("specialties")
      .select("id, name")
      .eq("clinic_id", clinicId)
      .eq("name", specialtyName)
      .maybeSingle();
    
    if (findErr) {
      console.error("Error finding custom specialty:", findErr);
      throw new Error("Não foi possível concluir a configuração. Tente novamente.");
    }
    
    if (existing) {
      // Activate and return existing
      await supabase
        .from("specialties")
        .update({ is_active: true })
        .eq("id", existing.id);
      
      return { id: existing.id, name: existing.name, isNew: false };
    }
    
    // Create new custom specialty
    const { data: created, error: createErr } = await supabase
      .from("specialties")
      .insert({
        name: specialtyName,
        description: null,
        area: "Personalizada",
        clinic_id: clinicId,
        specialty_type: "personalizada",
        is_active: true,
      })
      .select("id, name")
      .single();
    
    if (createErr) {
      if (createErr.code === "23505") {
        // Retry find for race condition
        const { data: retryFind } = await supabase
          .from("specialties")
          .select("id, name")
          .eq("clinic_id", clinicId)
          .eq("name", specialtyName)
          .single();
        
        if (retryFind) {
          return { id: retryFind.id, name: retryFind.name, isNew: false };
        }
      }
      console.error("Error creating custom specialty:", createErr);
      throw new Error("Não foi possível concluir a configuração. Tente novamente.");
    }
    
    return { id: created.id, name: created.name, isNew: true };
  }
  
  // CASE 3: Direct UUID reference (specialty already exists)
  // This handles cases where primary_specialty_id is already set
  const { data: existingById, error: findByIdErr } = await supabase
    .from("specialties")
    .select("id, name")
    .eq("id", slug)
    .single();
  
  if (findByIdErr || !existingById) {
    console.error("Error finding specialty by ID:", findByIdErr);
    throw new Error("Não foi possível concluir a configuração. Tente novamente.");
  }
  
  // Activate it
  await supabase
    .from("specialties")
    .update({ is_active: true })
    .eq("id", existingById.id);
  
  return { id: existingById.id, name: existingById.name, isNew: false };
}

/**
 * Enable core clinical modules for a specialty
 */
export async function enableCoreModulesForSpecialty(
  clinicId: string, 
  specialtyId: string
): Promise<void> {
  try {
    const { data: coreModules } = await supabase
      .from("clinical_modules")
      .select("id")
      .in("key", ["evolucao", "anamnese", "alertas", "files"]);

    if (coreModules && coreModules.length > 0) {
      const moduleInserts = coreModules.map((m) => ({
        clinic_id: clinicId,
        specialty_id: specialtyId,
        module_id: m.id,
        is_enabled: true,
      }));

      await supabase
        .from("clinic_specialty_modules")
        .upsert(moduleInserts, { onConflict: "clinic_id,specialty_id,module_id" });
    }
  } catch (err) {
    console.error("Error enabling core modules:", err);
    // Non-fatal - continue
  }
}
