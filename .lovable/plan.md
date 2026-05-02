## Objetivo

Permitir que cada roleta tenha um **checkout automático**: ao ativar, no horário configurado todos os membros que estiverem online (`status_checkin = true`) recebem checkout automaticamente, evitando que corretores fiquem "online" fora do expediente e recebam leads sem atender.

## Como vai funcionar (visão do usuário)

Na tela de gestão da roleta (admin), na seção de configurações de cada roleta, adicionar:

- Toggle **"Checkout automático"** (on/off)
- Quando ligado, aparece um campo **"Horário do checkout"** (select de hora, ex.: `21:00`)
- Texto de apoio: *"Todos os corretores online nesta roleta receberão checkout automático neste horário (fuso UTC-3)."*

A cada minuto, um job no servidor verifica as roletas com checkout automático ativo e, quando o horário corrente (UTC-3) bate com o configurado, executa o checkout de todos os membros online daquela roleta e registra um log.

## Mudanças técnicas

### 1. Banco de dados (migration)

Adicionar duas colunas em `public.roletas`:

- `auto_checkout_enabled boolean NOT NULL DEFAULT false`
- `auto_checkout_horario time NOT NULL DEFAULT '21:00:00'`

### 2. Edge function `roleta-auto-checkout` (nova)

- Sem JWT (chamada via cron interno).
- Calcula `HH:MM` atual em UTC-3.
- Busca `roletas` com `ativa = true AND auto_checkout_enabled = true AND auto_checkout_horario` no minuto corrente (janela de 1 min).
- Para cada roleta, faz `UPDATE roletas_membros SET status_checkin = false, checkout_em = now() WHERE roleta_id = $1 AND status_checkin = true AND ativo = true` retornando os ids/corretores.
- Insere registros em `roletas_log` (`acao = 'auto_checkout'`, `motivo = 'Checkout automático agendado HH:MM'`) por membro afetado.
- Retorna resumo (roletas processadas, total de checkouts).

### 3. Agendamento pg_cron

Job a cada minuto chamando a edge function via `net.http_post` (ambas extensões já habilitadas). Inserido via SQL direto (não migration), pois contém URL/anon key específicos do projeto.

### 4. UI — `src/components/admin/RoletaManagement.tsx`

Logo após o bloco "Horário sem transferência" (linhas ~605-639), adicionar um novo bloco com:

- `Switch` para `auto_checkout_enabled` chamando `updateRoleta(id, { auto_checkout_enabled })`.
- Quando ativo, `Select` de horário (00:00-23:00) chamando `updateRoleta(id, { auto_checkout_horario })`.
- Hint textual abaixo.

Disponível para qualquer `tipo_origem` (faz sentido tanto para Plantão Global quanto para landing pages).

### 5. Realtime já existente

`BrokerRoletas.tsx` já escuta `postgres_changes` em `roletas_membros`, então o status do corretor (botão In/Out) atualiza automaticamente quando o checkout em massa acontece — sem mudanças adicionais no front do corretor.

## Arquivos afetados

- **Novo**: `supabase/migrations/<timestamp>_roleta_auto_checkout.sql`
- **Novo**: `supabase/functions/roleta-auto-checkout/index.ts`
- **Editado**: `src/components/admin/RoletaManagement.tsx` (novo bloco de config)
- **Editado**: `src/types/roleta.ts` (campos `auto_checkout_enabled`, `auto_checkout_horario` na interface `Roleta`)
- **SQL direto** (insert tool, não migration): cron job `roleta-auto-checkout-tick` rodando a cada minuto.

## Observações

- Operação é idempotente dentro do minuto: se rodar 2x no mesmo minuto, o segundo update não afeta ninguém (já está `false`) e nenhum log duplicado é gerado (filtramos pelos que estavam `true`).
- Fuso fixo UTC-3 (Brasil), consistente com `whatsapp-intelligent-scheduling`.
- Não interfere com check-in manual: corretor pode dar check-in novamente após o horário.
