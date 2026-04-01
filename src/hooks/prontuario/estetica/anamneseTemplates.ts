/**
 * Tipos e helpers para modelos de anamnese de Estética / Harmonização Facial
 * 
 * Os modelos reais vivem no banco (anamnesis_templates + anamnesis_template_versions).
 * Este arquivo define os tipos compartilhados e helpers de apoio.
 */

export type TipoAnamneseEstetica = 
  | 'anamnese_geral_estetica'
  | 'anamnese_toxina'
  | 'anamnese_preenchimento'
  | 'anamnese_bioestimulador'
  | 'anamnese_corporal'
  | 'anamnese_skinbooster'
  | 'anamnese_combinados';

export interface CampoAnamnese {
  id: string;
  label: string;
  type: 'text' | 'textarea' | 'select' | 'multiselect' | 'checkbox' | 'radio' | 'date' | 'number' | 'imagem_interativa' | 'link_mapa_facial';
  placeholder?: string;
  options?: string[];
  required?: boolean;
  section?: string;
  /** URL da imagem base para campos do tipo imagem_interativa */
  baseImageUrl?: string;
}

export interface TemplateAnamneseEstetica {
  id: TipoAnamneseEstetica;
  nome: string;
  descricao: string;
  icon: string;
  campos: CampoAnamnese[];
}

/**
 * Legacy local templates kept for backward compat.
 * The authoritative source is now the DB (provisioned via provision_estetica_anamnesis_templates).
 */
export const ANAMNESE_ESTETICA_TEMPLATES: TemplateAnamneseEstetica[] = [
  {
    id: 'anamnese_geral_estetica',
    nome: 'Anamnese Estética Facial Geral',
    descricao: 'Avaliação facial geral: pele, alergias, histórico estético, contraindicações',
    icon: 'ClipboardList',
    campos: [
      { id: 'queixa_principal', label: 'Queixa Principal / Motivo da Consulta', type: 'textarea', required: true, section: 'Identificação' },
      { id: 'expectativas', label: 'Expectativas do Paciente', type: 'textarea', section: 'Identificação' },
      { id: 'procedimentos_anteriores', label: 'Procedimentos Estéticos Anteriores', type: 'textarea', section: 'Histórico Estético' },
      { id: 'reacoes_adversas', label: 'Reações Adversas a Procedimentos', type: 'textarea', section: 'Histórico Estético' },
      { id: 'doencas_cronicas', label: 'Doenças Crônicas', type: 'multiselect', options: ['Diabetes', 'Hipertensão', 'Tireoide', 'Autoimune', 'Cardiopatia', 'Nenhuma', 'Outra'], section: 'Histórico Médico' },
      { id: 'medicamentos_uso', label: 'Medicamentos em Uso', type: 'textarea', section: 'Histórico Médico' },
      { id: 'alergias_medicamentos', label: 'Alergias a Medicamentos', type: 'textarea', section: 'Alergias' },
      { id: 'alergias_produtos', label: 'Alergias a Produtos/Cosméticos', type: 'textarea', section: 'Alergias' },
      { id: 'gestante', label: 'Gestante ou Lactante', type: 'radio', options: ['Sim', 'Não'], section: 'Contraindicações' },
      { id: 'herpes_ativa', label: 'Histórico de Herpes', type: 'radio', options: ['Sim', 'Não'], section: 'Contraindicações' },
      { id: 'queloides', label: 'Tendência a Queloides', type: 'radio', options: ['Sim', 'Não', 'Não sei'], section: 'Contraindicações' },
      { id: 'observacoes_gerais', label: 'Observações Gerais', type: 'textarea', section: 'Observações' },
    ],
  },
  {
    id: 'anamnese_toxina',
    nome: 'Plano de Aplicação de Toxina Botulínica',
    descricao: 'Planejamento facial com mapa de aplicação por regiões musculares',
    icon: 'Syringe',
    campos: [
      { id: 'uso_anterior_toxina', label: 'Já realizou aplicação de toxina botulínica?', type: 'radio', options: ['Sim', 'Não'], required: true, section: 'Histórico com Toxina' },
      { id: 'data_ultima_aplicacao', label: 'Data da Última Aplicação', type: 'date', section: 'Histórico com Toxina' },
      { id: 'areas_interesse', label: 'Áreas de Interesse', type: 'multiselect', options: ['Testa', 'Glabela', 'Pés de galinha', 'Bunny lines', 'Masseter', 'Platisma', 'Sorriso gengival', 'Outra'], required: true, section: 'Áreas de Interesse' },
      { id: 'plano_terapeutico_toxina', label: 'Plano Terapêutico', type: 'textarea', section: 'Planejamento' },
      { id: 'link_mapa_toxina', label: 'Mapa de Aplicação de Toxina', type: 'link_mapa_facial', section: 'Mapa de Aplicação' },
      { id: 'gestante_lactante', label: 'Gestante ou Lactante', type: 'radio', options: ['Sim', 'Não'], section: 'Contraindicações' },
      { id: 'observacoes', label: 'Observações Adicionais', type: 'textarea', section: 'Observações' },
    ],
  },
  {
    id: 'anamnese_preenchimento',
    nome: 'Plano de Preenchimento com Ácido Hialurônico',
    descricao: 'Planejamento facial por área volumizada com mapa de aplicação',
    icon: 'Droplets',
    campos: [
      { id: 'uso_anterior_ah', label: 'Já realizou preenchimento?', type: 'radio', options: ['Sim', 'Não'], required: true, section: 'Histórico com Preenchimento' },
      { id: 'areas_desejadas', label: 'Áreas de Interesse para Tratamento', type: 'multiselect', options: ['Lábios', 'Sulco nasogeniano', 'Malar', 'Mandíbula', 'Queixo', 'Olheiras', 'Têmporas', 'Nariz', 'Outra'], required: true, section: 'Áreas Desejadas' },
      { id: 'plano_terapeutico_ah', label: 'Plano Terapêutico de Preenchimento', type: 'textarea', placeholder: 'Descreva o plano de volumização por área, técnica e volume estimado...', section: 'Planejamento' },
      { id: 'link_mapa_ah', label: 'Mapa Facial de Preenchimento', type: 'link_mapa_facial', section: 'Mapa de Aplicação' },
      { id: 'gestante_lactante', label: 'Gestante ou Lactante', type: 'radio', options: ['Sim', 'Não'], section: 'Contraindicações' },
      { id: 'observacoes', label: 'Observações Adicionais', type: 'textarea', section: 'Observações' },
    ],
  },
  {
    id: 'anamnese_bioestimulador',
    nome: 'Anamnese para Bioestimulador de Colágeno',
    descricao: 'Planejamento facial ou corporal com suporte a mapa interativo',
    icon: 'Sparkles',
    campos: [
      { id: 'uso_anterior_bio', label: 'Já realizou tratamento com bioestimulador?', type: 'radio', options: ['Sim', 'Não'], required: true, section: 'Histórico' },
      { id: 'areas_interesse', label: 'Áreas de Interesse', type: 'multiselect', options: ['Face', 'Malar', 'Mandíbula', 'Pescoço', 'Colo', 'Mãos', 'Glúteos', 'Braços', 'Coxas', 'Abdômen', 'Outra'], required: true, section: 'Áreas de Interesse' },
      { id: 'plano_terapeutico_bio', label: 'Plano Terapêutico', type: 'textarea', section: 'Planejamento' },
      { id: 'link_mapa_bio', label: 'Mapa de Aplicação', type: 'link_mapa_facial', section: 'Mapa de Aplicação' },
      { id: 'gestante_lactante', label: 'Gestante ou Lactante', type: 'radio', options: ['Sim', 'Não'], section: 'Contraindicações' },
      { id: 'observacoes', label: 'Observações Adicionais', type: 'textarea', section: 'Observações' },
    ],
  },
  {
    id: 'anamnese_corporal',
    nome: 'Avaliação Corporal Estética',
    descricao: 'Avaliação corporal com mapa interativo e medidas antropométricas',
    icon: 'User',
    campos: [
      { id: 'objetivo_corporal', label: 'Objetivo corporal principal', type: 'textarea', required: true, section: 'Consulta' },
      { id: 'link_mapa_corporal', label: 'Mapa Corporal', type: 'link_mapa_facial', section: 'Mapa Corporal' },
      { id: 'peso', label: 'Peso (kg)', type: 'number', section: 'Medições' },
      { id: 'altura', label: 'Altura (cm)', type: 'number', section: 'Medições' },
      { id: 'observacoes', label: 'Observações', type: 'textarea', section: 'Observações' },
    ],
  },
  {
    id: 'anamnese_skinbooster',
    nome: 'Anamnese para Microagulhamento / Skinbooster / Revitalização',
    descricao: 'Foco em qualidade de pele e evolução visual com fotos clínicas',
    icon: 'Scan',
    campos: [
      { id: 'objetivo_principal', label: 'Objetivo principal', type: 'textarea', required: true, section: 'Consulta' },
      { id: 'manchas', label: 'Manchas', type: 'select', options: ['Ausentes', 'Leves', 'Moderadas', 'Intensas'], section: 'Avaliação da Pele' },
      { id: 'acne', label: 'Acne', type: 'select', options: ['Ausente', 'Leve', 'Moderada', 'Severa'], section: 'Avaliação da Pele' },
      { id: 'melasma', label: 'Melasma', type: 'select', options: ['Ausente', 'Leve', 'Moderado', 'Severo'], section: 'Avaliação da Pele' },
      { id: 'observacoes', label: 'Observações', type: 'textarea', section: 'Observações' },
    ],
  },
  {
    id: 'anamnese_combinados',
    nome: 'Anamnese para Procedimentos Estéticos Combinados',
    descricao: 'Combinação de mapa facial + corporal + foto clínica + rastreabilidade',
    icon: 'Layers',
    campos: [
      { id: 'objetivo_geral', label: 'Objetivo geral', type: 'textarea', required: true, section: 'Consulta' },
      { id: 'procedimentos_planejados', label: 'Procedimentos planejados', type: 'textarea', required: true, section: 'Consulta' },
      { id: 'link_mapa_comb', label: 'Mapa Facial / Corporal', type: 'link_mapa_facial', section: 'Mapas' },
      { id: 'observacoes', label: 'Observações finais', type: 'textarea', section: 'Observações' },
    ],
  },
];

// Helper para obter template por ID
export function getAnamneseTemplate(id: TipoAnamneseEstetica): TemplateAnamneseEstetica | undefined {
  return ANAMNESE_ESTETICA_TEMPLATES.find(t => t.id === id);
}

// Helper para obter campos agrupados por seção
export function getCamposPorSecao(template: TemplateAnamneseEstetica): Record<string, CampoAnamnese[]> {
  return template.campos.reduce((acc, campo) => {
    const section = campo.section || 'Outros';
    if (!acc[section]) {
      acc[section] = [];
    }
    acc[section].push(campo);
    return acc;
  }, {} as Record<string, CampoAnamnese[]>);
}
