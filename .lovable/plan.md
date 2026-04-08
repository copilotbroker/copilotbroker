

## Impedir conversas globais duplicadas para o mesmo telefone

### Problema
Quando uma nova mensagem chega no WhatsApp Global, o webhook verifica se já existe uma conversa pendente (`attendance_started = false`) para aquele telefone. Porém, se a conversa já foi atendida (`attendance_started = true`) E o lead ainda não foi criado no CRM, o sistema cria uma **segunda conversa global** para o mesmo número e distribui para outro corretor. Resultado: dois corretores veem o mesmo contato simultaneamente.

### Causa Raiz
No `handleGlobalInstanceMessage` (webhook), a verificação de conversa existente (linha 1730) filtra por `attendance_started = false`. Se o primeiro corretor já iniciou o atendimento mas não criou lead (ou houve uma race condition), a mensagem seguinte não encontra nem lead (Case A) nem conversa pendente (Case B), criando um registro duplicado.

### Solução
Alterar o webhook para verificar se já existe **qualquer** conversa global para aquele telefone antes de criar uma nova, independentemente do `attendance_started`.

### Alterações

**1. Atualizar `whatsapp-webhook/index.ts` — função `handleGlobalInstanceMessage`**

Antes de entrar no fluxo de distribuição (Case B), adicionar verificação mais ampla:

```text
Fluxo atual:
  Case A: Lead com broker? → roteia para broker
  Case B: Conversa global pendente (attendance_started=false)? → adiciona msg
  Else: Cria nova conversa + distribui

Fluxo corrigido:
  Case A: Lead com broker? → roteia para broker
  Case B: Conversa global pendente (attendance_started=false)? → adiciona msg  
  Case B2 (NOVO): Qualquer conversa global para este phone? → adiciona msg à existente
  Else: Cria nova conversa + distribui
```

O Case B2 busca: `phone_normalized = X AND source_instance = 'global'` (sem filtro de `attendance_started`). Se encontrar, adiciona a mensagem à conversa existente (do broker que já está atendendo), sem redistribuir.

**2. Adicionar unique index parcial como safety net**

Criar um índice único parcial para impedir duplicatas no nível do banco:
```sql
CREATE UNIQUE INDEX idx_conversations_global_phone_unique 
ON conversations (phone_normalized)
WHERE source_instance = 'global';
```

Isso garante que existe no máximo UMA conversa global por telefone, mesmo em cenários de race condition com mensagens simultâneas.

**3. Limpeza de dados — unificar conversas duplicadas existentes**

Para as 3 duplicatas encontradas (Marcelo, Ricardo, Teste/Fabiane), unificar mantendo a conversa mais antiga (ou a que tem lead), migrando mensagens e deletando a redundante.

### Detalhes Técnicos

- O índice único parcial é a solução definitiva contra duplicatas — mesmo com requests simultâneos, o banco rejeitará o segundo INSERT
- O webhook deve tratar o `INSERT` failure (conflict) como fallback gracioso: se falhar, busca a conversa existente e adiciona a mensagem nela
- A limpeza de dados será feita via migration com lógica de merge (migrar `conversation_messages`, preservar `lead_id`)

### Arquivos
- `supabase/functions/whatsapp-webhook/index.ts`: adicionar Case B2 + handle conflict
- Migração SQL: criar unique index + limpar duplicatas existentes

