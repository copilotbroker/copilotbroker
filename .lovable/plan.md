

# Limpar Inbox — Apagar conversas e mensagens existentes

## Situação atual
- **2,990 conversas** na tabela `conversations`
- **113,223 mensagens** na tabela `conversation_messages`
- Nenhuma conversa da instância global ainda (todas são do fluxo antigo)

## O que será feito

Uma migration SQL que:

1. **Deleta todas as mensagens** da tabela `conversation_messages` (são vinculadas a conversas via `conversation_id`)
2. **Deleta todas as conversas** da tabela `conversations`
3. **Remove vínculos** de `lead_id` em conversas que possam existir (o lead em si permanece intacto no CRM)

Isso não afeta leads, propostas, interações, campanhas ou qualquer outro dado do CRM. Apenas o histórico de chat é removido.

A partir daí, novas conversas serão criadas automaticamente pelo webhook quando mensagens chegarem (tanto da instância pessoal quanto da global).

## Migration SQL

```sql
-- Limpar mensagens primeiro (FK para conversations)
DELETE FROM public.conversation_messages;

-- Limpar todas as conversas
DELETE FROM public.conversations;
```

## Arquivos alterados

| Arquivo | Alteração |
|---|---|
| Migration SQL | DELETE de `conversation_messages` e `conversations` |

Nenhum arquivo de código precisa ser alterado. O sistema continuará criando conversas normalmente via webhook.

