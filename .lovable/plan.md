

## Fix: Lista de Corretores Aparece Embaixo da Roleta Errada

### Diagnóstico

No `BrokerRoletas.tsx`, o componente renderiza **dois loops separados**:

1. **Linhas 175-226**: Loop dos headers (nome da roleta + botão In/Out)
2. **Linhas 230-272**: Loop dos painéis expandidos (lista de corretores)

Como os painéis expandidos ficam em um segundo `.map()` fora do primeiro, a lista de corretores de "Plantão Enove" aparece sempre **após todas as roletas** (incluindo "Sharks"), causando confusão visual.

```text
Atual:                          Corrigido:
┌─────────────────────┐         ┌─────────────────────┐
│ Plantão Enove  [In] │         │ Plantão Enove  [In] │
├─────────────────────┤         │  ├ Márcio #1         │
│ Sharks         [In] │         │  ├ Davi #2           │
├─────────────────────┤         ├─────────────────────┤
│ Lista do Plantão ←? │         │ Sharks         [In] │
└─────────────────────┘         └─────────────────────┘
```

### Solução

Mover o painel expandido para **dentro** do primeiro loop, logo abaixo do header de cada roleta. Remover o segundo `.map()`.

### Arquivo: `src/components/broker/BrokerRoletas.tsx`

- Dentro do `groups.map` (linha 175), após o `div` do header (linha 223), inserir o bloco de membros expandidos (atualmente nas linhas 236-271) condicionado a `isExpanded`
- Remover o segundo loop (linhas 229-272)

### O que NÃO muda
- Lógica de check-in/out, realtime, fetch
- Visual dos items e badges

