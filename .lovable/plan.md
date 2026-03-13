

## Plano: Renomear abas e trocar ordem na página de Empreendimentos do corretor

### Alterações em `src/pages/BrokerProjects.tsx`

1. **Título da página** (linha 247): `"Meus Empreendimentos"` → `"Landing Pages"`

2. **Trocar ordem das abas** (linhas 288-298): Colocar "Minha Carteira" primeiro, "Empresa" depois

3. **Renomear aba "Empresa"** → `"Empreendimentos"`

4. **Default tab**: `defaultValue="empresa"` → `defaultValue="carteira"` (já que agora é a primeira)

### Resultado esperado

```
Título: "Landing Pages"
Abas:  [Minha Carteira (N)] [Empreendimentos (N)]
```

### Sidebar e Bottom Nav

Também atualizar o label "Empreendimentos" nos componentes de navegação (`BrokerSidebar.tsx`, `BrokerBottomNav.tsx`, `MobileBottomNav.tsx`) para "Landing Pages", mantendo consistência.

