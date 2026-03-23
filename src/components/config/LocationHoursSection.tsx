import { MapPin, Clock } from "lucide-react";
import { AddressCard } from "./AddressCard";
import { EnhancedWorkingHoursCard, WeekSchedule } from "./EnhancedWorkingHoursCard";

interface AddressData {
  address_street: string;
  address_number: string;
  address_complement: string;
  address_neighborhood: string;
  address_zip: string;
  address_city: string;
  address_state: string;
}

interface LocationHoursSectionProps {
  address: AddressData;
  onAddressChange: (field: keyof AddressData, value: string) => void;
  schedule: WeekSchedule;
  onScheduleChange: (schedule: WeekSchedule) => void;
  canEdit?: boolean;
}

export function LocationHoursSection({
  address,
  onAddressChange,
  schedule,
  onScheduleChange,
  canEdit = true,
}: LocationHoursSectionProps) {
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <div className="flex items-center justify-center h-8 w-8 rounded-lg bg-primary/10">
          <MapPin className="h-4 w-4 text-primary" />
        </div>
        <div>
          <h2 className="text-lg font-semibold">Localização e Funcionamento</h2>
          <p className="text-sm text-muted-foreground">
            Endereço e horários de atendimento da clínica
          </p>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <AddressCard address={address} onAddressChange={onAddressChange} />
        <EnhancedWorkingHoursCard
          schedule={schedule}
          onScheduleChange={onScheduleChange}
          canEdit={canEdit}
        />
      </div>
    </div>
  );
}
