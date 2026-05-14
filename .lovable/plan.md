## Problema 1 — Necessidade de dois toques no mobile

No `ConversationList`, cada item da conversa renderiza um botão de ação (ícone "⋮" — Marcar como lida / Arquivar) sobreposto ao card via:

```tsx
<div className="absolute right-2 top-2 hidden items-center gap-0.5 group-hover:flex">
```

Como esse menu só aparece em `:hover` do grupo, em dispositivos touch o **primeiro toque** ativa o estado hover (revelando o menu sobre o botão) e o **segundo toque** finalmente dispara o `onClick` da conversa. É o clássico "sticky hover" do iOS/Android.

### Correção
- Esconder o menu suspenso em mobile e só revelá-lo via hover em telas com ponteiro fino (desktop): trocar `hidden ... group-hover:flex` por `hidden lg:group-hover:flex` (ou `md:` se preferir manter em tablet). Em mobile, esses controles já estão acessíveis via swipe / outras ações; ocultar evita totalmente o conflito de hover/click.
- Como reforço, manter o `<button onClick={...}>` puro, sem mudar a semântica.

Resultado: no mobile o card responde no primeiro toque.

## Problema 2 — Animação de slide ao voltar para a lista

Hoje, no `BrokerInbox`, ao voltar:
- O thread tem animação `ios-push-out` (desliza para a direita) — já existe.
- A lista simplesmente reaparece, sem nenhum efeito de "vinda da esquerda".

### Melhoria
- Em mobile, quando a lista é re-exibida após sair de uma conversa, aplicar uma animação `ios-pop-in` (entrada deslizando da esquerda).
- Adicionar os keyframes em `src/index.css`:

```css
@keyframes ios-pop-in  { from { transform: translateX(-25%); opacity: .6; } to { transform: translateX(0); opacity: 1; } }
.ios-pop-in { animation: ios-pop-in 280ms cubic-bezier(.32,.72,0,1) both; will-change: transform; }
```

- No `BrokerInbox.tsx`, manter um flag (`justClosedConv`) que é setado quando `closingConv` termina, aplicar a classe `ios-pop-in` ao container da lista em mobile, e limpar via `onAnimationEnd`.

Assim a transição visual fica simétrica: thread sai pela direita ↔ lista entra pela esquerda.

## Arquivos a alterar

1. `src/components/inbox/ConversationList.tsx` — esconder o menu de ação em mobile (`hidden lg:group-hover:flex`).
2. `src/index.css` — adicionar keyframes/classe `ios-pop-in`.
3. `src/pages/BrokerInbox.tsx` — adicionar estado `justClosedConv` e classe `ios-pop-in` no container `showList` quando em mobile.

Sem mudanças de lógica de negócio — apenas UI/UX mobile.
