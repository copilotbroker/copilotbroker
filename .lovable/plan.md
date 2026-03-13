
Objetivo
- Atender seu pedido de forma direta: os botões “Voltar”, “Rascunho” e “Próximo” devem aparecer logo após a galeria de fotos, sem ficarem fixos na tela e sem depender de rolar até o fim.

Diagnóstico rápido
- Hoje os botões no `LinkImportStep` dependem de `hasScrolledToBottom` (IntersectionObserver + fallback de scroll).
- Como esse gatilho está falhando no fluxo mobile, os botões somem.
- A solução mais estável é remover essa dependência e renderizar os botões diretamente no ponto desejado do layout.

Plano de implementação
1) Simplificar a lógica de exibição dos botões em `src/components/admin/LinkImportStep.tsx`
- Remover estado e refs de detecção de fim de rolagem:
  - `hasScrolledToBottom`
  - `bottomSentinelRef`
  - `successContainerRef`
  - `getScrollParent(...)`
  - `useEffect` do observer/scroll
- Remover também o sentinel no JSX (`<div ref={bottomSentinelRef} ... />`).

2) Reposicionar os botões imediatamente após a galeria
- Mover o bloco de ações (Voltar / Rascunho / Próximo) para ficar logo abaixo do bloco da galeria (`editableImages.length > 0`).
- Manter os mesmos handlers atuais:
  - `handleRetry`
  - `handleDraftSave` (quando `onSaveDraft && canContinue`)
  - `handleContinue`
- Manter os nomes exatamente como você pediu.

3) Garantir layout em linha única
- Manter container com `flex gap-2`.
- Ajustar para não quebrar linha no mobile (ex.: `flex-nowrap`).
- Manter “Próximo” com `flex-1` para ocupar o espaço restante.

4) Tratar cenário sem fotos
- Como a galeria pode não existir (`editableImages.length === 0`), criar fallback:
  - renderizar o mesmo bloco de botões logo após os cards de resumo.
- Assim os botões nunca desaparecem.

Detalhes técnicos
- Arquivo principal: `src/components/admin/LinkImportStep.tsx`.
- Não há mudanças de backend, banco ou autenticação.
- O restante do wizard (`ProjectWizard`) continua igual; apenas removemos a dependência de scroll na etapa de importação por link.

Critérios de aceite
- Em `/corretor/empreendimentos` (viewport 390x724), após extrair conteúdo:
  1) Botões aparecem sem precisar rolar até o fim.
  2) Botões ficam imediatamente após a galeria de fotos (ou após resumo se não houver fotos).
  3) “Voltar”, “Rascunho” e “Próximo” ficam na mesma linha.
  4) Sem espaço em branco excessivo ao redor dos botões.
