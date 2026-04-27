import { lazy, Suspense, type ReactNode, type ComponentType } from "react";
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
import { PageSkeleton } from "@/components/app/PageSkeleton";
import CookieConsent from "@/components/CookieConsent";

// Páginas Públicas — lazy para não pesar no boot inicial.
const Index = lazyWithTimeout(() => import("./pages/Index"), "Index");
const Login = lazyWithTimeout(() => import("./pages/Login"), "Login");
const CriarConta = lazyWithTimeout(() => import("./pages/CriarConta"), "CriarConta");
const RecuperarSenha = lazyWithTimeout(() => import("./pages/RecuperarSenha"), "RecuperarSenha");
const RedefinirSenha = lazyWithTimeout(() => import("./pages/RedefinirSenha"), "RedefinirSenha");
const AceitarConvite = lazyWithTimeout(() => import("./pages/AceitarConvite"), "AceitarConvite");
const NotFound = lazyWithTimeout(() => import("./pages/NotFound"), "NotFound");
const ValidarDocumento = lazyWithTimeout(() => import("./pages/ValidarDocumento"), "ValidarDocumento");
const PreCadastro = lazyWithTimeout(() => import("./pages/PreCadastro"), "PreCadastro");
const Ajuda = lazyWithTimeout(() => import("./pages/Ajuda"), "Ajuda");
const Privacidade = lazyWithTimeout(() => import("./pages/Privacidade"), "Privacidade");
const Contato = lazyWithTimeout(() => import("./pages/Contato"), "Contato");

// Teleconsulta - Páginas Públicas
const PrecheckPage = lazyWithTimeout(() => import("./pages/teleconsulta/PrecheckPage"), "PrecheckPage");
const PatientRoomPage = lazyWithTimeout(() => import("./pages/teleconsulta/PatientRoomPage"), "PatientRoomPage");

// Agendamento Público
const PublicBookingLayout = lazyWithTimeout(() => import("./pages/public/PublicBookingLayout"), "PublicBookingLayout");
const PublicClinicBookingPage = lazyWithTimeout(() => import("./pages/public/PublicClinicBookingPage"), "PublicClinicBookingPage");
const SpecialtySelectionStep = lazyWithTimeout(() => import("./pages/public/SpecialtySelectionStep"), "SpecialtySelectionStep");
const ProfessionalSelectionStep = lazyWithTimeout(() => import("./pages/public/ProfessionalSelectionStep"), "ProfessionalSelectionStep");
const TimeSelectionStep = lazyWithTimeout(() => import("./pages/public/TimeSelectionStep"), "TimeSelectionStep");
const PatientDataStep = lazyWithTimeout(() => import("./pages/public/PatientDataStep"), "PatientDataStep");
const BookingConfirmationStep = lazyWithTimeout(() => import("./pages/public/BookingConfirmationStep"), "BookingConfirmationStep");

// Teleconsulta - Página Autenticada
const TeleconsultaSala = lazyWithTimeout(() => import("./pages/app/TeleconsultaSala"), "TeleconsultaSala");

// Layout do App
import { AppLayout } from "./components/app/AppLayout";

// Páginas do App — carregadas sob demanda por rota.
const Dashboard = lazyWithTimeout(() => import("./pages/app/Dashboard"), "Dashboard");
const Agenda = lazyWithTimeout(() => import("./pages/app/Agenda"), "Agenda");
const Prontuario = lazyWithTimeout(() => import("./pages/app/Prontuario"), "Prontuario");
const Pacientes = lazyWithTimeout(() => import("./pages/app/Pacientes"), "Pacientes");
const Convenios = lazyWithTimeout(() => import("./pages/app/gestao/Convenios"), "Convenios");
const MeuFinanceiro = lazyWithTimeout(() => import("./pages/app/MeuFinanceiro"), "MeuFinanceiro");
const Atendimento = lazyWithTimeout(() => import("./pages/app/Atendimento"), "Atendimento");
const VerAtendimento = lazyWithTimeout(() => import("./pages/app/VerAtendimento"), "VerAtendimento");

// Marketing
const MarketingLayout = lazyWithTimeout(() => import("./pages/app/marketing/MarketingLayout"), "MarketingLayout");

// Gestão
const Financas = lazyWithTimeout(() => import("./pages/app/gestao/Financas"), "Financas");
const Estoque = lazyWithTimeout(() => import("./pages/app/gestao/Estoque"), "Estoque");
const Relatorios = lazyWithTimeout(() => import("./pages/app/gestao/Relatorios"), "Relatorios");
const Auditoria = lazyWithTimeout(() => import("./pages/app/gestao/Auditoria"), "Auditoria");

// Configurações
const ConfigProcedimentos = lazyWithTimeout(() => import("./pages/app/config/Procedimentos"), "ConfigProcedimentos");
const ConfigClinica = lazyWithTimeout(() => import("./pages/app/config/Clinica"), "ConfigClinica");
const ConfigUsuarios = lazyWithTimeout(() => import("./pages/app/config/Usuarios"), "ConfigUsuarios");
const ConfigMateriais = lazyWithTimeout(() => import("./pages/app/config/Materiais"), "ConfigMateriais");
const CatalogoClinico = lazyWithTimeout(() => import("./pages/app/config/CatalogoClinico"), "CatalogoClinico");
const ConfigAgenda = lazyWithTimeout(() => import("./pages/app/config/Agenda"), "ConfigAgenda");
const ConfigProntuario = lazyWithTimeout(() => import("./pages/app/config/Prontuario"), "ConfigProntuario");
const ConfigSeguranca = lazyWithTimeout(() => import("./pages/app/config/Seguranca"), "ConfigSeguranca");
const ConfigIntegracoes = lazyWithTimeout(() => import("./pages/app/config/Integracoes"), "ConfigIntegracoes");
const ModelosAnamnese = lazyWithTimeout(() => import("./pages/configuracoes/ModelosAnamnese"), "ModelosAnamnese");
const DocumentosInstitucionais = lazyWithTimeout(() => import("./pages/app/config/DocumentosInstitucionais"), "DocumentosInstitucionais");
const FormasRecebimento = lazyWithTimeout(() => import("./pages/app/config/FormasRecebimento"), "FormasRecebimento");

// Comercial
const ComercialDashboard = lazyWithTimeout(() => import("./pages/app/comercial/ComercialDashboard"), "ComercialDashboard");
const LeadsPage = lazyWithTimeout(() => import("./pages/app/comercial/LeadsPage"), "LeadsPage");
const OpportunitiesPage = lazyWithTimeout(() => import("./pages/app/comercial/OpportunitiesPage"), "OpportunitiesPage");
const QuotesPage = lazyWithTimeout(() => import("./pages/app/comercial/QuotesPage"), "QuotesPage");
const PackagesCommercialPage = lazyWithTimeout(() => import("./pages/app/comercial/PackagesCommercialPage"), "PackagesCommercialPage");
const ConversionsPage = lazyWithTimeout(() => import("./pages/app/comercial/ConversionsPage"), "ConversionsPage");
const FollowupsPage = lazyWithTimeout(() => import("./pages/app/comercial/FollowupsPage"), "FollowupsPage");
const GoalsPage = lazyWithTimeout(() => import("./pages/app/comercial/GoalsPage"), "GoalsPage");
const CommercialReportsPage = lazyWithTimeout(() => import("./pages/app/comercial/CommercialReportsPage"), "CommercialReportsPage");

// Super Admin
import { SuperAdminLayout } from "./components/super-admin/SuperAdminLayout";
import { ProtectedSuperAdminRoute } from "./components/super-admin/ProtectedSuperAdminRoute";
const SuperAdminDashboard = lazyWithTimeout(() => import("./pages/super-admin/SuperAdminDashboard"), "SuperAdminDashboard");
const SuperAdminClinics = lazyWithTimeout(() => import("./pages/super-admin/SuperAdminClinics"), "SuperAdminClinics");
const SuperAdminPlans = lazyWithTimeout(() => import("./pages/super-admin/SuperAdminPlans"), "SuperAdminPlans");
const SuperAdminSubscriptions = lazyWithTimeout(() => import("./pages/super-admin/SuperAdminSubscriptions"), "SuperAdminSubscriptions");
const SuperAdminFeatureOverrides = lazyWithTimeout(() => import("./pages/super-admin/SuperAdminFeatureOverrides"), "SuperAdminFeatureOverrides");
const SuperAdminSetup = lazyWithTimeout(() => import("./pages/super-admin/SuperAdminSetup"), "SuperAdminSetup");
const SuperAdminStub = lazyWithTimeout(() => import("./pages/super-admin/SuperAdminStub"), "SuperAdminStub");
const Assinatura = lazyWithTimeout(() => import("./pages/app/Assinatura"), "Assinatura");

/**
 * lazyWithTimeout — mantém compatibilidade com as rotas lazy, mas sem
 * timeout destrutivo. Chunks grandes/lentos continuam no Suspense em vez de
 * lançar MODULE_TIMEOUT e derrubar a tela inteira.
 */
function lazyWithTimeout<T extends { default: ComponentType<any> }>(
  loader: () => Promise<T>,
  scope: string
) {
  return lazy(async () => {
    const t0 = performance.now();
    try {
      const mod = await loader();
      if (import.meta.env.DEV) {
        console.log(`[MODULE_LOAD] ${scope} ok em ${Math.round(performance.now() - t0)}ms`);
      }
      return mod;
    } catch (err) {
      console.warn(`[MODULE_LOAD] ${scope} falhou na 1ª tentativa, refazendo…`, err);
      // Retry único — cobre cold-start de CDN e falhas transitórias
      const mod = await loader();
      console.log(`[MODULE_LOAD] ${scope} ok em ${Math.round(performance.now() - t0)}ms (retry)`);
      return mod;
    }
  });
}

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
      // Cache básico: evita refetch em remontagens rápidas (ex.: troca de aba)
      staleTime: 30_000,
      gcTime: 5 * 60_000,
    },
  },
});

function RouteBoundary({ children, scope }: { children: ReactNode; scope: string }) {
  return (
    <ErrorBoundary scope={scope} showHome={false}>
      {/*
        Fallback contextual: skeleton local em vez do antigo loading central
        com logo. Mantém sidebar/header visíveis e dá sensação de troca de
        rota imediata.
      */}
      <Suspense fallback={<PageSkeleton />}>
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
        <SafeProvider
          scope="UserViewModeBootstrap"
          fallbackChildren={
            <UserViewModeProvider realRole={null}>
              <SafeProvider scope="PermissionsProvider" fallbackChildren={<AppRouter />}>
                <PermissionsProvider>
                  <SafeProvider scope="ClinicFeaturesProvider" fallbackChildren={<AppRouter />}>
                    <ClinicFeaturesProvider>
                      <AppRouter />
                    </ClinicFeaturesProvider>
                  </SafeProvider>
                </PermissionsProvider>
              </SafeProvider>
            </UserViewModeProvider>
          }
        >
          <UserViewModeBootstrap>
            <SafeProvider scope="PermissionsProvider" fallbackChildren={<AppRouter />}>
              <PermissionsProvider>
                <SafeProvider scope="ClinicFeaturesProvider" fallbackChildren={<AppRouter />}>
                  <ClinicFeaturesProvider>
                    <AppRouter />
                  </ClinicFeaturesProvider>
                </SafeProvider>
              </PermissionsProvider>
            </SafeProvider>
          </UserViewModeBootstrap>
        </SafeProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

function AppRouter() {
  return (
    <>
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
    </>
  );
}

export default App;
