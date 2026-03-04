

## Problema

A aba "Copiloto" na página `/corretor/copiloto` está comentada no código com o comentário `{/* Copiloto tab - temporarily disabled */}`. O componente `CopilotConfigPage` é importado mas nunca renderizado. O corretor não consegue criar ou configurar seu Copiloto IA.

## Correção

Reativar a aba "Copiloto" e seu conteúdo no `src/pages/BrokerCopilotConfig.tsx`:

1. **Adicionar o TabsTrigger** do Copiloto entre "Conexão" e "Segurança":
   - value: `"copilot"`
   - Ícone: `<Sparkles />` (já importado)
   - Label: "Copiloto"

2. **Adicionar o TabsContent** correspondente:
   - Renderizar `<CopilotConfigPage brokerId={brokerId!} />` (o componente já está importado)
   - Proteger com check de `brokerId` existente

Nenhuma alteração de backend necessária — o componente `CopilotConfigPage` e o hook `useCopilotConfig` já estão funcionais.

