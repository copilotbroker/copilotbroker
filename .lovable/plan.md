

# Fix: Roleta WhatsApp Global → Aba "Novos" da Inbox

## Problema identificado

Três problemas trabalham juntos para impedir o funcionamento:

1. **`conversations.broker_id` é `NOT NULL`** — o webhook sempre precisa atribuir um broker, impossibilitando o filtro `broker_id IS NULL`
2. **O webhook cria o lead imediatamente** via `createGlobalLead()` — mas o design exige que o lead só seja criado ao clicar "Iniciar Atendimento"
3. **As RLS policies de "Novos"** checam `broker_id IS NULL`, que nunca acontece

## Solução

Usar um campo de status na conversa para distinguir "pendente de claim" de "já atendida", em vez de depender de `broker_id IS NULL`.

### Mudanças

#### 1. Migration SQL
- Adicionar coluna `attendance_started` (boolean, default false) à tabela `conversations`
- Atualizar as RLS policies de "Novos" para usar `source_instance = 'global' AND attendance_started = false` em vez de `broker_id IS NULL`
- Permitir que corretores em roletas whatsapp_global vejam e atualizem essas conversas

```sql
ALTER TABLE public.conversations ADD COLUMN attendance_started boolean NOT NULL DEFAULT false;

-- Drop old policies that check broker_id IS NULL
DROP POLICY IF EXISTS "Corretores veem conversas globais nao atribuidas" ON public.conversations;
DROP POLICY IF EXISTS "Corretores podem assumir conversas globais" ON public.conversations;

-- New: corretores em roleta global veem conversas pendentes
CREATE POLICY "Corretores veem conversas globais pendentes"
ON public.conversations FOR SELECT TO authenticated
USING (
  source_instance = 'global' 
  AND attendance_started = false 
  AND EXISTS (
    SELECT 1 FROM roletas_membros rm
    JOIN roletas r ON r.id = rm.roleta_id
    WHERE rm.corretor_id = get_my_broker_id()
      AND rm.ativo = true AND r.ativa = true
      AND r.tipo_origem = 'whatsapp_global'
  )
);

-- New: corretores podem assumir (update attendance_started)
CREATE POLICY "Corretores podem assumir conversas globais"
ON public.conversations FOR UPDATE TO authenticated
USING (
  source_instance = 'global'
  AND attendance_started = false
  AND EXISTS (
    SELECT 1 FROM roletas_membros rm
    JOIN roletas r ON r.id = rm.roleta_id
    WHERE rm.corretor_id = get_my_broker_id()
      AND rm.ativo = true AND r.ativa = true
      AND r.tipo_origem = 'whatsapp_global'
  )
);
```

#### 2. Webhook `whatsapp-webhook/index.ts` — `handleGlobalInstanceMessage`
- **Remover** a criação imediata de lead (`createGlobalLead`) para contatos novos (Case B)
- Ao distribuir via roleta, apenas criar a conversa com `source_instance = 'global'` e `attendance_started = false`, sem `lead_id`
- Manter Case A (lead já tem broker) inalterado

#### 3. Frontend `use-conversations.ts`
- Alterar filtro da aba "Novos": de `broker_id IS NULL` para `source_instance = 'global' AND attendance_started = false`

```typescript
if (options.inboxTab === "novos") {
  query = query.eq("source_instance", "global").eq("attendance_started", false);
}
```

#### 4. `BrokerInbox.tsx` — `handleStartAttendance`
- Ao clicar "Iniciar Atendimento":
  1. Atualizar `conversations.attendance_started = true` e `broker_id = meuBrokerId`
  2. Criar lead no CRM (como já faz)
  3. Vincular `lead_id` na conversa
  4. Mover para aba "Meus"

#### 5. `AdminInbox.tsx` — mesma lógica

#### 6. Deploy da Edge Function `whatsapp-webhook`
- Fazer redeploy para que o código atualizado (com `source_instance = 'global'`) esteja ativo

## Arquivos alterados

| Arquivo | Alteração |
|---|---|
| Migration SQL | Coluna `attendance_started`, novas RLS policies |
| `supabase/functions/whatsapp-webhook/index.ts` | Remover criação de lead no Case B, manter `source_instance` |
| `src/hooks/use-conversations.ts` | Filtro "Novos" usa `attendance_started = false` |
| `src/pages/BrokerInbox.tsx` | `handleStartAttendance` seta `attendance_started = true` |
| `src/pages/AdminInbox.tsx` | Mesma lógica |

