import { useState, useCallback, useMemo, useEffect } from "react";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, CalendarPlus, Ban, Settings, Loader2, Users } from "lucide-react";
import type { SlotClickData } from "@/components/agenda/AgendaGrid";
import { useNavigate, useLocation } from "react-router-dom";
import { useAgendaRealData } from "@/hooks/useAgendaRealData";
import { useUpdateAppointmentStatus, useCreateAppointment, useRescheduleAppointment, type AppointmentFormData } from "@/hooks/useAppointments";
import { useTissGuideGeneration } from "@/hooks/useTissGuideGeneration";
import { usePermissions } from "@/hooks/usePermissions";
import { AgendaDateNavigation } from "@/components/agenda/AgendaDateNavigation";
import { AgendaSummarySheet } from "@/components/agenda/AgendaSummarySheet";
import { AgendaFiltersSheet } from "@/components/agenda/AgendaFiltersSheet";
import { AgendaGrid } from "@/components/agenda/AgendaGrid";
import { AgendaEmptyState } from "@/components/agenda/AgendaEmptyState";
import { ProfessionalTabs } from "@/components/agenda/ProfessionalTabs";
import { AppointmentDialog } from "@/components/agenda/AppointmentDialog";
import { BlockDialog } from "@/components/agenda/BlockDialog";
import { TissGuideGenerationDialog, GeneratedGuideData } from "@/components/agenda/TissGuideGenerationDialog";
import { AppointmentMaterialsDialog } from "@/components/agenda/AppointmentMaterialsDialog";
import { ProductSaleDialog } from "@/components/agenda/ProductSaleDialog";
import { AppointmentDetailDrawer } from "@/components/agenda/AppointmentDetailDrawer";
import { StockValidationDialog } from "@/components/agenda/StockValidationDialog";
import { PatientFormDialog } from "@/components/pacientes/PatientFormDialog";
import { useQueryClient } from "@tanstack/react-query";
import type { AgendaFilters as FiltersType, ViewMode, Appointment, AppointmentStatus } from "@/types/agenda";
import { toast } from "sonner";
import { validateProcedureStock, StockValidationResult } from "@/hooks/useProcedureStockValidation";
import { supabase } from "@/integrations/supabase/client";

export default function Agenda() {
  const navigate = useNavigate();
  const location = useLocation();
  const { role, professionalId: userProfessionalId } = usePermissions();
  
  // Check if navigated from patient profile with pre-selected patient
  const locationState = location.state as { patientId?: string; patientName?: string } | null;
  const [lockedPatientId, setLockedPatientId] = useState<string | undefined>(locationState?.patientId);
  const [lockedPatientName, setLockedPatientName] = useState<string | undefined>(locationState?.patientName);
  
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [viewMode, setViewMode] = useState<ViewMode>('daily');
  const [filters, setFilters] = useState<FiltersType>({
    startDate: new Date(),
    endDate: new Date(),
  });
  
  // Sheet states
  const [summarySheetOpen, setSummarySheetOpen] = useState(false);
  const [filtersSheetOpen, setFiltersSheetOpen] = useState(false);
  
  // Professional tabs state - null means "Todos"
  const [selectedProfessionalId, setSelectedProfessionalId] = useState<string | null>(null);
  
  // Dialogs
  const [appointmentDialogOpen, setAppointmentDialogOpen] = useState(false);
  const [appointmentDialogMode, setAppointmentDialogMode] = useState<'create' | 'fitIn' | 'reschedule'>('create');
  const [defaultStartTime, setDefaultStartTime] = useState<string | undefined>();
  const [defaultDialogDate, setDefaultDialogDate] = useState<Date | undefined>();
  const [blockDialogOpen, setBlockDialogOpen] = useState(false);
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | undefined>();
  const [detailDrawerOpen, setDetailDrawerOpen] = useState(false);
  const [detailAppointment, setDetailAppointment] = useState<Appointment | null>(null);
  
  // Patient creation from appointment dialog
  const [patientFormOpen, setPatientFormOpen] = useState(false);
  const queryClient = useQueryClient();
  
  // TISS Guide Generation
  const [tissDialogOpen, setTissDialogOpen] = useState(false);
  const { pendingAppointment, setPendingAppointment, generateGuide } = useTissGuideGeneration();
  
  // Material Consumption
  const [materialsDialogOpen, setMaterialsDialogOpen] = useState(false);
  const [finalizingAppointment, setFinalizingAppointment] = useState<Appointment | null>(null);
  
  // Product Sale
  const [saleDialogOpen, setSaleDialogOpen] = useState(false);
  const [saleAppointment, setSaleAppointment] = useState<Appointment | null>(null);
  
  // Stock Validation
  const [stockValidationDialogOpen, setStockValidationDialogOpen] = useState(false);
  const [stockValidationResult, setStockValidationResult] = useState<StockValidationResult | null>(null);
  const [pendingStatusChange, setPendingStatusChange] = useState<{ appointmentId: string; status: AppointmentStatus } | null>(null);
  
  // Real data from Supabase
  const { 
    specialties, 
    rooms, 
    professionals, 
    patients, 
    insurances, 
    appointments,
    scheduleBlocks,
    stats, 
    isLoading: dataLoading,
    refetchAppointments,
    clinicSchedule,
    professionalSchedules,
  } = useAgendaRealData(selectedDate, viewMode === 'timeline' ? 'daily' : viewMode);
  
  // Auto-open appointment dialog when navigated from patient profile
  useEffect(() => {
    if (locationState?.patientId) {
      setAppointmentDialogMode('create');
      setSelectedAppointment(undefined);
      setAppointmentDialogOpen(true);
      // Clear the navigation state so it doesn't re-trigger
      navigate(location.pathname, { replace: true, state: null });
    }
  }, []); // Run only once on mount

  // Mutations
  const updateStatusMutation = useUpdateAppointmentStatus();
  const createAppointmentMutation = useCreateAppointment();
  const rescheduleAppointmentMutation = useRescheduleAppointment();

  // RBAC: Profissional vê apenas sua própria aba
  const effectiveSelectedProfessionalId = role === 'profissional' && userProfessionalId
    ? userProfessionalId 
    : selectedProfessionalId;

  // Filter professionals based on role
  const visibleProfessionals = useMemo(() => {
    if (role === 'profissional' && userProfessionalId) {
      return professionals.filter(p => p.id === userProfessionalId);
    }
    return professionals;
  }, [professionals, role, userProfessionalId]);

  // Filter appointments
  const filteredAppointments = useMemo(() => {
    let result = appointments;
    
    if (effectiveSelectedProfessionalId) {
      result = result.filter(apt => apt.professional_id === effectiveSelectedProfessionalId);
    }
    
    if (filters.professionalId && !effectiveSelectedProfessionalId) {
      result = result.filter(apt => apt.professional_id === filters.professionalId);
    }
    if (filters.specialtyId) {
      result = result.filter(apt => apt.specialty_id === filters.specialtyId);
    }
    if (filters.roomId) {
      result = result.filter(apt => apt.room_id === filters.roomId);
    }
    if (filters.appointmentType) {
      result = result.filter(apt => apt.appointment_type === filters.appointmentType);
    }
    if (filters.status) {
      result = result.filter(apt => apt.status === filters.status);
    }
    
    return result;
  }, [appointments, effectiveSelectedProfessionalId, filters]);

  // Get selected professional name for empty state
  const selectedProfessionalName = effectiveSelectedProfessionalId
    ? professionals.find(p => p.id === effectiveSelectedProfessionalId)?.full_name
    : undefined;

  const openCreateDialog = (startTime?: string, date?: Date, professionalId?: string) => {
    setAppointmentDialogMode('create');
    setSelectedAppointment(undefined);
    setDefaultStartTime(startTime);
    setDefaultDialogDate(date);
    if (professionalId && !effectiveSelectedProfessionalId) {
      setSelectedProfessionalId(professionalId);
    }
    setAppointmentDialogOpen(true);
  };

  const openFitInDialog = () => {
    setAppointmentDialogMode('fitIn');
    setSelectedAppointment(undefined);
    setAppointmentDialogOpen(true);
  };

  const handleReschedule = (apt: Appointment) => {
    setAppointmentDialogMode('reschedule');
    setSelectedAppointment(apt);
    setAppointmentDialogOpen(true);
  };

  // Navigate to prontuário when starting an appointment
  const navigateToProntuario = useCallback((patientId: string) => {
    navigate(`/app/prontuario/${patientId}`);
  }, [navigate]);

  // Handle status change with stock validation and material consumption
  // Resolve specialty for an appointment: appointment.specialty_id → procedure.specialty_id → professional's specialty
  const resolveSpecialtyId = useCallback(async (apt: Appointment): Promise<string | null> => {
    // 1. Direct specialty on appointment
    if (apt.specialty_id) return apt.specialty_id;

    // 2. From procedure
    if (apt.procedure_id) {
      const { data } = await supabase
        .from('procedures')
        .select('specialty_id')
        .eq('id', apt.procedure_id)
        .single();
      if (data?.specialty_id) return data.specialty_id;
    }

    // 3. From professional
    const { data: prof } = await supabase
      .from('professionals')
      .select('specialty_id')
      .eq('id', apt.professional_id)
      .single();
    if (prof?.specialty_id) return prof.specialty_id;

    return null;
  }, []);

  // Handle status change with stock validation and material consumption
  const handleStatusChange = useCallback(async (appointmentId: string, newStatus: AppointmentStatus) => {
    const apt = appointments.find(a => a.id === appointmentId);
    if (!apt) return;

    // ── Specialty validation before starting appointment ──
    if (newStatus === 'em_atendimento') {
      const resolvedSpecialtyId = await resolveSpecialtyId(apt);
      if (!resolvedSpecialtyId) {
        toast.error('Especialidade não definida para este atendimento. Defina uma especialidade no agendamento, procedimento ou profissional antes de iniciar.');
        return;
      }

      // Save specialty_id on the appointment if not already set
      if (!apt.specialty_id) {
        const { error: specError } = await supabase
          .from('appointments')
          .update({ specialty_id: resolvedSpecialtyId })
          .eq('id', appointmentId);
        if (specError) {
          console.error('Error saving specialty on appointment:', specError);
          toast.error('Erro ao vincular especialidade ao atendimento');
          return;
        }
      }
    }
    
    if (newStatus === 'em_atendimento' && apt.procedure_id) {
      try {
        const validation = await validateProcedureStock(apt.procedure_id);
        if (!validation.isValid) {
          setStockValidationResult(validation);
          setPendingStatusChange({ appointmentId, status: newStatus });
          setStockValidationDialogOpen(true);
          return;
        }
      } catch (error) {
        console.error("Error validating stock:", error);
        toast.error("Erro ao validar estoque do procedimento");
        return;
      }
    }
    
    if (newStatus === 'finalizado') {
      setFinalizingAppointment(apt);
      setMaterialsDialogOpen(true);
    } else if (newStatus === 'em_atendimento') {
      try {
        await updateStatusMutation.mutateAsync({ id: appointmentId, status: newStatus });
        if (apt.patient_id) {
          navigateToProntuario(apt.patient_id);
        }
      } catch (error) {
        console.error("Error updating status:", error);
      }
    } else {
      updateStatusMutation.mutate({ id: appointmentId, status: newStatus });
    }
  }, [appointments, navigateToProntuario, updateStatusMutation, resolveSpecialtyId]);

  // Stock validation handlers
  const handleStockValidationConfirm = useCallback(async () => {
    setStockValidationDialogOpen(false);
    
    if (pendingStatusChange) {
      toast.warning("Atenção: Estoque ficará negativo após consumo dos materiais");
      
      try {
        await updateStatusMutation.mutateAsync({ 
          id: pendingStatusChange.appointmentId, 
          status: pendingStatusChange.status 
        });
        
        if (pendingStatusChange.status === 'em_atendimento') {
          const apt = appointments.find(a => a.id === pendingStatusChange.appointmentId);
          if (apt?.patient_id) {
            navigateToProntuario(apt.patient_id);
          }
        }
      } catch (error) {
        console.error("Error updating status:", error);
      }
    }
    
    setStockValidationResult(null);
    setPendingStatusChange(null);
  }, [pendingStatusChange, appointments, navigateToProntuario, updateStatusMutation]);

  const handleStockValidationCancel = useCallback(() => {
    setStockValidationDialogOpen(false);
    setStockValidationResult(null);
    setPendingStatusChange(null);
    toast.info("Atendimento não iniciado. Reponha o estoque antes de continuar.");
  }, []);

  // Materials handlers
  const handleMaterialsConfirm = useCallback(async () => {
    setMaterialsDialogOpen(false);
    
    if (!finalizingAppointment) return;
    
    try {
      await updateStatusMutation.mutateAsync({ 
        id: finalizingAppointment.id, 
        status: 'finalizado' 
      });
      
      if (finalizingAppointment.payment_type === 'convenio' && finalizingAppointment.insurance) {
        const finalizedApt: Appointment = { ...finalizingAppointment, status: 'finalizado' };
        setPendingAppointment(finalizedApt);
        setTissDialogOpen(true);
      }
    } catch (error) {
      console.error("Error finalizing appointment:", error);
    }
    
    setFinalizingAppointment(null);
  }, [finalizingAppointment, setPendingAppointment, updateStatusMutation]);

  const handleMaterialsCancel = useCallback(() => {
    setMaterialsDialogOpen(false);
    setFinalizingAppointment(null);
  }, []);

  const handleTissGuideConfirm = useCallback(async (guideData: GeneratedGuideData) => {
    await generateGuide(guideData);
    setPendingAppointment(null);
  }, [generateGuide, setPendingAppointment]);

  const handleTissGuideSkip = useCallback(() => {
    setPendingAppointment(null);
  }, [setPendingAppointment]);

  const handleProfessionalTabChange = useCallback((professionalId: string | null) => {
    setSelectedProfessionalId(professionalId);
    if (filters.professionalId) {
      setFilters(prev => ({ ...prev, professionalId: undefined }));
    }
  }, [filters.professionalId]);

  const handleSlotClick = useCallback((data: SlotClickData) => {
    openCreateDialog(data.time, data.date, data.professionalId);
  }, [effectiveSelectedProfessionalId]);

  const handleLaunchSale = useCallback((apt: Appointment) => {
    if (!apt.patient) {
      toast.error("Agendamento sem paciente vinculado");
      return;
    }
    setSaleAppointment(apt);
    setSaleDialogOpen(true);
  }, []);

  const handleAppointmentSubmit = useCallback((data: {
    patient_id?: string;
    professional_id?: string;
    procedure_id?: string;
    specialty_id?: string;
    room_id?: string;
    scheduled_date?: Date;
    start_time?: string;
    duration_minutes?: string;
    appointment_type?: string;
    payment_type?: string;
    insurance_id?: string;
    expected_value?: number;
    notes?: string;
    is_fit_in?: boolean;
  }) => {
    // If reschedule mode, use the reschedule mutation (only update date/time/duration/room)
    if (appointmentDialogMode === 'reschedule' && selectedAppointment) {
      rescheduleAppointmentMutation.mutate({
        id: selectedAppointment.id,
        scheduled_date: data.scheduled_date || new Date(),
        start_time: data.start_time || '08:00',
        duration_minutes: parseInt(data.duration_minutes || '30'),
        room_id: data.room_id || null,
      }, {
        onSuccess: () => {
          setAppointmentDialogOpen(false);
          refetchAppointments();
        },
      });
      return;
    }

    const formData: AppointmentFormData = {
      patient_id: data.patient_id || '',
      professional_id: data.professional_id || '',
      scheduled_date: data.scheduled_date || new Date(),
      start_time: data.start_time || '08:00',
      duration_minutes: parseInt(data.duration_minutes || '30'),
      appointment_type: (data.appointment_type || 'consulta') as 'consulta' | 'retorno' | 'procedimento',
      payment_type: data.payment_type || 'particular',
      specialty_id: data.specialty_id,
      room_id: data.room_id,
      insurance_id: data.insurance_id,
      procedure_id: data.procedure_id,
      notes: data.notes,
      is_fit_in: data.is_fit_in,
    };
    
    createAppointmentMutation.mutate(formData, {
      onSuccess: () => {
        setAppointmentDialogOpen(false);
        refetchAppointments();
      },
    });
  }, [appointmentDialogMode, selectedAppointment, createAppointmentMutation, rescheduleAppointmentMutation, refetchAppointments]);

  // Default to logged-in user's professional ID if no tab selected
  const lockedProfessionalIdForDialog = effectiveSelectedProfessionalId || userProfessionalId || undefined;

  // Count active filters
  const activeFiltersCount = [
    filters.professionalId,
    filters.specialtyId,
    filters.roomId,
    filters.appointmentType,
    filters.status,
  ].filter(Boolean).length;

  return (
    <div className="space-y-4">
      {/* Simplified Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Agenda</h1>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={openFitInDialog}>
            <CalendarPlus className="mr-2 h-4 w-4" />
            <span className="hidden sm:inline">Encaixe</span>
          </Button>
          <Button size="sm" onClick={() => openCreateDialog()}>
            <Plus className="mr-2 h-4 w-4" />
            <span className="hidden sm:inline">Novo</span>
          </Button>
        </div>
      </div>

      {/* Main Tabs - Simplified */}
      <Tabs defaultValue="agenda" className="space-y-4">
        <div className="flex items-center justify-between">
          <TabsList>
            <TabsTrigger value="agenda">Agenda</TabsTrigger>
            <TabsTrigger value="sala-espera">
              <Users className="h-4 w-4 sm:mr-1" />
              <span className="hidden sm:inline">Sala de Espera</span>
            </TabsTrigger>
            <TabsTrigger value="bloqueios">
              <Ban className="h-4 w-4 sm:mr-1" />
              <span className="hidden sm:inline">Bloqueios</span>
            </TabsTrigger>
          </TabsList>
          
          {/* Settings Icon - Separate */}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate('/app/config/agenda')}
            className="h-9 w-9"
          >
            <Settings className="h-4 w-4" />
          </Button>
        </div>

        <TabsContent value="agenda" className="space-y-4">
          {dataLoading && (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <span className="ml-2 text-muted-foreground">Carregando agenda...</span>
            </div>
          )}
          
          {!dataLoading && (
            <>
              {/* Date Navigation + On-Demand Controls */}
              <div className="flex flex-col gap-4">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                  <AgendaDateNavigation
                    selectedDate={selectedDate}
                    onDateChange={setSelectedDate}
                    viewMode={viewMode}
                    onViewModeChange={setViewMode}
                  />
                  
                  {/* On-Demand Buttons */}
                  <div className="flex items-center gap-2">
                    <AgendaSummarySheet 
                      stats={stats} 
                      open={summarySheetOpen} 
                      onOpenChange={setSummarySheetOpen} 
                    />
                    <AgendaFiltersSheet
                      filters={filters}
                      onFiltersChange={setFilters}
                      professionals={visibleProfessionals}
                      specialties={specialties}
                      rooms={rooms}
                      open={filtersSheetOpen}
                      onOpenChange={setFiltersSheetOpen}
                    />
                  </div>
                </div>

                {/* Active Filters Indicator */}
                {activeFiltersCount > 0 && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <span className="text-primary font-medium">{activeFiltersCount} filtro(s) ativo(s)</span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setFilters({ startDate: new Date(), endDate: new Date() })}
                      className="h-6 px-2 text-xs"
                    >
                      Limpar
                    </Button>
                  </div>
                )}
              </div>

              {/* Professional Tabs */}
              {(role !== 'profissional' || visibleProfessionals.length > 1) && (
                <ProfessionalTabs
                  professionals={visibleProfessionals}
                  selectedProfessionalId={effectiveSelectedProfessionalId}
                  onSelectProfessional={handleProfessionalTabChange}
                  maxVisibleTabs={5}
                />
              )}

              {/* Agenda Grid - always show to allow clicking free slots */}
              <AgendaGrid
                appointments={filteredAppointments}
                scheduleBlocks={scheduleBlocks}
                viewMode={viewMode}
                groupBy={effectiveSelectedProfessionalId ? 'general' : 'professional'}
                selectedDate={selectedDate}
                professionals={visibleProfessionals}
                rooms={rooms}
                specialties={specialties}
                onAppointmentClick={(apt) => {
                  setDetailAppointment(apt);
                  setDetailDrawerOpen(true);
                }}
                onReschedule={handleReschedule}
                onStatusChange={handleStatusChange}
                onLaunchSale={handleLaunchSale}
                onSlotClick={handleSlotClick}
              />
            </>
          )}
        </TabsContent>

        <TabsContent value="sala-espera">
          <WaitingRoomContent 
            appointments={appointments.filter(a => 
              a.scheduled_date === format(new Date(), 'yyyy-MM-dd') &&
              ['chegou', 'em_atendimento'].includes(a.status)
            )}
            onStatusChange={handleStatusChange}
          />
        </TabsContent>

        <TabsContent value="bloqueios">
          <div className="text-center py-12 text-muted-foreground">
            <Ban className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>Nenhum bloqueio configurado</p>
            <Button variant="outline" className="mt-4" onClick={() => setBlockDialogOpen(true)}>
              Criar Bloqueio
            </Button>
          </div>
        </TabsContent>
      </Tabs>

      {/* Appointment Detail Drawer */}
      <AppointmentDetailDrawer
        appointment={detailAppointment}
        open={detailDrawerOpen}
        onOpenChange={setDetailDrawerOpen}
        onStatusChange={(id, status) => {
          setDetailDrawerOpen(false);
          handleStatusChange(id, status);
        }}
        onReschedule={(apt) => {
          setDetailDrawerOpen(false);
          handleReschedule(apt);
        }}
        onLaunchSale={(apt) => {
          setDetailDrawerOpen(false);
          handleLaunchSale(apt);
        }}
        onStartAtendimento={(apt) => {
          setDetailDrawerOpen(false);
          handleStatusChange(apt.id, 'em_atendimento');
        }}
      />

      {/* Dialogs */}
      <AppointmentDialog
        open={appointmentDialogOpen}
        onOpenChange={(open) => {
          setAppointmentDialogOpen(open);
          if (!open) {
            setLockedPatientId(undefined);
            setLockedPatientName(undefined);
          }
        }}
        lockedPatientId={lockedPatientId}
        lockedPatientName={lockedPatientName}
        mode={appointmentDialogMode}
        professionals={professionals}
        patients={patients}
        rooms={rooms}
        specialties={specialties}
        insurances={insurances}
        appointment={selectedAppointment}
        defaultDate={defaultDialogDate || selectedDate}
        defaultStartTime={defaultStartTime}
        lockedProfessionalId={lockedProfessionalIdForDialog}
        existingAppointments={appointments}
        clinicSchedule={clinicSchedule}
        professionalSchedules={professionalSchedules}
        onSubmit={handleAppointmentSubmit}
        onCreatePatient={() => setPatientFormOpen(true)}
      />

      {/* Patient Form Dialog (from appointment) */}
      <PatientFormDialog
        open={patientFormOpen}
        onOpenChange={setPatientFormOpen}
        insurances={insurances.map(i => ({ id: i.id, name: i.name }))}
        onSave={() => {
          setPatientFormOpen(false);
          queryClient.invalidateQueries({ queryKey: ["patients-list"] });
          toast.success("Paciente cadastrado! Busque novamente no campo de paciente.");
        }}
      />

      <BlockDialog
        open={blockDialogOpen}
        onOpenChange={setBlockDialogOpen}
      />

      <TissGuideGenerationDialog
        open={tissDialogOpen}
        onOpenChange={setTissDialogOpen}
        appointment={pendingAppointment}
        onConfirm={handleTissGuideConfirm}
        onSkip={handleTissGuideSkip}
      />

      <AppointmentMaterialsDialog
        open={materialsDialogOpen}
        onOpenChange={setMaterialsDialogOpen}
        appointmentId={finalizingAppointment?.id || ''}
        procedureName={finalizingAppointment?.procedure?.name}
        onConfirm={handleMaterialsConfirm}
        onCancel={handleMaterialsCancel}
      />

      <StockValidationDialog
        open={stockValidationDialogOpen}
        onOpenChange={setStockValidationDialogOpen}
        validationResult={stockValidationResult}
        onConfirm={handleStockValidationConfirm}
        onCancel={handleStockValidationCancel}
      />

      {saleAppointment && saleAppointment.patient && (
        <ProductSaleDialog
          open={saleDialogOpen}
          onOpenChange={setSaleDialogOpen}
          patientId={saleAppointment.patient_id}
          patientName={saleAppointment.patient.full_name}
          appointmentId={saleAppointment.id}
          onSuccess={() => setSaleAppointment(null)}
        />
      )}
    </div>
  );
}

// Waiting Room inline component
interface WaitingRoomContentProps {
  appointments: Appointment[];
  onStatusChange?: (id: string, status: AppointmentStatus) => void;
}

function WaitingRoomContent({ appointments, onStatusChange }: WaitingRoomContentProps) {
  const waiting = appointments.filter(a => a.status === 'chegou');
  const inProgress = appointments.filter(a => a.status === 'em_atendimento');

  return (
    <div className="grid md:grid-cols-2 gap-6">
      <div className="border rounded-lg p-4">
        <h3 className="font-semibold mb-4 flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-warning" />
          Aguardando ({waiting.length})
        </h3>
        <div className="space-y-3">
          {waiting.length === 0 ? (
            <p className="text-muted-foreground text-sm">Nenhum paciente aguardando</p>
          ) : (
            waiting.map(apt => (
              <div key={apt.id} className="flex items-center justify-between p-3 border rounded-lg">
                <div>
                  <p className="font-medium">{apt.patient?.full_name}</p>
                  <p className="text-sm text-muted-foreground">
                    {apt.start_time.slice(0, 5)} • {apt.professional?.full_name}
                  </p>
                </div>
                <Button 
                  size="sm"
                  onClick={() => onStatusChange?.(apt.id, 'em_atendimento')}
                >
                  Iniciar
                </Button>
              </div>
            ))
          )}
        </div>
      </div>

      <div className="border rounded-lg p-4">
        <h3 className="font-semibold mb-4 flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-primary" />
          Em Atendimento ({inProgress.length})
        </h3>
        <div className="space-y-3">
          {inProgress.length === 0 ? (
            <p className="text-muted-foreground text-sm">Nenhum atendimento em andamento</p>
          ) : (
            inProgress.map(apt => (
              <div key={apt.id} className="flex items-center justify-between p-3 border rounded-lg">
                <div>
                  <p className="font-medium">{apt.patient?.full_name}</p>
                  <p className="text-sm text-muted-foreground">
                    {apt.professional?.full_name}
                  </p>
                </div>
                <Button 
                  size="sm" 
                  variant="outline"
                  onClick={() => onStatusChange?.(apt.id, 'finalizado')}
                >
                  Finalizar
                </Button>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
