import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Building2, Stethoscope, Users } from "lucide-react";
import { cn } from "@/lib/utils";

export type UserType = "administrative" | "professional" | "hybrid";

interface UserTypeSelectorProps {
  value: UserType;
  onChange: (value: UserType) => void;
  disabled?: boolean;
}

const userTypes = [
  {
    value: "administrative" as UserType,
    label: "Administrativo",
    description: "Acesso a gestão, finanças e relatórios",
    icon: Building2,
    color: "text-blue-600 bg-blue-500/10",
  },
  {
    value: "professional" as UserType,
    label: "Profissional de Saúde",
    description: "Acesso ao prontuário, agenda e atendimento",
    icon: Stethoscope,
    color: "text-emerald-600 bg-emerald-500/10",
  },
  {
    value: "hybrid" as UserType,
    label: "Ambos",
    description: "Acesso completo a áreas clínicas e administrativas",
    icon: Users,
    color: "text-purple-600 bg-purple-500/10",
  },
];

export function UserTypeSelector({ value, onChange, disabled }: UserTypeSelectorProps) {
  return (
    <div className="space-y-3">
      <Label>Tipo de Usuário *</Label>
      <RadioGroup
        value={value}
        onValueChange={(v) => onChange(v as UserType)}
        className="grid gap-3"
        disabled={disabled}
      >
        {userTypes.map((type) => {
          const Icon = type.icon;
          const isSelected = value === type.value;
          
          return (
            <div
              key={type.value}
              className={cn(
                "flex items-center gap-4 p-3 rounded-lg border cursor-pointer transition-all",
                isSelected
                  ? "border-primary bg-primary/5 ring-1 ring-primary/20"
                  : "border-border hover:bg-muted/50",
                disabled && "opacity-50 cursor-not-allowed"
              )}
              onClick={() => !disabled && onChange(type.value)}
            >
              <RadioGroupItem value={type.value} id={type.value} className="sr-only" />
              <div className={cn("p-2 rounded-full", type.color)}>
                <Icon className="h-4 w-4" />
              </div>
              <div className="flex-1">
                <p className="font-medium text-sm">{type.label}</p>
                <p className="text-xs text-muted-foreground">{type.description}</p>
              </div>
              {isSelected && (
                <div className="w-2 h-2 rounded-full bg-primary" />
              )}
            </div>
          );
        })}
      </RadioGroup>
    </div>
  );
}
