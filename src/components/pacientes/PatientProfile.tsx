import { useState } from 'react';
import { format, parseISO, differenceInYears } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import {
  ArrowLeft,
  Edit,
  Calendar,
  FileText,
  Phone,
  Mail,
  MapPin,
  Building2,
  AlertTriangle,
  User,
  Clock,
  ChevronRight,
  Paperclip,
  Download,
  Trash2,
  Upload,
  Eye,
  Users,
  Heart,
  Pill,
  Activity,
  ShoppingCart,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import type { Patient, PatientAppointmentHistory, PatientAttachment } from '@/types/pacientes';
import { genderLabels } from '@/types/pacientes';
import { PatientSalesHistory } from './PatientSalesHistory';

interface PatientProfileProps {
  patient: Patient;
  appointmentHistory: PatientAppointmentHistory[];
  attachments: PatientAttachment[];
  onBack: () => void;
  onEdit: () => void;
  onScheduleAppointment: () => void;
  onOpenProntuario: () => void;
}

export function PatientProfile({
  patient,
  appointmentHistory,
  attachments,
  onBack,
  onEdit,
  onScheduleAppointment,
  onOpenProntuario,
}: PatientProfileProps) {
  const [activeTab, setActiveTab] = useState('dados');

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .slice(0, 2)
      .map(n => n[0])
      .join('')
      .toUpperCase();
  };

  const calculateAge = (birthDate: string | null) => {
    if (!birthDate) return null;
    return differenceInYears(new Date(), parseISO(birthDate));
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return '-';
    return format(parseISO(dateString), 'dd/MM/yyyy', { locale: ptBR });
  };

  const formatDateTime = (dateString: string) => {
    return format(parseISO(dateString), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR });
  };

  const age = calculateAge(patient.birth_date);

  const statusColors: Record<string, string> = {
    finalizado: 'bg-green-500/10 text-green-700 border-green-500/20',
    agendado: 'bg-blue-500/10 text-blue-700 border-blue-500/20',
    faltou: 'bg-red-500/10 text-red-700 border-red-500/20',
    cancelado: 'bg-muted text-muted-foreground',
  };

  const statusLabels: Record<string, string> = {
    finalizado: 'Finalizado',
    agendado: 'Agendado',
    faltou: 'Faltou',
    cancelado: 'Cancelado',
  };

  const categoryLabels: Record<string, string> = {
    document: 'Documento',
    exam: 'Exame',
    image: 'Imagem',
    other: 'Outro',
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-start gap-4">
        <Button variant="ghost" size="icon" onClick={onBack}>
          <ArrowLeft className="h-5 w-5" />
        </Button>

        <div className="flex-1 flex flex-col sm:flex-row sm:items-start gap-4">
          <Avatar className="h-20 w-20">
            <AvatarFallback className="bg-primary/10 text-primary font-semibold text-xl">
              {getInitials(patient.full_name)}
            </AvatarFallback>
          </Avatar>

          <div className="flex-1 space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-2xl font-bold">{patient.full_name}</h1>
              {patient.has_clinical_alert && (
                <Badge className="bg-amber-500/10 text-amber-700 border-amber-500/20">
                  <AlertTriangle className="h-3 w-3 mr-1" />
                  Alerta Clínico
                </Badge>
              )}
              {!patient.is_active && (
                <Badge variant="secondary">Inativo</Badge>
              )}
            </div>

            <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
              {patient.cpf && <span>{patient.cpf}</span>}
              {patient.birth_date && (
                <>
                  <span>•</span>
                  <span>{formatDate(patient.birth_date)} ({age} anos)</span>
                </>
              )}
              {patient.gender && (
                <>
                  <span>•</span>
                  <span>{genderLabels[patient.gender]}</span>
                </>
              )}
            </div>

            <div className="flex flex-wrap items-center gap-4 text-sm">
              {patient.phone && (
                <div className="flex items-center gap-1.5">
                  <Phone className="h-4 w-4 text-muted-foreground" />
                  <span>{patient.phone}</span>
                </div>
              )}
              {patient.email && (
                <div className="flex items-center gap-1.5">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  <span>{patient.email}</span>
                </div>
              )}
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <Button variant="outline" onClick={onEdit}>
              <Edit className="h-4 w-4 mr-2" />
              Editar
            </Button>
            <Button variant="outline" onClick={onScheduleAppointment}>
              <Calendar className="h-4 w-4 mr-2" />
              Agendar
            </Button>
            <Button onClick={onOpenProntuario}>
              <FileText className="h-4 w-4 mr-2" />
              Prontuário
            </Button>
          </div>
        </div>
      </div>

      {/* Clinical Alert Banner */}
      {patient.has_clinical_alert && patient.clinical_alert_text && (
        <div className="p-4 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900 rounded-lg flex items-start gap-3">
          <AlertTriangle className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-medium text-amber-800 dark:text-amber-200">Alerta Clínico</p>
            <p className="text-sm text-amber-700 dark:text-amber-300">{patient.clinical_alert_text}</p>
          </div>
        </div>
      )}

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="flex-wrap h-auto gap-1">
          <TabsTrigger value="dados">
            <User className="h-4 w-4 mr-2" />
            Dados Gerais
          </TabsTrigger>
          <TabsTrigger value="historico">
            <Clock className="h-4 w-4 mr-2" />
            Histórico
          </TabsTrigger>
          <TabsTrigger value="vendas">
            <ShoppingCart className="h-4 w-4 mr-2" />
            Vendas
          </TabsTrigger>
          <TabsTrigger value="prontuario">
            <FileText className="h-4 w-4 mr-2" />
            Prontuário
          </TabsTrigger>
          <TabsTrigger value="anexos">
            <Paperclip className="h-4 w-4 mr-2" />
            Anexos ({attachments.length})
          </TabsTrigger>
        </TabsList>

        <ScrollArea className="h-[calc(100vh-380px)] mt-4">
          {/* Dados Gerais Tab */}
          <TabsContent value="dados" className="m-0 space-y-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {/* Contact Card */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Phone className="h-4 w-4" />
                    Contato
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {patient.phone && (
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Telefone</span>
                      <span className="text-sm font-medium">{patient.phone}</span>
                    </div>
                  )}
                  {patient.email && (
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">E-mail</span>
                      <span className="text-sm font-medium">{patient.email}</span>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Address Card */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2">
                    <MapPin className="h-4 w-4" />
                    Endereço
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {patient.address_street ? (
                    <p className="text-sm">
                      {patient.address_street}, {patient.address_number}
                      {patient.address_complement && ` - ${patient.address_complement}`}
                      <br />
                      {patient.address_neighborhood} - {patient.address_city}/{patient.address_state}
                      <br />
                      CEP: {patient.address_zip}
                    </p>
                  ) : (
                    <p className="text-sm text-muted-foreground">Endereço não informado</p>
                  )}
                </CardContent>
              </Card>

              {/* Insurance Card */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Building2 className="h-4 w-4" />
                    Convênio
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {patient.insurance ? (
                    <>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">Operadora</span>
                        <span className="text-sm font-medium">{patient.insurance.insurance_name}</span>
                      </div>
                      {patient.insurance.plan_name && (
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-muted-foreground">Plano</span>
                          <span className="text-sm font-medium">{patient.insurance.plan_name}</span>
                        </div>
                      )}
                      {patient.insurance.card_number && (
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-muted-foreground">Carteirinha</span>
                          <span className="text-sm font-medium">{patient.insurance.card_number}</span>
                        </div>
                      )}
                      {patient.insurance.valid_until && (
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-muted-foreground">Validade</span>
                          <span className="text-sm font-medium">{formatDate(patient.insurance.valid_until)}</span>
                        </div>
                      )}
                    </>
                  ) : (
                    <Badge variant="secondary">Particular</Badge>
                  )}
                </CardContent>
              </Card>

              {/* Guardian Card */}
              {patient.guardian && (
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base flex items-center gap-2">
                      <Users className="h-4 w-4" />
                      Responsável Legal
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Nome</span>
                      <span className="text-sm font-medium">{patient.guardian.full_name}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Parentesco</span>
                      <span className="text-sm font-medium">{patient.guardian.relationship}</span>
                    </div>
                    {patient.guardian.phone && (
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">Telefone</span>
                        <span className="text-sm font-medium">{patient.guardian.phone}</span>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}
            </div>

            {/* Clinical Summary */}
            {patient.clinical_data && (
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Activity className="h-4 w-4" />
                    Resumo Clínico
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-sm font-medium">
                        <Heart className="h-4 w-4 text-red-500" />
                        Alergias
                      </div>
                      {patient.clinical_data.allergies.length > 0 ? (
                        <div className="flex flex-wrap gap-1">
                          {patient.clinical_data.allergies.map((allergy, i) => (
                            <Badge key={i} variant="secondary" className="bg-red-500/10 text-red-700 border-red-500/20">
                              {allergy}
                            </Badge>
                          ))}
                        </div>
                      ) : (
                        <p className="text-sm text-muted-foreground">Nenhuma</p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-sm font-medium">
                        <Activity className="h-4 w-4 text-amber-500" />
                        Doenças Crônicas
                      </div>
                      {patient.clinical_data.chronic_diseases.length > 0 ? (
                        <div className="flex flex-wrap gap-1">
                          {patient.clinical_data.chronic_diseases.map((disease, i) => (
                            <Badge key={i} variant="secondary" className="bg-amber-500/10 text-amber-700 border-amber-500/20">
                              {disease}
                            </Badge>
                          ))}
                        </div>
                      ) : (
                        <p className="text-sm text-muted-foreground">Nenhuma</p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-sm font-medium">
                        <Pill className="h-4 w-4 text-blue-500" />
                        Medicamentos em Uso
                      </div>
                      {patient.clinical_data.current_medications.length > 0 ? (
                        <div className="flex flex-wrap gap-1">
                          {patient.clinical_data.current_medications.map((med, i) => (
                            <Badge key={i} variant="secondary" className="bg-blue-500/10 text-blue-700 border-blue-500/20">
                              {med}
                            </Badge>
                          ))}
                        </div>
                      ) : (
                        <p className="text-sm text-muted-foreground">Nenhum</p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-sm font-medium">
                        Tipo Sanguíneo
                      </div>
                      <p className="text-sm">
                        {patient.clinical_data.blood_type || 'Não informado'}
                      </p>
                    </div>
                  </div>

                  {patient.clinical_data.clinical_restrictions && (
                    <div className="mt-4 pt-4 border-t">
                      <p className="text-sm font-medium mb-2">Restrições Clínicas</p>
                      <p className="text-sm text-muted-foreground">
                        {patient.clinical_data.clinical_restrictions}
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Histórico Tab */}
          <TabsContent value="historico" className="m-0">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Histórico de Atendimentos</CardTitle>
              </CardHeader>
              <CardContent>
                {appointmentHistory.length > 0 ? (
                  <div className="space-y-3">
                    {appointmentHistory.map((appointment) => (
                      <div
                        key={appointment.id}
                        className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/30 transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          <div className="text-center min-w-[50px]">
                            <p className="text-lg font-semibold">
                              {format(parseISO(appointment.scheduled_date), 'dd', { locale: ptBR })}
                            </p>
                            <p className="text-xs text-muted-foreground uppercase">
                              {format(parseISO(appointment.scheduled_date), 'MMM', { locale: ptBR })}
                            </p>
                          </div>
                          <Separator orientation="vertical" className="h-10" />
                          <div>
                            <p className="font-medium">{appointment.professional_name}</p>
                            <p className="text-sm text-muted-foreground">
                              {appointment.specialty_name}
                              {appointment.procedure_name && ` • ${appointment.procedure_name}`}
                            </p>
                            <p className="text-xs text-muted-foreground mt-1">
                              {appointment.start_time}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <Badge className={statusColors[appointment.status]}>
                            {statusLabels[appointment.status]}
                          </Badge>
                          <Button variant="ghost" size="icon">
                            <ChevronRight className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Clock className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
                    <p className="text-muted-foreground">Nenhum atendimento registrado</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Vendas Tab */}
          <TabsContent value="vendas" className="m-0">
            <PatientSalesHistory patientId={patient.id} />
          </TabsContent>

          {/* Prontuário Tab */}
          <TabsContent value="prontuario" className="m-0">
            <Card>
              <CardContent className="py-12 text-center">
                <FileText className="h-16 w-16 mx-auto text-muted-foreground/50 mb-4" />
                <h3 className="text-lg font-medium mb-2">Prontuário do Paciente</h3>
                <p className="text-muted-foreground mb-4">
                  Acesse o prontuário completo com todas as evoluções clínicas,
                  alertas e documentos médicos.
                </p>
                <Button onClick={onOpenProntuario}>
                  <FileText className="h-4 w-4 mr-2" />
                  Acessar Prontuário Completo
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Anexos Tab */}
          <TabsContent value="anexos" className="m-0">
            <Card>
              <CardHeader className="pb-3 flex flex-row items-center justify-between">
                <CardTitle className="text-base">Anexos do Paciente</CardTitle>
                <Button size="sm">
                  <Upload className="h-4 w-4 mr-2" />
                  Upload
                </Button>
              </CardHeader>
              <CardContent>
                {attachments.length > 0 ? (
                  <div className="space-y-2">
                    {attachments.map((attachment) => (
                      <div
                        key={attachment.id}
                        className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/30 transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-muted rounded">
                            <Paperclip className="h-4 w-4" />
                          </div>
                          <div>
                            <p className="font-medium text-sm">{attachment.file_name}</p>
                            <div className="flex items-center gap-2 text-xs text-muted-foreground">
                              <Badge variant="outline" className="text-xs">
                                {categoryLabels[attachment.category]}
                              </Badge>
                              <span>•</span>
                              <span>{formatDateTime(attachment.created_at)}</span>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-1">
                          <Button variant="ghost" size="icon">
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon">
                            <Download className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon" className="text-destructive">
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Paperclip className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
                    <p className="text-muted-foreground">Nenhum anexo encontrado</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </ScrollArea>
      </Tabs>
    </div>
  );
}
