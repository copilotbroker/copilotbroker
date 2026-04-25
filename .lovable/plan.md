## Diagnóstico do caso (Gilson – Davi)

Investiguei o lead `Gilson Gonçalves Jacoby` (whatsapp final `1281`, corretor Davi Santiago):

- **Cadência criada às 17:19** com 7 etapas, status `running`.
- **3 mensagens enviadas** (etapas 1, 2 e 3) entre 17:20 e 20:21.
- **Nenhuma mensagem inbound** do lead foi registrada na conversa.
- Às 20:39:59 a campanha foi cancelada manualmente (alguém — provavelmente o próprio Davi pelo Kanban/Inbox — clicou em cancelar a cadência), e o status do lead voltou de `awaiting_docs` para `info_sent`.

Ou seja: **o cancelamento automático por resposta do lead nunca ocorreu** porque nenhuma resposta foi processada pelo sistema.

## Causa raiz

A edge function `whatsapp-webhook` está **completamente fora do ar** com erro de boot:

```
worker boot error: Uncaught SyntaxError: 
  Identifier 'phoneVariants' has already been declared
  at whatsapp-webhook/index.ts:1399:9
```

Logs mostram **90 respostas HTTP 503** consecutivas para `POST /functions/v1/whatsapp-webhook` nas últimas horas. Como o webhook é o único ponto que recebe mensagens da UAZAPI, **nenhuma resposta de cliente está sendo processada agora** — não só a do Gilson. Isso afeta:

1. Cancelamento automático de cadências quando o lead responde (`reply_count` e gatilho de "lead respondeu").
2. Registro de mensagens inbound no inbox.
3. Atualização de `last_message_direction`, `unread_count`, copilot, etc.

A duplicação acontece porque uma versão deployada do arquivo tem duas declarações `const phoneVariants` no mesmo escopo de função (na versão atual do repo as 8 declarações estão em funções separadas, mas o build deployado contém pelo menos duas no mesmo bloco da linha 1399).

## Plano de correção

1. **Inspecionar `supabase/functions/whatsapp-webhook/index.ts`** ao redor da linha 1399 e confirmar onde o escopo está colidindo (provavelmente uma função que tem `const phoneVariants` no topo e mais um `const phoneVariants` dentro de um bloco interno após uma edição recente).
2. **Renomear a segunda declaração** para algo como `inboundPhoneVariants` (ou reutilizar a primeira variável) para eliminar o conflito.
3. **Fazer scan completo do arquivo** procurando outros identificadores duplicados no mesmo escopo (`reply_count`, etc.) para evitar reincidência.
4. **Re-deploy automático** da função (Lovable faz no save).
5. **Validar** consultando os logs da edge function: a próxima requisição deve retornar 200 e os logs `worker boot error` devem cessar.
6. **Tratar o caso do Gilson manualmente (opcional)**: como a cadência já está `cancelled` e o lead voltou para `info_sent`, nenhuma ação adicional no banco é estritamente necessária — apenas avisar o Davi que ele pode reativar a cadência se quiser, agora que o webhook estará funcional.

## O que NÃO precisa mudar

- A lógica de `cancelCadenciaForLead` está correta — ela é acionada por `reply_count > 0` no processamento do webhook (que está quebrado) ou manualmente pelo corretor. A correção é só destravar o webhook.
- A cadência em si foi configurada corretamente; o problema é puramente operacional.

Após a aprovação, eu corrijo a duplicação e confirmo via logs que o webhook voltou a aceitar mensagens.