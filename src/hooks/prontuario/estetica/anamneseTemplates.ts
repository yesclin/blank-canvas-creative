/**
 * Modelos pré-cadastrados de anamnese para Estética / Harmonização Facial
 * 
 * Requisitos:
 * - Apenas para especialidade Estética
 * - Selecionáveis no momento do atendimento
 * - Não sobrescrevem registros já preenchidos
 * - Editáveis pelo administrador
 * - Status Ativo/Inativo controla exibição
 */

export type TipoAnamneseEstetica = 
  | 'anamnese_geral_estetica'
  | 'anamnese_toxina'
  | 'anamnese_preenchimento'
  | 'anamnese_bioestimulador';

export interface CampoAnamnese {
  id: string;
  label: string;
  type: 'text' | 'textarea' | 'select' | 'multiselect' | 'checkbox' | 'radio' | 'date' | 'number' | 'imagem_interativa';
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

export const ANAMNESE_ESTETICA_TEMPLATES: TemplateAnamneseEstetica[] = [
  {
    id: 'anamnese_geral_estetica',
    nome: 'Anamnese Geral Estética',
    descricao: 'Histórico completo: alergias, medicamentos, procedimentos anteriores, expectativas',
    icon: 'ClipboardList',
    campos: [
      // Identificação e Histórico
      { id: 'queixa_principal', label: 'Queixa Principal / Motivo da Consulta', type: 'textarea', required: true, section: 'Identificação' },
      { id: 'expectativas', label: 'Expectativas do Paciente', type: 'textarea', section: 'Identificação' },
      { id: 'procedimentos_anteriores', label: 'Procedimentos Estéticos Anteriores', type: 'textarea', placeholder: 'Descreva procedimentos realizados, datas e resultados', section: 'Histórico Estético' },
      { id: 'reacoes_adversas', label: 'Reações Adversas a Procedimentos', type: 'textarea', section: 'Histórico Estético' },
      
      // Histórico Médico
      { id: 'doencas_cronicas', label: 'Doenças Crônicas', type: 'multiselect', options: ['Diabetes', 'Hipertensão', 'Tireoide', 'Autoimune', 'Cardiopatia', 'Nenhuma', 'Outra'], section: 'Histórico Médico' },
      { id: 'doencas_cronicas_obs', label: 'Observações sobre Doenças', type: 'text', section: 'Histórico Médico' },
      { id: 'cirurgias_anteriores', label: 'Cirurgias Anteriores', type: 'textarea', section: 'Histórico Médico' },
      { id: 'medicamentos_uso', label: 'Medicamentos em Uso', type: 'textarea', placeholder: 'Liste todos os medicamentos, incluindo vitaminas e suplementos', section: 'Histórico Médico' },
      { id: 'anticoagulantes', label: 'Uso de Anticoagulantes', type: 'radio', options: ['Sim', 'Não'], section: 'Histórico Médico' },
      
      // Alergias
      { id: 'alergias_medicamentos', label: 'Alergias a Medicamentos', type: 'textarea', section: 'Alergias' },
      { id: 'alergias_produtos', label: 'Alergias a Produtos/Cosméticos', type: 'textarea', section: 'Alergias' },
      { id: 'alergia_anestesico', label: 'Alergia a Anestésicos', type: 'radio', options: ['Sim', 'Não', 'Não sei'], section: 'Alergias' },
      
      // Hábitos
      { id: 'tabagismo', label: 'Tabagismo', type: 'radio', options: ['Não', 'Sim', 'Ex-fumante'], section: 'Hábitos de Vida' },
      { id: 'etilismo', label: 'Consumo de Álcool', type: 'radio', options: ['Não', 'Social', 'Frequente'], section: 'Hábitos de Vida' },
      { id: 'exposicao_solar', label: 'Exposição Solar', type: 'radio', options: ['Baixa', 'Moderada', 'Alta'], section: 'Hábitos de Vida' },
      { id: 'uso_protetor', label: 'Uso de Protetor Solar', type: 'radio', options: ['Diário', 'Eventual', 'Não usa'], section: 'Hábitos de Vida' },
      { id: 'rotina_skincare', label: 'Rotina de Skincare', type: 'textarea', section: 'Hábitos de Vida' },
      
      // Contraindicações
      { id: 'gestante', label: 'Gestante ou Lactante', type: 'radio', options: ['Sim', 'Não'], section: 'Contraindicações' },
      { id: 'herpes_ativa', label: 'Histórico de Herpes', type: 'radio', options: ['Sim', 'Não'], section: 'Contraindicações' },
      { id: 'queloides', label: 'Tendência a Queloides', type: 'radio', options: ['Sim', 'Não', 'Não sei'], section: 'Contraindicações' },
      { id: 'infeccao_ativa', label: 'Infecção Ativa na Área', type: 'radio', options: ['Sim', 'Não'], section: 'Contraindicações' },
      
      // Observações
      { id: 'observacoes_gerais', label: 'Observações Gerais', type: 'textarea', section: 'Observações' },
    ],
  },
  {
    id: 'anamnese_toxina',
    nome: 'Anamnese Toxina Botulínica',
    descricao: 'Específica para botox: uso anterior, reações, áreas de interesse, contraindicações',
    icon: 'Syringe',
    campos: [
      // Histórico com Toxina
      { id: 'uso_anterior_toxina', label: 'Já realizou aplicação de toxina botulínica?', type: 'radio', options: ['Sim', 'Não'], required: true, section: 'Histórico com Toxina' },
      { id: 'data_ultima_aplicacao', label: 'Data da Última Aplicação', type: 'date', section: 'Histórico com Toxina' },
      { id: 'produto_anterior', label: 'Produto Utilizado Anteriormente', type: 'select', options: ['Botox', 'Dysport', 'Xeomin', 'Jeuveau', 'Daxxify', 'Não sei', 'Outro'], section: 'Histórico com Toxina' },
      { id: 'doses_anteriores', label: 'Doses Utilizadas (se souber)', type: 'text', section: 'Histórico com Toxina' },
      { id: 'satisfacao_anterior', label: 'Satisfação com Resultados Anteriores', type: 'radio', options: ['Muito satisfeito', 'Satisfeito', 'Parcialmente satisfeito', 'Insatisfeito'], section: 'Histórico com Toxina' },
      { id: 'duracao_efeito', label: 'Duração do Efeito (meses)', type: 'select', options: ['2-3 meses', '3-4 meses', '4-5 meses', '5-6 meses', 'Mais de 6 meses', 'Não lembro'], section: 'Histórico com Toxina' },
      
      // Reações
      { id: 'reacoes_toxina', label: 'Reações Adversas Anteriores', type: 'multiselect', options: ['Nenhuma', 'Hematoma', 'Ptose palpebral', 'Cefaleia', 'Assimetria', 'Resistência ao produto', 'Outra'], section: 'Reações' },
      { id: 'reacoes_descricao', label: 'Descrição das Reações', type: 'textarea', section: 'Reações' },
      
      // Áreas de Interesse
      { id: 'areas_interesse', label: 'Áreas de Interesse', type: 'multiselect', options: ['Testa (linhas horizontais)', 'Glabela (linhas verticais)', 'Pés de galinha', 'Bunny lines', 'Nasogeniano', 'Lifting de sobrancelha', 'Masseter (bruxismo/face)', 'Pescoço (platisma)', 'Sorriso gengival', 'Outra'], required: true, section: 'Áreas de Interesse' },
      { id: 'areas_obs', label: 'Observações sobre as Áreas', type: 'textarea', section: 'Áreas de Interesse' },
      
      // Contraindicações Específicas
      { id: 'doenca_neuromuscular', label: 'Doença Neuromuscular (miastenia, ELA)', type: 'radio', options: ['Sim', 'Não'], section: 'Contraindicações' },
      { id: 'uso_aminoglicosideos', label: 'Uso de Aminoglicosídeos', type: 'radio', options: ['Sim', 'Não', 'Não sei'], section: 'Contraindicações' },
      { id: 'gestante_lactante', label: 'Gestante ou Lactante', type: 'radio', options: ['Sim', 'Não'], section: 'Contraindicações' },
      { id: 'infeccao_local', label: 'Infecção no Local de Aplicação', type: 'radio', options: ['Sim', 'Não'], section: 'Contraindicações' },
      
      // Expectativas
      { id: 'expectativa_resultado', label: 'Expectativa de Resultado', type: 'radio', options: ['Natural (preservar movimento)', 'Moderado', 'Intenso (mínimo movimento)'], section: 'Expectativas' },
      { id: 'observacoes', label: 'Observações Adicionais', type: 'textarea', section: 'Observações' },
    ],
  },
  {
    id: 'anamnese_preenchimento',
    nome: 'Anamnese Preenchimento',
    descricao: 'Específica para ácido hialurônico: histórico de preenchimentos, alergias, expectativas',
    icon: 'Droplets',
    campos: [
      // Histórico com Preenchimento
      { id: 'uso_anterior_ah', label: 'Já realizou preenchimento com ácido hialurônico?', type: 'radio', options: ['Sim', 'Não'], required: true, section: 'Histórico com Preenchimento' },
      { id: 'data_ultimo_preenchimento', label: 'Data do Último Preenchimento', type: 'date', section: 'Histórico com Preenchimento' },
      { id: 'areas_preenchidas', label: 'Áreas Já Preenchidas', type: 'multiselect', options: ['Lábios', 'Sulco nasogeniano', 'Malar/Maçã do rosto', 'Mandíbula', 'Queixo', 'Olheiras', 'Têmporas', 'Nariz (rinomodelação)', 'Outra'], section: 'Histórico com Preenchimento' },
      { id: 'produto_anterior', label: 'Produto Utilizado', type: 'select', options: ['Juvederm', 'Restylane', 'Belotero', 'Rennova', 'Não sei', 'Outro'], section: 'Histórico com Preenchimento' },
      { id: 'volume_anterior', label: 'Volume Utilizado (se souber)', type: 'text', placeholder: 'Ex: 1ml em lábios', section: 'Histórico com Preenchimento' },
      { id: 'satisfacao', label: 'Satisfação com Resultados', type: 'radio', options: ['Muito satisfeito', 'Satisfeito', 'Parcialmente satisfeito', 'Insatisfeito'], section: 'Histórico com Preenchimento' },
      
      // Reações e Complicações
      { id: 'complicacoes_ah', label: 'Complicações Anteriores', type: 'multiselect', options: ['Nenhuma', 'Hematoma', 'Edema prolongado', 'Nódulos', 'Efeito Tyndall', 'Necrose', 'Granuloma', 'Outra'], section: 'Complicações' },
      { id: 'complicacoes_descricao', label: 'Descrição das Complicações', type: 'textarea', section: 'Complicações' },
      { id: 'uso_hialuronidase', label: 'Já precisou dissolver com hialuronidase?', type: 'radio', options: ['Sim', 'Não'], section: 'Complicações' },
      
      // Áreas de Interesse
      { id: 'areas_desejadas', label: 'Áreas de Interesse para Tratamento', type: 'multiselect', options: ['Lábios - volume', 'Lábios - contorno', 'Sulco nasogeniano', 'Linhas de marionete', 'Malar/Maçã do rosto', 'Mandíbula', 'Queixo', 'Olheiras', 'Têmporas', 'Nariz (rinomodelação)', 'Outra'], required: true, section: 'Áreas Desejadas' },
      { id: 'expectativa_volume', label: 'Expectativa de Volume', type: 'radio', options: ['Discreto/Natural', 'Moderado', 'Volumoso'], section: 'Áreas Desejadas' },
      
      // Contraindicações
      { id: 'alergia_ah', label: 'Alergia a Ácido Hialurônico', type: 'radio', options: ['Sim', 'Não', 'Não sei'], section: 'Contraindicações' },
      { id: 'doenca_autoimune', label: 'Doença Autoimune', type: 'radio', options: ['Sim', 'Não'], section: 'Contraindicações' },
      { id: 'herpes_labial', label: 'Histórico de Herpes Labial', type: 'radio', options: ['Sim, frequente', 'Sim, raro', 'Não'], section: 'Contraindicações' },
      { id: 'gestante_lactante', label: 'Gestante ou Lactante', type: 'radio', options: ['Sim', 'Não'], section: 'Contraindicações' },
      { id: 'anticoagulantes', label: 'Uso de Anticoagulantes', type: 'radio', options: ['Sim', 'Não'], section: 'Contraindicações' },
      { id: 'procedimento_dental_recente', label: 'Procedimento Dental Recente', type: 'radio', options: ['Sim', 'Não'], section: 'Contraindicações' },
      
      // Observações
      { id: 'referencias_visuais', label: 'Referências Visuais / Inspirações', type: 'textarea', section: 'Observações' },
      { id: 'observacoes', label: 'Observações Adicionais', type: 'textarea', section: 'Observações' },
    ],
  },
  {
    id: 'anamnese_bioestimulador',
    nome: 'Anamnese Bioestimuladores',
    descricao: 'Para procedimentos com PLLA, PCL: histórico, contraindicações, expectativas',
    icon: 'Sparkles',
    campos: [
      // Histórico com Bioestimuladores
      { id: 'uso_anterior_bio', label: 'Já realizou tratamento com bioestimulador?', type: 'radio', options: ['Sim', 'Não'], required: true, section: 'Histórico' },
      { id: 'tipo_bioestimulador', label: 'Tipo de Bioestimulador Utilizado', type: 'multiselect', options: ['Sculptra (PLLA)', 'Radiesse', 'Ellansé', 'Rennova', 'Não sei', 'Outro'], section: 'Histórico' },
      { id: 'data_ultimo_tratamento', label: 'Data do Último Tratamento', type: 'date', section: 'Histórico' },
      { id: 'areas_tratadas', label: 'Áreas Tratadas Anteriormente', type: 'textarea', section: 'Histórico' },
      { id: 'numero_sessoes', label: 'Número de Sessões Realizadas', type: 'number', section: 'Histórico' },
      { id: 'satisfacao', label: 'Satisfação com Resultados', type: 'radio', options: ['Muito satisfeito', 'Satisfeito', 'Parcialmente satisfeito', 'Insatisfeito'], section: 'Histórico' },
      
      // Complicações
      { id: 'complicacoes_bio', label: 'Complicações Anteriores', type: 'multiselect', options: ['Nenhuma', 'Nódulos', 'Granuloma', 'Assimetria', 'Edema prolongado', 'Outra'], section: 'Complicações' },
      { id: 'complicacoes_descricao', label: 'Descrição das Complicações', type: 'textarea', section: 'Complicações' },
      
      // Áreas de Interesse
      { id: 'areas_interesse', label: 'Áreas de Interesse', type: 'multiselect', options: ['Face (flacidez geral)', 'Malar', 'Mandíbula', 'Pescoço', 'Colo', 'Mãos', 'Glúteos', 'Braços', 'Coxas', 'Abdômen', 'Outra'], required: true, section: 'Áreas de Interesse' },
      { id: 'objetivo_principal', label: 'Objetivo Principal', type: 'multiselect', options: ['Melhora da flacidez', 'Estímulo de colágeno', 'Volumização', 'Melhora da textura', 'Rejuvenescimento global'], section: 'Áreas de Interesse' },
      
      // Avaliação da Pele
      { id: 'grau_flacidez', label: 'Grau de Flacidez Percebido', type: 'radio', options: ['Leve', 'Moderado', 'Acentuado'], section: 'Avaliação' },
      { id: 'qualidade_pele', label: 'Qualidade da Pele', type: 'radio', options: ['Boa', 'Regular', 'Comprometida'], section: 'Avaliação' },
      { id: 'fotoenvelhecimento', label: 'Grau de Fotoenvelhecimento', type: 'radio', options: ['Leve', 'Moderado', 'Severo'], section: 'Avaliação' },
      
      // Contraindicações
      { id: 'doenca_autoimune', label: 'Doença Autoimune', type: 'radio', options: ['Sim', 'Não'], section: 'Contraindicações' },
      { id: 'historico_granuloma', label: 'Histórico de Granuloma', type: 'radio', options: ['Sim', 'Não'], section: 'Contraindicações' },
      { id: 'tendencia_queloides', label: 'Tendência a Queloides', type: 'radio', options: ['Sim', 'Não', 'Não sei'], section: 'Contraindicações' },
      { id: 'gestante_lactante', label: 'Gestante ou Lactante', type: 'radio', options: ['Sim', 'Não'], section: 'Contraindicações' },
      { id: 'infeccao_ativa', label: 'Infecção Ativa', type: 'radio', options: ['Sim', 'Não'], section: 'Contraindicações' },
      { id: 'uso_corticoides', label: 'Uso de Corticoides', type: 'radio', options: ['Sim', 'Não'], section: 'Contraindicações' },
      
      // Expectativas e Protocolo
      { id: 'disponibilidade_sessoes', label: 'Disponibilidade para Múltiplas Sessões', type: 'radio', options: ['Sim', 'Não', 'Depende'], section: 'Protocolo' },
      { id: 'expectativa_tempo', label: 'Expectativa de Tempo para Resultados', type: 'radio', options: ['Entendo que demora (3-6 meses)', 'Quero resultados rápidos'], section: 'Protocolo' },
      
      // Observações
      { id: 'observacoes', label: 'Observações Adicionais', type: 'textarea', section: 'Observações' },
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
