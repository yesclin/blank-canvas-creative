import { Building2 } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useConveniosFullData } from "@/hooks/useConveniosData";
import { ConveniosStats } from "@/components/convenios/ConveniosStats";
import { InsuranceList } from "@/components/convenios/InsuranceList";
import { PatientInsuranceList } from "@/components/convenios/PatientInsuranceList";
import { TissGuideList } from "@/components/convenios/TissGuideList";
import { AuthorizationList } from "@/components/convenios/AuthorizationList";
import { InsuranceProceduresList } from "@/components/convenios/InsuranceProceduresList";
import { FeeRulesList } from "@/components/convenios/FeeRulesList";
import { FeeCalculationList } from "@/components/convenios/FeeCalculationList";
import { Skeleton } from "@/components/ui/skeleton";

export default function Convenios() {
  const {
    insurances,
    patientInsurances,
    feeRules,
    guides,
    feeCalculations,
    insuranceProcedures,
    authorizations,
    stats,
    financialSummary,
    patients,
    professionals,
    isLoading,
  } = useConveniosFullData();

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <Building2 className="h-6 w-6 text-primary" />
            Convênios
          </h1>
          <p className="text-muted-foreground mt-1">
            Carregando dados...
          </p>
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
            <Skeleton key={i} className="h-24" />
          ))}
        </div>
        <Skeleton className="h-96" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
          <Building2 className="h-6 w-6 text-primary" />
          Convênios
        </h1>
        <p className="text-muted-foreground mt-1">
          Gestão completa de convênios, guias TISS e repasses profissionais
        </p>
      </div>

      {/* Stats */}
      <ConveniosStats stats={stats} />

      {/* Main Tabs */}
      <Tabs defaultValue="insurances" className="space-y-4">
        <TabsList className="flex flex-wrap h-auto gap-1">
          <TabsTrigger value="insurances">Convênios</TabsTrigger>
          <TabsTrigger value="patients">Pacientes</TabsTrigger>
          <TabsTrigger value="procedures">Procedimentos</TabsTrigger>
          <TabsTrigger value="authorizations">Autorizações</TabsTrigger>
          <TabsTrigger value="guides">Guias TISS</TabsTrigger>
          <TabsTrigger value="fee-rules">Regras de Repasse</TabsTrigger>
          <TabsTrigger value="financial">Financeiro</TabsTrigger>
        </TabsList>

        <TabsContent value="insurances">
          <InsuranceList insurances={insurances} />
        </TabsContent>

        <TabsContent value="patients">
          <PatientInsuranceList 
            patientInsurances={patientInsurances} 
            insurances={insurances}
            patients={patients}
          />
        </TabsContent>

        <TabsContent value="procedures">
          <InsuranceProceduresList 
            insuranceProcedures={insuranceProcedures}
            insurances={insurances}
          />
        </TabsContent>

        <TabsContent value="authorizations">
          <AuthorizationList 
            authorizations={authorizations}
            insurances={insurances}
            patients={patients}
          />
        </TabsContent>

        <TabsContent value="guides">
          <TissGuideList 
            guides={guides}
            insurances={insurances}
            patients={patients}
            professionals={professionals}
          />
        </TabsContent>

        <TabsContent value="fee-rules">
          <FeeRulesList 
            feeRules={feeRules}
            insurances={insurances}
          />
        </TabsContent>

        <TabsContent value="financial">
          <FeeCalculationList 
            feeCalculations={feeCalculations}
            financialSummary={financialSummary}
            professionals={professionals}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
