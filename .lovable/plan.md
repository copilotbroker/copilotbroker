

## Ajuste: Cor da cadência/follow-up no LeadPage

**Problema:** Na página do lead, os elementos abaixo estão fixos em **roxo**, dando a impressão de que as mensagens saem da Instância Global (Plantão), quando na verdade saem do **WhatsApp pessoal do corretor** (deveriam ser verde, conforme padrão `mem://ux/inbox-communication-source-visual-coding`).

### Mudanças em `src/pages/LeadPage.tsx`

**1. Indicador "Cadência ativa" (linhas 618–646)** → trocar para **verde** (cadências automáticas sempre rodam pela instância pessoal do corretor via `whatsapp-message-sender`):
- `bg-purple-500/10 border-purple-500/20` → `bg-emerald-500/10 border-emerald-500/20`
- `bg-purple-400` (dot) → `bg-emerald-400`
- `text-emerald-300` → mantém (já estava verde, vira coerente)

**2. Botão "Follow-Up" (linha 661)** → **verde** (mesmo motivo: roda na instância pessoal):
- `border-purple-500/20 text-purple-400 hover:bg-purple-500/10` → `border-emerald-500/20 text-emerald-400 hover:bg-emerald-500/10`

**3. Botão "+ Cadência" (linha 665)** → **verde** (mesma justificativa):
- `border-purple-500/20 text-purple-400 hover:bg-purple-500/10` → `border-emerald-500/20 text-emerald-400 hover:bg-emerald-500/10`

**4. Botão "Enviar WhatsApp" (linhas 721–728)** → tornar **dinâmico** baseado em `isGlobalInstance` (a variável já existe e já é usada no formulário expandido logo abaixo):
- Substituir `bg-purple-600 hover:bg-purple-700` fixo por:
  - `isGlobalInstance ? "bg-purple-600 hover:bg-purple-700" : "bg-emerald-600 hover:bg-emerald-700"`
- Ajustar também a sombra (`shadow-emerald-900/30` está incoerente quando roxo) → manter neutra ou condicional.

### Resultado esperado
- Lead com instância **pessoal** (caso do Guilherme): botão "Enviar WhatsApp", indicador de cadência, botão Follow-Up e + Cadência ficam todos **verdes**.
- Lead com conversa atrelada à **instância global**: somente o botão "Enviar WhatsApp" fica **roxo** (correto, pois realmente sai do Plantão). Cadência e Follow-Up continuam verdes pois sempre usam a instância pessoal.

Sem mudanças em hooks, banco ou outros componentes — apenas classes Tailwind no `LeadPage.tsx`.

