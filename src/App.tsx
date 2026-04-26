import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { PermissionsProvider } from "@/hooks/usePermissions";
import { ClinicFeaturesProvider } from "@/hooks/useClinicFeatures";
import { RequireAuth } from "@/components/app/RequireAuth";
import { ProtectedRoute } from "@/components/app/ProtectedRoute";
import { ProtectedFeatureRoute } from "@/components/app/ProtectedFeatureRoute";
import { PasswordRecoveryHandler } from "@/components/app/PasswordRecoveryHandler";
import CookieConsent from "@/components/CookieConsent";

// Páginas Públicas
import Index from "./pages/Index";
import Login from "./pages/Login";
import CriarConta from "./pages/CriarConta";
import RecuperarSenha from "./pages/RecuperarSenha";
import RedefinirSenha from "./pages/RedefinirSenha";
import AceitarConvite from "./pages/AceitarConvite";

import NotFound from "./pages/NotFound";
import ValidarDocumento from "./pages/ValidarDocumento";
import PreCadastro from "./pages/PreCadastro";
import Ajuda from "./pages/Ajuda";
import Privacidade from "./pages/Privacidade";
import Contato from "./pages/Contato";

// Teleconsulta - Páginas Públicas
import PrecheckPage from "./pages/teleconsulta/PrecheckPage";
import PatientRoomPage from "./pages/teleconsulta/PatientRoomPage";

// Agendamento Público
import PublicBookingLayout from "./pages/public/PublicBookingLayout";
import PublicClinicBookingPage from "./pages/public/PublicClinicBookingPage";
import SpecialtySelectionStep from "./pages/public/SpecialtySelectionStep";
import ProfessionalSelectionStep from "./pages/public/ProfessionalSelectionStep";
import TimeSelectionStep from "./pages/public/TimeSelectionStep";
import PatientDataStep from "./pages/public/PatientDataStep";
import BookingConfirmationStep from "./pages/public/BookingConfirmationStep";

// Teleconsulta - Página Autenticada
import TeleconsultaSala from "./pages/app/TeleconsultaSala";

// Layout do App
import { AppLayout } from "./components/app/AppLayout";

// Páginas do App
import Dashboard from "./pages/app/Dashboard";
import Agenda from "./pages/app/Agenda";
import Prontuario from "./pages/app/Prontuario";
import Pacientes from "./pages/app/Pacientes";
import Convenios from "./pages/app/gestao/Convenios";
import MeuFinanceiro from "./pages/app/MeuFinanceiro";
import Atendimento from "./pages/app/Atendimento";
import VerAtendimento from "./pages/app/VerAtendimento";

// Marketing
import MarketingLayout from "./pages/app/marketing/MarketingLayout";

// Gestão
import Financas from "./pages/app/gestao/Financas";
import Estoque from "./pages/app/gestao/Estoque";
import Relatorios from "./pages/app/gestao/Relatorios";
import Auditoria from "./pages/app/gestao/Auditoria";

// Configurações
import ConfigProcedimentos from "./pages/app/config/Procedimentos";
import ConfigClinica from "./pages/app/config/Clinica";
import ConfigUsuarios from "./pages/app/config/Usuarios";
import ConfigMateriais from "./pages/app/config/Materiais";
import CatalogoClinico from "./pages/app/config/CatalogoClinico";
import ConfigAgenda from "./pages/app/config/Agenda";

import ConfigProntuario from "./pages/app/config/Prontuario";
import ConfigSeguranca from "./pages/app/config/Seguranca";
import ConfigIntegracoes from "./pages/app/config/Integracoes";
import ModelosAnamnese from "./pages/configuracoes/ModelosAnamnese";
import DocumentosInstitucionais from "./pages/app/config/DocumentosInstitucionais";
import FormasRecebimento from "./pages/app/config/FormasRecebimento";

// Comercial
import ComercialDashboard from "./pages/app/comercial/ComercialDashboard";
import LeadsPage from "./pages/app/comercial/LeadsPage";
import OpportunitiesPage from "./pages/app/comercial/OpportunitiesPage";
import QuotesPage from "./pages/app/comercial/QuotesPage";
import PackagesCommercialPage from "./pages/app/comercial/PackagesCommercialPage";
import ConversionsPage from "./pages/app/comercial/ConversionsPage";
import FollowupsPage from "./pages/app/comercial/FollowupsPage";
import GoalsPage from "./pages/app/comercial/GoalsPage";
import CommercialReportsPage from "./pages/app/comercial/CommercialReportsPage";

// Super Admin
import { SuperAdminLayout } from "./components/super-admin/SuperAdminLayout";
import { ProtectedSuperAdminRoute } from "./components/super-admin/ProtectedSuperAdminRoute";
import SuperAdminDashboard from "./pages/super-admin/SuperAdminDashboard";
import SuperAdminClinics from "./pages/super-admin/SuperAdminClinics";
import SuperAdminPlans from "./pages/super-admin/SuperAdminPlans";
import SuperAdminSubscriptions from "./pages/super-admin/SuperAdminSubscriptions";
import SuperAdminFeatureOverrides from "./pages/super-admin/SuperAdminFeatureOverrides";
import SuperAdminSetup from "./pages/super-admin/SuperAdminSetup";
import SuperAdminStub from "./pages/super-admin/SuperAdminStub";
import Assinatura from "./pages/app/Assinatura";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <PermissionsProvider>
        <ClinicFeaturesProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
        <PasswordRecoveryHandler />
        <Routes>
          {/* Páginas Públicas */}
          <Route path="/" element={<Index />} />
          <Route path="/login" element={<Login />} />
          <Route path="/criar-conta" element={<CriarConta />} />
          <Route path="/recuperar-senha" element={<RecuperarSenha />} />
          <Route path="/redefinir-senha" element={<RedefinirSenha />} />
          <Route path="/validar/:id" element={<ValidarDocumento />} />
          
          <Route path="/aceitar-convite" element={<AceitarConvite />} />
          <Route path="/pre-cadastro/:token" element={<PreCadastro />} />
          <Route path="/ajuda" element={<Ajuda />} />
          <Route path="/privacidade" element={<Privacidade />} />
          <Route path="/contato" element={<Contato />} />
          
          {/* Teleconsulta - Páginas Públicas */}
          <Route path="/teleconsulta/:token/precheck" element={<PrecheckPage />} />
          <Route path="/teleconsulta/:token/sala" element={<PatientRoomPage />} />

          {/* Agendamento Público */}
          <Route path="/agendar/:clinicSlug" element={<PublicBookingLayout />}>
            <Route index element={<PublicClinicBookingPage />} />
            <Route path="especialidade" element={<SpecialtySelectionStep />} />
            <Route path="profissional" element={<ProfessionalSelectionStep />} />
            <Route path="horarios" element={<TimeSelectionStep />} />
            <Route path="dados" element={<PatientDataStep />} />
            <Route path="confirmacao" element={<BookingConfirmationStep />} />
          </Route>
          
          {/* Área do App (protegida) */}
          <Route
            path="/app"
            element={
              <RequireAuth>
                <AppLayout />
              </RequireAuth>
            }
          >
            <Route index element={<ProtectedRoute module="dashboard"><Dashboard /></ProtectedRoute>} />
            <Route path="assinatura" element={<Assinatura />} />
            <Route path="agenda" element={<ProtectedRoute module="agenda"><Agenda /></ProtectedRoute>} />
            <Route path="prontuario" element={<ProtectedRoute module="prontuario"><Prontuario /></ProtectedRoute>} />
            <Route path="prontuario/:patientId" element={<ProtectedRoute module="prontuario"><Prontuario /></ProtectedRoute>} />
            <Route path="pacientes" element={<ProtectedRoute module="pacientes"><Pacientes /></ProtectedRoute>} />
            <Route path="gestao/convenios" element={<ProtectedRoute module="convenios"><ProtectedFeatureRoute feature="feature_insurances"><Convenios /></ProtectedFeatureRoute></ProtectedRoute>} />
            <Route path="meu-financeiro" element={<ProtectedRoute module="meu_financeiro"><MeuFinanceiro /></ProtectedRoute>} />
            <Route path="atendimento" element={<ProtectedRoute module="prontuario"><Atendimento /></ProtectedRoute>} />
            <Route path="atendimento/:appointmentId" element={<ProtectedRoute module="prontuario"><VerAtendimento /></ProtectedRoute>} />
            
            {/* Marketing - Página única com abas */}
            <Route path="marketing" element={<ProtectedRoute module="comunicacao"><ProtectedFeatureRoute feature="feature_marketing"><MarketingLayout /></ProtectedFeatureRoute></ProtectedRoute>} />
            
            {/* Gestão */}
            <Route path="gestao/financas" element={<ProtectedRoute module="financeiro"><Financas /></ProtectedRoute>} />
            <Route path="gestao/estoque" element={<ProtectedRoute module="estoque"><ProtectedFeatureRoute feature="feature_inventory"><Estoque /></ProtectedFeatureRoute></ProtectedRoute>} />
            <Route path="gestao/relatorios" element={<ProtectedRoute module="relatorios"><ProtectedFeatureRoute feature="feature_advanced_reports"><Relatorios /></ProtectedFeatureRoute></ProtectedRoute>} />
            <Route path="gestao/auditoria" element={<ProtectedRoute module="configuracoes"><ProtectedFeatureRoute feature="feature_audit"><Auditoria /></ProtectedFeatureRoute></ProtectedRoute>} />
            
            {/* Configurações */}
            <Route path="config/procedimentos" element={<ProtectedRoute module="configuracoes"><ConfigProcedimentos /></ProtectedRoute>} />
            <Route path="config/clinica" element={<ProtectedRoute module="configuracoes"><ConfigClinica /></ProtectedRoute>} />
            <Route path="config/usuarios" element={<ProtectedRoute module="configuracoes"><ConfigUsuarios /></ProtectedRoute>} />
            <Route path="config/materiais" element={<ProtectedRoute module="configuracoes"><ConfigMateriais /></ProtectedRoute>} />
            <Route path="config/catalogo-clinico" element={<ProtectedRoute module="configuracoes"><CatalogoClinico /></ProtectedRoute>} />
            <Route path="config/agenda" element={<ProtectedRoute module="configuracoes"><ConfigAgenda /></ProtectedRoute>} />
            
            <Route path="config/prontuario" element={<ProtectedRoute module="configuracoes"><ConfigProntuario /></ProtectedRoute>} />
            <Route path="config/seguranca" element={<ProtectedRoute module="configuracoes"><ConfigSeguranca /></ProtectedRoute>} />
            <Route path="config/integracoes" element={<ProtectedRoute module="configuracoes"><ConfigIntegracoes /></ProtectedRoute>} />
            <Route path="config/modelos-anamnese" element={<ProtectedRoute module="configuracoes"><ModelosAnamnese /></ProtectedRoute>} />
            <Route path="config/documentos-institucionais" element={<ProtectedRoute module="configuracoes"><DocumentosInstitucionais /></ProtectedRoute>} />
            <Route path="config/formas-recebimento" element={<ProtectedRoute module="configuracoes"><FormasRecebimento /></ProtectedRoute>} />
            
            {/* Comercial */}
            <Route path="comercial" element={<ProtectedRoute module="comercial"><ProtectedFeatureRoute feature="feature_crm"><ComercialDashboard /></ProtectedFeatureRoute></ProtectedRoute>} />
            <Route path="comercial/leads" element={<ProtectedRoute module="comercial"><ProtectedFeatureRoute feature="feature_crm"><LeadsPage /></ProtectedFeatureRoute></ProtectedRoute>} />
            <Route path="comercial/oportunidades" element={<ProtectedRoute module="comercial"><ProtectedFeatureRoute feature="feature_crm"><OpportunitiesPage /></ProtectedFeatureRoute></ProtectedRoute>} />
            <Route path="comercial/orcamentos" element={<ProtectedRoute module="comercial"><ProtectedFeatureRoute feature="feature_crm"><QuotesPage /></ProtectedFeatureRoute></ProtectedRoute>} />
            <Route path="comercial/pacotes" element={<ProtectedRoute module="comercial"><ProtectedFeatureRoute feature="feature_crm"><PackagesCommercialPage /></ProtectedFeatureRoute></ProtectedRoute>} />
            <Route path="comercial/conversoes" element={<ProtectedRoute module="comercial"><ProtectedFeatureRoute feature="feature_crm"><ConversionsPage /></ProtectedFeatureRoute></ProtectedRoute>} />
            <Route path="comercial/follow-ups" element={<ProtectedRoute module="comercial"><ProtectedFeatureRoute feature="feature_crm"><FollowupsPage /></ProtectedFeatureRoute></ProtectedRoute>} />
            <Route path="comercial/metas" element={<ProtectedRoute module="comercial"><ProtectedFeatureRoute feature="feature_crm"><GoalsPage /></ProtectedFeatureRoute></ProtectedRoute>} />
            <Route path="comercial/relatorios" element={<ProtectedRoute module="comercial"><ProtectedFeatureRoute feature="feature_crm"><CommercialReportsPage /></ProtectedFeatureRoute></ProtectedRoute>} />
            
            {/* Teleconsulta - Sala do Profissional */}
            <Route path="teleconsulta/:appointmentId/sala" element={<ProtectedRoute module="agenda"><ProtectedFeatureRoute feature="feature_teleconsulta"><TeleconsultaSala /></ProtectedFeatureRoute></ProtectedRoute>} />

            {/* Fallback dentro do /app: redireciona ao Dashboard mantendo o layout autenticado */}
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
            <Route index element={<SuperAdminDashboard />} />
            <Route path="clinicas" element={<SuperAdminClinics />} />
            <Route path="planos" element={<SuperAdminPlans />} />
            <Route path="assinaturas" element={<SuperAdminSubscriptions />} />
            <Route path="recursos" element={<SuperAdminFeatureOverrides />} />
            <Route path="usuarios" element={<SuperAdminStub title="Usuários da plataforma" description="Gestão de papéis globais (Super Admin, Suporte) e auditoria de acesso." />} />
            <Route path="ocorrencias" element={<SuperAdminStub title="Ocorrências e bugs" description="Triagem e acompanhamento de incidentes reportados pelas clínicas." />} />
            <Route path="logs" element={<SuperAdminStub title="Logs e Auditoria" description="Auditoria das ações administrativas da plataforma." />} />
            <Route path="integracoes" element={<SuperAdminStub title="Integrações" description="Conectores com gateways, mensageria, Storage e outros provedores." />} />
            <Route path="uso" element={<SuperAdminStub title="Uso da plataforma" description="Métricas de adoção, consumo e saúde por clínica." />} />
            <Route path="financeiro" element={<SuperAdminStub title="Financeiro SaaS" description="Faturamento, cobranças e MRR/ARR consolidados." />} />
            <Route path="configuracoes" element={<SuperAdminStub title="Configurações da plataforma" description="Parâmetros globais, defaults de clínica e flags do sistema." />} />
          </Route>
          <Route
            path="/super-admin/setup"
            element={
              <ProtectedSuperAdminRoute>
                <SuperAdminSetup />
              </ProtectedSuperAdminRoute>
            }
          />

          {/* Catch-all global: NotFound decide entre /app e /login conforme auth */}
          <Route path="*" element={<NotFound />} />
        </Routes>
        <CookieConsent />
      </BrowserRouter>
        </ClinicFeaturesProvider>
      </PermissionsProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
