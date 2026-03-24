

# Reestruturar Landing Pages: Abas por origem + sub-seções por status

## Estrutura atual
- Abas de nível superior: Ativas / Inativas / Rascunhos
- Dentro de "Ativas": seções "Imobiliária" e "Criadas por Corretores"

## Nova estrutura
- **Abas de nível superior**: `Imobiliária` e `Corretores`
- **Dentro de cada aba**: projetos divididos em 3 seções visuais (sem sub-abas): **Ativas**, **Rascunhos**, **Inativas** — cada uma com header e lista

## Alterações — `src/components/admin/ProjectManagement.tsx`

### 1. Refatorar o `useMemo` de categorização
Criar 6 listas: `companyActive`, `companyDraft`, `companyInactive`, `brokerActive`, `brokerDraft`, `brokerInactive` — separando primeiro por `created_by_broker_id`, depois por status (ativo / rascunho / inativo).

### 2. Trocar as Tabs
- Tab "imobiliaria": mostra `companyActive`, `companyDraft`, `companyInactive` em seções colapsáveis com headers (ícone verde "Ativas", ícone amber "Rascunhos", ícone cinza "Inativas")
- Tab "corretores": mostra `brokerActive`, `brokerDraft`, `brokerInactive` da mesma forma

### 3. Atualizar contadores no header
Mostrar totais gerais como hoje, mas refletir a nova estrutura nas abas.

### 4. Criar helper `renderStatusSection`
Recebe lista de projetos, título ("Ativas"/"Rascunhos"/"Inativas"), ícone e cor. Renderiza header + lista de `ProjectListCard`. Omite a seção se vazia.

1 arquivo alterado.

