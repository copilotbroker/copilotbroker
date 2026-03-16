
Objetivo
- Transformar a Inbox em uma experiência mais clean, confiável e completa, com identificação melhor dos contatos e suporte real a mídia, sem perder velocidade de atendimento.

O que já identifiquei no sistema atual
- O nome exibido hoje depende primeiro do `lead_id`; quando não existe vínculo, há um fallback por telefone, mas ele ainda é limitado e pode falhar quando o WhatsApp do lead está salvo em formato diferente.
- A timeline já suporta `message_type`, porém hoje o fluxo prático está centrado em texto.
- O webhook já arquiva mídia como `message_type: "media"` e conteúdo `"[Mídia]"`, então a infraestrutura básica existe, mas sem renderização rica.
- O envio atual da Inbox usa uma função de texto apenas, então não há composer para foto, áudio, vídeo ou documento.
- A UI do chat é funcional, mas ainda “seca”: faltam preview de mídia, status mais claros, ações rápidas e contexto melhor do lead.

Sugestão de evolução — versão “Inbox incrível”
1. Base de confiança: nomes e identificação
- Melhorar a resolução de nome por telefone com normalização mais robusta.
- Buscar nome em múltiplas fontes:
  - lead vinculado
  - leads por `whatsapp`
  - `sender_name` vindo do WhatsApp
  - nome salvo manualmente no contato/conversa
- Salvar um `display_name` confiável na conversa para não recalcular sempre.
- Exibir badges claros:
  - “Lead vinculado”
  - “WhatsApp direto”
  - “Sem nome confirmado”

2. Suporte completo a mídia
- Receber e exibir:
  - fotos
  - áudios
  - vídeos
  - documentos
- Mostrar cards de mídia no chat com preview:
  - imagem com lightbox
  - áudio com player inline
  - vídeo com thumbnail + player
  - documento com nome/ícone/download
- Composer com anexos e envio de mídia, não só texto.
- Indicadores de upload/envio/progresso/erro.

3. Chat mais clean e profissional
- Header mais limpo com:
  - nome grande
  - telefone menor
  - status do atendimento
  - origem do contato
- Bolhas com melhor hierarquia visual.
- Separadores por dia.
- Status por mensagem:
  - enviando
  - enviada
  - entregue
  - lida
  - falhou
- Estados vazios mais elegantes.

4. Produtividade do corretor
- Respostas rápidas / templates.
- Ações contextuais no topo:
  - ligar
  - abrir lead
  - criar card
  - arquivar
  - transferir
- Busca dentro da conversa.
- Fixar notas/resumos do lead.
- Marcação de conversa importante.
- Filtros mais úteis:
  - só não lidas
  - sem lead vinculado
  - com mídia
  - aguardando resposta
  - em piloto automático
  - em risco

5. Automação e inteligência
- Resumo automático da conversa.
- Sugestão de próxima ação.
- Extração automática de dados do chat:
  - nome
  - interesse
  - empreendimento
  - faixa de valor
- Detecção de intenção:
  - agendar visita
  - pedir proposta
  - mandar documentos
  - objeção
- Alertas inteligentes:
  - lead quente sem resposta
  - conversa parada
  - proposta enviada sem follow-up

6. Integração com CRM
- Criar lead sem sair da conversa.
- Vincular conversa a lead existente quando houver match confiável.
- Mostrar proposta, agendamento e estágio do funil no painel lateral.
- Timeline unificada: tudo que acontece no chat refletir no lead e vice-versa.

Prioridade recomendada
Fase 1 — ganho imediato
- Corrigir identificação de nome
- Melhorar visual da lista e do cabeçalho
- Exibir `sender_name` quando existir
- Criar badges de tipo de contato
- Melhorar filtros e busca

Fase 2 — grande salto funcional
- Renderizar mídia recebida
- Adicionar envio de imagens/documentos/áudios
- Status detalhado de mensagens
- Player e preview no chat

Fase 3 — Inbox premium
- Templates e respostas rápidas
- Resumo inteligente
- Extração automática de dados
- Ações recomendadas e alertas

Sugestão objetiva do que eu implementaria primeiro
1. Resolver definitivamente a identificação do nome
- Fortalecer o match por telefone no hook de conversas.
- Usar `sender_name` do WhatsApp como fallback visual.
- Persistir nome resolvido da conversa para evitar inconsistência.

2. Evoluir a estrutura das mensagens para mídia real
- Em vez de salvar só `"[Mídia]"`, armazenar metadados:
  - tipo real do arquivo
  - URL/ID do arquivo
  - nome
  - mime type
  - duração
  - thumbnail
  - tamanho
- Isso habilita preview e download de verdade.

3. Atualizar a interface da thread
- Renderers diferentes para texto, imagem, áudio, vídeo e documento.
- Composer com botão de anexo.
- Galeria/preview antes de enviar.

4. Melhorar a lista de conversas
- Avatar com iniciais reais
- Nome resolvido corretamente
- Indicador de mídia na última mensagem
- Tags de lead/etapa/projeto
- Snippet mais útil da última interação

Detalhes técnicos
- Hoje o ganho mais rápido está em `src/hooks/use-conversations.ts`, `ConversationList.tsx` e `ConversationThread.tsx`.
- Para mídia, além da UI, será necessário enriquecer o backend de webhook e envio para salvar e devolver metadados no `conversation_messages.metadata`.
- A melhor abordagem é tratar `conversation_messages` como entidade multimodal:
```text
text   -> content
image  -> metadata.file_url + thumbnail_url
audio  -> metadata.file_url + duration_seconds
video  -> metadata.file_url + thumbnail_url
doc    -> metadata.file_url + file_name + mime_type
```
- Para nomes, a ordem ideal de resolução seria:
```text
lead.name
-> nome manual salvo na conversa
-> sender_name vindo do WhatsApp
-> lead encontrado por telefone
-> telefone formatado
```

Resultado esperado
- O corretor identifica imediatamente com quem está falando.
- A Inbox deixa de parecer um chat “básico” e vira um centro real de atendimento.
- Conversas com mídia passam a funcionar de forma moderna.
- O time ganha mais velocidade, contexto e taxa de conversão.

Minha recomendação prática
- Se quiser, o melhor próximo passo é eu montar um plano de implementação em 3 etapas e começar pela Fase 1 + Fase 2:
  - nomes corretos
  - visual mais clean
  - renderização de mídia
  - envio de anexos
