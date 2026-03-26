

# Redesign da Inbox — Multi-atendimento com abas Novos / Meus / Outros

## Conceito

Transformar a Inbox atual em um sistema de multi-atendimento com 3 abas principais que controlam a visibilidade das conversas, e um botão "Iniciar Atendimento" que vincula o lead ao corretor e cria o card no Kanban.

## Nova estrutura de abas

```text
┌─────────────────────────────────────┐
│  🟢 Novos (3)  │  Meus  │  Outros  │
├─────────────────────────────────────┤
│  [lista de conversas filtrada]      │
│  [busca + filtros existentes]       │
└─────────────────────────────────────┘
```

- **Novos**: Conversas da instância global (`source_instance = 'global'`) onde o lead ainda NÃO tem `broker_id` atribuído, ou tem `broker_id` mas o status do lead é `new` e nunca foi "iniciado atendimento". Essas são as conversas aguardando alguém assumir. Visível para todos os corretores que participam de uma roleta `whatsapp_global`.
- **Meus**: Conversas onde `broker_id = meu broker_id` (comportamento atual da inbox). Inclui tanto instância pessoal quanto global já assumida.
- **Outros**: Visível apenas para `leader` e `admin`. Mostra conversas de outros corretores da equipe (para líderes) ou de todos (para admins). Somente leitura / supervisão.

## Fluxo "Iniciar Atendimento"

Quando o corretor abre uma conversa da aba "Novos" e clica em **"Iniciar Atendimento"**:
1. O sistema atribui `broker_id` na conversa
2. Cria o lead no CRM (`lead_origin = 'whatsapp_plantao'`, `source = 'whatsapp_global'`)
3. Vincula `lead_id` na conversa
4. Chama `unify_lead` para deduplicar
5. A conversa sai de "Novos" e vai para "Meus"
6. Registra interação `status_change` no lead

## Mudanças por arquivo

### 1. `src/components/inbox/ConversationList.tsx`
- Adicionar prop `inboxTab: 'novos' | 'meus' | 'outros'`
- Renderizar as 3 abas no topo (acima da busca)
- Prop `onTabChange` para o parent controlar
- Na aba "Novos", mostrar contador de conversas pendentes
- Manter filtros/KPIs existentes funcionando dentro de cada aba

### 2. `src/components/inbox/ConversationThread.tsx`
- Adicionar prop `isNewLead?: boolean` (conversa da aba Novos)
- Quando `isNewLead = true`, exibir banner proeminente no topo: "Este contato está aguardando atendimento" com botão **"Iniciar Atendimento"**
- Prop `onStartAttendance?: () => void`
- Enquanto não iniciar, o compositor de mensagens fica desabilitado (somente leitura do histórico)

### 3. `src/pages/BrokerInbox.tsx`
- Adicionar state `inboxTab` (`novos` | `meus` | `outros`)
- Buscar conversas "Novos" separadamente: query em `conversations` com `source_instance = 'global'` onde o lead não tem broker_id (ou sem lead_id)
- Para "Outros" (se leader/admin): buscar conversas de corretores do time
- Implementar `handleStartAttendance`: atribuir broker_id na conversa, criar lead, unify, mover para "Meus"
- Usar `useUserRole` para determinar se mostra aba "Outros"

### 4. `src/pages/AdminInbox.tsx`
- Mesma lógica de abas aplicada ao admin
- Admin sempre vê aba "Outros" com todas as conversas

### 5. `src/hooks/use-conversations.ts`
- Adicionar opção `inboxTab` no `UseConversationsOptions`
- Para `novos`: buscar conversas com `source_instance = 'global'` e sem broker_id efetivo
- Para `outros`: buscar conversas de outros brokers (baseado em `lider_id` para leaders, ou todos para admins)
- Manter lógica atual para `meus`

### 6. Schema / RLS
- Adicionar RLS policy para que corretores em roletas `whatsapp_global` possam ver conversas sem `broker_id` (ou com `source_instance = 'global'` e `broker_id IS NULL`)
- Criar policy: "Corretores em roleta whatsapp_global podem ver conversas globais não atribuídas"

```sql
-- Permitir que corretores vejam conversas globais não atribuídas
CREATE POLICY "Corretores veem conversas globais nao atribuidas"
ON public.conversations FOR SELECT TO authenticated
USING (
  source_instance = 'global' 
  AND broker_id IS NULL 
  AND EXISTS (
    SELECT 1 FROM roletas_membros rm
    JOIN roletas r ON r.id = rm.roleta_id
    WHERE rm.corretor_id = get_my_broker_id()
      AND rm.ativo = true
      AND r.ativa = true
      AND r.tipo_origem = 'whatsapp_global'
  )
);

-- Permitir que corretores atualizem conversas globais para assumir
CREATE POLICY "Corretores podem assumir conversas globais"
ON public.conversations FOR UPDATE TO authenticated
USING (
  source_instance = 'global'
  AND broker_id IS NULL
  AND EXISTS (
    SELECT 1 FROM roletas_membros rm
    JOIN roletas r ON r.id = rm.roleta_id
    WHERE rm.corretor_id = get_my_broker_id()
      AND rm.ativo = true
      AND r.ativa = true
      AND r.tipo_origem = 'whatsapp_global'
  )
);
```

## Resumo visual

```text
Aba "Novos":
  - Conversas globais sem dono
  - Qualquer corretor da roleta WhatsApp vê
  - Ao abrir: histórico visível, envio bloqueado
  - Botão "Iniciar Atendimento" → cria lead + assume

Aba "Meus":
  - Inbox atual (conversas do corretor)
  - Inclui pessoais + globais já assumidas

Aba "Outros" (leader/admin):
  - Conversas de outros corretores
  - Supervisão / leitura
```

## Arquivos alterados

| Arquivo | Alteração |
|---|---|
| Migration SQL | RLS para conversas globais não atribuídas |
| `src/hooks/use-conversations.ts` | Opção `inboxTab`, queries separadas por aba |
| `src/components/inbox/ConversationList.tsx` | 3 abas no topo, prop `inboxTab`/`onTabChange` |
| `src/components/inbox/ConversationThread.tsx` | Banner "Iniciar Atendimento", bloqueio de envio |
| `src/pages/BrokerInbox.tsx` | State de abas, lógica de assumir atendimento |
| `src/pages/AdminInbox.tsx` | Mesmas abas adaptadas para admin |

