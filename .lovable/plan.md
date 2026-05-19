## Problema

Quando o botão **Chat** na página do lead navega para `/admin/plantao?conversationId=<id>` (ou a versão `/corretor/plantao`), a aba padrão é `"novos"` e a conversa só é selecionada se for encontrada na lista atualmente visível. O segundo `useConversations` que deveria carregar a aba "meus" está gated em `inboxTab === "novos" ? "novos" : inboxTab` — ou seja, enquanto a aba ativa é "novos", **ambos** os hooks buscam apenas conversas novas. Resultado: se a conversa já tem `attendance_started=true` (caso da Kely com o Maicon), ela não aparece em nenhuma das duas listas, o `useEffect` que selecionaria/trocava a aba sai sem fazer nada, a URL permanece e o usuário continua vendo a aba "Novos" vazia/genérica em vez da conversa pedida.

Mesma situação inversa também ocorre: conversa "novos" chegando enquanto o usuário já está em "meus".

As páginas de Inbox (`AdminInbox`, `BrokerInbox`) já funcionam porque usam uma única lista `allPersonalConversations` que cobre todas as abas.

## Solução

Em `AdminPlantao.tsx` e `BrokerPlantao.tsx`, quando há `conversationId` na URL e o alvo **não** está em nenhuma das listas carregadas e ambas as listas já terminaram o load inicial, fazer um `select` direto na tabela `conversations` para descobrir o `attendance_started` da conversa e trocar de aba conforme:

- `attendance_started === false` → `setInboxTab("novos")`
- caso contrário → `setInboxTab("meus")`

Sem limpar a URL nesse momento; quando a aba certa for ativada, o hook correspondente vai buscar a conversa, o `useEffect` existente roda de novo, encontra o alvo, seleciona e finalmente limpa `searchParams`.

Para evitar fetches repetidos, guardar o último `convId` resolvido em um `useRef` e só refazer a query quando o `convId` mudar.

## Detalhes técnicos

Arquivos a editar:

- `src/pages/AdminPlantao.tsx`
- `src/pages/BrokerPlantao.tsx`

Adicionar um segundo `useEffect` (ou estender o existente) com algo equivalente a:

```text
const resolvedConvIdRef = useRef<string | null>(null);

useEffect(() => {
  const convId = searchParams.get("conversationId");
  if (!convId) return;
  // já tratado pelo effect existente
  if (novosConversations.some(c => c.id === convId)) return;
  if (conversations.some(c => c.id === convId)) return;
  // ainda carregando alguma lista → esperar
  if (novosLoading || isLoading) return;
  // evitar refetch infinito do mesmo id
  if (resolvedConvIdRef.current === convId) return;
  resolvedConvIdRef.current = convId;

  supabase
    .from("conversations")
    .select("attendance_started, source_instance")
    .eq("id", convId)
    .maybeSingle()
    .then(({ data }) => {
      if (!data) return;
      const desired: InboxTab = data.attendance_started === false ? "novos" : "meus";
      if (desired !== inboxTab) setInboxTab(desired);
    });
}, [searchParams, novosConversations, conversations, novosLoading, isLoading, inboxTab]);
```

O `useEffect` já existente que faz `setSelectedConversation(target)` continua igual e cuida da seleção + limpeza da URL quando a lista correta passar a conter a conversa.

Opcional/secundário: se a conversa for de outra organização/corretor que o filtro `selectedBrokerId` exclui, ainda assim o alvo nunca aparecerá. Para cobrir esse caso, quando o supabase devolver `broker_id` diferente do filtro atual, também resetar `setSelectedBrokerId("all")`. Isso é só uma melhoria — fora do escopo desta correção, a menos que se confirme que afeta o caso reportado.

## Fora de escopo

- Sem mudanças no hook `useConversations`, edge functions, RLS ou migrações.
- Sem alterações visuais.
- Sem mexer em `AdminInbox`/`BrokerInbox` (já funcionam).
- Sem alterar o botão Chat em `LeadPage.tsx`.