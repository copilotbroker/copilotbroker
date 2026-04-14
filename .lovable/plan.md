

## Plan: Inverter Cores WhatsApp — Corretor → Verde, Plantão → Purple

### Resumo
Trocar a codificação de cores: tudo relacionado à instância do **corretor (pessoal)** será **verde/emerald**, e tudo relacionado ao **Plantão (global)** será **purple/roxo**.

### Arquivos a alterar

**1. `src/components/icons/WhatsAppIcon.tsx`**
- `WhatsAppPlantaoIcon`: trocar `#22c55e` (green) → `#a855f7` (purple)
- `WhatsAppInboxIcon`: trocar `#a855f7` (purple) → `#22c55e` (green)
- Atualizar comentários

**2. `src/components/inbox/ConversationThread.tsx`**
- Inverter todas as referências: onde `global` usa `emerald` → usar `purple`; onde personal usa `purple` → usar `emerald`
- Avatar global: `bg-emerald-900/60 text-emerald-400` → `bg-purple-900/60 text-purple-400`
- Badge atribuído: `bg-emerald-600/20 text-emerald-400 border-emerald-500/30` → purple
- Botão devolver ao plantão: `text-emerald-400` → `text-purple-400`
- Divider de transição de instância: swap emerald↔purple
- Balões outbound: swap emerald↔purple
- Sender name: swap
- Textarea border: swap
- Todas as condições `isGlobalInstance ? emerald : purple` → `isGlobalInstance ? purple : emerald`

**3. `src/components/inbox/ConversationList.tsx`**
- Avatar global: `bg-emerald-900/60 text-emerald-400` → `bg-purple-900/60 text-purple-400`
- Avatar personal: `bg-purple-900/60 text-purple-400` → `bg-emerald-900/60 text-emerald-400` (ou manter initial com green)
- Badge broker em global: emerald → purple
- Badge broker em pessoal: purple → emerald

**4. `src/pages/LeadPage.tsx`**
- Chat button: `isGlobalInstance ? emerald : purple` → `isGlobalInstance ? purple : emerald`
- WhatsApp message form: swap todas as condições emerald↔purple
- Botões Follow-Up e Cadência (esses são do corretor): manter emerald (já está correto pois são ações do corretor)
- Botão "Enviar WhatsApp" no card: swap emerald↔purple nas condições `isGlobalInstance`

**5. `src/components/admin/MobileBottomNav.tsx`**
- `inbox`: trocar de `purple` → `green` (emerald)
- `plantao`: trocar de `green` → `purple`

**6. `src/components/admin/AdminSidebar.tsx`**
- Inbox (isInbox): trocar `hsl(145,80%,55%)` (green) mantém verde ✓ (corretor = verde, já correto)
- Plantão (isPlantao): trocar `orange-400` → `purple-400`/`purple-500`

**7. `src/components/broker/BrokerSidebar.tsx`**
- Inbox: `hsl(145,80%,55%)` → mantém verde ✓
- Plantão: `orange-400` → `purple-400`

**8. `src/components/broker/BrokerBottomNav.tsx`**
- Plantão: `orange-400` → `purple-400`
- Inbox: `hsl(145,80%,55%)` → mantém verde ✓

### Detalhes técnicos

Regra geral de substituição nas condições `isGlobalInstance`:
- Onde era `emerald` (global) → `purple`
- Onde era `purple` (personal) → `emerald`

Nos sidebars/bottom navs:
- Plantão que era `orange` → `purple`
- Inbox que era `green/hsl(145)` → mantém verde (já é a cor desejada para o corretor)

Tonalidades preservadas: usar as mesmas escalas (400, 500/10, 500/20, 500/30, 600/20, 900/60) apenas trocando a família de cor.

