## Problema

No Plantão (e nas demais telas que usam `BrokerLayout`), a página inteira rola junto. Isso joga o input de mensagem do `ConversationThread` para fora da viewport — o corretor precisa scrollar para chegar nele em vez de ter a caixa fixa no rodapé e rolar apenas as mensagens.

## Causa raiz

Em `src/components/broker/BrokerLayout.tsx` (linha 61) o wrapper externo usa `min-h-[100dvh]` quando `hideMobileNav` é `false` (sempre no desktop). Com `min-h`, o container cresce com o conteúdo, então:

- O filho principal `h-full flex flex-col overflow-hidden` não tem altura definida.
- O `<main>` `flex-1 overflow-y-auto` perde o bound de altura.
- O `sticky bottom-0` do input no `ConversationThread` gruda no fim do conteúdo (não da viewport).

## Mudança

Em `src/components/broker/BrokerLayout.tsx`, trocar o wrapper externo para usar sempre altura fixa de viewport com overflow escondido:

```tsx
<div className="bg-[#0f0f12] admin-scrollbar h-[100dvh] overflow-hidden pt-safe">
```

(remove o `cn(...)` condicional entre `h-[100dvh] overflow-hidden pt-safe` e `min-h-[100dvh]` — usa sempre a versão de viewport fixa.)

O restante do layout já está pronto para isso: o container interno é `h-full flex flex-col overflow-hidden` e o `<main>` é `flex-1 min-h-0 overflow-y-auto`, então passa a rolar somente o `<main>`, com header, banner de WhatsApp e bottom nav fixos.

## Impacto

- **Plantão / Inbox**: input do `ConversationThread` fica fixo no rodapé, e o scroll acontece somente na área de mensagens. ✅
- **Outras páginas (Dashboard, Projects, Roletas, CopilotConfig, Profile)**: o `<main>` já é `overflow-y-auto`, então o scroll passa a acontecer dentro do `<main>` em vez do body — padrão de app shell, sem perda funcional.
- **Mobile com bottom nav**: `pb-20` no container principal continua reservando espaço para o bottom nav fixo.
- **Mobile dentro de conversa (`hideMobileNav` true)**: comportamento já correto, mantido.

## Arquivos

- `src/components/broker/BrokerLayout.tsx` — uma linha alterada (wrapper externo).
