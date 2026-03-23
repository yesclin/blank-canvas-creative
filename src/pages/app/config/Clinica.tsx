import { useState, useEffect, useCallback } from "react";
import { Building, Save, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { usePermissions } from "@/hooks/usePermissions";
import { ClinicDataCard } from "@/components/config/ClinicDataCard";
import { FiscalIdentificationCard } from "@/components/config/FiscalIdentificationCard";
import { LocationHoursSection } from "@/components/config/LocationHoursSection";
import { WeekSchedule, getDefaultWeekSchedule } from "@/components/config/EnhancedWorkingHoursCard";
import { SpecialtiesSection } from "@/components/config/SpecialtiesSection";
import { ClinicalModulesSection } from "@/components/config/ClinicalModulesSection";
import { validateCPF, validateCNPJ } from "@/lib/validators";

interface ClinicFormData {
  name: string;
  phone: string;
  whatsapp: string;
  email: string;
  address_street: string;
  address_number: string;
  address_complement: string;
  address_neighborhood: string;
  address_zip: string;
  address_city: string;
  address_state: string;
  logo_url: string;
  fiscal_type: "pf" | "pj" | "";
  cpf: string;
  cnpj: string;
  razao_social: string;
  nome_fantasia: string;
  nome_completo: string;
  nome_profissional: string;
  inscricao_estadual: string;
  inscricao_municipal: string;
  schedule: WeekSchedule;
}

export default function ConfigClinica() {
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [clinicId, setClinicId] = useState<string | null>(null);
  const [isFiscalValid, setIsFiscalValid] = useState(true);
  const { toast } = useToast();
  const { isOwner } = usePermissions();

  const [formData, setFormData] = useState<ClinicFormData>({
    name: "",
    phone: "",
    whatsapp: "",
    email: "",
    address_street: "",
    address_number: "",
    address_complement: "",
    address_neighborhood: "",
    address_zip: "",
    address_city: "",
    address_state: "",
    logo_url: "",
    fiscal_type: "",
    cpf: "",
    cnpj: "",
    razao_social: "",
    nome_fantasia: "",
    nome_completo: "",
    nome_profissional: "",
    inscricao_estadual: "",
    inscricao_municipal: "",
    schedule: getDefaultWeekSchedule(),
  });

  const [originalFiscalData, setOriginalFiscalData] = useState({
    fiscal_type: "",
    cpf: "",
    cnpj: "",
  });

  useEffect(() => {
    async function loadClinicData() {
      setIsLoading(true);

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setIsLoading(false);
        return;
      }

      const { data: profile } = await supabase
        .from("profiles")
        .select("clinic_id")
        .eq("user_id", user.id)
        .single();

      if (!profile?.clinic_id) {
        setIsLoading(false);
        return;
      }

      setClinicId(profile.clinic_id);

      const { data: clinic } = await supabase
        .from("clinics")
        .select("*")
        .eq("id", profile.clinic_id)
        .single();

      if (clinic) {
        const openingHours = clinic.opening_hours as Record<string, unknown> || {};
        const fiscalType = (clinic as Record<string, unknown>).fiscal_type as string || "";
        const cpf = (clinic as Record<string, unknown>).cpf as string || "";
        const cnpj = (clinic as Record<string, unknown>).cnpj as string || "";
        const inscricaoEstadual = (clinic as Record<string, unknown>).inscricao_estadual as string || "";
        const inscricaoMunicipal = (clinic as Record<string, unknown>).inscricao_municipal as string || "";
        
        // Parse schedule from opening_hours or use default
        let schedule = getDefaultWeekSchedule();
        if (openingHours.schedule) {
          schedule = openingHours.schedule as WeekSchedule;
        } else if (openingHours.working_days) {
          // Convert legacy format to new format
          const legacyDays = openingHours.working_days as string[];
          const openTime = (openingHours.open_time as string) || "08:00";
          const closeTime = (openingHours.close_time as string) || "18:00";
          const lunchStart = (openingHours.lunch_start as string) || "12:00";
          const lunchEnd = (openingHours.lunch_end as string) || "13:00";
          
          Object.keys(schedule).forEach((day) => {
            const dayKey = day as keyof WeekSchedule;
            schedule[dayKey] = {
              enabled: legacyDays.includes(day),
              open: openTime,
              close: closeTime,
              lunchStart: lunchStart,
              lunchEnd: lunchEnd,
              hasLunch: true,
            };
          });
        }
        
        setFormData({
          name: clinic.name || "",
          phone: clinic.phone || "",
          whatsapp: clinic.whatsapp || "",
          email: clinic.email || "",
          address_street: clinic.address_street || "",
          address_number: clinic.address_number || "",
          address_complement: clinic.address_complement || "",
          address_neighborhood: clinic.address_neighborhood || "",
          address_zip: clinic.address_zip || "",
          address_city: clinic.address_city || "",
          address_state: clinic.address_state || "",
          logo_url: clinic.logo_url || "",
          fiscal_type: fiscalType as "pf" | "pj" | "",
          cpf: cpf,
          cnpj: cnpj,
          razao_social: "",
          nome_fantasia: clinic.name || "",
          nome_completo: "",
          nome_profissional: "",
          inscricao_estadual: inscricaoEstadual,
          inscricao_municipal: inscricaoMunicipal,
          schedule: schedule,
        });

        setOriginalFiscalData({
          fiscal_type: fiscalType,
          cpf: cpf,
          cnpj: cnpj,
        });
      }

      setIsLoading(false);
    }

    loadClinicData();
  }, []);

  const handleAddressChange = useCallback((field: keyof ClinicFormData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  }, []);

  const handleCNPJDataFetched = useCallback((data: {
    razao_social: string;
    nome_fantasia: string;
    endereco?: {
      cep: string;
      logradouro: string;
      numero: string;
      complemento: string;
      bairro: string;
      cidade: string;
      estado: string;
    };
    telefone?: string;
    email?: string;
  }) => {
    setFormData((prev) => {
      const updates: Partial<ClinicFormData> = {};
      
      // Use nome_fantasia or razao_social for clinic name if empty
      if (!prev.name && (data.nome_fantasia || data.razao_social)) {
        updates.name = data.nome_fantasia || data.razao_social;
      }

      // Fill address if empty
      if (data.endereco) {
        if (!prev.address_street) updates.address_street = data.endereco.logradouro || '';
        if (!prev.address_number) updates.address_number = data.endereco.numero || '';
        if (!prev.address_complement) updates.address_complement = data.endereco.complemento || '';
        if (!prev.address_neighborhood) updates.address_neighborhood = data.endereco.bairro || '';
        if (!prev.address_zip) updates.address_zip = data.endereco.cep || '';
        if (!prev.address_city) updates.address_city = data.endereco.cidade || '';
        if (!prev.address_state) updates.address_state = data.endereco.estado || '';
      }

      // Fill contact info if empty
      if (!prev.phone && data.telefone) {
        updates.phone = data.telefone;
      }
      if (!prev.email && data.email) {
        updates.email = data.email;
      }

      return { ...prev, ...updates };
    });
  }, []);

  const handleSave = async () => {
    if (!clinicId) {
      toast({
        title: "Erro",
        description: "Clínica não encontrada.",
        variant: "destructive",
      });
      return;
    }

    if (!formData.name.trim()) {
      toast({
        title: "Nome obrigatório",
        description: "Informe o nome da clínica.",
        variant: "destructive",
      });
      return;
    }

    // Validate fiscal data
    if (formData.fiscal_type === "pf" && formData.cpf) {
      const cleanCPF = formData.cpf.replace(/\D/g, '');
      if (cleanCPF.length === 11 && !validateCPF(formData.cpf)) {
        toast({
          title: "CPF inválido",
          description: "O CPF informado não é válido. Verifique os dígitos.",
          variant: "destructive",
        });
        return;
      }
    }

    if (formData.fiscal_type === "pj" && formData.cnpj) {
      const cleanCNPJ = formData.cnpj.replace(/\D/g, '');
      if (cleanCNPJ.length === 14 && !validateCNPJ(formData.cnpj)) {
        toast({
          title: "CNPJ inválido",
          description: "O CNPJ informado não é válido. Verifique os dígitos.",
          variant: "destructive",
        });
        return;
      }
    }

    // Check if fiscal data was changed without admin permission
    const fiscalChanged = 
      formData.fiscal_type !== originalFiscalData.fiscal_type ||
      formData.cpf !== originalFiscalData.cpf ||
      formData.cnpj !== originalFiscalData.cnpj;

    if (fiscalChanged && !isOwner && originalFiscalData.fiscal_type !== "") {
      toast({
        title: "Permissão negada",
        description: "Apenas o proprietário pode alterar dados fiscais.",
        variant: "destructive",
      });
      return;
    }

    setIsSaving(true);

    const { data: { user } } = await supabase.auth.getUser();

    // Prepare update data
    const updateData: Record<string, unknown> = {
      name: formData.name,
      phone: formData.phone,
      whatsapp: formData.whatsapp,
      email: formData.email,
      address_street: formData.address_street,
      address_number: formData.address_number,
      address_complement: formData.address_complement,
      address_neighborhood: formData.address_neighborhood,
      address_zip: formData.address_zip,
      address_city: formData.address_city,
      address_state: formData.address_state,
      opening_hours: {
        schedule: formData.schedule,
      },
      updated_by: user?.id,
    };

    // Only include fiscal data if admin or first time setting
    if (isOwner || originalFiscalData.fiscal_type === "") {
      updateData.fiscal_type = formData.fiscal_type || null;
      updateData.cpf = formData.fiscal_type === "pf" ? formData.cpf : null;
      updateData.cnpj = formData.fiscal_type === "pj" ? formData.cnpj : null;
      updateData.inscricao_estadual = formData.fiscal_type === "pj" ? formData.inscricao_estadual : null;
      updateData.inscricao_municipal = formData.fiscal_type === "pj" ? formData.inscricao_municipal : null;
    }

    const { error, count } = await supabase
      .from("clinics")
      .update(updateData)
      .eq("id", clinicId)
      .select("id")
      .single();

    if (error) {
      console.error("Error saving clinic settings:", error);
      setIsSaving(false);
      toast({
        title: "Erro ao salvar",
        description: error.message || "Não foi possível salvar as configurações.",
        variant: "destructive",
      });
      return;
    }

    // Log audit entry
    if (user) {
      await supabase.from("clinic_audit_logs").insert({
        clinic_id: clinicId,
        user_id: user.id,
        action: "update_settings",
        changes: {
          updated_fields: Object.keys(updateData),
          timestamp: new Date().toISOString(),
        },
      });
    }

    // Update original fiscal data after successful save
    if (isOwner || originalFiscalData.fiscal_type === "") {
      setOriginalFiscalData({
        fiscal_type: formData.fiscal_type,
        cpf: formData.cpf,
        cnpj: formData.cnpj,
      });
    }

    setIsSaving(false);

    toast({
      title: "Configurações salvas!",
      description: "Os dados da clínica foram atualizados.",
    });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  const hasFiscalData = originalFiscalData.fiscal_type !== "";
  const canEditFiscal = isOwner || !hasFiscalData;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
          <Building className="h-6 w-6 text-primary" />
          Configurações da Clínica
        </h1>
        <p className="text-muted-foreground mt-1">
          Configure os dados institucionais da sua clínica
        </p>
      </div>

      {!canEditFiscal && (
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Os dados fiscais (CPF/CNPJ) só podem ser alterados por administradores.
          </AlertDescription>
        </Alert>
      )}

      <div className="grid gap-6 lg:grid-cols-2">
        <ClinicDataCard
          name={formData.name}
          phone={formData.phone}
          whatsapp={formData.whatsapp}
          email={formData.email}
          logoUrl={formData.logo_url}
          clinicId={clinicId}
          onNameChange={(v) => setFormData({ ...formData, name: v })}
          onPhoneChange={(v) => setFormData({ ...formData, phone: v })}
          onWhatsappChange={(v) => setFormData({ ...formData, whatsapp: v })}
          onEmailChange={(v) => setFormData({ ...formData, email: v })}
          onLogoChange={(url) => setFormData({ ...formData, logo_url: url })}
        />

        <FiscalIdentificationCard
          fiscalType={formData.fiscal_type}
          cpf={formData.cpf}
          cnpj={formData.cnpj}
          razaoSocial={formData.razao_social}
          nomeFantasia={formData.nome_fantasia}
          nomeCompleto={formData.nome_completo}
          nomeProfissional={formData.nome_profissional}
          inscricaoEstadual={formData.inscricao_estadual}
          inscricaoMunicipal={formData.inscricao_municipal}
          onFiscalTypeChange={(v) => setFormData({ ...formData, fiscal_type: v })}
          onCpfChange={(v) => setFormData({ ...formData, cpf: v })}
          onCnpjChange={(v) => setFormData({ ...formData, cnpj: v })}
          onRazaoSocialChange={(v) => setFormData({ ...formData, razao_social: v })}
          onNomeFantasiaChange={(v) => setFormData({ ...formData, nome_fantasia: v })}
          onNomeCompletoChange={(v) => setFormData({ ...formData, nome_completo: v })}
          onNomeProfissionalChange={(v) => setFormData({ ...formData, nome_profissional: v })}
          onInscricaoEstadualChange={(v) => setFormData({ ...formData, inscricao_estadual: v })}
          onInscricaoMunicipalChange={(v) => setFormData({ ...formData, inscricao_municipal: v })}
          isValid={isFiscalValid}
          onValidationChange={setIsFiscalValid}
          onCNPJDataFetched={handleCNPJDataFetched}
          canEdit={canEditFiscal}
          onClearFiscalFields={() => setFormData(prev => ({
            ...prev,
            cpf: "",
            cnpj: "",
            razao_social: "",
            nome_fantasia: "",
            nome_completo: "",
            nome_profissional: "",
            inscricao_estadual: "",
            inscricao_municipal: "",
          }))}
        />
      </div>

      <LocationHoursSection
        address={{
          address_street: formData.address_street,
          address_number: formData.address_number,
          address_complement: formData.address_complement,
          address_neighborhood: formData.address_neighborhood,
          address_zip: formData.address_zip,
          address_city: formData.address_city,
          address_state: formData.address_state,
        }}
        onAddressChange={handleAddressChange}
        schedule={formData.schedule}
        onScheduleChange={(schedule) => setFormData({ ...formData, schedule })}
        canEdit={isOwner}
      />

      <SpecialtiesSection />

      <ClinicalModulesSection />

      <div className="flex justify-end">
        <Button 
          size="lg" 
          onClick={handleSave} 
          disabled={isSaving || !isFiscalValid}
        >
          <Save className="h-4 w-4 mr-2" />
          {isSaving ? "Salvando..." : "Salvar Configurações"}
        </Button>
      </div>
    </div>
  );
}
