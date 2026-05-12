## Objetivo

Tornar os gestos de navegação mais permissivos no mobile:
- **Arrastar para a direita** (em qualquer ponto da tela) → voltar (`history.back()`)
- **Arrastar para a esquerda** (em qualquer ponto da tela) → avançar (`history.forward()`)

Hoje o gesto só dispara se começar nos primeiros 24px da borda esquerda, e só existe o "voltar".

## Arquivo afetado

`src/hooks/use-swipe-back-gesture.ts` (único hook responsável pelos gestos, registrado globalmente em `App.tsx`).

## Mudanças

1. **Remover restrição de borda** — tirar a checagem `t.clientX > EDGE_PX` no `touchstart`. Qualquer ponto inicial vale.
2. **Detectar direção no `touchend`**:
   - `dx > +MIN_DX` → `navigate(-1)` (voltar)
   - `dx < -MIN_DX` → `navigate(1)` (avançar)
3. **Manter salvaguardas existentes** para evitar falsos positivos:
   - Desktop (≥1024px) continua desativado.
   - Opt-out via `[data-no-swipe-back]`, inputs, textareas, sliders, carrosséis (`.embla`, `.swiper`), `[data-radix-scroll-area-viewport]`, e `contenteditable`.
   - Limite de tempo (`MAX_MS = 600ms`) e razão `dy/|dx| < 0.6` para garantir intenção horizontal.
4. **Aumentar levemente o `MIN_DX`** de 80 para ~90px, já que o gesto agora pode começar em qualquer lugar (reduz conflitos com toques curtos / scroll horizontal acidental).
5. **Renomear o hook?** Não — manter `use-swipe-back-gesture.ts` para não mexer no import em `App.tsx`. Apenas atualizar o comentário JSDoc no topo descrevendo o novo comportamento (voltar + avançar, sem borda).

## Observações técnicas

- `navigate(1)` em React Router só avança se houver entrada futura no histórico (igual ao botão "avançar" do navegador). Caso contrário é no-op — comportamento esperado.
- O Safari iOS continuará tendo seu próprio gesto de borda nativo; nosso handler complementa, não conflita (ambos chamam `history.back()`).
- Nenhuma mudança em `App.tsx`, layouts ou páginas.

## Riscos

- Conflito com componentes que usam swipe horizontal interno (carrosséis, sliders de range, scroll horizontal). Mitigado pelas exclusões já presentes; se aparecer caso novo, basta marcar o container com `data-no-swipe-back`.
