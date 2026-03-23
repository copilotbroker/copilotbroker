

# Compactar Roletas e maximizar espaço do Kanban

## Problema
O `BrokerRoletas` ocupa muito espaço vertical (padding, espaçamento, cards empilhados verticalmente), reduzindo a área visível do Kanban no mobile.

## Correção

### `src/components/broker/BrokerRoletas.tsx`
Transformar o layout em uma **linha horizontal compacta** com scroll:

1. **Container principal**: reduzir padding de `p-4 space-y-3` para `p-2`
2. **Header + cards na mesma linha**: remover header separado "Minhas Roletas", integrar o ícone inline
3. **Cards das roletas em linha horizontal**: `flex flex-row gap-2 overflow-x-auto` em vez de `space-y-3` vertical
4. **Cada card compacto**: layout horizontal com nome da roleta + status + botão check-in/out em uma única linha, sem subtextos (ordem, tempo reserva) visíveis por default
5. **Fila expandível**: manter funcionalidade mas colapsada por default
6. **Altura total**: ~48-56px quando colapsado (vs ~120px+ atual por roleta)

Layout compacto:
```text
[🔄] [Roleta A ● Online | Check-out] [Roleta B ○ Offline | Check-in]
```

### `src/pages/BrokerAdmin.tsx`
Manter `gap-4` → `gap-2` no wrapper para reduzir espaço entre roletas e kanban.

