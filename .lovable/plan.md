

## Onde inserir o conteúdo de reposicionamento de bairros

O conteúdo proposto é uma **declaração de crença/posicionamento** — não uma capacidade técnica nova. O lugar natural é dentro da seção **Posicionamento** (linhas 133–151), que hoje fala sobre "Lançamentos exigem método. Não improviso." Acrescentar ali cria continuidade narrativa sem criar seção desconectada nem repetição.

### Mudança única em `src/pages/Canela.tsx` (linhas 133–151)

Expandir a seção **Posicionamento** para incluir, logo após o `Divider` e antes do fecho "A Enove nasceu com esse foco", um bloco curto com:

1. **Quote em destaque** (usando o componente `Quote light` já existente):  
   *"Grandes empreendimentos não nascem em bairros consolidados. Eles consolidam bairros."*

2. **Mini-bloco "Nosso Papel"** logo abaixo, com 2 bullets enxutos (usando `BulletList light`):
   - Criar uma nova narrativa
   - Elevar a percepção de valor

3. Manter o fecho atual *"A Enove nasceu com esse foco."* — que agora ganha duplo sentido (foco em método **e** em reposicionar regiões).

### Por que aqui e não em outro lugar

- **Não cabe em "Quem Somos"**: aquela seção é histórico/track-record (12 anos, Horizon Clube).
- **Não cabe em "O Que Entregamos"**: lá é lista de capacidades operacionais.
- **Não cabe em "Marketing"**: lá é execução tática (mídia, branding, funis).
- **Cabe em "Posicionamento"**: é exatamente uma declaração de visão de mercado, e dá lastro estratégico ao restante da página antes de entrar em método e operação. Ainda reforça a transição para Canela (cidade em consolidação).

### Resultado visual esperado

Seção "Posicionamento" passa de ~4 elementos para ~6, mantendo o ritmo dark/creme alternado. Sem nova seção, sem repetição, sem quebra de fluxo.

