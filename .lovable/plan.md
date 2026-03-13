

## Plano: URL de corretor no formato `/corretor/cidade/projeto`

### Situacao atual
- Projetos criados por corretores usam `/:citySlug/:projectSlug/:brokerSlug` (rota publica dinamica)
- O `buildUrl` no hook gera URLs como `/porto-alegre/casa-bela-vista/joao-silva`

### Proposta
Para projetos criados pelo proprio corretor, a URL deve seguir o padrao `/corretor/:citySlug/:projectSlug` — sem o broker slug na URL, ja que o projeto pertence ao corretor.

### Alteracoes

**1. Nova rota no `App.tsx`**
- Adicionar rota `/corretor/:citySlug/:projectSlug` antes das rotas dinamicas
- Essa rota renderiza uma nova page que carrega o projeto pelo `created_by_broker_id` e exibe a landing page

**2. Nova page `src/pages/BrokerProjectLanding.tsx`**
- Recebe `citySlug` e `projectSlug` dos params
- Busca o projeto na tabela `projects` por `city_slug` + `slug`
- Renderiza `DynamicLandingPage` (se tiver `landing_content`) ou o layout generico
- O formulario usa o `created_by_broker_id` como `brokerId` automaticamente

**3. Atualizar `buildUrl` no `use-broker-projects.ts`**
- Para projetos onde `created_by_broker_id === brokerId`, gerar `/corretor/${city_slug}/${slug}` em vez de `/${city_slug}/${slug}/${brokerSlug}`

**4. Atualizar `handlePublish` no `ProjectWizard.tsx`**
- A URL salva no `broker_projects.url` deve usar o novo formato `/corretor/cidade/projeto`

### Arquivos
- `src/App.tsx` — adicionar rota
- `src/pages/BrokerProjectLanding.tsx` — nova page
- `src/hooks/use-broker-projects.ts` — atualizar `buildUrl`
- `src/components/admin/ProjectWizard.tsx` — atualizar URL no publish

