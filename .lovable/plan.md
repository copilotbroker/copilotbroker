# Plano: Melhorar Navegação do Wizard do Copiloto no Mobile

## Problema
Na versão mobile, os corretores não conseguem encontrar os botões para avançar no wizard de configuração do Copiloto. A barra de navegação do wizard (`fixed bottom-0` em `CopilotConfigPage`) está competindo com o `BrokerBottomNav` do app (também `fixed bottom-0` com `z-50`), causando confusão visual e dificultando o uso.

## Solução

### 1. Reposicionar o Footer de Navegação do Wizard no Mobile
- Mover a barra de navegação do wizard de `bottom-0` para `bottom-[72px]` (acima do `BrokerBottomNav`, que tem ~64-72px de altura)
- Garantir `z-index` maior que o conteúdo mas menor que modais (`z-40`)
- Manter comportamento desktop intacto (`lg:static`)

### 2. Melhorar a Visibilidade dos Botões no Mobile
- Aumentar altura mínima dos botões para `h-12` (touch target acessível)
- Adicionar sombra sutil (`shadow-lg`) na barra de navegação para destacar do fundo
- Aumentar contraste: botão "Próximo" com fundo sólido primário e texto branco em negrito
- Botão "Voltar" com borda visível e fundo escuro

### 3. Melhorar os Indicadores de Progresso
- Aumentar tamanho dos pontos do stepper no mobile
- Destacar o step atual com número em vez de apenas ponto
- Adicionar label "Passo X de Y" mais visível

### 4. Considerar Ocultar Bottom Nav Durante Edição do Wizard
- Passar `hideMobileNav={true}` no `BrokerLayout` quando `isEditing=true` no `BrokerCopilotConfig`
- Isso elimina a competição visual completamente durante o fluxo do wizard
- O usuário ainda pode sair via "Cancelar" no próprio wizard

## Arquivos a Alterar
1. `src/components/inbox/CopilotConfigPage.tsx` — Reposicionar e estilizar footer de navegação do wizard
2. `src/pages/BrokerCopilotConfig.tsx` — Passar `hideMobileNav` durante edição do copiloto

## Critérios de Sucesso
- Botões "Voltar" / "Próximo" ficam claramente visíveis acima do bottom nav no mobile
- Touch target mínimo de 48px para todos os botões
- Progresso do wizard é legível sem zoom
- Comportamento desktop permanece inalterado
