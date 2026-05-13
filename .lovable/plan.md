## Objetivo
Remover o gating de Inbox (instância pessoal do WhatsApp) por corretor, liberando a funcionalidade para todos. O Copiloto continua restrito por `copilot_enabled`.

## Escopo de mudanças

### 1. `src/pages/BrokerInbox.tsx`
- Remover importação de `useBrokerFeatures`.
- Remover a chamada `useBrokerFeatures(brokerId)` e as variáveis `inboxEnabled`, `featuresLoading`.
- Remover o bloco condicional `if (!inboxEnabled)` que renderiza a tela "Inbox não liberado" (linhas 338-356).
- Remover a prop `inboxEnabled={inboxEnabled}` do `<BrokerLayout>`.

### 2. `src/components/broker/BrokerSidebar.tsx`
- Remover a prop `inboxEnabled` da interface e dos parâmetros.
- Remover o filtro `if (item.id === "inbox") return inboxEnabled;` em `navigationItems` (o item "inbox" sempre aparece).

### 3. `src/components/broker/BrokerBottomNav.tsx`
- Remover a prop `inboxEnabled` da interface e dos parâmetros.
- No `navItems`, remover o condicional `...(inboxEnabled && inboxTab ? [...] : [])` — o item inbox sempre entra.
- No `moreMenuItems`, remover o condicional `...(inboxEnabled ? [...] : [])` — o item "Meu WhatsApp" sempre entra.

### 4. `src/components/broker/BrokerLayout.tsx`
- Remover a prop `inboxEnabled` da interface e dos parâmetros.
- Deixar de repassar `inboxEnabled` para `<BrokerSidebar>` e `<BrokerBottomNav>`.

### 5. Páginas que repassam `inboxEnabled` para `BrokerLayout`
- **`src/pages/BrokerAdmin.tsx`**: remover `inboxEnabled` do destructuring de `useBrokerFeatures` e da prop `inboxEnabled` no `<BrokerLayout>`.
- **`src/pages/BrokerDashboard.tsx`**: idem.
- **`src/pages/BrokerCopilotConfig.tsx`**: idem (aqui `inboxEnabled` é desestruturado de `useBrokerFeatures` mas só usado para repassar; manter `copilotEnabled`).

### 6. `src/hooks/use-broker-features.ts`
- Remover `inboxEnabled` do objeto retornado. Manter `copilotEnabled` e `isLoading`.
- Manter a query buscando `inbox_enabled` no banco se necessário para compatibilidade interna, ou removê-lo do `select` e do retorno.

## Não alterar
- Coluna `inbox_enabled` no banco (campo legado, sem efeito na UI).
- Nenhuma política de RLS ou backend.
- Gating do Copiloto (`copilot_enabled`).
- Sidebar desktop (fora do escopo da prop).

## Resultado esperado
Todos os corretores passam a ver e acessar `/corretor/inbox` normalmente. O item "Meu WhatsApp" aparece sempre na bottom-nav mobile e na sidebar desktop. O Copiloto continua restrito como antes.