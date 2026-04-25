import { useState, useMemo } from "react";
import { useClinicData } from "@/hooks/useClinicData";
import { usePermissions } from "@/hooks/usePermissions";
import { usePlanLimitGate } from "@/hooks/usePlanLimitGate";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { OFFICIAL_SPECIALTIES } from "@/constants/officialSpecialties";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import {
  Stethoscope, Plus, Pencil, Loader2, AlertCircle, Globe, Building,
  Search, Brain, Apple, Activity, Smile, Scissors, Baby, Heart, Check,
  Sparkles,
} from "lucide-react";
import { toast } from "sonner";

// Icon map for official specialties
const SPECIALTY_ICONS: Record<string, React.ElementType> = {
  geral: Stethoscope,
  psicologia: Brain,
  nutricao: Apple,
  fisioterapia: Activity,
  pilates: Activity,
  estetica: Scissors,
  odontologia: Smile,
  dermatologia: Heart,
  pediatria: Baby,
};

const SPECIALTY_COLORS: Record<string, string> = {
  geral: "bg-blue-500",
  psicologia: "bg-purple-500",
  nutricao: "bg-green-500",
  fisioterapia: "bg-orange-500",
  pilates: "bg-teal-500",
  estetica: "bg-pink-500",
  odontologia: "bg-cyan-500",
  dermatologia: "bg-rose-500",
  pediatria: "bg-amber-500",
};

const SPECIALTY_DESCRIPTIONS: Record<string, string> = {
  geral: "Atendimento médico generalista",
  psicologia: "Saúde mental e terapia",
  nutricao: "Alimentação e dieta",
  fisioterapia: "Reabilitação e movimento",
  pilates: "Exercícios terapêuticos",
  estetica: "Procedimentos estéticos",
  odontologia: "Saúde bucal com odontograma digital",
  dermatologia: "Cuidados com a pele",
  pediatria: "Atendimento infantil",
};

interface ClinicSpecialty {
  id: string;
  name: string;
  slug: string | null;
  description: string | null;
  is_active: boolean;
  specialty_type: string | null;
}

export function SpecialtiesSection() {
  const { clinic } = useClinicData();
  const { isOwner } = usePermissions();
  const { ensureCanCreate } = usePlanLimitGate();
  const queryClient = useQueryClient();

  const [searchTerm, setSearchTerm] = useState("");
  const [activeTab, setActiveTab] = useState<"padrao" | "personalizada">("padrao");
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [editingSpecialty, setEditingSpecialty] = useState<ClinicSpecialty | null>(null);
  const [confirmDeactivate, setConfirmDeactivate] = useState<ClinicSpecialty | null>(null);
  const [newName, setNewName] = useState("");
  const [newDescription, setNewDescription] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [togglingSlug, setTogglingSlug] = useState<string | null>(null);
  const [provisionResult, setProvisionResult] = useState<Record<string, unknown> | null>(null);

  // Fetch clinic specialties
  const { data: clinicSpecialties = [], isLoading } = useQuery({
    queryKey: ["clinic-specialties", clinic?.id],
    queryFn: async () => {
      if (!clinic?.id) return [];
      const { data, error } = await supabase
        .from("specialties")
        .select("id, name, slug, description, is_active, specialty_type")
        .eq("clinic_id", clinic.id)
        .order("name");
      if (error) throw error;
      return data as ClinicSpecialty[];
    },
    enabled: !!clinic?.id,
  });

  // Separate standard vs custom
  const standardSpecialties = clinicSpecialties.filter(s => s.specialty_type === "padrao");
  const customSpecialties = clinicSpecialties.filter(s => s.specialty_type === "personalizada");

  // Map by slug for quick lookup
  const enabledBySlug = useMemo(() => {
    const map: Record<string, ClinicSpecialty> = {};
    standardSpecialties.forEach(s => {
      if (s.slug) {
        const existing = map[s.slug];
        if (!existing || (s.is_active && !existing.is_active)) {
          map[s.slug] = s;
        }
      }
    });
    return map;
  }, [standardSpecialties]);

  // Filter by search
  const filteredOfficial = OFFICIAL_SPECIALTIES.filter(s =>
    s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    SPECIALTY_DESCRIPTIONS[s.slug]?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredCustom = customSpecialties.filter(s =>
    s.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const enabledCount = OFFICIAL_SPECIALTIES.filter(s => enabledBySlug[s.slug]?.is_active).length;

  /** Activate a standard specialty using the provision_specialty RPC */
  const handleActivateStandard = async (slug: string, name: string) => {
    if (!clinic?.id || !isOwner) return;

    // Bloqueio por limite do plano antes de provisionar
    const allowed = await ensureCanCreate('specialties');
    if (!allowed) return;

    setTogglingSlug(slug);

    try {
      // Ensure the specialty row exists before calling provision RPC
      const { data: existing } = await supabase
        .from("specialties")
        .select("id")
        .eq("clinic_id", clinic.id)
        .eq("slug", slug)
        .maybeSingle();

      if (!existing) {
        // Create the specialty row if it doesn't exist yet
        const { error: insertErr } = await supabase
          .from("specialties")
          .insert({
            name,
            slug,
            description: SPECIALTY_DESCRIPTIONS[slug] || null,
            clinic_id: clinic.id,
            specialty_type: "padrao",
            is_active: false, // Will be activated by provision_specialty
          });
        if (insertErr && insertErr.code !== "23505") throw insertErr;
      }

      // Provision tabs, templates, and activate the specialty
      const { data, error } = await supabase.rpc("provision_specialty", {
        _clinic_id: clinic.id,
        _specialty_slug: slug,
      });

      if (error) throw error;

      // Auto-link all active professionals to the newly activated specialty
      const specialtyRecord = await supabase
        .from("specialties")
        .select("id")
        .eq("clinic_id", clinic.id)
        .eq("slug", slug)
        .maybeSingle();

      if (specialtyRecord.data?.id) {
        const { data: professionals } = await supabase
          .from("professionals")
          .select("id")
          .eq("clinic_id", clinic.id)
          .eq("is_active", true);

        if (professionals && professionals.length > 0) {
          const links = professionals.map(p => ({
            professional_id: p.id,
            specialty_id: specialtyRecord.data!.id,
            is_primary: false,
          }));

          await supabase
            .from("professional_specialties")
            .upsert(links, { onConflict: "professional_id,specialty_id", ignoreDuplicates: true });
        }
      }

      setProvisionResult(data as Record<string, unknown>);
      toast.success(`"${name}" ativada com sucesso!`, {
        description: `Abas de prontuário, templates e vínculos profissionais provisionados automaticamente.`,
      });

      invalidateAll();
    } catch (err: any) {
      console.error("Error activating specialty:", err);
      toast.error("Erro ao ativar especialidade", { description: err.message });
    } finally {
      setTogglingSlug(null);
    }
  };

  /** Deactivate a specialty (soft: is_active = false) */
  const handleDeactivateConfirm = async () => {
    if (!confirmDeactivate || !clinic?.id) return;
    setTogglingSlug(confirmDeactivate.slug || confirmDeactivate.id);

    try {
      await supabase
        .from("specialties")
        .update({ is_active: false })
        .eq("id", confirmDeactivate.id);

      // Deactivate associated medical_record_tabs
      await supabase
        .from("medical_record_tabs")
        .update({ is_active: false })
        .eq("clinic_id", clinic.id)
        .eq("specialty_id", confirmDeactivate.id);

      // Deactivate associated anamnesis_templates
      await supabase
        .from("anamnesis_templates")
        .update({ is_active: false })
        .eq("clinic_id", clinic.id)
        .eq("specialty_id", confirmDeactivate.id);

      toast.success(`"${confirmDeactivate.name}" desativada`, {
        description: "Registros existentes foram mantidos.",
      });

      invalidateAll();
    } catch (err: any) {
      console.error("Error deactivating:", err);
      toast.error("Erro ao desativar", { description: err.message });
    } finally {
      setTogglingSlug(null);
      setConfirmDeactivate(null);
    }
  };

  /** Toggle handler for standard specialties */
  const handleToggleStandard = (slug: string, name: string) => {
    const existing = enabledBySlug[slug];
    if (existing?.is_active) {
      setConfirmDeactivate(existing);
    } else {
      handleActivateStandard(slug, name);
    }
  };

  /** Create custom specialty */
  const handleCreateCustom = async () => {
    if (!clinic?.id || !newName.trim()) return;

    const isDuplicate =
      OFFICIAL_SPECIALTIES.some(s => s.name.toLowerCase() === newName.trim().toLowerCase()) ||
      customSpecialties.some(s => s.name.toLowerCase() === newName.trim().toLowerCase());

    if (isDuplicate) {
      toast.error("Nome já existe");
      return;
    }

    setIsSubmitting(true);
    try {
      const slug = newName.trim().toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");

      const { error } = await supabase.from("specialties").insert({
        name: newName.trim(),
        slug,
        description: newDescription.trim() || null,
        clinic_id: clinic.id,
        specialty_type: "personalizada",
        is_active: true,
      });

      if (error) throw error;

      toast.success(`"${newName}" criada com sucesso!`);
      setNewName("");
      setNewDescription("");
      setIsCreateDialogOpen(false);
      invalidateAll();
    } catch (err: any) {
      console.error("Error creating custom specialty:", err);
      toast.error("Erro ao criar", { description: err.message });
    } finally {
      setIsSubmitting(false);
    }
  };

  /** Edit custom specialty */
  const handleEditCustom = async () => {
    if (!editingSpecialty || !clinic?.id || !newName.trim()) return;
    setIsSubmitting(true);
    try {
      await supabase
        .from("specialties")
        .update({ name: newName.trim(), description: newDescription.trim() || null })
        .eq("id", editingSpecialty.id);

      toast.success("Especialidade atualizada!");
      setEditingSpecialty(null);
      setNewName("");
      setNewDescription("");
      invalidateAll();
    } catch (err: any) {
      toast.error("Erro ao atualizar", { description: err.message });
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
    setTogglingSlug(specialty.id);
    try {
      await supabase.from("specialties").update({ is_active: true }).eq("id", specialty.id);
      toast.success("Especialidade reativada!");
      invalidateAll();
    } catch {
      toast.error("Erro ao reativar");
    } finally {
      setTogglingSlug(null);
    }
  };

  const invalidateAll = () => {
    if (!clinic?.id) return;
    queryClient.invalidateQueries({ queryKey: ["clinic-specialties", clinic.id] });
    queryClient.invalidateQueries({ queryKey: ["enabled-specialties", clinic.id] });
    queryClient.invalidateQueries({ queryKey: ["specialties", clinic.id] });
    queryClient.invalidateQueries({ queryKey: ["all-specialties", clinic.id] });
    queryClient.invalidateQueries({ queryKey: ["standard-specialties"] });
    queryClient.invalidateQueries({ queryKey: ["specialties-management", clinic.id] });
    queryClient.invalidateQueries({ queryKey: ["custom-specialties", clinic.id] });
    queryClient.invalidateQueries({ queryKey: ["professional-specialties"] });
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

  const activeCustom = filteredCustom.filter(s => s.is_active);
  const inactiveCustom = filteredCustom.filter(s => !s.is_active);

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
                Ative especialidades para provisionar automaticamente prontuários, templates e fluxos de atendimento.
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
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar especialidades..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9"
                />
              </div>

              <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as "padrao" | "personalizada")}>
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="padrao" className="gap-2">
                    <Globe className="h-4 w-4" />
                    Padrão Yesclin
                  </TabsTrigger>
                  <TabsTrigger value="personalizada" className="gap-2">
                    <Building className="h-4 w-4" />
                    Personalizadas ({customSpecialties.length})
                  </TabsTrigger>
                </TabsList>

                {/* Standard Specialties */}
                <TabsContent value="padrao" className="mt-4">
                  <div className="rounded-lg border bg-muted/30 p-3 mb-4">
                    <div className="flex items-start gap-2">
                      <Sparkles className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                      <p className="text-sm text-muted-foreground">
                        Ao ativar, o sistema provisiona automaticamente: <strong>abas de prontuário</strong>, 
                        <strong> templates de anamnese</strong> e <strong>recursos específicos</strong> da especialidade.
                      </p>
                    </div>
                  </div>

                  {enabledCount > 0 && (
                    <div className="flex items-center gap-2 p-3 rounded-lg bg-primary/5 border border-primary/20 mb-4">
                      <Check className="h-4 w-4 text-primary" />
                      <span className="text-sm font-medium">
                        {enabledCount} especialidade(s) ativa(s)
                      </span>
                    </div>
                  )}

                  {/* Provision result feedback */}
                  {provisionResult && (
                    <div className="p-3 rounded-lg bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 mb-4">
                      <div className="flex items-start gap-2">
                        <Check className="h-4 w-4 text-green-600 mt-0.5" />
                        <div className="text-sm">
                          <p className="font-medium text-green-700 dark:text-green-400">
                            Provisionamento concluído
                          </p>
                          <p className="text-green-600 dark:text-green-500 mt-1">
                            {String(provisionResult.specialty_name)}: {String(provisionResult.tabs_created)} aba(s) 
                            e {String(provisionResult.templates_created)} template(s) criados.
                          </p>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="mt-1 h-6 text-xs text-green-600"
                            onClick={() => setProvisionResult(null)}
                          >
                            Fechar
                          </Button>
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                    {filteredOfficial.map((spec) => {
                      const existing = enabledBySlug[spec.slug];
                      const isEnabled = existing?.is_active ?? false;
                      const Icon = SPECIALTY_ICONS[spec.slug] || Stethoscope;
                      const colorClass = SPECIALTY_COLORS[spec.slug] || "bg-blue-500";
                      const isToggling = togglingSlug === spec.slug;

                      return (
                        <div
                          key={spec.slug}
                          className={`relative flex items-start gap-3 p-4 rounded-xl border transition-all ${
                            isEnabled ? "bg-primary/5 border-primary/30" : "bg-card hover:bg-muted/50"
                          }`}
                        >
                          <div className={`w-9 h-9 rounded-lg ${colorClass} flex items-center justify-center shrink-0`}>
                            {isToggling ? (
                              <Loader2 className="h-5 w-5 text-white animate-spin" />
                            ) : (
                              <Icon className="h-5 w-5 text-white" />
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <span className="font-medium text-sm block">{spec.name}</span>
                            <p className="text-xs text-muted-foreground mt-0.5">
                              {SPECIALTY_DESCRIPTIONS[spec.slug]}
                            </p>
                          </div>
                          {isOwner && (
                            <Switch
                              checked={isEnabled}
                              onCheckedChange={() => handleToggleStandard(spec.slug, spec.name)}
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
                        Especialidades exclusivas desta clínica.
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
                      <h3 className="font-medium text-foreground mb-1">Nenhuma especialidade personalizada</h3>
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
                      {activeCustom.length > 0 && (
                        <div className="space-y-2">
                          <h4 className="text-sm font-medium text-primary">Habilitadas ({activeCustom.length})</h4>
                          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                            {activeCustom.map((s) => (
                              <div key={s.id} className="flex items-center justify-between p-3 rounded-lg border bg-card hover:bg-muted/50 transition-colors">
                                <div className="flex-1 min-w-0">
                                  <span className="font-medium truncate block">{s.name}</span>
                                  {s.description && <span className="text-xs text-muted-foreground truncate block">{s.description}</span>}
                                </div>
                                {isOwner && (
                                  <div className="flex items-center gap-1 ml-2">
                                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEditDialog(s)}>
                                      <Pencil className="h-4 w-4" />
                                    </Button>
                                    <Switch checked={s.is_active} onCheckedChange={() => handleToggleCustom(s)} disabled={togglingSlug === s.id} />
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {inactiveCustom.length > 0 && (
                        <div className="space-y-2">
                          <h4 className="text-sm font-medium text-muted-foreground">Desabilitadas ({inactiveCustom.length})</h4>
                          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                            {inactiveCustom.map((s) => (
                              <div key={s.id} className="flex items-center justify-between p-3 rounded-lg border border-dashed bg-muted/30 opacity-70">
                                <div className="flex-1 min-w-0">
                                  <span className="font-medium truncate text-muted-foreground block">{s.name}</span>
                                </div>
                                {isOwner && (
                                  <div className="flex items-center gap-1 ml-2">
                                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEditDialog(s)}>
                                      <Pencil className="h-4 w-4" />
                                    </Button>
                                    <Switch checked={s.is_active} onCheckedChange={() => handleToggleCustom(s)} disabled={togglingSlug === s.id} />
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
              {editingSpecialty ? <><Pencil className="h-5 w-5 text-primary" /> Editar Especialidade</> : <><Plus className="h-5 w-5 text-primary" /> Nova Especialidade Personalizada</>}
            </DialogTitle>
            <DialogDescription>
              {editingSpecialty ? "Atualize o nome ou descrição." : "Crie uma especialidade exclusiva para sua clínica."}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nome <span className="text-destructive">*</span></Label>
              <Input id="name" placeholder="Ex: Acupuntura, Quiropraxia..." value={newName} onChange={(e) => setNewName(e.target.value)} autoFocus />
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Descrição (opcional)</Label>
              <Input id="description" placeholder="Breve descrição" value={newDescription} onChange={(e) => setNewDescription(e.target.value)} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={closeDialog} disabled={isSubmitting}>Cancelar</Button>
            <Button onClick={editingSpecialty ? handleEditCustom : handleCreateCustom} disabled={isSubmitting || !newName.trim()}>
              {isSubmitting ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Salvando...</> : editingSpecialty ? "Salvar" : <><Plus className="mr-2 h-4 w-4" /> Criar</>}
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
              <p>A especialidade <strong>"{confirmDeactivate?.name}"</strong> será desabilitada.</p>
              <ul className="text-sm list-disc list-inside space-y-1 mt-2">
                <li>Abas de prontuário e templates serão desativados</li>
                <li>Novos agendamentos não poderão selecionar</li>
                <li>Registros existentes serão mantidos</li>
                <li>Pode ser reativada a qualquer momento</li>
              </ul>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeactivateConfirm} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Desabilitar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
