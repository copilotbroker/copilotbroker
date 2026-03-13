

# Plano: Preservar status original ao ativar/desativar cadência

## Problema
Atualmente, quando uma cadência é ativada, o lead sempre vai para `awaiting_docs`. Quando termina/cancela, sempre volta para `info_sent`. Isso é errado para leads que estavam em `scheduling` ou outras colunas — eles deveriam retornar ao status original.

## Solução
Adicionar uma coluna `lead_previous_status` na tabela `whatsapp_campaigns` para gravar o status do lead antes da cadência ser ativada. Na desativação, restaurar esse status.

## Mudanças

### 1. Migration — Nova coluna
```sql
ALTER TABLE whatsapp_campaigns 
ADD COLUMN lead_previous_status text DEFAULT NULL;
```

### 2. Edge Function `auto-cadencia-10d/index.ts`
- Salvar `lead.status` em `lead_previous_status` ao criar a campanha
- Manter a movimentação para `awaiting_docs`

### 3. Edge Function `whatsapp-webhook/index.ts` (~linha 238-259)
- Ao completar campanha, ler `lead_previous_status` da campanha
- Restaurar o lead para esse status em vez de hardcoded `info_sent`
- Fallback para `info_sent` se `lead_previous_status` for null

### 4. Edge Function `whatsapp-message-sender/index.ts`
- Ao mover lead de `new` para `awaiting_docs` na primeira mensagem, salvar `lead_previous_status: "new"` na campanha

### 5. Hook `use-cadencia-ativa.ts`
- Na `cancelMutation` e `cancelCadenciaForLead`: buscar `lead_previous_status` da campanha e restaurar esse status em vez de `info_sent`

### 6. Nenhuma mudança no Kanban UI
A coluna "Copiloto Ativo" continua igual — o que muda é apenas a lógica de retorno.

