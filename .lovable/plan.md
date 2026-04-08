

## Filtro por Etiquetas com seleção e exibição na lista

### Resumo
Transformar o botão "Etiquetas" de um filtro binário (tem/não tem etiqueta) em um seletor que abre um popover com as etiquetas do corretor, permitindo filtrar por etiqueta específica. Além disso, exibir as etiquetas de cada conversa diretamente na lista.

### Alterações

**Arquivo: `src/components/inbox/ConversationList.tsx`**

1. **Receber `brokerId` como prop** -- necessário para buscar as etiquetas do corretor na tabela `whatsapp_labels`.

2. **Buscar etiquetas do corretor** -- novo `useEffect` que consulta `whatsapp_labels` filtrando por `broker_id`, armazenando em estado local `brokerLabels`.

3. **Buscar mapa lead→etiquetas** -- alterar o fetch de `lead_whatsapp_labels` para trazer `lead_id, label_id` (em vez de só `lead_id`), construindo um `Map<string, string[]>` que mapeia cada lead aos IDs das suas etiquetas. Isso permite tanto filtrar quanto exibir.

4. **Substituir o botão "Etiquetas" por um Popover** -- ao clicar, abre um popover compacto listando as etiquetas do corretor (nome + cor). O corretor seleciona uma etiqueta específica e a lista filtra para exibir apenas conversas cujos leads possuem aquela etiqueta. Clicar novamente na mesma etiqueta ou fechar o popover desativa o filtro.

5. **Exibir etiquetas na lista de conversas** -- na área de badges de cada conversa (após "Lead vinculado"), renderizar chips coloridos com o nome das etiquetas vinculadas ao lead daquela conversa (máximo 2, com "+N" se houver mais).

6. **Estado do quickFilter** -- mudar de `"labels"` (boolean) para `{ type: "label", labelId: string }` ou manter `quickFilter` como `string | null` onde o valor é o `labelId` selecionado (diferente de `"unread"` e `"oldest"`).

### Detalhes Técnicos

- Prop `brokerId` já está disponível em todos os pages que usam `ConversationList` (BrokerInbox, BrokerPlantao, AdminInbox, AdminPlantao)
- Consulta `whatsapp_labels`: `supabase.from("whatsapp_labels").select("id, name, color").eq("broker_id", brokerId).order("name")`
- Consulta `lead_whatsapp_labels`: `supabase.from("lead_whatsapp_labels").select("lead_id, label_id").in("lead_id", leadIds)` → agrupa em `Map<leadId, labelId[]>`
- Filtragem: `result.filter(c => c.lead_id && leadLabelMap.get(c.lead_id)?.includes(selectedLabelId))`
- Chips na conversa: lookup `leadLabelMap.get(conv.lead_id)` → resolve nomes/cores via `brokerLabels`
- Componente do Popover usa `@/components/ui/popover`

