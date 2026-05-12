## Problema

1. Dentro de uma conversa (Inbox/Plantão), o "voltar" deveria fechar a conversa e mostrar a lista. Mas como a seleção é estado interno (não rota), `navigate(-1)` pula para a página anterior do histórico (ex.: home).
2. A transição entre lista ↔ conversa é "seca", sem o deslizamento estilo iOS.

## Plano

### 1. Tornar o swipe-back consciente do contexto da página

Criar um pequeno registry global de "back handlers" que páginas podem registrar. O hook de gesto consulta esse registry antes de cair no `navigate(-1)`.

**Novo arquivo: `src/hooks/use-back-handler.ts`**
- Stack de handlers (array de funções com prioridade LIFO).
- `useBackHandler(handler, enabled)` registra/desregistra automaticamente.
- Exporta `runTopBackHandler(): boolean` — executa o último handler registrado e retorna `true`; `false` se vazio.

**Atualizar `src/hooks/use-swipe-back-gesture.ts`**
- No swipe direita: chamar `runTopBackHandler()`. Se retornar `false`, manter o `navigate(-1)` atual.
- Swipe esquerda: continua `navigate(1)`.

**Registrar handlers nas páginas com seleção interna:**
- `AdminInbox`, `BrokerInbox`, `AdminPlantao`, `BrokerPlantao`:
  - Quando `viewingLeadId` ativo → handler chama `handleBackFromLead`.
  - Senão quando `selectedConversation` ativa → handler chama `handleBack`.
  - Senão não registra (deixa cair no histórico).

### 2. Transição estilo iOS (push/pop horizontal)

Substituir o atual `animate-in slide-in-from-right-5 duration-200` por animação de "page push" mais coesa, aplicada na coluna da conversa e na lista, no mobile.

Adicionar utilitários em `tailwind.config.ts` (keyframes) e/ou classes em `src/index.css`:
- `slide-in-from-right` (entrada da conversa, ~280ms, ease-out cubic-bezier(0.32, 0.72, 0, 1) — curva usada pelo iOS).
- `slide-out-to-right` (saída ao voltar).
- `slide-in-from-left-soft` / `slide-out-to-left-soft` para a lista (parallax sutil de ~30% para imitar o iOS, com leve fade).

Aplicar nas colunas (mobile only) de:
- `src/pages/AdminInbox.tsx`
- `src/pages/BrokerInbox.tsx`
- `src/pages/AdminPlantao.tsx`
- `src/pages/BrokerPlantao.tsx`

Como a coluna de conversa só monta quando há `selectedConversation`, o "exit" precisa de um pequeno wrapper que mantenha o nó por ~280ms ao desmontar. Opções:
- (Preferida, leve) Usar um state `isClosing` controlado por `handleBack`: marca `isClosing=true`, aplica classe `slide-out-to-right`, em `onAnimationEnd` limpa `selectedConversation` e `isClosing`.
- Mesma técnica para a lista quando entra a conversa (entrada) — só precisa de classe de entrada, sem desmontar.

### Detalhes técnicos

```ts
// use-back-handler.ts
const stack: Array<() => boolean | void> = [];
export function runTopBackHandler() {
  const fn = stack[stack.length - 1];
  if (!fn) return false;
  const r = fn();
  return r !== false;
}
export function useBackHandler(handler: () => boolean | void, enabled: boolean) {
  useEffect(() => {
    if (!enabled) return;
    stack.push(handler);
    return () => { stack.splice(stack.indexOf(handler), 1); };
  }, [enabled, handler]);
}
```

```ts
// use-swipe-back-gesture.ts (trecho do touchend)
if (dx > 0) {
  if (!runTopBackHandler()) {
    if (window.history.length > 1) navigate(-1);
  }
} else {
  navigate(1);
}
```

```css
/* index.css */
@keyframes ios-push-in   { from { transform: translateX(100%); } to { transform: translateX(0); } }
@keyframes ios-push-out  { from { transform: translateX(0); } to { transform: translateX(100%); } }
@keyframes ios-pop-in    { from { transform: translateX(-30%); opacity:.6 } to { transform: translateX(0); opacity:1 } }
@keyframes ios-pop-out   { from { transform: translateX(0); opacity:1 } to { transform: translateX(-30%); opacity:.6 } }
.ios-push-in  { animation: ios-push-in  280ms cubic-bezier(.32,.72,0,1) both; }
.ios-push-out { animation: ios-push-out 260ms cubic-bezier(.32,.72,0,1) both; }
.ios-pop-in   { animation: ios-pop-in   280ms cubic-bezier(.32,.72,0,1) both; }
.ios-pop-out  { animation: ios-pop-out  260ms cubic-bezier(.32,.72,0,1) both; }
```

```tsx
// nas páginas (mobile)
const [closingConv, setClosingConv] = useState(false);
const handleBack = useCallback(() => {
  if (!isMobile) { setSelectedConversation(null); return; }
  setClosingConv(true);
}, [isMobile]);

useBackHandler(() => { handleBack(); }, isMobile && !!selectedConversation && !viewingLeadId);
useBackHandler(() => { handleBackFromLead(); }, isMobile && !!viewingLeadId);

// na coluna da conversa:
<div
  className={`... ${isMobile ? (closingConv ? "ios-push-out" : "ios-push-in") : ""}`}
  onAnimationEnd={() => { if (closingConv) { setClosingConv(false); setSelectedConversation(null); } }}
>
```

### Arquivos a alterar
- `src/hooks/use-back-handler.ts` (novo)
- `src/hooks/use-swipe-back-gesture.ts`
- `src/index.css` (keyframes iOS)
- `src/pages/AdminInbox.tsx`, `BrokerInbox.tsx`, `AdminPlantao.tsx`, `BrokerPlantao.tsx` (registrar handler + classes de animação + fluxo de fechamento animado)

### Fora do escopo
- Não mudar o swipe esquerda (avançar) — segue como hoje.
- Não mexer em rotas ou navegação desktop.