# Corrigir atribuição automática de leads ao líder da roleta

## Diagnóstico

Hoje a roleta **Plantão** está em modo **disputa** e tem o Vinicius como líder. No fluxo do webhook (`whatsapp-webhook → handlePlantaoOrphan`), quando chega uma mensagem nova:

1. Cria-se a conversa já com `broker_id = lider_id da roleta` (Vinicius), como "placeholder".
2. Chama-se `roleta-distribuir`. Como o modo é **disputa**, ela retorna `assigned_to = null` e o código **só sobrescreve o broker_id quando NÃO é disputa** (`if (assignedBrokerId && !isDisputa)`).
3. Resultado: a conversa fica permanentemente atribuída ao Vinicius, mesmo que outro corretor (ex.: Leonardo) já esteja conversando com a cliente fora do sistema.

Mesmo em modo "fila", `roleta-distribuir` cai em `fallback_lider → assignedBrokerId = roleta.lider_id` quando ninguém está online, gerando o mesmo sintoma.

O comportamento desejado é: **lead/conversa só ganha `broker_id` quando alguém clicar em "Iniciar atendimento"**. E o conceito de "líder da roleta" deixa de existir — qualquer usuário com papel `leader`, `admin` ou `manager` deve enxergar e poder reivindicar leads não atendidos.

## Mudanças

### 1. Banco de dados (migration)

- `roletas.lider_id`: tornar **nullable** (`ALTER COLUMN lider_id DROP NOT NULL`). Não removo a coluna para preservar histórico/relatórios.
- Nova policy em `conversations` (SELECT): qualquer usuário com role `leader`, `admin` ou `manager` (mesma org) pode ver conversas globais com `attendance_started = false` **independente do `lider_id`**. (A policy "Corretores veem conversas globais pendentes" continua filtrando por roleta para corretores comuns.)
- Nova policy em `conversations` (UPDATE): mesmos roles podem assumir (claim) conversas globais pendentes da própria org.
- Policies análogas em `conversation_messages` (SELECT) para os mesmos roles enxergarem o histórico antes do claim.
- Policy em `leads` (SELECT/UPDATE): leaders/admins/managers veem leads com `status_distribuicao IN ('em_disputa','fallback_lider','atribuicao_inicial')` que ainda não tiveram `atendimento_iniciado_em` setado, na mesma org.

### 2. Edge function `roleta-distribuir`

- Remover o caminho `fallback_lider`. Quando não há corretor online, usar o mesmo tratamento de **disputa**: `assignedBrokerId = null`, `status_distribuicao = "em_disputa"` (com `motivo = "Sem corretores online — liberado para líderes/admins"`).
- Notificar todos os usuários com role `leader`/`admin`/`manager` da org (em vez do líder único) via `notifications` e WhatsApp blast (reaproveitando o trecho de blast já existente).
- Não setar `broker_id`/`corretor_atribuido_id` no lead nesse cenário (deixar `null` até o claim).

### 3. Edge function `roleta-timeout`

- Remover a lógica de `fallback_lider` (passos 192-206 e o loop-breaker em 108-173). Ao esgotar os corretores online ou ao bater `MAX_REASSIGNMENTS`, fazer:
  - `broker_id = null`, `corretor_atribuido_id = null`, `reserva_expira_em = null`, `status_distribuicao = 'em_disputa'`, `motivo = 'Esgotada a fila — liberado para líderes/admins'`.
  - Logar `acao = 'liberado_para_lideres'` em `roletas_log`.
  - Notificar todos os leaders/admins/managers da org.
- Mesma alteração no bloco `globalRoleta` (linhas ~398-510).

### 4. Webhook `whatsapp-webhook` (`handlePlantaoOrphan`)

- Não usar mais `lider_id` como placeholder. Criar a conversa com `broker_id = null` e `source_instance = 'global'`, `attendance_started = false`. Caso a conversa já exija `broker_id NOT NULL` (verificar — hoje é NOT NULL na coluna), tornar nullable na migration.
- Após `roleta-distribuir`, só atualizar `broker_id` se a função retornou um corretor real (modo fila com alguém online).

### 5. UI — `RoletaManagement.tsx` e `use-roletas.ts`

- Remover o `<Select>` de líder do formulário de criação/edição.
- Remover validação `if (!formLiderId)`; remover `formLiderId` do estado e do payload.
- Tipo `Roleta.lider_id` → opcional; remover coluna "Líder" da listagem ou substituir por "—".
- `BrokerRoletas` (corretor) e telas que mostram `lider:brokers!roletas_lider_id_fkey` permanecem funcionais (campo opcional).

### 6. UI — Plantão / Inbox dos líderes

- Garantir que `BrokerPlantao`/`AdminPlantao` listem conversas globais não atendidas (`attendance_started = false`) sem filtrar por broker quando o usuário for `leader`/`admin`/`manager`. Hoje as queries já dependem das RLS; com as novas policies elas passam a aparecer naturalmente. Validar visualmente no `/corretor/plantao` logado como líder.
- Botão "Iniciar atendimento" continua o fluxo existente (set `broker_id`, `attendance_started=true`).

### 7. Limpeza dos leads atuais (script SQL único, em `mcp_supabase__read_query` não — isto é DML, vai junto da migration ou execução manual)

Para os leads/conversas hoje atribuídos ao Vinicius como placeholder:

```sql
UPDATE conversations
SET broker_id = NULL
WHERE source_instance = 'global'
  AND attendance_started = false
  AND broker_id = '<vinicius_id>';

UPDATE leads
SET broker_id = NULL, corretor_atribuido_id = NULL,
    status_distribuicao = 'em_disputa'
WHERE atendimento_iniciado_em IS NULL
  AND broker_id = '<vinicius_id>'
  AND status_distribuicao = 'fallback_lider';
```

## Fora do escopo

- Não removo a coluna `lider_id` (preservar histórico).
- Não altero `brokers.lider_id` (relação corretor↔líder permanece).
- Modo "fila" continua existindo; a única mudança é que o destino de fallback deixa de ser um líder único.

## Arquivos afetados

- nova migration em `supabase/migrations/`
- `supabase/functions/roleta-distribuir/index.ts`
- `supabase/functions/roleta-timeout/index.ts`
- `supabase/functions/whatsapp-webhook/index.ts`
- `src/components/admin/RoletaManagement.tsx`
- `src/hooks/use-roletas.ts`
- `src/types/roleta.ts`
