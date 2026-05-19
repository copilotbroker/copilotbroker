## Problema

No Kanban (corretor e admin), o botão **Iniciar Atendimento** no card do lead hoje:

1. Move o lead para `info_sent` (via `iniciarAtendimento`).
2. Loga uma interação no timeline.
3. Abre `https://wa.me/55<numero>` em uma nova aba.

O usuário quer que, em vez de abrir o WhatsApp Web externo, o corretor seja **levado direto para a conversa do lead dentro do sistema** — mesmo comportamento já implementado para o botão Chat na página do lead.

## Solução

Alterar apenas `handleIniciarAtendimento` em `src/components/crm/KanbanBoard.tsx` para, após `iniciarAtendimento(leadId)` retornar sucesso:

1. Garantir que existe uma conversa para o lead usando a função `ensureConversationForLead(leadId)` já presente no arquivo (mesma que `handleSendWhatsAppNow` usa).
2. Buscar o `source_instance` dessa conversa (`global` vs `personal`) para decidir a rota:
   - `global` → `plantao`
   - `personal` (ou null/default) → `inbox`
3. Determinar o prefixo conforme `isAdmin`: `"/admin"` para admin, `"/corretor"` para corretor (mesmo padrão já usado em `plantaoBase` e em `LeadPage`).
4. Navegar internamente via `navigate(`${prefix}/${route}?conversationId=${conversationId}`)` em vez de `window.open("https://wa.me/...")`.
5. Manter o `toast.success("Atendimento iniciado!")` e o `lead_interactions.insert` que já existem.
6. Em caso de falha ao garantir/buscar a conversa, exibir um toast de erro e não navegar (não deve quebrar o fluxo se algo der errado).

As páginas `BrokerInbox`, `AdminInbox`, `BrokerPlantao` e `AdminPlantao` já sabem ler `?conversationId=` e abrir a aba correta (conforme o ajuste anterior do botão Chat), então nenhuma alteração nessas páginas é necessária.

## Detalhes técnicos

Arquivo único a editar: **`src/components/crm/KanbanBoard.tsx`**, função `handleIniciarAtendimento` (linhas ~328-345).

Pseudocódigo do novo handler:

```text
const handleIniciarAtendimento = async (leadId) => {
  const lead = allLeadsRef.current.get(leadId);
  const result = await iniciarAtendimento(leadId);
  if (!result.success) return;

  toast.success("Atendimento iniciado!");
  supabase.from("lead_interactions").insert({ ... }); // mantém como hoje

  try {
    const conversationId = await ensureConversationForLead(leadId);
    const { data: conv } = await supabase
      .from("conversations")
      .select("source_instance")
      .eq("id", conversationId)
      .maybeSingle();
    const route = conv?.source_instance === "global" ? "plantao" : "inbox";
    const prefix = isAdmin ? "/admin" : "/corretor";
    navigate(`${prefix}/${route}?conversationId=${conversationId}`);
  } catch (err) {
    console.error("Falha ao abrir conversa do lead:", err);
    toast.error("Não foi possível abrir a conversa do lead");
  }
};
```

## Fora de escopo

- Nada de RLS, edge functions, hooks de dados, migrações.
- Sem alteração visual.
- Sem mudanças em `LeadPage`, Inbox, Plantão, ou no fluxo de `iniciarAtendimento`/`useKanbanLeads`/`useLeadActions`.