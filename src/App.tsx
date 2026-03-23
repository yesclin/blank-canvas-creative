import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { PermissionsProvider } from "@/hooks/usePermissions";
import { RequireAuth } from "@/components/app/RequireAuth";
import { ProtectedRoute } from "@/components/app/ProtectedRoute";
import { PasswordRecoveryHandler } from "@/components/app/PasswordRecoveryHandler";

// Páginas Públicas
import Index from "./pages/Index";
import Login from "./pages/Login";
import CriarConta from "./pages/CriarConta";
import RecuperarSenha from "./pages/RecuperarSenha";
import RedefinirSenha from "./pages/RedefinirSenha";
import AceitarConvite from "./pages/AceitarConvite";

import NotFound from "./pages/NotFound";
import ValidarDocumento from "./pages/ValidarDocumento";

// Layout do App
import { AppLayout } from "./components/app/AppLayout";

// Páginas do App
import Dashboard from "./pages/app/Dashboard";
import Agenda from "./pages/app/Agenda";
import Prontuario from "./pages/app/Prontuario";
import Pacientes from "./pages/app/Pacientes";
import Convenios from "./pages/app/gestao/Convenios";
import MeuFinanceiro from "./pages/app/MeuFinanceiro";

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
import ConfigAgenda from "./pages/app/config/Agenda";

import ConfigProntuario from "./pages/app/config/Prontuario";
import ConfigSeguranca from "./pages/app/config/Seguranca";
import ConfigIntegracoes from "./pages/app/config/Integracoes";
import ModelosAnamnese from "./pages/configuracoes/ModelosAnamnese";
import DocumentosInstitucionais from "./pages/app/config/DocumentosInstitucionais";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <PermissionsProvider>
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
            <Route path="agenda" element={<ProtectedRoute module="agenda"><Agenda /></ProtectedRoute>} />
            <Route path="prontuario" element={<ProtectedRoute module="prontuario"><Prontuario /></ProtectedRoute>} />
            <Route path="prontuario/:patientId" element={<ProtectedRoute module="prontuario"><Prontuario /></ProtectedRoute>} />
            <Route path="pacientes" element={<ProtectedRoute module="pacientes"><Pacientes /></ProtectedRoute>} />
            <Route path="gestao/convenios" element={<ProtectedRoute module="convenios"><Convenios /></ProtectedRoute>} />
            <Route path="meu-financeiro" element={<ProtectedRoute module="meu_financeiro"><MeuFinanceiro /></ProtectedRoute>} />
            
            {/* Marketing - Página única com abas */}
            <Route path="marketing" element={<ProtectedRoute module="comunicacao"><MarketingLayout /></ProtectedRoute>} />
            
            {/* Gestão */}
            <Route path="gestao/financas" element={<ProtectedRoute module="financeiro"><Financas /></ProtectedRoute>} />
            <Route path="gestao/estoque" element={<ProtectedRoute module="estoque"><Estoque /></ProtectedRoute>} />
            <Route path="gestao/relatorios" element={<ProtectedRoute module="relatorios"><Relatorios /></ProtectedRoute>} />
            <Route path="gestao/auditoria" element={<ProtectedRoute module="configuracoes"><Auditoria /></ProtectedRoute>} />
            
            {/* Configurações */}
            <Route path="config/procedimentos" element={<ProtectedRoute module="configuracoes"><ConfigProcedimentos /></ProtectedRoute>} />
            <Route path="config/clinica" element={<ProtectedRoute module="configuracoes"><ConfigClinica /></ProtectedRoute>} />
            <Route path="config/usuarios" element={<ProtectedRoute module="configuracoes"><ConfigUsuarios /></ProtectedRoute>} />
            <Route path="config/materiais" element={<ProtectedRoute module="configuracoes"><ConfigMateriais /></ProtectedRoute>} />
            <Route path="config/agenda" element={<ProtectedRoute module="configuracoes"><ConfigAgenda /></ProtectedRoute>} />
            
            <Route path="config/prontuario" element={<ProtectedRoute module="configuracoes"><ConfigProntuario /></ProtectedRoute>} />
            <Route path="config/seguranca" element={<ProtectedRoute module="configuracoes"><ConfigSeguranca /></ProtectedRoute>} />
            <Route path="config/integracoes" element={<ProtectedRoute module="configuracoes"><ConfigIntegracoes /></ProtectedRoute>} />
            <Route path="config/modelos-anamnese" element={<ProtectedRoute module="configuracoes"><ModelosAnamnese /></ProtectedRoute>} />
            <Route path="config/documentos-institucionais" element={<ProtectedRoute module="configuracoes"><DocumentosInstitucionais /></ProtectedRoute>} />
          </Route>
          
          {/* Catch-all */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
      </PermissionsProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
