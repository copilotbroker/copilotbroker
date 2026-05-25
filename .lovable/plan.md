## Diagnóstico

Verifiquei no banco várias conversas em `source_instance='global'` ainda pendentes (`broker_id = NULL`, `attendance_started=false`) onde o lead claramente mandou mais de uma mensagem (vejo no app), mas só existe **uma única** mensagem em `conversation_messages` por conversa. Exemplos checados (51995199341, 51996769694, 51997357473): todas com 1 mensagem só.

A causa está no `supabase/functions/whatsapp-webhook/index.ts`:

1. Quando o lead manda a 1ª mensagem do plantão, `handleGlobalInstanceMessage` cria a conversa usando o líder como "placeholder" e arquiva a mensagem. Em seguida, `roleta-distribuir` roda; se cai em **disputa** (ou não há ninguém disponível), o `refine` zera `broker_id` da conversa (`update.broker_id = null`).
2. Na 2ª/3ª mensagem do mesmo lead, o handler encontra `existingConv` (pendente) e chama `archiveMessageToConversation(..., overrideBrokerId = existingConv.broker_id /* = null */, "global")`.
3. Dentro de `archiveMessageToConversation` o primeiro `if (!instanceName && !overrideBrokerId) return {};` corta tudo. Mesmo se passasse, `getOrCreateCanonicalConversation` filtra `.eq("broker_id", brokerId)` — `.eq("broker_id", null)` não casa com NULL no Postgres, então criaria conversa nova ou ignoraria.

Resultado: enquanto a conversa global estiver sem corretor (disputa), todas as mensagens novas do lead são silenciosamente descartadas. Só voltam a aparecer quando algum corretor assume e `broker_id` deixa de ser NULL — por isso a impressão de que "depois de iniciar atendimento" só as mensagens novas aparecem: as antigas nunca foram salvas.

## Correção (escopo único: webhook)

Editar `supabase/functions/whatsapp-webhook/index.ts`, na função `handleGlobalInstanceMessage`:

- **Quando achar `existingConv` pendente** (Case B1) **e quando achar `anyGlobalConv` atendida** (Case B2) **com `broker_id = NULL`**: não chamar `archiveMessageToConversation` (que exige broker). Em vez disso, fazer insert direto em `conversation_messages` usando `existingConv.id` / `anyGlobalConv.id`, e atualizar manualmente em `conversations` os campos `last_message_at`, `last_message_preview`, `last_message_direction`, `last_message_type`, `updated_at` (mesmo padrão usado em `archiveMessageToConversation`).
- Quando `broker_id` da conv existente **não** for nulo, manter o fluxo atual (continua passando por `archiveMessageToConversation`, que funciona porque tem broker).
- Manter a dedupe por `uazapi_message_id` igual ao bloco existente (consultar por `conversation_id + uazapi_message_id` antes de inserir, para o caso de reentrega de webhook).
- Preservar `enrichedMeta` com `source_instance: 'global'`, `sender_name`, `sent_by`, `status: 'delivered'`, `message_type`, etc., exatamente como hoje.

Não é necessário alterar RLS, frontend (`useConversationMessages`), nem `BrokerPlantao`/`AdminPlantao`: a leitura por `conversation_id` já funciona e a policy "Corretores veem mensagens de plantao pendentes" permite ler mensagens pendentes da global.

## Backfill / dados antigos

As mensagens já perdidas (não foram inseridas no banco) **não** podem ser recuperadas do nosso lado — só existem no histórico do WhatsApp. Após o deploy, novas mensagens em conversas globais pendentes passam a ser arquivadas corretamente.

## Arquivos afetados

- `supabase/functions/whatsapp-webhook/index.ts` (somente `handleGlobalInstanceMessage`, dentro dos blocos B1 e B2).

## Fora de escopo

- Mudar RLS, esquema de tabelas, hooks do frontend, lógica de roleta ou fluxo de "Iniciar atendimento".
- Migração para reprocessar histórico do WhatsApp.
