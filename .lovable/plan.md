# Plano de Refatoração — `src/pages/app/Prontuario.tsx`

Arquivo atual: **2544 linhas**, ~60 hooks invocados, ~30 imports de ícones, mapeamentos enormes, `renderTabContent` com switch gigante (linhas 1169–2200) e toolbar/header/sidebar inline.

Premissas inegociáveis:
- Zero mudança de comportamento, rotas, queries, regras de negócio, banco.
- Apenas extração (mover código existente). Sem reescrita lógica.
- Etapas pequenas, cada uma compilável e testável isoladamente.

---

## Estrutura alvo

```text
src/pages/app/Prontuario.tsx                      (~250 linhas — orquestrador)
src/pages/app/prontuario/
  constants/
    iconMap.ts                  ICON_MAP
    tabKeyMap.ts                TAB_KEY_MAP
    defaultNavItems.ts          DEFAULT_NAV_ITEMS
  hooks/
    useProntuarioContext.ts     patientId, searchParams, navigate, queryClient, params
    useProntuarioData.ts        agrega patient, clinic, specialty, config, permissions
    useProntuarioSessions.ts    activeAppointment, globalActive, finalize, bar state
    useProntuarioTabsData.ts    todos os hooks "useXxxData" por aba (agrupa ~30 hooks)
    useProntuarioNavigation.ts  navItems, urlTab, activeTab, handleTabChange, handleNavigateToTab
    useProntuarioSearch.ts      searchFocus, handleSearchResultClick, clearSearchFocus, contextValue
    useProntuarioPermissions.ts canViewTab/canEditTab/canExportTab/canSignTab/canPerformAction + flags derivadas
  components/
    ProntuarioHeader.tsx        topo: voltar, paciente, badges, ações (print/export/settings)
    ProntuarioSidebar.tsx       ProntuarioTabNav + grouping
    ProntuarioActiveSessionBar.tsx
    ProntuarioDialogs.tsx       consentDialog + signatureDialog
    ProntuarioTabContent.tsx    switch grande extraído de renderTabContent
    tabs/                       (opcional fase 2) cada case do switch como sub-componente
      ResumoTab.tsx, AnamneseTab.tsx, EvolucaoTab.tsx, ...
```

---

## Etapas (cada uma é um commit lógico)

**Etapa 1 — Constantes puras** (risco zero)
- Mover `ICON_MAP` → `constants/iconMap.ts`
- Mover `TAB_KEY_MAP` → `constants/tabKeyMap.ts`
- Mover `DEFAULT_NAV_ITEMS` → `constants/defaultNavItems.ts`
- Limpar imports de ícones no `Prontuario.tsx` (passam a viver no iconMap).
- **Verificação:** build.

**Etapa 2 — Header / ActiveSessionBar / Dialogs (UI sem lógica)**
- `ProntuarioHeader.tsx`: recebe props (paciente, ações, flags). Move o JSX de cabeçalho.
- `ProntuarioActiveSessionBar.tsx`: recebe `appointmentId`, `startedAt`, `onFinalize`, `shouldShow`.
- `ProntuarioDialogs.tsx`: `ConsentDialog` + `SignatureDialog`, props controladas.
- **Verificação:** build + smoke visual no preview.

**Etapa 3 — Hook `useProntuarioPermissions`**
- Extrai `canViewTab`, `canEditTab`, `canExportTab`, `canSignTab`, `canPerformAction`, `getStandardTabKey`, `canEditCurrentTab`, `canExportCurrentTab`, `canSignCurrentTab`.
- Sem alterar lógica; só relocaliza.

**Etapa 4 — Hook `useProntuarioNavigation`**
- Move `navItems` (useMemo), `defaultNavLookup`, `urlTab`, `activeTab`, `loadedTabs`, `shouldLoadTab`, `handleTabChange`, `handleNavigateToTab`.

**Etapa 5 — Hook `useProntuarioSearch`**
- Move `searchFocus`, `highlightedId`, `highlightTimeoutRef`, `handleSearchResultClick`, `clearSearchFocus`, `searchFocusContextValue`.

**Etapa 6 — Hook `useProntuarioSessions`**
- Move `useAutoPatientRedirect`, `useActiveAppointment*`, `globalActiveForCurrent`, `fallbackActiveSessionBar*`, `useFinalizeSession`, `handleFinalizeFromProntuario`.

**Etapa 7 — Hook `useProntuarioTabsData`**
- Agrupa os ~30 hooks de dados por aba (sessoesPsico, fisioVisaoGeral, consent data, etc.). Retorna objeto único consumido pelo `TabContent`.
- Cuidado: **manter ordem de hooks idêntica** (regras do React).

**Etapa 8 — `ProntuarioTabContent.tsx`**
- Move o `renderTabContent()` (switch case por `activeTab`) para componente próprio que recebe via props: `activeTab`, dados, permissões, handlers.
- Reduz ~1000 linhas do arquivo principal.

**Etapa 9 — Sidebar**
- `ProntuarioSidebar.tsx` envolvendo `ProntuarioTabNav` com agrupamento e filtros existentes.

**Etapa 10 — Limpeza final**
- `Prontuario.tsx` vira orquestrador: `ClinicalAccessGuard` + `ErrorBoundary` + `TooltipProvider` + composição dos componentes.
- Remover imports não usados.

---

## Garantias

- **Ordem dos hooks preservada** ao agrupar (cada hook agregador chama os internos na mesma sequência do original).
- **Nenhuma query/mutation alterada.**
- **Props drilling explícito** entre hooks → componentes (sem novo context global, exceto reuso do `searchFocusContextValue` já existente).
- Após cada etapa: rodar build, abrir a rota `/app/prontuario/:patientId` e validar abas críticas (resumo, anamnese, evolução).

---

## Fora de escopo

- Não fragmentar cada case do switch em arquivos individuais nesta passada (Etapa "fase 2" opcional, listada para futuro).
- Não tocar em componentes filhos (`ProntuarioTabNav`, blocos de cada especialidade).
- Não mexer em hooks de domínio (`useAnamnese`, `useEvolucao`, etc.).

Confirma este plano? Posso começar pela Etapa 1.