import { useState, useMemo } from "react";
import { useClinicData } from "@/hooks/useClinicData";
import { usePermissions } from "@/hooks/usePermissions";
import { useCustomSpecialties, useCreateSpecialty, useUpdateSpecialty, useToggleSpecialty } from "@/hooks/useEnabledSpecialties";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { SPECIALTY_CAPABILITIES } from "@/hooks/prontuario/specialtyCapabilities";
import type { SpecialtyKey } from "@/hooks/prontuario/useActiveSpecialty";
import { getDefaultAnamnesisStructure } from "@/constants/defaultAnamnesisStructures";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Stethoscope,
  Plus,
  Pencil,
  Loader2,
  AlertCircle,
  Globe,
  Building,
  Search,
  Brain,
  Apple,
  Activity,
  Smile,
  Scissors,
  Baby,
  Heart,
  Check,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";


/** Maps YESCLIN_SPECIALTIES.key → SpecialtyKey in SPECIALTY_CAPABILITIES */
const CAPABILITY_KEY_MAP: Record<string, SpecialtyKey> = {
  "clinica-geral": "geral",
  "psicologia": "psicologia",
  "nutricao": "nutricao",
  "fisioterapia": "fisioterapia",
  "pilates": "pilates",
  "estetica": "estetica",
  "odontologia": "odontologia",
  "dermatologia": "dermatologia",
  "pediatria": "pediatria",
};

// Curated list of Yesclin-supported specialties
const YESCLIN_SPECIALTIES = [
  {
    key: "clinica-geral",
    name: "Clínica Geral",
    description: "Atendimento médico generalista",
    icon: Stethoscope,
    color: "bg-blue-500",
  },
  {
    key: "psicologia",
    name: "Psicologia",
    description: "Saúde mental e terapia",
    icon: Brain,
    color: "bg-purple-500",
  },
  {
    key: "nutricao",
    name: "Nutrição",
    description: "Alimentação e dieta",
    icon: Apple,
    color: "bg-green-500",
  },
  {
    key: "fisioterapia",
    name: "Fisioterapia",
    description: "Reabilitação e movimento",
    icon: Activity,
    color: "bg-orange-500",
  },
  {
    key: "pilates",
    name: "Pilates",
    description: "Exercícios terapêuticos",
    icon: Activity,
    color: "bg-teal-500",
  },
  {
    key: "estetica",
    name: "Estética / Harmonização Facial",
    description: "Procedimentos estéticos",
    icon: Scissors,
    color: "bg-pink-500",
  },
  {
    key: "odontologia",
    name: "Odontologia",
    description: "Saúde bucal com odontograma digital",
    icon: Smile,
    color: "bg-cyan-500",
  },
  {
    key: "dermatologia",
    name: "Dermatologia",
    description: "Cuidados com a pele",
    icon: Heart,
    color: "bg-rose-500",
  },
  {
    key: "pediatria",
    name: "Pediatria",
    description: "Atendimento infantil",
    icon: Baby,
    color: "bg-amber-500",
  },
];

interface ClinicSpecialty {
  id: string;
  name: string;
  description: string | null;
  is_active: boolean;
  specialty_type: 'padrao' | 'personalizada';
}

export function SpecialtiesSection() {
  const { clinic } = useClinicData();
  const { isOwner } = usePermissions();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [searchTerm, setSearchTerm] = useState("");
  const [activeTab, setActiveTab] = useState<'padrao' | 'personalizada'>('padrao');
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [editingSpecialty, setEditingSpecialty] = useState<ClinicSpecialty | null>(null);
  const [confirmDeactivate, setConfirmDeactivate] = useState<ClinicSpecialty | null>(null);
  const [newName, setNewName] = useState("");
  const [newDescription, setNewDescription] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [togglingId, setTogglingId] = useState<string | null>(null);

  // Fetch clinic's enabled standard specialties
  const { data: clinicStandardSpecialties = [], isLoading: loadingStandard } = useQuery({
    queryKey: ["clinic-standard-specialties", clinic?.id],
    queryFn: async () => {
      if (!clinic?.id) return [];
      const { data, error } = await supabase
        .from("specialties")
        .select("id, name, description, is_active, specialty_type")
        .eq("clinic_id", clinic.id)
        .eq("specialty_type", "padrao");
      if (error) throw error;
      return data as ClinicSpecialty[];
    },
    enabled: !!clinic?.id,
  });

  // Fetch clinic's custom specialties
  const { data: customSpecialties = [], isLoading: loadingCustom } = useQuery({
    queryKey: ["clinic-custom-specialties", clinic?.id],
    queryFn: async () => {
      if (!clinic?.id) return [];
      const { data, error } = await supabase
        .from("specialties")
        .select("id, name, description, is_active, specialty_type")
        .eq("clinic_id", clinic.id)
        .eq("specialty_type", "personalizada")
        .order("name");
      if (error) throw error;
      return data as ClinicSpecialty[];
    },
    enabled: !!clinic?.id,
  });

  // Map of enabled standard specialties by name — prioritize active records when duplicates exist
  const enabledStandardMap = useMemo(() => {
    const map: Record<string, ClinicSpecialty> = {};
    clinicStandardSpecialties.forEach((s) => {
      const existing = map[s.name];
      // Keep active record over inactive when duplicates exist
      if (!existing || (s.is_active && !existing.is_active)) {
        map[s.name] = s;
      }
    });
    return map;
  }, [clinicStandardSpecialties]);

  // Filter curated specialties by search
  const filteredYesclinSpecialties = YESCLIN_SPECIALTIES.filter(
    (s) =>
      s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Filter custom specialties by search
  const filteredCustom = customSpecialties.filter((s) =>
    s.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const activeCustom = filteredCustom.filter((s) => s.is_active);
  const inactiveCustom = filteredCustom.filter((s) => !s.is_active);

  /**
   * Provision all default modules for a specialty based on SPECIALTY_CAPABILITIES.
   * Uses the capability key to get the correct module list from the central matrix.
   */
  const provisionSpecialtyModules = async (specialtyId: string, capabilityKey: SpecialtyKey) => {
    if (!clinic?.id) return;
    try {
      const capability = SPECIALTY_CAPABILITIES[capabilityKey];
      if (!capability) {
        console.warn(`No capability found for key: ${capabilityKey}`);
        return;
      }

      const moduleKeys = capability.defaultModules;
      if (moduleKeys.length === 0) return;

      // Fetch all matching module IDs from DB
      const { data: modules } = await supabase
        .from("clinical_modules")
        .select("id, key")
        .in("key", moduleKeys);

      if (modules && modules.length > 0) {
        const moduleInserts = modules.map((m) => ({
          clinic_id: clinic.id,
          specialty_id: specialtyId,
          module_id: m.id,
          is_enabled: true,
        }));

        await supabase
          .from("clinic_specialty_modules")
          .upsert(moduleInserts, { onConflict: "clinic_id,specialty_id,module_id" });
        
        console.log(`[SpecialtiesSection] Provisioned ${modules.length} modules for ${capability.label}: ${modules.map(m => m.key).join(', ')}`);
      }
    } catch (err) {
      console.error("Error provisioning specialty modules:", err);
    }
  };

  /**
   * Auto-create default Prontuário and Anamnese templates for a specialty.
   * Rules:
   * - Creates "Modelo de Prontuário - {Especialidade}" (medical_record_templates)
   * - Creates "Anamnese Padrão - {Especialidade} (YesClin)" (anamnesis_templates)
   * - Both are is_system=true, is_default=true (cannot be permanently deleted)
   * - Skips creation if a default template already exists for that specialty
   * - On deactivation: templates become hidden (is_active=false), never deleted
   */
  const provisionDefaultTemplates = async (specialtyId: string, specialtyName: string, capabilityKey: SpecialtyKey) => {
    if (!clinic?.id) return;
    try {
      const { data: userData } = await supabase.auth.getUser();
      const userId = userData?.user?.id || null;

      // 1. Auto-create Prontuário template (medical_record_templates)
      const { data: existingProntuario } = await supabase
        .from("medical_record_templates")
        .select("id")
        .eq("clinic_id", clinic.id)
        .eq("specialty_id", specialtyId)
        .eq("is_system", true)
        .limit(1);

      if (!existingProntuario || existingProntuario.length === 0) {
        await supabase
          .from("medical_record_templates")
          .insert({
            clinic_id: clinic.id,
            name: `Modelo de Prontuário - ${specialtyName}`,
            type: "evolution",
            scope: "specialty",
            specialty_id: specialtyId,
            description: `Modelo padrão de prontuário para ${specialtyName}`,
            is_default: true,
            is_active: true,
            is_system: true,
          });
        console.log(`[SpecialtiesSection] Created default Prontuário template for ${specialtyName}`);
      } else {
        // Reactivate existing
        await supabase
          .from("medical_record_templates")
          .update({ is_active: true })
          .eq("id", existingProntuario[0].id);
      }

      // 2. Auto-create Anamnese template (anamnesis_templates)
      const { data: existingAnamnese } = await supabase
        .from("anamnesis_templates")
        .select("id")
        .eq("clinic_id", clinic.id)
        .eq("specialty_id", specialtyId)
        .eq("is_system", true)
        .limit(1);

      if (!existingAnamnese || existingAnamnese.length === 0) {
        const capability = SPECIALTY_CAPABILITIES[capabilityKey];
        const slug = capability?.anamnesisSlug || capabilityKey;

        // Get default structure for this specialty (if available)
        const defaultStructure = getDefaultAnamnesisStructure(slug);

        const { data: newTemplate } = await supabase
          .from("anamnesis_templates")
          .insert({
            clinic_id: clinic.id,
            name: slug === 'clinica-geral' || slug === 'geral'
              ? 'Anamnese Padrão – Clínica Geral (YesClin)'
              : `Anamnese Padrão - ${specialtyName} (YesClin)`,
            template_type: "anamnese",
            specialty: slug,
            specialty_id: specialtyId,
            description: slug === 'clinica-geral' || slug === 'geral'
              ? 'Modelo padrão completo com 10 seções clínicas estruturadas. Editável e versionado.'
              : `Modelo padrão de anamnese para ${specialtyName}`,
            campos: defaultStructure as any,
            is_default: true,
            is_active: true,
            is_system: true,
            created_by: userId,
          })
          .select("id")
          .single();

        // Create version 1 with the full structure
        if (newTemplate?.id && defaultStructure.length > 0) {
          const { data: ver } = await supabase
            .from("anamnesis_template_versions")
            .insert({
              template_id: newTemplate.id,
              version_number: 1,
              structure: defaultStructure as any,
              created_by: userId,
            })
            .select("id")
            .single();

          // Link version to template
          if (ver?.id) {
            await supabase
              .from("anamnesis_templates")
              .update({ current_version_id: ver.id } as any)
              .eq("id", newTemplate.id);
          }
        }

        console.log(`[SpecialtiesSection] Created default Anamnese template for ${specialtyName} with ${defaultStructure.length} sections`);
      } else {
        // Reactivate existing
        await supabase
          .from("anamnesis_templates")
          .update({ is_active: true, archived: false })
          .eq("id", existingAnamnese[0].id);
      }
    } catch (err) {
      console.error("Error provisioning default templates:", err);
    }
  };

  /**
   * Activate anamnesis templates matching the specialty when it's enabled.
   * Matches by slug OR specialty_id, and links the template to the specialty.
   */
  const activateSpecialtyTemplates = async (specialtyId: string, capabilityKey: SpecialtyKey) => {
    if (!clinic?.id) return;
    try {
      const capability = SPECIALTY_CAPABILITIES[capabilityKey];
      if (!capability) return;

      const slugVariants = [
        capabilityKey,
        capability.anamnesisSlug,
        capability.anamnesisSlug.replace(/-/g, '_'),
      ];
      const uniqueSlugs = [...new Set(slugVariants)];

      // Match templates by slug (for this clinic) OR by specialty_id
      const { data: templates } = await supabase
        .from("anamnesis_templates")
        .select("id, name, specialty, is_active, specialty_id")
        .eq("clinic_id", clinic.id)
        .in("specialty", uniqueSlugs);

      if (templates && templates.length > 0) {
        for (const tpl of templates) {
          await supabase
            .from("anamnesis_templates")
            .update({ is_active: true, specialty_id: specialtyId, archived: false })
            .eq("id", tpl.id);
        }
        console.log(`[SpecialtiesSection] Activated ${templates.length} template(s) for ${capability.label}`);
      }

      // Also reactivate medical_record_templates for this specialty
      await supabase
        .from("medical_record_templates")
        .update({ is_active: true })
        .eq("clinic_id", clinic.id)
        .eq("specialty_id", specialtyId);

    } catch (err) {
      console.error("Error activating specialty templates:", err);
    }
  };

  /**
   * Deactivate anamnesis templates when a specialty is disabled.
   * Matches by specialty_id AND by slug to catch unlinked templates.
   */
  const deactivateSpecialtyTemplates = async (specialtyId: string, capabilityKey?: SpecialtyKey) => {
    if (!clinic?.id) return;
    try {
      // Deactivate anamnesis_templates by specialty_id
      await supabase
        .from("anamnesis_templates")
        .update({ is_active: false })
        .eq("clinic_id", clinic.id)
        .eq("specialty_id", specialtyId);

      // Also deactivate by slug match (for templates not yet linked)
      if (capabilityKey) {
        const capability = SPECIALTY_CAPABILITIES[capabilityKey];
        if (capability) {
          const slugVariants = [
            capabilityKey,
            capability.anamnesisSlug,
            capability.anamnesisSlug.replace(/-/g, '_'),
          ];
          const uniqueSlugs = [...new Set(slugVariants)];
          await supabase
            .from("anamnesis_templates")
            .update({ is_active: false })
            .eq("clinic_id", clinic.id)
            .in("specialty", uniqueSlugs);
        }
      }

      // Deactivate medical_record_templates (never delete)
      await supabase
        .from("medical_record_templates")
        .update({ is_active: false })
        .eq("clinic_id", clinic.id)
        .eq("specialty_id", specialtyId);

    } catch (err) {
      console.error("Error deactivating specialty templates:", err);
    }
  };

  /** Invalidate all specialty-related caches for full sync */
  const invalidateAllSpecialtyCaches = () => {
    if (!clinic?.id) return;
    queryClient.invalidateQueries({ queryKey: ["clinic-standard-specialties", clinic.id] });
    queryClient.invalidateQueries({ queryKey: ["clinic-custom-specialties", clinic.id] });
    queryClient.invalidateQueries({ queryKey: ["enabled-specialties", clinic.id] });
    queryClient.invalidateQueries({ queryKey: ["specialties", clinic.id] });
    queryClient.invalidateQueries({ queryKey: ["all-specialties", clinic.id] });
    queryClient.invalidateQueries({ queryKey: ["custom-specialties", clinic.id] });
    queryClient.invalidateQueries({ queryKey: ["specialties-management", clinic.id] });
    queryClient.invalidateQueries({ queryKey: ["standard-specialties"] });
    queryClient.invalidateQueries({ queryKey: ["anamnesis-templates"] });
    queryClient.invalidateQueries({ queryKey: ["anamnesis_templates"] });
  };

  const handleToggleStandard = async (yesclinSpecialty: typeof YESCLIN_SPECIALTIES[0]) => {
    if (!clinic?.id || !isOwner) return;

    const existing = enabledStandardMap[yesclinSpecialty.name];
    const capabilityKey = CAPABILITY_KEY_MAP[yesclinSpecialty.key] || 'geral';
    setTogglingId(yesclinSpecialty.key);

    try {
      if (existing) {
        // Toggle existing
        const newActiveState = !existing.is_active;
        if (!newActiveState) {
          // Show confirmation for deactivation
          setConfirmDeactivate(existing);
          setTogglingId(null);
          return;
        }
        await supabase
          .from("specialties")
          .update({ is_active: true })
          .eq("id", existing.id);
        
        // Re-provision modules, templates and default models on reactivation
        await provisionSpecialtyModules(existing.id, capabilityKey);
        await provisionDefaultTemplates(existing.id, yesclinSpecialty.name, capabilityKey);
        await activateSpecialtyTemplates(existing.id, capabilityKey);
      } else {
        // Create new clinic-specific specialty
        const { data: created, error } = await supabase
          .from("specialties")
          .insert({
            name: yesclinSpecialty.name,
            description: yesclinSpecialty.description,
            area: "Padrão",
            clinic_id: clinic.id,
            specialty_type: "padrao",
            is_active: true,
          })
          .select("id")
          .single();

        if (error) throw error;
        if (created) {
          await provisionSpecialtyModules(created.id, capabilityKey);
          await provisionDefaultTemplates(created.id, yesclinSpecialty.name, capabilityKey);
          await activateSpecialtyTemplates(created.id, capabilityKey);
        }
      }

      toast({
        title: existing ? "Especialidade reativada!" : "Especialidade habilitada!",
        description: `"${yesclinSpecialty.name}" está disponível para uso na agenda, prontuário e procedimentos.`,
      });

      invalidateAllSpecialtyCaches();
    } catch (err) {
      console.error("Error toggling specialty:", err);
      toast({
        title: "Erro",
        description: "Não foi possível alterar a especialidade.",
        variant: "destructive",
      });
    } finally {
      setTogglingId(null);
    }
  };

  const handleDeactivateConfirm = async () => {
    if (!confirmDeactivate || !clinic?.id) return;

    setTogglingId(confirmDeactivate.id);
    try {
      await supabase
        .from("specialties")
        .update({ is_active: false })
        .eq("id", confirmDeactivate.id);

      // Deactivate associated templates (resolve capability key from name)
      const yesclinMatch = YESCLIN_SPECIALTIES.find(ys => ys.name === confirmDeactivate.name);
      const capKey = yesclinMatch ? (CAPABILITY_KEY_MAP[yesclinMatch.key] || 'geral') : undefined;
      await deactivateSpecialtyTemplates(confirmDeactivate.id, capKey);

      toast({
        title: "Especialidade desabilitada",
        description: `"${confirmDeactivate.name}" e seus modelos de prontuário foram desativados.`,
      });

      invalidateAllSpecialtyCaches();
    } catch (err) {
      console.error("Error deactivating:", err);
      toast({
        title: "Erro",
        description: "Não foi possível desabilitar.",
        variant: "destructive",
      });
    } finally {
      setTogglingId(null);
      setConfirmDeactivate(null);
    }
  };

  const handleCreateCustom = async () => {
    if (!clinic?.id || !newName.trim()) return;

    // Check duplicates
    const isDuplicate =
      YESCLIN_SPECIALTIES.some((s) => s.name.toLowerCase() === newName.trim().toLowerCase()) ||
      customSpecialties.some((s) => s.name.toLowerCase() === newName.trim().toLowerCase());

    if (isDuplicate) {
      toast({
        title: "Nome já existe",
        description: "Escolha um nome diferente para a especialidade.",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);
    try {
      const { data: created, error } = await supabase
        .from("specialties")
        .insert({
          name: newName.trim(),
          description: newDescription.trim() || null,
          area: "Personalizada",
          clinic_id: clinic.id,
          specialty_type: "personalizada",
          is_active: true,
        })
        .select("id")
        .single();

      if (error) throw error;

      if (created) {
        await provisionSpecialtyModules(created.id, 'custom');
        await provisionDefaultTemplates(created.id, newName.trim(), 'custom');
      }

      toast({
        title: "Especialidade criada!",
        description: `"${newName}" está disponível para uso.`,
      });

      setNewName("");
      setNewDescription("");
      setIsCreateDialogOpen(false);
      invalidateAllSpecialtyCaches();
    } catch (err) {
      console.error("Error creating custom specialty:", err);
      toast({
        title: "Erro ao criar",
        description: "Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEditCustom = async () => {
    if (!editingSpecialty || !clinic?.id || !newName.trim()) return;

    setIsSubmitting(true);
    try {
      await supabase
        .from("specialties")
        .update({
          name: newName.trim(),
          description: newDescription.trim() || null,
        })
        .eq("id", editingSpecialty.id);

      toast({
        title: "Especialidade atualizada!",
      });

      setEditingSpecialty(null);
      setNewName("");
      setNewDescription("");
      queryClient.invalidateQueries({ queryKey: ["clinic-custom-specialties", clinic.id] });
      queryClient.invalidateQueries({ queryKey: ["specialties", clinic.id] });
    } catch (err) {
      console.error("Error updating specialty:", err);
      toast({
        title: "Erro ao atualizar",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggleCustom = (specialty: ClinicSpecialty) => {
    if (specialty.is_active) {
      setConfirmDeactivate(specialty);
    } else {
      handleReactivateCustom(specialty);
    }
  };

  const handleReactivateCustom = async (specialty: ClinicSpecialty) => {
    if (!clinic?.id) return;
    setTogglingId(specialty.id);
    try {
      await supabase
        .from("specialties")
        .update({ is_active: true })
        .eq("id", specialty.id);

      toast({ title: "Especialidade reativada!" });
      queryClient.invalidateQueries({ queryKey: ["clinic-custom-specialties", clinic.id] });
      queryClient.invalidateQueries({ queryKey: ["specialties", clinic.id] });
    } catch (err) {
      toast({ title: "Erro", variant: "destructive" });
    } finally {
      setTogglingId(null);
    }
  };

  const openEditDialog = (specialty: ClinicSpecialty) => {
    setEditingSpecialty(specialty);
    setNewName(specialty.name);
    setNewDescription(specialty.description || "");
  };

  const closeDialog = () => {
    setIsCreateDialogOpen(false);
    setEditingSpecialty(null);
    setNewName("");
    setNewDescription("");
  };

  const isLoading = loadingStandard || loadingCustom;
  
  // Count using deduplicated map — avoids counting duplicate DB records
  const enabledCount = YESCLIN_SPECIALTIES.filter((ys) => {
    const existing = enabledStandardMap[ys.name];
    return existing?.is_active ?? false;
  }).length;


  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <Stethoscope className="h-5 w-5 text-primary" />
            </div>
            <div>
              <CardTitle>Especialidades da Clínica</CardTitle>
              <CardDescription>
                Habilite as especialidades padrão do Yesclin ou crie especialidades personalizadas.
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <div className="space-y-4">
              {/* Search */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar especialidades..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9"
                />
              </div>

              <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'padrao' | 'personalizada')}>
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="padrao" className="gap-2">
                    <Globe className="h-4 w-4" />
                    Padrão do Yesclin
                  </TabsTrigger>
                  <TabsTrigger value="personalizada" className="gap-2">
                    <Building className="h-4 w-4" />
                    Personalizadas ({customSpecialties.length})
                  </TabsTrigger>
                </TabsList>

                {/* Standard Yesclin Specialties */}
                <TabsContent value="padrao" className="mt-4">
                  <div className="rounded-lg border bg-muted/30 p-3 mb-4">
                    <p className="text-sm text-muted-foreground">
                      Estas são as especialidades oficialmente suportadas pelo Yesclin. 
                      Ative as que sua clínica oferece para liberar modelos de prontuário, procedimentos e fluxos de atendimento.
                    </p>
                  </div>

                  {enabledCount > 0 && (
                    <div className="flex items-center gap-2 p-3 rounded-lg bg-primary/5 border border-primary/20 mb-4">
                      <Check className="h-4 w-4 text-primary" />
                      <span className="text-sm font-medium">
                        {enabledCount} especialidade(s) habilitada(s)
                      </span>
                    </div>
                  )}

                  <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                    {filteredYesclinSpecialties.map((specialty) => {
                      const existing = enabledStandardMap[specialty.name];
                      const isEnabled = existing?.is_active ?? false;
                      const Icon = specialty.icon;
                      const isToggling = togglingId === specialty.key || togglingId === existing?.id;

                      return (
                        <div
                          key={specialty.key}
                          className={`relative flex items-start gap-3 p-4 rounded-xl border transition-all ${
                            isEnabled
                              ? "bg-primary/5 border-primary/30"
                              : "bg-card hover:bg-muted/50"
                          }`}
                        >
                          <div
                            className={`w-9 h-9 rounded-lg ${specialty.color} flex items-center justify-center shrink-0`}
                          >
                            <Icon className="h-5 w-5 text-white" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <span className="font-medium text-sm block">{specialty.name}</span>
                            <p className="text-xs text-muted-foreground mt-0.5">
                              {specialty.description}
                            </p>
                          </div>
                          {isOwner && (
                            <Switch
                              checked={isEnabled}
                              onCheckedChange={() => handleToggleStandard(specialty)}
                              disabled={isToggling}
                              className="shrink-0"
                            />
                          )}
                          {isEnabled && (
                            <Badge
                              variant="outline"
                              className="absolute top-2 right-12 text-[10px] bg-primary/10 text-primary border-primary/30"
                            >
                              Ativa
                            </Badge>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </TabsContent>

                {/* Custom Specialties */}
                <TabsContent value="personalizada" className="mt-4">
                  <div className="flex items-center justify-between mb-4">
                    <div className="rounded-lg border bg-muted/30 p-3 flex-1 mr-4">
                      <p className="text-sm text-muted-foreground">
                        Especialidades exclusivas desta clínica. Recebem automaticamente um modelo básico de prontuário.
                      </p>
                    </div>
                    {isOwner && (
                      <Button onClick={() => setIsCreateDialogOpen(true)}>
                        <Plus className="h-4 w-4 mr-2" />
                        Nova
                      </Button>
                    )}
                  </div>

                  {customSpecialties.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-8 text-center">
                      <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center mb-3">
                        <Building className="h-6 w-6 text-muted-foreground" />
                      </div>
                      <h3 className="font-medium text-foreground mb-1">
                        Nenhuma especialidade personalizada
                      </h3>
                      <p className="text-sm text-muted-foreground max-w-sm">
                        Crie especialidades exclusivas quando as padrão do Yesclin não atenderem.
                      </p>
                      {isOwner && (
                        <Button onClick={() => setIsCreateDialogOpen(true)} className="mt-4">
                          <Plus className="h-4 w-4 mr-2" />
                          Criar especialidade
                        </Button>
                      )}
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {/* Active */}
                      {activeCustom.length > 0 && (
                        <div className="space-y-2">
                          <h4 className="text-sm font-medium text-primary">
                            Habilitadas ({activeCustom.length})
                          </h4>
                          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                            {activeCustom.map((specialty) => (
                              <div
                                key={specialty.id}
                                className="flex items-center justify-between p-3 rounded-lg border bg-card hover:bg-muted/50 transition-colors"
                              >
                                <div className="flex-1 min-w-0">
                                  <span className="font-medium truncate block">{specialty.name}</span>
                                  {specialty.description && (
                                    <span className="text-xs text-muted-foreground truncate block">
                                      {specialty.description}
                                    </span>
                                  )}
                                </div>
                                {isOwner && (
                                  <div className="flex items-center gap-1 ml-2">
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      className="h-8 w-8"
                                      onClick={() => openEditDialog(specialty)}
                                    >
                                      <Pencil className="h-4 w-4" />
                                    </Button>
                                    <Switch
                                      checked={specialty.is_active}
                                      onCheckedChange={() => handleToggleCustom(specialty)}
                                      disabled={togglingId === specialty.id}
                                    />
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Inactive */}
                      {inactiveCustom.length > 0 && (
                        <div className="space-y-2">
                          <h4 className="text-sm font-medium text-muted-foreground">
                            Desabilitadas ({inactiveCustom.length})
                          </h4>
                          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                            {inactiveCustom.map((specialty) => (
                              <div
                                key={specialty.id}
                                className="flex items-center justify-between p-3 rounded-lg border border-dashed bg-muted/30 opacity-70"
                              >
                                <div className="flex-1 min-w-0">
                                  <span className="font-medium truncate text-muted-foreground block">
                                    {specialty.name}
                                  </span>
                                </div>
                                {isOwner && (
                                  <div className="flex items-center gap-1 ml-2">
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      className="h-8 w-8"
                                      onClick={() => openEditDialog(specialty)}
                                    >
                                      <Pencil className="h-4 w-4" />
                                    </Button>
                                    <Switch
                                      checked={specialty.is_active}
                                      onCheckedChange={() => handleToggleCustom(specialty)}
                                      disabled={togglingId === specialty.id}
                                    />
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </TabsContent>
              </Tabs>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Create/Edit Dialog */}
      <Dialog open={isCreateDialogOpen || !!editingSpecialty} onOpenChange={closeDialog}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {editingSpecialty ? (
                <>
                  <Pencil className="h-5 w-5 text-primary" />
                  Editar Especialidade
                </>
              ) : (
                <>
                  <Plus className="h-5 w-5 text-primary" />
                  Nova Especialidade Personalizada
                </>
              )}
            </DialogTitle>
            <DialogDescription>
              {editingSpecialty
                ? "Atualize o nome ou descrição da especialidade."
                : "Crie uma especialidade exclusiva para sua clínica."}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="name">
                Nome <span className="text-destructive">*</span>
              </Label>
              <Input
                id="name"
                placeholder="Ex: Acupuntura, Quiropraxia..."
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                autoFocus
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Descrição (opcional)</Label>
              <Input
                id="description"
                placeholder="Breve descrição da especialidade"
                value={newDescription}
                onChange={(e) => setNewDescription(e.target.value)}
              />
            </div>

            {!editingSpecialty && (
              <div className="p-3 rounded-lg bg-muted/50 border">
                <p className="text-sm text-muted-foreground">
                  💡 A especialidade será criada com <strong>modelo básico de prontuário</strong> 
                  (anamnese, evolução) e <strong>fluxo básico de atendimento</strong>.
                </p>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={closeDialog} disabled={isSubmitting}>
              Cancelar
            </Button>
            <Button
              onClick={editingSpecialty ? handleEditCustom : handleCreateCustom}
              disabled={isSubmitting || !newName.trim()}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Salvando...
                </>
              ) : editingSpecialty ? (
                "Salvar"
              ) : (
                <>
                  <Plus className="mr-2 h-4 w-4" />
                  Criar
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Deactivation confirmation */}
      <AlertDialog open={!!confirmDeactivate} onOpenChange={(open) => !open && setConfirmDeactivate(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-amber-500" />
              Desabilitar especialidade?
            </AlertDialogTitle>
            <AlertDialogDescription className="space-y-2">
              <p>
                A especialidade <strong>"{confirmDeactivate?.name}"</strong> será desabilitada.
              </p>
              <ul className="text-sm list-disc list-inside space-y-1 mt-2">
                <li>Novos profissionais não poderão ser vinculados</li>
                <li>Novos procedimentos não poderão usar</li>
                <li>Novos agendamentos não poderão selecionar</li>
                <li>Registros existentes serão mantidos</li>
              </ul>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeactivateConfirm}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Desabilitar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
