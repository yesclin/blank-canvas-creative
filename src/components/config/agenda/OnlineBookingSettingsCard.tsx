import { useState, useEffect } from "react";
import { Globe, Save, Copy, ExternalLink } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

interface BookingSettings {
  welcome_text?: string;
  confirmation_message?: string;
  min_advance_hours?: number;
  max_advance_days?: number;
  initial_status?: string;
  allowed_specialties?: string[];
  allowed_professionals?: string[];
}

export function OnlineBookingSettingsCard() {
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [clinicId, setClinicId] = useState<string | null>(null);
  const [enabled, setEnabled] = useState(false);
  const [slug, setSlug] = useState("");
  const [settings, setSettings] = useState<BookingSettings>({
    welcome_text: "Agende sua consulta de forma rápida e segura.",
    confirmation_message: "Seu agendamento foi realizado com sucesso!",
    min_advance_hours: 2,
    max_advance_days: 30,
    initial_status: "nao_confirmado",
  });

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: profile } = await supabase
        .from("profiles")
        .select("clinic_id")
        .eq("id", user.id)
        .single();

      if (!profile?.clinic_id) return;
      setClinicId(profile.clinic_id);

      const { data: clinic } = await supabase
        .from("clinics")
        .select("slug, public_booking_enabled, public_booking_settings")
        .eq("id", profile.clinic_id)
        .single();

      if (clinic) {
        setEnabled(clinic.public_booking_enabled || false);
        setSlug(clinic.slug || "");
        if (clinic.public_booking_settings && typeof clinic.public_booking_settings === "object") {
          setSettings((prev) => ({ ...prev, ...(clinic.public_booking_settings as BookingSettings) }));
        }
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    if (!clinicId) return;
    if (enabled && !slug.trim()) {
      toast.error("Defina um slug para o link público.");
      return;
    }

    setIsSaving(true);
    try {
      const cleanSlug = slug
        .toLowerCase()
        .replace(/[^a-z0-9-]/g, "-")
        .replace(/-+/g, "-")
        .replace(/^-|-$/g, "");

      const { error } = await supabase
        .from("clinics")
        .update({
          slug: cleanSlug || null,
          public_booking_enabled: enabled,
          public_booking_settings: settings,
        })
        .eq("id", clinicId);

      if (error) {
        if (error.message?.includes("duplicate") || error.message?.includes("unique")) {
          toast.error("Este slug já está em uso. Escolha outro.");
        } else {
          throw error;
        }
        return;
      }

      setSlug(cleanSlug);
      toast.success("Configurações salvas!");
    } catch (err: any) {
      toast.error("Erro ao salvar: " + (err.message || ""));
    } finally {
      setIsSaving(false);
    }
  };

  const bookingUrl = slug ? `${window.location.origin}/agendar/${slug}` : "";

  const copyLink = () => {
    if (bookingUrl) {
      navigator.clipboard.writeText(bookingUrl);
      toast.success("Link copiado!");
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader><Skeleton className="h-6 w-48" /></CardHeader>
        <CardContent><Skeleton className="h-40 w-full" /></CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <Globe className="h-5 w-5 text-primary" />
          <CardTitle>Agendamento Online</CardTitle>
        </div>
        <CardDescription>
          Permita que pacientes agendem consultas pelo link público da clínica
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Toggle */}
        <div className="flex items-center justify-between rounded-lg border p-4">
          <div>
            <p className="font-medium text-foreground">Ativar Agendamento Online</p>
            <p className="text-sm text-muted-foreground">Pacientes poderão agendar sem login</p>
          </div>
          <Switch checked={enabled} onCheckedChange={setEnabled} />
        </div>

        {enabled && (
          <>
            {/* Slug */}
            <div className="space-y-2">
              <Label>Slug do link público</Label>
              <div className="flex gap-2">
                <div className="flex-1 flex items-center gap-1">
                  <span className="text-sm text-muted-foreground whitespace-nowrap">/agendar/</span>
                  <Input
                    value={slug}
                    onChange={(e) => setSlug(e.target.value)}
                    placeholder="minha-clinica"
                    className="flex-1"
                  />
                </div>
              </div>
              {bookingUrl && (
                <div className="flex items-center gap-2 mt-2">
                  <code className="text-xs bg-muted px-2 py-1 rounded flex-1 truncate">{bookingUrl}</code>
                  <Button variant="ghost" size="icon" className="h-7 w-7 shrink-0" onClick={copyLink}>
                    <Copy className="h-3.5 w-3.5" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 shrink-0"
                    onClick={() => window.open(bookingUrl, "_blank")}
                  >
                    <ExternalLink className="h-3.5 w-3.5" />
                  </Button>
                </div>
              )}
            </div>

            <Separator />

            {/* Welcome text */}
            <div className="space-y-2">
              <Label>Mensagem de boas-vindas</Label>
              <Textarea
                value={settings.welcome_text || ""}
                onChange={(e) => setSettings((s) => ({ ...s, welcome_text: e.target.value }))}
                placeholder="Agende sua consulta..."
                rows={2}
              />
            </div>

            {/* Confirmation message */}
            <div className="space-y-2">
              <Label>Mensagem de confirmação</Label>
              <Textarea
                value={settings.confirmation_message || ""}
                onChange={(e) => setSettings((s) => ({ ...s, confirmation_message: e.target.value }))}
                placeholder="Agendamento realizado com sucesso..."
                rows={2}
              />
            </div>

            {/* Advance rules */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Antecedência mínima (horas)</Label>
                <Input
                  type="number"
                  min={0}
                  value={settings.min_advance_hours || 2}
                  onChange={(e) => setSettings((s) => ({ ...s, min_advance_hours: Number(e.target.value) }))}
                />
              </div>
              <div className="space-y-2">
                <Label>Antecedência máxima (dias)</Label>
                <Input
                  type="number"
                  min={1}
                  max={90}
                  value={settings.max_advance_days || 30}
                  onChange={(e) => setSettings((s) => ({ ...s, max_advance_days: Number(e.target.value) }))}
                />
              </div>
            </div>

            {/* Initial status */}
            <div className="space-y-2">
              <Label>Status inicial do agendamento</Label>
              <select
                value={settings.initial_status || "nao_confirmado"}
                onChange={(e) => setSettings((s) => ({ ...s, initial_status: e.target.value }))}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              >
                <option value="nao_confirmado">Não Confirmado</option>
                <option value="confirmado">Confirmado</option>
              </select>
            </div>
          </>
        )}

        <Button onClick={handleSave} disabled={isSaving} className="w-full gap-2">
          <Save className="h-4 w-4" />
          {isSaving ? "Salvando..." : "Salvar Configurações"}
        </Button>
      </CardContent>
    </Card>
  );
}
