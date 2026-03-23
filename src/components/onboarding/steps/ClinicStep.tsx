import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Building, ArrowRight, ArrowLeft, Upload } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface ClinicStepProps {
  clinicId: string;
  onNext: () => void;
  onBack: () => void;
}

const weekDays = [
  { id: "seg", label: "Seg" },
  { id: "ter", label: "Ter" },
  { id: "qua", label: "Qua" },
  { id: "qui", label: "Qui" },
  { id: "sex", label: "Sex" },
  { id: "sab", label: "Sáb" },
  { id: "dom", label: "Dom" },
];

export function ClinicStep({ clinicId, onNext, onBack }: ClinicStepProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const { toast } = useToast();

  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    whatsapp: "",
    email: "",
    openTime: "08:00",
    closeTime: "18:00",
    workingDays: ["seg", "ter", "qua", "qui", "sex"],
  });

  useEffect(() => {
    async function loadClinicData() {
      setIsLoading(true);
      const { data } = await supabase
        .from("clinics")
        .select("*")
        .eq("id", clinicId)
        .single();

      if (data) {
        const openingHours = data.opening_hours as any || {};
        setFormData({
          name: data.name || "",
          phone: data.phone || "",
          whatsapp: data.whatsapp || "",
          email: data.email || "",
          openTime: openingHours.open_time || "08:00",
          closeTime: openingHours.close_time || "18:00",
          workingDays: openingHours.working_days || ["seg", "ter", "qua", "qui", "sex"],
        });
      }
      setIsLoading(false);
    }

    if (clinicId) {
      loadClinicData();
    }
  }, [clinicId]);

  const toggleDay = (dayId: string) => {
    setFormData((prev) => ({
      ...prev,
      workingDays: prev.workingDays.includes(dayId)
        ? prev.workingDays.filter((d) => d !== dayId)
        : [...prev.workingDays, dayId],
    }));
  };

  const handleSave = async () => {
    if (!formData.name.trim()) {
      toast({
        title: "Nome obrigatório",
        description: "Informe o nome da clínica.",
        variant: "destructive",
      });
      return;
    }

    setIsSaving(true);

    const { error } = await supabase
      .from("clinics")
      .update({
        name: formData.name,
        phone: formData.phone,
        whatsapp: formData.whatsapp,
        email: formData.email,
        opening_hours: {
          open_time: formData.openTime,
          close_time: formData.closeTime,
          working_days: formData.workingDays,
        },
      })
      .eq("id", clinicId);

    setIsSaving(false);

    if (error) {
      toast({
        title: "Erro ao salvar",
        description: "Não foi possível salvar os dados da clínica.",
        variant: "destructive",
      });
      return;
    }

    toast({
      title: "Dados salvos!",
      description: "Informações da clínica atualizadas.",
    });

    onNext();
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="space-y-6"
    >
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
          <Building className="h-5 w-5 text-primary" />
        </div>
        <div>
          <h2 className="text-xl font-semibold text-foreground">Dados da Clínica</h2>
          <p className="text-sm text-muted-foreground">Configure as informações básicas</p>
        </div>
      </div>

      <div className="grid gap-4">
        <div className="flex items-center gap-4">
          <Avatar className="h-16 w-16">
            <AvatarImage src="" />
            <AvatarFallback className="bg-primary/10 text-primary text-xl">
              {formData.name.charAt(0).toUpperCase() || "Y"}
            </AvatarFallback>
          </Avatar>
          <Button variant="outline" size="sm" disabled>
            <Upload className="h-4 w-4 mr-2" />
            Enviar Logo (opcional)
          </Button>
        </div>

        <div className="grid gap-2">
          <Label htmlFor="name">Nome da Clínica *</Label>
          <Input
            id="name"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            placeholder="Nome da sua clínica"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="grid gap-2">
            <Label htmlFor="phone">Telefone</Label>
            <Input
              id="phone"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              placeholder="(00) 0000-0000"
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="whatsapp">WhatsApp</Label>
            <Input
              id="whatsapp"
              value={formData.whatsapp}
              onChange={(e) => setFormData({ ...formData, whatsapp: e.target.value })}
              placeholder="(00) 00000-0000"
            />
          </div>
        </div>

        <div className="grid gap-2">
          <Label htmlFor="email">E-mail</Label>
          <Input
            id="email"
            type="email"
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            placeholder="contato@clinica.com"
          />
        </div>

        <div className="space-y-3">
          <Label>Dias de Atendimento</Label>
          <div className="flex flex-wrap gap-2">
            {weekDays.map((day) => (
              <div key={day.id} className="flex items-center space-x-2">
                <Checkbox
                  id={`day-${day.id}`}
                  checked={formData.workingDays.includes(day.id)}
                  onCheckedChange={() => toggleDay(day.id)}
                />
                <Label htmlFor={`day-${day.id}`} className="text-sm font-normal cursor-pointer">
                  {day.label}
                </Label>
              </div>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="grid gap-2">
            <Label htmlFor="openTime">Abertura</Label>
            <Input
              id="openTime"
              type="time"
              value={formData.openTime}
              onChange={(e) => setFormData({ ...formData, openTime: e.target.value })}
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="closeTime">Fechamento</Label>
            <Input
              id="closeTime"
              type="time"
              value={formData.closeTime}
              onChange={(e) => setFormData({ ...formData, closeTime: e.target.value })}
            />
          </div>
        </div>
      </div>

      <div className="flex justify-between pt-4">
        <Button variant="outline" onClick={onBack}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Voltar
        </Button>
        <Button onClick={handleSave} disabled={isSaving}>
          {isSaving ? "Salvando..." : "Continuar"}
          <ArrowRight className="ml-2 h-4 w-4" />
        </Button>
      </div>
    </motion.div>
  );
}
