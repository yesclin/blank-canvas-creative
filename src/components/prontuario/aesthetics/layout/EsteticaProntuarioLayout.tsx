/**
 * EsteticaProntuarioLayout
 * 
 * Centralized layout for aesthetics specialty.
 * Prontuario.tsx delegates to this layout when activeSpecialtyKey === 'estetica'.
 */

import { AnamneseEsteticaBlock } from '../AnamneseEsteticaBlock';
import { AvaliacaoEsteticaBlock } from '../AvaliacaoEsteticaBlock';
import { VisaoGeralEsteticaBlock } from '../VisaoGeralEsteticaBlock';
import { EvolucoesEsteticaBlock } from '../EvolucoesEsteticaBlock';
import { ProdutosUtilizadosBlock } from '../ProdutosUtilizadosBlock';
import { AlertasEsteticaBlock } from '../AlertasEsteticaBlock';
import { TimelineEsteticaBlock } from '../TimelineEsteticaBlock';
import { FacialMapModule } from '../FacialMapModule';
import { BeforeAfterModule } from '../BeforeAfterModule';
import { ConsentModule } from '../ConsentModule';
import { Card, CardContent } from '@/components/ui/card';

export interface EsteticaLayoutProps {
  activeTab: string;
  patientId: string;
  clinicId: string | null;
  appointmentId?: string | null;
  canEdit: boolean;
  specialtyId: string | null;
  professionalId?: string | null;
  professionalName?: string | null;
  professionalRegistration?: string | null;
  patientName?: string;
  patientBirthDate?: string | null;
  patientPhone?: string | null;
  patientCpf?: string | null;
  onNavigateToModule?: (moduleKey: string) => void;
}

export function EsteticaProntuarioLayout({
  activeTab,
  patientId,
  clinicId,
  appointmentId,
  canEdit,
  specialtyId,
  professionalId,
  professionalName,
  professionalRegistration,
  patientName,
  patientBirthDate,
  patientPhone,
  patientCpf,
  onNavigateToModule,
}: EsteticaLayoutProps) {
  switch (activeTab) {
    case 'resumo':
      return (
        <VisaoGeralEsteticaBlock
          patientId={patientId}
          clinicId={clinicId}
          onNavigateToModule={onNavigateToModule}
        />
      );

    case 'anamnese':
      return (
        <AnamneseEsteticaBlock
          patientId={patientId}
          clinicId={clinicId}
          appointmentId={appointmentId}
          canEdit={canEdit}
          specialtyId={specialtyId}
          patientName={patientName}
          patientBirthDate={patientBirthDate}
          patientPhone={patientPhone}
          patientCpf={patientCpf}
          professionalName={professionalName}
          professionalRegistration={professionalRegistration}
        />
      );

    case 'exame_fisico':
      return (
        <AvaliacaoEsteticaBlock
          patientId={patientId}
          clinicId={clinicId}
          appointmentId={appointmentId}
          canEdit={canEdit}
        />
      );

    case 'evolucao':
      return (
        <EvolucoesEsteticaBlock
          patientId={patientId}
          appointmentId={appointmentId}
          canEdit={canEdit}
        />
      );

    case 'facial_map':
      return (
        <FacialMapModule
          patientId={patientId}
          appointmentId={appointmentId}
          canEdit={canEdit}
          professionalId={professionalId}
          specialtyKey="estetica"
        />
      );

    case 'before_after_photos':
      return (
        <BeforeAfterModule
          patientId={patientId}
          appointmentId={appointmentId}
          canEdit={canEdit}
        />
      );

    case 'produtos_utilizados':
      return (
        <ProdutosUtilizadosBlock
          patientId={patientId}
          appointmentId={appointmentId}
          canEdit={canEdit}
        />
      );

    case 'termos_consentimentos':
    case 'aesthetic_consent':
      return (
        <ConsentModule
          patientId={patientId}
          appointmentId={appointmentId}
          canEdit={canEdit}
        />
      );

    case 'alertas':
      return (
        <AlertasEsteticaBlock
          patientId={patientId}
          canEdit={canEdit}
        />
      );

    case 'historico':
    case 'timeline':
      return (
        <TimelineEsteticaBlock
          patientId={patientId}
        />
      );

    case 'procedimentos_realizados':
      return (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground">
              Os procedimentos realizados são registrados nas Evoluções.
            </p>
          </CardContent>
        </Card>
      );

    default:
      return (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground">Conteúdo da aba "{activeTab}" será exibido aqui.</p>
          </CardContent>
        </Card>
      );
  }
}
