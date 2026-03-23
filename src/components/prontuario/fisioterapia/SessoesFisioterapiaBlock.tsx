/**
 * FISIOTERAPIA - Bloco de Sessões / Evoluções
 * 
 * Permite registro detalhado de cada sessão de fisioterapia.
 * Mantém histórico cronológico completo dos atendimentos.
 */

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { 
  ClipboardList, 
  Plus, 
  User,
  Calendar,
  ChevronDown,
  ChevronRight,
  X,
  Dumbbell,
  Activity,
  TrendingUp,
  TrendingDown,
  Minus,
  FileEdit,
  Stethoscope
} from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { 
  useSessoesFisioterapiaData, 
  getEmptySessaoForm,
  RESPOSTA_PACIENTE_OPTIONS,
  EVOLUCAO_FUNCIONAL_OPTIONS,
  type SessaoFormData,
  type SessaoFisioterapiaData
} from '@/hooks/prontuario/fisioterapia/useSessoesFisioterapiaData';

interface SessoesFisioterapiaBlockProps {
  patientId: string | null;
  clinicId: string | null;
  professionalId: string | null;
  canEdit?: boolean;
}

/**
 * Componente de lista dinâmica de itens
 */
function DynamicList({
  label,
  items,
  onChange,
  placeholder,
  icon: Icon,
}: {
  label: string;
  items: string[];
  onChange: (items: string[]) => void;
  placeholder: string;
  icon?: React.ElementType;
}) {
  const handleAdd = () => {
    onChange([...items, '']);
  };

  const handleRemove = (index: number) => {
    if (items.length > 1) {
      onChange(items.filter((_, i) => i !== index));
    }
  };

  const handleChange = (index: number, value: string) => {
    const updated = [...items];
    updated[index] = value;
    onChange(updated);
  };

  return (
    <div className="space-y-2">
      <Label className="flex items-center gap-2">
        {Icon && <Icon className="h-4 w-4" />}
        {label}
      </Label>
      <div className="space-y-2">
        {items.map((item, index) => (
          <div key={index} className="flex gap-2">
            <Input
              placeholder={`${placeholder} ${index + 1}`}
              value={item}
              onChange={(e) => handleChange(index, e.target.value)}
            />
            {items.length > 1 && (
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => handleRemove(index)}
              >
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>
        ))}
      </div>
      <Button type="button" variant="outline" size="sm" onClick={handleAdd}>
        <Plus className="h-4 w-4 mr-2" />
        Adicionar
      </Button>
    </div>
  );
}

/**
 * Escala visual de dor
 */
function DorScale({
  value,
  onChange,
}: {
  value: number | null;
  onChange: (value: number | null) => void;
}) {
  const getColor = (v: number) => {
    if (v <= 3) return 'bg-green-600';
    if (v <= 6) return 'bg-yellow-600';
    return 'bg-destructive';
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <Label>Dor Pós-Sessão (EVA)</Label>
        <span className="text-lg font-bold">
          {value !== null ? value : '-'}
        </span>
      </div>
      <Slider
        value={value !== null ? [value] : [0]}
        onValueChange={([v]) => onChange(v)}
        max={10}
        step={1}
        className="w-full"
      />
      <div className="flex justify-between text-xs text-muted-foreground">
        <span>Sem dor</span>
        <span>Dor moderada</span>
        <span>Dor intensa</span>
      </div>
      {value !== null && (
        <div className="flex justify-center">
          <Badge className={getColor(value)}>
            {value <= 3 ? 'Leve' : value <= 6 ? 'Moderada' : 'Intensa'}
          </Badge>
        </div>
      )}
    </div>
  );
}

/**
 * Formulário de Sessão
 */
function SessaoForm({
  onSubmit,
  onCancel,
  isSubmitting,
}: {
  onSubmit: (data: SessaoFormData) => void;
  onCancel: () => void;
  isSubmitting: boolean;
}) {
  const [formData, setFormData] = useState<SessaoFormData>(getEmptySessaoForm());

  const handleChange = (field: keyof SessaoFormData, value: string | string[] | number | null) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Data do Atendimento */}
      <div className="space-y-2">
        <Label htmlFor="data_atendimento" className="flex items-center gap-2">
          <Calendar className="h-4 w-4" />
          Data do Atendimento *
        </Label>
        <Input
          id="data_atendimento"
          type="date"
          value={formData.data_atendimento}
          onChange={(e) => handleChange('data_atendimento', e.target.value)}
          required
        />
      </div>

      {/* Técnicas Aplicadas */}
      <DynamicList
        label="Técnicas Aplicadas"
        items={formData.tecnicas_aplicadas}
        onChange={(items) => handleChange('tecnicas_aplicadas', items)}
        placeholder="Técnica"
        icon={Stethoscope}
      />

      {/* Exercícios Realizados */}
      <DynamicList
        label="Exercícios Realizados"
        items={formData.exercicios_realizados}
        onChange={(items) => handleChange('exercicios_realizados', items)}
        placeholder="Exercício"
        icon={Dumbbell}
      />

      {/* Resposta do Paciente */}
      <div className="space-y-2">
        <Label htmlFor="resposta_paciente" className="flex items-center gap-2">
          <Activity className="h-4 w-4" />
          Resposta do Paciente
        </Label>
        <Select
          value={formData.resposta_paciente}
          onValueChange={(value) => handleChange('resposta_paciente', value)}
        >
          <SelectTrigger>
            <SelectValue placeholder="Selecione..." />
          </SelectTrigger>
          <SelectContent>
            {RESPOSTA_PACIENTE_OPTIONS.map(opt => (
              <SelectItem key={opt.value} value={opt.value}>
                {opt.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Textarea
          placeholder="Observações sobre a resposta do paciente..."
          value={formData.resposta_paciente_obs}
          onChange={(e) => handleChange('resposta_paciente_obs', e.target.value)}
          rows={2}
        />
      </div>

      {/* Dor Pós-Sessão */}
      <DorScale
        value={formData.dor_pos_sessao}
        onChange={(value) => handleChange('dor_pos_sessao', value)}
      />

      {/* Evolução Funcional */}
      <div className="space-y-2">
        <Label htmlFor="evolucao_funcional" className="flex items-center gap-2">
          <TrendingUp className="h-4 w-4" />
          Evolução Funcional
        </Label>
        <Select
          value={formData.evolucao_funcional}
          onValueChange={(value) => handleChange('evolucao_funcional', value)}
        >
          <SelectTrigger>
            <SelectValue placeholder="Selecione..." />
          </SelectTrigger>
          <SelectContent>
            {EVOLUCAO_FUNCIONAL_OPTIONS.map(opt => (
              <SelectItem key={opt.value} value={opt.value}>
                {opt.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Textarea
          placeholder="Detalhes sobre a evolução funcional..."
          value={formData.evolucao_funcional_obs}
          onChange={(e) => handleChange('evolucao_funcional_obs', e.target.value)}
          rows={2}
        />
      </div>

      {/* Ajustes no Plano */}
      <div className="space-y-2">
        <Label htmlFor="ajustes_plano" className="flex items-center gap-2">
          <FileEdit className="h-4 w-4" />
          Ajustes no Plano Terapêutico
        </Label>
        <Textarea
          id="ajustes_plano"
          placeholder="Modificações realizadas ou necessárias no plano..."
          value={formData.ajustes_plano}
          onChange={(e) => handleChange('ajustes_plano', e.target.value)}
          rows={2}
        />
      </div>

      {/* Nova Conduta */}
      <div className="space-y-2">
        <Label htmlFor="nova_conduta">Nova Conduta Definida</Label>
        <Textarea
          id="nova_conduta"
          placeholder="Condutas a serem seguidas a partir desta sessão..."
          value={formData.nova_conduta}
          onChange={(e) => handleChange('nova_conduta', e.target.value)}
          rows={2}
        />
      </div>

      {/* Observações */}
      <div className="space-y-2">
        <Label htmlFor="observacoes">Observações Gerais</Label>
        <Textarea
          id="observacoes"
          placeholder="Outras observações relevantes..."
          value={formData.observacoes}
          onChange={(e) => handleChange('observacoes', e.target.value)}
          rows={2}
        />
      </div>

      <DialogFooter>
        <Button type="button" variant="outline" onClick={onCancel} disabled={isSubmitting}>
          Cancelar
        </Button>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? 'Salvando...' : 'Registrar Sessão'}
        </Button>
      </DialogFooter>
    </form>
  );
}

/**
 * Ícone de tendência de evolução
 */
function EvolucaoIcon({ evolucao }: { evolucao: string }) {
  if (evolucao.includes('melhora')) {
    return <TrendingUp className="h-4 w-4 text-primary" />;
  }
  if (evolucao.includes('piora')) {
    return <TrendingDown className="h-4 w-4 text-destructive" />;
  }
  return <Minus className="h-4 w-4 text-muted-foreground" />;
}

/**
 * Card de visualização de uma sessão
 */
function SessaoCard({
  sessao,
  defaultOpen = false,
}: {
  sessao: SessaoFisioterapiaData;
  defaultOpen?: boolean;
}) {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  const getRespostaLabel = (value: string) => {
    return RESPOSTA_PACIENTE_OPTIONS.find(o => o.value === value)?.label || value;
  };

  const getEvolucaoLabel = (value: string) => {
    return EVOLUCAO_FUNCIONAL_OPTIONS.find(o => o.value === value)?.label || value;
  };

  const getDorColor = (dor: number) => {
    if (dor <= 3) return 'bg-green-600';
    if (dor <= 6) return 'bg-yellow-600';
    return 'bg-destructive';
  };

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <Card>
        <CollapsibleTrigger asChild>
          <CardHeader className="cursor-pointer hover:bg-muted/50 transition-colors">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                {isOpen ? (
                  <ChevronDown className="h-4 w-4 text-muted-foreground" />
                ) : (
                  <ChevronRight className="h-4 w-4 text-muted-foreground" />
                )}
                <div>
                  <CardTitle className="text-base flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    {format(new Date(sessao.data_atendimento), "dd/MM/yyyy", { locale: ptBR })}
                  </CardTitle>
                  <CardDescription className="flex items-center gap-3 mt-1">
                    {sessao.professional_name && (
                      <span className="flex items-center gap-1">
                        <User className="h-3 w-3" />
                        {sessao.professional_name}
                      </span>
                    )}
                    {sessao.tecnicas_aplicadas.length > 0 && (
                      <span className="text-xs">
                        {sessao.tecnicas_aplicadas.length} técnica(s)
                      </span>
                    )}
                  </CardDescription>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {sessao.evolucao_funcional && (
                  <EvolucaoIcon evolucao={sessao.evolucao_funcional} />
                )}
                {sessao.dor_pos_sessao !== null && (
                  <Badge className={getDorColor(sessao.dor_pos_sessao)}>
                    EVA: {sessao.dor_pos_sessao}
                  </Badge>
                )}
              </div>
            </div>
          </CardHeader>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <CardContent className="pt-0 space-y-4">
            {/* Técnicas */}
            {sessao.tecnicas_aplicadas.length > 0 && (
              <div className="space-y-2">
                <p className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                  <Stethoscope className="h-4 w-4" />
                  Técnicas Aplicadas
                </p>
                <div className="flex flex-wrap gap-2">
                  {sessao.tecnicas_aplicadas.map((tec, i) => (
                    <Badge key={i} variant="secondary">{tec}</Badge>
                  ))}
                </div>
              </div>
            )}

            {/* Exercícios */}
            {sessao.exercicios_realizados.length > 0 && (
              <div className="space-y-2">
                <p className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                  <Dumbbell className="h-4 w-4" />
                  Exercícios Realizados
                </p>
                <div className="flex flex-wrap gap-2">
                  {sessao.exercicios_realizados.map((ex, i) => (
                    <Badge key={i} variant="outline">{ex}</Badge>
                  ))}
                </div>
              </div>
            )}

            <div className="grid gap-4 md:grid-cols-2">
              {/* Resposta do Paciente */}
              {sessao.resposta_paciente && (
                <div className="space-y-1">
                  <p className="text-sm font-medium text-muted-foreground">Resposta do Paciente</p>
                  <p className="text-sm">{getRespostaLabel(sessao.resposta_paciente)}</p>
                  {sessao.resposta_paciente_obs && (
                    <p className="text-xs text-muted-foreground">{sessao.resposta_paciente_obs}</p>
                  )}
                </div>
              )}

              {/* Evolução Funcional */}
              {sessao.evolucao_funcional && (
                <div className="space-y-1">
                  <p className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                    Evolução Funcional
                    <EvolucaoIcon evolucao={sessao.evolucao_funcional} />
                  </p>
                  <p className="text-sm">{getEvolucaoLabel(sessao.evolucao_funcional)}</p>
                  {sessao.evolucao_funcional_obs && (
                    <p className="text-xs text-muted-foreground">{sessao.evolucao_funcional_obs}</p>
                  )}
                </div>
              )}

              {/* Ajustes no Plano */}
              {sessao.ajustes_plano && (
                <div className="space-y-1 md:col-span-2">
                  <p className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                    <FileEdit className="h-3 w-3" />
                    Ajustes no Plano
                  </p>
                  <p className="text-sm">{sessao.ajustes_plano}</p>
                </div>
              )}

              {/* Nova Conduta */}
              {sessao.nova_conduta && (
                <div className="space-y-1 md:col-span-2">
                  <p className="text-sm font-medium text-muted-foreground">Nova Conduta</p>
                  <p className="text-sm">{sessao.nova_conduta}</p>
                </div>
              )}

              {/* Observações */}
              {sessao.observacoes && (
                <div className="space-y-1 md:col-span-2">
                  <p className="text-sm font-medium text-muted-foreground">Observações</p>
                  <p className="text-sm text-muted-foreground">{sessao.observacoes}</p>
                </div>
              )}
            </div>
          </CardContent>
        </CollapsibleContent>
      </Card>
    </Collapsible>
  );
}

export function SessoesFisioterapiaBlock({
  patientId,
  clinicId,
  professionalId,
  canEdit = false,
}: SessoesFisioterapiaBlockProps) {
  const {
    sessions,
    totalSessoes,
    ultimaSessao,
    mediaDor,
    loading,
    isFormOpen,
    setIsFormOpen,
    saveSessao,
    isSaving,
  } = useSessoesFisioterapiaData({ patientId, clinicId, professionalId });

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-48" />
      </div>
    );
  }

  if (!patientId) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <User className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground">Selecione um paciente para visualizar as sessões.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Cabeçalho */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-primary/20 rounded-full">
            <ClipboardList className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h2 className="text-lg font-semibold">Sessões / Evoluções</h2>
            <p className="text-sm text-muted-foreground">
              {totalSessoes > 0 
                ? `${totalSessoes} sessão(ões) registrada(s)` 
                : 'Nenhuma sessão registrada'}
              {mediaDor !== null && ` • Média EVA: ${mediaDor.toFixed(1)}`}
            </p>
          </div>
        </div>
        {canEdit && (
          <Button onClick={() => setIsFormOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Nova Sessão
          </Button>
        )}
      </div>

      {/* Conteúdo */}
      {sessions.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <ClipboardList className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground mb-4">Nenhuma sessão registrada.</p>
            {canEdit && (
              <Button onClick={() => setIsFormOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Registrar Primeira Sessão
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <ScrollArea className="max-h-[600px]">
          <div className="space-y-3">
            {sessions.map((sessao, index) => (
              <SessaoCard
                key={sessao.id}
                sessao={sessao}
                defaultOpen={index === 0}
              />
            ))}
          </div>
        </ScrollArea>
      )}

      {/* Dialog do Formulário */}
      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Nova Sessão de Fisioterapia</DialogTitle>
            <DialogDescription>
              Registre os detalhes do atendimento realizado.
            </DialogDescription>
          </DialogHeader>
          <SessaoForm
            onSubmit={saveSessao}
            onCancel={() => setIsFormOpen(false)}
            isSubmitting={isSaving}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}
