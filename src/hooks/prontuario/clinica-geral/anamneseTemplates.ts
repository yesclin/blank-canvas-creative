/**
 * Modelo Oficial de Anamnese — Clínica Geral (Padrão Médico)
 * 
 * Baseado no modelo técnico de 13 pontos utilizado na prática médica.
 * Seções 1-10 são cobertas aqui (Identificação a ROS).
 * Seções 11-13 (Exame Físico, Hipótese Diagnóstica, Plano) 
 * já existem como blocos separados no prontuário.
 * 
 * Regras:
 * - is_system = true → não pode ser excluído
 * - Pode ser clonado para edição pela clínica
 * - IMC calculado automaticamente a partir de peso e altura
 * - Não altera prontuários já salvos
 * - Exclusivo para Clínica Geral
 */

import type { CampoAnamnese } from '@/hooks/prontuario/estetica/anamneseTemplates';

export type TipoAnamneseClinicaGeral = 'anamnese_clinica_geral_padrao';

export interface TemplateAnamneseClinicaGeral {
  id: TipoAnamneseClinicaGeral;
  nome: string;
  descricao: string;
  icon: string;
  is_system: boolean;
  specialty: 'clinica_geral';
  secoes: SecaoAnamnese[];
}

export interface SecaoAnamnese {
  id: string;
  titulo: string;
  descricao?: string;
  icon: string;
  /** Maps to a direct column in patient_anamneses (legacy compat) */
  legacyColumn?: string;
  campos: CampoAnamnese[];
}

// ─── TEMPLATE OFICIAL ────────────────────────────────────────────────

export const ANAMNESE_CLINICA_GERAL_TEMPLATE: TemplateAnamneseClinicaGeral = {
  id: 'anamnese_clinica_geral_padrao',
  nome: 'Anamnese Clínica Geral – Padrão Médico',
  descricao: 'Modelo completo de anamnese seguindo o padrão técnico de 13 pontos da prática médica',
  icon: 'Stethoscope',
  is_system: true,
  specialty: 'clinica_geral',
  secoes: [
    // ── 1. QUEIXA PRINCIPAL (QP) ──────────────────────────────────
    {
      id: 'queixa_principal',
      titulo: '1. Queixa Principal (QP)',
      descricao: 'Motivo da consulta, descrito com as palavras do paciente',
      icon: 'MessageSquare',
      legacyColumn: 'queixa_principal',
      campos: [
        { id: 'qp_descricao', label: 'Motivo da consulta (nas palavras do paciente)', type: 'textarea', placeholder: 'Ex: "Dor no peito há 2 dias"', required: true, section: 'QP' },
      ],
    },

    // ── 2. HISTÓRIA DA DOENÇA ATUAL (HDA) ─────────────────────────
    {
      id: 'historia_doenca_atual',
      titulo: '2. História da Doença Atual (HDA)',
      descricao: 'Descrição cronológica e detalhada usando método OPQRST',
      icon: 'Clock',
      legacyColumn: 'historia_doenca_atual',
      campos: [
        { id: 'hda_onset', label: 'Início dos sintomas (O)', type: 'date', section: 'OPQRST' },
        { id: 'hda_provocation', label: 'Fatores de piora/melhora (P)', type: 'textarea', placeholder: 'O que piora? O que melhora?', section: 'OPQRST' },
        { id: 'hda_quality', label: 'Qualidade do sintoma (Q)', type: 'textarea', placeholder: 'Tipo da dor/sintoma: pontada, queimação, pressão, cólica...', section: 'OPQRST' },
        { id: 'hda_radiation', label: 'Irradiação (R)', type: 'textarea', placeholder: 'Irradia para algum lugar?', section: 'OPQRST' },
        { id: 'hda_severity', label: 'Intensidade (0–10) (S)', type: 'number', placeholder: '0 a 10', section: 'OPQRST' },
        { id: 'hda_time', label: 'Tempo/duração (T)', type: 'textarea', placeholder: 'Quanto tempo dura? Frequência? Contínuo ou intermitente?', section: 'OPQRST' },
        { id: 'hda_evolucao', label: 'Evolução', type: 'textarea', placeholder: 'Como evoluiu desde o início?', section: 'Complementar' },
        { id: 'hda_sintomas_associados', label: 'Sintomas associados', type: 'textarea', placeholder: 'Outros sintomas relacionados', section: 'Complementar' },
        { id: 'hda_tratamentos_previos', label: 'Tratamentos já realizados', type: 'textarea', placeholder: 'Medicações ou medidas já tentadas', section: 'Complementar' },
        { id: 'hda_impacto_funcional', label: 'Impacto funcional', type: 'textarea', placeholder: 'Como afeta as atividades diárias?', section: 'Complementar' },
      ],
    },

    // ── 3. HISTÓRIA PATOLÓGICA PREGRESSA (HPP) ────────────────────
    {
      id: 'antecedentes_pessoais',
      titulo: '3. História Patológica Pregressa (HPP)',
      descricao: 'Doenças prévias, internações, cirurgias, transfusões e traumas',
      icon: 'BookOpen',
      legacyColumn: 'antecedentes_pessoais',
      campos: [
        { id: 'hpp_doencas_previas', label: 'Doenças prévias', type: 'textarea', placeholder: 'HAS, DM, dislipidemia, etc.', section: 'HPP' },
        { id: 'hpp_internacoes', label: 'Internações', type: 'textarea', placeholder: 'Motivo, data e duração das internações', section: 'HPP' },
        { id: 'hpp_cirurgias', label: 'Cirurgias', type: 'textarea', placeholder: 'Procedimentos cirúrgicos realizados, datas', section: 'HPP' },
        { id: 'hpp_transfusoes', label: 'Transfusões', type: 'textarea', placeholder: 'Quando e motivo', section: 'HPP' },
        { id: 'hpp_traumas', label: 'Traumas relevantes', type: 'textarea', placeholder: 'Fraturas, TCE, acidentes...', section: 'HPP' },
      ],
    },

    // ── 4. HISTÓRIA FAMILIAR (HF) ────────────────────────────────
    {
      id: 'antecedentes_familiares',
      titulo: '4. História Familiar (HF)',
      descricao: 'Doenças hereditárias e histórico familiar',
      icon: 'Users',
      legacyColumn: 'antecedentes_familiares',
      campos: [
        { id: 'hf_doencas_hereditarias', label: 'Doenças hereditárias', type: 'textarea', placeholder: 'Doenças hereditárias na família', section: 'HF' },
        { id: 'hf_has_dm_cancer', label: 'HAS / DM / Câncer / Cardiovasculares', type: 'textarea', placeholder: 'Detalhamento por familiar', section: 'HF' },
        { id: 'hf_obitos', label: 'Idade e causa de óbito (se relevante)', type: 'textarea', placeholder: 'Familiares falecidos, idade e causa', section: 'HF' },
      ],
    },

    // ── 5. MEDICAMENTOS EM USO ────────────────────────────────────
    {
      id: 'medicamentos',
      titulo: '5. Medicamentos em Uso',
      descricao: 'Medicamentos contínuos e automedicação',
      icon: 'Pill',
      legacyColumn: 'medicamentos_uso_continuo',
      campos: [
        { id: 'med_lista', label: 'Nome / Dose / Frequência / Tempo de uso', type: 'textarea', placeholder: 'Ex: Losartana 50mg, 1x/dia, há 3 anos', required: true, section: 'Medicamentos' },
        { id: 'med_automedicacao', label: 'Automedicação', type: 'textarea', placeholder: 'Medicamentos usados por conta própria, chás, suplementos...', section: 'Medicamentos' },
      ],
    },

    // ── 6. ALERGIAS ───────────────────────────────────────────────
    {
      id: 'alergias',
      titulo: '6. Alergias',
      descricao: 'Alergias medicamentosas, alimentares e ambientais',
      icon: 'AlertTriangle',
      legacyColumn: 'alergias',
      campos: [
        { id: 'alergias_medicamentosas', label: 'Medicamentosas', type: 'textarea', placeholder: 'Medicamento e tipo de reação apresentada', section: 'Alergias' },
        { id: 'alergias_alimentares', label: 'Alimentares', type: 'textarea', placeholder: 'Alimentos e tipo de reação', section: 'Alergias' },
        { id: 'alergias_ambientais', label: 'Ambientais', type: 'textarea', placeholder: 'Pólen, poeira, animais, látex...', section: 'Alergias' },
        { id: 'alergias_reacao', label: 'Reação apresentada', type: 'textarea', placeholder: 'Urticária, angioedema, anafilaxia, broncoespasmo...', section: 'Alergias' },
      ],
    },

    // ── 7. HÁBITOS DE VIDA ────────────────────────────────────────
    {
      id: 'habitos_vida',
      titulo: '7. Hábitos de Vida',
      descricao: 'Tabagismo, etilismo, atividade física, alimentação, drogas e sono',
      icon: 'Activity',
      legacyColumn: 'habitos_vida',
      campos: [
        { id: 'hab_tabagismo', label: 'Tabagismo (carga tabágica)', type: 'text', placeholder: 'Ex: 20 maços/ano, nunca fumou', section: 'Hábitos' },
        { id: 'hab_etilismo', label: 'Etilismo (frequência/quantidade)', type: 'text', placeholder: 'Ex: 2 cervejas nos fins de semana', section: 'Hábitos' },
        { id: 'hab_atividade_fisica', label: 'Atividade física', type: 'textarea', placeholder: 'Tipo, frequência, duração', section: 'Hábitos' },
        { id: 'hab_alimentacao', label: 'Alimentação', type: 'textarea', placeholder: 'Padrão alimentar, restrições, dietas...', section: 'Hábitos' },
        { id: 'hab_drogas', label: 'Uso de drogas', type: 'textarea', placeholder: 'Substância e frequência', section: 'Hábitos' },
        { id: 'hab_sono', label: 'Padrão de sono', type: 'textarea', placeholder: 'Horas de sono, qualidade, uso de medicação...', section: 'Hábitos' },
      ],
    },

    // ── 8. HISTÓRIA GINECOLÓGICA/OBSTÉTRICA ───────────────────────
    {
      id: 'historia_ginecologica',
      titulo: '8. História Ginecológica/Obstétrica',
      descricao: 'Quando aplicável',
      icon: 'Baby',
      legacyColumn: 'historia_ginecologica',
      campos: [
        { id: 'gin_menarca', label: 'Menarca', type: 'text', placeholder: 'Idade da primeira menstruação', section: 'Ginecológica' },
        { id: 'gin_ciclo', label: 'Ciclo menstrual', type: 'text', placeholder: 'Regular, irregular, amenorreia...', section: 'Ginecológica' },
        { id: 'gin_gestacoes', label: 'Gestações', type: 'number', placeholder: 'Número de gestações', section: 'Ginecológica' },
        { id: 'gin_abortos', label: 'Abortos', type: 'number', placeholder: 'Número de abortos', section: 'Ginecológica' },
        { id: 'gin_dum', label: 'Última menstruação', type: 'date', section: 'Ginecológica' },
        { id: 'gin_contraceptivo', label: 'Método contraceptivo', type: 'text', placeholder: 'ACO, DIU, preservativo, nenhum...', section: 'Ginecológica' },
      ],
    },

    // ── 9. REVISÃO DE SISTEMAS (ROS) ─────────────────────────────
    {
      id: 'revisao_sistemas',
      titulo: '9. Revisão de Sistemas (ROS)',
      descricao: 'Investigação ativa por sistemas',
      icon: 'LayoutList',
      legacyColumn: 'revisao_sistemas',
      campos: [
        { id: 'ros_geral', label: 'Geral', type: 'textarea', placeholder: 'Febre, perda de peso, fadiga, sudorese noturna...', section: 'ROS' },
        { id: 'ros_cardiovascular', label: 'Cardiovascular', type: 'textarea', placeholder: 'Dor torácica, palpitações, dispneia, edema MMII...', section: 'ROS' },
        { id: 'ros_respiratorio', label: 'Respiratório', type: 'textarea', placeholder: 'Tosse, expectoração, dispneia, sibilância...', section: 'ROS' },
        { id: 'ros_gastrointestinal', label: 'Gastrointestinal', type: 'textarea', placeholder: 'Náusea, vômito, dor abdominal, diarreia, constipação...', section: 'ROS' },
        { id: 'ros_geniturinario', label: 'Geniturinário', type: 'textarea', placeholder: 'Disúria, polaciúria, hematúria, incontinência...', section: 'ROS' },
        { id: 'ros_neurologico', label: 'Neurológico', type: 'textarea', placeholder: 'Cefaleia, tontura, convulsões, parestesias, fraqueza...', section: 'ROS' },
        { id: 'ros_endocrino', label: 'Endócrino', type: 'textarea', placeholder: 'Polidipsia, poliúria, intolerância ao calor/frio...', section: 'ROS' },
        { id: 'ros_musculoesqueletico', label: 'Musculoesquelético', type: 'textarea', placeholder: 'Artralgia, mialgia, rigidez, limitação de movimento...', section: 'ROS' },
        { id: 'ros_dermatologico', label: 'Dermatológico', type: 'textarea', placeholder: 'Lesões de pele, prurido, alterações ungueais/capilares...', section: 'ROS' },
        { id: 'ros_psiquiatrico', label: 'Psiquiátrico', type: 'textarea', placeholder: 'Humor, ansiedade, insônia, ideação suicida...', section: 'ROS' },
      ],
    },
  ],
};

// ─── HELPERS ────────────────────────────────────────────────────────

/** Get all fields flattened from the template */
export function getAllTemplateFields(): CampoAnamnese[] {
  return ANAMNESE_CLINICA_GERAL_TEMPLATE.secoes.flatMap(s => s.campos);
}

/** Get sections with their fields */
export function getSecoes(): SecaoAnamnese[] {
  return ANAMNESE_CLINICA_GERAL_TEMPLATE.secoes;
}

/** Calculate BMI from weight (kg) and height (cm) */
export function calculateIMC(pesoKg: number | null, alturaCm: number | null): { value: number; classification: string } | null {
  if (!pesoKg || !alturaCm || alturaCm <= 0) return null;
  const alturaM = alturaCm / 100;
  const imc = pesoKg / (alturaM * alturaM);
  
  let classification = '';
  if (imc < 18.5) classification = 'Abaixo do peso';
  else if (imc < 25) classification = 'Peso normal';
  else if (imc < 30) classification = 'Sobrepeso';
  else if (imc < 35) classification = 'Obesidade grau I';
  else if (imc < 40) classification = 'Obesidade grau II';
  else classification = 'Obesidade grau III';

  return { value: Math.round(imc * 100) / 100, classification };
}

/** Map structured data back to legacy columns for backward compatibility */
export function mapStructuredToLegacy(data: Record<string, unknown>): Record<string, string> {
  const legacy: Record<string, string> = {};

  // QP
  if (data.qp_descricao) legacy.queixa_principal = String(data.qp_descricao);

  // HDA - concatenate OPQRST fields
  const hdaFields = ['hda_onset', 'hda_provocation', 'hda_quality', 'hda_radiation', 'hda_severity', 'hda_time', 'hda_evolucao', 'hda_sintomas_associados', 'hda_tratamentos_previos', 'hda_impacto_funcional'];
  const hdaLabels: Record<string, string> = {
    hda_onset: 'Início', hda_provocation: 'Fatores piora/melhora', hda_quality: 'Qualidade',
    hda_radiation: 'Irradiação', hda_severity: 'Intensidade', hda_time: 'Duração',
    hda_evolucao: 'Evolução', hda_sintomas_associados: 'Sintomas associados',
    hda_tratamentos_previos: 'Tratamentos prévios', hda_impacto_funcional: 'Impacto funcional',
  };
  const hdaParts = hdaFields.filter(f => data[f] !== undefined && data[f] !== null && data[f] !== '').map(f => `${hdaLabels[f]}: ${data[f]}`);
  if (hdaParts.length > 0) legacy.historia_doenca_atual = hdaParts.join('\n');

  // HPP
  const hppParts: string[] = [];
  if (data.hpp_doencas_previas) hppParts.push(`Doenças: ${data.hpp_doencas_previas}`);
  if (data.hpp_internacoes) hppParts.push(`Internações: ${data.hpp_internacoes}`);
  if (data.hpp_cirurgias) hppParts.push(`Cirurgias: ${data.hpp_cirurgias}`);
  if (data.hpp_transfusoes) hppParts.push(`Transfusões: ${data.hpp_transfusoes}`);
  if (data.hpp_traumas) hppParts.push(`Traumas: ${data.hpp_traumas}`);
  if (hppParts.length > 0) legacy.antecedentes_pessoais = hppParts.join('\n');

  // HF
  const hfParts: string[] = [];
  if (data.hf_doencas_hereditarias) hfParts.push(`Hereditárias: ${data.hf_doencas_hereditarias}`);
  if (data.hf_has_dm_cancer) hfParts.push(`HAS/DM/Câncer/Cardio: ${data.hf_has_dm_cancer}`);
  if (data.hf_obitos) hfParts.push(`Óbitos: ${data.hf_obitos}`);
  if (hfParts.length > 0) legacy.antecedentes_familiares = hfParts.join('\n');

  // Medicamentos
  const medParts: string[] = [];
  if (data.med_lista) medParts.push(String(data.med_lista));
  if (data.med_automedicacao) medParts.push(`Automedicação: ${data.med_automedicacao}`);
  if (medParts.length > 0) legacy.medicamentos_uso_continuo = medParts.join('\n');

  // Alergias
  const alParts: string[] = [];
  if (data.alergias_medicamentosas) alParts.push(`Medicamentosas: ${data.alergias_medicamentosas}`);
  if (data.alergias_alimentares) alParts.push(`Alimentares: ${data.alergias_alimentares}`);
  if (data.alergias_ambientais) alParts.push(`Ambientais: ${data.alergias_ambientais}`);
  if (data.alergias_reacao) alParts.push(`Reação: ${data.alergias_reacao}`);
  if (alParts.length > 0) legacy.alergias = alParts.join('\n');

  // Hábitos
  const habParts: string[] = [];
  if (data.hab_tabagismo) habParts.push(`Tabagismo: ${data.hab_tabagismo}`);
  if (data.hab_etilismo) habParts.push(`Etilismo: ${data.hab_etilismo}`);
  if (data.hab_atividade_fisica) habParts.push(`Atividade física: ${data.hab_atividade_fisica}`);
  if (data.hab_alimentacao) habParts.push(`Alimentação: ${data.hab_alimentacao}`);
  if (data.hab_drogas) habParts.push(`Drogas: ${data.hab_drogas}`);
  if (data.hab_sono) habParts.push(`Sono: ${data.hab_sono}`);
  if (habParts.length > 0) legacy.habitos_vida = habParts.join('\n');

  return legacy;
}
