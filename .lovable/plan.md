

# Renomear "Automação" para "Follow-up" e ajustar fluxo de criação

## Resumo

Renomear a aba "Automação" para "Follow-up" em todos os locais (broker, admin, whatsapp). Ajustar textos internos para "Cadência de Follow-up" em vez de "Cadência 10D". Após o usuário criar/salvar uma cadência, exibir um diálogo perguntando se deseja ativar a sequência automaticamente ao receber um lead.

## Arquivos alterados

### 1. Renomear aba "Automação" → "Follow-up" (3 arquivos)

**`src/pages/BrokerCopilotConfig.tsx`** (linha 103-106)
- Trocar label "Automação" por "Follow-up"
- Trocar ícone `Bot` por `RotateCcw` ou manter `Bot`

**`src/pages/AdminCopilotConfig.tsx`** (linha 59)
- No `TAB_GROUPS`, trocar `{ id: "automation", label: "Automação", icon: Bot }` por `{ id: "automation", label: "Follow-up", icon: Bot }`

**`src/pages/BrokerWhatsApp.tsx`** (linha 119)
- Trocar label "Automação" por "Follow-up"

### 2. Ajustar textos internos da seção

**`src/components/whatsapp/AutoCadenciaSection.tsx`**
- Título: "Cadências automáticas" → "Cadências de Follow-up"
- Subtítulo: "Ative uma cadência automática ao receber leads" → "Configure sequências de follow-up para seus leads"
- Botão: "Nova Regra" → "Nova Cadência"
- Empty state: "Crie uma regra para ativar a Cadência 10D automaticamente" → "Crie uma cadência de follow-up para engajar seus leads"
- Botão empty: "Criar Primeira Regra" → "Criar Primeira Cadência"

**`src/components/whatsapp/AutoCadenciaRuleEditor.tsx`**
- Título: "Nova Regra de Cadência 10D" → "Nova Cadência de Follow-up"
- Descrição: "Configure as etapas da cadência automática" → "Configure as etapas do follow-up"
- Warning text: atualizar menção a "cadência 10D"
- Botão: "Criar Regra" → "Criar Cadência"

### 3. Diálogo pós-criação: "Ativar automaticamente?"

**`src/components/whatsapp/AutoCadenciaSection.tsx`**
- Adicionar estado `showAutoActivateDialog` + `lastCreatedRuleId`
- Após `createRule` retornar com sucesso, setar `showAutoActivateDialog = true`
- Renderizar um `AlertDialog` perguntando:
  - Título: "Ativar sequência automática?"
  - Descrição: "Deseja que esta cadência de follow-up seja ativada automaticamente quando um novo lead for atribuído a você?"
  - Botão "Sim, ativar" → chama `toggleRuleActive(ruleId, true)` e fecha
  - Botão "Não, depois" → fecha sem ativar
- A regra será criada com `is_active: false` por padrão, e só ativada se o usuário confirmar

**`src/components/whatsapp/AutoCadenciaRuleEditor.tsx`**
- Alterar `handleSubmit` para criar com `is_active: false` em vez de `true`
- Adicionar prop `onCreated?: (ruleId: string) => void` para notificar o pai após criação bem-sucedida

## Fluxo do usuário

1. Corretor vai em "Follow-up" (antigo "Automação")
2. Clica "Nova Cadência"
3. Preenche nome, empreendimento, etapas
4. Clica "Criar Cadência"
5. Cadência é salva (inativa)
6. Diálogo aparece: "Ativar automaticamente ao receber leads?"
7. Se "Sim" → regra fica ativa. Se "Não" → fica inativa, pode ativar depois pelo switch.

