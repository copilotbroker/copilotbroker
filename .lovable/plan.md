

# Limpar UI da Agenda: remover barra verde + unificar botão

## Análise

- O botão **Atualizar** (`refetch`) apenas re-busca os eventos do banco local — mesma coisa que o `syncGoogle` faz, mas sem sincronizar com o Google.
- Quando conectado ao Google, **Sincronizar** já faz tudo: busca eventos do Google + recarrega do banco. Então "Atualizar" é redundante.
- Quando **não** conectado, o botão deve funcionar como refresh local (refetch).

**Concordo com a proposta.** A barra verde ocupa espaço desnecessário quando já está conectado. Podemos mover as ações essenciais (Sincronizar, Reconectar, Desconectar) para o header da página de forma discreta.

## Alterações

### 1. `AgendaModule.tsx`
- **Remover** o `<GoogleConnectCard>` quando `googleConnection` existe (conectado)
- **Manter** o card apenas quando NÃO conectado (CTA de conexão)
- Substituir o botão "Atualizar" por "Sincronizar":
  - Se conectado ao Google: chama `syncGoogle` (sync + refetch)
  - Se não conectado: chama `refetch` (apenas refresh local)
- Adicionar um pequeno dropdown ou botões discretos no header para "Reconectar" e "Desconectar" (visíveis apenas quando conectado)

### 2. `GoogleConnectCard.tsx`
- Sem alteração — continua sendo usado apenas para o estado "não conectado"

### Resultado visual (quando conectado)
```text
Header:
  [Agenda]                          [+ Novo evento] [🔄 Sincronizar] [⋮ menu: Reconectar | Desconectar]

Filtros e controles...
Calendário...
```

Sem barra verde. Página limpa e focada nos eventos.

