## Problema

A corretora Bibiana viu a tela "Copiloto não liberado" ao clicar em Copiloto. A funcionalidade de bloqueio por `copilot_enabled` foi descontinuada — todos os corretores devem ter acesso. Mesmo com a flag `true` no banco, o gate ainda existe no código e pode bloquear em casos de cache/edge (ex.: `brokerId` ainda não resolvido, query retornando vazio, etc.), além de ser código morto que confunde.

## Mudanças (somente frontend)

1. **`src/pages/BrokerCopilotConfig.tsx`** — remover totalmente o bloco `if (!copilotEnabled) { ... tela "Copiloto não liberado" ... }`, remover o uso de `useBrokerFeatures`, e parar de passar `copilotEnabled` para o `BrokerLayout` (vira sempre `true` por default).

2. **`src/pages/BrokerDashboard.tsx`** e **`src/pages/BrokerAdmin.tsx`** — remover `useBrokerFeatures` e o prop `copilotEnabled` passado ao `BrokerLayout` (o default já é `true` em `BrokerSidebar`/`BrokerBottomNav`).

3. **`src/components/broker/BrokerSidebar.tsx`** — sempre exibir o item "copilot" (remover o filtro `if (item.id === "copilot") return copilotEnabled`).

4. **`src/components/broker/BrokerBottomNav.tsx`** — sempre incluir o item Copiloto no menu mobile (remover o `...(copilotEnabled ? [...] : [])`).

5. **`src/components/broker/BrokerLayout.tsx`** — manter o prop `copilotEnabled?: boolean` por compatibilidade, mas ele deixa de ter efeito (sempre tratado como liberado).

6. **`src/hooks/use-broker-features.ts`** — manter o arquivo para evitar quebrar imports residuais, mas os consumidores acima deixam de chamá-lo.

## Não mexer

- Coluna `copilot_enabled` no banco e o toggle em `BrokerManagement.tsx` ficam como estão (não foi pedido para remover schema; apenas o gate de UX foi extinto).
- Nenhuma alteração de lógica de negócio do Copiloto em si.

## Verificação

- Confirmar que `/corretor/copiloto` abre direto nas abas (Conexão, Copiloto, Segurança, Follow-up, Fila) para qualquer corretor, sem a tela de bloqueio.
- Item "Copiloto" sempre visível na sidebar desktop e no bottom nav mobile.
