

## Plano simplificado: Realtime + remover botões

Concordo -- Realtime na tabela é suficiente. O sync-all já dispara automaticamente ao entrar na aba (comportamento existente), e o Realtime propagará qualquer mudança subsequente no banco sem polling.

### Mudanças

**1. Migração SQL** -- habilitar Realtime na tabela
```sql
ALTER PUBLICATION supabase_realtime ADD TABLE broker_whatsapp_instances;
```

**2. `src/pages/AdminCopilotConfig.tsx`**
- Adicionar canal Realtime que escuta `postgres_changes` em `broker_whatsapp_instances` e invalida a query `admin-whatsapp-instances` a cada evento UPDATE/INSERT/DELETE
- Remover os dois botões ("Sincronizar Status" e "Atualizar") do header
- Manter o sync-all automático no mount (já existe, não muda nada)
- Cleanup do canal no unmount

**3. `src/components/admin/WhatsAppOverviewTab.tsx`**
- Remover a prop `refetchInstances` (não é mais usada)

### O que permanece
- O sync-all automático ao entrar na aba "Visão Global" (já reconcilia com UAZAPI e atualiza o banco)
- A partir daí, qualquer mudança no banco (feita pelo sync, por pause/unpause, ou por outro processo) é refletida instantaneamente via Realtime

### Arquivos alterados
- Migração SQL (1 linha)
- `src/pages/AdminCopilotConfig.tsx` (Realtime + remover botões)
- `src/components/admin/WhatsAppOverviewTab.tsx` (remover prop não utilizada)

