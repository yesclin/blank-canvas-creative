import { useState } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Mail, Phone, Calendar, User, Tag, Target, Edit, Archive, RotateCcw, UserCheck } from "lucide-react";
import { LEAD_SOURCES, LEAD_STATUSES, getLeadStatusColor, type CrmLead } from "@/types/crm";
import { useUpdateLead } from "@/hooks/crm/useLeads";
import { LeadToPatientDialog } from "@/components/comercial/conversions/LeadToPatientDialog";

interface LeadDetailsDrawerProps {
  lead: CrmLead | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onEdit: (lead: CrmLead) => void;
  onCreateOpportunity: (lead: CrmLead) => void;
}

export function LeadDetailsDrawer({ lead, open, onOpenChange, onEdit, onCreateOpportunity }: LeadDetailsDrawerProps) {
  const updateLead = useUpdateLead();
  const [convertOpen, setConvertOpen] = useState(false);

  if (!lead) return null;

  const statusLabel = LEAD_STATUSES.find(s => s.value === lead.status)?.label || lead.status;
  const sourceLabel = LEAD_SOURCES.find(s => s.value === lead.source)?.label || lead.source || "—";
  const alreadyConverted = !!lead.converted_patient_id;

  const handleArchive = async () => {
    await updateLead.mutateAsync({ id: lead.id, name: lead.name, status: "arquivado" });
    onOpenChange(false);
  };

  const handleReactivate = async () => {
    await updateLead.mutateAsync({ id: lead.id, name: lead.name, status: "novo" });
  };

  return (
    <>
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent className="w-full sm:max-w-md overflow-y-auto">
          <SheetHeader>
            <SheetTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              {lead.name}
            </SheetTitle>
          </SheetHeader>

          <div className="mt-6 space-y-6">
            {/* Status */}
            <div className="flex items-center gap-2">
              <Badge className={getLeadStatusColor(lead.status)}>{statusLabel}</Badge>
              {alreadyConverted && (
                <Badge variant="outline" className="text-xs">Paciente vinculado</Badge>
              )}
            </div>

            {/* Contact */}
            <div className="space-y-3">
              <h4 className="text-sm font-semibold text-muted-foreground uppercase">Contato</h4>
              {lead.phone && (
                <div className="flex items-center gap-2 text-sm">
                  <Phone className="h-4 w-4 text-muted-foreground" />
                  <span>{lead.phone}</span>
                </div>
              )}
              {lead.email && (
                <div className="flex items-center gap-2 text-sm">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  <span>{lead.email}</span>
                </div>
              )}
              {lead.birth_date && (
                <div className="flex items-center gap-2 text-sm">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span>{format(new Date(lead.birth_date), "dd/MM/yyyy", { locale: ptBR })}</span>
                </div>
              )}
            </div>

            <Separator />

            {/* Origin */}
            <div className="space-y-3">
              <h4 className="text-sm font-semibold text-muted-foreground uppercase">Origem</h4>
              <div className="flex items-center gap-2 text-sm">
                <Tag className="h-4 w-4 text-muted-foreground" />
                <span>{sourceLabel}</span>
              </div>
              {lead.campaign_name && (
                <div className="text-sm text-muted-foreground">Campanha: {lead.campaign_name}</div>
              )}
            </div>

            {/* Interests */}
            {(lead.specialty_interest || lead.procedure_interest) && (
              <>
                <Separator />
                <div className="space-y-2">
                  <h4 className="text-sm font-semibold text-muted-foreground uppercase">Interesses</h4>
                  {lead.specialty_interest && (
                    <div className="text-sm">Especialidade: {lead.specialty_interest.name}</div>
                  )}
                  {lead.procedure_interest && (
                    <div className="text-sm">Procedimento: {lead.procedure_interest.name}</div>
                  )}
                </div>
              </>
            )}

            {/* Notes */}
            {lead.notes && (
              <>
                <Separator />
                <div className="space-y-2">
                  <h4 className="text-sm font-semibold text-muted-foreground uppercase">Observações</h4>
                  <p className="text-sm whitespace-pre-wrap">{lead.notes}</p>
                </div>
              </>
            )}

            <Separator />

            {/* Dates */}
            <div className="space-y-1 text-xs text-muted-foreground">
              <div>Criado em: {format(new Date(lead.created_at), "dd/MM/yyyy HH:mm", { locale: ptBR })}</div>
              <div>Atualizado em: {format(new Date(lead.updated_at), "dd/MM/yyyy HH:mm", { locale: ptBR })}</div>
            </div>

            <Separator />

            {/* Actions */}
            <div className="flex flex-col gap-2">
              <Button variant="outline" onClick={() => { onEdit(lead); onOpenChange(false); }}>
                <Edit className="h-4 w-4 mr-2" /> Editar
              </Button>
              <Button variant="outline" onClick={() => { onCreateOpportunity(lead); onOpenChange(false); }}>
                <Target className="h-4 w-4 mr-2" /> Criar Oportunidade
              </Button>
              {!alreadyConverted && lead.status !== "convertido" && (
                <Button variant="outline" onClick={() => setConvertOpen(true)}>
                  <UserCheck className="h-4 w-4 mr-2" /> Converter em Paciente
                </Button>
              )}
              {lead.status === "arquivado" ? (
                <Button variant="outline" onClick={handleReactivate} disabled={updateLead.isPending}>
                  <RotateCcw className="h-4 w-4 mr-2" /> Reativar
                </Button>
              ) : (
                <Button variant="outline" className="text-destructive" onClick={handleArchive} disabled={updateLead.isPending}>
                  <Archive className="h-4 w-4 mr-2" /> Arquivar
                </Button>
              )}
            </div>
          </div>
        </SheetContent>
      </Sheet>

      <LeadToPatientDialog open={convertOpen} onOpenChange={setConvertOpen} lead={lead} />
    </>
  );
}
