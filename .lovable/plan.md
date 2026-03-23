

# Fix: Normalizar telefone ao criar lead pela Inbox

## Problema

Sim, **gera problemas reais**. O telefone da conversa vem no formato E.164 com `+` (ex: `+5551999998888`), mas as landing pages e o cadastro manual salvam apenas os dígitos (ex: `5551999998888`). Isso causa:

1. **Unificação falha**: A função `unify_lead` compara `whatsapp = whatsapp` (match exato). `+5551999998888` ≠ `5551999998888` → duplicatas no banco.
2. **Campanhas duplicadas**: O lead pode receber cadências duplicadas por ter dois registros.
3. **Inconsistência visual**: O mesmo contato aparece como dois leads diferentes no Kanban.

## Correção

### Arquivos: `src/pages/BrokerInbox.tsx` e `src/pages/AdminInbox.tsx`

Nos dois `handleLeadCreated`, normalizar o telefone removendo o `+` antes de inserir:

```typescript
whatsapp: selectedConversation.phone.replace(/^\+/, ''),
```

Isso garante que o formato salvo no banco seja sempre `5551999998888` (só dígitos), consistente com todas as outras fontes de lead. As automações já usam `formatPhoneE164()` que adiciona o `+` quando necessário para envio.

Alteração mínima: uma linha em cada arquivo (linha 171 do BrokerInbox, linha 170 do AdminInbox).

