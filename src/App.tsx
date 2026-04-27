import { lazy, Suspense, type ReactNode } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { PermissionsProvider } from "@/hooks/usePermissions";
import { UserViewModeBootstrap } from "@/contexts/UserViewModeBootstrap";
import { UserViewModeProvider } from "@/contexts/UserViewModeContext";
import { ClinicFeaturesProvider } from "@/hooks/useClinicFeatures";
import { RequireAuth } from "@/components/app/RequireAuth";
import { ProtectedRoute } from "@/components/app/ProtectedRoute";
import { ProtectedFeatureRoute } from "@/components/app/ProtectedFeatureRoute";
import { PasswordRecoveryHandler } from "@/components/app/PasswordRecoveryHandler";
import { ErrorBoundary } from "@/components/app/ErrorBoundary";
import { AppLoadingFallback } from "@/components/app/AppLoadingFallback";
import CookieConsent from "@/components/CookieConsent";

// Páginas Públicas — lazy para não pesar no boot inicial.
const Index = lazy(() => import("./pages/Index"));
const Login = lazy(() => import("./pages/Login"));
const CriarConta = lazy(() => import("./pages/CriarConta"));
const RecuperarSenha = lazy(() => import("./pages/RecuperarSenha"));
const RedefinirSenha = lazy(() => import("./pages/RedefinirSenha"));
const AceitarConvite = lazy(() => import("./pages/AceitarConvite"));
const NotFound = lazy(() => import("./pages/NotFound"));
const ValidarDocumento = lazy(() => import("./pages/ValidarDocumento"));
const PreCadastro = lazy(() => import("./pages/PreCadastro"));
const Ajuda = lazy(() => import("./pages/Ajuda"));
const Privacidade = lazy(() => import("./pages/Privacidade"));
const Contato = lazy(() => import("./pages/Contato"));

// Teleconsulta - Páginas Públicas
const PrecheckPage = lazy(() => import("./pages/teleconsulta/PrecheckPage"));
const PatientRoomPage = lazy(() => import("./pages/teleconsulta/PatientRoomPage"));

// Agendamento Público
const PublicBookingLayout = lazy(() => import("./pages/public/PublicBookingLayout"));
const PublicClinicBookingPage = lazy(() => import("./pages/public/PublicClinicBookingPage"));
const SpecialtySelectionStep = lazy(() => import("./pages/public/SpecialtySelectionStep"));
const ProfessionalSelectionStep = lazy(() => import("./pages/public/ProfessionalSelectionStep"));
const TimeSelectionStep = lazy(() => import("./pages/public/TimeSelectionStep"));
const PatientDataStep = lazy(() => import("./pages/public/PatientDataStep"));
const BookingConfirmationStep = lazy(() => import("./pages/public/BookingConfirmationStep"));

// Teleconsulta - Página Autenticada
const TeleconsultaSala = lazy(() => import("./pages/app/TeleconsultaSala"));

// Layout do App
import { AppLayout } from "./components/app/AppLayout";

// Páginas do App — carregadas sob demanda por rota.
const Dashboard = lazy(() => import("./pages/app/Dashboard"));
const Agenda = lazy(() => import("./pages/app/Agenda"));
const Prontuario = lazy(() => import("./pages/app/Prontuario"));
const Pacientes = lazy(() => import("./pages/app/Pacientes"));
const Convenios = lazy(() => import("./pages/app/gestao/Convenios"));
const MeuFinanceiro = lazy(() => import("./pages/app/MeuFinanceiro"));
const Atendimento = lazy(() => import("./pages/app/Atendimento"));
const VerAtendimento = lazy(() => import("./pages/app/VerAtendimento"));

// Marketing
const MarketingLayout = lazy(() => import("./pages/app/marketing/MarketingLayout"));

// Gestão
const Financas = lazy(() => import("./pages/app/gestao/Financas"));
const Estoque = lazy(() => import("./pages/app/gestao/Estoque"));
const Relatorios = lazy(() => import("./pages/app/gestao/Relatorios"));
const Auditoria = lazy(() => import("./pages/app/gestao/Auditoria"));

// Configurações
const ConfigProcedimentos = lazy(() => import("./pages/app/config/Procedimentos"));
const ConfigClinica = lazy(() => import("./pages/app/config/Clinica"));
const ConfigUsuarios = lazy(() => import("./pages/app/config/Usuarios"));
const ConfigMateriais = lazy(() => import("./pages/app/config/Materiais"));
const CatalogoClinico = lazy(() => import("./pages/app/config/CatalogoClinico"));
const ConfigAgenda = lazy(() => import("./pages/app/config/Agenda"));
const ConfigProntuario = lazy(() => import("./pages/app/config/Prontuario"));
const ConfigSeguranca = lazy(() => import("./pages/app/config/Seguranca"));
const ConfigIntegracoes = lazy(() => import("./pages/app/config/Integracoes"));
const ModelosAnamnese = lazy(() => import("./pages/configuracoes/ModelosAnamnese"));
const DocumentosInstitucionais = lazy(() => import("./pages/app/config/DocumentosInstitucionais"));
const FormasRecebimento = lazy(() => import("./pages/app/config/FormasRecebimento"));

// Comercial
const ComercialDashboard = lazy(() => import("./pages/app/comercial/ComercialDashboard"));
const LeadsPage = lazy(() => import("./pages/app/comercial/LeadsPage"));
const OpportunitiesPage = lazy(() => import("./pages/app/comercial/OpportunitiesPage"));
const QuotesPage = lazy(() => import("./pages/app/comercial/QuotesPage"));
const PackagesCommercialPage = lazy(() => import("./pages/app/comercial/PackagesCommercialPage"));
const ConversionsPage = lazy(() => import("./pages/app/comercial/ConversionsPage"));
const FollowupsPage = lazy(() => import("./pages/app/comercial/FollowupsPage"));
const GoalsPage = lazy(() => import("./pages/app/comercial/GoalsPage"));
const CommercialReportsPage = lazy(() => import("./pages/app/comercial/CommercialReportsPage"));

// Super Admin
import { SuperAdminLayout } from "./components/super-admin/SuperAdminLayout";
import { ProtectedSuperAdminRoute } from "./components/super-admin/ProtectedSuperAdminRoute";
const SuperAdminDashboard = lazy(() => import("./pages/super-admin/SuperAdminDashboard"));
const SuperAdminClinics = lazy(() => import("./pages/super-admin/SuperAdminClinics"));
const SuperAdminPlans = lazy(() => import("./pages/super-admin/SuperAdminPlans"));
const SuperAdminSubscriptions = lazy(() => import("./pages/super-admin/SuperAdminSubscriptions"));
const SuperAdminFeatureOverrides = lazy(() => import("./pages/super-admin/SuperAdminFeatureOverrides"));
const SuperAdminSetup = lazy(() => import("./pages/super-admin/SuperAdminSetup"));
const SuperAdminStub = lazy(() => import("./pages/super-admin/SuperAdminStub"));
const Assinatura = lazy(() => import("./pages/app/Assinatura"));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

function RouteBoundary({ children, scope }: { children: ReactNode; scope: string }) {
  return (
    <ErrorBoundary scope={scope} showHome={false}>
      <Suspense fallback={<AppLoadingFallback message="Carregando módulo..." />}>
        {children}
      </Suspense>
    </ErrorBoundary>
  );
}

/**
 * Envolve providers não-essenciais. Se o provider lançar, o app segue
 * renderizando os fallbackChildren — nunca derrubamos o boot por causa de
 * UserViewMode / Permissions / ClinicFeatures.
 */
function SafeProvider({
  scope,
  fallbackChildren,
  children,
}: {
  scope: string;
  fallbackChildren: ReactNode;
  children: ReactNode;
}) {
  return (
    <ErrorBoundary
      scope={scope}
      showHome={false}
      fallback={(error) => {
        console.error(`[PROVIDER_ERROR] ${scope} caiu — seguindo sem ele`, error);
        return <>{fallbackChildren}</>;
      }}
    >
      {children}
    </ErrorBoundary>
  );
}

const moduleRoute = (children: ReactNode, scope: string) => (
  <RouteBoundary scope={scope}>{children}</RouteBoundary>
);

function RouterReadyLog() {
  if (import.meta.env.DEV) {
    console.log("[ROUTER] pronto");
  }
  return null;
}

const App = () => {
  if (import.meta.env.DEV) {
    console.log("[APP_INIT] App renderizando");
  }

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <UserViewModeBootstrap>
          <PermissionsProvider>
            <ClinicFeaturesProvider>
              <Toaster />
              <Sonner />
              <ErrorBoundary scope="Router" showHome={false}>
                <BrowserRouter>
                  <PasswordRecoveryHandler />
                  <RouterReadyLog />
                  <Routes>
                    {/* Páginas Públicas */}
                    <Route path="/" element={moduleRoute(<Index />, "Página inicial")} />
                    <Route path="/login" element={moduleRoute(<Login />, "Login")} />
                    <Route path="/criar-conta" element={moduleRoute(<CriarConta />, "Criar conta")} />
                    <Route path="/recuperar-senha" element={moduleRoute(<RecuperarSenha />, "Recuperar senha")} />
                    <Route path="/redefinir-senha" element={moduleRoute(<RedefinirSenha />, "Redefinir senha")} />
                    <Route path="/validar/:id" element={moduleRoute(<ValidarDocumento />, "Validar documento")} />
                    <Route path="/aceitar-convite" element={moduleRoute(<AceitarConvite />, "Aceitar convite")} />
                    <Route path="/pre-cadastro/:token" element={moduleRoute(<PreCadastro />, "Pré-cadastro")} />
                    <Route path="/ajuda" element={moduleRoute(<Ajuda />, "Ajuda")} />
                    <Route path="/privacidade" element={moduleRoute(<Privacidade />, "Privacidade")} />
                    <Route path="/contato" element={moduleRoute(<Contato />, "Contato")} />

                    {/* Teleconsulta - Páginas Públicas */}
                    <Route path="/teleconsulta/:token/precheck" element={moduleRoute(<PrecheckPage />, "Pré-check teleconsulta")} />
                    <Route path="/teleconsulta/:token/sala" element={moduleRoute(<PatientRoomPage />, "Sala do paciente")} />

                    {/* Agendamento Público */}
                    <Route path="/agendar/:clinicSlug" element={moduleRoute(<PublicBookingLayout />, "Agendamento público")}>
                      <Route index element={moduleRoute(<PublicClinicBookingPage />, "Agendamento público")} />
                      <Route path="especialidade" element={moduleRoute(<SpecialtySelectionStep />, "Seleção de especialidade")} />
                      <Route path="profissional" element={moduleRoute(<ProfessionalSelectionStep />, "Seleção de profissional")} />
                      <Route path="horarios" element={moduleRoute(<TimeSelectionStep />, "Seleção de horários")} />
                      <Route path="dados" element={moduleRoute(<PatientDataStep />, "Dados do paciente")} />
                      <Route path="confirmacao" element={moduleRoute(<BookingConfirmationStep />, "Confirmação de agendamento")} />
                    </Route>

                    {/* Área do App (protegida) */}
                    <Route
                      path="/app"
                      element={
                        <RequireAuth>
                          <ErrorBoundary scope="Layout do App">
                            <AppLayout />
                          </ErrorBoundary>
                        </RequireAuth>
                      }
                    >
                      <Route index element={moduleRoute(<ProtectedRoute module="dashboard"><Dashboard /></ProtectedRoute>, "Dashboard")} />
                      <Route path="assinatura" element={moduleRoute(<Assinatura />, "Assinatura")} />
                      <Route path="agenda" element={moduleRoute(<ProtectedRoute module="agenda"><Agenda /></ProtectedRoute>, "Agenda")} />
                      <Route path="prontuario" element={moduleRoute(<ProtectedRoute module="prontuario"><Prontuario /></ProtectedRoute>, "Prontuário")} />
                      <Route path="prontuario/:patientId" element={moduleRoute(<ProtectedRoute module="prontuario"><Prontuario /></ProtectedRoute>, "Prontuário")} />
                      <Route path="pacientes" element={moduleRoute(<ProtectedRoute module="pacientes"><Pacientes /></ProtectedRoute>, "Pacientes")} />
                      <Route path="gestao/convenios" element={moduleRoute(<ProtectedRoute module="convenios"><ProtectedFeatureRoute feature="feature_insurances"><Convenios /></ProtectedFeatureRoute></ProtectedRoute>, "Convênios")} />
                      <Route path="meu-financeiro" element={moduleRoute(<ProtectedRoute module="meu_financeiro"><MeuFinanceiro /></ProtectedRoute>, "Meu Financeiro")} />
                      <Route path="atendimento" element={moduleRoute(<ProtectedRoute module="prontuario"><Atendimento /></ProtectedRoute>, "Atendimento")} />
                      <Route path="atendimento/:appointmentId" element={moduleRoute(<ProtectedRoute module="prontuario"><VerAtendimento /></ProtectedRoute>, "Ver Atendimento")} />

                      {/* Marketing - Página única com abas */}
                      <Route path="marketing" element={moduleRoute(<ProtectedRoute module="comunicacao"><ProtectedFeatureRoute feature="feature_marketing"><MarketingLayout /></ProtectedFeatureRoute></ProtectedRoute>, "Marketing")} />

                      {/* Gestão */}
                      <Route path="gestao/financas" element={moduleRoute(<ProtectedRoute module="financeiro"><Financas /></ProtectedRoute>, "Finanças")} />
                      <Route path="gestao/estoque" element={moduleRoute(<ProtectedRoute module="estoque"><ProtectedFeatureRoute feature="feature_inventory"><Estoque /></ProtectedFeatureRoute></ProtectedRoute>, "Estoque")} />
                      <Route path="gestao/relatorios" element={moduleRoute(<ProtectedRoute module="relatorios"><ProtectedFeatureRoute feature="feature_advanced_reports"><Relatorios /></ProtectedFeatureRoute></ProtectedRoute>, "Relatórios")} />
                      <Route path="gestao/auditoria" element={moduleRoute(<ProtectedRoute module="configuracoes"><ProtectedFeatureRoute feature="feature_audit"><Auditoria /></ProtectedFeatureRoute></ProtectedRoute>, "Auditoria")} />

                      {/* Configurações */}
                      <Route path="config/procedimentos" element={moduleRoute(<ProtectedRoute module="configuracoes"><ConfigProcedimentos /></ProtectedRoute>, "Config Procedimentos")} />
                      <Route path="config/clinica" element={moduleRoute(<ProtectedRoute module="configuracoes"><ConfigClinica /></ProtectedRoute>, "Config Clínica")} />
                      <Route path="config/usuarios" element={moduleRoute(<ProtectedRoute module="configuracoes"><ConfigUsuarios /></ProtectedRoute>, "Config Usuários")} />
                      <Route path="config/materiais" element={moduleRoute(<ProtectedRoute module="configuracoes"><ConfigMateriais /></ProtectedRoute>, "Config Materiais")} />
                      <Route path="config/catalogo-clinico" element={moduleRoute(<ProtectedRoute module="configuracoes"><CatalogoClinico /></ProtectedRoute>, "Catálogo Clínico")} />
                      <Route path="config/agenda" element={moduleRoute(<ProtectedRoute module="configuracoes"><ConfigAgenda /></ProtectedRoute>, "Config Agenda")} />
                      <Route path="config/prontuario" element={moduleRoute(<ProtectedRoute module="configuracoes"><ConfigProntuario /></ProtectedRoute>, "Config Prontuário")} />
                      <Route path="config/seguranca" element={moduleRoute(<ProtectedRoute module="configuracoes"><ConfigSeguranca /></ProtectedRoute>, "Config Segurança")} />
                      <Route path="config/integracoes" element={moduleRoute(<ProtectedRoute module="configuracoes"><ConfigIntegracoes /></ProtectedRoute>, "Config Integrações")} />
                      <Route path="config/modelos-anamnese" element={moduleRoute(<ProtectedRoute module="configuracoes"><ModelosAnamnese /></ProtectedRoute>, "Modelos de Anamnese")} />
                      <Route path="config/documentos-institucionais" element={moduleRoute(<ProtectedRoute module="configuracoes"><DocumentosInstitucionais /></ProtectedRoute>, "Documentos Institucionais")} />
                      <Route path="config/formas-recebimento" element={moduleRoute(<ProtectedRoute module="configuracoes"><FormasRecebimento /></ProtectedRoute>, "Formas de Recebimento")} />

                      {/* Comercial */}
                      <Route path="comercial" element={moduleRoute(<ProtectedRoute module="comercial"><ProtectedFeatureRoute feature="feature_crm"><ComercialDashboard /></ProtectedFeatureRoute></ProtectedRoute>, "Comercial")} />
                      <Route path="comercial/leads" element={moduleRoute(<ProtectedRoute module="comercial"><ProtectedFeatureRoute feature="feature_crm"><LeadsPage /></ProtectedFeatureRoute></ProtectedRoute>, "Leads")} />
                      <Route path="comercial/oportunidades" element={moduleRoute(<ProtectedRoute module="comercial"><ProtectedFeatureRoute feature="feature_crm"><OpportunitiesPage /></ProtectedFeatureRoute></ProtectedRoute>, "Oportunidades")} />
                      <Route path="comercial/orcamentos" element={moduleRoute(<ProtectedRoute module="comercial"><ProtectedFeatureRoute feature="feature_crm"><QuotesPage /></ProtectedFeatureRoute></ProtectedRoute>, "Orçamentos")} />
                      <Route path="comercial/pacotes" element={moduleRoute(<ProtectedRoute module="comercial"><ProtectedFeatureRoute feature="feature_crm"><PackagesCommercialPage /></ProtectedFeatureRoute></ProtectedRoute>, "Pacotes")} />
                      <Route path="comercial/conversoes" element={moduleRoute(<ProtectedRoute module="comercial"><ProtectedFeatureRoute feature="feature_crm"><ConversionsPage /></ProtectedFeatureRoute></ProtectedRoute>, "Conversões")} />
                      <Route path="comercial/follow-ups" element={moduleRoute(<ProtectedRoute module="comercial"><ProtectedFeatureRoute feature="feature_crm"><FollowupsPage /></ProtectedFeatureRoute></ProtectedRoute>, "Follow-ups")} />
                      <Route path="comercial/metas" element={moduleRoute(<ProtectedRoute module="comercial"><ProtectedFeatureRoute feature="feature_crm"><GoalsPage /></ProtectedFeatureRoute></ProtectedRoute>, "Metas")} />
                      <Route path="comercial/relatorios" element={moduleRoute(<ProtectedRoute module="comercial"><ProtectedFeatureRoute feature="feature_crm"><CommercialReportsPage /></ProtectedFeatureRoute></ProtectedRoute>, "Relatórios Comerciais")} />

                      {/* Teleconsulta - Sala do Profissional */}
                      <Route path="teleconsulta/:appointmentId/sala" element={moduleRoute(<ProtectedRoute module="agenda"><ProtectedFeatureRoute feature="feature_teleconsulta"><TeleconsultaSala /></ProtectedFeatureRoute></ProtectedRoute>, "Teleconsulta")} />

                      {/* Fallback dentro do /app */}
                      <Route path="*" element={<Navigate to="/app" replace />} />
                    </Route>

                    {/* Super Admin (plataforma) */}
                    <Route
                      path="/super-admin"
                      element={
                        <ProtectedSuperAdminRoute>
                          <SuperAdminLayout />
                        </ProtectedSuperAdminRoute>
                      }
                    >
                      <Route index element={moduleRoute(<SuperAdminDashboard />, "Super Admin")} />
                      <Route path="clinicas" element={moduleRoute(<SuperAdminClinics />, "Super Admin Clínicas")} />
                      <Route path="planos" element={moduleRoute(<SuperAdminPlans />, "Super Admin Planos")} />
                      <Route path="assinaturas" element={moduleRoute(<SuperAdminSubscriptions />, "Super Admin Assinaturas")} />
                      <Route path="recursos" element={moduleRoute(<SuperAdminFeatureOverrides />, "Super Admin Recursos")} />
                      <Route path="usuarios" element={moduleRoute(<SuperAdminStub title="Usuários da plataforma" description="Gestão de papéis globais (Super Admin, Suporte) e auditoria de acesso." />, "Super Admin Usuários")} />
                      <Route path="ocorrencias" element={moduleRoute(<SuperAdminStub title="Ocorrências e bugs" description="Triagem e acompanhamento de incidentes reportados pelas clínicas." />, "Super Admin Ocorrências")} />
                      <Route path="logs" element={moduleRoute(<SuperAdminStub title="Logs e Auditoria" description="Auditoria das ações administrativas da plataforma." />, "Super Admin Logs")} />
                      <Route path="integracoes" element={moduleRoute(<SuperAdminStub title="Integrações" description="Conectores com gateways, mensageria, Storage e outros provedores." />, "Super Admin Integrações")} />
                      <Route path="uso" element={moduleRoute(<SuperAdminStub title="Uso da plataforma" description="Métricas de adoção, consumo e saúde por clínica." />, "Super Admin Uso")} />
                      <Route path="financeiro" element={moduleRoute(<SuperAdminStub title="Financeiro SaaS" description="Faturamento, cobranças e MRR/ARR consolidados." />, "Super Admin Financeiro")} />
                      <Route path="configuracoes" element={moduleRoute(<SuperAdminStub title="Configurações da plataforma" description="Parâmetros globais, defaults de clínica e flags do sistema." />, "Super Admin Configurações")} />
                    </Route>
                    <Route
                      path="/super-admin/setup"
                      element={moduleRoute(
                        <ProtectedSuperAdminRoute>
                          <SuperAdminSetup />
                        </ProtectedSuperAdminRoute>,
                        "Super Admin Setup"
                      )}
                    />

                    <Route path="*" element={moduleRoute(<NotFound />, "Não encontrado")} />
                  </Routes>
                  <CookieConsent />
                </BrowserRouter>
              </ErrorBoundary>
            </ClinicFeaturesProvider>
          </PermissionsProvider>
        </UserViewModeBootstrap>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;
