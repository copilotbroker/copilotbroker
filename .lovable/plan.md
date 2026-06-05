# Plano: elevar o nível artístico do gerador de Landing Pages

## Diagnóstico

O texto gerado já está bom. O problema é o **renderizador**: existe um único template `DynamicLandingPage` com sub-componentes `DynamicHero`, `DynamicAbout`, `DynamicFeatures`, etc. Independentemente do empreendimento, sempre saem:

- Hero gradiente diagonal com dois círculos radiais.
- Badge oval + título + subtítulo + descrição + botão pill, sempre na mesma ordem.
- Cards genéricos em grid 2 colunas com ícone redondo Lucide.
- Mesma paleta heurística (`accentColor` + `primaryColor`), mesma tipografia (serif vs sans), mesmas animações fade-up.

Quando construo no chat, eu escolho composições, tensões, ritmos, tipografia bem específicos para o projeto. Hoje o gerador automático não tem esse "vocabulário". Vou dar a ele.

## Solução: Style Engine com 4 design systems distintos

Crio 4 famílias visuais, cada uma com seu próprio Hero/About/Features/Urgency/Benefits/CTA. A IA escolhe a família mais adequada e devolve tokens de design ricos. O renderer monta a página combinando os blocos da família escolhida.

### Famílias (visualmente bem distintas, não variações sutis)

1. **Editorial Magazine** — alto contraste P&B, tipografia display enorme (Fraunces/Instrument Serif), grid quebrado tipo revista, números grandes (01, 02), linhas horizontais finas, fotos full-bleed alternadas zig-zag.
2. **Luxury Noir** — fundo preto profundo + dourado sutil, serif (Cormorant), espaçamento generoso, reveals lentos, traços dourados finos, layout centralizado contemplativo.
3. **Modern Glass / Tech** — gradientes complexos (mesh), glassmorphism, sans display (Space Grotesk), bento grid, partículas, animações Framer Motion, paleta saturada.
4. **Nature Organic** — tons terrosos/sage, bordas orgânicas (border-radius assimétrico), texturas SVG noise, tipografia humanista (Lora + Nunito Sans), composição assimétrica calma.

Cada família vive em `src/components/landing/styles/<familia>/` com `Hero.tsx`, `About.tsx`, `Features.tsx`, `Urgency.tsx`, `Benefits.tsx`, `CTA.tsx`, `Footer.tsx` próprios.

### Tokens enriquecidos no JSON

Estendo `LandingContent["theme"]`:

```ts
theme: {
  styleFamily: "editorial" | "luxury-noir" | "modern-glass" | "nature-organic";
  palette: { bg, surface, primary, primaryFg, muted, accent, border }; // 7 tokens HSL
  typography: { display: GoogleFontName, body: GoogleFontName, displayWeight, bodyWeight };
  motion: "subtle" | "expressive" | "cinematic";
  density: "airy" | "balanced" | "dense";
  // mantém primaryColor/accentColor para compat
}
```

`DynamicLandingPage` injeta as Google Fonts via `<link>` dinâmico e aplica CSS variables no escopo da página.

### Pipeline da IA (continua 1 chamada só, conforme pediu)

Mantenho `generate-landing` em uma chamada, mas:

- Troco modelo para **GPT-5** (melhor direção criativa visual que Gemini).
- Adiciono ao system prompt um catálogo das 4 famílias com critérios de escolha + paleta de tokens (em vez de só `primaryColor`/`accentColor` HEX livre).
- O tool schema passa a exigir os campos novos (`styleFamily`, `palette`, `typography`, `motion`, `density`).
- Prompt instrui a IA a agir como **art director**: escolher família por personalidade do projeto, calibrar paleta com contraste correto, escolher fontes específicas dentre uma lista curada (~12 Google Fonts).
- Refinamentos podem trocar família inteira se pedido ("mais editorial", "mais luxuoso").

### Roteamento no renderer

`DynamicLandingPage` lê `theme.styleFamily` e seleciona o conjunto de componentes daquela família. Fallback para o renderer atual se `styleFamily` ausente (landings antigas continuam funcionando).

## Arquivos

**Novos**
- `src/components/landing/styles/editorial/{Hero,About,Features,Urgency,Benefits,CTA,Footer}.tsx`
- `src/components/landing/styles/luxury-noir/...` (mesmos 7)
- `src/components/landing/styles/modern-glass/...`
- `src/components/landing/styles/nature-organic/...`
- `src/components/landing/styles/registry.ts` — mapa `styleFamily → componentes` e fontes a carregar
- `src/components/landing/FontLoader.tsx` — injeta Google Fonts conforme `typography`

**Editados**
- `src/types/project.ts` — extensão de `LandingContent.theme` (campos opcionais; compat retro)
- `src/components/landing/DynamicLandingPage.tsx` — escolhe família via registry; aplica CSS vars
- `supabase/functions/generate-landing/index.ts` — modelo GPT-5, novo system prompt com catálogo, tool schema atualizado

**Fora de escopo** (não pediu)
- Geração de imagens hero por IA.
- Pipeline multi-etapa.
- Mudanças no formulário, no FloatingCTA, ou no fluxo de captura.

## Riscos
- Landings antigas sem `styleFamily` precisam continuar renderizando — uso fallback explícito.
- Carregar Google Fonts dinamicamente pode causar FOUT — uso `display=swap` e preconnect.
- Quatro famílias = 28 componentes novos; é trabalho substancial mas é o que entrega o salto de qualidade pedido.

## Validação
Após implementar, gero uma landing de teste com `Vivapark NC-1` e outra com um projeto luxo (`Aura Legano`) e comparo visualmente com versões feitas manualmente.