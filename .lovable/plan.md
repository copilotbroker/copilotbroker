
# Copilot Broker — Fundação SaaS Multi-Tenant

Transformação do sistema atual (uso próprio da Enove) em uma plataforma SaaS B2B onde múltiplas imobiliárias coexistem isoladas, gerenciadas por um time interno via painel Master.

Hoje o banco não possui nenhuma tabela de organização/plano/assinatura. Toda a operação (brokers, leads, projects, conversations, roletas, whatsapp_*) é "flat", como se houvesse uma única imobiliária implícita. Vamos introduzir a camada de tenant **sem quebrar a operação atual**, migrando todos os dados existentes para um tenant inicial chamado **Enove Select**.

Por se tratar de uma transformação estrutural grande, dividimos em entregas sequenciais. Esta proposta cobre **Fases 1 + 2 + 3 (parcial)** — a base que destrava todo o resto. Fases 4–6 (planos avançados, billing real, provisionamento automatizado) ficam para iterações seguintes, mas a modelagem já nascerá preparada para elas.

---

## Entrega 1 — Modelagem multi-tenant (banco)

### Novas tabelas
- **organizations** — a "imobiliária" (tenant). Campos: `id`, `name`, `slug`, `legal_name`, `cnpj`, `logo_url`, `primary_color`, `status` (`active`/`trial`/`suspended`/`canceled`), `trial_ends_at`, `created_at`.
- **plans** — catálogo de planos (Starter, Pro, Enterprise…). Campos: `id`, `code`, `name`, `description`, `price_cents`, `billing_period` (`monthly`/`yearly`/`custom`), `is_public`, `sort_order`.
- **plan_features** — limites e recursos por plano (estrutura key/value, escalável). Ex.: `max_brokers=10`, `max_whatsapp_instances=3`, `max_landing_pages=5`, `feature.dashboards_advanced=true`, `feature.automations=true`.
- **organization_subscriptions** — assinatura ativa de uma organização. Campos: `id`, `organization_id`, `plan_id`, `status` (`trial`/`active`/`past_due`/`canceled`/`suspended`), `started_at`, `current_period_end`, `trial_ends_at`, `canceled_at`.
- **organization_feature_overrides** — liberações manuais que o super-admin concede além do plano (ex.: liberar 2 corretores extras por 30 dias). Campos: `organization_id`, `feature_key`, `value`, `expires_at`, `granted_by`.
- **organization_members** — vínculo usuário ↔ organização ↔ papel. Campos: `id`, `organization_id`, `user_id`, `role` (`owner`/`admin`/`manager`/`leader`/`broker`), `is_active`, `invited_at`, `joined_at`.
- **organization_invites** — convites pendentes. Campos: `organization_id`, `email`, `role`, `token`, `expires_at`, `accepted_at`.
- **admin_audit_logs** — registro de ações administrativas críticas (mudança de plano, bloqueio de conta, override manual, alteração de papel). Campos: `actor_user_id`, `organization_id`, `action`, `entity`, `entity_id`, `metadata jsonb`, `created_at`.

### Mudanças no enum `app_role`
- Adicionar `super_admin` (time interno do Copilot Broker, vê tudo).
- Adicionar `owner` e `manager` (papéis dentro da organização).
- Manter `admin`, `leader`, `broker` por compatibilidade — mas seu significado passa a ser **dentro de uma organização** (não global). O `admin` global de hoje será migrado para `super_admin`.

### Retrofit nas tabelas existentes
Adicionar coluna `organization_id uuid` (com FK e índice) nas tabelas operacionais:
`brokers`, `projects`, `leads`, `conversations`, `roletas`, `whatsapp_campaigns`, `whatsapp_message_queue`, `whatsapp_message_templates`, `whatsapp_labels`, `broker_whatsapp_instances`, `global_whatsapp_config`, `copilot_configs`, `calendar_events`, `lead_attribution`, `lead_documents`, `lead_interactions`, `propostas`.

### Migração de dados (seed do tenant inicial)
1. Criar a organização **Enove Select** (slug `enove-select`, status `active`).
2. Criar plano `enterprise_legacy` com limites altos e atribuir à Enove Select.
3. Preencher `organization_id = <enove_select_id>` em todos os registros existentes.
4. Tornar `organization_id` NOT NULL após o backfill.
5. Para cada usuário em `user_roles`, criar entrada em `organization_members` na Enove Select com o papel correspondente. O primeiro usuário com role `admin` vira `owner`.
6. Promover os usuários atuais com `admin` para também ter `super_admin` (eles são o time interno do Copilot Broker).

### Funções e RLS
- Criar `get_user_organization_ids(uuid)` (SECURITY DEFINER) — retorna as organizações do usuário.
- Criar `is_super_admin(uuid)` (SECURITY DEFINER) — verifica se é time interno.
- Criar `has_org_role(uuid, uuid, app_role)` (SECURITY DEFINER) — papel dentro de uma organização.
- **Reescrever todas as RLS** das tabelas retrofit para filtrar por `organization_id IN get_user_organization_ids(auth.uid())` OU `is_super_admin(auth.uid())`.
- RLS das tabelas SaaS novas: super_admin tem acesso total; owner/admin da org veem/editam apenas a sua; corretores apenas leem dados básicos da própria org.

---

## Entrega 2 — Painel Master (Super Admin Copilot Broker)

Rota: `/master/*` — acessível apenas a `super_admin`. Layout próprio (sidebar dedicada, separada do `/admin` da imobiliária).

### Telas
- **`/master/overview`** — KPIs no topo: total de imobiliárias, ativas, em trial, suspensas, inadimplentes, total de corretores, MRR estimado. Gráfico simples de novas contas/mês.
- **`/master/imobiliarias`** — Tabela com busca, filtros (plano, status, data), colunas: nome, plano, status, # corretores, # instâncias WhatsApp, criada em, ações. Botão "Nova imobiliária".
- **`/master/imobiliarias/:id`** — Detalhe da conta em abas:
  - **Visão geral**: dados da empresa, plano, status assinatura, datas (criação, trial, renovação), uso atual vs. limites (barra de progresso por feature).
  - **Usuários**: tabela de membros, adicionar/remover, alterar papel, bloquear acesso.
  - **Plano e recursos**: trocar plano, ver/aplicar overrides manuais (liberar +2 corretores até X data), histórico de mudanças.
  - **Auditoria**: timeline de ações administrativas naquela conta.
  - **Ações perigosas**: suspender, reativar, cancelar.
- **`/master/planos`** — CRUD de planos e seus `plan_features`.
- **`/master/auditoria`** — Log global de ações administrativas com filtros.

### Edge Functions de suporte
- `master-create-organization` — cria org + owner + assinatura inicial em uma transação.
- `master-update-subscription` — troca de plano com registro em audit log.
- `master-toggle-organization-status` — suspender/reativar.
- `master-invite-user` — envia convite por e-mail.

Todas validam `super_admin` no servidor (independente de RLS).

---

## Entrega 3 — Painel Admin da Imobiliária

Rota: `/admin/organizacao/*` — acessível ao `owner`/`admin` da própria org.

### Telas
- **`/admin/organizacao`** — visão da conta: plano atual, limites, uso (X de Y corretores, X de Y instâncias), status da assinatura, data de renovação.
- **`/admin/organizacao/equipe`** — gestão de corretores:
  - Listar membros (nome, papel, status, último acesso).
  - Convidar novo membro (e-mail + papel) — bloqueia se atingiu o limite do plano.
  - Editar papel (`admin`/`manager`/`leader`/`broker`).
  - Ativar/desativar corretor.
  - Indicador "X de Y vagas usadas".
- **`/admin/organizacao/permissoes`** — tabela de papéis × permissões (somente leitura no início, com matriz clara do que cada papel pode fazer).

### Enforcement de limites
Criar hook `useOrganizationLimits()` e função RPC `check_organization_limit(org_id, feature_key)` para validar antes de criar broker, instância WhatsApp, landing page, etc. Ações bloqueadas mostram CTA "Fazer upgrade do plano".

---

## Detalhes técnicos

### Estratégia de isolamento
- **Tenant ID em toda tabela operacional** (não usar schema-per-tenant — overhead alto e atrita com Supabase).
- **RLS como mecanismo principal de isolamento**, com SECURITY DEFINER functions para evitar recursão.
- **Edge Functions usando service role** para operações cross-tenant do super_admin.

### Compatibilidade com código existente
- Hooks como `use-broker-projects`, `use-kanban-leads`, `use-conversations` precisarão receber o `organization_id` ativo. Criar `OrganizationContext` no React (resolve a org do usuário logado, com seletor caso ele pertença a múltiplas — futuro).
- Helper `useCurrentOrganization()` retorna a org ativa; queries Supabase filtram automaticamente porque a RLS já restringe (defesa em profundidade).
- Edge functions existentes (`whatsapp-webhook`, `roleta-distribuir`, etc.) precisam resolver o `organization_id` a partir do recurso (broker → org, conversation → broker → org). Faremos isso pontualmente conforme cada função for tocada — sem reescrever todas agora.

### Roles — mapeamento durante migração
| Hoje | Depois |
|---|---|
| `user_roles.admin` (time interno Enove) | `super_admin` global + `owner` na Enove Select |
| `user_roles.admin` (admin operacional) | `admin` em `organization_members` |
| `user_roles.leader` | `leader` em `organization_members` |
| `user_roles.broker` | `broker` em `organization_members` |

### Auditoria
- Trigger ou chamada explícita das edge functions master-* grava em `admin_audit_logs`.
- Painel mostra timeline com ator, ação, entidade, antes/depois (jsonb).

### Billing (Fase 5 — só modelagem agora)
- Tabela `organization_subscriptions` já tem campos para `current_period_end`, `status`, `canceled_at`. Sem integração com gateway nesta entrega — ficaremos prontos para plugar Stripe/Asaas depois adicionando `external_subscription_id`.

### Provisionamento (Fase 6 — preparado, não automatizado)
- A edge `master-create-organization` já encapsula todo o fluxo (org + owner + plano + recursos). No futuro, basta expor por API pública/checkout para auto-onboarding.

---

## Status atual da implementação

### ✅ Fase 1 — Banco de dados multi-tenant
Migrações aplicadas. Tabelas SaaS criadas (`organizations`, `plans`, `plan_features`, `organization_subscriptions`, `organization_members`, `organization_invites`, `admin_audit_logs`). 17 tabelas operacionais retrofit com `organization_id`. Tenant inicial **Enove Select** + plano **enterprise_legacy** criados, dados existentes backfilled. RLS e funções `is_super_admin`, `get_user_organization_ids`, `is_org_member`, `has_org_role` em produção.

### ✅ Fase 2 — Painel Master (`/master/*`)
- `MasterLayout` com sidebar dedicada e guard `is_super_admin` (redireciona para `/auth` se não autorizado).
- `MasterOverview`: KPIs (total, ativas, trial, suspensas, corretores, MRR estimado).
- `MasterOrganizations`: tabela com busca/filtro + dialog "Nova imobiliária".
- `MasterOrganizationDetail`: abas (Visão Geral, Usuários, Plano, Auditoria, Ações Perigosas) com troca de plano e suspender/reativar/cancelar.
- `MasterPlans`: catálogo de planos com features.
- `MasterAudit`: timeline global das ações administrativas.
- Edge functions: `master-create-organization`, `master-update-subscription`, `master-toggle-organization-status` (todas validam `super_admin` no servidor + gravam audit log).

### ✅ Fase 3 — Painel Admin Imobiliária (`/admin/organizacao/*`)
- `AdminOrganization`: visão geral da conta (plano, uso vs limites com Progress).
- `AdminOrganizationTeam`: gestão de membros, mudança de papel, ativar/desativar, indicador de vagas restantes.
- `AdminOrganizationPermissions`: matriz informativa de papéis × permissões.
- Hooks: `useOrganization` (resolve org ativa + super_admin) e `useOrganizationLimits` (features do plano + uso real + helpers `hasReached`/`remaining`).

### ✅ Fase 3.5 — Isolamento real nas edge functions
Em vez de reescrever 5500+ linhas de edge functions existentes, aplicamos **triggers `BEFORE INSERT`** no banco que copiam `organization_id` da entidade pai (broker → conversations/calendar_events/copilot_configs/whatsapp_*; lead → lead_interactions/lead_documents/lead_attribution/propostas; broker→lead → leads; broker→lead → whatsapp_message_queue). Funções `fill_org_from_broker`, `fill_org_from_lead`, `fill_org_for_lead`, `fill_org_from_campaign` (todas SECURITY DEFINER). Helper `supabase/functions/_shared/tenant.ts` disponibiliza `orgFromBroker/Lead/Conversation/InstanceToken` + `assertOrgAccess` para casos onde a função precisa filtrar/validar tenant explicitamente.

### ✅ Fase 4 — Editor de planos + add-ons
- `MasterPlans` com CRUD completo: criar/editar/excluir planos (preço, período, visibilidade, ordem, ativo) e gerenciar `plan_features` por preset (max_brokers, feature.copilot_ai, etc.) ou chave customizada.
- `MasterOrganizationDetail` ganhou aba **Overrides**: aplica/remove `organization_feature_overrides` por feature, com prazo de validade opcional e motivo. Cada ação é registrada em `admin_audit_logs`.
- Função `check_organization_limit` corrigida (usa colunas reais `feature_value`/`feature_type`) e agora **respeita overrides ativos**.
- Hook `useOrganizationLimits` reescrito: mescla plano + overrides, expõe `isEnabled(key)`, `asInt(key)`, `remaining`, `hasReached`. Cada feature carrega `source: "plan" | "override"` para a UI sinalizar add-ons.
- `master-invite-user` migrado para `rpc("check_organization_limit")` em vez de consultar `plan_features` direto — agora respeita overrides automaticamente.

### ✅ Fase 5 — White-label por organização
- Novos campos em `organizations`: `display_name`, `secondary_color`, `favicon_url`.
- Bucket público `org-branding` com RLS por `has_org_role(... 'owner'|'admin')` no folder `<org_id>/...`.
- `WhiteLabelProvider` (`src/components/WhiteLabelProvider.tsx`) injeta `--primary`/`--ring`/`--accent` (hex→HSL), troca `document.title` e favicon de acordo com a organização ativa. Atua só em `/admin/*` e `/corretor/*` (master e landings ficam intocados). Restaura tudo ao trocar org/desmontar.
- Página `/admin/organizacao/branding`: upload de logo e favicon, edição de cores e display name. Atalho na visão geral da imobiliária.
- `AdminHeader` mostra logo e nome da org no breadcrumb.


---

## O que NÃO está incluso nesta entrega
- Integração real com gateway de cobrança (Stripe/Asaas).
- Página pública de pricing/checkout self-service.
- Migração das edge functions existentes (`whatsapp-webhook`, `roleta-distribuir` etc.) para serem multi-tenant aware — feita sob demanda.
- Internacionalização do painel master.
- Domínio próprio por imobiliária (white-label).

---

## Próximos passos
1. **Fase 5** — Integração de billing real (gateway), webhooks de pagamento, suspensão automática por inadimplência.
2. **Fase 6** — Onboarding self-service, checkout público, automação de provisionamento.
3. **White-label** — domínio próprio, logo, cores e templates de e-mail por organização.

