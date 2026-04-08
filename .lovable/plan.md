

## Diagnóstico: Lead Guilherme não exibe botão Chat corretamente

### O que encontrei

O lead Guilherme **tem** uma conversa vinculada corretamente (`conversations.lead_id` aponta para o lead). Porém, o campo `source_instance` está **NULL** em vez de `'personal'`.

Isso acontece porque:
1. A conversa foi criada pelo trigger `auto_create_conversation_for_lead` **antes** da correção que passou a setar `source_instance = 'personal'` explicitamente
2. Ou foi criada pela cadência automática (`auto-cadencia-10d`) que chama `ensureConversationForLead` — e essa função no LeadPage.tsx também não seta `source_instance`

### Impacto do NULL

O botão Chat no LeadPage **deveria funcionar** mesmo com `source_instance = NULL` — o código trata NULL como "pessoal" (inbox). Porém, em outros pontos do sistema (como o `ConversationThread` que verifica `source_instance === "personal"` para mostrar "Devolver ao Plantão"), o NULL causa problemas.

### Solução

1. **Migração de dados**: Atualizar todas as conversas com `source_instance = NULL` para `'personal'` — são conversas pessoais que foram criadas antes da correção
2. **Proteção futura**: Adicionar `DEFAULT 'personal'` na coluna `source_instance` para que nunca mais fique NULL

### Alterações

**Migração SQL:**
```sql
-- Preencher source_instance NULL com 'personal'
UPDATE conversations 
SET source_instance = 'personal' 
WHERE source_instance IS NULL;

-- Definir default para a coluna
ALTER TABLE conversations 
ALTER COLUMN source_instance SET DEFAULT 'personal';
```

**Nenhuma alteração de código** — o trigger `auto_create_conversation_for_lead` já seta `'personal'` e o `LeadPage.tsx` já trata NULL como pessoal. A migração apenas corrige dados legados.

### Arquivos
- Nova migração SQL (normalizar `source_instance`)

