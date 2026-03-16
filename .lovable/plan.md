
Objetivo
- Ajustar a lógica da cadência para que um lead que entra em Pré Atendimento e recebe o primeiro contato vá para Atendimento antes de Copiloto Ativo, e ao concluir a cadência volte para Atendimento, não para Pré Atendimento.

O que identifiquei
- Hoje há duas regras conflitantes:
  1. `auto-cadencia-10d` cria a campanha salvando `lead_previous_status = lead.status`, então para Ana Paula ficou `new`.
  2. `whatsapp-message-sender` ao enviar a 1ª mensagem move o lead de `new` direto para `awaiting_docs` e ainda reforça `lead_previous_status = "new"`.
- Depois, `whatsapp-webhook` conclui a campanha e restaura o lead usando `lead_previous_status`, por isso ele volta para `new`/Pré Atendimento.

Abordagem
- Implementar a progressão comercial correta:
  - `new` → `info_sent` no primeiro contato real
  - `info_sent` → `awaiting_docs` quando a cadência for ativada/assumir o modo Copiloto Ativo
  - ao concluir a cadência, restaurar para `info_sent`

Plano de implementação

1. Corrigir a base da restauração na ativação da cadência
- Arquivo: `supabase/functions/auto-cadencia-10d/index.ts`
- Quando a cadência automática for criada para um lead em `new`, salvar `lead_previous_status` como `info_sent` em vez de `new`.
- Manter o comportamento atual para leads que já estavam em outras etapas (ex.: agendamento deve continuar restaurando para agendamento).

2. Corrigir a transição do primeiro envio
- Arquivo: `supabase/functions/whatsapp-message-sender/index.ts`
- Ajustar a regra do step 1:
  - se o lead estiver em `new`, mover para `info_sent` (Atendimento), não para `awaiting_docs`
  - registrar timeline coerente com “primeiro contato enviado”
- Evitar regravar `lead_previous_status = "new"` nesse momento.

3. Ajustar a entrada em Copiloto Ativo
- Arquivo: `supabase/functions/auto-cadencia-10d/index.ts`
- Ao ativar a cadência, garantir que o lead entre em `awaiting_docs`, mas com restauração futura apontando para `info_sent` quando ele veio de `new`.
- Atualizar a nota da timeline para refletir a sequência correta do funil.

4. Corrigir a conclusão da cadência
- Arquivo: `supabase/functions/whatsapp-webhook/index.ts`
- Manter a restauração baseada em `lead_previous_status`, mas agora ela passará a devolver `info_sent` nesse cenário.
- Ajustar o texto da interaction para deixar claro que o lead voltou para Atendimento.

Resultado esperado
- Lead entra em Pré Atendimento.
- Ao acontecer o primeiro contato, passa a ser considerado Atendimento.
- Enquanto a cadência roda, fica em Copiloto Ativo.
- Quando a cadência termina por resposta ou fim das mensagens, volta para Atendimento.

Arquivos envolvidos
- `supabase/functions/auto-cadencia-10d/index.ts`
- `supabase/functions/whatsapp-message-sender/index.ts`
- `supabase/functions/whatsapp-webhook/index.ts`

Detalhe técnico
- Não precisa mudar banco nem permissões; é ajuste de regra de negócio nas funções do backend.
- O ponto principal é parar de persistir `new` como status de retorno quando o lead já recebeu o primeiro contato.

Critérios de aceite
- Lead que estava em `new` e teve cadência ativada não volta mais para `new` ao concluir.
- A primeira mensagem passa a representar Atendimento.
- O encerramento da cadência restaura corretamente para `info_sent`.
- Casos de leads que já estavam em etapas acima continuam restaurando para sua etapa anterior real.
