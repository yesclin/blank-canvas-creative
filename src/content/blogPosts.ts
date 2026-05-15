export type BlogSection =
  | { type: "p"; text: string }
  | { type: "h2"; text: string }
  | { type: "ul"; items: string[] }
  | { type: "quote"; text: string };

export type BlogPost = {
  slug: string;
  title: string;
  excerpt: string;
  category: string;
  date: string;
  readTime: string;
  cover: string;
  body: BlogSection[];
};

export const blogPosts: BlogPost[] = [
  {
    slug: "gestao-clinica-100-digital",
    title: "Como tornar a gestão da sua clínica 100% digital em 30 dias",
    excerpt:
      "Um guia prático para migrar do papel para um sistema unificado sem perder produtividade no caminho.",
    category: "Gestão",
    date: "12 de maio, 2026",
    readTime: "7 min",
    cover: "from-primary/20 to-accent/20",
    body: [
      { type: "p", text: "Migrar uma clínica do papel para o digital parece um projeto enorme — mas pode ser feito em 30 dias se você seguir uma ordem clara. O segredo é evoluir por blocos: cadastro, agenda, prontuário e financeiro." },
      { type: "h2", text: "Semana 1 — Base de pacientes e profissionais" },
      { type: "p", text: "Centralize todos os cadastros em um único sistema. Importe planilhas, padronize telefone, e-mail e CPF, e ative o consentimento LGPD logo no cadastro." },
      { type: "h2", text: "Semana 2 — Agenda online" },
      { type: "p", text: "Substitua a agenda em papel por um calendário compartilhado, com encaixes, sala de espera e link público de agendamento. Em poucos dias o time já economiza horas por semana." },
      { type: "h2", text: "Semana 3 — Prontuário eletrônico" },
      { type: "p", text: "Comece pelos modelos de anamnese da sua especialidade. Use evolução estruturada, prescrição e assinatura digital avançada para já gerar documentos válidos." },
      { type: "h2", text: "Semana 4 — Financeiro e indicadores" },
      { type: "p", text: "Conecte o financeiro ao atendimento: cada consulta gera o recebimento certo, com método de pagamento e fechamento diário. No fim do mês, você tem o primeiro relatório real da clínica." },
      { type: "quote", text: "Digitalizar não é trocar papel por tela — é eliminar retrabalho e ganhar tempo para o paciente." },
    ],
  },
  {
    slug: "ia-no-prontuario",
    title: "IA no prontuário: o que muda na rotina do profissional de saúde",
    excerpt:
      "Transcrição automática, sugestão de hipóteses e mais tempo olhando para o paciente. Veja como aplicar.",
    category: "Tecnologia",
    date: "05 de maio, 2026",
    readTime: "6 min",
    cover: "from-accent/30 to-primary/10",
    body: [
      { type: "p", text: "A IA aplicada ao prontuário não substitui o profissional — ela elimina o trabalho braçal de digitação e organização, devolvendo tempo de escuta ao paciente." },
      { type: "h2", text: "O que a IA já entrega hoje" },
      { type: "ul", items: [
        "Transcrição da consulta em tempo real",
        "Sugestão de hipóteses diagnósticas com base na anamnese",
        "Resumo automático da evolução para o próximo atendimento",
        "Preenchimento de campos repetitivos a partir do contexto",
      ]},
      { type: "h2", text: "Como começar com segurança" },
      { type: "p", text: "Use IA apenas como assistente: o profissional sempre revisa e assina. Garanta que o provedor seja compatível com LGPD e que os dados clínicos não treinem modelos externos." },
      { type: "h2", text: "Resultado prático" },
      { type: "p", text: "Clínicas que adotam IA no prontuário relatam de 20% a 40% menos tempo gasto em digitação, mais aderência ao registro e maior satisfação do paciente." },
    ],
  },
  {
    slug: "lgpd-na-clinica",
    title: "LGPD na clínica: checklist essencial para evitar multas",
    excerpt:
      "Consentimento, base legal, retenção e auditoria — o passo a passo para estar 100% em conformidade.",
    category: "Compliance",
    date: "28 de abril, 2026",
    readTime: "9 min",
    cover: "from-primary/15 to-success/15",
    body: [
      { type: "p", text: "Dados de saúde são dados sensíveis e exigem cuidado redobrado. A LGPD impõe regras claras — e a ANPD já vem aplicando sanções." },
      { type: "h2", text: "Checklist mínimo" },
      { type: "ul", items: [
        "Termo de consentimento assinado e armazenado por paciente",
        "Base legal correta para cada finalidade (atendimento, marketing, pesquisa)",
        "Política de retenção e descarte documentada",
        "Controle de acesso por papel (RBAC) ao prontuário",
        "Trilha de auditoria de quem acessou cada registro",
        "Encarregado (DPO) nomeado e canal do titular ativo",
      ]},
      { type: "h2", text: "Erros mais comuns" },
      { type: "p", text: "Compartilhar prontuários por WhatsApp pessoal, planilhas em e-mail aberto e backups sem criptografia são as falhas mais frequentes. Centralizar tudo em um sistema com isolamento por clínica resolve a maior parte." },
      { type: "h2", text: "O papel da assinatura digital" },
      { type: "p", text: "Documentos clínicos com assinatura avançada (SHA-256 e token de verificação) têm validade jurídica e protegem a clínica em caso de auditoria ou processo." },
    ],
  },
  {
    slug: "no-show-zero",
    title: "No-show zero: 8 estratégias que reduzem faltas em até 60%",
    excerpt:
      "Lembretes pelo WhatsApp, confirmação automática, lista de espera e outras táticas comprovadas.",
    category: "Operação",
    date: "20 de abril, 2026",
    readTime: "5 min",
    cover: "from-warning/20 to-primary/10",
    body: [
      { type: "p", text: "Cada falta custa em média uma hora de profissional ocioso. Reduzir o no-show é uma das formas mais rápidas de aumentar a receita sem atender mais pacientes." },
      { type: "h2", text: "8 ações que funcionam" },
      { type: "ul", items: [
        "Confirmação automática 48h antes pelo WhatsApp",
        "Lembrete final 2h antes com link da localização",
        "Lista de espera ativa para encaixes imediatos",
        "Política clara de cancelamento e reagendamento",
        "Cobrança simbólica de sinal em primeiras consultas",
        "Histórico de faltas visível na agenda",
        "Atendimento online como alternativa em caso de imprevisto",
        "Pesquisa pós-falta para entender o motivo real",
      ]},
      { type: "h2", text: "Meça antes e depois" },
      { type: "p", text: "Acompanhe a taxa de no-show por profissional e por horário. Em geral, manhã de segunda e fim de tarde de sexta concentram mais faltas — e merecem ações específicas." },
    ],
  },
  {
    slug: "marketing-para-clinicas",
    title: "Marketing para clínicas: do primeiro contato ao paciente fiel",
    excerpt:
      "CRM, jornadas automáticas e métricas que importam para crescer com previsibilidade.",
    category: "Marketing",
    date: "10 de abril, 2026",
    readTime: "8 min",
    cover: "from-accent/20 to-primary/20",
    body: [
      { type: "p", text: "Marketing de clínica não é só anúncio — é construir relacionamento de longo prazo. Tudo começa com um CRM que organiza o funil do primeiro contato até o pós-atendimento." },
      { type: "h2", text: "As 4 etapas do funil clínico" },
      { type: "ul", items: [
        "Atração: conteúdo, indicação e mídia paga local",
        "Conversão: agendamento online e atendimento rápido no WhatsApp",
        "Atendimento: experiência impecável da recepção ao pós-consulta",
        "Fidelização: jornadas automáticas de retorno e aniversário",
      ]},
      { type: "h2", text: "Métricas que realmente importam" },
      { type: "p", text: "Custo por lead, taxa de conversão de orçamento, ticket médio e LTV (valor do paciente ao longo do tempo). Sem esses números, marketing é gasto — com eles, é investimento." },
      { type: "h2", text: "Automação com cuidado" },
      { type: "p", text: "Mensagens em massa pelo WhatsApp queimam o canal. Prefira jornadas segmentadas: pós-consulta, retorno previsto, campanhas sazonais por especialidade." },
    ],
  },
  {
    slug: "estoque-clinico-fefo",
    title: "Estoque clínico com FEFO: como acabar com perdas e rupturas",
    excerpt:
      "Controle por lote, validade e consumo por atendimento. O método FEFO aplicado na sua clínica.",
    category: "Estoque",
    date: "02 de abril, 2026",
    readTime: "6 min",
    cover: "from-success/15 to-primary/10",
    body: [
      { type: "p", text: "FEFO (First Expire, First Out) é o método em que o item com validade mais próxima sai primeiro. Para clínicas, isso significa menos descarte e mais segurança no atendimento." },
      { type: "h2", text: "Como aplicar na prática" },
      { type: "ul", items: [
        "Cadastre cada entrada com lote e data de validade",
        "Configure o sistema para bloquear saldo negativo",
        "Vincule a baixa de insumos ao atendimento (ex.: toxina, fillers)",
        "Receba alertas de validade próxima e estoque mínimo",
        "Faça inventário cíclico, não só anual",
      ]},
      { type: "h2", text: "Kits clínicos x kits comerciais" },
      { type: "p", text: "Separe os kits usados em procedimentos (com baixa automática) dos kits vendidos ao paciente. Isso evita confusão entre custo clínico e receita comercial." },
      { type: "h2", text: "O ganho financeiro" },
      { type: "p", text: "Clínicas que adotam FEFO reduzem perdas por validade em até 80% no primeiro semestre — dinheiro que volta direto para o caixa." },
    ],
  },
];
