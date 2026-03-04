

## Proposta: Preview ao Vivo do Novo Esquema de Cores

Como não consigo capturar screenshots da Inbox (requer login), proponho **aplicar as mudanças diretamente** — assim você verá o resultado ao vivo no preview. Se não gostar, posso reverter instantaneamente ou ajustar.

### Antes de aplicar, aqui está o comparativo textual:

```text
╔══════════════════════════════════════════════════════════╗
║  ANTES (atual)              →  DEPOIS (proposto)        ║
╠══════════════════════════════════════════════════════════╣
║  Fundo: #141417 (preto)     →  #0F1117 (slate-950)      ║
║  Cards: #1e1e22 (cinza)     →  #1A1D27 (slate-900)      ║
║  Bordas: #2a2a2e            →  #2A2D37 (slate-800)      ║
║  Avatar: amarelo neon       →  indigo-500 suave          ║
║  Seleção: amarelo/15        →  indigo-500/10             ║
║  Botão enviar: amarelo      →  indigo-500                ║
║  Bolha outbound: verde/20   →  indigo-600/20             ║
║  Spinner: amarelo           →  indigo-500                ║
║  Hover ícones: amarelo      →  indigo-400                ║
╚══════════════════════════════════════════════════════════╝
```

### Componentes afetados (apenas Inbox)
1. `ConversationList.tsx` — KPIs, filtros, avatares, card selecionado
2. `ConversationThread.tsx` — header, bolhas, composer, banners
3. `LeadContextPanel.tsx` — header e cards
4. `CadenceCountdown.tsx` — card de cadência

### O que NÃO muda
- Resto do app (admin, CRM, landing pages)
- Cores semânticas (vermelho=risco, laranja=quente, verde=copilot ativo)
- Layout e funcionalidades

### Abordagem
Aplicar as mudanças e você avalia ao vivo. Se não aprovar, reverto em um clique.

