

## Corrigir erro ao criar card no Kanban a partir do Plantão

### Problema
Ao criar um lead pelo modal "Criar Card no Kanban" no Plantão, o INSERT na tabela `leads` dispara o trigger `auto_create_conversation_for_lead`. Esse trigger tenta criar uma nova conversa pessoal para o broker+telefone, mas já existe uma conversa global com o mesmo `broker_id` e `phone_normalized`. O unique index `idx_conversations_broker_phone` rejeita a inserção, causando o erro.

### Causa Raiz
- O índice único `idx_conversations_broker_phone` é `(broker_id, phone_normalized)` — sem considerar `source_instance`
- O trigger `auto_create_conversation_for_lead` filtra `source_instance IS NULL OR source_instance != 'global'` ao buscar conversas existentes, mas quando não encontra, tenta inserir uma nova, que viola a constraint

### Solução (2 partes)

**1. Corrigir o trigger `auto_create_conversation_for_lead`**
Alterar a busca por conversas existentes para incluir TODAS as instâncias (não excluir global). Se já existir uma conversa global para o broker+phone, linkar o lead a essa conversa em vez de criar uma nova.

Lógica corrigida:
```sql
-- Buscar qualquer conversa existente para broker+phone (incluindo global)
SELECT id INTO _existing_conv_id
FROM public.conversations
WHERE broker_id = NEW.broker_id
  AND phone_normalized = _phone_normalized
LIMIT 1;
```

Se encontrar, atualiza `lead_id` e `display_name` na conversa existente (mesmo que global).

**2. Alternativa complementar: tornar o índice parcial**
Substituir o índice único por um que permita múltiplas conversas por broker+phone quando `source_instance` difere:
```sql
DROP INDEX idx_conversations_broker_phone;
CREATE UNIQUE INDEX idx_conversations_broker_phone 
ON public.conversations (broker_id, phone_normalized, COALESCE(source_instance, 'personal'));
```

### Implementação recomendada
Aplicar a parte 1 (corrigir o trigger) como solução principal — é mais segura e cobre o caso de uso. A parte 2 pode ser aplicada como proteção adicional.

### Arquivos
- Migração SQL: corrigir trigger + ajustar índice

