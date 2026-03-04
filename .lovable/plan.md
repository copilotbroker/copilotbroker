

## Análise Completa do Painel "Copiloto" (`/admin/copiloto`)

### Problemas Identificados

**1. Botão "Sincronizar Status" não existe nesta página**
O botão foi adicionado em `AdminWhatsApp.tsx` (rota `/admin/whatsapp`), mas essa rota faz redirect para `/admin/copiloto` (que usa `AdminCopilotConfig.tsx`). O usuário nunca vê o `AdminWhatsApp` — é código morto.

**2. Grupo "Inteligência" aparece vazio na barra de abas**
O `TAB_GROUPS` tem um grupo "Inteligência" com array de tabs vazio (copilot está comentado). Isso renderiza o label "Inteligência" + o separador vertical sem nenhum botão clicável — são os "botões inativos" que o usuário vê.

**3. Tab padrão é "copilot" mas não existe conteúdo**
`useState("copilot")` é o estado inicial, mas não há `TabsContent value="copilot"`. O usuário abre a página e não vê nada até clicar em outra aba.

**4. Visão Global não sincroniza status automaticamente**
A aba "Visão Global" lê `broker_whatsapp_instances` direto do banco sem verificar o status real na UAZAPI.

### Plano de Correção

**A. Limpar TAB_GROUPS — remover grupo "Inteligência" vazio**
- Remover o grupo com array vazio do `TAB_GROUPS`
- Manter apenas o grupo "WhatsApp" com suas 7 abas

**B. Corrigir tab padrão para "overview"**
- `useState("overview")` em vez de `useState("copilot")`

**C. Adicionar auto-sync ao abrir "Visão Global"**
- Mover a lógica `syncAllMutation` de `AdminWhatsApp.tsx` para `AdminCopilotConfig.tsx`
- Disparar sync automaticamente quando `activeTab === "overview"` (via `useEffect`)
- Adicionar botão "Sincronizar Status" visível no header da página

**D. Remover página morta `AdminWhatsApp.tsx`**
- A rota `/admin/whatsapp` já redireciona para `/admin/copiloto`
- Remover o import e a referência no `App.tsx` (limpeza)

### Arquivos Alterados
- `src/pages/AdminCopilotConfig.tsx` — correções A, B, C
- `src/App.tsx` — limpeza D (remover import de AdminWhatsApp)
- `src/pages/AdminWhatsApp.tsx` — pode ser deletado (código morto)

