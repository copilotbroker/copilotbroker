

# Re-brand cores dos eventos da Agenda

## Paleta proposta

Eventos do sistema usarão cores do design system CRM (dark professional), com destaque em **amber/gold** para eventos internos:

| Tipo | Cor atual | Nova cor (balão) | Texto |
|------|-----------|------------------|-------|
| visit (Visita) | blue-500 | `bg-amber-400` | `text-black` |
| meeting (Reunião) | purple-500 | `bg-violet-500` | `text-white` |
| follow_up (Retorno) | amber-500 | `bg-sky-500` | `text-white` |
| scheduling (Agendamento) | green-500 | `bg-emerald-500` | `text-white` |
| task (Tarefa) | slate-500 | `bg-zinc-500` | `text-white` |
| other (Outro) | gray-500 | `bg-stone-400` | `text-black` |

A **Visita** fica com balão amarelo/gold e texto preto (destaque principal, como solicitado). Eventos genéricos (other) também com texto escuro para contraste.

## Arquivos alterados

### 1. `MonthView.tsx`, `WeekView.tsx`, `DayView.tsx`
- Atualizar `EVENT_TYPE_COLORS` com as novas classes
- Trocar `text-white` fixo por cor condicional (amarelo/stone usam `text-black`)

### 2. `ListView.tsx`
- Atualizar `EVENT_TYPE_BADGE` para refletir a nova paleta nos badges

### Implementação
Criar um mapa de texto por tipo para evitar repetição:

```typescript
const EVENT_TYPE_COLORS: Record<string, string> = {
  visit: "bg-amber-400 text-black",
  meeting: "bg-violet-500 text-white",
  follow_up: "bg-sky-500 text-white",
  scheduling: "bg-emerald-500 text-white",
  task: "bg-zinc-500 text-white",
  other: "bg-stone-400 text-black",
};
```

Remover o `text-white` hardcoded dos `className` dos event chips em todos os 3 arquivos de view, já que a cor do texto agora vem do mapa.

