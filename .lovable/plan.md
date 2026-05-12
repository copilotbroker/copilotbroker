## Problema

Após corrigir o scroll com `h-[100dvh] overflow-hidden`, removi o `pt-safe` do wrapper externo nos modos com conversa aberta no mobile. Resultado: o header da conversa fica embaixo do notch do iPhone.

## Solução

Reativar `pt-safe` no wrapper externo (mantendo `h-[100dvh] overflow-hidden`), aproveitando que o `box-sizing: border-box` padrão do Tailwind faz o padding ser descontado da altura. Para isso o filho interno precisa usar `h-full` (não `h-[100dvh]`) para herdar a altura já reduzida pelo safe-area-top.

## Mudanças

1. **`src/components/broker/BrokerLayout.tsx`**
   - Wrapper externo (l.63): `h-[100dvh] overflow-hidden pt-safe` quando `hideMobileNav`.
   - Wrapper interno (l.103): trocar `h-[100dvh]` → `h-full`.

2. **`src/pages/AdminInbox.tsx`**
   - Wrapper externo (l.312): `h-[100dvh] overflow-hidden pt-safe` quando `hideMobileNav`.
   - Container interno (l.316): quando `hideMobileNav`, usar `h-full` (em vez de `h-[100dvh]`).

3. **`src/pages/AdminPlantao.tsx`**
   - Mesmas mudanças do AdminInbox.

Sem alterações de lógica — apenas redistribuição do safe-area com `box-border`.