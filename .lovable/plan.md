

## Roleta com escopo "Todas Landing Pages da Imobiliária"

### Problema
Hoje, ao criar um novo empreendimento da imobiliária (ex: "Sentower", "Aura Legano"), o líder/admin precisa lembrar de adicioná-lo manualmente à roleta Sharks em `roletas_empreendimentos`. Se esquecer, leads desse empreendimento não entram na distribuição.

### Solução
Adicionar uma opção **"Todas as Landing Pages da Imobiliária"** ao criar/editar uma roleta de origem `landing_page`. Quando marcada, a roleta passa a receber automaticamente leads de **qualquer empreendimento da imobiliária** (presente e futuro), sem precisar vincular um por um.

Critério de "landing page da imobiliária": projetos com `created_by_broker_id IS NULL` (projetos institucionais). Landing pages criadas por corretores (`created_by_broker_id` preenchido) **não** entram nesse escopo automático — o corretor continua dono dos leads das suas próprias páginas.

### Mudanças

**1. Banco de dados (migration)**
- Adicionar coluna `escopo_empreendimentos text NOT NULL DEFAULT 'especifico'` na tabela `roletas`, com valores possíveis `'especifico'` (atual, lista manual) ou `'todas_landing_pages'` (catch-all).
- Garantir, via trigger ou índice parcial, que apenas **uma roleta ativa** possa ter `escopo_empreendimentos = 'todas_landing_pages'` por vez (evita conflito de distribuição).

**2. Edge function `roleta-distribuir`**
- Antes de buscar `roletas_empreendimentos` pelo `project_id`, verificar se o projeto é da imobiliária (`created_by_broker_id IS NULL`).
- Se for, dar prioridade a uma roleta ativa com `escopo_empreendimentos = 'todas_landing_pages'`. Se existir, usar essa roleta.
- Caso contrário, manter o comportamento atual (busca por vínculo explícito em `roletas_empreendimentos`).

**3. UI em `src/components/admin/RoletaManagement.tsx`**
- No formulário de **Nova Roleta**, quando "Origem dos leads" = "Landing Pages":
  - Adicionar um RadioGroup acima da lista de empreendimentos:
    - ◯ **Todas as Landing Pages da Imobiliária** *(recomendado — inclui automaticamente novos empreendimentos)*
    - ◯ **Selecionar empreendimentos específicos**
  - Quando "Todas..." está marcado, **esconder** a lista de checkboxes de empreendimentos.
- Na **edição** (card expandido) de uma roleta `landing_page`:
  - Mostrar uma seção "Escopo" com o mesmo RadioGroup, salvando direto via `updateRoleta(id, { escopo_empreendimentos: ... })`.
  - Quando o escopo é "todas_landing_pages", esconder/desabilitar o bloco "Adicionar empreendimento" e mostrar um aviso: *"Esta roleta recebe leads de todas as landing pages institucionais automaticamente."*
- Adicionar um Badge no header do card: `Badge` "Todas LPs" quando aplicável.

**4. Hooks/Tipos**
- Atualizar `src/types/roleta.ts` adicionando `escopo_empreendimentos: 'especifico' | 'todas_landing_pages'`.
- Sem mudança necessária em `use-roletas.ts` (já passa updates genéricos via `updateRoleta`).

### Observação
A roleta Sharks existente continuará funcionando exatamente como antes (`escopo_empreendimentos = 'especifico'`, default). O líder/admin deve editá-la e mudar para "Todas as Landing Pages da Imobiliária" para ativar o catch-all. Após isso, novos empreendimentos institucionais entram automaticamente na distribuição.

