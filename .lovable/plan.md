

# Fix: Lead deve ir para "Atendimento" ao iniciar atendimento no Plantão

## Problema

Quando o corretor clica em "Iniciar Atendimento" no inbox do Plantão, o lead é criado com `status: "new"` (Pré Atendimento). Deveria ser criado já como `status: "info_sent"` (Atendimento), pois o ato de iniciar atendimento implica que o corretor já está em contato.

O mesmo problema existe no `AdminInbox.handleLeadCreated` — cria com `status: "new"`.

## Solução

### `src/pages/BrokerPlantao.tsx` — `handleStartAttendance`

- Alterar o insert do lead de `status: "new"` para `status: "info_sent"`
- Adicionar `atendimento_iniciado_em: new Date().toISOString()` e `status_distribuicao: "atendimento_iniciado"`
- Corrigir a interaction para `new_status: "info_sent"` e `interaction_type: "atendimento_iniciado"`
- Atualizar o estado local para refletir `status: "info_sent"`

### `src/pages/AdminInbox.tsx` — `handleStartAttendance`

Aplicar a mesma correção se existir lógica equivalente.

## Arquivos alterados

| Arquivo | Alteração |
|---|---|
| `src/pages/BrokerPlantao.tsx` | Criar lead como `info_sent` + campos de atendimento |
| `src/pages/AdminInbox.tsx` | Mesma correção no `handleStartAttendance` (se aplicável) e no `handleLeadCreated` |

