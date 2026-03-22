

# Transferir Lead para Roleta

## Objetivo
Permitir que, ao transferir um lead, o usuário escolha entre transferir para um **corretor específico** ou para uma **roleta** (o lead será distribuído automaticamente pelo round-robin).

## Mudanças

### 1. TransferLeadDialog — Adicionar opção de Roleta
**Arquivo**: `src/components/crm/TransferLeadDialog.tsx`

- Adicionar nova prop `roletas` (lista de roletas ativas com id/nome)
- Adicionar toggle/tabs para escolher entre "Corretor" e "Roleta"
- Quando "Roleta" selecionada, mostrar select com roletas disponíveis
- No `handleTransfer`:
  - Se corretor: manter fluxo atual (`supabase.rpc("transfer_lead")` + `notify-transfer`)
  - Se roleta: limpar o `broker_id` do lead, setar `project_id` baseado na roleta (ou invocar `roleta-distribuir` diretamente), para que o lead entre na distribuição round-robin
- A transferência para roleta vai:
  1. Atualizar o lead: `broker_id = null`, `roleta_id = null`, `status_distribuicao = null`
  2. Registrar interação na timeline
  3. Invocar a edge function `roleta-distribuir` com `{ lead_id, project_id }` (pegando o `empreendimento_id` da roleta selecionada)

### 2. Carregar roletas nos pontos de uso
**Arquivos**: `src/pages/LeadPage.tsx`, `src/components/crm/LeadDetailSheet.tsx`

- Fazer fetch das roletas ativas (id, nome) via Supabase
- Passar como prop `roletas` ao `TransferLeadDialog`

### 3. Props atualizadas do TransferLeadDialog
```text
interface TransferLeadDialogProps {
  leadId: string;
  leadName: string;
  currentBrokerId?: string | null;
  brokers: { id: string; name: string }[];
  roletas: { id: string; nome: string }[];  // NOVO
  isOpen: boolean;
  onClose: () => void;
  onTransferred: () => void;
}
```

### Fluxo de transferência para Roleta
1. Usuário seleciona aba "Roleta" e escolhe uma roleta
2. Sistema busca o primeiro `empreendimento_id` vinculado à roleta
3. Limpa `broker_id` do lead e seta o `project_id` do empreendimento
4. Invoca `roleta-distribuir` com `{ lead_id, project_id }` — a edge function faz o round-robin e atribui o corretor da vez
5. Registra interação `roleta_transferencia` na timeline

