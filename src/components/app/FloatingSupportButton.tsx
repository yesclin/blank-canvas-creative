import { useState } from "react";
import { Headset } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { useNavigate } from "react-router-dom";
import { CreateTicketDialog } from "@/pages/app/Suporte";
import { useClinicData } from "@/hooks/useClinicData";
import { useCurrentUser } from "@/hooks/useClinicUsers";

export function FloatingSupportButton() {
  const navigate = useNavigate();
  const { clinic } = useClinicData();
  const { user } = useCurrentUser();
  const [open, setOpen] = useState(false);

  if (!clinic?.id || !user?.id) return null;

  return (
    <>
      <div className="fixed bottom-20 right-4 z-40 flex flex-col gap-2 items-end">
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              onClick={() => setOpen(true)}
              size="icon"
              className="h-12 w-12 rounded-full shadow-lg"
              aria-label="Precisa de ajuda?"
            >
              <Headset className="h-5 w-5" />
            </Button>
          </TooltipTrigger>
          <TooltipContent side="left">Precisa de ajuda?</TooltipContent>
        </Tooltip>
      </div>

      <CreateTicketDialog
        open={open}
        onOpenChange={setOpen}
        clinicId={clinic.id}
        userId={user.id}
        userName={user.name}
        userEmail={user.email}
        userRole={user.role}
        onCreated={() => navigate("/app/suporte")}
      />
    </>
  );
}
