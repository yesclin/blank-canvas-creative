import { useState, useEffect } from "react";
import { Building2, User, CheckCircle2, XCircle, Search, Loader2, AlertTriangle, Lock } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { validateCPF, validateCNPJ, maskCPF, maskCNPJ } from "@/lib/validators";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";

interface CNPJData {
  razao_social: string;
  nome_fantasia: string;
  situacao: string;
  situacao_ativa: boolean;
  atividade_principal: string;
  endereco?: {
    cep: string;
    logradouro: string;
    numero: string;
    complemento: string;
    bairro: string;
    cidade: string;
    estado: string;
  };
  telefone?: string;
  email?: string;
}

interface FiscalIdentificationCardProps {
  fiscalType: "pf" | "pj" | "";
  cpf: string;
  cnpj: string;
  razaoSocial: string;
  nomeFantasia: string;
  nomeCompleto: string;
  nomeProfissional: string;
  inscricaoEstadual: string;
  inscricaoMunicipal: string;
  onFiscalTypeChange: (type: "pf" | "pj") => void;
  onCpfChange: (value: string) => void;
  onCnpjChange: (value: string) => void;
  onRazaoSocialChange: (value: string) => void;
  onNomeFantasiaChange: (value: string) => void;
  onNomeCompletoChange: (value: string) => void;
  onNomeProfissionalChange: (value: string) => void;
  onInscricaoEstadualChange: (value: string) => void;
  onInscricaoMunicipalChange: (value: string) => void;
  isValid: boolean;
  onValidationChange: (valid: boolean) => void;
  onCNPJDataFetched?: (data: CNPJData) => void;
  canEdit?: boolean;
  onClearFiscalFields?: () => void;
}

const fadeInOut = {
  initial: { opacity: 0, height: 0 },
  animate: { opacity: 1, height: "auto" },
  exit: { opacity: 0, height: 0 },
  transition: { duration: 0.2, ease: "easeInOut" as const },
};

export function FiscalIdentificationCard({
  fiscalType,
  cpf,
  cnpj,
  razaoSocial,
  nomeFantasia,
  nomeCompleto,
  nomeProfissional,
  inscricaoEstadual,
  inscricaoMunicipal,
  onFiscalTypeChange,
  onCpfChange,
  onCnpjChange,
  onRazaoSocialChange,
  onNomeFantasiaChange,
  onNomeCompletoChange,
  onNomeProfissionalChange,
  onInscricaoEstadualChange,
  onInscricaoMunicipalChange,
  isValid,
  onValidationChange,
  onCNPJDataFetched,
  canEdit = true,
  onClearFiscalFields,
}: FiscalIdentificationCardProps) {
  const [touched, setTouched] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [cnpjData, setCnpjData] = useState<CNPJData | null>(null);
  const [searchError, setSearchError] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    if (!fiscalType) {
      onValidationChange(false); // Tipo obrigatório
      return;
    }

    if (fiscalType === "pf") {
      const cleanCPF = cpf.replace(/\D/g, '');
      if (cleanCPF.length === 0) {
        onValidationChange(false); // CPF obrigatório
      } else if (cleanCPF.length < 11) {
        onValidationChange(false);
      } else {
        onValidationChange(validateCPF(cpf) && nomeCompleto.trim().length > 0);
      }
    } else if (fiscalType === "pj") {
      const cleanCNPJ = cnpj.replace(/\D/g, '');
      if (cleanCNPJ.length === 0) {
        onValidationChange(false); // CNPJ obrigatório
      } else if (cleanCNPJ.length < 14) {
        onValidationChange(false);
      } else {
        onValidationChange(validateCNPJ(cnpj) && razaoSocial.trim().length > 0);
      }
    }
  }, [fiscalType, cpf, cnpj, razaoSocial, nomeCompleto, onValidationChange]);

  const handleFiscalTypeChange = (type: "pf" | "pj") => {
    if (!canEdit) return;
    
    // Clear fields from previous type
    if (onClearFiscalFields) {
      onClearFiscalFields();
    }
    
    setCnpjData(null);
    setSearchError(null);
    setTouched(false);
    onFiscalTypeChange(type);
  };

  const handleCpfChange = (value: string) => {
    if (!canEdit) return;
    const masked = maskCPF(value);
    onCpfChange(masked);
    setTouched(true);
  };

  const handleCnpjChange = (value: string) => {
    if (!canEdit) return;
    const masked = maskCNPJ(value);
    onCnpjChange(masked);
    setTouched(true);
    setCnpjData(null);
    setSearchError(null);
  };

  const searchCNPJ = async () => {
    const cleanCNPJ = cnpj.replace(/\D/g, '');
    
    if (cleanCNPJ.length !== 14) {
      toast({
        title: "CNPJ incompleto",
        description: "Digite os 14 dígitos do CNPJ para consultar.",
        variant: "destructive",
      });
      return;
    }

    if (!validateCNPJ(cnpj)) {
      toast({
        title: "CNPJ inválido",
        description: "O CNPJ informado não é válido.",
        variant: "destructive",
      });
      return;
    }

    setIsSearching(true);
    setSearchError(null);
    setCnpjData(null);

    try {
      const { data, error } = await supabase.functions.invoke('consulta-cnpj', {
        body: { cnpj: cleanCNPJ }
      });

      if (error) throw error;

      if (data.error) {
        setSearchError(data.error);
        toast({
          title: "CNPJ não encontrado",
          description: data.error,
          variant: "destructive",
        });
        return;
      }

      setCnpjData(data.data);
      
      // Auto-fill razao social and nome fantasia
      if (data.data.razao_social) {
        onRazaoSocialChange(data.data.razao_social);
      }
      if (data.data.nome_fantasia) {
        onNomeFantasiaChange(data.data.nome_fantasia);
      }
      
      if (onCNPJDataFetched) {
        onCNPJDataFetched(data.data);
      }

      toast({
        title: "CNPJ validado!",
        description: `Empresa: ${data.data.razao_social}`,
      });

    } catch (error) {
      console.error('Erro ao consultar CNPJ:', error);
      setSearchError('Erro ao consultar a Receita Federal. Tente novamente.');
      toast({
        title: "Erro na consulta",
        description: "Não foi possível consultar o CNPJ. Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setIsSearching(false);
    }
  };

  const getValidationStatus = (type: "cpf" | "cnpj") => {
    const value = type === "cpf" ? cpf : cnpj;
    const cleanValue = value.replace(/\D/g, '');
    
    if (cleanValue.length === 0) return null;
    
    const expectedLength = type === "cpf" ? 11 : 14;
    if (cleanValue.length < expectedLength) return "incomplete";
    
    const validator = type === "cpf" ? validateCPF : validateCNPJ;
    return validator(value) ? "valid" : "invalid";
  };

  const cpfValidation = getValidationStatus("cpf");
  const cnpjValidation = getValidationStatus("cnpj");

  return (
    <Card className="overflow-hidden">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Building2 className="h-5 w-5 text-primary" />
            <CardTitle>Identificação Fiscal</CardTitle>
          </div>
          {!canEdit && (
            <Badge variant="secondary" className="gap-1">
              <Lock className="h-3 w-3" />
              Somente Admin
            </Badge>
          )}
        </div>
        <CardDescription>
          Dados fiscais obrigatórios para documentos, guias TISS e relatórios
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Tipo de Cadastro - Obrigatório */}
        <div className="space-y-3">
          <Label className="text-base font-semibold">
            Tipo de Cadastro <span className="text-destructive">*</span>
          </Label>
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => handleFiscalTypeChange("pf")}
              disabled={!canEdit}
              className={cn(
                "flex items-center gap-3 p-4 rounded-lg border-2 transition-all duration-200",
                "hover:border-primary/50 focus:outline-none focus:ring-2 focus:ring-primary/20",
                fiscalType === "pf"
                  ? "border-primary bg-primary/5 shadow-sm"
                  : "border-border bg-background",
                !canEdit && "opacity-60 cursor-not-allowed hover:border-border"
              )}
            >
              <div className={cn(
                "h-10 w-10 rounded-full flex items-center justify-center transition-colors",
                fiscalType === "pf" ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
              )}>
                <User className="h-5 w-5" />
              </div>
              <div className="text-left">
                <div className="font-medium">Pessoa Física</div>
                <div className="text-sm text-muted-foreground">CPF</div>
              </div>
              {fiscalType === "pf" && (
                <CheckCircle2 className="ml-auto h-5 w-5 text-primary" />
              )}
            </button>

            <button
              type="button"
              onClick={() => handleFiscalTypeChange("pj")}
              disabled={!canEdit}
              className={cn(
                "flex items-center gap-3 p-4 rounded-lg border-2 transition-all duration-200",
                "hover:border-primary/50 focus:outline-none focus:ring-2 focus:ring-primary/20",
                fiscalType === "pj"
                  ? "border-primary bg-primary/5 shadow-sm"
                  : "border-border bg-background",
                !canEdit && "opacity-60 cursor-not-allowed hover:border-border"
              )}
            >
              <div className={cn(
                "h-10 w-10 rounded-full flex items-center justify-center transition-colors",
                fiscalType === "pj" ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
              )}>
                <Building2 className="h-5 w-5" />
              </div>
              <div className="text-left">
                <div className="font-medium">Pessoa Jurídica</div>
                <div className="text-sm text-muted-foreground">CNPJ</div>
              </div>
              {fiscalType === "pj" && (
                <CheckCircle2 className="ml-auto h-5 w-5 text-primary" />
              )}
            </button>
          </div>
          {!fiscalType && (
            <p className="text-sm text-muted-foreground flex items-center gap-1">
              <AlertTriangle className="h-4 w-4 text-amber-500" />
              Selecione o tipo de cadastro para continuar
            </p>
          )}
        </div>

        {/* Campos Pessoa Física */}
        <AnimatePresence mode="wait">
          {fiscalType === "pf" && (
            <motion.div
              key="pf-fields"
              {...fadeInOut}
              className="space-y-4"
            >
              <div className="grid gap-2">
                <Label htmlFor="cpf">
                  CPF <span className="text-destructive">*</span>
                </Label>
                <div className="relative">
                  <Input
                    id="cpf"
                    value={cpf}
                    onChange={(e) => handleCpfChange(e.target.value)}
                    placeholder="000.000.000-00"
                    maxLength={14}
                    disabled={!canEdit}
                    className={cn(
                      "pr-10",
                      touched && cpfValidation === "invalid" && "border-destructive focus-visible:ring-destructive",
                      cpfValidation === "valid" && "border-primary focus-visible:ring-primary"
                    )}
                  />
                  {cpfValidation === "valid" && (
                    <CheckCircle2 className="absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 text-primary" />
                  )}
                  {touched && cpfValidation === "invalid" && (
                    <XCircle className="absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 text-destructive" />
                  )}
                </div>
                {touched && cpfValidation === "invalid" && (
                  <p className="text-sm text-destructive">CPF inválido. Verifique os dígitos.</p>
                )}
              </div>

              <div className="grid gap-2">
                <Label htmlFor="nome_completo">
                  Nome Completo <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="nome_completo"
                  value={nomeCompleto}
                  onChange={(e) => onNomeCompletoChange(e.target.value)}
                  placeholder="Nome completo do titular"
                  disabled={!canEdit}
                  className={cn(
                    touched && !nomeCompleto.trim() && "border-destructive focus-visible:ring-destructive"
                  )}
                />
                {touched && !nomeCompleto.trim() && (
                  <p className="text-sm text-destructive">Nome completo é obrigatório.</p>
                )}
              </div>

              <div className="grid gap-2">
                <Label htmlFor="nome_profissional">
                  Nome Profissional / Clínica
                  <span className="text-muted-foreground text-xs ml-1">(opcional)</span>
                </Label>
                <Input
                  id="nome_profissional"
                  value={nomeProfissional}
                  onChange={(e) => onNomeProfissionalChange(e.target.value)}
                  placeholder="Ex: Dr. João Silva - Consultório Dermatológico"
                  disabled={!canEdit}
                />
                <p className="text-xs text-muted-foreground">
                  Nome que aparecerá em documentos e comunicações
                </p>
              </div>
            </motion.div>
          )}

          {/* Campos Pessoa Jurídica */}
          {fiscalType === "pj" && (
            <motion.div
              key="pj-fields"
              {...fadeInOut}
              className="space-y-4"
            >
              <div className="grid gap-2">
                <Label htmlFor="cnpj">
                  CNPJ <span className="text-destructive">*</span>
                </Label>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <Input
                      id="cnpj"
                      value={cnpj}
                      onChange={(e) => handleCnpjChange(e.target.value)}
                      placeholder="00.000.000/0000-00"
                      maxLength={18}
                      disabled={!canEdit}
                      className={cn(
                        "pr-10",
                        touched && cnpjValidation === "invalid" && "border-destructive focus-visible:ring-destructive",
                        cnpjValidation === "valid" && "border-primary focus-visible:ring-primary"
                      )}
                    />
                    {cnpjValidation === "valid" && !isSearching && (
                      <CheckCircle2 className="absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 text-primary" />
                    )}
                    {touched && cnpjValidation === "invalid" && (
                      <XCircle className="absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 text-destructive" />
                    )}
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={searchCNPJ}
                    disabled={isSearching || cnpjValidation !== "valid" || !canEdit}
                  >
                    {isSearching ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Search className="h-4 w-4" />
                    )}
                    <span className="ml-2 hidden sm:inline">Consultar</span>
                  </Button>
                </div>
                {touched && cnpjValidation === "invalid" && (
                  <p className="text-sm text-destructive">CNPJ inválido. Verifique os dígitos.</p>
                )}
                <p className="text-xs text-muted-foreground">
                  Clique em Consultar para validar e preencher automaticamente
                </p>
              </div>

              {searchError && (
                <Alert variant="destructive">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>{searchError}</AlertDescription>
                </Alert>
              )}

              {cnpjData && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="rounded-lg border bg-muted/50 p-4 space-y-2"
                >
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="h-5 w-5 text-primary" />
                    <span className="font-semibold text-sm">Dados da Receita Federal</span>
                    <Badge variant={cnpjData.situacao_ativa ? "default" : "destructive"} className="ml-auto">
                      {cnpjData.situacao}
                    </Badge>
                  </div>
                  
                  {!cnpjData.situacao_ativa && (
                    <Alert variant="destructive" className="py-2">
                      <AlertTriangle className="h-4 w-4" />
                      <AlertDescription className="text-xs">
                        Este CNPJ não está ativo na Receita Federal.
                      </AlertDescription>
                    </Alert>
                  )}
                </motion.div>
              )}

              <div className="grid gap-2">
                <Label htmlFor="razao_social">
                  Razão Social <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="razao_social"
                  value={razaoSocial}
                  onChange={(e) => onRazaoSocialChange(e.target.value)}
                  placeholder="Razão social da empresa"
                  disabled={!canEdit}
                  className={cn(
                    touched && !razaoSocial.trim() && "border-destructive focus-visible:ring-destructive"
                  )}
                />
                {touched && !razaoSocial.trim() && (
                  <p className="text-sm text-destructive">Razão social é obrigatória.</p>
                )}
              </div>

              <div className="grid gap-2">
                <Label htmlFor="nome_fantasia">Nome Fantasia</Label>
                <Input
                  id="nome_fantasia"
                  value={nomeFantasia}
                  onChange={(e) => onNomeFantasiaChange(e.target.value)}
                  placeholder="Nome fantasia da empresa"
                  disabled={!canEdit}
                />
                <p className="text-xs text-muted-foreground">
                  Nome que aparecerá em documentos e comunicações
                </p>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="grid gap-2">
                  <Label htmlFor="inscricao_estadual">
                    Inscrição Estadual
                    <span className="text-muted-foreground text-xs ml-1">(opcional)</span>
                  </Label>
                  <Input
                    id="inscricao_estadual"
                    value={inscricaoEstadual}
                    onChange={(e) => onInscricaoEstadualChange(e.target.value)}
                    placeholder="000.000.000.000"
                    maxLength={20}
                    disabled={!canEdit}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="inscricao_municipal">
                    Inscrição Municipal
                    <span className="text-muted-foreground text-xs ml-1">(opcional)</span>
                  </Label>
                  <Input
                    id="inscricao_municipal"
                    value={inscricaoMunicipal}
                    onChange={(e) => onInscricaoMunicipalChange(e.target.value)}
                    placeholder="000.000.000"
                    maxLength={20}
                    disabled={!canEdit}
                  />
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Status de Validação */}
        {fiscalType && (
          <div className={cn(
            "p-3 rounded-lg border text-sm flex items-center gap-2",
            isValid
              ? "bg-primary/5 border-primary/20 text-primary"
              : "bg-amber-50 border-amber-200 text-amber-700 dark:bg-amber-950/20 dark:border-amber-800 dark:text-amber-400"
          )}>
            {isValid ? (
              <>
                <CheckCircle2 className="h-4 w-4" />
                <span>Dados fiscais completos e válidos</span>
              </>
            ) : (
              <>
                <AlertTriangle className="h-4 w-4" />
                <span>Preencha todos os campos obrigatórios marcados com *</span>
              </>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
