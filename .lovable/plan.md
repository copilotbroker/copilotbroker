

# Substituir Inbox por Agenda no bottom nav mobile do Corretor

## Problema
A Agenda não está acessível no mobile porque o bottom nav mostra Inbox no lugar. O usuário quer trocar: remover Inbox da barra inferior e colocar Agenda.

## Alteração

### Arquivo: `src/components/broker/BrokerBottomNav.tsx`

1. **Trocar `inbox` por `agenda`** na construção do `navItems` (linha 52):
   - Substituir o item inbox pelo item agenda do `BROKER_ROUTE_TABS`
   - Remover badge de unread do inbox nesse slot

2. **Atualizar `handleClick`** (linha 70): adicionar `"agenda"` ao bloco que navega via `getBrokerPathByTab`

3. **Atualizar `getItemColor` e `getActiveIndicator`**: incluir `"agenda"` com estilo amarelo (mesmo do CRM)

4. **Mover Inbox para o menu "Mais"** (`moreMenuItems`): adicionar item Inbox com badge de unread, para que ainda fique acessível

O bottom nav ficará:
```text
[Agenda]  [CRM/Lista]  [+ FAB]  [Copiloto]  [⋮ Mais]
```

E no menu "Mais": Inbox (com badge), Modo Lista, Notificações, Roletas, Landing Pages, Sair.

