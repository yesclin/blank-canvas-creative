import {
  CLINICA_GERAL_STRUCTURE,
  FISIOTERAPIA_STRUCTURE,
  PSICOLOGIA_STRUCTURE,
  type DefaultSectionDef,
} from '@/constants/defaultAnamnesisStructures';

type AnySection = DefaultSectionDef;

const f = (id: string, type: string, label: string, options?: string[]) => ({ id, type, label, required: false, options });
const s = (id: string, title: string, fields: ReturnType<typeof f>[]): AnySection => ({ id, type: 'section', title, fields });

export function normalizeTemplateStructure(raw: unknown): AnySection[] {
  if (!Array.isArray(raw)) return [];
  return raw.map((section: any, index) => ({
    id: section.id || `section_${index}`,
    type: 'section' as const,
    title: section.title || section.titulo || 'Seção',
    fields: (Array.isArray(section.fields) ? section.fields : Array.isArray(section.campos) ? section.campos : []).map((field: any) => ({
      ...field,
      id: field.id || field.nome || `field_${index}`,
      type: field.type || field.tipo || 'text',
      label: field.label || field.nome || 'Campo',
      required: field.required ?? field.obrigatorio ?? false,
      options: field.options || field.opcoes,
    })),
  }));
}

function textCorpus(structure: AnySection[]) {
  return JSON.stringify(structure).toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
}

const requiredBySlug: Record<string, string[]> = {
  estetica: ['avaliacao facial', 'fotos', 'planejamento', 'consentimento', 'produto', 'mapa facial'],
  nutricao: ['peso', 'altura', 'imc', 'antropometrica', 'evolucao corporal'],
  odontologia: ['odontograma', 'plano de tratamento', 'imagens clinicas'],
  dermatologia: ['lesoes', 'fototipo', 'fotos clinicas', 'conduta'],
  pediatria: ['responsavel', 'neonatal', 'curvas de crescimento', 'vacinacao'],
  pilates: ['postural', 'funcional', 'core', 'plano de exercicios'],
  fisioterapia: ['dor', 'funcional', 'plano terapeutico'],
  psicologia: ['demanda', 'historico familiar', 'plano terapeutico'],
  geral: ['queixa', 'exame fisico', 'conduta'],
};

export function isTemplateStructurallyComplete(slug: string | null | undefined, structure: unknown) {
  const normalized = normalizeTemplateStructure(structure);
  if (normalized.length < 3 || normalized.reduce((sum, section) => sum + section.fields.length, 0) < 12) return false;
  const required = requiredBySlug[slug || ''] || [];
  if (!required.length) return true;
  const corpus = textCorpus(normalized);
  return required.every((token) => corpus.includes(token));
}

const NUTRICAO_STRUCTURE = [
  s('nut_anamnese', 'Anamnese Nutricional', [f('objetivo_paciente','textarea','Objetivo do paciente'), f('historico_alimentar','textarea','Histórico alimentar'), f('recordatorio_alimentar','table','Recordatório alimentar'), f('frequencia_alimentar','repeater','Frequência alimentar'), f('preferencias_aversoes','textarea','Preferências e aversões'), f('restricoes_alimentares','textarea','Restrições alimentares'), f('alergias_intolerancias','textarea','Alergias/intolerâncias')]),
  s('nut_habitos', 'Hábitos e Histórico Clínico', [f('agua_hidratacao','number','Água/hidratação (L/dia)'), f('sono','textarea','Sono'), f('atividade_fisica','textarea','Atividade física'), f('historico_clinico','textarea','Histórico clínico'), f('medicamentos_suplementos','textarea','Medicamentos/suplementos')]),
  s('nut_antropometria', 'Avaliação Antropométrica', [f('peso_kg','number','Peso'), f('altura_cm','number','Altura'), f('imc_automatico','bmi_calculator','IMC automático'), f('classificacao_imc','calculation','Classificação do IMC'), f('circunferencias','body_measurements','Circunferências'), f('dobras_cutaneas','repeater','Dobras cutâneas'), f('composicao_corporal','table','Composição corporal'), f('indicador_visual_corporal','body_visual_indicator','Indicador visual corporal')]),
  s('nut_plano', 'Diagnóstico, Plano e Evolução Corporal', [f('diagnostico_nutricional','textarea','Diagnóstico nutricional'), f('plano_alimentar','textarea','Plano alimentar'), f('metas','textarea','Metas'), f('evolucao_corporal','timeline','Evolução corporal'), f('graficos_evolucao','chart','Gráficos de evolução'), f('historico_avaliacoes','timeline','Histórico de avaliações')]),
];

export function getOfficialAnamnesisStructure(slug: string | null | undefined): AnySection[] {
  switch (slug) {
    case 'geral': return CLINICA_GERAL_STRUCTURE;
    case 'psicologia': return PSICOLOGIA_STRUCTURE;
    case 'fisioterapia': return FISIOTERAPIA_STRUCTURE;
    case 'nutricao': return NUTRICAO_STRUCTURE;
    case 'estetica': return [
      s('est_dados','Dados da avaliação',[f('data_avaliacao','date','Data da avaliação'),f('tipo_consulta','select','Tipo de consulta',['Primeira consulta','Retorno']),f('queixa_principal','textarea','Queixa principal'),f('objetivo_estetico','textarea','Objetivo estético principal'),f('regiao_incomodo','multiselect','Região de maior incômodo')]),
      s('est_historico','Histórico estético e clínico',[f('procedimentos_previos','textarea','Procedimentos estéticos prévios'),f('produtos_utilizados','textarea','Produtos já utilizados'),f('intercorrencias','textarea','Intercorrências anteriores'),f('alergias','textarea','Alergias'),f('medicamentos','textarea','Medicamentos em uso'),f('contraindicacoes','textarea','Contraindicações')]),
      s('est_avaliacao_facial','Avaliação facial',[f('tipo_pele','select','Tipo de pele'),f('flacidez','clinical_scale','Grau de flacidez'),f('rugas_dinamicas','clinical_scale','Rugas dinâmicas'),f('assimetrias','textarea','Assimetrias'),f('manchas_acne_cicatrizes','textarea','Manchas, acne e cicatrizes')]),
      s('est_mapa','Mapa facial / regiões',[f('mapa_facial','facial_map','Mapa facial'),f('terco_superior','checkbox','Terço superior'),f('terco_medio','checkbox','Terço médio'),f('terco_inferior','checkbox','Terço inferior')]),
      s('est_planejamento','Planejamento, produtos e rastreabilidade',[f('procedimento_indicado','textarea','Procedimento indicado'),f('produto_sugerido','text','Produto sugerido'),f('quantidade_prevista','number','Quantidade prevista'),f('regiao_aplicacao','text','Região de aplicação'),f('produtos_lotes','repeater','Produto, marca, lote, validade e quantidade')]),
      s('est_fotos','Fotos e imagens clínicas',[f('foto_frontal','image','Foto frontal'),f('foto_lateral_direita','image','Foto lateral direita'),f('foto_lateral_esquerda','image','Foto lateral esquerda'),f('foto_45','image','Foto 45 graus'),f('antes_depois','before_after','Foto antes/depois'),f('galeria','image_gallery','Galeria de imagens')]),
      s('est_consentimentos','Termos e consentimentos',[f('consentimento_lgpd','consent','Consentimento LGPD'),f('consentimento_procedimento','consent','Consentimento para procedimento estético'),f('consentimento_imagem','consent','Consentimento para uso de imagem'),f('assinatura_paciente','signature','Assinatura do paciente')]),
      s('est_evolucao','Evolução e acompanhamento',[f('retorno','date','Retorno'),f('resultado_observado','textarea','Resultado observado'),f('intercorrencias_retorno','textarea','Intercorrências'),f('orientacoes','textarea','Orientações ao paciente'),f('proxima_sessao','date','Próxima sessão')]),
    ];
    case 'odontologia': return [s('odo_anamnese','Anamnese odontológica',[f('queixa_principal','textarea','Queixa principal'),f('historico_odontologico','textarea','Histórico odontológico'),f('dor','clinical_scale','Dor'),f('sangramento','checkbox','Sangramento'),f('sensibilidade','checkbox','Sensibilidade'),f('bruxismo','checkbox','Bruxismo'),f('habitos','textarea','Hábitos')]),s('odo_clinica','Avaliação clínica e odontograma',[f('avaliacao_clinica','textarea','Avaliação clínica'),f('odontograma','odontogram_reference','Odontograma digital'),f('diagnostico_dente','repeater','Diagnóstico por dente/região')]),s('odo_plano','Plano e evolução',[f('plano_tratamento','textarea','Plano de tratamento'),f('procedimentos_realizados','repeater','Procedimentos realizados'),f('materiais_utilizados','repeater','Materiais utilizados'),f('imagens_clinicas','image_gallery','Imagens clínicas'),f('exames_documentos','document_upload','Exames/documentos'),f('evolucao','timeline','Evolução odontológica')])];
    case 'dermatologia': return [s('derm_anamnese','Anamnese dermatológica',[f('queixa_dermatologica','textarea','Queixa dermatológica'),f('historia_lesao','textarea','História da lesão'),f('tipo_pele','select','Tipo de pele'),f('fototipo','clinical_scale','Fototipo')]),s('derm_exame','Exame dermatológico',[f('lesoes','repeater','Lesões'),f('localizacao','text','Localização'),f('sintomas','textarea','Sintomas'),f('fotos_clinicas','clinical_photo','Fotos clínicas')]),s('derm_conduta','Diagnóstico e conduta',[f('diagnostico','textarea','Diagnóstico'),f('conduta','textarea','Conduta'),f('prescricoes','textarea','Prescrições'),f('acompanhamento_visual','timeline','Acompanhamento visual'),f('procedimentos','textarea','Procedimentos dermatológicos'),f('alertas','textarea','Alertas')])];
    case 'pediatria': return [s('ped_anamnese','Anamnese pediátrica',[f('responsavel','text','Dados do responsável'),f('historico_neonatal','textarea','Histórico neonatal'),f('apgar','text','Apgar'),f('amamentacao','textarea','Amamentação')]),s('ped_crescimento','Crescimento e desenvolvimento',[f('peso','number','Peso'),f('altura','number','Altura'),f('perimetro_cefalico','number','Perímetro cefálico'),f('curvas_crescimento','chart','Curvas de crescimento'),f('marcos_desenvolvimento','timeline','Marcos do desenvolvimento'),f('vacinacao','table','Vacinação')]),s('ped_clinica','Avaliação, diagnóstico e evolução',[f('avaliacao_clinica','textarea','Avaliação clínica'),f('diagnostico','textarea','Diagnóstico'),f('prescricao_peso','calculation','Prescrição por peso'),f('evolucao','timeline','Evolução'),f('alertas','textarea','Alertas')])];
    case 'pilates': return [s('pil_anamnese','Anamnese funcional',[f('queixa','textarea','Queixa principal'),f('dor','clinical_scale','Dor'),f('restricoes','textarea','Restrições')]),s('pil_avaliacao','Avaliação postural e funcional',[f('avaliacao_postural','textarea','Avaliação postural'),f('avaliacao_funcional','textarea','Avaliação funcional'),f('mobilidade','textarea','Mobilidade'),f('respiracao','textarea','Respiração'),f('core','clinical_scale','Core')]),s('pil_plano','Plano e evolução',[f('plano_exercicios','textarea','Plano de exercícios'),f('sessoes','timeline','Sessões'),f('evolucao','timeline','Evolução')])];
    default: return [];
  }
}