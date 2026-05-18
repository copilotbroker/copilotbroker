## Objetivo

Replicar neste projeto as duas páginas de impressão que o wizard "Completar Cadastro" já referencia mas que não foram trazidas: **Imprimir ficha do cliente** e **Imprimir declaração**.

Hoje os botões existem em `LeadCadastroPage.tsx` (etapa Revisão) e abrem `/corretor/lead/:leadId/ficha` e `/corretor/lead/:leadId/declaracao` em nova aba, mas as rotas/páginas não existem — resultando em 404.

## O que será replicado (do projeto CRM - O Novo Condomínio)

1. **`src/pages/LeadFichaPrint.tsx`** (~388 linhas) — Ficha consolidada do cliente para impressão/assinatura, lendo `leads` + `lead_cadastro_completo` + `lead_documents`, com formatação BR (CPF, CNPJ, CEP, telefone, datas).
2. **`src/pages/LeadDeclaracaoPrint.tsx`** — Declaração Ábaco com texto institucional + dados do lead.
3. **Logo Enove** (`src/assets/logo-enove.png`) — usado no cabeçalho das duas páginas. Copiar do projeto de origem.
4. **Rotas em `src/App.tsx`**:
   - `/corretor/lead/:leadId/ficha` → `LeadFichaPrint`
   - `/corretor/lead/:leadId/declaracao` → `LeadDeclaracaoPrint`

## Observações

- Nenhuma mudança no schema do banco — tudo já existe (`lead_cadastro_completo`, `lead_documents`, `leads`).
- Sem nova edge function.
- Layout/print: as páginas usam estilos próprios para A4; estética idêntica à do projeto original (cabeçalho com logo Enove + dados do lead).
- Os botões no wizard continuam como estão.

## Fora do escopo

- Geração de PDF server-side (impressão é via `window.print()` no browser, como no original).
