import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { 
  User, 
  Phone, 
  Mail, 
  Edit,
  Heart,
  Pill,
  AlertTriangle,
  Droplet,
  Users,
  FileText
} from "lucide-react";
import { PatientClinicalData, PatientGuardian } from "@/types/prontuario";

interface ClinicalDataCardProps {
  clinicalData: PatientClinicalData;
  guardians: PatientGuardian[];
  onEdit?: () => void;
}

export function ClinicalDataCard({ clinicalData, guardians, onEdit }: ClinicalDataCardProps) {
  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Dados Clínicos
          </CardTitle>
          <Button variant="outline" size="sm" onClick={onEdit}>
            <Edit className="h-4 w-4 mr-1" />
            Editar
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Tipo Sanguíneo */}
        {clinicalData.blood_type && (
          <div className="flex items-center gap-2">
            <Droplet className="h-4 w-4 text-red-500" />
            <span className="text-sm font-medium">Tipo Sanguíneo:</span>
            <Badge variant="secondary">{clinicalData.blood_type}</Badge>
          </div>
        )}

        <Separator />

        {/* Alergias */}
        <div>
          <div className="flex items-center gap-2 mb-2">
            <AlertTriangle className="h-4 w-4 text-red-500" />
            <span className="text-sm font-medium">Alergias</span>
          </div>
          {clinicalData.allergies.length > 0 ? (
            <div className="flex flex-wrap gap-1">
              {clinicalData.allergies.map((allergy, idx) => (
                <Badge key={idx} variant="destructive" className="text-xs">
                  {allergy}
                </Badge>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">Nenhuma alergia informada</p>
          )}
        </div>

        <Separator />

        {/* Doenças Crônicas */}
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Heart className="h-4 w-4 text-pink-500" />
            <span className="text-sm font-medium">Doenças Crônicas</span>
          </div>
          {clinicalData.chronic_diseases.length > 0 ? (
            <div className="flex flex-wrap gap-1">
              {clinicalData.chronic_diseases.map((disease, idx) => (
                <Badge key={idx} variant="secondary" className="text-xs">
                  {disease}
                </Badge>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">Nenhuma doença crônica informada</p>
          )}
        </div>

        <Separator />

        {/* Medicamentos em Uso */}
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Pill className="h-4 w-4 text-blue-500" />
            <span className="text-sm font-medium">Medicamentos em Uso</span>
          </div>
          {clinicalData.current_medications.length > 0 ? (
            <div className="flex flex-wrap gap-1">
              {clinicalData.current_medications.map((med, idx) => (
                <Badge key={idx} variant="outline" className="text-xs">
                  {med}
                </Badge>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">Nenhum medicamento informado</p>
          )}
        </div>

        {clinicalData.family_history && (
          <>
            <Separator />
            <div>
              <span className="text-sm font-medium">Histórico Familiar</span>
              <p className="text-sm text-muted-foreground mt-1">
                {clinicalData.family_history}
              </p>
            </div>
          </>
        )}

        {clinicalData.clinical_restrictions && (
          <>
            <Separator />
            <div>
              <span className="text-sm font-medium text-yellow-600">Restrições Clínicas</span>
              <p className="text-sm text-muted-foreground mt-1">
                {clinicalData.clinical_restrictions}
              </p>
            </div>
          </>
        )}

        {/* Responsáveis */}
        {guardians.length > 0 && (
          <>
            <Separator />
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Users className="h-4 w-4" />
                <span className="text-sm font-medium">Responsáveis Legais</span>
              </div>
              <div className="space-y-2">
                {guardians.map(guardian => (
                  <div key={guardian.id} className="p-2 bg-muted/30 rounded text-sm">
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4" />
                      <span className="font-medium">{guardian.full_name}</span>
                      <Badge variant="outline" className="text-xs">{guardian.relationship}</Badge>
                      {guardian.is_primary && (
                        <Badge className="text-xs">Principal</Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-4 mt-1 text-muted-foreground">
                      {guardian.phone && (
                        <div className="flex items-center gap-1">
                          <Phone className="h-3 w-3" />
                          <span>{guardian.phone}</span>
                        </div>
                      )}
                      {guardian.email && (
                        <div className="flex items-center gap-1">
                          <Mail className="h-3 w-3" />
                          <span>{guardian.email}</span>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
