## Unificação: lead criado imediatamente no Plantão + roleta única para LPs e WhatsApp

### Problema
Hoje os leads do **WhatsApp do Plantão** seguem um fluxo diferente das landing pages:
- Lead chega → cai na conversa "Novos" do Plantão → corretor da vez tem 10 min para clicar **"Iniciar Atendimento"** → só nesse momento o card é criado no Kanban.
- Existe uma roleta separada (`Plantão Enove`, tipo `whatsapp_global`) só para distribuir essas conversas, paralela à roleta `Sharks` (tipo `landing_page`).

Isso gera dois problemas:
1. Leads do Plantão **não aparecem no CRM/Kanban** até alguém aceitar — perde-se visibilidade, métricas e dados de origem (nome, ad referral, etc.).
2. Manter duas roletas separadas (Sharks + Plantão Enove) duplica configuração de membros, ordem, líder, timeout, etc.

### Solução
**Unificar o fluxo**: lead do WhatsApp do Plantão é criado **imediatamente** no Kanban (igual landing page), com origem `whatsapp_plantao`, e usa a **mesma roleta** das landing pages — basta a roleta ter um novo escopo que inclua "WhatsApp Global".

### Mudanças

**1. Banco de dados (migration)**
- Estender o domínio de `roletas.escopo_empreendimentos` para aceitar um terceiro valor: `'todas_landing_pages_e_plantao'` (catch-all que inclui institucionais + WhatsApp Global). Atualizar o CHECK constraint.
- Estender o índice parcial único (`idx_unique_roleta_todas_lps_ativa`) para também cobrir o novo valor — apenas **uma** roleta ativa pode ter escopo catch-all (qualquer das duas variantes).
- Permitir `tipo_origem = 'landing_page'` continuar como o tipo principal; o `escopo_empreendimentos` passa a ser o discriminador real de origem para roletas catch-all. Roletas com `tipo_origem = 'whatsapp_global'` continuam funcionando para retrocompatibilidade, mas a UI passa a recomendar a roleta unificada.

**2. Edge function `whatsapp-webhook` (`handleGlobalIncomingMessage` por volta da linha 1700-1955)**
Substituir o fluxo atual ("distribui conversa, cria lead só no Iniciar Atendimento") por:
- Quando chega mensagem global de phone novo:
  1. **Criar o lead imediatamente** com `source = 'whatsapp_global'`, `lead_origin = 'whatsapp_plantao'`, nome = `senderName || phone`, status = `'new'`.
  2. Inserir `lead_attribution` (landing_page = `whatsapp_global`, utm_source = `whatsapp`, utm_medium = `plantao`, e qualquer ad referral disponível via `extractAdReferralContext`).
  3. **Chamar a edge function `roleta-distribuir`** passando `lead_id` (e `project_id` opcional null). A função já sabe procurar roleta com escopo catch-all — basta estender a lógica para considerar `'todas_landing_pages_e_plantao'` quando o lead vem do plantão (sem `project_id`).
  4. Arquivar a mensagem na conversation com `broker_id` recebido da distribuição, `attendance_started: false` (igual hoje), `lead_id` já preenchido.
- Quando phone já tem lead/broker: comportamento atual permanece (rotear pra conversation existente).
- Remover a lógica embutida de round-robin/fila/disputa nesta função (vai ficar centralizada na `roleta-distribuir`).

**3. Edge function `roleta-distribuir`**
- Adicionar parâmetro opcional `source: 'landing_page' | 'whatsapp_global'` (default `landing_page`).
- Lógica de seleção de roleta:
  - Se `source = 'whatsapp_global'` (plantão): procurar roleta ativa com `escopo_empreendimentos = 'todas_landing_pages_e_plantao'` **ou** roleta legada com `tipo_origem = 'whatsapp_global'` (fallback retrocompat).
  - Se `source = 'landing_page'` (atual): mantém lógica atual (catch-all para institucional + vínculo explícito).
- Resto do fluxo (atribuição round-robin, timeout, notificação WhatsApp, criação de notification) continua igual e funciona para ambos.

**4. Edge function `roleta-timeout` (PART 2 — Global Conversations Timeout, linhas 329-470)**
- Atualizar a busca da `globalRoleta` para também aceitar a roleta unificada catch-all (`escopo_empreendimentos = 'todas_landing_pages_e_plantao'`), além da legada `tipo_origem = 'whatsapp_global'`.
- Como agora o lead já existe desde o início, também atualizar o `leads.broker_id` (não só `conversations.broker_id`) ao reassinar — para o card no Kanban acompanhar a transferência.

**5. UI `src/components/admin/RoletaManagement.tsx`**
- No formulário de Nova Roleta com `tipo_origem = 'landing_page'`, ajustar o `RadioGroup` de escopo para 3 opções:
  - ◯ **Todas as Landing Pages + WhatsApp do Plantão** *(recomendado — captura institucional + WhatsApp Global)*
  - ◯ **Todas as Landing Pages da Imobiliária** (catch-all só de LPs)
  - ◯ **Selecionar empreendimentos específicos**
- Mesma opção disponível na edição do card.
- Adicionar Badge "Todas LPs + Plantão" no header do card quando aplicável.
- Adicionar aviso na criação: se já existe roleta ativa com escopo catch-all (qualquer das duas variantes), bloquear criação de outra (já garantido pelo índice único, mas mostrar mensagem amigável).

**6. UI `src/pages/BrokerPlantao.tsx` e `src/pages/AdminPlantao.tsx`**
- `handleStartAttendance`: simplificar — o lead **já existe** desde a chegada da mensagem. A função apenas:
  - Atualiza `conversations.attendance_started = true` (continua disparando o trigger que limpa `reserva_expira_em`).
  - Atualiza `leads.status` para `'info_sent'` e `atendimento_iniciado_em`.
  - Insere `lead_interactions` (`atendimento_iniciado`).
  - Insere mensagem de sistema na thread.
- Remover toda a lógica de criar lead + `unify_lead` daqui (já feito no webhook).
- Visualmente, na aba "Novos" do Plantão, o card já tem nome do lead, origem e (se houver) ad referral — vai ficar mais rico.

**7. Hooks/Tipos**
- `src/types/roleta.ts`: ampliar `RoletaEscopoEmpreendimentos` para `'especifico' | 'todas_landing_pages' | 'todas_landing_pages_e_plantao'`.
- Sem mudanças em `use-roletas.ts`.

**8. Migração de dados**
- Atualizar a roleta `Sharks` existente para `escopo_empreendimentos = 'todas_landing_pages_e_plantao'` (passa a receber também os leads do Plantão).
- **Desativar** a roleta `Plantão Enove` (`ativa = false`) — sem deletar para preservar histórico em `roletas_log` e auditoria. O líder/admin pode arquivá-la depois.
- Os membros da Plantão Enove devem estar também em Sharks; se faltar algum, o admin precisa adicionar manualmente (avisar via toast/aviso visual antes de migrar).

### Comportamento esperado depois
- Lead chega no WhatsApp do Plantão → card aparece **imediatamente** no Kanban (status `new`, origem `whatsapp_plantao`).
- A roleta Sharks (única) atribui o lead a um corretor com round-robin/fila ou disputa.
- Corretor recebe notificação no Plantão e tem 10 min para clicar "Iniciar Atendimento" — agora apenas marca a conversa como atendida e move o card para "Info Enviada".
- Se ninguém atender em 10 min, o `roleta-timeout` reassina a conversa **e o lead** para o próximo corretor.
- Não existe mais necessidade de duas roletas separadas para o mesmo time.

### Observação
Roletas legadas com `tipo_origem = 'whatsapp_global'` continuam funcionando como fallback (a edge function aceita os dois caminhos), então a transição é não-destrutiva. A `Plantão Enove` fica desativada mas pode ser reativada se algo der errado.
