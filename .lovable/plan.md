## Diagnóstico

Investiguei diretamente o banco e os 3 casos do print:

| Conversa | Mensagens gravadas |
|---|---|
| Norton | 4 mensagens (incluindo "Cara, eu tô procurando um apartamento…") |
| Romalda Schneck | 3 mensagens (rua, cidade, CEP) |
| @Vini_daniel_45 | 1 mensagem com texto literal `[Undecryptable] Não foi possível descriptografar…` |

**As mensagens não estão sendo perdidas.** O webhook está capturando e gravando todas em `conversation_messages`. Os dois sintomas têm causas distintas:

### Causa 1 — "Nenhuma mensagem ainda" ao abrir conversas do Plantão (BUG REAL)

A conversa do Plantão é criada com `broker_id` = líder da roleta (placeholder). Os corretores membros da roleta veem a conversa na lista graças à policy:

```
"Corretores veem conversas globais pendentes"
  source_instance='global' AND attendance_started=false
  AND EXISTS (membro ativo da roleta global)
```

Mas a tabela `conversation_messages` **só tem** estas policies de SELECT:
- `broker_id = get_my_broker_id()` (a conversa é do placeholder, não do corretor)
- admin / líder / time

Resultado: o corretor da roleta consegue ver o **preview** (que vive em `conversations.last_message_preview`) mas não consegue ler `conversation_messages` → tela mostra "Nenhuma mensagem ainda" mesmo com mensagens gravadas.

### Causa 2 — `[Undecryptable] Não foi possível descriptografar…`

Esse texto **não é nosso fallback**. É o próprio aparelho do remetente que falhou ao descriptografar a sessão E2EE com o servidor do WhatsApp e enviou esse texto literal. Não temos a mensagem original — nem o WhatsApp tem. Mas podemos:
- Mostrar um aviso amigável na UI ("Mensagem criptografada não pôde ser lida pelo WhatsApp do remetente — peça para ele reenviar")
- Tentar um re-fetch via UAZAPI `/message/find` quando recebemos esse marcador, caso o remetente já tenha reenviado com a sessão renovada

## Plano de correção

### 1. Migration de RLS (resolve "Nenhuma mensagem ainda")

Adicionar duas policies de SELECT em `conversation_messages` espelhando as de `conversations`:

```sql
-- Corretores membros da roleta global veem mensagens de conversas pendentes
CREATE POLICY "Corretores veem mensagens de plantão pendentes"
ON public.conversation_messages FOR SELECT
USING (
  conversation_id IN (
    SELECT c.id FROM conversations c
    WHERE c.source_instance = 'global'
      AND c.attendance_started = false
      AND EXISTS (
        SELECT 1 FROM roletas_membros rm
        JOIN roletas r ON r.id = rm.roleta_id
        WHERE rm.corretor_id = get_my_broker_id()
          AND rm.ativo = true
          AND r.ativa = true
          AND (r.tipo_origem = 'whatsapp_global'
               OR r.escopo_empreendimentos = 'todas_landing_pages_e_plantao')
      )
  )
);

-- Líderes veem mensagens de conversas dos corretores do time (via app_role)
CREATE POLICY "Lideres role veem mensagens da equipe"
ON public.conversation_messages FOR SELECT
USING (
  has_role(auth.uid(), 'leader'::app_role)
  AND conversation_id IN (
    SELECT c.id FROM conversations c
    JOIN brokers b ON b.id = c.broker_id
    WHERE b.lider_id = get_my_broker_id()
  )
);
```

### 2. UI — tratamento de mensagens não-descriptografadas

`src/components/inbox/ConversationThread.tsx`:
- Detectar conteúdo iniciando com `[Undecryptable]` e renderizar com ícone de cadeado, cor âmbar e texto: "O WhatsApp do remetente não conseguiu descriptografar esta mensagem. Peça para ele reenviar."
- Mesmo tratamento na lista (`ConversationList.tsx`): mostrar `🔒 Mensagem não descriptografada` em vez do texto bruto.

### 3. Webhook — robustecer captura

`supabase/functions/whatsapp-webhook/index.ts`:
- Ampliar `msg.text` fallback para também ler `payload.message.content.text`, `content.conversation`, `content.extendedTextMessage.text`, `content.buttonsResponseMessage.selectedDisplayText`, `content.listResponseMessage.title`, `content.templateButtonReplyMessage.selectedDisplayText`, `content.reactionMessage.text` e `data.text` — alguns formatos UAZAPI v2 colocam o texto fora de `msg.text`.
- Quando `msg.text` começar com `[Undecryptable]`, gravar `metadata.undecryptable = true` para a UI estilizar.
- Não bloquear gravação por falta de `instanceName` quando temos `overrideBrokerId` (já tratado, mas confirmar).
- Acrescentar log mais verboso quando `messageText` ficar vazio mas `mediaMetadata` também — hoje vira `"document"` silenciosamente.

### 4. Verificação pós-deploy

- Abrir como corretor membro da roleta a conversa do Norton → devem aparecer as 4 mensagens.
- Abrir a do @Vini_daniel_45 → deve aparecer o aviso amigável de mensagem criptografada.

## Arquivos afetados

- `supabase/migrations/<novo>.sql` (policies)
- `supabase/functions/whatsapp-webhook/index.ts` (extração de texto + flag undecryptable)
- `src/components/inbox/ConversationThread.tsx` (renderização especial)
- `src/components/inbox/ConversationList.tsx` (preview especial)
