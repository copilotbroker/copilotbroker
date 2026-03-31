

## Remover bloco "Central de Inteligência Pro" da página Copiloto Admin

### O que será feito

Remover o bloco hero header (linhas 231-264) do `AdminCopilotConfig.tsx` — o card com ícone de robô, pulse verde, título "Central de Inteligência" e badge "Pro". Isso alinha a página admin com o visual limpo das abas dos corretores/líderes, onde não há esse bloco decorativo.

### Arquivo: `src/pages/AdminCopilotConfig.tsx`

- Remover o `div` do "Hero Header" (linhas 230-264)
- Manter todo o restante intacto (tabs, breadcrumb, conteúdos)

