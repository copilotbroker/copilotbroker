

## Plano: Controle individual de Inbox e Copiloto por corretor

### Objetivo
Permitir que o admin habilite/desabilite individualmente o acesso ao **Inbox** e à **criação do Copiloto** para cada corretor, diretamente na aba "Corretores" do painel admin.

### 1. Migration: adicionar colunas na tabela `brokers`

```sql
ALTER TABLE public.brokers 
  ADD COLUMN inbox_enabled boolean NOT NULL DEFAULT false,
  ADD COLUMN copilot_enabled boolean NOT NULL DEFAULT false;
```

### 2. UI: Switches nos cards de corretor (`BrokerManagement.tsx`)

Na seção "Row 6: Actions" de cada broker card (linha ~752), adicionar dois switches inline:
- **Inbox** — toggle `inbox_enabled`
- **Copiloto** — toggle `copilot_enabled`

Cada toggle faz `supabase.from("brokers").update({ inbox_enabled / copilot_enabled }).eq("id", broker.id)` e atualiza o estado local. Usar ícones `MessageSquare` (Inbox) e `Bot` (Copiloto) com labels compactos.

### 3. Gating no lado do corretor

- **BrokerInbox.tsx** e **AdminInbox.tsx** (para broker role): verificar `brokers.inbox_enabled` ao carregar. Se `false`, mostrar tela de "Funcionalidade não liberada. Solicite ao administrador."
- **BrokerCopilotConfig.tsx** e **CopilotConfigPage.tsx**: verificar `brokers.copilot_enabled`. Se `false`, mostrar mesma tela de bloqueio.
- **BrokerSidebar.tsx** e **BrokerBottomNav.tsx**: ocultar ou desabilitar visualmente os botões de Inbox e Copiloto quando as flags estão `false`. Buscar as flags via query ao `brokers` usando o `brokerId`.

### 4. Hook: `use-broker-features.ts`

Novo hook que busca `inbox_enabled` e `copilot_enabled` do broker logado:

```typescript
export function useBrokerFeatures(brokerId: string | null) {
  // query brokers.inbox_enabled, copilot_enabled
  return { inboxEnabled, copilotEnabled, isLoading };
}
```

Usado pelo sidebar, bottom nav, e páginas de inbox/copiloto do corretor.

### Arquivos a criar/editar

| Ação | Arquivo |
|------|---------|
| Migration | Adicionar `inbox_enabled` e `copilot_enabled` a `brokers` |
| Criar | `src/hooks/use-broker-features.ts` |
| Editar | `src/components/admin/BrokerManagement.tsx` (switches nos cards) |
| Editar | `src/pages/BrokerInbox.tsx` (gating) |
| Editar | `src/pages/BrokerCopilotConfig.tsx` (gating) |
| Editar | `src/components/broker/BrokerSidebar.tsx` (ocultar itens) |
| Editar | `src/components/broker/BrokerBottomNav.tsx` (ocultar itens) |

