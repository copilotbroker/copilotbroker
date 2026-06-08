# Hardening de Segurança — Plano Faseado

## Objetivo
Fechar os 4 achados reais do scanner (organizations, brokers, projects, broker_projects expondo dados sensíveis ao público) sem quebrar landing pages.

## Fase 1 — Criar views/RPCs públicas (SEM remover acessos atuais)

Migration única que adiciona infraestrutura paralela. Zero risco de quebra.

**Views (SECURITY INVOKER, security_barrier):**
- `public.organizations_public` → `id, name, slug, status, display_name, logo_url, favicon_url, primary_color, secondary_color` (apenas `status = 'active'`).
- `public.brokers_public` → `id, name, slug, whatsapp, is_active, organization_id, lider_id, nome_equipe, show_name_on_global, global_display_name` (apenas `is_active = true`). Sem `email`, sem `user_id`, sem tokens.
- `public.projects_public` → `id, name, slug, city, city_slug, description, status, is_active, hero_title, hero_subtitle, features, type, organization_id, created_at, updated_at` (apenas `is_active = true`). Sem `ai_prompt`, `webhook_url`, `landing_content`, `created_by_broker_id`.

**RPCs SECURITY DEFINER (com search_path):**
- `get_project_landing_content(_slug text, _city_slug text default null)` → retorna `landing_content jsonb` e demais campos seguros para renderização da landing page (sem `ai_prompt` nem `webhook_url`).
- `get_project_brokers(_project_id uuid)` → retorna lista `{ broker_id, name, slug, whatsapp, global_display_name }` apenas para brokers ativos em projetos ativos.

**Grants:**
- `GRANT SELECT` nas 3 views para `anon` e `authenticated`.
- `GRANT EXECUTE` nas 2 RPCs para `anon` e `authenticated`.

**Não mexer:** policies das tabelas-base permanecem como estão. Sistema continua funcionando exatamente como hoje.

## Fase 2 — Migrar leituras públicas (após Fase 1 aprovada)

Trocar `from("...")` por views/RPCs apenas nos pontos **anônimos** (landing pages). Código autenticado (Admin, Inbox, CRM, hooks de corretor logado) fica intacto.

Alvos identificados (≈12 arquivos):
- `src/pages/vivapark/VivaParkLandingPage.tsx`
- `src/pages/vivapark/VivaParkBrokerLandingPage.tsx`
- `src/pages/vivapark/NC1LandingPage.tsx`
- `src/pages/vivapark/NC1BrokerLandingPage.tsx`
- `src/pages/ProjectLandingPage.tsx`
- `src/pages/ProjectBrokerLandingPage.tsx`
- `src/pages/BrokerProjectLanding.tsx`
- `src/pages/CA2727LandingPage.tsx`
- `src/pages/CA2589LandingPage.tsx`
- `src/pages/EstanciaVelha.tsx` / `EstanciaVelhaTeaser.tsx` / `EstanciaVelhaBrokerTeaser.tsx`
- `src/pages/CaminhadaEV.tsx`, `src/pages/Prontos.tsx`
- `src/pages/BrokerSignup.tsx` (parte pública)

Cada migração testada antes de ir para a próxima.

## Fase 3 — Fechar acesso anônimo (somente após Fase 2 100% migrada e testada)

Migration final:
- `DROP POLICY "Projetos ativos são públicos" ON public.projects`
- `DROP POLICY "Qualquer pessoa pode ver corretores ativos" ON public.brokers`
- `DROP POLICY "Associacoes ativas sao publicas" ON public.broker_projects`
- `DROP POLICY "Anon can view active org branding" ON public.organizations`
- Marcar os 4 findings como `mark_as_fixed` no scanner.
- Atualizar `@security-memory` com o novo modelo de leitura pública (views + RPCs).
- Rodar scan para confirmar.

## Execução agora
Apenas a **Fase 1**: criação da migration com views, RPCs e grants. Nenhuma alteração de código frontend nesta etapa.
