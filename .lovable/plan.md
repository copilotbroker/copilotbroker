## Problema

Ao abrir uma conversa no mobile, a página inteira fica com scroll vertical e o campo de digitação aparece "abaixo" da tela — é preciso rolar para encontrá-lo.

## Causa

Os layouts misturam `min-h-screen` (no wrapper externo) com `h-screen`/`h-[100dvh]` (no wrapper interno) e ainda aplicam `pt-safe` no externo. No iOS:

- `100vh` > viewport visível (inclui barras do navegador), enquanto `100dvh` é o real.
- `min-h-screen + pt-safe` faz o documento ficar maior que a viewport, gerando o scroll vertical e empurrando o composer (rodapé do `ConversationThread`) para fora da área visível.

Locais afetados:
- `src/components/broker/BrokerLayout.tsx` — wrapper externo `min-h-screen`, interno `h-screen`.
- `src/pages/AdminInbox.tsx` — wrapper externo `min-h-screen ... pt-safe`.
- `src/pages/AdminPlantao.tsx` — mesmo padrão do AdminInbox.

## Plano

1. **`BrokerLayout.tsx`**
   - Trocar wrapper externo `min-h-screen` → `h-[100dvh] overflow-hidden` quando `hideMobileNav` (e usar `min-h-[100dvh]` no caso geral para não regredir o kanban).
   - Trocar wrapper interno `h-screen` → `h-[100dvh]` (ou `h-full`) para alinhar com o externo.
   - Aplicar `pt-safe` no `BrokerHeader` (ou no próprio wrapper interno) em vez do externo, evitando somar safe-area + 100dvh.

2. **`AdminInbox.tsx` e `AdminPlantao.tsx`**
   - Trocar `min-h-screen ... pt-safe` por `h-[100dvh] overflow-hidden` no wrapper externo quando `hideMobileNav`. Caso contrário, manter `min-h-[100dvh]`.
   - Mover o `pt-safe` para dentro (no header/topo da lista), para que o safe-area não estenda o documento além de `100dvh`.
   - Manter o cálculo já existente: quando `hideMobileNav` o container interno usa `h-[100dvh]`; quando visível, `h-[calc(100dvh-80px)]` (mais o safe-area do bottom nav).

3. **Verificação**
   - Testar no preview mobile (iPhone) abrindo uma conversa em: Broker WhatsApp pessoal, Broker Plantão, Admin Inbox e Admin Plantão.
   - Confirmar: sem scroll na página, composer visível na base, header e bottom nav (quando aplicável) sem sobreposição.

Sem mudanças de lógica/dados — apenas ajustes de layout/altura.