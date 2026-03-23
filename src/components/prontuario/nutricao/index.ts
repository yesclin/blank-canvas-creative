/**
 * NUTRIÇÃO - Componentes do Prontuário
 * 
 * Exporta todos os componentes de blocos clínicos para a especialidade Nutrição.
 */

export { VisaoGeralNutricaoBlock } from './VisaoGeralNutricaoBlock';
export { AvaliacaoNutricionalBlock } from './AvaliacaoNutricionalBlock';
export { AvaliacaoNutricionalInicialBlock } from './AvaliacaoNutricionalInicialBlock';
export { AvaliacaoEvolutionChart } from './AvaliacaoEvolutionChart';
export { EvolucaoCorporalBlock } from './EvolucaoCorporalBlock';
export { PlanoAlimentarBlock } from './PlanoAlimentarBlock';
export { MetasNutricionaisBlock } from './MetasNutricionaisBlock';
export { EvolucoesNutricaoBlock } from './EvolucoesNutricaoBlock';
export { EvolucaoRetornoBlock } from './EvolucaoRetornoBlock';
export { AnamneseNutricionalBlock } from './AnamneseNutricionalBlock';
export { AvaliacaoClinicaBlock } from './AvaliacaoClinicaBlock';
export { DiagnosticoNutricionalBlock } from './DiagnosticoNutricionalBlock';
export { AlertasNutricaoBlock, AlertasBannerNutricao } from './AlertasNutricaoBlock';
export { LinhaTempoNutricaoBlock } from './LinhaTempoNutricaoBlock';

// Novos componentes de templates de evolução
export { EvolucaoTemplateSelectorDialog } from './EvolucaoTemplateSelectorDialog';
export { EvolucaoTemplateFormDialog } from './EvolucaoTemplateFormDialog';

// Reutiliza o bloco de Documentos da Clínica Geral (mesma estrutura)
export { DocumentosBlock as DocumentosNutricaoBlock } from '@/components/prontuario/clinica-geral/DocumentosBlock';
export type { Documento, CategoriaDocumento } from '@/components/prontuario/clinica-geral/DocumentosBlock';
