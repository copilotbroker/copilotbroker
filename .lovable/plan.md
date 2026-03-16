
Objetivo
- Corrigir o Inbox para que o mesmo telefone do mesmo corretor apareça como um único contato, e impedir que uma conversa duplicada apareça com “Piloto Automático” sem ativação manual do corretor.

Diagnóstico
- Encontrei uma inconsistência clara na criação/consulta de conversas:
  - `whatsapp-webhook` arquiva mensagens usando `phone_normalized` sem `+` e faz `upsert` por `broker_id + phone_normalized`.
  - `whatsapp-message-sender` procura/cria conversa usando `phone_normalized` com `+`.
- Isso permite que o mesmo telefone exista em duas conversas diferentes para o mesmo corretor, porque os valores normalizados não são idênticos.
- Além disso, quando o motor de envio cria a conversa, ele define `ai_mode: "ai_active"` por padrão. Isso explica por que um dos contatos pode aparecer com “Piloto Automático” mesmo sem ação manual do Edinardo.
- A camada do frontend já filtra mensagens por `conversation_id`, então o problema principal não parece ser mistura de mensagens na UI, e sim duplicação de registros de conversa na origem.

Plano de correção
1. Padronizar a normalização do telefone nas funções de backend
- Usar um único formato canônico para `phone_normalized` em todos os fluxos.
- Aplicar a mesma função no webhook, no sender e em qualquer busca/criação de conversa.

2. Corrigir a criação e busca de conversas
- Ajustar `whatsapp-message-sender` para procurar a conversa existente com o mesmo padrão usado pelo webhook.
- Garantir que, ao criar conversa, ela reaproveite a conversa já existente do corretor + telefone em vez de abrir outra paralela.

3. Remover ativação automática indevida do Piloto Automático
- Parar de criar novas conversas com `ai_mode: "ai_active"` por padrão no fluxo do sender.
- Definir o modo inicial seguro como neutro/copiloto, preservando `ai_active` apenas quando já existir conversa ativa com esse modo ou quando houver ativação explícita.

4. Vincular melhor a conversa ao lead unificado
- Ao reaproveitar/encontrar conversa existente, manter ou completar o `lead_id` corretamente.
- Revisar os pontos onde a conversa nasce sem lead e depois é enriquecida só no frontend, para evitar duas linhas representando o mesmo lead/telefone.

5. Tratar duplicados já existentes
- Implementar uma rotina de consolidação para conversas antigas duplicadas do mesmo corretor + telefone:
  - escolher uma conversa principal
  - mover `conversation_messages` para ela
  - preservar `ai_mode` apenas se houver evidência real de ativação intencional
  - arquivar ou remover a duplicada
- Se necessário, complementar com ajuste no banco para reforçar unicidade por telefone canônico.

Resultado esperado
- Pesquisar “Ana Paula” ou qualquer outro lead retorna apenas um contato por telefone/corretor.
- O histórico fica consolidado na mesma conversa.
- “Piloto Automático” só aparece quando realmente foi ativado.
- Novas mensagens recebidas/enviadas não voltam a recriar duplicados.

Arquivos a revisar/alterar
- `supabase/functions/whatsapp-webhook/index.ts`
- `supabase/functions/whatsapp-message-sender/index.ts`
- possivelmente `src/hooks/use-conversations.ts` para esconder resíduos temporários e exibir só a conversa consolidada, se necessário
- possivelmente migração/backend para saneamento dos duplicados existentes

Detalhes técnicos
- O ponto crítico é este desalinhamento:
  - webhook salva/busca `phone_normalized` como dígitos
  - sender salva/busca `phone_normalized` com `+`
- Como a chave de conversa depende desse campo, o sistema passa a enxergar o mesmo telefone como dois contatos distintos.
- O status “Piloto Automático” indevido vem do `ai_mode: "ai_active"` na criação automática da conversa pelo sender.

<lov-actions>
<lov-suggestion message="Teste o inbox de ponta a ponta pesquisando um lead duplicado e verificando se só uma conversa aparece, com o status correto de Piloto Automático.">Verificar que funciona</lov-suggestion>
<lov-suggestion message="Implemente a correção para unificar sempre contatos duplicados por telefone e corretor no inbox, consolidando histórico e removendo ativação automática indevida do Piloto Automático.">Corrigir duplicados no inbox</lov-suggestion>
<lov-suggestion message="Adicione um processo de saneamento para mesclar conversas antigas duplicadas já existentes no backend, preservando mensagens e vínculo com o lead principal.">Mesclar duplicados antigos</lov-suggestion>
<lov-suggestion message="Mostre no inbox um indicador de conversa consolidada com vínculo confirmado ao lead para reduzir dúvidas quando houver histórico antigo importado.">Melhorar identificação de conversa</lov-suggestion>
</lov-actions>
