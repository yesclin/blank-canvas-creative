## Plano de correção

1. **Definir o catálogo oficial de Estética como fonte única**
   - Usar os modelos corretos da especialidade Estética/Harmonização Facial, não os modelos genéricos/antigos com `template_type = anamnese`.
   - Padronizar a lista oficial no sistema:
     - Anamnese Estética Facial - YesClin
     - Anamnese Pele e Avaliação Facial - YesClin
     - Anamnese Capilar - YesClin
     - Anamnese Corporal - YesClin
     - Plano de Toxina Botulínica
     - Plano de Preenchimento com Ácido Hialurônico
     - Plano de Bioestimulador
     - Anamnese Skinbooster
     - Anamnese de Combinados

2. **Corrigir os dados da clínica de Estética**
   - Criar/reativar os modelos oficiais para a especialidade Estética da clínica.
   - Garantir que cada modelo tenha:
     - `is_system = true`
     - `system_locked = true`
     - `is_active = true`
     - `archived = false`
     - `specialty_id` correto da Estética
     - `template_type` correto e estável
     - versão atual com estrutura válida
   - Desativar/arquivar os modelos antigos incorretos somente se forem duplicados legados e não forem os oficiais.

3. **Blindar para nunca sumirem novamente**
   - Ajustar a função de reset/restauração para nunca arquivar modelos oficiais do sistema.
   - Reforçar trigger de proteção para impedir que modelos oficiais sejam arquivados ou desativados.
   - Garantir que a restauração automática recupere modelos oficiais por especialidade.

4. **Corrigir a listagem no prontuário**
   - Fazer a aba de Anamnese Estética listar somente modelos da especialidade atual.
   - Priorizar modelos oficiais e esconder legados incorretos/duplicados quando existirem.
   - Se por algum motivo a lista vier vazia, mostrar ação de restauração dos modelos oficiais.

5. **Validar**
   - Conferir no banco se Estética mostra os modelos oficiais corretos.
   - Conferir se Nutrição e outras especialidades continuam mostrando apenas seus próprios modelos.
   - Testar o reset/restauração para confirmar que os modelos oficiais não somem mais.
   - Reabrir o prontuário atual e verificar se a lista aparece fixa e correta.