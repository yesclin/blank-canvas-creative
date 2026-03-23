import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { 
  Phone, 
  Mail, 
  Calendar, 
  User, 
  AlertTriangle,
  Droplet,
  CreditCard
} from "lucide-react";
import { PatientSummary, PatientClinicalData, ClinicalAlert, alertSeverityConfig } from "@/types/prontuario";
import { format, differenceInYears, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";

interface PatientHeaderProps {
  patient: PatientSummary;
  clinicalData?: PatientClinicalData;
  alerts: ClinicalAlert[];
}

export function PatientHeader({ patient, clinicalData, alerts }: PatientHeaderProps) {
  const activeAlerts = alerts.filter(a => a.is_active);
  const criticalAlerts = activeAlerts.filter(a => a.severity === 'critical');
  
  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase();
  };

  const calculateAge = (birthDate: string) => {
    return differenceInYears(new Date(), parseISO(birthDate));
  };

  return (
    <Card className="border-l-4 border-l-primary">
      <CardContent className="p-4">
        {/* Alertas críticos no topo */}
        {criticalAlerts.length > 0 && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex items-center gap-2 text-red-700 font-medium mb-2">
              <AlertTriangle className="h-5 w-5" />
              <span>Alertas Críticos</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {criticalAlerts.map(alert => (
                <Badge 
                  key={alert.id} 
                  variant="destructive"
                  className="text-sm"
                >
                  {alert.title}
                </Badge>
              ))}
            </div>
          </div>
        )}

        <div className="flex flex-col lg:flex-row gap-4">
          {/* Avatar e info básica */}
          <div className="flex items-start gap-4">
            <Avatar className="h-16 w-16">
              <AvatarFallback className="text-lg bg-primary text-primary-foreground">
                {getInitials(patient.full_name)}
              </AvatarFallback>
            </Avatar>
            
            <div className="flex-1">
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-xl font-semibold text-foreground">
                  {patient.full_name}
                </h2>
                {activeAlerts.length > 0 && (
                  <Badge variant="outline" className="text-yellow-600 border-yellow-400">
                    <AlertTriangle className="h-3 w-3 mr-1" />
                    {activeAlerts.length} alerta(s)
                  </Badge>
                )}
              </div>
              
              <div className="flex flex-wrap gap-4 mt-2 text-sm text-muted-foreground">
                {patient.birth_date && (
                  <div className="flex items-center gap-1">
                    <Calendar className="h-4 w-4" />
                    <span>
                      {format(parseISO(patient.birth_date), "dd/MM/yyyy", { locale: ptBR })}
                      {" "}({calculateAge(patient.birth_date)} anos)
                    </span>
                  </div>
                )}
                {patient.gender && (
                  <div className="flex items-center gap-1">
                    <User className="h-4 w-4" />
                    <span>{patient.gender}</span>
                  </div>
                )}
                {clinicalData?.blood_type && (
                  <div className="flex items-center gap-1">
                    <Droplet className="h-4 w-4" />
                    <span>{clinicalData.blood_type}</span>
                  </div>
                )}
              </div>

              <div className="flex flex-wrap gap-4 mt-2 text-sm text-muted-foreground">
                {patient.phone && (
                  <div className="flex items-center gap-1">
                    <Phone className="h-4 w-4" />
                    <span>{patient.phone}</span>
                  </div>
                )}
                {patient.email && (
                  <div className="flex items-center gap-1">
                    <Mail className="h-4 w-4" />
                    <span>{patient.email}</span>
                  </div>
                )}
                {patient.cpf && (
                  <div className="flex items-center gap-1">
                    <CreditCard className="h-4 w-4" />
                    <span>{patient.cpf}</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Dados clínicos resumidos */}
          {clinicalData && (
            <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-3 lg:border-l lg:pl-4">
              {clinicalData.allergies.length > 0 && (
                <div>
                  <span className="text-xs font-medium text-muted-foreground uppercase">Alergias</span>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {clinicalData.allergies.map((allergy, idx) => (
                      <Badge key={idx} variant="destructive" className="text-xs">
                        {allergy}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
              
              {clinicalData.chronic_diseases.length > 0 && (
                <div>
                  <span className="text-xs font-medium text-muted-foreground uppercase">Doenças Crônicas</span>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {clinicalData.chronic_diseases.map((disease, idx) => (
                      <Badge key={idx} variant="secondary" className="text-xs">
                        {disease}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
              
              {clinicalData.current_medications.length > 0 && (
                <div>
                  <span className="text-xs font-medium text-muted-foreground uppercase">Medicamentos</span>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {clinicalData.current_medications.map((med, idx) => (
                      <Badge key={idx} variant="outline" className="text-xs">
                        {med}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
