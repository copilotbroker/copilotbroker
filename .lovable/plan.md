
Objetivo
- Continuar a evolução da Inbox em 4 frentes ao mesmo tempo: nome/identificação, mídia completa, visual clean e produtividade, priorizando correções que resolvam o problema do nome “de vez” e consolidem a experiência multimídia.

Diagnóstico atual
- A base já melhorou, mas ainda há fragilidades:
  - o nome ainda depende de resolução em tempo de leitura e pode falhar por variação de telefone
  - não existe um `display_name` persistido na conversa
  - a lista ainda usa `last_message_preview`, que pode ficar genérico para mídia
  - a thread já renderiza mídia, mas ainda falta uma experiência mais rica e consistente
  - o realtime de mensagens escuta apenas INSERT, então mudanças de status/edição podem não refletir bem
  - o webhook salva mídia, mas a qualidade do metadado depende do payload recebido

Prioridade de implementação
1. Nome e identificação
2. Mídia completa
3. Visual clean
4. Produtividade

Plano de implementação

1. Resolver nomes de forma definitiva
- Introduzir um conceito de nome resolvido da conversa:
  - `lead.name`
  - nome salvo na própria conversa
  - `sender_name` mais recente
  - lead encontrado por telefone normalizado
  - telefone formatado
- Parar de depender só de fallback em memória no hook.
- Ajustar a resolução por telefone para usar variantes canônicas brasileiras com DDD + nono dígito.
- Garantir que a lista, o header da thread, o modal de criar lead e os badges usem a mesma fonte de verdade.
- Validar se o webhook está sempre capturando `sender_name` inbound e enriquecer quando vier vazio.

2. Melhorar a modelagem multimídia da Inbox
- Padronizar `conversation_messages.metadata` para todos os tipos:
  - `file_url`
  - `file_name`
  - `mime_type`
  - `size_bytes`
  - `duration_seconds`
  - `thumbnail_url`
  - `caption`
  - `raw_type`
- Refinar a inferência de tipo no webhook para distinguir melhor:
  - imagem
  - áudio/PTT
  - vídeo
  - documento
- Ajustar o preview salvo em conversa para não depender só de `"[Mídia]"`, usando rótulos específicos:
  - “Foto”
  - “Áudio”
  - “Vídeo”
  - “Documento”

3. Evoluir a thread para uma UX mais premium
- Adicionar separadores por dia.
- Melhorar bolhas e hierarquia:
  - inbound/outbound mais limpos
  - status da mensagem com cor e legenda consistentes
  - badge para IA/humano mais discreta
- Melhorar mídia:
  - imagem com visualização ampliada
  - áudio com player mais limpo
  - vídeo com card próprio
  - documento com nome, tipo e ação de abrir/baixar
- Melhorar composer:
  - preview melhor do anexo
  - remoção clara do arquivo
  - estados de envio
  - texto auxiliar por tipo de mídia

4. Melhorar a lista de conversas
- Exibir nome resolvido de forma consistente.
- Exibir subtítulo mais útil:
  - “Você: …” para outbound
  - ícone/tipo de mídia para arquivos
- Melhorar badges:
  - lead vinculado
  - nome identificado
  - WhatsApp direto
  - mídia
  - piloto automático
  - em risco
- Refinar ordenação e leitura visual para ficar mais clean e menos “poluída”.

5. Aumentar produtividade do corretor
- Adicionar respostas rápidas/templates na composer area.
- Planejar busca dentro da conversa.
- Adicionar ações rápidas mais claras:
  - marcar como lida
  - arquivar
  - abrir lead
  - criar card
- Preparar estrutura para próximos upgrades:
  - resumo automático
  - filtros “sem lead”, “com mídia”, “aguardando resposta”

6. Melhorar atualização em tempo real
- No hook de mensagens, além de INSERT, passar a reagir também a UPDATE para refletir:
  - status sent/delivered/read
  - eventuais enriquecimentos de metadata
- Revisar atualização da lista para refletir mudanças de preview/status sem precisar recarregar manualmente.

Arquivos principais a revisar na próxima implementação
- `src/hooks/use-conversations.ts`
- `src/components/inbox/ConversationList.tsx`
- `src/components/inbox/ConversationThread.tsx`
- `src/components/crm/CreateLeadFromChatModal.tsx` se o nome sugerido ainda depender de fallback frágil
- `supabase/functions/whatsapp-webhook/index.ts`
- `supabase/functions/inbox-send-message/index.ts`

Ajustes de backend recomendados
- Se a conversa ainda não tiver um nome confiável, considerar persistir um campo próprio na tabela de conversas em uma próxima etapa.
- Revisar se será necessário pequeno ajuste de esquema para suportar:
  - `display_name`
  - `display_name_source`
  - `last_message_type`
- Isso deixaria a Inbox mais rápida, consistente e menos dependente de reprocessamento client-side.

Resultado esperado
- O corretor passa a ver o nome certo quase sempre, mesmo sem card vinculado.
- Fotos, áudios, vídeos e documentos ficam realmente utilizáveis.
- A Inbox ganha aparência mais clean sem perder contexto.
- A operação diária fica mais rápida e mais confiável.

Entrega recomendada em fases
- Fase 1: nome definitivo + lista clean + preview de mídia mais inteligente
- Fase 2: thread premium + realtime de status + composer melhor
- Fase 3: respostas rápidas, busca na conversa, filtros avançados e resumo inteligente
