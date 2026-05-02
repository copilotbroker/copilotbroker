## Objetivo

1. **Checkout automático só em dias úteis**: o job de checkout automático da roleta deve pular sábados e domingos (UTC-3).
2. **Alerta de roleta vazia**: quando um lead chega via roleta e não há nenhum corretor online, o fluxo atual (fallback para o líder) é mantido, mas líderes, admins e gerentes recebem uma notificação clara — tanto na tela de Roletas quanto no Inbox/Plantão Global — informando que aquela roleta está vazia e que o lead foi atribuído ao líder por fallback.

---

## Parte 1 — Auto-checkout só em dias úteis

### Mudança técnica (Edge function `roleta-auto-checkout`)

No início do handler, calcular o dia da semana em UTC-3 e abortar cedo se for sábado (6) ou domingo (0):

```ts
function isWeekendUTC3(): boolean {
  const d = new Date(Date.now() - 3 * 60 * 60 * 1000);
  const dow = d.getUTCDay(); // 0 = Sun, 6 = Sat
  return dow === 0 || dow === 6;
}

if (isWeekendUTC3()) {
  return new Response(
    JSON.stringify({ ok: true, skipped: "weekend", target_utc3: nowHHMM_UTC3() }),
    { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 },
  );
}
```

O cron continua rodando a cada minuto; nos fins de semana ele simplesmente retorna sem fazer nada. Idempotente, sem side effects.

### UI (`RoletaManagement.tsx`)

No bloco do toggle "Checkout automático", atualizar o texto de apoio:

> "Todos os corretores online nesta roleta receberão checkout automático neste horário (fuso UTC-3). **Não executa aos sábados e domingos.**"

Sem novos campos no banco — comportamento fixo.

---

## Parte 2 — Notificar líderes/admins quando a roleta estiver vazia

Mantém o fluxo atual: o lead continua sendo atribuído imediatamente ao líder via `fallback_lider`. Adicionamos camadas de visibilidade.

### 2.1 Marcação no banco

Para conseguir filtrar/destacar esses casos sem mudar a lógica de atribuição, usamos o que já existe:

- `leads.status_distribuicao = 'fallback_lider'`
- `leads.motivo_atribuicao = 'Nenhum corretor online - atribuído ao líder'`

Adicionar um campo extra na conversa criada para esse lead (quando aplicável) para destacá-la na UI:

- Migration: `ALTER TABLE conversations ADD COLUMN roleta_vazia_flag boolean NOT NULL DEFAULT false;`

E na edge `roleta-distribuir`, quando `statusDistribuicao === 'fallback_lider'`, marcar a conversa correspondente (se existir) com `roleta_vazia_flag = true`. Para leads novos sem conversa ainda, o webhook que cria a conversa pode herdar essa flag a partir do lead.

### 2.2 Notificação push (tabela `notifications`)

Na edge `roleta-distribuir`, quando cair no `fallback_lider`, inserir notificações para:

- O próprio líder (`roleta.lider_id`)
- Todos os usuários da organização com role `admin`, `manager` ou `super_admin`

Conteúdo:
- `title`: "Roleta vazia: lead atribuído ao líder"
- `body`: "Lead {nome} chegou na roleta {nome_roleta} sem corretores online. Atribuído ao líder por fallback."
- `lead_id`: id do lead
- `type`: `roleta_vazia`

Reaproveitar o padrão existente do `notify-new-lead` / hook `use-notifications`.

### 2.3 Painel "Roletas vazias" na tela de gestão (`RoletaManagement.tsx`)

Adicionar, no topo da página (acima da lista de roletas), um banner condicional:

- Query: leads das últimas 24h com `status_distribuicao = 'fallback_lider'` E `motivo_atribuicao` indicando "Nenhum corretor online", agrupados por roleta.
- Renderiza: "⚠️ N leads das últimas 24h caíram no fallback de líder por roleta vazia" com lista colapsável (lead, roleta, horário, líder atribuído) e botão "Ver no Inbox".
- Visível apenas para admin/manager/super_admin (já é a tela `/admin/...`).

### 2.4 Destaque no Inbox/Plantão Global

No `ConversationList.tsx` / `AdminInbox`, quando uma conversa tiver `roleta_vazia_flag = true` E o atendimento ainda não tiver sido iniciado (`attendance_started = false`):

- Badge roxo/amarelo no card: "Roleta vazia"
- Texto auxiliar: "Sem corretores online — atribuído ao líder {nome}"
- Botão "Assumir atendimento" continua disponível para admins/líderes/managers (já existe via fluxo de claim/transferência).

Quando qualquer corretor (incluindo o líder) iniciar o atendimento, a flag é limpa via trigger ou no próprio fluxo de claim.

---

## Arquivos afetados

- **Editado**: `supabase/functions/roleta-auto-checkout/index.ts` — guard de fim de semana.
- **Editado**: `supabase/functions/roleta-distribuir/index.ts` — marcar `roleta_vazia_flag` e disparar `notifications` no fallback.
- **Nova migration**: adiciona `conversations.roleta_vazia_flag boolean default false`.
- **Editado**: `src/components/admin/RoletaManagement.tsx` — texto do auto-checkout + banner de "roletas vazias últimas 24h".
- **Editado**: `src/components/inbox/ConversationList.tsx` (e/ou painel da conversa) — badge "Roleta vazia".
- **Editado**: `src/types/roleta.ts` / tipos de conversation se necessário.

---

## Observações

- Fluxo de atribuição **não muda**: lead segue indo para o líder imediatamente. Apenas adicionamos visibilidade.
- A flag `roleta_vazia_flag` é pontual da conversa, não muda RLS — admins/líderes/managers já têm acesso supervisório via políticas existentes.
- O auto-checkout no fim de semana é completamente skip — não loga, não atualiza nada, mantém idempotência.
- Não há feriados configuráveis nesta versão (apenas sábado/domingo).
