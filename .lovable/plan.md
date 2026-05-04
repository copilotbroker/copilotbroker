## Objetivo

1. Permitir que o **admin preencha o WhatsApp pessoal** de qualquer membro (corretor, líder, gerente) direto no `MemberFormDialog` da página de Equipe — resolvendo o caso da Kely.
2. Criar uma **rota de perfil unificada** acessível por admin, líder e corretor, com o mesmo design premium da página "Gestão de membros e perfis".
3. **Redesenhar** `BrokerProfile` para esse mesmo padrão visual (hero com gradiente, cards com `border-border/60`, KPIs/status pills, role-aware accents).

---

## Mudanças

### 1. Banco — propagar WhatsApp ao broker

A coluna `brokers.whatsapp` é o que `notify-transfer` e demais notificações usam. Hoje a trigger `sync_broker_from_member` já materializa o broker a partir do membro, mas não conhece o WhatsApp.

- Adicionar coluna `organization_members.whatsapp text` (nullable).
- Atualizar a trigger `sync_broker_from_member` para propagar `whatsapp` e `full_name` para `brokers.whatsapp` / `brokers.name` quando mudar.
- Quando o próprio usuário salvar via `/perfil`, gravar nas duas pontas (`organization_members` + `brokers`) numa só transação para evitar inconsistência.

### 2. `MemberFormDialog` — campo WhatsApp + edição completa

No modo **editar** (e também no **criar direto**, opcionalmente):

- Adicionar campo "WhatsApp pessoal (notificações)" com input de telefone (mesmo placeholder/máscara já usados no `BrokerProfile`).
- Adicionar campo "Nome completo" editável também no modo edição (hoje só dá pra mudar role/ativo).
- Persistir nos dois caminhos: `organization_members.whatsapp/full_name` e (via trigger) `brokers.whatsapp/name`.
- Edge function `org-create-member-direct` recebe `whatsapp` opcional no payload.

### 3. Nova rota universal `/perfil` — redesign no padrão Equipe

Criar `src/pages/UserProfile.tsx` (substitui o atual `BrokerProfile.tsx`) e expor:

- `/perfil` → rota única
- `/corretor/perfil` continua existindo, mas redireciona para `/perfil`

Layout no padrão da página de Equipe:

- **Hero** com gradiente (`from-primary/[0.07] via-card to-card`), badge de papel (`RoleBadge`), avatar grande com gradient by-name e botão "Salvar" no canto direito.
- **Grid 2 colunas (responsivo)** com cards `border-border/60`:
  - Card "Identidade" — nome, e-mail (readonly), slug (readonly se broker).
  - Card "WhatsApp pessoal (notificações)" — input destacado, com hint "Usado pelo sistema para te notificar sobre transferências e novos leads".
  - Card "Status das integrações" — pills de WhatsApp Pessoal e Google Agenda (mantém visual atual mas dentro do novo grid).
  - Card "Identificação no Plantão" — só aparece se `role` for broker/leader (admin/manager não aparece, pois não atende).
- Footer fixo com botão "Salvar alterações" (mesmo padrão do `MemberFormDialog`).

Lógica:

- `useUserRole` resolve role.
- Se for `admin/manager` sem `brokerId`, salva apenas em `organization_members` (`whatsapp`, `full_name`).
- Se tiver `brokerId`, salva em ambos.
- Esconder seções que não se aplicam ao perfil (ex.: "Identificação no Plantão" só pra quem atende).

### 4. Pontos de entrada

- **AdminSidebar**: trocar comportamento do avatar — em vez de `onLogout` direto, abre menu (Perfil / Sair). Adicionar item "Perfil" navegando para `/perfil`.
- **BrokerSidebar**: o item "Perfil" já existe (`/corretor/perfil`) — passa a apontar para `/perfil`.
- **Líder**: usa `BrokerLayout`, então herda o item de Perfil automaticamente.

### 5. Limpeza

- `BrokerProfile.tsx` vira um shim que re-exporta `UserProfile` (ou é deletado e a rota aponta para o novo).
- `SettingsPanel` continua existindo para "alterar senha" e "preferências de notificação" — mover esse conteúdo para uma seção do novo `/perfil` em iteração futura (fora do escopo agora).

---

## Arquivos afetados

- `supabase/migrations/<new>.sql` — coluna `whatsapp` em `organization_members` + atualização da trigger `sync_broker_from_member`.
- `supabase/functions/org-create-member-direct/index.ts` — aceitar `whatsapp` no payload.
- `src/components/admin-org/MemberFormDialog.tsx` — campos `whatsapp` e `full_name` em editar/criar.
- `src/pages/UserProfile.tsx` — **novo** (redesign no padrão Equipe).
- `src/pages/BrokerProfile.tsx` — vira re-export de `UserProfile` (ou removido).
- `src/App.tsx` — rota `/perfil`.
- `src/components/admin/AdminSidebar.tsx` — menu no avatar com item Perfil.
- `src/components/broker/BrokerSidebar.tsx` — apontar para `/perfil` (opcional, mantém compat).

## Confirmações antes de implementar

1. Posso **adicionar a coluna `whatsapp` em `organization_members`** e ajustar a trigger? (resposta esperada: sim)
2. O perfil unificado deve mostrar o card "Identificação no Plantão" também para **líderes** que atendem, ou só para `broker` puro? (proposta: broker + leader, esconder para admin/manager/owner)
