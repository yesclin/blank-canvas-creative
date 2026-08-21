/**
 * PLANOS PÚBLICOS — ESPELHO DE `public.subscription_plans`
 * ------------------------------------------------------------------
 * A tabela `subscription_plans` só é legível por usuários autenticados
 * (RLS: "plans public read active" → role `authenticated`), portanto a
 * landing page pública não pode consultá-la. Este arquivo é o espelho
 * fiel dos valores reais dos 3 planos oficiais.
 *
 * REGRA: qualquer alteração de plano/limite/feature deve ser feita no
 * Super Admin (banco) e refletida aqui. Nunca inventar recurso ou limite.
 *
 * Sincronizado em: 2026-08-21 com `subscription_plans` (slugs:
 * essencial, profissional, clinica).
 */

export type PublicPlanSlug = "essencial" | "profissional" | "clinica";

export interface PublicPlan {
  slug: PublicPlanSlug;
  name: string;
  tagline: string;
  positioning: string;
  monthly: number;
  yearly: number;
  badge?: "popular" | "complete";
  limits: {
    professionals: number | null;
    patients: number | null;
    specialties: number | null;
    appointmentsMonthly: number | null;
    whatsappInstances: number | null;
  };
  features: {
    whatsapp: boolean;
    teleconsulta: boolean;
    inventory: boolean;
    insurances: boolean;
    marketing: boolean;
    crm: boolean;
    automations: boolean;
    advancedReports: boolean;
    audit: boolean;
    prioritySupport: boolean;
  };
  /** Bullets curtos, orientados a benefício (derivados dos dados acima). */
  highlights: string[];
  inheritsFrom?: string;
}

export const PUBLIC_PLANS: readonly PublicPlan[] = [
  {
    slug: "essencial",
    name: "Essencial",
    tagline: "Organizar e atender",
    positioning:
      "Para profissionais autônomos e consultórios que querem organizar toda a rotina clínica.",
    monthly: 97,
    yearly: 970,
    limits: {
      professionals: 2,
      patients: 500,
      specialties: 2,
      appointmentsMonthly: 300,
      whatsappInstances: 1,
    },
    features: {
      whatsapp: true,
      teleconsulta: true,
      inventory: true,
      insurances: false,
      marketing: false,
      crm: false,
      automations: false,
      advancedReports: false,
      audit: false,
      prioritySupport: false,
    },
    highlights: [
      "Até 2 profissionais e 500 pacientes",
      "2 especialidades ativas na clínica",
      "Agenda completa com bloqueios e confirmações",
      "Prontuário eletrônico e atendimento clínico",
      "Documentos clínicos com assinatura eletrônica",
      "Teleconsulta integrada ao atendimento",
      "WhatsApp para lembretes e confirmações",
      "Controle de estoque e materiais",
      "Financeiro com recebimentos e caixa",
    ],
  },
  {
    slug: "profissional",
    name: "Profissional",
    tagline: "Gerenciar e controlar",
    positioning:
      "Para clínicas em crescimento que precisam de mais organização, controle e gestão.",
    monthly: 297,
    yearly: 2970,
    badge: "popular",
    inheritsFrom: "Essencial",
    limits: {
      professionals: 5,
      patients: 1500,
      specialties: 4,
      appointmentsMonthly: 1500,
      whatsappInstances: 1,
    },
    features: {
      whatsapp: true,
      teleconsulta: true,
      inventory: true,
      insurances: true,
      marketing: true,
      crm: false,
      automations: false,
      advancedReports: false,
      audit: false,
      prioritySupport: false,
    },
    highlights: [
      "Até 5 profissionais e 1.500 pacientes",
      "4 especialidades ativas na clínica",
      "Convênios, guias TISS e repasses",
      "Campanhas de marketing e relacionamento",
      "Pacotes, sessões e procedimentos completos",
      "Permissões personalizadas por usuário",
      "Comissões por profissional",
      "Financeiro completo com contas a receber e pagar",
    ],
  },
  {
    slug: "clinica",
    name: "Clínica",
    tagline: "Gerenciar, crescer e operar por completo",
    positioning:
      "Para clínicas que querem uma operação completa, integrada e preparada para crescer.",
    monthly: 597,
    yearly: 5970,
    badge: "complete",
    inheritsFrom: "Profissional",
    limits: {
      professionals: 10,
      patients: null,
      specialties: 4,
      appointmentsMonthly: null,
      whatsappInstances: 1,
    },
    features: {
      whatsapp: true,
      teleconsulta: true,
      inventory: true,
      insurances: true,
      marketing: true,
      crm: true,
      automations: true,
      advancedReports: true,
      audit: true,
      prioritySupport: true,
    },
    highlights: [
      "Até 10 profissionais e pacientes ilimitados",
      "Agendamentos ilimitados por mês",
      "CRM Comercial completo: leads, oportunidades e orçamentos",
      "Automações de mensagens e follow-ups",
      "Relatórios avançados de gestão e resultado",
      "Auditoria completa de acessos e alterações",
      "Suporte prioritário",
    ],
  },
] as const;

/** Benefícios comuns aos TRÊS planos (validados nos dados acima). */
export const ALL_PLANS_INCLUDE: readonly string[] = [
  "Sistema 100% online, sem instalação",
  "Agenda e gestão de pacientes",
  "Prontuário eletrônico por especialidade",
  "Documentos clínicos e assinatura eletrônica",
  "Teleconsulta integrada",
  "WhatsApp para confirmações e lembretes",
  "Controle de estoque e materiais",
  "Financeiro com caixa e recebimentos",
  "Segurança, LGPD e controle de acesso",
  "Atualizações contínuas do sistema",
  "Teste grátis por 7 dias, sem cartão",
  "Suporte por e-mail e WhatsApp",
];

export type ComparisonValue = boolean | string;

export interface ComparisonRow {
  label: string;
  values: Record<PublicPlanSlug, ComparisonValue>;
}

export interface ComparisonGroup {
  group: string;
  rows: ComparisonRow[];
}

export const PLAN_COMPARISON: readonly ComparisonGroup[] = [
  {
    group: "Capacidade",
    rows: [
      {
        label: "Profissionais",
        values: { essencial: "Até 2", profissional: "Até 5", clinica: "Até 10" },
      },
      {
        label: "Pacientes",
        values: { essencial: "500", profissional: "1.500", clinica: "Ilimitado" },
      },
      {
        label: "Especialidades ativas",
        values: { essencial: "2", profissional: "4", clinica: "4" },
      },
      {
        label: "Agendamentos por mês",
        values: { essencial: "300", profissional: "1.500", clinica: "Ilimitado" },
      },
      {
        label: "Instâncias de WhatsApp",
        values: { essencial: "1", profissional: "1", clinica: "1" },
      },
    ],
  },
  {
    group: "Clínico",
    rows: [
      { label: "Agenda completa", values: { essencial: true, profissional: true, clinica: true } },
      { label: "Prontuário eletrônico", values: { essencial: true, profissional: true, clinica: true } },
      { label: "Atendimento clínico", values: { essencial: true, profissional: true, clinica: true } },
      { label: "Documentos e assinatura eletrônica", values: { essencial: true, profissional: true, clinica: true } },
      { label: "Teleconsulta", values: { essencial: true, profissional: true, clinica: true } },
      { label: "Odontograma e mapa facial", values: { essencial: true, profissional: true, clinica: true } },
    ],
  },
  {
    group: "Gestão",
    rows: [
      { label: "Financeiro e caixa", values: { essencial: true, profissional: true, clinica: true } },
      { label: "Estoque e materiais", values: { essencial: true, profissional: true, clinica: true } },
      { label: "Pacotes, sessões e comissões", values: { essencial: true, profissional: true, clinica: true } },
      { label: "Permissões por usuário", values: { essencial: true, profissional: true, clinica: true } },
      { label: "Convênios e guias TISS", values: { essencial: false, profissional: true, clinica: true } },
      { label: "Relatórios avançados", values: { essencial: false, profissional: false, clinica: true } },
      { label: "Auditoria completa", values: { essencial: false, profissional: false, clinica: true } },
    ],
  },
  {
    group: "Crescimento",
    rows: [
      { label: "WhatsApp integrado", values: { essencial: true, profissional: true, clinica: true } },
      { label: "Marketing e campanhas", values: { essencial: false, profissional: true, clinica: true } },
      { label: "CRM Comercial (leads, orçamentos)", values: { essencial: false, profissional: false, clinica: true } },
      { label: "Automações", values: { essencial: false, profissional: false, clinica: true } },
    ],
  },
  {
    group: "Suporte",
    rows: [
      { label: "Suporte padrão", values: { essencial: true, profissional: true, clinica: true } },
      { label: "Suporte prioritário", values: { essencial: false, profissional: false, clinica: true } },
    ],
  },
] as const;
