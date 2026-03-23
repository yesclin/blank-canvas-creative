/**
 * NUTRIÇÃO - Evoluções
 * 
 * Bloco para registro de evoluções clínicas nutricionais.
 * Utiliza templates especializados para diferentes tipos de evolução.
 */

import { useState } from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  Activity, 
  Plus, 
  FileSignature,
  Calendar,
  User,
  CheckCircle,
  Clock,
  ClipboardList,
  Ruler,
  Stethoscope,
  UtensilsCrossed,
  RefreshCcw
} from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { 
  type EvolucaoNutricao, 
  type EvolucaoNutricaoFormData,
} from '@/hooks/prontuario/nutricao';
import { 
  type TipoEvolucaoNutricao, 
  TIPO_EVOLUCAO_LABELS,
  getTemplateById 
} from '@/hooks/prontuario/nutricao/evolucaoTemplates';
import { EvolucaoTemplateSelectorDialog } from './EvolucaoTemplateSelectorDialog';
import { EvolucaoTemplateFormDialog } from './EvolucaoTemplateFormDialog';
import { toast } from 'sonner';

interface EvolucoesNutricaoBlockProps {
  evolucoes: EvolucaoNutricao[];
  loading: boolean;
  saving: boolean;
  canEdit: boolean;
  onSave: (data: EvolucaoNutricaoFormData, appointmentId?: string) => Promise<unknown>;
  onSign: (evolucaoId: string) => Promise<boolean>;
  onSaveTemplate?: (data: { templateId: TipoEvolucaoNutricao; content: Record<string, unknown> }) => Promise<unknown>;
  onSignTemplate?: (data: { templateId: TipoEvolucaoNutricao; content: Record<string, unknown> }) => Promise<boolean>;
}

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  ClipboardList,
  Ruler,
  Stethoscope,
  UtensilsCrossed,
  RefreshCcw,
};

export function EvolucoesNutricaoBlock({
  evolucoes,
  loading,
  saving,
  canEdit,
  onSave,
  onSign,
  onSaveTemplate,
  onSignTemplate,
}: EvolucoesNutricaoBlockProps) {
  const [showTemplateSelector, setShowTemplateSelector] = useState(false);
  const [selectedTemplateId, setSelectedTemplateId] = useState<TipoEvolucaoNutricao | null>(null);

  const handleTemplateSelect = (templateId: TipoEvolucaoNutricao) => {
    setSelectedTemplateId(templateId);
  };

  const handleSaveTemplate = async (data: { templateId: TipoEvolucaoNutricao; content: Record<string, unknown> }) => {
    if (onSaveTemplate) {
      return onSaveTemplate(data);
    }
    // Fallback: convert to old format
    const formData: EvolucaoNutricaoFormData = {
      data_atendimento: new Date().toISOString().split('T')[0],
      tipo_consulta: data.templateId === 'avaliacao_inicial' ? 'primeira_consulta' : 
                     data.templateId === 'evolucao_retorno' ? 'retorno' : 'acompanhamento',
      queixa_principal: null,
      peso_atual_kg: (data.content.peso_atual as number) || (data.content.peso_atual_kg as number) || null,
      observacoes_peso: null,
      adesao_plano: (data.content.adesao_plano as 'boa' | 'regular' | 'ruim') || null,
      dificuldades_relatadas: (data.content.dificuldades_relatadas as string) || null,
      sintomas_gi: (data.content.sintomas_gi as string[]) || [],
      avaliacao: (data.content.observacoes_nutricionista as string) || 
                 (data.content.observacoes_plano as string) || 
                 (data.content.conclusao_diagnostica as string) || null,
      ajustes_realizados: (data.content.ajustes_realizados as string) || null,
      orientacoes: (data.content.orientacoes_reforco as string[]) || [],
      proximos_passos: (data.content.proximos_passos as string) || null,
    };
    const result = await onSave(formData);
    if (result) {
      toast.success('Evolução salva como rascunho');
    }
    return result;
  };

  const handleSignTemplate = async (data: { templateId: TipoEvolucaoNutricao; content: Record<string, unknown> }): Promise<boolean> => {
    if (onSignTemplate) {
      return onSignTemplate(data);
    }
    // Fallback: save first then sign
    const result = await handleSaveTemplate(data);
    if (result && typeof result === 'object' && 'id' in result) {
      const signResult = await onSign((result as { id: string }).id);
      if (signResult) {
        toast.success('Evolução assinada com sucesso');
      }
      return signResult;
    }
    return false;
  };

  // Helper to get display info for an evolution
  const getEvolucaoDisplayInfo = (evolucao: EvolucaoNutricao) => {
    const content = evolucao as unknown as Record<string, unknown>;
    const templateId = content.templateId as TipoEvolucaoNutricao | undefined;
    
    if (templateId) {
      const template = getTemplateById(templateId);
      if (template) {
        const IconComponent = iconMap[template.icon] || Activity;
        return {
          label: template.nome,
          icon: IconComponent,
        };
      }
    }
    
    // Fallback for old format
    return {
      label: evolucao.tipo_consulta === 'primeira_consulta' ? 'Avaliação Inicial' :
             evolucao.tipo_consulta === 'retorno' ? 'Retorno' : 'Acompanhamento',
      icon: Activity,
    };
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-48" />
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <Skeleton className="h-24 w-full" />
            <Skeleton className="h-24 w-full" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Cabeçalho */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Activity className="h-5 w-5 text-primary" />
          <h2 className="text-lg font-semibold">Evoluções Nutricionais</h2>
        </div>
        {canEdit && (
          <Button onClick={() => setShowTemplateSelector(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Nova Evolução Nutricional
          </Button>
        )}
      </div>

      {/* Dialog de seleção de template */}
      <EvolucaoTemplateSelectorDialog
        open={showTemplateSelector}
        onOpenChange={setShowTemplateSelector}
        onSelectTemplate={handleTemplateSelect}
      />

      {/* Dialog do formulário do template */}
      {selectedTemplateId && (
        <EvolucaoTemplateFormDialog
          open={!!selectedTemplateId}
          onOpenChange={(open) => !open && setSelectedTemplateId(null)}
          templateId={selectedTemplateId}
          onSave={handleSaveTemplate}
          onSign={handleSignTemplate}
          saving={saving}
        />
      )}

      {/* Lista de Evoluções */}
      {evolucoes.length > 0 && (
        <div className="space-y-3">
          {evolucoes.map((evolucao) => {
            const displayInfo = getEvolucaoDisplayInfo(evolucao);
            const IconComponent = displayInfo.icon;
            
            return (
              <Card key={evolucao.id}>
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="flex items-center gap-1">
                        <IconComponent className="h-3 w-3" />
                        {displayInfo.label}
                      </Badge>
                      {evolucao.status === 'signed' ? (
                        <Badge variant="default" className="bg-primary">
                          <CheckCircle className="h-3 w-3 mr-1" />
                          Assinada
                        </Badge>
                      ) : (
                        <Badge variant="secondary">
                          <Clock className="h-3 w-3 mr-1" />
                          Rascunho
                        </Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Calendar className="h-3 w-3" />
                      {format(new Date(evolucao.created_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  {/* Info do profissional */}
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <User className="h-3 w-3" />
                    {evolucao.professional_name}
                  </div>

                  {/* Dados da evolução */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                    {evolucao.peso_atual_kg && (
                      <div className="p-2 bg-muted rounded">
                        <p className="text-xs text-muted-foreground">Peso</p>
                        <p className="font-medium">{evolucao.peso_atual_kg} kg</p>
                      </div>
                    )}
                    {evolucao.adesao_plano && (
                      <div className="p-2 bg-muted rounded">
                        <p className="text-xs text-muted-foreground">Adesão</p>
                        <p className="font-medium capitalize">{evolucao.adesao_plano}</p>
                      </div>
                    )}
                  </div>

                  {/* Queixa */}
                  {evolucao.queixa_principal && (
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">Queixa Principal</p>
                      <p className="text-sm">{evolucao.queixa_principal}</p>
                    </div>
                  )}

                  {/* Sintomas GI */}
                  {evolucao.sintomas_gi.length > 0 && (
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">Sintomas GI</p>
                      <div className="flex flex-wrap gap-1">
                        {evolucao.sintomas_gi.map((sintoma, index) => (
                          <Badge key={index} variant="outline" className="text-xs">
                            {sintoma}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Avaliação */}
                  {evolucao.avaliacao && (
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">Avaliação</p>
                      <p className="text-sm bg-muted/50 p-2 rounded">{evolucao.avaliacao}</p>
                    </div>
                  )}

                  {/* Ajustes Realizados */}
                  {evolucao.ajustes_realizados && (
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">Ajustes Realizados</p>
                      <p className="text-sm bg-primary/5 p-2 rounded border-l-2 border-primary">{evolucao.ajustes_realizados}</p>
                    </div>
                  )}

                  {/* Orientações */}
                  {evolucao.orientacoes.length > 0 && (
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">Orientações Reforçadas</p>
                      <ul className="list-disc list-inside text-sm space-y-1">
                        {evolucao.orientacoes.map((orientacao, index) => (
                          <li key={index}>{orientacao}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Ação de assinar */}
                  {evolucao.status === 'draft' && canEdit && (
                    <div className="pt-2 border-t">
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => onSign(evolucao.id)}
                      >
                        <FileSignature className="h-4 w-4 mr-2" />
                        Assinar Evolução
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Estado vazio */}
      {evolucoes.length === 0 && (
        <Card>
          <CardContent className="py-12 text-center">
            <Activity className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground mb-2">Nenhuma evolução nutricional registrada.</p>
            <p className="text-muted-foreground text-sm mb-4">Registre a primeira evolução nutricional deste paciente.</p>
            {canEdit && (
              <Button onClick={() => setShowTemplateSelector(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Registrar Primeira Evolução
              </Button>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
