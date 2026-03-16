
Objetivo
- Resolver definitivamente o bug da sidebar no admin para que cada área principal tenha navegação previsível, URL própria e destaque correto, sem “cair no kanban” ao sair de páginas como Copiloto.

Diagnóstico
- Hoje o admin mistura dois modelos:
  - áreas internas da rota `/admin` controladas por `activeTab` em estado local (`crm`, `leads`, `brokers`, `roletas`, `projects`, `analytics`)
  - páginas separadas com rota própria (`/admin/copiloto`, `/admin/inbox`)
- A sidebar e o menu mobile chamam `onTabChange`, mas em páginas separadas como `AdminCopilotConfig` esse callback apenas faz `navigate("/admin")`, ignorando qual item foi clicado.
- Resultado: ao clicar em “Inteligência” dentro de Copiloto, a navegação volta para `/admin` sem contexto e abre o tab padrão (`crm`/kanban).

Solução definitiva
1. Tornar a navegação do admin orientada por URL
- Substituir o `activeTab` local do `Admin.tsx` por um estado derivado da URL.
- Adotar rotas explícitas para os módulos principais, por exemplo:
  - `/admin/crm`
  - `/admin/leads`
  - `/admin/corretores`
  - `/admin/roletas`
  - `/admin/empreendimentos`
  - `/admin/inteligencia`
  - manter `/admin/inbox`
  - manter `/admin/copiloto`

2. Centralizar o mapa de navegação do admin
- Criar uma única fonte de verdade para relacionar:
  - `id` do item
  - rota
  - label
  - regra de ativo
- Fazer `AdminSidebar`, `MobileBottomNav` e `AdminHeader` consumirem esse mapa, em vez de dependerem de `onTabChange` com lógica espalhada.

3. Atualizar o shell do admin para navegação real
- No `AdminLayout`, trocar o contrato de “troca de tab” por navegação por rota.
- O item clicado deve sempre navegar para sua rota correspondente, independentemente da página atual.

4. Refatorar `Admin.tsx`
- Fazer `Admin.tsx` responder a uma rota/módulo atual em vez de guardar o módulo em `useState`.
- Renderizar cada seção com base no segmento atual da rota.
- Preservar filtros e busca apenas onde fizer sentido; opcionalmente mover alguns estados para query string depois.

5. Ajustar páginas especiais
- `AdminCopilotConfig` e `AdminInbox` devem usar o mesmo mecanismo de navegação do restante do admin.
- Assim, clicar em “Inteligência” dentro de Copiloto levará diretamente para `/admin/inteligencia`, e não para o padrão do CRM.

6. Compatibilidade e estabilidade
- Manter `/admin` redirecionando para uma rota padrão explícita, como `/admin/crm`.
- Garantir que o item ativo da sidebar seja calculado pela rota atual.
- Revisar breadcrumbs/títulos para refletirem a rota, não estado interno.

Arquivos principais a alterar
- `src/App.tsx`
- `src/pages/Admin.tsx`
- `src/pages/AdminCopilotConfig.tsx`
- `src/pages/AdminInbox.tsx`
- `src/components/admin/AdminLayout.tsx`
- `src/components/admin/AdminSidebar.tsx`
- `src/components/admin/MobileBottomNav.tsx`
- `src/components/admin/AdminHeader.tsx`

Resultado esperado
- Cada módulo do admin passa a ter URL própria.
- Sidebar e menu mobile funcionam corretamente a partir de qualquer página.
- O item ativo sempre corresponde à tela atual.
- Navegar de Copiloto para Inteligência, Corretores, Roletas etc. deixa de abrir o kanban por engano.

Detalhe técnico
- O problema não é só visual: é de arquitetura de navegação.
- A correção definitiva é eliminar a dependência de `activeTab` local como fonte principal de navegação no admin e usar a rota como verdade única.

Critérios de aceite
- Em `/admin/copiloto`, clicar em “Inteligência” abre a tela de inteligência diretamente.
- Em `/admin/copiloto`, clicar em “Corretores”, “Roletas” ou “Empreendimentos” abre o módulo correto.
- Em qualquer tela admin, a sidebar destaca corretamente o item ativo.
- `/admin` redireciona consistentemente para a área padrão sem comportamento ambíguo.

<lov-actions>
<lov-suggestion message="Test the admin navigation end-to-end by clicking every sidebar and mobile menu item from Copiloto, Inbox, and CRM to confirm each one opens the correct route.">Verify that it works</lov-suggestion>
<lov-suggestion message="Implement the definitive admin navigation fix by giving each admin module its own route and making the sidebar route-driven instead of state-driven.">Fix admin sidebar routing</lov-suggestion>
<lov-suggestion message="Add URL query persistence for filters and search in the admin modules so refreshing the page preserves the current view state.">Persist admin filters in URL</lov-suggestion>
<lov-suggestion message="Refactor the broker area to use the same route-driven navigation architecture as the admin area for consistency and fewer navigation bugs.">Align broker navigation</lov-suggestion>
</lov-actions>
