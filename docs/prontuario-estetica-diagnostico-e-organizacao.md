# Diagnóstico e Organização — Prontuário de Estética (YesClin)

> **Data:** 2026-04-03  
> **Escopo:** Especialidade `estetica` — arquitetura, persistência, templates, renderização e módulos  
> **Objetivo:** Documentar o estado atual, identificar problemas e propor reorganização incremental

---

## 1. Visão Geral do Prontuário de Estética

### 1.1 Abas existentes

O prontuário de estética expõe as seguintes abas/módulos (orquestrados em `src/pages/app/Prontuario.tsx`):

| Aba (módulo key) | Componente | Tabela principal |
|---|---|---|
| Visão Geral | `VisaoGeralEsteticaBlock` | `clinical_evolutions` + `clinical_alerts` + `before_after_records` |
| Anamnese Estética | `AnamneseEsteticaBlock` | `clinical_evolutions` (legacy) **E** `anamnesis_records` (dinâmico) |
| Avaliação Estética | `AvaliacaoEsteticaBlock` | `clinical_evolutions` |
| Evoluções | `EvolucoesEsteticaBlock` | `clinical_evolutions` |
| Mapa Facial | `FacialMapModule` | `facial_map_applications` + `facial_maps` |
| Fotos Antes/Depois | `BeforeAfterModule` | `before_after_records` + `clinical_media` |
| Termos | `ConsentModule` | tabela customizada de consentimentos |
| Produtos Utilizados | `ProdutosUtilizadosBlock` | `facial_map_applications` (leitura agrupada) |
| Alertas Clínicos | `AlertasEsteticaBlock` | `clinical_alerts` |
| Linha do Tempo | `TimelineEsteticaBlock` | agregação de várias tabelas |

### 1.2 Fluxo atual de carregamento

1. O usuário abre a página `Prontuario.tsx` e seleciona paciente + especialidade
2. O `useResolvedSpecialty` resolve a especialidade ativa como `estetica`
3. O Prontuario renderiza as abas específicas para estética condicionalmente via `activeSpecialtyKey === 'estetica'`
4. Cada aba é um componente independente com seu próprio hook de dados
5. Não existe provider de contexto compartilhado entre os módulos de estética

---

## 2. Mapa Estrutural Atual

### 2.1 Componentes UI

#### Navegação e layout
- `src/pages/app/Prontuario.tsx` — **1566 linhas**, orquestra TODAS as especialidades, contém lógica de renderização condicional para estética misturada com todas as outras

#### Bloco de Anamnese (DOIS sistemas concorrentes)
- `src/components/prontuario/aesthetics/AnamneseEsteticaBlock.tsx` — **717 linhas**, componente especializado para estética
- `src/components/prontuario/clinica-geral/AnamneseBlock.tsx` — **1566 linhas**, bloco genérico que TAMBÉM renderiza templates dinâmicos de estética via `ADVANCED_TEMPLATE_MAP`
- `src/components/prontuario/aesthetics/DynamicAnamneseRenderer.tsx` — renderizador dinâmico de campos

#### Componentes de campos visuais especializados
- `src/components/prontuario/aesthetics/anamnese-fields/VisualOptionCardGrid.tsx`
- `src/components/prontuario/aesthetics/anamnese-fields/ClinicalTableSingleChoice.tsx`
- `src/components/prontuario/aesthetics/anamnese-fields/SelectRowGroup.tsx`
- `src/components/prontuario/aesthetics/anamnese-fields/AccordionMeasurementGroup.tsx`
- `src/components/prontuario/aesthetics/anamnese-fields/BMICalculator.tsx`
- `src/components/prontuario/aesthetics/anamnese-fields/ImageCarouselSelector.tsx`
- `src/components/prontuario/aesthetics/anamnese-fields/ImageUploadPlaceholder.tsx`
- `src/components/prontuario/aesthetics/anamnese-fields/PerimetryFields.tsx`

#### Avaliação
- `src/components/prontuario/aesthetics/AvaliacaoEsteticaBlock.tsx` — **534 linhas**, formulário fixo hardcoded

#### Módulos especializados
- `src/components/prontuario/aesthetics/FacialMapModule.tsx` — mapa facial interativo
- `src/components/prontuario/aesthetics/BeforeAfterModule.tsx` — antes/depois
- `src/components/prontuario/aesthetics/ConsentModule.tsx` — termos de consentimento
- `src/components/prontuario/aesthetics/ProdutosUtilizadosBlock.tsx` — produtos
- `src/components/prontuario/aesthetics/EvolucoesEsteticaBlock.tsx` — evoluções
- `src/components/prontuario/aesthetics/AlertasEsteticaBlock.tsx` — alertas
- `src/components/prontuario/aesthetics/TimelineEsteticaBlock.tsx` — timeline
- `src/components/prontuario/aesthetics/VisaoGeralEsteticaBlock.tsx` — visão geral

#### Componentes auxiliares de estética
- `src/components/prontuario/aesthetics/FacialMapSVG.tsx`
- `src/components/prontuario/aesthetics/ApplicationPointDialog.tsx`
- `src/components/prontuario/aesthetics/SessionHistoryPanel.tsx`
- `src/components/prontuario/aesthetics/MuscleList.tsx`
- `src/components/prontuario/aesthetics/SignatureCanvas.tsx`
- `src/components/prontuario/aesthetics/BeforeAfterCompare.tsx`

#### Renderer legado (genérico)
- `src/components/prontuario/AnamneseFieldRenderer.tsx` — renderizador baseado em `CampoAnamnese` (tipo legado)

#### Seletor de template
- `src/components/prontuario/AnamneseModelSelector.tsx`
- `src/components/prontuario/AnamnesisTemplatePicker.tsx`
- `src/components/prontuario/estetica/AnamneseTemplateSelectorDialog.tsx`

### 2.2 Hooks

#### Dados de módulos de estética
- `src/hooks/aesthetics/useAnamneseEsteticaData.ts` — dados legacy (salva em `clinical_evolutions` com `evolution_type = 'anamnese_estetica'`)
- `src/hooks/aesthetics/useDynamicAnamneseEstetica.ts` — dados dinâmicos (salva em `anamnesis_records`)
- `src/hooks/aesthetics/useAvaliacaoEsteticaData.ts` — avaliação (salva em `clinical_evolutions` com `evolution_type = 'avaliacao_estetica'`)
- `src/hooks/aesthetics/useFacialMap.ts`
- `src/hooks/aesthetics/useBeforeAfter.ts`
- `src/hooks/aesthetics/useAestheticConsent.ts`
- `src/hooks/aesthetics/useVisaoGeralEsteticaData.ts`
- `src/hooks/aesthetics/useProdutosUtilizadosData.ts`
- `src/hooks/aesthetics/useEvolucoesEsteticaData.ts`
- `src/hooks/aesthetics/useAestheticAlerts.ts`
- `src/hooks/aesthetics/useTimelineEsteticaData.ts`
- `src/hooks/aesthetics/useConsolidatedFillerPdf.ts`

#### Definição de templates
- `src/hooks/prontuario/estetica/anamneseTemplates.ts` — 7 templates LEGADOS locais com tipo `CampoAnamnese`
- `src/hooks/prontuario/estetica/esteticaAdvancedTemplates.ts` — 4 templates AVANÇADOS com tipo `DynamicField`

#### Hooks genéricos usados por estética
- `src/hooks/useAnamnesisTemplatesV2.ts` — busca templates do banco
- `src/hooks/prontuario/useResolvedAnamnesisTemplate.ts`

### 2.3 Tipos

- `src/components/prontuario/aesthetics/types.ts` — tipos de mapa facial, before/after, consent, produtos
- `src/components/prontuario/aesthetics/anamnese-fields/types.ts` — `DynamicField`, `FieldConfig`, `VisualCardOption`
- `src/hooks/prontuario/estetica/anamneseTemplates.ts` — `CampoAnamnese`, `TemplateAnamneseEstetica` (legado)
- `src/types/prontuario.ts` — tipos genéricos de prontuário (257 linhas)

### 2.4 Tabelas utilizadas

| Tabela | Uso na estética |
|---|---|
| `clinical_evolutions` | Anamnese legacy, Avaliação, Evoluções |
| `anamnesis_records` | Templates dinâmicos avançados (4 modelos) |
| `anamnesis_templates` | Definição de templates |
| `anamnesis_template_versions` | Versões de templates |
| `facial_map_applications` | Pontos de aplicação no mapa facial |
| `facial_maps` | Sessões do mapa facial |
| `before_after_records` | Registros antes/depois |
| `clinical_media` | Imagens clínicas |
| `clinical_alerts` | Alertas clínicos |
| `body_measurements` | Medições corporais |

---

## 3. Problemas Encontrados

### 3.1 CRÍTICO: Dois sistemas de anamnese concorrentes

**Problema:** Existem DOIS caminhos paralelos para anamnese de estética que salvam em tabelas DIFERENTES:

1. **Sistema Legacy** (`useAnamneseEsteticaData`):  
   - Salva em `clinical_evolutions` com `evolution_type = 'anamnese_estetica'`
   - Formulário fixo hardcoded com 10 campos (`queixa_principal`, `procedimentos_anteriores`, etc.)
   - Versionamento manual via campo `versao` dentro do JSON `content`

2. **Sistema Dinâmico** (`useDynamicAnamneseEstetica`):  
   - Salva em `anamnesis_records` com `template_id` e `responses`
   - 4 templates avançados (Facial, Pele, Capilar, Corporal)
   - Versionamento via `template_version_id`

**Consequência:** O `AnamneseEsteticaBlock` carrega AMBOS os hooks simultaneamente e decide qual renderizar baseado em `isDynamicTemplate`. Dados podem existir em ambas as tabelas para o mesmo paciente sem correlação.

### 3.2 CRÍTICO: Dois renderers concorrentes no prontuário genérico

**Problema:** O `AnamneseBlock.tsx` genérico (1566 linhas) TAMBÉM importa e renderiza templates dinâmicos de estética:

```typescript
import { ADVANCED_TEMPLATE_MAP } from '@/hooks/prontuario/estetica/esteticaAdvancedTemplates';
import { DynamicAnamneseRenderer } from '@/components/prontuario/aesthetics/DynamicAnamneseRenderer';
import { useDynamicAnamneseEstetica } from '@/hooks/aesthetics/useDynamicAnamneseEstetica';
```

**Consequência:** O mesmo template pode ser renderizado por dois componentes diferentes dependendo do contexto de navegação. Duplicação de lógica de autosave, detecção de template ativo e gerenciamento de estado.

### 3.3 ALTO: Dois sistemas de tipos para campos de anamnese

| Sistema | Interface | Tipos suportados | Usado por |
|---|---|---|---|
| Legacy | `CampoAnamnese` | text, textarea, select, multiselect, checkbox, radio, date, number, imagem_interativa, link_mapa_facial | `AnamneseFieldRenderer`, 7 templates locais |
| Dinâmico | `DynamicField` | rich_text, textarea, text, number, radio, select, visual_card_grid, clinical_table_choice, select_row, accordion_measurements, bmi_calculator, image_carousel, image_upload | `DynamicAnamneseRenderer`, 4 templates avançados |

**Consequência:** Não há interoperabilidade. Um template legado não renderiza em `DynamicAnamneseRenderer` e vice-versa.

### 3.4 ALTO: Templates legados locais ficam órfãos

Os 7 templates em `anamneseTemplates.ts` (anamnese_geral_estetica, anamnese_toxina, anamnese_preenchimento, etc.) são definidos localmente no código e NÃO estão representados no banco como templates com `template_type`. Eles existem como "fallback" mas não aparecem no seletor genérico.

### 3.5 ALTO: Avaliação Estética hardcoded sem template

O `AvaliacaoEsteticaBlock` (534 linhas) é um formulário completamente hardcoded com ~20 campos fixos. Salva em `clinical_evolutions` com `evolution_type = 'avaliacao_estetica'`. Não usa templates, não é dinâmico, não é versionável por template.

**Sobreposição:** Muitos campos da avaliação (tipo de pele, rugas, manchas, etc.) se sobrepõem a campos dos templates avançados (Fitzpatrick, Glogau, etc.).

### 3.6 MÉDIO: AnamneseEsteticaBlock faz query ad-hoc ao banco

```typescript
const { data } = await (await import('@/integrations/supabase/client')).supabase
  .from('anamnesis_templates')
  .select('template_type, current_version_id')
  .eq('id', activeTemplateId)
  .maybeSingle();
```

Esse import dinâmico dentro de `useEffect` em `AnamneseEsteticaBlock` (linhas 128-148) é frágil, não cacheado e executado toda vez que `activeTemplateId` muda.

### 3.7 MÉDIO: Estrutura dos templates 100% no código-fonte

Os 4 templates avançados estão definidos como constantes TypeScript em `esteticaAdvancedTemplates.ts` (444 linhas). A coluna `campos` da tabela `anamnesis_templates` e `structure` de `anamnesis_template_versions` são ignoradas — a renderização usa APENAS o mapeamento `ADVANCED_TEMPLATE_MAP` no código.

**Consequência:** O banco de dados é apenas um índice de metadados. A estrutura real vive no bundle JavaScript. Isso impede customização por clínica e torna o versionamento do banco inútil.

### 3.8 MÉDIO: Prontuario.tsx é um monólito

O arquivo `src/pages/app/Prontuario.tsx` tem **1566 linhas** e orquestra TODAS as especialidades. A lógica de abas e renderização condicional para estética está misturada com clínica geral, odontologia, dermatologia, etc.

### 3.9 MÉDIO: Persistência espalhada em múltiplas tabelas

| Dado | Tabela | Campo de tipo |
|---|---|---|
| Anamnese legacy estética | `clinical_evolutions` | `evolution_type = 'anamnese_estetica'` |
| Avaliação estética | `clinical_evolutions` | `evolution_type = 'avaliacao_estetica'` |
| Evoluções estéticas | `clinical_evolutions` | `evolution_type` genérico |
| Anamnese dinâmica | `anamnesis_records` | `template_id` |
| Pontos de aplicação | `facial_map_applications` | — |
| Sessões mapa facial | `facial_maps` | — |
| Before/after | `before_after_records` | — |
| Mídia clínica | `clinical_media` | — |
| Alertas | `clinical_alerts` | — |
| Medições corporais | `body_measurements` | — |

Não existe uma view unificada nem um serviço de agregação que correlacione esses dados.

### 3.10 BAIXO: Componente `PerimetryFields` não é usado pelo template

O template corporal define perimetria como `accordion_measurements` com seções de 1 campo cada, mas existe o componente `PerimetryFields.tsx` dedicado que aceita uma lista flat de campos. O componente existe mas não é usado pelo renderer dinâmico.

### 3.11 BAIXO: rich_text renderiza como textarea

O `DynamicAnamneseRenderer` trata `rich_text` identicamente a `textarea`, apenas com mais linhas. Não há editor rico real.

---

## 4. Causa Raiz da Bagunça

### 4.1 Evolução incremental sem refatoração

A estética começou com um formulário legacy fixo (`useAnamneseEsteticaData`) que salvava tudo em `clinical_evolutions`. Quando surgiu a necessidade de templates dinâmicos e campos visuais complexos, um segundo sistema foi criado (`useDynamicAnamneseEstetica` + `anamnesis_records`) SEM aposentar o primeiro. O resultado são dois pipelines paralelos que nunca foram unificados.

### 4.2 Modelagem fraca no banco

A decisão de guardar a estrutura dos templates no código TypeScript (`ADVANCED_TEMPLATE_MAP`) em vez do banco (`anamnesis_template_versions.structure`) criou um desacoplamento artificial. O banco tem as colunas `campos`, `fields` e `structure` mas nenhuma é realmente lida pela renderização dinâmica. O template do banco serve apenas como "ponteiro" para o código.

### 4.3 Falta de separação por domínio

A especialidade "estética" abrange subdomínios muito distintos:
- **Facial** (toxina, preenchimento, harmonização)
- **Pele/Dermatológico** (acne, rosácea, Fitzpatrick)
- **Capilar** (tricologia, escalas de alopecia)
- **Corporal** (IMC, adipometria, celulite)

Todos foram agrupados sob o mesmo guarda-chuva sem separação de domínio. Os templates avançados tentam cobrir tudo com um único renderer genérico.

### 4.4 Renderer dinâmico com responsabilidade excessiva

O `DynamicAnamneseRenderer` precisa renderizar 12 tipos de campo diferentes, desde um `<Input>` simples até `AccordionMeasurementGroup` com cálculo de mediana e `BMICalculator` com auto-cálculo. Toda essa complexidade vive em um único `switch` de 310 linhas.

### 4.5 Ponte frágil entre AnamneseBlock genérico e AnamneseEsteticaBlock

A estética tem seu próprio `AnamneseEsteticaBlock`, mas o `AnamneseBlock` genérico TAMBÉM tenta renderizar templates de estética via `isDynamicAdvanced`. Isso foi feito como ponte rápida mas criou acoplamento cruzado: o bloco genérico importa templates, hooks e componentes específicos de estética.

---

## 5. Proposta de Reorganização

### 5.1 Camada de Navegação

**Estado atual:** `Prontuario.tsx` (1566 linhas) com lógica condicional por especialidade inline.

**Proposta:** Extrair um `EsteticaProntuarioLayout` que receba `patientId`, `clinicId`, `appointmentId` e gerencie internamente as abas de estética. O `Prontuario.tsx` apenas delegaria:

```tsx
if (activeSpecialtyKey === 'estetica') {
  return <EsteticaProntuarioLayout {...commonProps} />;
}
```

### 5.2 Camada de Definição Estrutural

**Estado atual:** Duas fontes de definição (código TS e banco) sem sincronização.

**Proposta:**  
- **Fonte de verdade:** código TypeScript (manter `ADVANCED_TEMPLATE_MAP`) para templates de sistema
- **Banco:** usar apenas como índice/metadados para o seletor
- **Futuro:** migrar para banco quando houver necessidade de customização por clínica
- **Aposentar:** templates legados de `anamneseTemplates.ts` (7 templates com `CampoAnamnese`)

### 5.3 Camada de Renderização

**Estado atual:** `AnamneseFieldRenderer` (legado) + `DynamicAnamneseRenderer` (dinâmico) + formulários hardcoded.

**Proposta:**
- Unificar em um único renderer baseado em `DynamicField`
- Manter os componentes especializados (`VisualOptionCardGrid`, `BMICalculator`, etc.) como primitivos
- Eliminar `AnamneseFieldRenderer` legado
- Converter `AvaliacaoEsteticaBlock` em template dinâmico

### 5.4 Camada de Persistência

**Estado atual:** `clinical_evolutions` (legacy) + `anamnesis_records` (dinâmico).

**Proposta:**
- **Padronizar em `anamnesis_records`** para toda anamnese de estética
- Migrar dados legacy de `clinical_evolutions` para `anamnesis_records` (ou manter read-only para histórico)
- Unificar o hook em um único `useDynamicAnamneseEstetica` para todos os templates

### 5.5 Organização por Subdomínio

```
src/components/prontuario/aesthetics/
├── layout/
│   └── EsteticaProntuarioLayout.tsx
├── anamnese/
│   ├── DynamicAnamneseRenderer.tsx
│   ├── AnamneseEsteticaBlock.tsx (unificado)
│   └── fields/           (componentes de campo)
├── avaliacao/
│   └── AvaliacaoEsteticaBlock.tsx (futuro: template dinâmico)
├── mapa-facial/
│   ├── FacialMapModule.tsx
│   ├── FacialMapSVG.tsx
│   ├── ApplicationPointDialog.tsx
│   ├── MuscleList.tsx
│   └── SessionHistoryPanel.tsx
├── midia/
│   ├── BeforeAfterModule.tsx
│   └── BeforeAfterCompare.tsx
├── termos/
│   ├── ConsentModule.tsx
│   └── SignatureCanvas.tsx
├── produtos/
│   └── ProdutosUtilizadosBlock.tsx
├── overview/
│   └── VisaoGeralEsteticaBlock.tsx
├── evolucoes/
│   └── EvolucoesEsteticaBlock.tsx
├── alertas/
│   └── AlertasEsteticaBlock.tsx
├── timeline/
│   └── TimelineEsteticaBlock.tsx
└── types.ts
```

---

## 6. Arquitetura-Alvo Recomendada

### 6.1 O que deve continuar genérico

- `useAnamnesisTemplatesV2` — busca de templates do banco (seletor)
- `anamnesis_records` — tabela de persistência
- `DynamicAnamneseRenderer` — renderizador de campos (com os tipos `DynamicField`)
- Componentes de campo (`VisualOptionCardGrid`, `BMICalculator`, etc.)
- `Prontuario.tsx` — apenas como roteador de especialidade

### 6.2 O que deve virar componente especializado

- `AnamneseEsteticaBlock` — único bloco de anamnese para estética (sem separação legacy/dinâmico)
- `AvaliacaoEsteticaBlock` — converter para usar `DynamicField[]` em vez de formulário hardcoded

### 6.3 O que deve virar submódulo independente

- Mapa Facial (já é independente, manter)
- Before/After (já é independente, manter)
- Termos de Consentimento (já é independente, manter)

### 6.4 Organização dos modelos de anamnese

| Template | Key no ADVANCED_TEMPLATE_MAP | Status |
|---|---|---|
| Anamnese Estética Facial | `anamnese_estetica_facial` | ✅ Implementado |
| Anamnese Pele e Avaliação | `anamnese_pele_avaliacao` | ✅ Implementado |
| Anamnese Capilar | `anamnese_capilar` | ✅ Implementado |
| Anamnese Corporal | `anamnese_corporal_avancada` | ✅ Implementado |
| Anamnese Geral Estética | `anamnese_geral_estetica` | ❌ Legacy local |
| Plano de Toxina | `anamnese_toxina` | ❌ Legacy local |
| Plano de Preenchimento | `anamnese_preenchimento` | ❌ Legacy local |
| Plano de Bioestimulador | `anamnese_bioestimulador` | ❌ Legacy local |
| Anamnese Skinbooster | `anamnese_skinbooster` | ❌ Legacy local |
| Anamnese Combinados | `anamnese_combinados` | ❌ Legacy local |

**Recomendação:** Converter os 7 templates legados para `DynamicField[]` no `ADVANCED_TEMPLATE_MAP` ou aposentá-los.

### 6.5 Compatibilidade com prontuário dinâmico

- O `AnamneseBlock.tsx` genérico NÃO deve importar nada de estética
- Remover imports de `ADVANCED_TEMPLATE_MAP`, `DynamicAnamneseRenderer` e `useDynamicAnamneseEstetica` do bloco genérico
- A renderização de templates avançados deve ser responsabilidade exclusiva do `AnamneseEsteticaBlock`
- O roteamento deve ocorrer no nível do `Prontuario.tsx` (se estética → `AnamneseEsteticaBlock`, senão → `AnamneseBlock`)

### 6.6 Proteção contra quebra de outras especialidades

- Nenhuma alteração em `AnamneseBlock.tsx` deve modificar o fluxo de templates de outras especialidades
- Os imports cruzados de estética no bloco genérico devem ser removidos APENAS após confirmar que a renderização é delegada corretamente

---

## 7. Contrato de Dados Recomendado

### 7.1 Estrutura de Template (código)

```typescript
interface DynamicField {
  id: string;                    // Identificador único do campo
  type: DynamicFieldType;        // Tipo de renderização
  label: string;                 // Label visível
  section?: string;              // Agrupamento por seção
  required?: boolean;            // Obrigatoriedade
  placeholder?: string;          // Placeholder do input
  options?: string[];            // Opções para radio/select
  config?: FieldConfig;          // Configuração estendida
}

interface FieldConfig {
  columns?: number;              // Colunas do grid
  selection?: 'single' | 'multiple';
  options?: VisualCardOption[];  // Opções visuais com imagem
  rows?: ClinicalTableRow[];    // Linhas de tabela clínica
  selects?: SelectGroup[];      // Grupo de selects inline
  sections?: MeasurementSection[]; // Seções de accordion
  unit?: string;
  min?: number;
  max?: number;
  autoCalculate?: string;
  placeholder?: string;
  accept?: string;
}
```

### 7.2 Persistência das Respostas

**Tabela:** `anamnesis_records`  
**Colunas relevantes:**

| Coluna | Uso |
|---|---|
| `template_id` | FK para `anamnesis_templates.id` |
| `template_version_id` | FK para versão específica |
| `responses` | JSONB com `Record<string, unknown>` — chave = `field.id`, valor = resposta |
| `structure_snapshot` | JSONB com cópia do `DynamicField[]` no momento do save (imutável) |
| `data` | JSONB redundante (mesmo conteúdo que `responses`) |
| `status` | `rascunho` / `assinado` |

### 7.3 Formatos concorrentes atuais

| Sistema | Tabela | Campo de conteúdo | Formato |
|---|---|---|---|
| Legacy | `clinical_evolutions` | `content` | `AnamneseEsteticaContent` (10 campos fixos) |
| Dinâmico | `anamnesis_records` | `responses` | `Record<string, unknown>` livre |

**Recomendação:** Sobreviver apenas o formato `anamnesis_records.responses` com `Record<string, unknown>`.

### 7.4 Placeholder de Imagem Visual

Padrão atual (correto, manter):
```typescript
{
  id: string;
  label: string;
  description?: string;
  image_placeholder_key: string;   // ex: 'estetica/fitzpatrick/tipo_1'
  image_url: string | null;        // null = placeholder, string = imagem real
  allow_future_upload?: boolean;
  display_order: number;
}
```

---

## 8. Plano de Refatoração em Etapas

### Fase 1: Auditoria e Estabilização
**Objetivo:** Garantir que tudo que funciona hoje continue funcionando.  
**Arquivos:** Todos os de estética  
**Ações:**
- Documentar quais templates do banco estão vinculados a `template_type` correto
- Verificar se os 4 templates avançados abrem e salvam corretamente
- Verificar se o legacy ainda funciona para registros antigos
- Adicionar testes manuais de smoke test

**Risco:** Baixo  
**Critério de aceite:** Nenhuma regressão; documento de status atualizado

### Fase 2: Desacoplar AnamneseBlock genérico da estética
**Objetivo:** Remover imports de estética do bloco genérico.  
**Arquivos:**
- `src/components/prontuario/clinica-geral/AnamneseBlock.tsx` — remover imports de estética
- `src/pages/app/Prontuario.tsx` — garantir que aba de anamnese estética use `AnamneseEsteticaBlock`

**Risco:** Médio — pode haver caminhos de navegação que passam pelo bloco genérico para estética  
**Dependências:** Fase 1 concluída  
**Critério de aceite:** `AnamneseBlock.tsx` não importa nenhum módulo de `aesthetics/`

### Fase 3: Unificar anamnese no AnamneseEsteticaBlock
**Objetivo:** Um único componente e hook para anamnese de estética.  
**Arquivos:**
- `src/components/prontuario/aesthetics/AnamneseEsteticaBlock.tsx` — simplificar
- `src/hooks/aesthetics/useAnamneseEsteticaData.ts` — avaliar aposentadoria para novos registros

**Ações:**
- Remover formulário legacy hardcoded do `AnamneseEsteticaBlock`
- Usar APENAS `useDynamicAnamneseEstetica` para novos registros
- Manter leitura read-only de registros legacy existentes em `clinical_evolutions`

**Risco:** Alto — registros antigos de pacientes podem ficar inacessíveis  
**Dependências:** Fase 2  
**Critério de aceite:** Novos registros sempre em `anamnesis_records`; legados exibidos read-only

### Fase 4: Converter Avaliação Estética em template dinâmico
**Objetivo:** Eliminar o formulário hardcoded de 534 linhas.  
**Arquivos:**
- `src/components/prontuario/aesthetics/AvaliacaoEsteticaBlock.tsx` — substituir por template
- `src/hooks/aesthetics/useAvaliacaoEsteticaData.ts` — aposentar para novos registros
- `src/hooks/prontuario/estetica/esteticaAdvancedTemplates.ts` — adicionar template

**Risco:** Alto — sobreposição com campos dos templates avançados  
**Dependências:** Fase 3  
**Critério de aceite:** Avaliação usa `DynamicAnamneseRenderer`; dados antigos preservados

### Fase 5: Migrar templates legados para DynamicField
**Objetivo:** Converter 7 templates de `CampoAnamnese` para `DynamicField`.  
**Arquivos:**
- `src/hooks/prontuario/estetica/anamneseTemplates.ts` — reescrever como `DynamicField[]`
- `src/hooks/prontuario/estetica/esteticaAdvancedTemplates.ts` — incorporar

**Risco:** Médio  
**Dependências:** Fase 3  
**Critério de aceite:** Tipo `CampoAnamnese` não é mais usado para estética

### Fase 6: Reorganizar diretório e eliminar legados
**Objetivo:** Estrutura de pastas por subdomínio.  
**Ações:**
- Mover arquivos para subdiretórios (layout, anamnese, mapa-facial, etc.)
- Remover `AnamneseFieldRenderer` dos fluxos de estética
- Remover `AnamneseTemplateSelectorDialog` se redundante
- Atualizar imports

**Risco:** Baixo (apenas reorganização de arquivos)  
**Dependências:** Fases 3-5  
**Critério de aceite:** Nenhum arquivo de estética na raiz de `aesthetics/` exceto `types.ts` e `index.ts`

### Fase 7: Implementar rich_text real
**Objetivo:** Substituir textarea por editor rico nos campos `rich_text`.  
**Risco:** Baixo  
**Dependências:** Fase 3  
**Critério de aceite:** Campos `rich_text` renderizam com toolbar de formatação

---

## 9. Riscos e Cuidados

| Risco | Severidade | Mitigação |
|---|---|---|
| Quebrar renderização de anamnese ao remover imports do bloco genérico | Alta | Verificar TODOS os caminhos que levam ao `AnamneseBlock` para estética antes de remover |
| Quebrar autosave dos templates dinâmicos | Alta | Manter debounce de 3s e testar com dados reais |
| Perder registros legacy de `clinical_evolutions` | Crítica | NUNCA deletar dados; manter leitura read-only |
| Duplicar dados entre tabelas | Média | Garantir que novos registros usem APENAS `anamnesis_records` |
| Perder vínculo template→versão | Alta | Testar `current_version_id` antes e depois de refatorar |
| Afetar outras especialidades | Alta | Isolar TODOS os imports de estética; nenhum módulo genérico deve depender de código de estética |
| Afetar atendimento em andamento | Crítica | Não alterar estrutura de dados durante atendimento ativo; migrar apenas registros concluídos |
| Quebrar PDF consolidado | Média | Testar `useConsolidatedFillerPdf` após mudanças na estrutura de dados |

---

## 10. Recomendação Final

### O que fazer PRIMEIRO
1. **Fase 2 — Desacoplar `AnamneseBlock` genérico da estética.** Esse é o maior foco de fragilidade hoje. O bloco genérico não deveria conhecer estética.
2. **Fase 1 — Auditar templates do banco.** Confirmar que os 4 templates avançados estão com `template_type` correto e `current_version_id` preenchido.

### O que NÃO deve mais ser feito
- **Não criar mais templates usando `CampoAnamnese`.** Esse tipo está obsoleto.
- **Não adicionar mais lógica no `AnamneseEsteticaBlock` sem antes simplificá-lo.** O arquivo tem 717 linhas com dois sistemas inteiros dentro.
- **Não adicionar campos hardcoded na `AvaliacaoEsteticaBlock`.** Ela precisa ser convertida em template dinâmico.

### O que deve ser CONGELADO até reorganizar
- **Formulário legacy de anamnese** — não adicionar campos; apenas manter para leitura
- **Avaliação Estética hardcoded** — não expandir; planejar migração
- **Imports de estética no `AnamneseBlock.tsx` genérico** — não adicionar mais; planejar remoção

### Ordem ideal
1. Auditar e estabilizar (Fase 1)
2. Desacoplar bloco genérico (Fase 2)
3. Unificar anamnese (Fase 3)
4. Converter avaliação (Fase 4)
5. Migrar templates legados (Fase 5)
6. Reorganizar diretório (Fase 6)
7. Rich text real (Fase 7)

**Estimativa de impacto:** A reorganização completa toca ~25 arquivos mas pode ser feita de forma incremental sem breaking changes, desde que cada fase seja validada antes de prosseguir.

---

*Este documento serve como blueprint para a refatoração do prontuário de estética. Nenhuma alteração destrutiva deve ser feita sem validar cada fase individualmente.*
