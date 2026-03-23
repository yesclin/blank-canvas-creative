import { useState, useEffect } from "react";
import { Building2, Save } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { 
  EnhancedWorkingHoursCard, 
  WeekSchedule, 
  getDefaultWeekSchedule 
} from "@/components/config/EnhancedWorkingHoursCard";

interface ClinicScheduleData {
  opening_hours: WeekSchedule;
  default_duration_minutes: number;
}

export function ClinicScheduleSection() {
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [clinicId, setClinicId] = useState<string | null>(null);
  const [schedule, setSchedule] = useState<WeekSchedule>(getDefaultWeekSchedule());
  const [defaultDuration, setDefaultDuration] = useState(30);
  const [hasChanges, setHasChanges] = useState(false);

  useEffect(() => {
    async function loadClinicSchedule() {
      try {
        setIsLoading(true);
        
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const { data: profile } = await supabase
          .from("profiles")
          .select("clinic_id")
          .eq("user_id", user.id)
          .single();

        if (!profile?.clinic_id) return;
        setClinicId(profile.clinic_id);

        // Load from clinics table
        const { data: clinicData } = await supabase
          .from("clinics")
          .select("opening_hours")
          .eq("id", profile.clinic_id)
          .single();

        if (clinicData?.opening_hours) {
          setSchedule(clinicData.opening_hours as unknown as WeekSchedule);
        }

        // Load from schedule config table
        const { data: configData } = await supabase
          .from("clinic_schedule_config")
          .select("default_duration_minutes")
          .eq("clinic_id", profile.clinic_id)
          .single();

        if (configData) {
          setDefaultDuration(configData.default_duration_minutes || 30);
        }

      } catch (err) {
        console.error("Error loading clinic schedule:", err);
      } finally {
        setIsLoading(false);
      }
    }

    loadClinicSchedule();
  }, []);

  const handleScheduleChange = (newSchedule: WeekSchedule) => {
    setSchedule(newSchedule);
    setHasChanges(true);
  };

  const handleDurationChange = (value: number) => {
    setDefaultDuration(value);
    setHasChanges(true);
  };

  const handleSave = async () => {
    if (!clinicId) return;

    setIsSaving(true);
    try {
      // Save opening_hours to clinics table
      const { error: clinicError } = await supabase
        .from("clinics")
        .update({ opening_hours: schedule as any })
        .eq("id", clinicId);

      if (clinicError) throw clinicError;

      // Upsert clinic_schedule_config
      const { error: configError } = await supabase
        .from("clinic_schedule_config")
        .upsert({
          clinic_id: clinicId,
          default_duration_minutes: defaultDuration,
          working_days: schedule as any,
          start_time: schedule.seg?.open || "08:00",
          end_time: schedule.seg?.close || "18:00",
        }, { onConflict: "clinic_id" });

      if (configError) throw configError;

      toast.success("Horário padrão salvo com sucesso");
      setHasChanges(false);
    } catch (err) {
      console.error("Error saving clinic schedule:", err);
      toast.error("Erro ao salvar horário");
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-4 w-72" />
        </CardHeader>
        <CardContent className="space-y-4">
          <Skeleton className="h-96 w-full" />
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5 text-primary" />
            Horário Padrão da Clínica
          </CardTitle>
          <CardDescription>
            Este é o horário base usado quando o profissional não tem configuração própria
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Label htmlFor="default_duration">Tempo padrão de consulta:</Label>
              <Input
                id="default_duration"
                type="number"
                value={defaultDuration}
                onChange={(e) => handleDurationChange(Number(e.target.value))}
                min={5}
                step={5}
                className="w-20"
              />
              <span className="text-sm text-muted-foreground">minutos</span>
            </div>
          </div>
        </CardContent>
      </Card>

      <EnhancedWorkingHoursCard
        schedule={schedule}
        onScheduleChange={handleScheduleChange}
        canEdit={true}
      />

      <div className="flex justify-end">
        <Button 
          onClick={handleSave} 
          disabled={isSaving || !hasChanges}
          size="lg"
        >
          <Save className="h-4 w-4 mr-2" />
          {isSaving ? "Salvando..." : "Salvar Horário Padrão"}
        </Button>
      </div>
    </div>
  );
}
